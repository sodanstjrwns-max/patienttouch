-- Patient memo history tracking
CREATE TABLE IF NOT EXISTS patient_memo_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  user_id TEXT,
  user_name TEXT,
  old_memo TEXT,
  new_memo TEXT,
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE INDEX IF NOT EXISTS idx_memo_history_patient ON patient_memo_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_memo_history_org ON patient_memo_history(organization_id);
