// ============================================
// 터치 리포트 (Touch Report) — 환자용 상담 보고서 생성 엔진
// 제품 3원칙: 1.정확함 2.예쁨 3.간편함
//
// 정확성 설계:
//  - 근거 기반 생성(Grounded Generation): 모든 문장에 녹취 인용 근거 필수
//  - 숫자 이중 검증: 생성 1콜 + 검증 1콜 분리
//  - 금칙어 필터: 의료광고법 방어 (생성 후 + 발송 직전 2회)
// ============================================

import { getAIConfig, callOpenAI } from './ai-config';

// ---------- 타입 ----------

export interface ReportTreatmentOption {
  name: string;
  duration: string;        // 예: "약 3개월"
  visit_count: string;     // 예: "4~5회"
  cost: string;            // 예: "180만원" — 녹취에 언급된 그대로
  pros: string[];
  considerations: string[];
  evidence_quote: string;  // 근거 녹취 인용
}

export interface ReportQnA {
  question: string;
  answer: string;
  evidence_quote: string;
}

export interface TouchReportContent {
  patient_name: string;
  consultation_date: string;
  summary: string[];                    // 오늘의 요약 3~4문장
  summary_evidence: string[];           // 문장별 근거 인용
  oral_status: {
    description: string;
    mentioned_teeth: string[];          // FDI 표기 예: ["16","17","26"] — 언급된 것만
    evidence_quote: string;
  } | null;
  treatment_options: ReportTreatmentOption[];
  qna: ReportQnA[];
  next_steps: {
    guidance: string;
    preparation: string[];
    evidence_quote: string;
  } | null;
}

export interface ReportFlag {
  path: string;            // 예: "treatment_options[0].cost"
  label: string;           // 사람이 읽는 항목명
  value: string;
  reason: string;          // 왜 확인이 필요한가
  quote: string;           // 관련 녹취 인용 (없으면 '')
}

export interface BannedHit {
  word: string;
  path: string;
  suggestion: string;
}

export interface TouchReportResult {
  content: TouchReportContent;
  flags: ReportFlag[];
  bannedHits: BannedHit[];
  generationModel: string;
  verifyModel: string;
}

// ---------- 금칙어 (의료광고법 방어) ----------

const DEFAULT_BANNED_WORDS: Array<{ word: string; suggestion: string }> = [
  { word: '최고', suggestion: '우수한' },
  { word: '최상', suggestion: '높은 수준의' },
  { word: '최첨단', suggestion: '현대적인' },
  { word: '무통', suggestion: '통증 부담을 줄인' },
  { word: '완벽', suggestion: '꼼꼼한' },
  { word: '100%', suggestion: '높은 확률로' },
  { word: '보장', suggestion: '기대할 수 있음' },
  { word: '부작용 없', suggestion: '부작용 가능성을 낮춘' },
  { word: '유일한', suggestion: '드문' },
  { word: '전혀 아프지 않', suggestion: '통증 부담을 줄인' },
  { word: '영구적', suggestion: '장기간 유지되는' },
  { word: '즉시 효과', suggestion: '빠른 개선을 기대' },
];

export function scanBannedWords(
  content: TouchReportContent,
  extraWords?: Array<{ word: string; suggestion: string }>
): BannedHit[] {
  const dict = [...DEFAULT_BANNED_WORDS, ...(extraWords || [])];
  const hits: BannedHit[] = [];

  const scan = (text: string, path: string) => {
    if (!text) return;
    for (const { word, suggestion } of dict) {
      if (text.includes(word)) {
        hits.push({ word, path, suggestion });
      }
    }
  };

  content.summary?.forEach((s, i) => scan(s, `summary[${i}]`));
  if (content.oral_status) scan(content.oral_status.description, 'oral_status.description');
  content.treatment_options?.forEach((opt, i) => {
    scan(opt.name, `treatment_options[${i}].name`);
    opt.pros?.forEach((p, j) => scan(p, `treatment_options[${i}].pros[${j}]`));
    opt.considerations?.forEach((p, j) => scan(p, `treatment_options[${i}].considerations[${j}]`));
  });
  content.qna?.forEach((q, i) => {
    scan(q.answer, `qna[${i}].answer`);
  });
  if (content.next_steps) scan(content.next_steps.guidance, 'next_steps.guidance');

  return hits;
}

// ---------- 1단계: 근거 기반 보고서 생성 ----------

const GENERATION_SYSTEM_PROMPT = `당신은 치과 상담 녹취록을 환자용 상담 보고서로 변환하는 전문 메디컬 라이터입니다.

## 절대 규칙 (위반 시 심각한 의료 분쟁 발생)
1. 녹취록에 없는 내용은 절대 쓰지 않는다. 추론 금지, 일반론 삽입 금지, 보완 설명 금지.
2. 모든 항목에는 근거가 된 녹취 원문 인용(evidence_quote)을 반드시 붙인다. 인용은 녹취록에서 그대로 복사한다.
3. 근거를 찾을 수 없는 항목은 생성하지 말고 비워둔다 (null 또는 빈 배열).
4. 비용/기간/횟수 숫자는 녹취에 언급된 표현 그대로 쓴다. 반올림, 환산, 추정 금지.
5. 상담에서 다루지 않은 섹션은 null로 둔다.

## 문체 규칙
- 독자는 환자 본인과 환자의 가족이다. 배우자에게 그대로 보여줄 설득 자료다.
- 전문용어는 쉬운 말로 풀되, 정확성을 해치지 않는다. (예: "크라운(치아 전체를 감싸는 보철물)")
- 존댓말, 따뜻하지만 과장 없는 톤.
- 다음 표현 금지: 최고, 최상, 무통, 완벽, 100%, 보장, 부작용 없음 등 단정적/과장 표현.

## 치식 표기
- 녹취에서 특정 치아가 언급되면 FDI 2자리 표기로 mentioned_teeth에 넣는다 (예: 오른쪽 위 어금니 → "16" 또는 "17").
- 애매하면 넣지 않는다.

## 출력 (JSON만)
{
  "summary": ["문장1", "문장2", "문장3"],
  "summary_evidence": ["문장1의 근거 녹취 인용", "문장2의 근거", "문장3의 근거"],
  "oral_status": { "description": "...", "mentioned_teeth": ["16"], "evidence_quote": "..." } 또는 null,
  "treatment_options": [
    { "name": "...", "duration": "...", "visit_count": "...", "cost": "...", "pros": ["..."], "considerations": ["..."], "evidence_quote": "..." }
  ],
  "qna": [ { "question": "환자가 물어본 것", "answer": "의료진 답변 요약", "evidence_quote": "..." } ],
  "next_steps": { "guidance": "...", "preparation": ["..."], "evidence_quote": "..." } 또는 null
}
- duration/visit_count/cost가 녹취에 없으면 빈 문자열 ""로 둔다. 지어내지 않는다.`;

// ---------- 2단계: 숫자 이중 검증 ----------

const VERIFY_SYSTEM_PROMPT = `당신은 의료 문서 검증 감사관입니다. 생성된 환자용 보고서의 모든 숫자·사실 항목을 녹취 원문과 대조합니다.

## 검증 대상
1. 비용, 기간, 내원 횟수 등 모든 숫자
2. 치료명과 치식(치아 번호)
3. 근거 인용(evidence_quote)이 실제 녹취록에 존재하는지

## 판정 기준
- verified: 녹취 원문에서 동일한 내용을 확인함
- flag: 녹취에서 확인 불가, 불일치, 인용이 조작됨, 또는 모호함

## 출력 (JSON만)
{
  "checks": [
    { "path": "treatment_options[0].cost", "label": "임플란트 비용", "value": "180만원", "verdict": "verified" 또는 "flag", "reason": "판정 이유", "quote": "관련 녹취 인용 또는 빈 문자열" }
  ]
}
- 보고서의 모든 숫자 항목 + 치료명을 빠짐없이 검사한다.
- 조금이라도 애매하면 flag로 판정한다. 과잉 flag가 누락보다 낫다.`;

// ---------- 파이프라인 ----------

// v9.1: 1단계 — 근거 기반 생성 (primary model). poll-to-advance에서 단독 호출 가능
export async function generateReportContentStep(params: {
  transcript: string;
  patientName: string;
  consultationDate: string;
  apiKey: string;
  env?: Record<string, any>;
}): Promise<TouchReportContent> {
  const { transcript, patientName, consultationDate, apiKey, env } = params;
  const config = getAIConfig(env || {});
  console.log('[TouchReport] Generating with', config.primaryModel);
  const generated = await callOpenAI({
    apiKey,
    model: config.primaryModel,
    messages: [
      { role: 'system', content: GENERATION_SYSTEM_PROMPT },
      { role: 'user', content: `환자 이름: ${patientName}\n상담일: ${consultationDate}\n\n=== 상담 녹취록 ===\n${transcript}` },
    ],
    jsonMode: true,
    maxTokens: 16384,
  });
  return {
    patient_name: patientName,
    consultation_date: consultationDate,
    summary: Array.isArray(generated.summary) ? generated.summary : [],
    summary_evidence: Array.isArray(generated.summary_evidence) ? generated.summary_evidence : [],
    oral_status: generated.oral_status || null,
    treatment_options: Array.isArray(generated.treatment_options) ? generated.treatment_options : [],
    qna: Array.isArray(generated.qna) ? generated.qna : [],
    next_steps: generated.next_steps || null,
  };
}

// v9.1: 2단계 — 숫자 이중 검증 (secondary model). 실패 시 안전 우선 flag 전량 생성
export async function verifyReportContentStep(
  content: TouchReportContent,
  transcript: string,
  apiKey: string,
  env?: Record<string, any>
): Promise<ReportFlag[]> {
  const config = getAIConfig(env || {});
  console.log('[TouchReport] Verifying with', config.secondaryModel);
  try {
    const verification = await callOpenAI({
      apiKey,
      model: config.secondaryModel,
      messages: [
        { role: 'system', content: VERIFY_SYSTEM_PROMPT },
        { role: 'user', content: `=== 생성된 보고서 ===\n${JSON.stringify(content, null, 2)}\n\n=== 상담 녹취 원문 ===\n${transcript}` },
      ],
      jsonMode: true,
      maxTokens: 16384,
    });
    const checks: any[] = Array.isArray(verification.checks) ? verification.checks : [];
    return checks
      .filter((ch) => ch.verdict === 'flag')
      .map((ch) => ({
        path: String(ch.path || ''),
        label: String(ch.label || ch.path || '항목'),
        value: String(ch.value || ''),
        reason: String(ch.reason || '녹취 원문에서 확인할 수 없습니다'),
        quote: String(ch.quote || ''),
      }));
  } catch (err: any) {
    // 검증 콜 실패 시: 안전 우선 — 모든 숫자 항목을 flag 처리하여 실장 확인 강제
    console.error('[TouchReport] Verification call failed:', err?.message);
    return content.treatment_options.flatMap((opt, i) => {
      const f: ReportFlag[] = [];
      if (opt.cost) f.push({ path: `treatment_options[${i}].cost`, label: `${opt.name} 비용`, value: opt.cost, reason: '자동 검증 실패 — 수동 확인 필요', quote: opt.evidence_quote || '' });
      if (opt.duration) f.push({ path: `treatment_options[${i}].duration`, label: `${opt.name} 기간`, value: opt.duration, reason: '자동 검증 실패 — 수동 확인 필요', quote: opt.evidence_quote || '' });
      if (opt.visit_count) f.push({ path: `treatment_options[${i}].visit_count`, label: `${opt.name} 내원 횟수`, value: opt.visit_count, reason: '자동 검증 실패 — 수동 확인 필요', quote: opt.evidence_quote || '' });
      return f;
    });
  }
}

export async function generateTouchReport(params: {
  transcript: string;
  patientName: string;
  consultationDate: string;
  apiKey: string;
  env?: Record<string, any>;
  extraBannedWords?: Array<{ word: string; suggestion: string }>;
}): Promise<TouchReportResult> {
  const { transcript, patientName, consultationDate, apiKey, env, extraBannedWords } = params;
  const config = getAIConfig(env || {});

  const content = await generateReportContentStep({ transcript, patientName, consultationDate, apiKey, env });
  const flags = await verifyReportContentStep(content, transcript, apiKey, env);
  const bannedHits = scanBannedWords(content, extraBannedWords);

  return {
    content,
    flags,
    bannedHits,
    generationModel: config.primaryModel,
    verifyModel: config.secondaryModel,
  };
}

// ---------- 유틸 ----------

// URL용 추측 불가능 토큰 (Web Crypto)
export function generateReportToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

// content_json 내 path 기반 값 수정 (인라인 검수 수정용)
export function setContentByPath(content: any, path: string, value: any): { before: any } {
  const tokens = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let node = content;
  for (let i = 0; i < tokens.length - 1; i++) {
    if (node == null) throw new Error(`잘못된 경로: ${path}`);
    node = node[tokens[i]];
  }
  const last = tokens[tokens.length - 1];
  if (node == null) throw new Error(`잘못된 경로: ${path}`);
  const before = node[last];
  node[last] = value;
  return { before };
}
