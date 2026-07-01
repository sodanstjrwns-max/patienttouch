-- v8.0: Reliable Recording & Async Analysis
-- 세그먼트 업로드 추적 + 비동기 분석 진행 상태

-- 분석 진행 단계 추적 컬럼
ALTER TABLE consultations ADD COLUMN analysis_step TEXT DEFAULT NULL;
-- 값: uploading | transcribing | diarizing | extracting | reporting | done | failed:<step>

-- 분석 에러 메시지 (재분석 안내용)
ALTER TABLE consultations ADD COLUMN analysis_error TEXT DEFAULT NULL;

-- 녹음 세그먼트 수 (세그먼트 방식 녹음)
ALTER TABLE consultations ADD COLUMN segment_count INTEGER DEFAULT 0;

-- stt_chunks 테이블은 0002에서 이미 생성됨 — 세그먼트 오디오 추적에 재활용
-- (audio_url: R2 세그먼트 경로, chunk_index: 세그먼트 순번, transcript: 세그먼트별 STT 결과)

-- 점수-매출 상관 분석용 인덱스
CREATE INDEX IF NOT EXISTS idx_reports_coaching_score ON consultation_reports(organization_id, coaching_score);
CREATE INDEX IF NOT EXISTS idx_consultations_user_status ON consultations(organization_id, user_id, status, consultation_date);
