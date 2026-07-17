-- v9.1: poll-to-advance 분석 파이프라인용 클레임 락
-- 프로덕션 waitUntil 30초 제한 대응 — 폴링 요청이 단계를 전진시키는 구조
ALTER TABLE consultations ADD COLUMN analysis_claim TEXT;
ALTER TABLE consultations ADD COLUMN analysis_claim_at TEXT;
ALTER TABLE touch_reports ADD COLUMN gen_claim TEXT;
ALTER TABLE touch_reports ADD COLUMN gen_claim_at TEXT;
