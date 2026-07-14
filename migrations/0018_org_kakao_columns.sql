-- 0018: organizations 테이블에 카카오 알림톡 설정 컬럼 추가
-- (src/routes/kakao.ts와 touch-report.ts가 참조하는 컬럼 — 기존 마이그레이션에 누락되어 있었음)
ALTER TABLE organizations ADD COLUMN kakao_api_key TEXT;
ALTER TABLE organizations ADD COLUMN kakao_sender_key TEXT;
ALTER TABLE organizations ADD COLUMN kakao_channel_id TEXT;
