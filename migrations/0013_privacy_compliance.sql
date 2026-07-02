-- v8.6: 개인정보/의료정보 컴플라이언스
-- 1) 녹음 동의 추적  2) 감사 로그  3) 환자 익명화 플래그

-- 상담별 녹음 동의 기록
ALTER TABLE consultations ADD COLUMN recording_consent INTEGER DEFAULT 0; -- 0=미확인, 1=구두동의 확인
ALTER TABLE consultations ADD COLUMN consent_at TEXT; -- 동의 확인 시각
ALTER TABLE consultations ADD COLUMN consent_by TEXT; -- 동의 확인한 직원 user_id

-- 환자 익명화 (완전삭제 요청 처리 후)
ALTER TABLE patients ADD COLUMN anonymized INTEGER DEFAULT 0;
ALTER TABLE patients ADD COLUMN anonymized_at TEXT;

-- 개인정보 접근/처리 감사 로그
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  user_id TEXT,
  user_name TEXT, -- 스냅샷 (사용자 삭제 후에도 로그 보존)
  action TEXT NOT NULL, -- transcript_view / transcript_search / patient_erase / retention_purge / consent_recorded / audio_play
  target_type TEXT, -- patient / consultation / organization
  target_id TEXT,
  details TEXT DEFAULT '{}', -- JSON: 부가 정보
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org_time ON audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id);
