-- v8.2: AI 분석 → 팔로업 태스크 자동 연결
-- 태스크 출처 추적 (manual: 수동, auto_rule: 규칙 기반 자동, ai_analysis: AI 상담 분석 기반)
ALTER TABLE contact_tasks ADD COLUMN origin TEXT DEFAULT 'manual';

-- AI가 이 연락을 추천한 근거 (decision_prediction 요약)
ALTER TABLE contact_tasks ADD COLUMN ai_reason TEXT;

-- 상담별 태스크 조회 인덱스 (리포트 페이지에서 팔로업 상태 확인용)
CREATE INDEX IF NOT EXISTS idx_contact_tasks_consultation ON contact_tasks(consultation_id, status);
