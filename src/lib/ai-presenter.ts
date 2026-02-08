// AI Presenter Module - Enhanced AI Analysis for Real-time STT + Report Generation
import type { AIAnalysisResult, PatientPsychology, EmotionFlow, ConsultationFeedback } from '../types';

// Types for Presenter
export interface DiarizedSegment {
  speaker: 'consultant' | 'patient' | 'unknown';
  text: string;
  start: number; // seconds
  end: number;
  emotion?: number; // -1 to +1
  confidence?: number;
}

export interface NERExtracted {
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
}

export interface RealtimeHint {
  type: 'pricing' | 'objection' | 'closing' | 'rapport' | 'spin' | 'warning';
  message: string;
  trigger_text?: string;
  timestamp: number;
}

// ============================================
// Real-time STT with Whisper
// ============================================

export async function transcribeChunk(
  audioData: ArrayBuffer, 
  apiKey: string,
  language: string = 'ko'
): Promise<string> {
  const formData = new FormData();
  const blob = new Blob([audioData], { type: 'audio/webm' });
  formData.append('file', blob, 'chunk.webm');
  formData.append('model', 'whisper-1');
  formData.append('language', language);
  formData.append('response_format', 'text');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}` },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Transcription failed: ${await response.text()}`);
  }

  return await response.text();
}

// High-quality transcription with timestamps (for final processing)
export async function transcribeWithTimestamps(
  audioData: ArrayBuffer,
  apiKey: string
): Promise<{ text: string; segments: Array<{ start: number; end: number; text: string }> }> {
  const formData = new FormData();
  const blob = new Blob([audioData], { type: 'audio/webm' });
  formData.append('file', blob, 'recording.webm');
  formData.append('model', 'whisper-1');
  formData.append('language', 'ko');
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'segment');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}` },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Transcription failed: ${await response.text()}`);
  }

  const result = await response.json();
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
// Speaker Diarization (using GPT-4o for now, can be replaced with pyannote)
// ============================================

export async function diarizeSpeakers(
  transcript: string,
  apiKey: string
): Promise<DiarizedSegment[]> {
  const prompt = `다음 상담 스크립트에서 화자를 구분해주세요.
상담사(consultant)와 환자(patient)를 구분하여 JSON 배열로 반환해주세요.

규칙:
1. 상담사: 질문을 하거나, 치료/가격 설명을 하거나, 전문 용어를 사용하는 사람
2. 환자: 고민을 말하거나, 질문에 답하거나, 두려움/걱정을 표현하는 사람
3. 각 발화의 감정도 -1(부정)~+1(긍정) 사이로 평가

스크립트:
${transcript}

JSON 형식:
{
  "segments": [
    {"speaker": "consultant", "text": "발화 내용", "start": 0, "end": 5, "emotion": 0.5},
    {"speaker": "patient", "text": "발화 내용", "start": 5, "end": 12, "emotion": -0.2}
  ]
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    }),
  });

  if (!response.ok) {
    throw new Error(`Diarization failed: ${await response.text()}`);
  }

  const result = await response.json();
  const parsed = JSON.parse(result.choices[0].message.content);
  return parsed.segments || [];
}

// ============================================
// NER (Named Entity Recognition) - 핵심 정보 추출
// ============================================

export async function extractEntities(
  transcript: string,
  apiKey: string
): Promise<NERExtracted> {
  const prompt = `다음 치과/의료 상담 스크립트에서 핵심 정보를 추출해주세요.

스크립트:
${transcript}

JSON 형식으로 추출:
{
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

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    }),
  });

  if (!response.ok) {
    throw new Error(`NER extraction failed`);
  }

  const result = await response.json();
  return JSON.parse(result.choices[0].message.content);
}

// ============================================
// Real-time Hints Generation
// ============================================

export async function generateRealtimeHint(
  recentTranscript: string,
  context: { 
    priceDiscussed?: boolean;
    objectionDetected?: string;
    emotionTrend?: 'rising' | 'falling' | 'stable';
  },
  apiKey: string
): Promise<RealtimeHint | null> {
  const prompt = `당신은 실시간 상담 코칭 AI입니다. 
최근 대화를 분석하여 상담사에게 즉시 도움이 될 힌트를 제공하세요.

최근 대화:
${recentTranscript}

컨텍스트:
- 가격 언급 여부: ${context.priceDiscussed ? '있음' : '없음'}
- 이의/반론 감지: ${context.objectionDetected || '없음'}
- 감정 추세: ${context.emotionTrend || 'stable'}

힌트가 필요하면 JSON으로 반환, 불필요하면 {"hint": null}:
{
  "hint": {
    "type": "pricing|objection|closing|rapport|spin|warning",
    "message": "상담사에게 보여줄 짧은 힌트 (1-2문장)"
  }
}

힌트 예시:
- pricing: "분납 옵션 안내 타이밍입니다"
- objection: "가격 이의 → 가치 재강조 필요"
- closing: "결정 시그널 감지! 다음 단계 유도하세요"
- warning: "환자 감정 하락 감지, 공감 표현 필요"`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        response_format: { type: 'json_object' },
        max_tokens: 200
      }),
    });

    if (!response.ok) return null;

    const result = await response.json();
    const parsed = JSON.parse(result.choices[0].message.content);
    return parsed.hint;
  } catch {
    return null;
  }
}

// ============================================
// SPIN Analysis (상담 기법 분석)
// ============================================

export async function analyzeSPIN(
  diarizedSegments: DiarizedSegment[],
  apiKey: string
): Promise<SPINAnalysis> {
  const consultantQuestions = diarizedSegments
    .filter(s => s.speaker === 'consultant' && s.text.includes('?'))
    .map(s => s.text);

  const prompt = `다음 상담사 질문들을 SPIN 화법 관점에서 분석해주세요.

SPIN 화법:
- Situation(상황): 현재 상태 파악 질문 (예: "지금 어디가 불편하세요?")
- Problem(문제): 문제/고민 발굴 질문 (예: "언제부터 아프셨어요?")
- Implication(암시): 문제의 영향 확대 질문 (예: "치료 안 하시면 더 악화될 수 있는데...")
- Need-payoff(필요-보상): 해결책 가치 강조 질문 (예: "이렇게 하시면 편하게 드실 수 있으세요")

상담사 질문들:
${consultantQuestions.join('\n')}

JSON 형식:
{
  "situation_questions": ["S 유형 질문들"],
  "problem_questions": ["P 유형 질문들"],
  "implication_questions": ["I 유형 질문들"],
  "need_payoff_questions": ["N 유형 질문들"],
  "spin_score": 0~100점,
  "spin_feedback": "SPIN 활용도 종합 피드백"
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    }),
  });

  if (!response.ok) {
    throw new Error('SPIN analysis failed');
  }

  const result = await response.json();
  return JSON.parse(result.choices[0].message.content);
}

// ============================================
// Full Consultation Report Generation
// ============================================

export async function generateConsultationReport(
  transcript: string,
  diarizedSegments: DiarizedSegment[],
  nerData: NERExtracted,
  spinAnalysis: SPINAnalysis,
  patientInfo: { name: string; age?: number; gender?: string; previousHistory?: string },
  apiKey: string
): Promise<ConsultationReport> {
  const systemPrompt = `당신은 의료 상담 분석 전문가입니다. Patient Code 방법론에 정통합니다.

Patient Code 상담 평가 기준:
1. 라포 형성 (20점): 첫인사, 이름 호칭, 공감 표현, 눈높이 맞춤
2. SPIN 활용 (25점): 상황-문제-암시-필요보상 질문 기법
3. 반론 처리 (20점): 인정-공감-재프레이밍-해결책 4단계
4. 가격 프레이밍 (15점): 앵커링, 분납 안내 타이밍, 가치 대비 가격 제시
5. 클로징 (10점): 시험 클로징, 대안 제시, 다음 단계 유도
6. 전체 구조 (10점): 도입-본론-마무리 흐름

당신의 응답은 상담사에게 실질적으로 도움이 되어야 합니다.
코칭 피드백은 구체적이고 액션 가능해야 합니다.`;

  const userPrompt = `다음 상담 데이터를 분석하여 종합 레포트를 생성해주세요.

## 환자 정보
- 이름: ${patientInfo.name}
- 나이: ${patientInfo.age || '미상'}
- 성별: ${patientInfo.gender === 'male' ? '남성' : patientInfo.gender === 'female' ? '여성' : '미상'}
- 이전 내원 이력: ${patientInfo.previousHistory || '없음'}

## 화자 분리된 대화
${diarizedSegments.map(s => `[${s.speaker === 'consultant' ? '상담사' : '환자'}] ${s.text}`).join('\n')}

## 추출된 정보 (NER)
- 진료 항목: ${nerData.treatment_type || '미확인'}
- 치료 부위: ${nerData.treatment_area || '미확인'}
- 언급 금액: ${nerData.mentioned_prices?.join(', ') || '없음'}원
- 논의 금액: ${nerData.discussed_amount || '미확인'}원
- 결제 언급: ${nerData.payment_mentions?.join(', ') || '없음'}
- 환자 우려: ${nerData.concerns?.join(', ') || '없음'}
- 결정권자: ${nerData.decision_maker || '본인'}

## SPIN 분석 결과
- SPIN 점수: ${spinAnalysis.spin_score}점
- 피드백: ${spinAnalysis.spin_feedback}

## 출력 JSON 형식
{
  "patient_summary": "환자 정보 + 이번 상담 목적 요약 (2-3줄)",
  "consultation_summary": "상담 핵심 내용 요약 (5-7 bullet points, 각 '• '로 시작)",
  "treatment_options": [
    {
      "name": "치료명",
      "price": 금액(숫자),
      "duration": "예상 기간",
      "pros": ["장점1", "장점2"],
      "cons": ["단점/주의사항"],
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
    {"concern": "우려사항", "addressed": true/false, "resolution": "해소 방법"}
  ],
  "emotion_timeline": [
    {"timestamp": 초, "score": -1~+1, "note": "감정 메모", "highlight": true/false, "speaker": "patient"}
  ],
  "emotion_summary": "감정 변화 한 줄 요약",
  "overall_sentiment": "very_positive|positive|neutral|negative|very_negative",
  "decision_factors": {
    "main_concern": "핵심 고민",
    "decision_maker": "결정권자",
    "budget_range": "예산 범위",
    "timeline": "결정 예상 시기"
  },
  "decision_score": 1-10,
  "decision_prediction": "결정 예측 및 근거 (2-3줄)",
  "next_actions": [
    {"action": "해야 할 일", "due_date": "날짜", "priority": "high|medium|low"}
  ],
  "recommended_followup_date": "권장 팔로업 날짜",
  "followup_message": "팔로업 시 추천 멘트",
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
    "strengths": ["잘한 점 1", "잘한 점 2"],
    "improvements": [
      {"issue": "개선점", "suggestion": "구체적 제안", "example": "예시 멘트"}
    ],
    "patient_code_evaluation": "Patient Code 관점 종합 평가 (3-4줄)"
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
      response_format: { type: 'json_object' },
      max_tokens: 4000
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Report generation failed: ${error}`);
  }

  const result = await response.json();
  return JSON.parse(result.choices[0].message.content);
}

// ============================================
// Treatment Proposal (환자용 제안서) Generation
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
  apiKey: string
): Promise<ProposalContent> {
  const prompt = `다음 상담 레포트를 기반으로 환자에게 보낼 치료 제안서 내용을 생성해주세요.

환자명: ${patientName}
병원명: ${hospitalName}
상담사: ${consultantName}

상담 요약:
${report.consultation_summary}

치료 옵션:
${JSON.stringify(report.treatment_options, null, 2)}

논의 금액: ${report.discussed_amount}원

환자 우려사항:
${report.patient_concerns.map(c => `- ${c.concern}: ${c.addressed ? '해소됨' : '미해소'}`).join('\n')}

JSON 형식으로 제안서 내용 생성:
{
  "title": "제안서 제목 (예: 김민수님을 위한 맞춤 치료 안내)",
  "greeting_message": "따뜻한 인사말 (2-3줄, 환자 상황 언급)",
  "selected_options": [
    {
      "name": "치료명",
      "price": 금액,
      "duration": "기간",
      "benefits": ["환자 관점 혜택 3개"],
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
  "closing_message": "마무리 메시지 (결정 독촉 없이 따뜻하게)"
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    }),
  });

  if (!response.ok) {
    throw new Error('Proposal generation failed');
  }

  const result = await response.json();
  return JSON.parse(result.choices[0].message.content);
}

// ============================================
// Full Analysis Pipeline (End-to-End)
// ============================================

export async function runFullAnalysisPipeline(
  audioData: ArrayBuffer,
  patientInfo: { name: string; age?: number; gender?: string; previousHistory?: string },
  apiKey: string
): Promise<{
  transcript: string;
  diarizedSegments: DiarizedSegment[];
  nerData: NERExtracted;
  spinAnalysis: SPINAnalysis;
  report: ConsultationReport;
}> {
  // Step 1: Transcribe with timestamps
  console.log('[Pipeline] Step 1: Transcribing audio...');
  const { text: transcript } = await transcribeWithTimestamps(audioData, apiKey);
  
  // Step 2: Diarize speakers
  console.log('[Pipeline] Step 2: Diarizing speakers...');
  const diarizedSegments = await diarizeSpeakers(transcript, apiKey);
  
  // Step 3: Extract entities (NER)
  console.log('[Pipeline] Step 3: Extracting entities...');
  const nerData = await extractEntities(transcript, apiKey);
  
  // Step 4: Analyze SPIN
  console.log('[Pipeline] Step 4: Analyzing SPIN...');
  const spinAnalysis = await analyzeSPIN(diarizedSegments, apiKey);
  
  // Step 5: Generate full report
  console.log('[Pipeline] Step 5: Generating report...');
  const report = await generateConsultationReport(
    transcript,
    diarizedSegments,
    nerData,
    spinAnalysis,
    patientInfo,
    apiKey
  );
  
  return {
    transcript,
    diarizedSegments,
    nerData,
    spinAnalysis,
    report
  };
}
