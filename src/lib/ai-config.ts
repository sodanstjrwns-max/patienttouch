// AI Model Configuration System
// 환경변수로 모델을 교체할 수 있는 중앙 설정 시스템
// 나중에 gpt-5.4 등 신규 모델로 바로 전환 가능

export interface AIModelConfig {
  // 핵심 분석 모델 (상담분석, 리포트생성, 화자분리)
  primaryModel: string;
  // 보조 기능 모델 (NER, SPIN, 실시간힌트, 연락멘트, 제안서)
  secondaryModel: string;
  // 음성인식 모델 (STT)
  transcriptionModel: string;
  // 고급 음성인식 (타임스탬프 포함)
  transcriptionAdvancedModel: string;
}

// 기본 설정: 2026년 3월 기준 최적 조합
const DEFAULT_CONFIG: AIModelConfig = {
  primaryModel: 'gpt-5',
  secondaryModel: 'gpt-5-mini',
  transcriptionModel: 'gpt-4o-transcribe',
  transcriptionAdvancedModel: 'gpt-4o-transcribe',
};

/**
 * 환경변수에서 AI 모델 설정을 로드합니다.
 * 
 * 환경변수:
 * - AI_PRIMARY_MODEL: 핵심 분석 모델 (기본: gpt-5)
 * - AI_SECONDARY_MODEL: 보조 기능 모델 (기본: gpt-5-mini)
 * - AI_TRANSCRIPTION_MODEL: STT 모델 (기본: gpt-4o-transcribe)
 * 
 * 예시 (나중에 업그레이드):
 * - AI_PRIMARY_MODEL=gpt-5.4 → 최신 플래그십 모델로 전환
 * - AI_SECONDARY_MODEL=gpt-5.4-mini → 최신 미니 모델로 전환
 */
export function getAIConfig(env: Record<string, any>): AIModelConfig {
  return {
    primaryModel: env.AI_PRIMARY_MODEL || DEFAULT_CONFIG.primaryModel,
    secondaryModel: env.AI_SECONDARY_MODEL || DEFAULT_CONFIG.secondaryModel,
    transcriptionModel: env.AI_TRANSCRIPTION_MODEL || DEFAULT_CONFIG.transcriptionModel,
    transcriptionAdvancedModel: env.AI_TRANSCRIPTION_MODEL || DEFAULT_CONFIG.transcriptionAdvancedModel,
  };
}

/**
 * 현재 AI 설정을 로그로 출력합니다.
 */
export function logAIConfig(config: AIModelConfig): void {
  console.log('[AI Config] Primary Model:', config.primaryModel);
  console.log('[AI Config] Secondary Model:', config.secondaryModel);
  console.log('[AI Config] Transcription Model:', config.transcriptionModel);
}

/**
 * OpenAI Chat Completions API 호출 헬퍼
 * 재시도 로직 + 에러 핸들링 포함
 */
export async function callOpenAI(params: {
  apiKey: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}): Promise<any> {
  const { apiKey, model, messages, temperature = 0.3, maxTokens, jsonMode = true } = params;

  // GPT-5 계열 감지 (gpt-5, gpt-5-mini, gpt-5.4 등)
  const isGpt5 = model.includes('gpt-5');

  const body: any = {
    model,
    messages,
  };

  // GPT-5 계열: temperature 미지원 (기본값 1만 허용)
  if (!isGpt5 && temperature !== undefined) {
    body.temperature = temperature;
  }

  // GPT-5 계열: response_format json_object 대신 json_schema 사용하거나 생략
  // → GPT-5는 프롬프트에서 JSON을 요청하면 JSON으로 응답하므로, response_format 없이도 작동
  // → json_object가 지원되지 않을 수 있으므로 GPT-5에서는 생략
  if (jsonMode && !isGpt5) {
    body.response_format = { type: 'json_object' };
  }

  if (maxTokens) {
    // GPT-5 계열: max_tokens 대신 max_completion_tokens 사용
    if (isGpt5) {
      body.max_completion_tokens = maxTokens;
    } else {
      body.max_tokens = maxTokens;
    }
  }

  console.log(`[AI Call] Model: ${model}, JSON mode: ${jsonMode}, GPT-5: ${isGpt5}, Messages: ${messages.length}`);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error (${model}): ${response.status} - ${error}`);
  }

  const result: any = await response.json();
  
  // 디버그: 전체 응답 구조 로깅
  const choice = result.choices?.[0];
  const message = choice?.message;
  console.log(`[AI Response] Model: ${model}, finish_reason: ${choice?.finish_reason}, has_content: ${!!message?.content}, has_refusal: ${!!message?.refusal}, content_length: ${message?.content?.length || 0}`);

  // GPT-5 refusal 체크 (거부 응답 처리)
  if (message?.refusal) {
    throw new Error(`OpenAI refused request (${model}): ${message.refusal}`);
  }

  let content = message?.content;

  // content가 null이면 다른 필드에서 추출 시도
  if (!content) {
    // 일부 모델은 function_call이나 tool_calls로 응답할 수 있음
    console.error(`[AI Error] Empty content from ${model}. Full response:`, JSON.stringify(result).substring(0, 500));
    throw new Error(`Empty response from OpenAI (${model}). finish_reason: ${choice?.finish_reason}`);
  }

  // 사용량 로깅
  const usage = result.usage;
  if (usage) {
    console.log(`[AI Usage] ${model}: ${usage.prompt_tokens} in → ${usage.completion_tokens} out (${usage.total_tokens} total)`);
  }

  if (jsonMode) {
    // JSON 파싱 시 content에서 마크다운 코드블록 제거 (GPT-5가 가끔 ```json ... ``` 으로 감쌈)
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();
    
    try {
      return JSON.parse(jsonStr);
    } catch (parseError) {
      console.error(`[AI Parse Error] Failed to parse JSON from ${model}. Content (first 300 chars):`, content.substring(0, 300));
      throw new Error(`Failed to parse JSON response from ${model}: ${(parseError as Error).message}`);
    }
  }
  
  return content;
}

/**
 * OpenAI Audio Transcription API 호출 헬퍼
 */
export async function callTranscription(params: {
  apiKey: string;
  model: string;
  audioData: ArrayBuffer;
  language?: string;
  responseFormat?: string;
  prompt?: string;
}): Promise<any> {
  const { apiKey, model, audioData, language = 'ko', responseFormat = 'text', prompt } = params;

  const formData = new FormData();
  const blob = new Blob([audioData], { type: 'audio/webm' });
  formData.append('file', blob, 'recording.webm');
  formData.append('model', model);
  formData.append('language', language);
  formData.append('response_format', responseFormat);

  // gpt-4o-transcribe에 프롬프트로 전문용어 힌트 제공
  if (prompt) {
    formData.append('prompt', prompt);
  }

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Transcription failed (${model}): ${error}`);
  }

  if (responseFormat === 'verbose_json' || responseFormat === 'json') {
    return await response.json();
  }

  return await response.text();
}

// 치과 전문용어 힌트 (STT 정확도 향상용)
export const DENTAL_TERMINOLOGY_HINT = `치과 상담 녹음입니다. 
전문용어: 임플란트, 크라운, 브릿지, 인레이, 온레이, 라미네이트, 교정, 발치, 스케일링, 
레진, 아말감, 지르코니아, 포세린, 근관치료, 신경치료, 잇몸치료, 치주치료, 
상악, 하악, 전치부, 구치부, 대구치, 소구치, 견치, 절치,
CT, X-ray, 파노라마, CBCT, 디지털 스캔,
분납, 할부, 무이자, 수납, 보험, 비급여, 급여,
상담사, 코디네이터, 원장님, 실장님`;
