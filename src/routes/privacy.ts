// v8.6: 개인정보/의료정보 컴플라이언스 라우트
// - 감사 로그 기록/조회
// - 보존기간 정책 (조직 설정)
// - 보존기간 경과 데이터 파기 (수동 + 크론)
// - 환자 데이터 완전삭제 (익명화 방식 — 통계 무결성 유지)
import { Hono } from 'hono';
import { generateId, safeParseJSON } from '../lib/utils';
import { authMiddleware, adminOnly } from '../lib/auth';
import type { AppEnv } from '../types';

const privacy = new Hono<AppEnv>();

// ============================================
// 감사 로그 헬퍼 (다른 라우트에서도 import해 사용)
// ============================================
export async function writeAuditLog(
  db: D1Database,
  orgId: string,
  userId: string | null,
  userName: string | null,
  action: string,
  targetType: string,
  targetId: string,
  details: Record<string, any> = {}
): Promise<void> {
  try {
    await db.prepare(`
      INSERT INTO audit_logs (id, organization_id, user_id, user_name, action, target_type, target_id, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      'audit_' + generateId().slice(0, 10),
      orgId, userId, userName, action, targetType, targetId,
      JSON.stringify(details)
    ).run();
  } catch (e) {
    console.warn('[Privacy] audit log write failed:', e);
  }
}

// 크론용 파기 엔드포인트 (인증 미들웨어 전에 등록 — CRON_SECRET 보호)
// POST /api/privacy/purge-expired  (X-Cron-Secret)
privacy.post('/purge-expired', async (c) => {
  const secret = c.req.header('X-Cron-Secret');
  if (!secret || secret !== (c.env as any).CRON_SECRET) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  const db = c.env.DB;
  try {
    // 보존기간 설정된 모든 조직 순회
    const orgs = await db.prepare(`SELECT id, settings FROM organizations`).all();
    let totalPurged = 0;
    for (const org of orgs.results as any[]) {
      const settings = safeParseJSON(org.settings as string, {} as any);
      const months = Number(settings.transcript_retention_months) || 0;
      if (months <= 0) continue; // 0 = 무기한 보존 (파기 안 함)
      const purged = await purgeExpiredTranscripts(db, c.env as any, org.id, months, null, null);
      totalPurged += purged;
    }
    return c.json({ success: true, data: { purged: totalPurged } });
  } catch (e: any) {
    console.error('[Privacy] cron purge failed:', e);
    return c.json({ success: false, error: e?.message || 'purge failed' }, 500);
  }
});

// 인증 미들웨어 (이하 모든 라우트)
privacy.use('*', authMiddleware);

// ============================================
// 파기 공통 로직: 보존기간 경과 상담의 transcript/오디오/STT청크 삭제
// (요약·리포트·금액 등 통계용 파생 데이터는 유지 → 경영지표 무결성)
// ============================================
async function purgeExpiredTranscripts(
  db: D1Database,
  env: Record<string, any>,
  orgId: string,
  retentionMonths: number,
  actorId: string | null,
  actorName: string | null
): Promise<number> {
  const cutoff = `datetime('now', '-${Math.floor(retentionMonths)} months')`;

  // 파기 대상 조회
  const targets = await db.prepare(`
    SELECT id, audio_url FROM consultations
    WHERE organization_id = ? AND consultation_date < ${cutoff}
      AND (transcript IS NOT NULL AND transcript != '' OR audio_url IS NOT NULL)
  `).bind(orgId).all();

  if (!targets.results.length) return 0;

  const ids = (targets.results as any[]).map(r => r.id);

  // R2 오디오 삭제 (단일 파일 + 세그먼트)
  for (const row of targets.results as any[]) {
    try {
      if (row.audio_url && env.R2) await env.R2.delete(row.audio_url);
      const chunks = await db.prepare(
        `SELECT audio_url FROM stt_chunks WHERE consultation_id = ? AND audio_url IS NOT NULL`
      ).bind(row.id).all();
      for (const ch of chunks.results as any[]) {
        try { if (env.R2) await env.R2.delete(ch.audio_url); } catch {}
      }
    } catch (e) { console.warn('[Privacy] R2 delete failed for', row.id, e); }
  }

  // DB 파기 — 배치 (transcript/화자분리/오디오 링크 제거, 요약·금액·점수는 유지)
  const placeholders = ids.map(() => '?').join(',');
  await db.prepare(`
    UPDATE consultations SET
      transcript = NULL, transcript_diarized = NULL, audio_url = NULL,
      recording_status = 'purged', updated_at = datetime('now')
    WHERE id IN (${placeholders})
  `).bind(...ids).run();
  await db.prepare(`
    UPDATE stt_chunks SET transcript = NULL, audio_url = NULL
    WHERE consultation_id IN (${placeholders})
  `).bind(...ids).run();

  await writeAuditLog(db, orgId, actorId, actorName, 'retention_purge', 'organization', orgId, {
    purged_consultations: ids.length,
    retention_months: retentionMonths,
  });

  console.log('[Privacy] Purged', ids.length, 'consultations for org', orgId);
  return ids.length;
}

// ============================================
// GET /api/privacy/policy - 조직 보존기간 정책 조회
// ============================================
privacy.get('/policy', async (c) => {
  const orgId = c.get('organizationId');
  const db = c.env.DB;
  const org = await db.prepare('SELECT settings FROM organizations WHERE id = ?').bind(orgId).first();
  const settings = safeParseJSON(org?.settings as string, {} as any);

  // 파기 대상 미리보기 카운트
  const months = Number(settings.transcript_retention_months) || 0;
  let pendingPurge = 0;
  if (months > 0) {
    const row = await db.prepare(`
      SELECT COUNT(*) as cnt FROM consultations
      WHERE organization_id = ? AND consultation_date < datetime('now', '-${Math.floor(months)} months')
        AND (transcript IS NOT NULL AND transcript != '' OR audio_url IS NOT NULL)
    `).bind(orgId).first();
    pendingPurge = (row?.cnt as number) || 0;
  }

  return c.json({
    success: true,
    data: {
      transcript_retention_months: months, // 0 = 무기한
      consent_notice_text: settings.consent_notice_text ||
        '상담 품질 향상을 위해 상담 내용이 녹음됩니다. 녹음에 동의하십니까?',
      pending_purge_count: pendingPurge,
    }
  });
});

// PUT /api/privacy/policy - 보존기간 정책 변경 (admin 전용)
privacy.put('/policy', adminOnly, async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;
    const body = await c.req.json();

    const months = Number(body.transcript_retention_months);
    if (isNaN(months) || months < 0 || months > 120) {
      return c.json({ success: false, error: '보존기간은 0(무기한)~120개월 사이여야 합니다.' }, 400);
    }

    const org = await db.prepare('SELECT settings FROM organizations WHERE id = ?').bind(orgId).first();
    const settings = safeParseJSON(org?.settings as string, {} as any);
    settings.transcript_retention_months = months;
    if (typeof body.consent_notice_text === 'string' && body.consent_notice_text.trim()) {
      settings.consent_notice_text = body.consent_notice_text.trim().slice(0, 500);
    }

    await db.prepare('UPDATE organizations SET settings = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .bind(JSON.stringify(settings), orgId).run();

    const user = await db.prepare('SELECT name FROM users WHERE id = ?').bind(userId).first();
    await writeAuditLog(db, orgId, userId, (user?.name as string) || null, 'policy_updated', 'organization', orgId, {
      transcript_retention_months: months,
    });

    return c.json({ success: true, data: { transcript_retention_months: months } });
  } catch (e) {
    console.error('[Privacy] policy update error:', e);
    return c.json({ success: false, error: '정책 변경에 실패했습니다.' }, 500);
  }
});

// POST /api/privacy/purge - 보존기간 경과 데이터 즉시 파기 (admin 전용)
privacy.post('/purge', adminOnly, async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;

    const org = await db.prepare('SELECT settings FROM organizations WHERE id = ?').bind(orgId).first();
    const settings = safeParseJSON(org?.settings as string, {} as any);
    const months = Number(settings.transcript_retention_months) || 0;
    if (months <= 0) {
      return c.json({ success: false, error: '보존기간이 설정되어 있지 않습니다. 먼저 정책을 설정해주세요.' }, 400);
    }

    const user = await db.prepare('SELECT name FROM users WHERE id = ?').bind(userId).first();
    const purged = await purgeExpiredTranscripts(db, c.env as any, orgId, months, userId, (user?.name as string) || null);

    return c.json({ success: true, data: { purged } });
  } catch (e) {
    console.error('[Privacy] purge error:', e);
    return c.json({ success: false, error: '파기 실행에 실패했습니다.' }, 500);
  }
});

// ============================================
// POST /api/privacy/patients/:id/erase - 환자 데이터 완전삭제 (익명화)
// admin 전용. 개인식별정보 제거 + 원문/오디오 파기, 통계 파생값은 유지
// ============================================
privacy.post('/patients/:id/erase', adminOnly, async (c) => {
  try {
    const patientId = c.req.param('id');
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;
    const env = c.env as any;
    const { confirm_name } = await c.req.json();

    const patient = await db.prepare(
      'SELECT id, name, anonymized FROM patients WHERE id = ? AND organization_id = ?'
    ).bind(patientId, orgId).first();
    if (!patient) return c.json({ success: false, error: '환자를 찾을 수 없습니다.' }, 404);
    if (patient.anonymized) return c.json({ success: false, error: '이미 익명화된 환자입니다.' }, 400);

    // 오입력 방지: 환자 이름 확인 입력 필수
    if (!confirm_name || confirm_name !== patient.name) {
      return c.json({ success: false, error: '확인을 위해 환자 이름을 정확히 입력해주세요.' }, 400);
    }

    // 1) 상담 원문 + 오디오 파기
    const consults = await db.prepare(
      'SELECT id, audio_url FROM consultations WHERE patient_id = ? AND organization_id = ?'
    ).bind(patientId, orgId).all();
    for (const row of consults.results as any[]) {
      try {
        if (row.audio_url && env.R2) await env.R2.delete(row.audio_url);
        const chunks = await db.prepare(
          'SELECT audio_url FROM stt_chunks WHERE consultation_id = ? AND audio_url IS NOT NULL'
        ).bind(row.id).all();
        for (const ch of chunks.results as any[]) {
          try { if (env.R2) await env.R2.delete(ch.audio_url); } catch {}
        }
      } catch (e) { console.warn('[Privacy] erase R2 delete failed:', e); }
    }
    const cIds = (consults.results as any[]).map(r => r.id);
    if (cIds.length) {
      const ph = cIds.map(() => '?').join(',');
      await db.prepare(`
        UPDATE consultations SET
          transcript = NULL, transcript_diarized = NULL, audio_url = NULL,
          key_quotes = '[]', patient_psychology = '{}',
          recording_status = 'purged', updated_at = datetime('now')
        WHERE id IN (${ph})
      `).bind(...cIds).run();
      await db.prepare(`UPDATE stt_chunks SET transcript = NULL, audio_url = NULL WHERE consultation_id IN (${ph})`)
        .bind(...cIds).run();
    }

    // 2) 환자 개인식별정보 익명화
    const anonLabel = '삭제된 환자';
    await db.prepare(`
      UPDATE patients SET
        name = ?, phone = NULL, memo = NULL, tags = '[]',
        region = NULL, referral_source = NULL,
        anonymized = 1, anonymized_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ? AND organization_id = ?
    `).bind(anonLabel, patientId, orgId).run();

    // 3) 메모 이력 삭제 (개인정보 포함 가능)
    await db.prepare('DELETE FROM patient_memo_history WHERE patient_id = ?').bind(patientId).run().catch(() => {});

    // 4) 감사 로그 (원 이름은 details에 남기지 않음 — 해시 성격의 참조만)
    const user = await db.prepare('SELECT name FROM users WHERE id = ?').bind(userId).first();
    await writeAuditLog(db, orgId, userId, (user?.name as string) || null, 'patient_erase', 'patient', patientId, {
      consultations_purged: cIds.length,
    });

    return c.json({ success: true, data: { patient_id: patientId, consultations_purged: cIds.length } });
  } catch (e) {
    console.error('[Privacy] patient erase error:', e);
    return c.json({ success: false, error: '환자 데이터 삭제에 실패했습니다.' }, 500);
  }
});

// ============================================
// GET /api/privacy/audit-logs - 감사 로그 조회 (admin 전용)
// ============================================
privacy.get('/audit-logs', adminOnly, async (c) => {
  try {
    const orgId = c.get('organizationId');
    const db = c.env.DB;
    const { action, limit = '50', offset = '0' } = c.req.query();

    let query = `SELECT * FROM audit_logs WHERE organization_id = ?`;
    const params: (string | number)[] = [orgId];
    if (action) { query += ' AND action = ?'; params.push(action); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Math.min(parseInt(limit) || 50, 200), parseInt(offset) || 0);

    const result = await db.prepare(query).bind(...params).all();
    return c.json({
      success: true,
      data: (result.results as any[]).map(r => ({ ...r, details: safeParseJSON(r.details, {}) }))
    });
  } catch (e) {
    console.error('[Privacy] audit logs error:', e);
    return c.json({ success: false, error: '감사 로그 조회에 실패했습니다.' }, 500);
  }
});

export default privacy;
