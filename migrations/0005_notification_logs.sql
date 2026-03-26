-- Notification Logs table for KakaoTalk and other messaging channels
CREATE TABLE IF NOT EXISTS notification_logs (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  patient_id TEXT,
  channel TEXT NOT NULL DEFAULT 'kakao', -- kakao, sms, email, clipboard
  template_id TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'prepared', -- prepared, sent, delivered, failed
  metadata TEXT, -- JSON: extra data like proposal_id, urls etc
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_org ON notification_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_patient ON notification_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created ON notification_logs(created_at);

-- Add kakao config columns to organizations (if they don't exist)
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we use a try approach
-- These columns may already exist from previous migrations
