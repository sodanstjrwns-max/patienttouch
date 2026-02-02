// AI Analysis Module - OpenAI Integration
import type { AIAnalysisResult, PatientPsychology, EmotionFlow, ConsultationFeedback } from '../types';

// Transcribe audio using OpenAI Whisper
export async function transcribeAudio(audioData: ArrayBuffer, apiKey: string): Promise<string> {
  const formData = new FormData();
  const blob = new Blob([audioData], { type: 'audio/webm' });
  formData.append('file', blob, 'recording.webm');
  formData.append('model', 'whisper-1');
  formData.append('language', 'ko');
  formData.append('response_format', 'text');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Transcription failed: ${error}`);
  }

  return await response.text();
}

// Analyze consultation transcript using GPT-4
export async function analyzeConsultation(transcript: string, apiKey: string): Promise<AIAnalysisResult> {
  const systemPrompt = `당신은 치과/피부과/성형외과 상담 분석 전문가입니다. 
상담 스크립트를 분석하여 다음 정보를 JSON 형식으로 추출해주세요.

분석 시 페이션트 퍼널의 상담 기술 프레임워크를 적용합니다:
- 니즈 파악: 환자의 진짜 고민과 원하는 것을 파악했는가
- 가치 전달: 치료의 가치를 효과적으로 전달했는가
- 이의 처리: 가격/시간/공포 등 이의를 적절히 처리했는가
- 클로징: 다음 단계(결제/재방문/연락)로 유도했는가

응답은 반드시 아래 JSON 형식으로만 해주세요:`;

  const userPrompt = `다음 상담 스크립트를 분석해주세요:

${transcript}

응답 JSON 형식:
{
  "summary": "상담 핵심 내용 요약 (5-7개 bullet point, 각 줄은 '• '로 시작)",
  "treatment_type": "진료 항목 (예: 임플란트, 교정, 라미네이트, 보톡스 등)",
  "treatment_area": "치료 부위 (예: #36, #46 또는 상악 전치 등)",
  "amount": 추정 상담 금액 (숫자만, 원 단위),
  "patient_psychology": {
    "fear": "환자가 두려워하는 것",
    "hesitation_reason": "미결정 사유 (가격/시간/공포/신뢰 등)",
    "decision_factor": "치료 결정 시 중요하게 생각하는 요인",
    "special_event": "특별한 이벤트 (결혼, 취업 등)",
    "decision_maker": "실결정권자 (본인/배우자/부모 등)",
    "budget": "예상 예산 범위"
  },
  "emotion_flow": {
    "overall_tone": "전반적 톤 (positive/neutral/negative)",
    "decision_score": 결정 근접도 (1-10),
    "timeline": [
      {"time": "시작 시점", "emotion": "감정", "note": "메모"}
    ],
    "summary": "감정 변화 요약 (예: 초반 긴장 → 중반 관심↑ → 후반 긍정)"
  },
  "key_quotes": ["결정 시그널이 되는 핵심 발언 1", "핵심 발언 2"],
  "feedback": {
    "good_points": ["잘한 점 1", "잘한 점 2"],
    "improve_points": [
      {"issue": "개선 포인트", "suggestion": "구체적인 대안 멘트"}
    ],
    "scores": {
      "needs_identification": 니즈파악점수(0-100),
      "value_delivery": 가치전달점수(0-100),
      "objection_handling": 이의처리점수(0-100),
      "closing": 클로징점수(0-100)
    },
    "total_score": 총점(0-100)
  }
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Analysis failed: ${error}`);
  }

  const result = await response.json();
  const content = result.choices[0].message.content;
  
  try {
    const analysis = JSON.parse(content);
    return {
      transcript,
      summary: analysis.summary || '',
      treatment_type: analysis.treatment_type,
      treatment_area: analysis.treatment_area,
      amount: analysis.amount,
      patient_psychology: analysis.patient_psychology || {},
      emotion_flow: analysis.emotion_flow || {},
      key_quotes: analysis.key_quotes || [],
      feedback: analysis.feedback || {},
      decision_score: analysis.emotion_flow?.decision_score || 5
    };
  } catch (e) {
    console.error('Failed to parse AI response:', content);
    throw new Error('Failed to parse AI analysis result');
  }
}

// Generate contact recommendation message
export async function generateContactMessage(
  patientName: string,
  consultationSummary: string,
  taskType: 'closing' | 'proactive',
  patientPsychology: PatientPsychology,
  apiKey: string
): Promise<{ message: string; points: string[] }> {
  const systemPrompt = `당신은 의료 상담사를 위한 환자 연락 멘트 가이드를 작성하는 전문가입니다.
페이션트 퍼널의 CRM 철학에 따라 진정성 있는 연락 멘트를 제안합니다.

핵심 원칙:
- 자동 발송 같은 느낌이 아닌, 1:1 맞춤형 멘트
- 환자의 고민과 상황을 반영
- 강요하지 않으면서 자연스럽게 유도`;

  const taskTypeKorean = taskType === 'closing' ? '클로징 연락 (상담 후 미결정 환자)' : '안부 연락 (관계 유지)';
  
  const userPrompt = `다음 환자에게 연락할 멘트를 작성해주세요:

환자명: ${patientName}
연락 유형: ${taskTypeKorean}
상담 요약: ${consultationSummary}
환자 심리:
- 두려워하는 것: ${patientPsychology.fear || '정보 없음'}
- 미결정 사유: ${patientPsychology.hesitation_reason || '정보 없음'}
- 결정 요인: ${patientPsychology.decision_factor || '정보 없음'}
- 실결정권자: ${patientPsychology.decision_maker || '본인'}

JSON 형식으로 응답:
{
  "message": "전화 시작 멘트 (2-3문장)",
  "points": ["연락 시 강조할 포인트 1", "포인트 2", "포인트 3"]
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate contact message');
  }

  const result = await response.json();
  return JSON.parse(result.choices[0].message.content);
}

// Analyze audio directly (combined transcription + analysis)
export async function analyzeAudio(audioData: ArrayBuffer, apiKey: string): Promise<AIAnalysisResult> {
  // Step 1: Transcribe
  const transcript = await transcribeAudio(audioData, apiKey);
  
  // Step 2: Analyze
  const analysis = await analyzeConsultation(transcript, apiKey);
  
  return analysis;
}
