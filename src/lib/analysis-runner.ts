// v8.0: Shared Analysis Runner
// 업로드/세그먼트/재분석 3개 경로가 공유하는 분석 실행 + 결과 저장 로직
// 비동기(waitUntil) 실행을 전제로 설계 — analysis_step으로 진행률 추적

import { generateId, safeParseJSON } from './utils';
import { getAIConfig } from './ai-config';
import { runAnalysisFromTranscript, transcribeWithTimestamps } from './ai-presenter';
import type { PreviousFeedbackContext, FullAnalysisResult } from './ai-presenter';

// Safely convert any value to string for D1 TEXT columns
const toStr = (v: any): string => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.join('\n');
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};
const toJsonStr = (v: any): string => {
  if (typeof v === 'string') return v;
  return JSON.stringify(v ?? null);
};

// D1 스칼라 컬럼용 안전 변환 — AI가 배열/객체로 반환해도 TEXT로 강제
// (예: treatment_type이 ['신경치료','크라운']으로 오면 '신경치료, 크라운')
const toScalarStr = (v: any): string | null => {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return v.map((x) => toScalarStr(x) ?? '').filter(Boolean).join(', ') || null;
  return JSON.stringify(v);
};

// D1 숫자 컬럼용 안전 변환 — "180만원", "1,800,000" 같은 문자열도 숫자로
const toNum = (v: any): number | null => {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : null;
};

// 상담사의 최근 피드백 이력 로드 (성장 비교용 — 채점에는 미사용, 블라인드 채점 정책)
export async function loadPreviousFeedback(db: D1Database, userId: string, orgId: string): Promise<PreviousFeedbackContext | null> {
  try {
    const prevReports = await db.prepare(`
      SELECT r.coaching_feedback, r.coaching_score, c.consultation_date, c.treatment_type
      FROM consultation_reports r
      JOIN consultations c ON r.consultation_id = c.id
      WHERE c.user_id = ? AND c.organization_id = ? AND r.coaching_score > 0
      ORDER BY c.consultation_date DESC
      LIMIT 5
    `).bind(userId, orgId).all();

    if (prevReports.results.length === 0) return null;

    const sessions = prevReports.results.map((r: any) => {
      const fb = safeParseJSON(r.coaching_feedback as string, {} as any);
      return {
        date: (r.consultation_date as string)?.split('T')[0] || '',
        total_score: (r.coaching_score as number) || 0,
        scores: fb.scores || { rapport: 0, spin: 0, objection_handling: 0, pricing_framing: 0, closing: 0, structure: 0 },
        top_improvement: fb.improvements?.[0]?.issue || '없음',
        treatment_type: (r.treatment_type as string) || undefined,
      };
    });

    const avgScores = { rapport: 0, spin: 0, objection_handling: 0, pricing_framing: 0, closing: 0, structure: 0 };
    let totalSum = 0;
    sessions.forEach((s: any) => {
      totalSum += s.total_score;
      (Object.keys(avgScores) as Array<keyof typeof avgScores>).forEach(k => {
        avgScores[k] += (s.scores[k] || 0);
      });
    });
    const count = sessions.length;
    (Object.keys(avgScores) as Array<keyof typeof avgScores>).forEach(k => { avgScores[k] = avgScores[k] / count; });

    const issueCounts: Record<string, number> = {};
    sessions.forEach((s: any) => {
      if (s.top_improvement && s.top_improvement !== '없음') {
        const key = s.top_improvement.slice(0, 30);
        issueCounts[key] = (issueCounts[key] || 0) + 1;
      }
    });
    const recurringIssues = Object.entries(issueCounts).filter(([, n]) => n >= 2).map(([issue]) => issue);

    return {
      sessions,
      avg_scores: avgScores,
      avg_total: totalSum / count,
      recurring_issues: recurringIssues.length > 0 ? recurringIssues : sessions.slice(0, 2).map((s: any) => s.top_improvement).filter(Boolean),
    };
  } catch (e) {
    console.warn('[AnalysisRunner] Failed to load previous feedback:', e);
    return null;
  }
}

// 분석 결과를 consultations + consultation_reports에 저장 (재분석 시 기존 리포트 교체)
export async function persistAnalysisResults(
  db: D1Database,
  orgId: string,
  consultId: string,
  audioKey: string | null,
  fullAnalysis: FullAnalysisResult,
  env?: Record<string, any>
): Promise<string> {
  const generationModel = getAIConfig(env || {}).primaryModel;
  await db.prepare(`
    UPDATE consultations SET
      audio_url = COALESCE(?, audio_url),
      transcript = ?,
      transcript_diarized = ?,
      ner_extracted = ?,
      spin_analysis = ?,
      summary = ?,
      treatment_type = COALESCE(treatment_type, ?),
      treatment_area = COALESCE(treatment_area, ?),
      amount = COALESCE(amount, ?),
      patient_psychology = ?,
      emotion_flow = ?,
      key_quotes = ?,
      feedback = ?,
      decision_score = ?,
      ai_analysis_status = 'completed',
      analysis_step = 'done',
      analysis_error = NULL,
      recording_status = 'completed',
      updated_at = datetime('now')
    WHERE id = ?
  `).bind(
    audioKey,
    toStr(fullAnalysis.transcript),
    toJsonStr(fullAnalysis.diarizedSegments),
    toJsonStr(fullAnalysis.nerData),
    toJsonStr(fullAnalysis.spinAnalysis),
    toStr(fullAnalysis.report.consultation_summary),
    toScalarStr(fullAnalysis.nerData.treatment_type),
    toScalarStr(fullAnalysis.nerData.treatment_area),
    toNum(fullAnalysis.nerData.discussed_amount),
    toJsonStr(fullAnalysis.report.decision_factors),
    toJsonStr({
      overall_tone: fullAnalysis.report.overall_sentiment,
      decision_score: fullAnalysis.report.decision_score,
      timeline: fullAnalysis.report.emotion_timeline,
      summary: fullAnalysis.report.emotion_summary
    }),
    toJsonStr(fullAnalysis.report.patient_concerns?.map((x: any) => x.concern) || []),
    toJsonStr({ ...fullAnalysis.report.coaching_feedback, growth_comparison: fullAnalysis.report.growth_comparison || null }),
    fullAnalysis.report.decision_score || 5,
    consultId
  ).run();

  // 재분석 대응: 기존 리포트 제거 후 새로 생성 (consultation_id UNIQUE)
  await db.prepare('DELETE FROM consultation_reports WHERE consultation_id = ?').bind(consultId).run();

  const reportId = 'report_' + generateId().slice(0, 8);
  await db.prepare(`
    INSERT INTO consultation_reports (
      id, organization_id, consultation_id,
      consultation_summary, treatment_options, discussed_amount, payment_options,
      patient_concerns, emotion_timeline, emotion_summary, overall_sentiment,
      decision_factors, decision_score, decision_prediction,
      next_actions, recommended_followup_date, followup_message,
      coaching_feedback, coaching_score, generation_model
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    reportId, orgId, consultId,
    toStr(fullAnalysis.report.consultation_summary),
    toJsonStr(fullAnalysis.report.treatment_options),
    toNum(fullAnalysis.report.discussed_amount),
    toJsonStr(fullAnalysis.report.payment_options),
    toJsonStr(fullAnalysis.report.patient_concerns),
    toJsonStr(fullAnalysis.report.emotion_timeline),
    toStr(fullAnalysis.report.emotion_summary),
    toStr(fullAnalysis.report.overall_sentiment),
    toJsonStr(fullAnalysis.report.decision_factors),
    fullAnalysis.report.decision_score || 5,
    toStr(fullAnalysis.report.decision_prediction),
    toJsonStr(fullAnalysis.report.next_actions),
    toStr(fullAnalysis.report.recommended_followup_date),
    toStr(fullAnalysis.report.followup_message),
    toJsonStr({ ...fullAnalysis.report.coaching_feedback, growth_comparison: fullAnalysis.report.growth_comparison || null }),
    fullAnalysis.report.coaching_feedback?.total_score || 0,
    generationModel
  ).run();

  return reportId;
}

// ============================================
// v8.2: AI 분석 → 팔로업 연락 태스크 자동 동기화
// "누구한테, 언제, 뭐라고 연락할지"를 분석이 끝나는 순간 자동 확정
// ============================================
export async function syncFollowupTask(
  db: D1Database,
  orgId: string,
  userId: string,
  consultId: string,
  report: FullAnalysisResult['report']
): Promise<boolean> {
  try {
    // 상담 상태 확인 — 이미 결제/이탈 확정이면 클로징 태스크 불필요
    const consult = await db.prepare(
      'SELECT patient_id, status FROM consultations WHERE id = ?'
    ).bind(consultId).first();
    if (!consult?.patient_id) return false;
    if (consult.status === 'paid' || consult.status === 'lost') return false;

    // 팔로업 날짜 검증: AI 추천일 사용, 과거/무효면 +2일
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let followDate: Date | null = null;
    const raw = (report.recommended_followup_date || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const d = new Date(raw + 'T00:00:00');
      if (!isNaN(d.getTime()) && d.getTime() >= today.getTime()) {
        // 14일 초과 추천은 7일로 당김 (이탈 골든타임 보호)
        const maxD = new Date(today); maxD.setDate(maxD.getDate() + 14);
        followDate = d.getTime() > maxD.getTime() ? (() => { const x = new Date(today); x.setDate(x.getDate() + 7); return x; })() : d;
      }
    }
    if (!followDate) {
      followDate = new Date(today);
      // 결정도 높으면 빨리, 낮으면 여유 (결정도 8+ → 내일, 5-7 → 2일, 그 외 → 3일)
      const ds = report.decision_score || 5;
      followDate.setDate(followDate.getDate() + (ds >= 8 ? 1 : ds >= 5 ? 2 : 3));
    }
    const followDateStr = followDate.toISOString().split('T')[0];

    // 연락 포인트: next_actions 상위 3개 (high 우선)
    const actions = Array.isArray(report.next_actions) ? [...report.next_actions] : [];
    const prioOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    actions.sort((a, b) => (prioOrder[a?.priority] ?? 3) - (prioOrder[b?.priority] ?? 3));
    const points = actions.slice(0, 3).map(a => a?.action).filter(Boolean);
    if (points.length === 0) points.push('상담 후 고민 포인트 확인', '결정 장벽 해소');

    // AI 추천 근거 (연락 리스트에서 "왜 이 환자인지" 노출용)
    const dsVal = report.decision_score || 5;
    const aiReason = [
      `결정도 ${dsVal}/10`,
      report.decision_factors?.main_concern ? `핵심 장벽: ${report.decision_factors.main_concern}` : null,
      report.decision_prediction ? String(report.decision_prediction).slice(0, 120) : null,
    ].filter(Boolean).join(' · ');

    const message = (report.followup_message || '').trim()
      || '지난 상담 관련해서 궁금하신 점 있으시면 편하게 말씀해주세요.';

    // 재분석 대응: 이 상담의 기존 자동 생성 pending 클로징 태스크는 AI 최신본으로 교체
    // (수동 생성 태스크는 보존)
    await db.prepare(`
      DELETE FROM contact_tasks
      WHERE consultation_id = ? AND task_type = 'closing' AND status = 'pending'
        AND (origin IS NULL OR origin != 'manual')
    `).bind(consultId).run();

    const taskId = 'task_' + generateId().slice(0, 8);
    await db.prepare(`
      INSERT INTO contact_tasks (
        id, organization_id, consultation_id, user_id, patient_id,
        task_type, recommended_date, recommended_message, points, origin, ai_reason
      ) VALUES (?, ?, ?, ?, ?, 'closing', ?, ?, ?, 'ai_analysis', ?)
    `).bind(
      taskId, orgId, consultId, userId, consult.patient_id,
      followDateStr, message, JSON.stringify(points), aiReason
    ).run();

    console.log('[AnalysisRunner] AI followup task created:', taskId, '→', followDateStr);
    return true;
  } catch (e) {
    console.warn('[AnalysisRunner] syncFollowupTask failed:', e);
    return false;
  }
}

async function setStep(db: D1Database, consultId: string, step: string) {
  try {
    await db.prepare('UPDATE consultations SET analysis_step = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .bind(step, consultId).run();
  } catch (e) { console.warn('[AnalysisRunner] setStep failed:', e); }
}

export interface AnalysisJobParams {
  db: D1Database;
  env: Record<string, any>;
  apiKey: string;
  consultId: string;
  orgId: string;
  userId: string;
  patientInfo: { name: string; age?: number; gender?: string };
  // 둘 중 하나: 오디오 직접 분석 or 이미 병합된 transcript
  audioData?: ArrayBuffer;
  transcript?: string;
  audioKey?: string | null;
}

// 스크립트 원문 즉시 저장 — 분석 성공/실패와 무관하게 원문은 항상 상담 기록에 보존
export async function persistRawTranscript(db: D1Database, consultId: string, transcript: string): Promise<void> {
  try {
    await db.prepare(`UPDATE consultations SET transcript = ?, updated_at = datetime('now') WHERE id = ?`)
      .bind(transcript, consultId).run();
    console.log('[AnalysisRunner] Raw transcript persisted for', consultId, '(' + transcript.length + ' chars)');
  } catch (e) {
    console.warn('[AnalysisRunner] persistRawTranscript failed:', e);
  }
}

// 전체 분석 잡 실행 (waitUntil 안에서 호출) — 실패 시 analysis_step='failed:<step>' 기록
export async function runAnalysisJob(params: AnalysisJobParams): Promise<void> {
  const { db, env, apiKey, consultId, orgId, userId, patientInfo, audioData, transcript, audioKey } = params;
  let currentStep = 'starting';
  const onStep = async (step: string) => { currentStep = step; await setStep(db, consultId, step); };

  try {
    const previousFeedback = await loadPreviousFeedback(db, userId, orgId);

    // 스크립트 원문 확보 → 분석 시작 전 즉시 저장 (분석 실패해도 원문 보존)
    let sourceTranscript: string | null = null;
    if (transcript && transcript.trim().length > 0) {
      sourceTranscript = transcript;
    } else if (audioData) {
      // 오디오 경로: 전사 먼저 수행하고 원문부터 저장
      await onStep('transcribing');
      const { text } = await transcribeWithTimestamps(audioData, apiKey, env);
      sourceTranscript = text;
    } else {
      throw new Error('분석할 오디오 또는 스크립트가 없습니다.');
    }

    if (!sourceTranscript || !sourceTranscript.trim()) {
      throw new Error('음성 인식 결과가 비어 있습니다.');
    }
    await persistRawTranscript(db, consultId, sourceTranscript);

    const result: FullAnalysisResult = await runAnalysisFromTranscript(
      sourceTranscript, patientInfo, apiKey, env, previousFeedback, onStep
    );

    await persistAnalysisResults(db, orgId, consultId, audioKey || null, result, env);

    // v8.2: 분석 완료 즉시 "다음 연락" 태스크 자동 생성 (AI 추천 날짜+멘트+포인트)
    await syncFollowupTask(db, orgId, userId, consultId, result.report);

    console.log('[AnalysisRunner] Analysis job complete for', consultId, 'score:', result.report.coaching_feedback?.total_score);
  } catch (err: any) {
    console.error('[AnalysisRunner] Analysis job failed at', currentStep, ':', err?.message || err);
    try {
      await db.prepare(`
        UPDATE consultations SET ai_analysis_status = 'failed', analysis_step = ?, analysis_error = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(`failed:${currentStep}`, String(err?.message || '알 수 없는 오류').slice(0, 500), consultId).run();
    } catch {}
  }
}

// ============================================================
// v9.1: Poll-to-Advance 파이프라인
// 프로덕션 Cloudflare에서 waitUntil 백그라운드는 응답 후 조기 종료됨 →
// 긴 AI 콜(리포트 생성 60~90s)이 중간에 죽어 88%에서 영구 멈춤.
// 해결: 폴링 요청(analysis-status)이 직접 "다음 한 단계"를 실행.
// 클레임 락(analysis_claim)으로 동시 폴링 중복 실행 방지.
// ============================================================

const CLAIM_TTL_SECONDS = 150; // AI 콜 타임아웃 90s×1 + 여유

async function claimAnalysis(db: D1Database, consultId: string): Promise<string | null> {
  const claimId = 'claim_' + generateId().slice(0, 10);
  try {
    const res = await db.prepare(`
      UPDATE consultations SET analysis_claim = ?, analysis_claim_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ? AND ai_analysis_status = 'processing'
        AND (analysis_claim IS NULL OR analysis_claim_at IS NULL
             OR analysis_claim_at < datetime('now', '-${CLAIM_TTL_SECONDS} seconds'))
    `).bind(claimId, consultId).run();
    return (res.meta?.changes || 0) > 0 ? claimId : null;
  } catch (e) {
    console.warn('[AnalysisRunner] claim failed:', e);
    return null;
  }
}

async function releaseClaim(db: D1Database, consultId: string, claimId: string) {
  try {
    await db.prepare('UPDATE consultations SET analysis_claim = NULL, analysis_claim_at = NULL WHERE id = ? AND analysis_claim = ?')
      .bind(consultId, claimId).run();
  } catch {}
}

async function failAnalysis(db: D1Database, consultId: string, step: string, message: string) {
  try {
    await db.prepare(`
      UPDATE consultations SET ai_analysis_status = 'failed', analysis_step = ?, analysis_error = ?,
        analysis_claim = NULL, analysis_claim_at = NULL, updated_at = datetime('now')
      WHERE id = ?
    `).bind(`failed:${step}`, message.slice(0, 500), consultId).run();
  } catch {}
}

// 폴링 1회당 파이프라인을 한 단계 전진시킨다.
// 반환: true = 이 요청이 실제 작업을 수행함 / false = 다른 요청이 진행 중이거나 대상 아님
export async function advanceAnalysisPipeline(
  db: D1Database,
  env: Record<string, any>,
  apiKey: string,
  consultId: string,
  orgId: string
): Promise<boolean> {
  const row: any = await db.prepare(`
    SELECT c.id, c.user_id, c.ai_analysis_status, c.analysis_step, c.transcript, c.transcript_diarized,
           c.ner_extracted, c.spin_analysis, c.audio_url,
           p.name as patient_name, p.age as patient_age, p.gender as patient_gender
    FROM consultations c LEFT JOIN patients p ON c.patient_id = p.id
    WHERE c.id = ? AND c.organization_id = ?
  `).bind(consultId, orgId).first();
  if (!row || row.ai_analysis_status !== 'processing') return false;

  const claimId = await claimAnalysis(db, consultId);
  if (!claimId) return false; // 다른 요청이 진행 중

  const step = (row.analysis_step as string) || 'transcribing';
  const patientInfo = {
    name: (row.patient_name as string) || '미지정',
    age: row.patient_age as number | undefined,
    gender: row.patient_gender as string | undefined,
  };

  try {
    if (step === 'transcribing' || step === '' || step === 'starting' || step === 'pending') {
      // === 1단계: STT — 세그먼트 누락분 전사 → 병합 (세그먼트 없으면 단일 오디오/기존 transcript 폴백)
      const chunks = await db.prepare(
        'SELECT id, chunk_index, audio_url, transcript FROM stt_chunks WHERE consultation_id = ? ORDER BY chunk_index ASC'
      ).bind(consultId).all();
      const chunkRows = (chunks.results || []) as any[];

      if (chunkRows.length > 0) {
        const missing = chunkRows.filter((ch) => (!ch.transcript || !String(ch.transcript).trim()) && ch.audio_url);
        // 한 요청당 최대 3개 병렬 전사 (각 ~15s) — 남으면 다음 폴링이 이어서
        const batch = missing.slice(0, 3);
        if (batch.length > 0) {
          await Promise.all(batch.map(async (ch) => {
            const obj = await (env as any).R2.get(ch.audio_url);
            if (!obj) {
              // R2 유실 세그먼트 — 빈 문자열로 마킹해 무한 재시도 방지
              await db.prepare("UPDATE stt_chunks SET transcript = '' WHERE id = ?").bind(ch.id).run();
              return;
            }
            const buf = await obj.arrayBuffer();
            await transcribeSegmentJob(db, env, apiKey, ch.id, buf);
          }));
        }
        if (missing.length > batch.length) { await releaseClaim(db, consultId, claimId); return true; }

        // 전사 실패(NULL 유지) 세그먼트 확인 — 재시도 1회는 위에서 이미 수행됨
        const refreshed = await db.prepare(
          'SELECT chunk_index, transcript FROM stt_chunks WHERE consultation_id = ? ORDER BY chunk_index ASC'
        ).bind(consultId).all();
        const stillMissing = (refreshed.results as any[]).filter((r) => r.transcript === null);
        if (stillMissing.length > 0 && batch.length > 0) {
          // 방금 시도한 배치가 실패 → 다음 폴링에서 한 번 더 (claim TTL이 무한루프 방지: 3회 실패 시 fail)
          const retryCount = Number((row as any).analysis_error?.match?.(/^stt_retry:(\d+)/)?.[1] || 0);
          if (retryCount >= 2) {
            await failAnalysis(db, consultId, 'transcribing', '음성 인식에 반복 실패했습니다. 재분석을 시도해주세요. (녹음은 안전하게 저장되어 있습니다)');
            return true;
          }
          await db.prepare("UPDATE consultations SET analysis_error = ?, updated_at = datetime('now') WHERE id = ?")
            .bind(`stt_retry:${retryCount + 1}`, consultId).run();
          await releaseClaim(db, consultId, claimId);
          return true;
        }
        const merged = (refreshed.results as any[])
          .map((r) => (r.transcript || '').trim()).filter(Boolean).join(' ');
        if (!merged) {
          await failAnalysis(db, consultId, 'transcribing', '음성 인식 결과가 없습니다. 녹음 상태를 확인해주세요.');
          return true;
        }
        await persistRawTranscript(db, consultId, merged);
      } else if (row.transcript && String(row.transcript).trim()) {
        // 세그먼트 없음 + transcript 이미 존재 (재분석 경로) — 그대로 진행
      } else if (row.audio_url) {
        // 단일 오디오 파일 경로 (legacy upload-audio / reports:generate)
        const obj = await (env as any).R2.get(row.audio_url);
        if (!obj) { await failAnalysis(db, consultId, 'transcribing', '저장된 녹음 파일을 찾을 수 없습니다.'); return true; }
        const buf = await obj.arrayBuffer();
        const { text } = await transcribeWithTimestamps(buf, apiKey, env);
        if (!text || !text.trim()) { await failAnalysis(db, consultId, 'transcribing', '음성 인식 결과가 비어 있습니다.'); return true; }
        await persistRawTranscript(db, consultId, text);
      } else {
        await failAnalysis(db, consultId, 'transcribing', '분석할 녹음이나 스크립트가 없습니다.');
        return true;
      }
      await db.prepare("UPDATE consultations SET analysis_step = 'diarizing', analysis_error = NULL, analysis_claim = NULL, analysis_claim_at = NULL, updated_at = datetime('now') WHERE id = ?")
        .bind(consultId).run();
      return true;
    }

    if (step === 'diarizing') {
      const transcript = String(row.transcript || '');
      if (!transcript.trim()) { await failAnalysis(db, consultId, 'diarizing', '스크립트가 비어 있습니다.'); return true; }
      const { diarizeSpeakers } = await import('./ai-presenter');
      const segments = await diarizeSpeakers(transcript, apiKey, env);
      await db.prepare("UPDATE consultations SET transcript_diarized = ?, analysis_step = 'extracting', analysis_claim = NULL, analysis_claim_at = NULL, updated_at = datetime('now') WHERE id = ?")
        .bind(JSON.stringify(segments), consultId).run();
      return true;
    }

    if (step === 'extracting') {
      const transcript = String(row.transcript || '');
      const diarized = safeParseJSON(row.transcript_diarized as string, [] as any[]);
      const { extractEntities, analyzeSPIN } = await import('./ai-presenter');
      const [nerData, spinAnalysis] = await Promise.all([
        extractEntities(transcript, apiKey, env),
        analyzeSPIN(diarized, apiKey, env),
      ]);
      await db.prepare("UPDATE consultations SET ner_extracted = ?, spin_analysis = ?, analysis_step = 'reporting', analysis_claim = NULL, analysis_claim_at = NULL, updated_at = datetime('now') WHERE id = ?")
        .bind(JSON.stringify(nerData), JSON.stringify(spinAnalysis), consultId).run();
      return true;
    }

    if (step === 'reporting') {
      const transcript = String(row.transcript || '');
      const diarized = safeParseJSON(row.transcript_diarized as string, [] as any[]);
      const nerData = safeParseJSON(row.ner_extracted as string, {} as any);
      const spinAnalysis = safeParseJSON(row.spin_analysis as string, {} as any);
      const previousFeedback = await loadPreviousFeedback(db, row.user_id as string, orgId);
      const { generateConsultationReport } = await import('./ai-presenter');
      const report = await generateConsultationReport(
        transcript, diarized, nerData, spinAnalysis, patientInfo, apiKey, env, previousFeedback
      );
      const fullAnalysis: FullAnalysisResult = {
        transcript, diarizedSegments: diarized, nerData, spinAnalysis, report,
      };
      await persistAnalysisResults(db, orgId, consultId, null, fullAnalysis, env);
      await syncFollowupTask(db, orgId, row.user_id as string, consultId, report);
      await db.prepare('UPDATE consultations SET analysis_claim = NULL, analysis_claim_at = NULL WHERE id = ?').bind(consultId).run();
      console.log('[AnalysisRunner] advance: completed', consultId, 'score:', report.coaching_feedback?.total_score);
      return true;
    }

    // 알 수 없는 step — 방어적으로 transcribing으로 리셋
    await db.prepare("UPDATE consultations SET analysis_step = 'transcribing', analysis_claim = NULL, analysis_claim_at = NULL, updated_at = datetime('now') WHERE id = ?")
      .bind(consultId).run();
    return true;
  } catch (err: any) {
    console.error('[AnalysisRunner] advance failed at', step, ':', err?.message || err);
    await failAnalysis(db, consultId, step, String(err?.message || '알 수 없는 오류'));
    return true;
  }
}

// 세그먼트 STT (업로드 직후 백그라운드 실행)
export async function transcribeSegmentJob(
  db: D1Database,
  env: Record<string, any>,
  apiKey: string,
  chunkId: string,
  audioData: ArrayBuffer
): Promise<void> {
  try {
    const { text } = await transcribeWithTimestamps(audioData, apiKey, env);
    await db.prepare('UPDATE stt_chunks SET transcript = ?, confidence = 1.0 WHERE id = ?')
      .bind(text || '', chunkId).run();
    console.log('[AnalysisRunner] Segment transcribed:', chunkId, (text || '').length, 'chars');
  } catch (err: any) {
    console.error('[AnalysisRunner] Segment STT failed:', chunkId, err?.message);
    // transcript NULL로 남음 → finalize 시 재시도
  }
}
