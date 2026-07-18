// AI Presenter Module - Enhanced AI Analysis (v2.0 - GPT-5 + gpt-4o-transcribe)
// 2026.03 업그레이드: 전체 파이프라인 모델 업그레이드 + 프롬프트 고도화
import type { AIAnalysisResult, PatientPsychology, EmotionFlow, ConsultationFeedback } from '../types';
import { callOpenAI, callTranscription, getAIConfig, DENTAL_TERMINOLOGY_HINT, type AIModelConfig } from './ai-config';

// ============================================
// Types for Presenter
// ============================================

export interface DiarizedSegment {
  speaker: 'consultant' | 'patient' | 'unknown';
  text: string;
  start: number; // seconds
  end: number;
  emotion?: number; // -1 to +1
  confidence?: number;
}

export interface NERExtracted {
  patient_name?: string | null;
  treatment_type?: string;
  treatment_area?: string;
  mentioned_prices?: number[];
  discussed_amount?: number;
  payment_mentions?: string[];
  timeline_mentions?: string[];
  decision_maker?: string;
  concerns?: string[];
  competitor_mentions?: string[];
}

export interface SPINAnalysis {
  situation_questions: string[];
  problem_questions: string[];
  implication_questions: string[];
  need_payoff_questions: string[];
  spin_score: number; // 0-100
  spin_feedback: string;
}

export interface EmotionTimeline {
  timestamp: number; // seconds
  score: number; // -1 to +1
  note?: string;
  highlight?: boolean;
  speaker: 'consultant' | 'patient';
}

export interface CoachingFeedback {
  scores: {
    rapport: number; // 20점
    spin: number; // 25점
    objection_handling: number; // 20점
    pricing_framing: number; // 15점
    closing: number; // 10점
    structure: number; // 10점
  };
  total_score: number;
  strengths: string[];
  improvements: Array<{
    issue: string;
    suggestion: string;
    example?: string;
    timestamp?: number;
  }>;
  patient_code_evaluation: string;
}

export interface ConsultationReport {
  patient_summary?: string;
  consultation_summary: string;
  treatment_options: Array<{
    name: string;
    price: number;
    duration?: string;
    pros: string[];
    cons: string[];
    recommendation_level: 'high' | 'medium' | 'low';
  }>;
  discussed_amount?: number;
  payment_options: {
    full_payment?: number;
    installment_options: Array<{
      months: number;
      monthly_amount: number;
      interest_rate?: number;
    }>;
  };
  patient_concerns: Array<{
    concern: string;
    addressed: boolean;
    resolution?: string;
  }>;
  emotion_timeline: EmotionTimeline[];
  emotion_summary: string;
  overall_sentiment: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
  decision_factors: {
    main_concern?: string;
    decision_maker?: string;
    budget_range?: string;
    timeline?: string;
  };
  decision_score: number;
  decision_prediction: string;
  next_actions: Array<{
    action: string;
    due_date?: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  recommended_followup_date?: string;
  followup_message?: string;
  coaching_feedback: CoachingFeedback;
  growth_comparison?: GrowthComparison;
}

export interface GrowthComparison {
  previous_avg_score: number;
  current_score: number;
  score_delta: number;
  improved_areas: Array<{
    area: string;
    previous: number;
    current: number;
    delta: number;
    comment: string;
  }>;
  still_needs_work: Array<{
    area: string;
    previous_issue: string;
    current_status: string;
    suggestion: string;
  }>;
  overall_growth_comment: string;
  streak_info?: string;
}

export interface PreviousFeedbackContext {
  sessions: Array<{
    date: string;
    total_score: number;
    scores: CoachingFeedback['scores'];
    top_improvement: string;
    treatment_type?: string;
  }>;
  avg_scores: CoachingFeedback['scores'];
  avg_total: number;
  recurring_issues: string[];
}

// ============================================
// Transcription with timestamps
// ============================================

export async function transcribeWithTimestamps(
  audioData: ArrayBuffer,
  apiKey: string,
  env?: Record<string, any>
): Promise<{ text: string; segments: Array<{ start: number; end: number; text: string }> }> {
  const config = getAIConfig(env || {});

  const result = await callTranscription({
    apiKey,
    model: config.transcriptionAdvancedModel,
    audioData,
    language: 'ko',
    responseFormat: 'json',
    prompt: DENTAL_TERMINOLOGY_HINT,
  });

  return {
    text: result.text,
    segments: result.segments?.map((s: any) => ({
      start: s.start,
      end: s.end,
      text: s.text
    })) || []
  };
}

// ============================================
// Speaker Diarization (GPT-5)
// ============================================

export async function diarizeSpeakers(
  transcript: string,
  apiKey: string,
  env?: Record<string, any>
): Promise<DiarizedSegment[]> {
  const config = getAIConfig(env || {});

  const prompt = `당신은 의료 상담 화자 분리 전문가입니다. 다음 상담 스크립트에서 화자를 정밀하게 구분해주세요.

## 화자 구분 기준
**상담사(consultant)의 특징:**
- 병원/치료 소개, 가격/할부 설명, 치료 과정 안내
- 질문을 주도적으로 던짐 ("어디가 불편하세요?", "언제부터...")
- 전문 용어 사용 (임플란트, 크라운, 지르코니아 등)
- 공감/안심 표현 ("걱정 마세요", "많은 분들이...")
- 다음 단계 유도 ("그러면 먼저...", "검사 한번 해볼까요?")

**환자(patient)의 특징:**
- 증상/고민 설명 ("여기가 아파요", "씹을 때...")
- 질문에 답변 ("네", "한 달쯤 됐어요")
- 걱정/두려움 표현 ("좀 무서운데", "아프진 않나요?")
- 가격 관련 반응 ("좀 비싸네요", "할부 되나요?")
- 주변인 언급 ("남편이랑 상의해봐야...", "엄마가...")

## 감정 평가 기준
- +1.0: 매우 긍정 (결정, 감사, 안심)
- +0.5: 긍정 (관심, 호감, 이해)
- 0.0: 중립 (정보 전달, 단순 응답)
- -0.5: 부정 (걱정, 망설임, 불안)
- -1.0: 매우 부정 (거부, 분노, 강한 반감)

스크립트:
${transcript}

JSON 형식:
{
  "segments": [
    {"speaker": "consultant", "text": "발화 내용", "start": 0, "end": 5, "emotion": 0.5, "confidence": 0.9},
    {"speaker": "patient", "text": "발화 내용", "start": 5, "end": 12, "emotion": -0.2, "confidence": 0.85}
  ]
}`;

  const result = await callOpenAI({
    apiKey,
    model: config.primaryModel,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  });

  return result.segments || [];
}

// ============================================
// NER (Named Entity Recognition) - GPT-5-mini
// ============================================

export async function extractEntities(
  transcript: string,
  apiKey: string,
  env?: Record<string, any>
): Promise<NERExtracted> {
  const config = getAIConfig(env || {});

  const prompt = `다음 치과/의료 상담 스크립트에서 핵심 정보를 빠짐없이 추출해주세요.

## 추출 주의사항
- 금액은 반드시 원 단위 숫자로 (예: "삼백만원" → 3000000)
- 치아 번호는 치식 표기법으로 (#11, #36 등)
- "어금니", "앞니" 같은 표현도 해당 부위로 변환
- 결제 관련 키워드: 할부, 무이자, 카드, 현금, 수납, 분납
- 경쟁 병원: 다른 병원명이 언급되면 반드시 기록

스크립트:
${transcript}

JSON 형식으로 추출:
{
  "patient_name": "환자 본인의 이름 (상담 중 '──님'으로 명시적으로 불린 경우에만. 부모님/원장님/실장님/선생님 같은 호칭은 이름이 아님. 불확실하면 반드시 null)",
  "treatment_type": "진료 항목 (임플란트, 교정, 라미네이트 등)",
  "treatment_area": "치료 부위 (#36, 상악 전치 6개 등)",
  "mentioned_prices": [언급된 금액들 (숫자 배열, 원 단위)],
  "discussed_amount": 최종 논의된 금액,
  "payment_mentions": ["할부", "카드", "현금", "무이자" 등 결제 관련 언급],
  "timeline_mentions": ["2주", "한달", "6개월" 등 기간 언급],
  "decision_maker": "실결정권자 (본인/배우자/부모 등)",
  "concerns": ["환자가 언급한 걱정/우려 사항들"],
  "competitor_mentions": ["다른 병원 언급 시 병원명"]
}`;

  return await callOpenAI({
    apiKey,
    model: config.secondaryModel,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
  });
}

// ============================================
// SPIN Analysis (GPT-5-mini)
// ============================================

export async function analyzeSPIN(
  diarizedSegments: DiarizedSegment[],
  apiKey: string,
  env?: Record<string, any>
): Promise<SPINAnalysis> {
  const config = getAIConfig(env || {});

  const consultantQuestions = diarizedSegments
    .filter(s => s.speaker === 'consultant' && s.text.includes('?'))
    .map(s => s.text);

  const allConsultantText = diarizedSegments
    .filter(s => s.speaker === 'consultant')
    .map(s => s.text)
    .join('\n');

  const prompt = `당신은 페이션트 퍼널 SPIN 화법 분석 전문가입니다.

## SPIN 화법 정의 (치과 상담 맥락)
- **Situation(상황)**: 현재 상태 파악 질문
  예: "지금 어디가 불편하세요?", "언제 마지막으로 치과 오셨어요?"
- **Problem(문제)**: 문제/고민 발굴 질문
  예: "식사하실 때 불편하시죠?", "웃을 때 신경 쓰이시죠?"
- **Implication(암시)**: 문제 방치 시 영향 확대
  예: "이대로 두시면 옆 치아까지 영향이...", "시간이 지나면 비용이 더..."
- **Need-payoff(필요-보상)**: 해결 후 가치 강조
  예: "치료하시면 편하게 드실 수 있으세요", "자신 있게 웃으실 수 있어요"

## 평가 기준
- S만 있으면: 30점 이하 (정보 수집만 하고 있음)
- S+P 있으면: 50점 (문제 인식 유도 중)
- S+P+I 있으면: 70점 (가치 인식 촉진 중)  
- S+P+I+N 있으면: 85점+ (완벽한 SPIN 활용)
- 질문 없이 설명만: 20점 이하

상담사 발화 전체:
${allConsultantText}

상담사 질문들:
${consultantQuestions.join('\n')}

JSON 형식:
{
  "situation_questions": ["S 유형 질문들 (원문 인용)"],
  "problem_questions": ["P 유형 질문들 (원문 인용)"],
  "implication_questions": ["I 유형 질문들 (원문 인용)"],
  "need_payoff_questions": ["N 유형 질문들 (원문 인용)"],
  "spin_score": 0~100점,
  "spin_feedback": "SPIN 활용도 종합 피드백 + 부족한 단계에서 사용할 수 있는 예시 질문 2-3개 제안"
}`;

  return await callOpenAI({
    apiKey,
    model: config.secondaryModel,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  });
}

// ============================================
// Full Consultation Report Generation (GPT-5)
// ============================================

export async function generateConsultationReport(
  transcript: string,
  diarizedSegments: DiarizedSegment[],
  nerData: NERExtracted,
  spinAnalysis: SPINAnalysis,
  patientInfo: { name: string; age?: number; gender?: string; previousHistory?: string },
  apiKey: string,
  env?: Record<string, any>,
  previousFeedback?: PreviousFeedbackContext | null
): Promise<ConsultationReport> {
  const config = getAIConfig(env || {});

  // Build previous feedback context for growth comparison
  const feedbackHistoryBlock = previousFeedback && previousFeedback.sessions.length > 0 
    ? `

## ⚡ 이전 상담 피드백 이력 (최근 ${previousFeedback.sessions.length}회)
평균 총점: ${previousFeedback.avg_total.toFixed(1)}점
평균 영역별: 라포 ${previousFeedback.avg_scores.rapport.toFixed(1)}/20, SPIN ${previousFeedback.avg_scores.spin.toFixed(1)}/25, 반론 ${previousFeedback.avg_scores.objection_handling.toFixed(1)}/20, 가격 ${previousFeedback.avg_scores.pricing_framing.toFixed(1)}/15, 클로징 ${previousFeedback.avg_scores.closing.toFixed(1)}/10, 구조 ${previousFeedback.avg_scores.structure.toFixed(1)}/10

반복 지적 사항:
${previousFeedback.recurring_issues.map(i => `- ${i}`).join('\n')}

최근 세션 기록:
${previousFeedback.sessions.map(s => `- ${s.date}: ${s.total_score}점 (${s.treatment_type || '일반'}) — 주요 개선점: ${s.top_improvement}`).join('\n')}

🎯 **중요 — 이 이력의 사용 범위 (채점 방화벽)**:
- 이 이력은 **오직 growth_comparison 필드와 격려 코멘트 작성에만** 사용하세요.
- **coaching_feedback.scores와 total_score는 절대 이전 점수에 영향받으면 안 됩니다.** 오직 이번 상담 스크립트만으로, 루브릭 앞커 기준으로 블라인드 채점하세요.
- "성장 스토리"를 만들기 위해 점수를 올리거나 내리지 마세요. 실제로 지난번보다 못했으면 점수는 낮게, 격려는 코멘트로 하세요.
1. 이전에 지적받은 부분이 이번에 개선되었는지 구체적으로 비교 (growth_comparison에만 기록)
2. 반복적으로 나타나는 약점이 있다면 still_needs_work에 강조
3. 개선된 부분은 칭찬하고 구체적으로 어떻게 나아졌는지 설명
4. growth_comparison 필드를 반드시 채워주세요`
    : '';

  const systemPrompt = `당신은 대한민국 최고 수준의 의료 상담 분석 전문가이며, 페이션트 퍼널(Patient Funnel)의 Patient Code 방법론에 정통합니다.

## Patient Code 상담 평가 기준 (100점 만점)
1. **라포 형성 (20점)**: 첫인사, 이름 호칭, 공감 표현, 눈높이 맞춤, 환자 페이스에 맞는 대화 속도
2. **SPIN 활용 (25점)**: 상황-문제-암시-필요보상 질문 기법, 질문의 깊이와 순서
3. **반론 처리 (20점)**: 인정→공감→재프레이밍→해결책 4단계, "네, 그렇죠" 시작하는 습관
4. **가격 프레이밍 (15점)**: 앵커링(비싼 옵션 먼저), 분납 안내 타이밍, 가치 대비 가격 제시, 일당 환산
5. **클로징 (10점)**: 시험 클로징("그러면 언제가 좋으세요?"), 양자택일, 다음 단계 유도
6. **전체 구조 (10점)**: 도입(5분)-본론(15분)-마무리(5분) 흐름, 핵심 메시지 반복

## 채점 앞커 (회차 간 일관성 기준 — 반드시 이 잣대로 채점)
- **라포 16-20점**: 이름을 3회 이상 부르고, 환자 발언에 공감 표현("그러셨구나", "많이 불편하셨겠어요")을 보임 / **11-15점**: 인사는 있으나 공감 표현이 기계적 / **10점 이하**: 바로 시술 설명으로 직행
- **SPIN 20-25점**: 4단계 질문이 순서대로 2세트 이상 / **13-19점**: 상황·문제 질문은 있으나 암시·필요보상 누락 / **12점 이하**: 질문 없이 설명 위주
- **반론 처리 16-20점**: 모든 반론에 인정→공감 선행 / **11-15점**: 일부 반론에 방어적 대응 / **10점 이하**: 반론을 무시하거나 맞받아침
- 반론·가격 논의가 아예 없는 짧은 상담은 해당 영역 중간점(반론 10, 가격 7)을 부여하고 "평가 불가"를 명시

## 분석 원칙
- **코치처럼 대화하기**: 분석 보고서가 아닌, 옆에서 응원하는 선배 상담사가 쓴 것처럼. "이 부분 정말 잘하셨어요!" "여기서 살짝만 바꾸면 훨씬 좋아질 거예요" 같은 톤
- **구체적이고 액션 가능한 피드백**: "잘했습니다"가 아닌 "3분 42초에 '아프지 않습니다'라고 한 부분이 좋았습니다" 수준
- **대안 멘트 필수**: 개선점마다 "이렇게 말해보세요: ..."로 실제 사용 가능한 스크립트 제공
- **환자 심리 기반**: 환자가 '왜' 그런 반응을 보였는지 심리적 분석 포함
- **데이터 근거**: 가능한 경우 업계 평균 수치와 비교 (예: "이의 처리 성공률 60%로 업계 평균 45%보다 우수")
- **성장 추적**: 이전 세션 피드백이 제공된 경우, 개선 여부를 반드시 비교 분석하여 growth_comparison 필드에 기록
- **격려 중심**: 강점은 구체적으로 칭찬하고 "이런 상담사는 드물어요" 같은 표현 활용. 개선점도 "~하면 완벽해질 거예요" 식으로 긍정 프레이밍
- **성장 비교 시 개선점은 반드시 칭찬 먼저**: "지난번보다 라포 형성이 3점 올랐어요! 환자 이름을 자주 불러주신 덕분이에요" 형식`;

  const userPrompt = `다음 상담 데이터를 분석하여 종합 레포트를 생성해주세요. 상담사가 읽고 "나 성장하고 있구나!"라고 느낄 수 있는 따뜻한 코치 톤으로 작성해주세요.
${feedbackHistoryBlock}

## 환자 정보
- 이름: ${patientInfo.name}
- 나이: ${patientInfo.age || '미상'}
- 성별: ${patientInfo.gender === 'male' ? '남성' : patientInfo.gender === 'female' ? '여성' : '미상'}
- 이전 내원 이력: ${patientInfo.previousHistory || '없음'}

## 화자 분리된 대화
${diarizedSegments.map(s => `[${s.speaker === 'consultant' ? '상담사' : '환자'}] (감정: ${s.emotion?.toFixed(1) || '?'}) ${s.text}`).join('\n')}

## 추출된 정보 (NER)
- 진료 항목: ${nerData.treatment_type || '미확인'}
- 치료 부위: ${nerData.treatment_area || '미확인'}
- 언급 금액: ${nerData.mentioned_prices?.join(', ') || '없음'}원
- 논의 금액: ${nerData.discussed_amount || '미확인'}원
- 결제 언급: ${nerData.payment_mentions?.join(', ') || '없음'}
- 환자 우려: ${nerData.concerns?.join(', ') || '없음'}
- 결정권자: ${nerData.decision_maker || '본인'}
- 경쟁 병원: ${nerData.competitor_mentions?.join(', ') || '없음'}

## SPIN 분석 결과
- SPIN 점수: ${spinAnalysis.spin_score}점
- 피드백: ${spinAnalysis.spin_feedback}
- S 질문: ${spinAnalysis.situation_questions?.length || 0}개
- P 질문: ${spinAnalysis.problem_questions?.length || 0}개
- I 질문: ${spinAnalysis.implication_questions?.length || 0}개
- N 질문: ${spinAnalysis.need_payoff_questions?.length || 0}개

## 출력 JSON 형식
{
  "patient_summary": "환자 프로필 + 이번 상담 목적 요약 (2-3줄, 핵심만)",
  "consultation_summary": "상담 핵심 내용 요약 (5-7 bullet points, 각 '• '로 시작, 인사이트 포함)",
  "treatment_options": [
    {
      "name": "치료명",
      "price": 금액(숫자),
      "duration": "예상 기간",
      "pros": ["환자 관점 장점1", "장점2"],
      "cons": ["주의사항/단점"],
      "recommendation_level": "high|medium|low"
    }
  ],
  "discussed_amount": 논의된 총 금액,
  "payment_options": {
    "full_payment": 일시불 금액,
    "installment_options": [
      {"months": 3, "monthly_amount": 월납입액, "interest_rate": 0},
      {"months": 6, "monthly_amount": 월납입액, "interest_rate": 0},
      {"months": 12, "monthly_amount": 월납입액, "interest_rate": 0}
    ]
  },
  "patient_concerns": [
    {"concern": "구체적 우려사항", "addressed": true/false, "resolution": "해소 방법 또는 미해소 시 추천 대응"}
  ],
  "emotion_timeline": [
    {"timestamp": 초, "score": -1~+1, "note": "감정 상세 메모", "highlight": true/false, "speaker": "patient|consultant"}
  ],
  "emotion_summary": "감정 변화 한 줄 요약 (전환 포인트 명시)",
  "overall_sentiment": "very_positive|positive|neutral|negative|very_negative",
  "decision_factors": {
    "main_concern": "핵심 고민 (가장 큰 장벽)",
    "decision_maker": "결정권자 + 대응 전략",
    "budget_range": "예산 범위 + 가격 민감도",
    "timeline": "결정 예상 시기 + 촉진 요인"
  },
  "decision_score": 1-10 (소수점 가능),
  "decision_prediction": "결정 예측 및 근거 (2-3줄, 확률 포함 예: '70% 확률로 1주 내 결정 예상')",
  "next_actions": [
    {"action": "구체적 행동 (누가, 언제, 무엇을)", "due_date": "날짜", "priority": "high|medium|low"}
  ],
  "recommended_followup_date": "YYYY-MM-DD (최적 팔로업 날짜)",
  "followup_message": "팔로업 시 추천 첫 멘트 (환자 상황 반영, 2-3문장)",
  "coaching_feedback": {
    "scores": {
      "rapport": 0-20,
      "spin": 0-25,
      "objection_handling": 0-20,
      "pricing_framing": 0-15,
      "closing": 0-10,
      "structure": 0-10
    },
    "total_score": 0-100,
    "strengths": ["잘한 점 + 구체적 상황 (3-5개)"],
    "improvements": [
      {
        "issue": "개선점 (구체적 상황)",
        "suggestion": "이렇게 말해보세요: '실제 대안 멘트'",
        "example": "추가 예시 멘트 (선택)"
      }
    ],
    "patient_code_evaluation": "Patient Code 관점 종합 평가 (3-4줄, 등급 포함: S/A/B/C/D)"
  },
  "growth_comparison": {
    "previous_avg_score": 이전 평균 점수 (없으면 0),
    "current_score": 이번 총점,
    "score_delta": 이번 - 이전평균 (양수면 개선),
    "improved_areas": [
      {"area": "영역명", "previous": 이전점수, "current": 이번점수, "delta": 차이, "comment": "구체적 개선 내용"}
    ],
    "still_needs_work": [
      {"area": "영역명", "previous_issue": "이전에 지적받은 내용", "current_status": "이번 상태", "suggestion": "다음 세션 구체적 실천 과제"}
    ],
    "overall_growth_comment": "전체 성장 코멘트 (2-3줄, 코치가 옆에서 말해주듯 따뜻하게. 예: '지난달과 비교하면 정말 많이 성장하셨어요! 특히 반론 처리가 눈에 띄게 좋아졌습니다. 이 속도면 곧 80점대 안착할 수 있어요!')",
    "streak_info": "연속 개선 현황 (예: '3회 연속 SPIN 점수 상승 중! 🔥')" 
  }
}`;

  return await callOpenAI({
    apiKey,
    model: config.primaryModel,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.3,
    maxTokens: 4000,
  });
}

// ============================================
// Treatment Proposal Generation (GPT-5-mini)
// ============================================

export interface ProposalContent {
  title: string;
  greeting_message: string;
  selected_options: Array<{
    name: string;
    price: number;
    duration?: string;
    benefits: string[];
    recommended: boolean;
  }>;
  recommended_option: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  installment_options: Array<{
    months: number;
    monthly_amount: number;
  }>;
  closing_message: string;
}

export async function generateProposalContent(
  report: ConsultationReport,
  patientName: string,
  hospitalName: string,
  consultantName: string,
  apiKey: string,
  env?: Record<string, any>
): Promise<ProposalContent> {
  const config = getAIConfig(env || {});

  const prompt = `다음 상담 레포트를 기반으로 환자에게 보낼 치료 제안서를 생성해주세요.
제안서는 환자가 카카오톡이나 문자로 받아보는 것입니다. 따뜻하고 전문적이면서도 부담스럽지 않아야 합니다.

환자명: ${patientName}
병원명: ${hospitalName}
상담사: ${consultantName}

상담 요약:
${report.consultation_summary}

치료 옵션:
${JSON.stringify(report.treatment_options, null, 2)}

논의 금액: ${report.discussed_amount}원

환자 우려사항:
${report.patient_concerns.map(c => `- ${c.concern}: ${c.addressed ? '해소됨' : '미해소 → ' + (c.resolution || '추가 설명 필요')}`).join('\n')}

결정 요인:
${JSON.stringify(report.decision_factors, null, 2)}

JSON 형식으로 제안서 내용 생성:
{
  "title": "제안서 제목 (예: ${patientName}님을 위한 맞춤 치료 안내)",
  "greeting_message": "따뜻한 인사말 (2-3줄, 환자 상담 내용 구체적 언급, '자동발송' 느낌 절대 X)",
  "selected_options": [
    {
      "name": "치료명",
      "price": 금액,
      "duration": "기간",
      "benefits": ["환자 관점 혜택 3개 (환자가 공감할 표현으로)"],
      "recommended": true/false
    }
  ],
  "recommended_option": "추천 치료명",
  "total_amount": 총액,
  "discount_amount": 할인금액(없으면 0),
  "final_amount": 최종금액,
  "installment_options": [
    {"months": 3, "monthly_amount": 금액},
    {"months": 6, "monthly_amount": 금액},
    {"months": 12, "monthly_amount": 금액}
  ],
  "closing_message": "마무리 메시지 (결정 독촉 없이, '편하실 때 연락주세요' 톤)"
}`;

  return await callOpenAI({
    apiKey,
    model: config.secondaryModel,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
  });
}

// ============================================
// Full Analysis Pipeline (End-to-End)
// ============================================

export interface FullAnalysisResult {
  transcript: string;
  diarizedSegments: DiarizedSegment[];
  nerData: NERExtracted;
  spinAnalysis: SPINAnalysis;
  report: ConsultationReport;
}

// v8.0: Analysis from an already-merged transcript (segment-based recording flow)
// onStep: 진행 단계 콜백 — DB에 analysis_step을 기록해 프론트 폴링에 사용
export async function runAnalysisFromTranscript(
  transcript: string,
  patientInfo: { name: string; age?: number; gender?: string; previousHistory?: string },
  apiKey: string,
  env?: Record<string, any>,
  previousFeedback?: PreviousFeedbackContext | null,
  onStep?: (step: string) => Promise<void>
): Promise<FullAnalysisResult> {
  const config = getAIConfig(env || {});

  // Step 2: Diarize speakers
  console.log('[Pipeline] Diarizing speakers with', config.primaryModel, '...');
  if (onStep) await onStep('diarizing');
  const diarizedSegments = await diarizeSpeakers(transcript, apiKey, env);
  console.log('[Pipeline] Diarization complete:', diarizedSegments.length, 'segments');

  // Step 3 & 4: NER + SPIN in parallel
  console.log('[Pipeline] Extracting entities + SPIN analysis (parallel) with', config.secondaryModel, '...');
  if (onStep) await onStep('extracting');
  const [nerData, spinAnalysis] = await Promise.all([
    extractEntities(transcript, apiKey, env),
    analyzeSPIN(diarizedSegments, apiKey, env),
  ]);
  console.log('[Pipeline] NER + SPIN complete');

  // Step 5: Generate full report
  console.log('[Pipeline] Generating report with', config.primaryModel, '...');
  if (onStep) await onStep('reporting');
  const report = await generateConsultationReport(
    transcript, diarizedSegments, nerData, spinAnalysis,
    patientInfo, apiKey, env, previousFeedback
  );
  console.log('[Pipeline] Report generation complete. Score:', report.coaching_feedback?.total_score);

  return { transcript, diarizedSegments, nerData, spinAnalysis, report };
}

export async function runFullAnalysisPipeline(
  audioData: ArrayBuffer,
  patientInfo: { name: string; age?: number; gender?: string; previousHistory?: string },
  apiKey: string,
  env?: Record<string, any>,
  previousFeedback?: PreviousFeedbackContext | null,
  onStep?: (step: string) => Promise<void>
): Promise<FullAnalysisResult> {
  const config = getAIConfig(env || {});
  console.log('[Pipeline] Starting full analysis with models:', config.primaryModel, '/', config.secondaryModel);

  // Step 1: Transcribe with gpt-4o-transcribe (치과 전문용어 힌트 포함)
  console.log('[Pipeline] Step 1: Transcribing audio with', config.transcriptionModel, '...');
  if (onStep) await onStep('transcribing');
  const { text: transcript } = await transcribeWithTimestamps(audioData, apiKey, env);
  console.log('[Pipeline] Transcription complete:', transcript.length, 'chars');

  return runAnalysisFromTranscript(transcript, patientInfo, apiKey, env, previousFeedback, onStep);
}
