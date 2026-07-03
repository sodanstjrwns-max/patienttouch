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

// 기본 설정: 2026년 7월 기준 최적 조합
// - primaryModel: gpt-5.5 (2026-04 출시 최신 플래그십) — 상담분석/리포트/코칭 품질 최우선
// - secondaryModel: gpt-5.4-mini — 보조 기능은 속도/비용 균형
const DEFAULT_CONFIG: AIModelConfig = {
  primaryModel: 'gpt-5.5',
  secondaryModel: 'gpt-5.4-mini',
  transcriptionModel: 'gpt-4o-transcribe',
  transcriptionAdvancedModel: 'gpt-4o-transcribe',
};

/**
 * 환경변수에서 AI 모델 설정을 로드합니다.
 * 
 * 환경변수:
 * - AI_PRIMARY_MODEL: 핵심 분석 모델 (기본: gpt-5.5)
 * - AI_SECONDARY_MODEL: 보조 기능 모델 (기본: gpt-5.4-mini)
 * - AI_TRANSCRIPTION_MODEL: STT 모델 (기본: gpt-4o-transcribe)
 * 
 * 예시 (나중에 업그레이드):
 * - AI_PRIMARY_MODEL=gpt-5.6 → 신규 플래그십 출시 시 바로 전환
 * - AI_SECONDARY_MODEL=gpt-5.6-mini → 신규 미니 모델로 전환
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
 * 재시도 로직 + 타임아웃 + 에러 핸들링 포함
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

  // GPT-5 계열 감지 (gpt-5, gpt-5-mini, gpt-5.4, gpt-5.5 등)
  const isGpt5 = model.includes('gpt-5');
  
  // Fallback 모델 매핑 (최신 모델 장애 시 안정 모델로 자동 전환)
  const fallbackModel = isGpt5
    ? (model.includes('mini') ? 'gpt-5-mini' : 'gpt-5')
    : null;
  // fallback 자체가 실패하면 gpt-4o 계열까지 내려가지 않도록 1단계만 유지
  const isAlreadyFallback = model === 'gpt-5' || model === 'gpt-5-mini';

  const body: any = {
    model,
    messages,
  };

  // GPT-5 계열: temperature 미지원 (기본값 1만 허용)
  if (!isGpt5 && temperature !== undefined) {
    body.temperature = temperature;
  }

  // GPT-5 계열: response_format json_object 대신 json_schema 사용하거나 생략
  if (jsonMode && !isGpt5) {
    body.response_format = { type: 'json_object' };
  }

  if (isGpt5) {
    body.max_completion_tokens = maxTokens ? Math.max(maxTokens, 16384) : 16384;
  } else if (maxTokens) {
    body.max_tokens = maxTokens;
  }

  console.log(`[AI Call] Model: ${model}, JSON mode: ${jsonMode}, GPT-5: ${isGpt5}, Messages: ${messages.length}`);

  // === Retry with exponential backoff ===
  const MAX_RETRIES = 3;
  const TIMEOUT_MS = 180000; // 180 seconds
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        
        // Retryable errors: 429 (rate limit), 500, 502, 503 (server errors)
        if ([429, 500, 502, 503].includes(response.status) && attempt < MAX_RETRIES - 1) {
          const retryAfter = response.headers.get('retry-after');
          const delay = retryAfter 
            ? Math.min(parseInt(retryAfter) * 1000, 30000) 
            : Math.min(1000 * Math.pow(2, attempt), 15000);
          console.warn(`[AI Retry] ${model} returned ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        
        throw new Error(`OpenAI API error (${model}): ${response.status} - ${error}`);
      }

      const result: any = await response.json();
      
      const choice = result.choices?.[0];
      const message = choice?.message;
      console.log(`[AI Response] Model: ${model}, finish_reason: ${choice?.finish_reason}, has_content: ${!!message?.content}, content_length: ${message?.content?.length || 0}`);

      // GPT-5 refusal 체크
      if (message?.refusal) {
        throw new Error(`OpenAI refused request (${model}): ${message.refusal}`);
      }

      let content = message?.content;

      // content가 null 또는 빈 문자열이면 에러 처리
      if (!content || content.trim() === '') {
        const reasoningTokens = result.usage?.completion_tokens_details?.reasoning_tokens || 0;
        console.error(`[AI Error] Empty content from ${model}. reasoning_tokens: ${reasoningTokens}, finish_reason: ${choice?.finish_reason}`);
        
        if (choice?.finish_reason === 'length') {
          throw new Error(`GPT-5 응답 토큰 부족 (reasoning에 ${reasoningTokens}토큰 소비). 다시 시도해주세요.`);
        }
        throw new Error(`Empty response from OpenAI (${model}). finish_reason: ${choice?.finish_reason}`);
      }

      // 사용량 로깅
      const usage = result.usage;
      if (usage) {
        console.log(`[AI Usage] ${model}: ${usage.prompt_tokens} in → ${usage.completion_tokens} out (${usage.total_tokens} total)`);
      }

      if (jsonMode) {
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

    } catch (err: any) {
      lastError = err;
      
      // Timeout (AbortError)
      if (err.name === 'AbortError') {
        console.error(`[AI Timeout] ${model} timed out after ${TIMEOUT_MS}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        if (attempt < MAX_RETRIES - 1) continue;
      }
      
      // Non-retryable errors: break immediately
      if (err.message?.includes('refused') || err.message?.includes('parse')) {
        break;
      }
      
      if (attempt < MAX_RETRIES - 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        console.warn(`[AI Retry] ${model} error: ${err.message?.substring(0, 100)}, retrying in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  // === Fallback to alternative model ===
  if (fallbackModel && lastError && !isAlreadyFallback) {
    console.warn(`[AI Fallback] ${model} failed after ${MAX_RETRIES} attempts. Falling back to ${fallbackModel}`);
    try {
      return await callOpenAI({
        ...params,
        model: fallbackModel,
      });
    } catch (fallbackErr: any) {
      console.error(`[AI Fallback Error] ${fallbackModel} also failed: ${fallbackErr.message?.substring(0, 200)}`);
      throw new Error(`AI 분석 실패: ${model}과 ${fallbackModel} 모두 응답 불가. 원인: ${lastError.message?.substring(0, 100)}`);
    }
  }

  throw lastError || new Error(`AI 분석 실패: ${model} 응답 없음`);
}

/**
 * 오디오 매직 바이트로 실제 포맷 감지 (webm/mp4/wav/ogg/mp3)
 * 브라우저별 MediaRecorder 산출물이 달라(Chrome=webm, iOS Safari=mp4) 확장자 오지정 시 STT 실패
 */
export function sniffAudioFormat(audioData: ArrayBuffer): { ext: string; mime: string } {
  const b = new Uint8Array(audioData.slice(0, 12));
  // EBML (webm/mkv): 1A 45 DF A3
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) {
    return { ext: 'webm', mime: 'audio/webm' };
  }
  // MP4/M4A: 'ftyp' at offset 4
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
    return { ext: 'mp4', mime: 'audio/mp4' };
  }
  // WAV: 'RIFF' .... 'WAVE'
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x41 && b[10] === 0x56 && b[11] === 0x45) {
    return { ext: 'wav', mime: 'audio/wav' };
  }
  // OGG: 'OggS'
  if (b[0] === 0x4f && b[1] === 0x67 && b[2] === 0x67 && b[3] === 0x53) {
    return { ext: 'ogg', mime: 'audio/ogg' };
  }
  // MP3: ID3 tag or frame sync
  if ((b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) {
    return { ext: 'mp3', mime: 'audio/mpeg' };
  }
  return { ext: 'webm', mime: 'audio/webm' };
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

  // 오디오 포맷 자동 감지 (매직 바이트) — OpenAI는 파일 확장자로 포맷을 판별하므로
  // iOS Safari(mp4)·데스크톱(wav 업로드) 등 webm이 아닌 포맷도 정확히 전달해야 함
  const { ext, mime } = sniffAudioFormat(audioData);

  const formData = new FormData();
  const blob = new Blob([audioData], { type: mime });
  formData.append('file', blob, `recording.${ext}`);
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
