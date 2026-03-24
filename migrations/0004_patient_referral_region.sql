-- Add referral_source and region columns to patients table
ALTER TABLE patients ADD COLUMN referral_source TEXT;
ALTER TABLE patients ADD COLUMN region TEXT;

-- Create index for referral analysis
CREATE INDEX IF NOT EXISTS idx_patients_referral ON patients(referral_source);
CREATE INDEX IF NOT EXISTS idx_patients_region ON patients(region);
