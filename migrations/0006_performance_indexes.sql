-- Performance optimization indexes
-- Target: Dashboard & Retention heavy queries

-- 1. contact_tasks: consultation_id + status 복합 (EXISTS subquery 최적화)
CREATE INDEX IF NOT EXISTS idx_contact_tasks_consultation_status 
  ON contact_tasks(consultation_id, status);

-- 2. contact_tasks: org + user + status 복합 (pending task 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_contact_tasks_org_user_status 
  ON contact_tasks(organization_id, user_id, status, recommended_date);

-- 3. consultations: org + user + date + status 복합 (대시보드 핵심 쿼리 최적화)
CREATE INDEX IF NOT EXISTS idx_consultations_org_user_date 
  ON consultations(organization_id, user_id, consultation_date DESC, status);

-- 4. patient_retention_status: patient_id 단독 (단건 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_retention_status_patient 
  ON patient_retention_status(patient_id);

-- 5. retention_contacts: org + staff + date 복합 (연락 이력 조회)
CREATE INDEX IF NOT EXISTS idx_retention_contacts_staff 
  ON retention_contacts(organization_id, staff_id, contacted_at DESC);

-- 6. patient_treatments: patient + org 복합 (환자별 치료 조회)  
CREATE INDEX IF NOT EXISTS idx_treatments_patient_org 
  ON patient_treatments(patient_id, organization_id, status);

-- 7. consultations: patient_id + status (미결정 환자 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_consultations_patient_status
  ON consultations(patient_id, status, consultation_date DESC);

-- 8. notification_logs: org + channel + date 복합 (알림 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_notification_logs_org_channel
  ON notification_logs(org_id, channel, created_at DESC);
