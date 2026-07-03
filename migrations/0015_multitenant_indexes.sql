-- v8.8.0: 멀티테넌트 확장 대비 인덱스 보강
-- 여러 병원 동시 사용 시 org 스코프 쿼리가 풀스캔으로 느려지는 것 방지

-- contact_logs: 환자별 연락 이력 조회 (patients.ts stats/timeline, tasks.ts 목록)
CREATE INDEX IF NOT EXISTS idx_contact_logs_org_patient ON contact_logs(organization_id, patient_id, created_at DESC);

-- contact_logs: 조직 전체 로그 목록 (tasks.ts /logs)
CREATE INDEX IF NOT EXISTS idx_contact_logs_org_created ON contact_logs(organization_id, created_at DESC);

-- leads: IP 스팸 캐핑 조회 (source LIKE '%|ip' + created_at 범위)
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);

-- leads: 전화번호 중복 체크 (24시간 내 dup-phone 409)
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone, created_at DESC);

-- consultations: 분석 상태 폴링/좌초 감지 조회
CREATE INDEX IF NOT EXISTS idx_consultations_org_analysis ON consultations(organization_id, ai_analysis_status);

-- patients: 이름 검색 정렬 (updated_at DESC 목록 기본 정렬)
CREATE INDEX IF NOT EXISTS idx_patients_org_updated ON patients(organization_id, updated_at DESC);
