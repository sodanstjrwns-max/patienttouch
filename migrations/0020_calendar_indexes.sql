-- v9.1.6: 캘린더 조회 성능 인덱스 (org + 날짜 컬럼 4종)
CREATE INDEX IF NOT EXISTS idx_consultations_org_date ON consultations(organization_id, consultation_date);
CREATE INDEX IF NOT EXISTS idx_contact_tasks_org_recdate ON contact_tasks(organization_id, recommended_date);
CREATE INDEX IF NOT EXISTS idx_patient_treatments_org_nextappt ON patient_treatments(organization_id, next_appointment);
CREATE INDEX IF NOT EXISTS idx_retention_contacts_org_nextcontact ON retention_contacts(organization_id, next_contact_date);
