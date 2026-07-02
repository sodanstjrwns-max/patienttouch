// v8.0: Shared Analysis Runner
// 업로드/세그먼트/재분석 3개 경로가 공유하는 분석 실행 + 결과 저장 로직
// 비동기(waitUntil) 실행을 전제로 설계 — analysis_step으로 진행률 추적

import { generateId, safeParseJSON } from './utils';
import { runAnalysisFromTranscript, runFullAnalysisPipeline, transcribeWithTimestamps } from './ai-presenter';
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
  fullAnalysis: FullAnalysisResult
): Promise<string> {
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
    fullAnalysis.nerData.treatment_type || null,
    fullAnalysis.nerData.treatment_area || null,
    fullAnalysis.nerData.discussed_amount || null,
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
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'gpt-5')
  `).bind(
    reportId, orgId, consultId,
    toStr(fullAnalysis.report.consultation_summary),
    toJsonStr(fullAnalysis.report.treatment_options),
    fullAnalysis.report.discussed_amount || null,
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
    fullAnalysis.report.coaching_feedback?.total_score || 0
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

// 전체 분석 잡 실행 (waitUntil 안에서 호출) — 실패 시 analysis_step='failed:<step>' 기록
export async function runAnalysisJob(params: AnalysisJobParams): Promise<void> {
  const { db, env, apiKey, consultId, orgId, userId, patientInfo, audioData, transcript, audioKey } = params;
  let currentStep = 'starting';
  const onStep = async (step: string) => { currentStep = step; await setStep(db, consultId, step); };

  try {
    const previousFeedback = await loadPreviousFeedback(db, userId, orgId);

    let result: FullAnalysisResult;
    if (transcript && transcript.trim().length > 0) {
      result = await runAnalysisFromTranscript(transcript, patientInfo, apiKey, env, previousFeedback, onStep);
    } else if (audioData) {
      result = await runFullAnalysisPipeline(audioData, patientInfo, apiKey, env, previousFeedback, onStep);
    } else {
      throw new Error('분석할 오디오 또는 스크립트가 없습니다.');
    }

    await persistAnalysisResults(db, orgId, consultId, audioKey || null, result);

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
