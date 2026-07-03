-- v8.7: 도입 문의(리드) 테이블 — /welcome 랜딩페이지 파운더 50 프로모션
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  clinic_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  plan_interest TEXT DEFAULT 'growth',    -- starter / growth / enterprise
  monthly_consultations TEXT,             -- '~40' / '40-120' / '120+'
  message TEXT,
  source TEXT DEFAULT 'landing',          -- landing / referral / education
  status TEXT DEFAULT 'new',              -- new / contacted / demo / won / lost
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status, created_at DESC);
