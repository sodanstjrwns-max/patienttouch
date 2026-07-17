// ============================================
// 터치 리포트 API — 환자용 상담 보고서
// 핵심 규칙: 자동 발송 없음. 모든 보고서는 실장 승인 후에만 발송.
// ============================================
import { Hono } from 'hono';
import { safeParseJSON } from '../lib/utils';
import { authMiddleware } from '../lib/auth';
import {
  generateReportToken, scanBannedWords, setContentByPath,
  generateReportContentStep, verifyReportContentStep,
  type TouchReportContent, type ReportFlag,
} from '../lib/touch-report';
import { getAIConfig } from '../lib/ai-config';
import type { AppEnv } from '../types';

const tr = new Hono<AppEnv>();

// ============================================================
// v9.1 poll-to-advance 생성 파이프라인
// 프로덕션 waitUntil 조기종료 대응: 검수 화면 폴링(GET manage/:id)이
// 생성(1콜) → 검증(2콜)을 단계별로 전진시킨다. gen_claim으로 중복 방지.
// content_json 유무가 단계 마커: NULL=생성 전, 있음=검증 대기.
// ============================================================
const TR_CLAIM_TTL = 150; // seconds

async function advanceTouchReportGeneration(
  db: D1Database,
  env: Record<string, any>,
  apiKey: string,
  reportId: string,
  orgId: string
): Promise<boolean> {
  const report: any = await db.prepare(`
    SELECT r.id, r.status, r.content_json, r.patient_id, r.consultation_id,
           c.transcript, c.consultation_date, p.name as patient_name
    FROM touch_reports r
    JOIN consultations c ON r.consultation_id = c.id
    JOIN patients p ON r.patient_id = p.id
    WHERE r.id = ? AND r.organization_id = ?
  `).bind(reportId, orgId).first();
  if (!report || report.status !== 'generating') return false;

  // 클레임
  const claimId = 'trc_' + Math.random().toString(36).slice(2, 10);
  const claimed = await db.prepare(`
    UPDATE touch_reports SET gen_claim = ?, gen_claim_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ? AND status = 'generating'
      AND (gen_claim IS NULL OR gen_claim_at IS NULL OR gen_claim_at < datetime('now', '-${TR_CLAIM_TTL} seconds'))
  `).bind(claimId, reportId).run();
  if (!(claimed.meta?.changes || 0)) return false;

  const config = getAIConfig(env);
  try {
    if (!report.content_json) {
      // === 1단계: 근거 기반 생성 ===
      const content = await generateReportContentStep({
        transcript: String(report.transcript),
        patientName: String(report.patient_name),
        consultationDate: String(report.consultation_date || '').slice(0, 10),
        apiKey, env,
      });
      await db.prepare(`
        UPDATE touch_reports SET content_json = ?, generation_model = ?,
          gen_claim = NULL, gen_claim_at = NULL, updated_at = datetime('now')
        WHERE id = ?
      `).bind(JSON.stringify(content), config.primaryModel, reportId).run();
      return true;
    }

    // === 2단계: 숫자 이중 검증 + 금칙어 → review 전환 ===
    const content = safeParseJSON(report.content_json, null) as TouchReportContent | null;
    if (!content) throw new Error('생성된 콘텐츠 파싱 실패');
    const flags = await verifyReportContentStep(content, String(report.transcript), apiKey, env);
    const kit: any = await db.prepare('SELECT banned_words_json FROM clinic_brand_kits WHERE organization_id = ?').bind(orgId).first();
    const extraBanned = kit?.banned_words_json ? safeParseJSON(kit.banned_words_json, []) : [];
    const bannedHits = scanBannedWords(content, extraBanned);
    await db.prepare(`
      UPDATE touch_reports SET status = 'review', flags_json = ?, banned_hits_json = ?,
        verify_model = ?, gen_claim = NULL, gen_claim_at = NULL, updated_at = datetime('now')
      WHERE id = ?
    `).bind(JSON.stringify(flags), JSON.stringify(bannedHits), config.secondaryModel, reportId).run();
    console.log('[TouchReport] advance: review ready', reportId, 'flags:', flags.length, 'banned:', bannedHits.length);
    return true;
  } catch (err: any) {
    console.error('[TouchReport] advance failed:', err?.message);
    await db.prepare(`
      UPDATE touch_reports SET status = 'failed', error_message = ?,
        gen_claim = NULL, gen_claim_at = NULL, updated_at = datetime('now')
      WHERE id = ?
    `).bind(String(err?.message || '생성 실패').slice(0, 500), reportId).run();
    return true;
  }
}

// ---- 인증 필요 라우트 (실장/직원용) ----
tr.use('/manage/*', authMiddleware);

// =============================================
// POST /api/touch-report/manage/generate — 보고서 생성 시작
// =============================================
tr.post('/manage/generate', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const db = c.env.DB;
    const { consultation_id } = await c.req.json();
    if (!consultation_id) return c.json({ success: false, error: 'consultation_id가 필요합니다' }, 400);

    const consult: any = await db.prepare(`
      SELECT c.id, c.transcript, c.consultation_date, c.patient_id, p.name as patient_name, p.phone
      FROM consultations c JOIN patients p ON c.patient_id = p.id
      WHERE c.id = ? AND c.organization_id = ?
    `).bind(consultation_id, orgId).first();

    if (!consult) return c.json({ success: false, error: '상담을 찾을 수 없습니다' }, 404);
    if (!consult.transcript || String(consult.transcript).trim().length < 50) {
      return c.json({ success: false, error: '녹취록이 없거나 너무 짧습니다. 먼저 상담 분석을 완료해주세요.' }, 400);
    }

    // 동의 확인: kakao_delivery 동의 없으면 생성 차단 (제작서 §7)
    const consent: any = await db.prepare(`
      SELECT granted FROM patient_consents
      WHERE patient_id = ? AND consent_type = 'kakao_delivery'
      ORDER BY granted_at DESC LIMIT 1
    `).bind(consult.patient_id).first();
    if (!consent || !consent.granted) {
      return c.json({ success: false, error: '환자의 보고서 발송 동의가 없습니다. 환자 상세에서 동의를 먼저 기록해주세요.', code: 'CONSENT_REQUIRED' }, 403);
    }

    const apiKey = c.env.OPENAI_API_KEY;
    if (!apiKey) return c.json({ success: false, error: 'OpenAI API 키가 설정되지 않았습니다' }, 500);

    // 기존 리포트 있으면 재생성 (기존 토큰 유지 안 함 — 새 토큰)
    await db.prepare(`DELETE FROM touch_reports WHERE consultation_id = ? AND status IN ('generating','review','failed')`).bind(consultation_id).run();

    const token = generateReportToken();
    const kit: any = await db.prepare('SELECT * FROM clinic_brand_kits WHERE organization_id = ?').bind(orgId).first();
    const ttlDays = kit?.report_ttl_days || 90;

    await db.prepare(`
      INSERT INTO touch_reports (id, organization_id, consultation_id, patient_id, status, auth_required, expires_at)
      VALUES (?, ?, ?, ?, 'generating', ?, datetime('now', '+' || ? || ' days'))
    `).bind(token, orgId, consultation_id, consult.patient_id, kit?.auth_required ?? 1, ttlDays).run();

    // v9.1 poll-to-advance: 첫 단계만 waitUntil로 즉시 시도.
    // 이후 단계는 검수 화면/상담 상세 폴링(GET manage/:id, manage/list?tick)이 전진시킴.
    const env = c.env as any;
    c.executionCtx.waitUntil(
      advanceTouchReportGeneration(db, env, apiKey, token, orgId).catch(() => {})
    );

    return c.json({ success: true, data: { report_id: token, status: 'generating' } });
  } catch (error: any) {
    console.error('TouchReport generate error:', error);
    return c.json({ success: false, error: '보고서 생성 시작 실패' }, 500);
  }
});

// =============================================
// GET /api/touch-report/manage/list — 검수 대기 목록 (대시보드용)
// =============================================
tr.get('/manage/list', async (c) => {
  const orgId = c.get('organizationId');
  const db = c.env.DB;
  const status = c.req.query('status');

  // v9.1 poll-to-advance: 상담 상세가 5초 간격으로 이 목록을 폴링하므로,
  // generating 상태 리포트가 있으면 가장 오래된 1건을 여기서 전진시킨다.
  if (c.env.OPENAI_API_KEY) {
    try {
      const generating: any = await db.prepare(
        "SELECT id FROM touch_reports WHERE organization_id = ? AND status = 'generating' ORDER BY created_at ASC LIMIT 1"
      ).bind(orgId).first();
      if (generating) {
        await advanceTouchReportGeneration(db, c.env as any, c.env.OPENAI_API_KEY, generating.id, orgId);
      }
    } catch (e) { console.warn('[TouchReport] list advance error:', e); }
  }

  let sql = `
    SELECT r.id, r.consultation_id, r.patient_id, r.status, r.open_count,
      r.sent_at, r.first_opened_at, r.last_opened_at, r.created_at, r.error_message,
      r.flags_json, r.banned_hits_json,
      p.name as patient_name, c.consultation_date
    FROM touch_reports r
    JOIN patients p ON r.patient_id = p.id
    JOIN consultations c ON r.consultation_id = c.id
    WHERE r.organization_id = ?`;
  const params: any[] = [orgId];
  if (status) { sql += ' AND r.status = ?'; params.push(status); }
  sql += ' ORDER BY r.created_at DESC LIMIT 100';
  const rows = await db.prepare(sql).bind(...params).all();
  const data = (rows.results || []).map((r: any) => ({
    ...r,
    flag_count: (safeParseJSON(r.flags_json, []) as any[]).length,
    banned_count: (safeParseJSON(r.banned_hits_json, []) as any[]).length,
    flags_json: undefined, banned_hits_json: undefined,
  }));
  return c.json({ success: true, data });
});

// =============================================
// GET /api/touch-report/manage/:id — 검수 상세
// =============================================
tr.get('/manage/:id', async (c) => {
  const orgId = c.get('organizationId');
  const db = c.env.DB;
  const reportId = c.req.param('id');

  // v9.1 poll-to-advance: generating이면 이 폴링 요청이 생성 단계를 전진시킴
  const statusRow: any = await db.prepare('SELECT status FROM touch_reports WHERE id = ? AND organization_id = ?').bind(reportId, orgId).first();
  if (statusRow?.status === 'generating' && c.env.OPENAI_API_KEY) {
    try {
      await advanceTouchReportGeneration(db, c.env as any, c.env.OPENAI_API_KEY, reportId, orgId);
    } catch (e) { console.warn('[TouchReport] advance error:', e); }
  }

  const report: any = await db.prepare(`
    SELECT r.*, p.name as patient_name, p.phone as patient_phone, c.consultation_date, c.transcript
    FROM touch_reports r
    JOIN patients p ON r.patient_id = p.id
    JOIN consultations c ON r.consultation_id = c.id
    WHERE r.id = ? AND r.organization_id = ?
  `).bind(reportId, orgId).first();
  if (!report) return c.json({ success: false, error: '보고서를 찾을 수 없습니다' }, 404);
  return c.json({
    success: true,
    data: {
      ...report,
      content: safeParseJSON(report.content_json, null),
      flags: safeParseJSON(report.flags_json, []),
      banned_hits: safeParseJSON(report.banned_hits_json, []),
      content_json: undefined, flags_json: undefined, banned_hits_json: undefined,
    },
  });
});

// =============================================
// PATCH /api/touch-report/manage/:id/content — 인라인 수정 (이력 보존)
// =============================================
tr.patch('/manage/:id/content', async (c) => {
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const db = c.env.DB;
  const reportId = c.req.param('id');
  const { path, value, resolve_flag } = await c.req.json();
  if (!path) return c.json({ success: false, error: 'path가 필요합니다' }, 400);

  const report: any = await db.prepare('SELECT * FROM touch_reports WHERE id = ? AND organization_id = ?').bind(reportId, orgId).first();
  if (!report) return c.json({ success: false, error: '보고서를 찾을 수 없습니다' }, 404);
  if (!['review', 'approved'].includes(report.status)) return c.json({ success: false, error: '검수 상태에서만 수정할 수 있습니다' }, 400);

  const content = safeParseJSON(report.content_json, null);
  if (!content) return c.json({ success: false, error: '콘텐츠가 없습니다' }, 400);

  let before: any;
  try {
    ({ before } = setContentByPath(content, path, value));
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 400);
  }

  // flag 해소 처리
  let flags: ReportFlag[] = safeParseJSON(report.flags_json, []);
  if (resolve_flag) flags = flags.filter((f) => f.path !== path);

  // 금칙어 재스캔 (수정으로 새 금칙어 유입 방지)
  const kit: any = await db.prepare('SELECT banned_words_json FROM clinic_brand_kits WHERE organization_id = ?').bind(orgId).first();
  const bannedHits = scanBannedWords(content as TouchReportContent, kit?.banned_words_json ? safeParseJSON(kit.banned_words_json, []) : []);

  await db.prepare(`
    UPDATE touch_reports SET content_json = ?, flags_json = ?, banned_hits_json = ?, status = 'review', updated_at = datetime('now') WHERE id = ?
  `).bind(JSON.stringify(content), JSON.stringify(flags), JSON.stringify(bannedHits), reportId).run();

  // 수정 이력 로그 (제작서 §3.3)
  await db.prepare(`INSERT INTO touch_report_revisions (report_id, editor_id, diff_json) VALUES (?, ?, ?)`)
    .bind(reportId, userId, JSON.stringify({ path, before, after: value })).run();

  return c.json({ success: true, data: { remaining_flags: flags.length, banned_hits: bannedHits.length } });
});

// =============================================
// POST /api/touch-report/manage/:id/resolve-flag — 배지 확인 처리 (수정 없이 확인만)
// =============================================
tr.post('/manage/:id/resolve-flag', async (c) => {
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const db = c.env.DB;
  const reportId = c.req.param('id');
  const { path } = await c.req.json();

  const report: any = await db.prepare('SELECT flags_json, status FROM touch_reports WHERE id = ? AND organization_id = ?').bind(reportId, orgId).first();
  if (!report) return c.json({ success: false, error: '보고서를 찾을 수 없습니다' }, 404);

  let flags: ReportFlag[] = safeParseJSON(report.flags_json, []);
  const target = flags.find((f) => f.path === path);
  flags = flags.filter((f) => f.path !== path);

  await db.prepare(`UPDATE touch_reports SET flags_json = ?, updated_at = datetime('now') WHERE id = ?`)
    .bind(JSON.stringify(flags), reportId).run();
  await db.prepare(`INSERT INTO touch_report_revisions (report_id, editor_id, diff_json) VALUES (?, ?, ?)`)
    .bind(reportId, userId, JSON.stringify({ action: 'resolve_flag', path, flag: target })).run();

  return c.json({ success: true, data: { remaining_flags: flags.length } });
});

// =============================================
// POST /api/touch-report/manage/:id/approve — 발송 승인 (배지 남아있으면 차단)
// =============================================
tr.post('/manage/:id/approve', async (c) => {
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const db = c.env.DB;
  const reportId = c.req.param('id');

  const report: any = await db.prepare('SELECT * FROM touch_reports WHERE id = ? AND organization_id = ?').bind(reportId, orgId).first();
  if (!report) return c.json({ success: false, error: '보고서를 찾을 수 없습니다' }, 404);
  if (report.status !== 'review') return c.json({ success: false, error: '검수 대기 상태가 아닙니다' }, 400);

  const flags = safeParseJSON(report.flags_json, []) as any[];
  if (flags.length > 0) {
    return c.json({ success: false, error: `확인 필요 항목 ${flags.length}건이 남아 있습니다. 모두 확인 후 승인할 수 있습니다.`, code: 'FLAGS_REMAINING' }, 400);
  }

  // 발송 직전 금칙어 2차 검사 (제작서 §3.4)
  const content = safeParseJSON(report.content_json, null);
  const kit: any = await db.prepare('SELECT banned_words_json FROM clinic_brand_kits WHERE organization_id = ?').bind(orgId).first();
  const bannedHits = scanBannedWords(content, kit?.banned_words_json ? safeParseJSON(kit.banned_words_json, []) : []);
  if (bannedHits.length > 0) {
    await db.prepare(`UPDATE touch_reports SET banned_hits_json = ? WHERE id = ?`).bind(JSON.stringify(bannedHits), reportId).run();
    return c.json({ success: false, error: `금칙어 ${bannedHits.length}건이 검출되었습니다. 수정 후 승인해주세요.`, code: 'BANNED_WORDS', data: bannedHits }, 400);
  }

  await db.prepare(`UPDATE touch_reports SET status = 'approved', approved_by = ?, approved_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`)
    .bind(userId, reportId).run();

  return c.json({ success: true, data: { status: 'approved' } });
});

// =============================================
// POST /api/touch-report/manage/:id/send — 발송 (승인 후에만)
// 알림톡 미설정 시: 링크 복사 모드 (수동 전달)
// =============================================
tr.post('/manage/:id/send', async (c) => {
  const orgId = c.get('organizationId');
  const db = c.env.DB;
  const reportId = c.req.param('id');
  const { auth_hint } = await c.req.json().catch(() => ({}));

  const report: any = await db.prepare(`
    SELECT r.*, p.name as patient_name, p.phone as patient_phone
    FROM touch_reports r JOIN patients p ON r.patient_id = p.id
    WHERE r.id = ? AND r.organization_id = ?
  `).bind(reportId, orgId).first();
  if (!report) return c.json({ success: false, error: '보고서를 찾을 수 없습니다' }, 404);
  if (report.status !== 'approved') return c.json({ success: false, error: '승인된 보고서만 발송할 수 있습니다' }, 400);

  // 열람 인증값 설정 (생년월일 뒤 4자리 등)
  if (report.auth_required && auth_hint) {
    await db.prepare('UPDATE touch_reports SET auth_hint = ? WHERE id = ?').bind(String(auth_hint).slice(0, 10), reportId).run();
  }

  const reportUrl = `${new URL(c.req.url).origin}/r/${reportId}`;

  // 알림톡 설정 확인
  const org: any = await db.prepare('SELECT name, kakao_api_key, kakao_sender_key FROM organizations WHERE id = ?').bind(orgId).first();
  let deliveryMode = 'manual_link';
  let deliveryDetail = '알림톡 미설정 — 링크를 복사해 환자에게 직접 전달해주세요';

  if (org?.kakao_api_key && org?.kakao_sender_key) {
    // 알림톡 발송 (딜러사 API — 솔라피 규격 어댑터)
    try {
      const res = await fetch('https://api.solapi.com/messages/v4/send', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${org.kakao_api_key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            to: String(report.patient_phone || '').replace(/[^0-9]/g, ''),
            from: org.kakao_sender_key,
            kakaoOptions: {
              pfId: org.kakao_sender_key,
              templateId: 'touch_report_v1',
              variables: { '#{patient_name}': report.patient_name, '#{clinic_name}': org.name, '#{report_url}': reportUrl },
            },
          },
        }),
      });
      if (res.ok) {
        deliveryMode = 'alimtalk';
        deliveryDetail = '알림톡 발송 완료';
      } else {
        deliveryMode = 'manual_link';
        deliveryDetail = `알림톡 발송 실패 (${res.status}) — 링크를 직접 전달해주세요`;
      }
    } catch (err: any) {
      deliveryDetail = `알림톡 오류 — 링크를 직접 전달해주세요`;
    }
  }

  await db.prepare(`UPDATE touch_reports SET status = 'sent', sent_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`).bind(reportId).run();
  await db.prepare(`INSERT INTO touch_report_events (report_id, organization_id, event_type, meta_json) VALUES (?, ?, 'sent', ?)`)
    .bind(reportId, orgId, JSON.stringify({ mode: deliveryMode })).run();

  return c.json({ success: true, data: { report_url: reportUrl, delivery_mode: deliveryMode, detail: deliveryDetail } });
});

// =============================================
// 브랜드 키트 CRUD
// =============================================
tr.get('/manage/brand-kit/current', async (c) => {
  const orgId = c.get('organizationId');
  const kit: any = await c.env.DB.prepare('SELECT * FROM clinic_brand_kits WHERE organization_id = ?').bind(orgId).first();
  return c.json({ success: true, data: kit ? { ...kit, staff_profiles: safeParseJSON(kit.staff_profiles_json, []), banned_words: safeParseJSON(kit.banned_words_json, []) } : null });
});

tr.put('/manage/brand-kit/current', async (c) => {
  const orgId = c.get('organizationId');
  const b = await c.req.json();
  await c.env.DB.prepare(`
    INSERT INTO clinic_brand_kits (organization_id, clinic_display_name, logo_url, primary_color, secondary_color, staff_profiles_json, clinic_address, clinic_phone, clinic_hours, booking_url, banned_words_json, auth_required, report_ttl_days, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(organization_id) DO UPDATE SET
      clinic_display_name = excluded.clinic_display_name, logo_url = excluded.logo_url,
      primary_color = excluded.primary_color, secondary_color = excluded.secondary_color,
      staff_profiles_json = excluded.staff_profiles_json, clinic_address = excluded.clinic_address,
      clinic_phone = excluded.clinic_phone, clinic_hours = excluded.clinic_hours,
      booking_url = excluded.booking_url, banned_words_json = excluded.banned_words_json,
      auth_required = excluded.auth_required, report_ttl_days = excluded.report_ttl_days,
      updated_at = datetime('now')
  `).bind(
    orgId, b.clinic_display_name || null, b.logo_url || null,
    b.primary_color || '#7c4dff', b.secondary_color || '#22d3ee',
    JSON.stringify(b.staff_profiles || []), b.clinic_address || null,
    b.clinic_phone || null, b.clinic_hours || null, b.booking_url || null,
    JSON.stringify(b.banned_words || []), b.auth_required ?? 1, b.report_ttl_days || 90
  ).run();
  return c.json({ success: true });
});

// =============================================
// 동의 기록 (제작서 §7)
// =============================================
tr.post('/manage/consent', async (c) => {
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const { patient_id, consents } = await c.req.json();
  if (!patient_id || !Array.isArray(consents)) return c.json({ success: false, error: 'patient_id와 consents 배열이 필요합니다' }, 400);
  const db = c.env.DB;
  for (const ct of consents) {
    await db.prepare(`INSERT INTO patient_consents (organization_id, patient_id, consent_type, granted, granted_by) VALUES (?, ?, ?, ?, ?)`)
      .bind(orgId, patient_id, String(ct.type), ct.granted ? 1 : 0, userId).run();
  }
  return c.json({ success: true });
});

tr.get('/manage/consent/:patientId', async (c) => {
  const orgId = c.get('organizationId');
  const rows = await c.env.DB.prepare(`
    SELECT consent_type, granted, granted_at FROM patient_consents
    WHERE organization_id = ? AND patient_id = ?
    ORDER BY granted_at DESC
  `).bind(orgId, c.req.param('patientId')).all();
  // 타입별 최신값만
  const latest: Record<string, any> = {};
  for (const r of (rows.results || []) as any[]) {
    if (!(r.consent_type in latest)) latest[r.consent_type] = { granted: !!r.granted, at: r.granted_at };
  }
  return c.json({ success: true, data: latest });
});

// =============================================
// 공개 라우트 (환자용 — 인증은 auth_hint 방식)
// =============================================

// GET /api/touch-report/public/:token — 보고서 데이터 (간단 인증)
tr.post('/public/:token', async (c) => {
  const db = c.env.DB;
  const token = c.req.param('token');
  const { auth_value } = await c.req.json().catch(() => ({ auth_value: null }));

  const report: any = await db.prepare(`
    SELECT r.*, o.name as org_name
    FROM touch_reports r JOIN organizations o ON r.organization_id = o.id
    WHERE r.id = ? AND r.status = 'sent'
  `).bind(token).first();

  if (!report) return c.json({ success: false, error: '보고서를 찾을 수 없습니다' }, 404);
  if (report.expires_at && new Date(report.expires_at) < new Date()) {
    return c.json({ success: false, error: '보고서 열람 기간이 만료되었습니다. 병원에 문의해주세요.' }, 410);
  }

  // 간단 인증 (제작서 §6.3)
  if (report.auth_required && report.auth_hint) {
    if (!auth_value || String(auth_value) !== String(report.auth_hint)) {
      await db.prepare(`INSERT INTO touch_report_events (report_id, organization_id, event_type) VALUES (?, ?, 'auth_failed')`)
        .bind(token, report.organization_id).run();
      return c.json({ success: false, error: '인증 정보가 일치하지 않습니다', code: 'AUTH_REQUIRED' }, 401);
    }
  }

  // 열람 기록 (제작서 §6.4: 미열람 48h 팔로업, 3회+ 고관심)
  await db.prepare(`
    UPDATE touch_reports SET
      open_count = open_count + 1,
      first_opened_at = COALESCE(first_opened_at, datetime('now')),
      last_opened_at = datetime('now')
    WHERE id = ?
  `).bind(token).run();
  await db.prepare(`INSERT INTO touch_report_events (report_id, organization_id, event_type) VALUES (?, ?, 'opened')`)
    .bind(token, report.organization_id).run();

  const kit: any = await db.prepare('SELECT * FROM clinic_brand_kits WHERE organization_id = ?').bind(report.organization_id).first();

  return c.json({
    success: true,
    data: {
      content: safeParseJSON(report.content_json, null),
      brand: kit ? {
        clinic_name: kit.clinic_display_name || report.org_name,
        logo_url: kit.logo_url,
        primary_color: kit.primary_color || '#7c4dff',
        secondary_color: kit.secondary_color || '#22d3ee',
        staff_profiles: safeParseJSON(kit.staff_profiles_json, []),
        clinic_address: kit.clinic_address,
        clinic_phone: kit.clinic_phone,
        clinic_hours: kit.clinic_hours,
        booking_url: kit.booking_url,
      } : { clinic_name: report.org_name, primary_color: '#7c4dff', secondary_color: '#22d3ee' },
      report_no: token.slice(0, 8).toUpperCase(),
      sent_at: report.sent_at,
      auth_required: !!report.auth_required,
    },
  });
});

// GET /api/touch-report/public/:token/meta — 인증 필요 여부만 (본문 없이)
tr.get('/public/:token/meta', async (c) => {
  const report: any = await c.env.DB.prepare(`
    SELECT r.auth_required, r.auth_hint, r.expires_at, r.status, o.name as org_name,
      (SELECT clinic_display_name FROM clinic_brand_kits k WHERE k.organization_id = r.organization_id) as clinic_name,
      (SELECT primary_color FROM clinic_brand_kits k WHERE k.organization_id = r.organization_id) as primary_color
    FROM touch_reports r JOIN organizations o ON r.organization_id = o.id
    WHERE r.id = ?
  `).bind(c.req.param('token')).first();
  if (!report || report.status !== 'sent') return c.json({ success: false, error: '보고서를 찾을 수 없습니다' }, 404);
  if (report.expires_at && new Date(report.expires_at) < new Date()) {
    return c.json({ success: false, error: '열람 기간이 만료되었습니다' }, 410);
  }
  return c.json({
    success: true,
    data: {
      needs_auth: !!(report.auth_required && report.auth_hint),
      clinic_name: report.clinic_name || report.org_name,
      primary_color: report.primary_color || '#7c4dff',
    },
  });
});

// POST /api/touch-report/public/:token/event — 환자 행동 이벤트 (pdf_saved / shared / booking_clicked)
tr.post('/public/:token/event', async (c) => {
  const db = c.env.DB;
  const token = c.req.param('token');
  const { event_type } = await c.req.json().catch(() => ({}));
  const allowed = ['pdf_saved', 'shared', 'booking_clicked'];
  if (!allowed.includes(event_type)) return c.json({ success: false, error: '잘못된 이벤트' }, 400);
  const report: any = await db.prepare('SELECT organization_id FROM touch_reports WHERE id = ?').bind(token).first();
  if (!report) return c.json({ success: false }, 404);
  await db.prepare(`INSERT INTO touch_report_events (report_id, organization_id, event_type) VALUES (?, ?, ?)`)
    .bind(token, report.organization_id, event_type).run();
  return c.json({ success: true });
});

export default tr;
