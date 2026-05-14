-- v7.3: Patient Referral Network
-- Add referrer_patient_id to enable patient-to-patient referral graph visualization.
-- This supports the "Patient Funnel" philosophy: turn patients into fans who bring more patients.

ALTER TABLE patients ADD COLUMN referrer_patient_id TEXT;
ALTER TABLE patients ADD COLUMN referred_at TEXT;

-- Index for fast tree traversal (find all patients referred by X)
CREATE INDEX IF NOT EXISTS idx_patients_referrer ON patients(referrer_patient_id);

-- Self-referential FK (logical, not enforced — D1 ALTER limitations)
-- referrer_patient_id references patients(id) within same organization_id
