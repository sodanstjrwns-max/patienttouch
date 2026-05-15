// 리텐션 이탈 예측 ML 모듈 (v7.4)
// - OpenAI 기반 환자별 이탈 확률 예측
// - 입력: 마지막 방문일 / 미결정 상담 / 잔여치료비 / 연락 응답률 / 치료 상태
// - 출력: 이탈 확률 0-100% + 위험도 등급 + 액션 권고
//
// "필요한 진료를 받지 못하는 사람이 없도록" — 페이션트 퍼널 철학 그대로

import { callOpenAI, getAIConfig } from './ai-config';

export interface ChurnFeatures {
  patient_id: string;
  patient_name: string;
  days_since_last_visit: number;        // 마지막 방문 후 경과일
  undecided_count: number;               // 미결정 상담 수
  pending_treatment_amount: number;      // 잔여 치료비 (원)
  treatment_completion_rate: number;     // 치료 완료율 (0~1)
  contact_attempts: number;              // 최근 연락 시도 수
  contact_response_rate: number;         // 연락 응답률 (0~1)
  is_vip: boolean;                       // VIP 여부
  age?: number;
  has_referrer: boolean;                 // 소개로 온 환자인지 (이탈 시 신뢰 손실 ↑)
}

export interface ChurnPrediction {
  patient_id: string;
  churn_probability: number;             // 0~100
  risk_level: 'critical' | 'high' | 'medium' | 'low';
  predicted_window_days: number;         // 예측 이탈 시점 (며칠 내)
  key_risk_factors: string[];            // 위험 요인 TOP 3
  recommended_action: string;            // 액션 한 줄 권고
  recommended_script: string;            // 연락 스크립트 (1-2문장)
  confidence: number;                    // AI 신뢰도 0~1
  // 규칙 기반 폴백 점수 (AI 실패 시 사용)
  rule_based_score: number;
}

/**
 * 규칙 기반 폴백 점수 계산
 * AI 호출 실패 시 또는 OpenAI 키 없을 때 사용
 */
export function calculateRuleBasedChurnScore(f: ChurnFeatures): number {
  let score = 0;

  // 1) 마지막 방문 경과일 (최대 40점)
  if (f.days_since_last_visit > 180) score += 40;
  else if (f.days_since_last_visit > 90) score += 30;
  else if (f.days_since_last_visit > 60) score += 20;
  else if (f.days_since_last_visit > 30) score += 10;

  // 2) 잔여 치료비 (최대 20점) — 큰 금액 남기고 안 오면 이탈 위험 ↑
  if (f.pending_treatment_amount > 5_000_000) score += 20;
  else if (f.pending_treatment_amount > 2_000_000) score += 15;
  else if (f.pending_treatment_amount > 500_000) score += 8;

  // 3) 치료 완료율 낮음 (최대 15점)
  if (f.treatment_completion_rate < 0.3) score += 15;
  else if (f.treatment_completion_rate < 0.6) score += 8;

  // 4) 연락 응답률 낮음 (최대 15점)
  if (f.contact_attempts > 0) {
    if (f.contact_response_rate < 0.3) score += 15;
    else if (f.contact_response_rate < 0.6) score += 8;
  }

  // 5) 미결정 상담 누적 (최대 10점)
  if (f.undecided_count >= 3) score += 10;
  else if (f.undecided_count >= 1) score += 5;

  // VIP 가산점 (이탈 시 임팩트 큼)
  if (f.is_vip && score > 30) score = Math.min(100, score + 5);

  return Math.min(100, Math.max(0, score));
}

/**
 * 규칙 기반 위험 등급 매핑
 */
export function scoreToRiskLevel(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 75) return 'critical';
  if (score >= 55) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

/**
 * OpenAI 기반 이탈 예측 (단건)
 * - JSON mode로 안정적 파싱
 * - 실패 시 규칙 기반 폴백
 */
export async function predictChurn(
  apiKey: string,
  features: ChurnFeatures,
  env: Record<string, any> = {}
): Promise<ChurnPrediction> {
  const ruleScore = calculateRuleBasedChurnScore(features);
  const ruleLevel = scoreToRiskLevel(ruleScore);

  // OpenAI 키 없으면 규칙 기반만 반환
  if (!apiKey) {
    return buildRuleBasedPrediction(features, ruleScore, ruleLevel);
  }

  const config = getAIConfig(env);
  const systemPrompt = `당신은 치과 환자 이탈 예측 전문가입니다. 
페이션트 퍼널 시스템 철학: "필요한 진료를 받지 못하는 사람이 없도록"
환자 데이터를 분석해 이탈 확률(0-100)과 액션 권고를 JSON으로 반환하세요.

이탈 신호 우선순위:
1. 마지막 방문 후 90일 이상 = 매우 위험 신호
2. 잔여 치료비 큰데 안 옴 = 이미 다른 곳 갔을 가능성
3. 치료 완료율 낮음 + 연락 응답 X = 이탈 진행 중
4. VIP 등급 + 위험 신호 = 즉각 조치 필요

응답은 반드시 JSON: {
  "churn_probability": 0-100 정수,
  "predicted_window_days": 예상 이탈 시점 (며칠 내),
  "key_risk_factors": ["요인1", "요인2", "요인3"] (한국어, 짧게),
  "recommended_action": "한 줄 권고 (한국어)",
  "recommended_script": "환자에게 보낼 메시지 1-2문장 (따뜻한 톤, 부담 X)",
  "confidence": 0.0-1.0
}`;

  const userPrompt = `환자: ${features.patient_name}${features.is_vip ? ' (VIP)' : ''}
${features.age ? `나이: ${features.age}세` : ''}
마지막 방문: ${features.days_since_last_visit}일 전
미결정 상담: ${features.undecided_count}건
잔여 치료비: ${features.pending_treatment_amount.toLocaleString()}원
치료 완료율: ${Math.round(features.treatment_completion_rate * 100)}%
최근 연락 시도: ${features.contact_attempts}회 (응답률 ${Math.round(features.contact_response_rate * 100)}%)
${features.has_referrer ? '소개로 온 환자 (이탈 시 소개자 신뢰 손실 우려)' : ''}

규칙 기반 폴백 점수: ${ruleScore}점 (참고용)

이탈 확률과 액션 권고를 JSON으로 반환하세요.`;

  try {
    const result = await callOpenAI({
      apiKey,
      model: config.secondaryModel, // gpt-5-mini — 빠르고 충분
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      jsonMode: true,
    });

    const content = result?.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty AI response');

    const parsed = JSON.parse(content);
    const prob = Math.max(0, Math.min(100, Math.round(Number(parsed.churn_probability) || ruleScore)));
    const level = scoreToRiskLevel(prob);

    return {
      patient_id: features.patient_id,
      churn_probability: prob,
      risk_level: level,
      predicted_window_days: Math.max(1, Math.min(180, parseInt(parsed.predicted_window_days) || 30)),
      key_risk_factors: Array.isArray(parsed.key_risk_factors) ? parsed.key_risk_factors.slice(0, 3).map(String) : [],
      recommended_action: String(parsed.recommended_action || '담당자 직접 연락 권장').slice(0, 200),
      recommended_script: String(parsed.recommended_script || '').slice(0, 300),
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.7)),
      rule_based_score: ruleScore,
    };
  } catch (err) {
    console.warn('[ChurnPrediction] AI failed, falling back to rule-based:', err);
    return buildRuleBasedPrediction(features, ruleScore, ruleLevel);
  }
}

/**
 * 규칙 기반 예측 결과 빌더 (폴백 + AI 키 없을 때)
 */
function buildRuleBasedPrediction(
  f: ChurnFeatures,
  score: number,
  level: 'critical' | 'high' | 'medium' | 'low'
): ChurnPrediction {
  const factors: string[] = [];
  if (f.days_since_last_visit > 90) factors.push(`마지막 방문 ${f.days_since_last_visit}일 경과`);
  if (f.pending_treatment_amount > 2_000_000) factors.push(`잔여 치료비 ${Math.round(f.pending_treatment_amount / 10000)}만원`);
  if (f.treatment_completion_rate < 0.5) factors.push(`치료 완료율 ${Math.round(f.treatment_completion_rate * 100)}%`);
  if (f.contact_attempts > 0 && f.contact_response_rate < 0.5) factors.push(`연락 응답률 ${Math.round(f.contact_response_rate * 100)}%`);
  if (f.undecided_count >= 2) factors.push(`미결정 상담 ${f.undecided_count}건 누적`);

  const actions: Record<string, string> = {
    critical: f.is_vip 
      ? '⚠️ VIP 환자 — 원장 직접 전화 권장 (24시간 내)'
      : '담당 실장 직접 통화 + 검진 예약 제안 (3일 내)',
    high: '카카오톡 + 후속 통화 (7일 내)',
    medium: '카카오톡 정기 검진 안내 + 응답 모니터링',
    low: '정기 검진 시점 도래 시 자동 알림 발송',
  };

  const scripts: Record<string, string> = {
    critical: `${f.patient_name}님, 서울BD치과입니다. 마지막 진료 이후 시간이 꽤 지나서 걱정되어 연락드렸어요. 잠깐 통화 괜찮으실까요?`,
    high: `${f.patient_name}님 안녕하세요 :) 그동안 치료는 잘 마무리하셨는지 안부 여쭙고 싶어 연락드려요. 편하실 때 답장 부탁드려요.`,
    medium: `${f.patient_name}님, 정기 검진 시점이 다가오고 있어요. 편하신 날짜로 예약 도와드릴까요?`,
    low: `${f.patient_name}님, 6개월 정기 검진 시기예요. 예약 도와드릴까요?`,
  };

  const windows: Record<string, number> = { critical: 7, high: 21, medium: 60, low: 120 };

  return {
    patient_id: f.patient_id,
    churn_probability: score,
    risk_level: level,
    predicted_window_days: windows[level],
    key_risk_factors: factors.slice(0, 3),
    recommended_action: actions[level],
    recommended_script: scripts[level],
    confidence: 0.65, // 규칙 기반은 신뢰도 0.65 고정
    rule_based_score: score,
  };
}

/**
 * DB의 환자 + 치료 + 연락 데이터에서 ChurnFeatures를 추출
 */
export async function extractChurnFeaturesFromDB(
  db: D1Database,
  orgId: string,
  patientId: string
): Promise<ChurnFeatures | null> {
  // 환자 기본 정보
  const patient = await db.prepare(`
    SELECT id, name, age, last_visit_date, referrer_patient_id, tags
    FROM patients
    WHERE id = ? AND organization_id = ?
  `).bind(patientId, orgId).first<any>();

  if (!patient) return null;

  // 마지막 방문 후 경과일
  const lastVisit = patient.last_visit_date ? new Date(patient.last_visit_date) : null;
  const daysSinceLastVisit = lastVisit
    ? Math.floor((Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  // 미결정 상담 수
  const undecided = await db.prepare(`
    SELECT COUNT(*) as cnt FROM consultations
    WHERE patient_id = ? AND organization_id = ? AND status = 'undecided'
  `).bind(patientId, orgId).first<any>();

  // 잔여 치료비 + 완료율
  const treatments = await db.prepare(`
    SELECT status, total_amount, paid_amount FROM patient_treatments
    WHERE patient_id = ? AND organization_id = ?
  `).bind(patientId, orgId).all<any>();
  const treatmentRows = treatments.results || [];
  let totalAmount = 0;
  let paidAmount = 0;
  let completedCount = 0;
  for (const t of treatmentRows) {
    totalAmount += Number(t.total_amount) || 0;
    paidAmount += Number(t.paid_amount) || 0;
    if (t.status === 'completed') completedCount++;
  }
  const pendingAmount = Math.max(0, totalAmount - paidAmount);
  const completionRate = treatmentRows.length > 0 ? completedCount / treatmentRows.length : 1.0;

  // 연락 시도 + 응답률 (최근 90일)
  const contactsRaw = await db.prepare(`
    SELECT result FROM retention_contacts
    WHERE patient_id = ? AND organization_id = ?
    AND contacted_at >= datetime('now', '-90 days')
  `).bind(patientId, orgId).all<any>();
  const contacts = contactsRaw.results || [];
  const responded = contacts.filter((c: any) => 
    c.result === 'booked' || c.result === 'responded' || c.result === 'success' || c.result === 'reached'
  ).length;
  const contactResponseRate = contacts.length > 0 ? responded / contacts.length : 0;

  // VIP 판정 — tags 또는 총액 기반
  const tagsStr = String(patient.tags || '');
  const isVip = tagsStr.includes('VIP') || totalAmount >= 10_000_000;

  return {
    patient_id: patient.id,
    patient_name: patient.name,
    days_since_last_visit: daysSinceLastVisit,
    undecided_count: Number(undecided?.cnt) || 0,
    pending_treatment_amount: pendingAmount,
    treatment_completion_rate: completionRate,
    contact_attempts: contacts.length,
    contact_response_rate: contactResponseRate,
    is_vip: isVip,
    age: patient.age ? Number(patient.age) : undefined,
    has_referrer: !!patient.referrer_patient_id,
  };
}
