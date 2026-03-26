// AI Analysis Module - OpenAI Integration (v2.0 - GPT-5 Upgrade)
// 2026.03 업그레이드: gpt-5 + gpt-5-mini + gpt-4o-transcribe
import type { AIAnalysisResult, PatientPsychology, EmotionFlow, ConsultationFeedback } from '../types';
import { callOpenAI, callTranscription, getAIConfig, DENTAL_TERMINOLOGY_HINT, type AIModelConfig } from './ai-config';

// Transcribe audio using OpenAI (gpt-4o-transcribe)
export async function transcribeAudio(audioData: ArrayBuffer, apiKey: string, env?: Record<string, any>): Promise<string> {
  const config = getAIConfig(env || {});
  
  return await callTranscription({
    apiKey,
    model: config.transcriptionModel,
    audioData,
    language: 'ko',
    responseFormat: 'text',
    prompt: DENTAL_TERMINOLOGY_HINT,
  });
}

// Analyze consultation transcript using GPT-5
export async function analyzeConsultation(transcript: string, apiKey: string, env?: Record<string, any>): Promise<AIAnalysisResult> {
  const config = getAIConfig(env || {});

  const systemPrompt = `당신은 대한민국 최고 수준의 치과/의료 상담 분석 전문가이며, 페이션트 퍼널(Patient Funnel) 상담 코칭 시스템에 정통합니다.

## 당신의 역할
상담 녹음 스크립트를 분석하여 상담사(코디네이터)의 상담 역량을 정밀 평가하고, 환자의 심리 상태를 깊이 있게 파악하여 실질적으로 도움이 되는 코칭 피드백을 제공합니다.

## 페이션트 퍼널 상담 평가 프레임워크
1. **니즈 파악 (Needs Discovery)**: 환자의 표면적 요구 너머 진짜 고민(두려움, 기대, 생활 불편)을 캐치했는가
2. **가치 전달 (Value Delivery)**: 가격이 아닌 '치료를 통해 얻는 삶의 변화'를 전달했는가
3. **이의 처리 (Objection Handling)**: 가격·시간·공포·신뢰 등 이의를 인정→공감→재프레이밍→해결 4단계로 처리했는가
4. **클로징 (Closing)**: 시험 클로징, 양자택일, 다음 단계 유도 등으로 자연스럽게 결정을 이끌었는가

## 분석 시 특별히 주목할 포인트
- 환자가 직접 말하지 않은 숨겨진 니즈 (예: "결혼 앞두고...", "면접 때문에...")
- 결정권자가 본인이 아닌 경우의 대응 전략
- 감정 전환 포인트 (부정→긍정 또는 긍정→부정으로 바뀌는 순간)
- 가격 언급 시 상담사의 프레이밍 기법 사용 여부
- 경쟁 병원 언급 시 차별화 대응 여부

응답은 반드시 아래 JSON 형식으로만 해주세요. 한국어로 작성하세요.`;

  const userPrompt = `다음 상담 스크립트를 페이션트 퍼널 프레임워크로 정밀 분석해주세요:

${transcript}

응답 JSON 형식:
{
  "summary": "상담 핵심 내용 요약 (5-7개 bullet point, 각 줄은 '• '로 시작). 단순 나열이 아닌 인사이트 포함",
  "treatment_type": "진료 항목 (예: 임플란트, 교정, 라미네이트, 보톡스 등)",
  "treatment_area": "치료 부위 (예: #36, #46 또는 상악 전치 등)",
  "amount": 추정 상담 금액 (숫자만, 원 단위),
  "patient_psychology": {
    "fear": "환자가 두려워하는 것 (구체적으로, 예: '발치 시 통증에 대한 공포, 과거 다른 병원에서의 부정적 경험')",
    "hesitation_reason": "미결정 사유 분석 (가격/시간/공포/신뢰/결정권자 등 복합적으로)",
    "decision_factor": "치료 결정 시 가장 중요하게 생각하는 요인",
    "special_event": "특별한 이벤트나 타임라인 (결혼, 취업, 여행 등)",
    "decision_maker": "실결정권자 (본인/배우자/부모 등) + 그 근거",
    "budget": "예상 예산 범위 또는 가격 민감도",
    "hidden_needs": "환자가 직접 말하지 않았지만 추론 가능한 숨겨진 니즈",
    "personality_type": "환자 성향 (신중형/즉흥형/분석형/감성형 등)"
  },
  "emotion_flow": {
    "overall_tone": "전반적 톤 (positive/neutral/negative)",
    "decision_score": 결정 근접도 (1-10, 소수점 가능),
    "timeline": [
      {"time": "시점 설명", "emotion": "감정", "note": "상세 메모", "intensity": -1~1}
    ],
    "turning_points": ["감정이 크게 변한 포인트들"],
    "summary": "감정 변화 전체 흐름 요약 (예: 초반 경계심 → 치료 설명 시 관심↑ → 가격 듣고 망설임 → 할부 설명 후 긍정으로 전환)"
  },
  "key_quotes": ["결정 시그널이 되는 핵심 발언 5개 이내 (환자의 정확한 말 인용)"],
  "feedback": {
    "good_points": ["잘한 점 (구체적 상황과 함께, 3-5개)"],
    "improve_points": [
      {
        "issue": "개선 포인트 (구체적 상황)",
        "suggestion": "이렇게 말했으면 더 좋았을 구체적인 대안 멘트",
        "impact": "이 개선이 가져올 효과"
      }
    ],
    "scores": {
      "needs_identification": 니즈파악점수(0-100),
      "value_delivery": 가치전달점수(0-100),
      "objection_handling": 이의처리점수(0-100),
      "closing": 클로징점수(0-100)
    },
    "total_score": 총점(0-100),
    "grade": "S/A/B/C/D 등급",
    "one_line_coaching": "이 상담사에게 가장 필요한 한 줄 코칭 (예: '가격 제시 전에 가치를 먼저 충분히 쌓으세요')"
  }
}`;

  const result = await callOpenAI({
    apiKey,
    model: config.primaryModel,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.3,
  });

  return {
    transcript,
    summary: result.summary || '',
    treatment_type: result.treatment_type,
    treatment_area: result.treatment_area,
    amount: result.amount,
    patient_psychology: result.patient_psychology || {},
    emotion_flow: result.emotion_flow || {},
    key_quotes: result.key_quotes || [],
    feedback: result.feedback || {},
    decision_score: result.emotion_flow?.decision_score || 5
  };
}

// Generate contact recommendation message using GPT-5-mini
export async function generateContactMessage(
  patientName: string,
  consultationSummary: string,
  taskType: 'closing' | 'proactive',
  patientPsychology: PatientPsychology,
  apiKey: string,
  env?: Record<string, any>
): Promise<{ message: string; points: string[] }> {
  const config = getAIConfig(env || {});

  const systemPrompt = `당신은 페이션트 퍼널(Patient Funnel) CRM 전문가입니다.
환자와의 관계를 '팬'으로 만드는 것이 목표입니다.

## 연락 멘트 작성 핵심 원칙
1. **1:1 맞춤형**: 자동 발송처럼 느껴지면 안 됨. 환자의 구체적 상황을 반드시 언급
2. **심리 기반**: 환자의 두려움/고민을 이해하고 있다는 것을 자연스럽게 전달
3. **비강요적 유도**: "빨리 오세요"가 아닌 "궁금하신 점 있으시면 편하게 연락주세요"
4. **결정권자 고려**: 실결정권자가 배우자/부모인 경우 함께 올 수 있도록 유도
5. **시의적절한 타이밍 언급**: 특별 이벤트가 있다면 역산하여 시작 시점 안내

응답은 반드시 JSON으로.`;

  const taskTypeKorean = taskType === 'closing' ? '클로징 연락 (상담 후 미결정 환자)' : '안부 연락 (관계 유지)';
  
  const userPrompt = `다음 환자에게 전화할 멘트를 작성해주세요:

환자명: ${patientName}
연락 유형: ${taskTypeKorean}
상담 요약: ${consultationSummary}
환자 심리:
- 두려워하는 것: ${patientPsychology.fear || '정보 없음'}
- 미결정 사유: ${patientPsychology.hesitation_reason || '정보 없음'}
- 결정 요인: ${patientPsychology.decision_factor || '정보 없음'}
- 실결정권자: ${patientPsychology.decision_maker || '본인'}
- 숨겨진 니즈: ${(patientPsychology as any).hidden_needs || '정보 없음'}

JSON 형식으로 응답:
{
  "message": "전화 시작 멘트 (2-3문장, 자연스럽고 따뜻하게. 환자 이름과 구체적 상담 내용 언급)",
  "points": ["연락 시 강조할 포인트 1 (구체적 행동 지침)", "포인트 2", "포인트 3"],
  "kakao_message": "카카오톡 발송용 짧은 메시지 (100자 이내)",
  "dont_say": "이 환자에게 절대 하면 안 되는 말 (예: 가격 압박, 시간 촉구 등)"
}`;

  return await callOpenAI({
    apiKey,
    model: config.secondaryModel,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
  });
}

// Analyze audio directly (combined transcription + analysis)
export async function analyzeAudio(audioData: ArrayBuffer, apiKey: string, env?: Record<string, any>): Promise<AIAnalysisResult> {
  const config = getAIConfig(env || {});
  
  // Step 1: Transcribe with gpt-4o-transcribe (치과 전문용어 힌트 포함)
  const transcript = await transcribeAudio(audioData, apiKey, env);
  
  // Step 2: Analyze with gpt-5
  const analysis = await analyzeConsultation(transcript, apiKey, env);
  
  return analysis;
}
