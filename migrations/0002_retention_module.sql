-- Patient Touch - Retention Module Schema
-- Stage 9~10: 관리→소개 (치료 미완료, 리콜, 이탈 환자 관리)

-- patient_treatments: 환자별 치료 이력
CREATE TABLE IF NOT EXISTS patient_treatments (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  treatment_type TEXT NOT NULL CHECK(treatment_type IN ('implant', 'ortho', 'prosthetic', 'endo', 'extraction', 'scaling', 'whitening', 'laminate', 'general')),
  treatment_name TEXT, -- 세부 치료명 (예: "임플란트 #36 식립")
  status TEXT DEFAULT 'consulted' CHECK(status IN ('consulted', 'scheduled', 'in_progress', 'completed', 'abandoned')),
  total_amount INTEGER DEFAULT 0, -- 총 치료비 (원)
  paid_amount INTEGER DEFAULT 0, -- 수납 완료 금액
  remaining_amount INTEGER GENERATED ALWAYS AS (total_amount - paid_amount) STORED, -- 잔여 금액
  started_at TEXT, -- 치료 시작일
  completed_at TEXT, -- 치료 완료일
  next_appointment TEXT, -- 다음 예약일
  source_consultation_id TEXT, -- 연결된 상담 기록
  notes TEXT, -- 메모
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (source_consultation_id) REFERENCES consultations(id)
);

-- patient_retention_status: 환자 리텐션 상태 (매일 배치 업데이트)
CREATE TABLE IF NOT EXISTS patient_retention_status (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  patient_id TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'active' CHECK(status IN ('in_treatment', 'unscheduled_urgent', 'unscheduled_warning', 'recall_6m', 'recall_12m', 'at_risk', 'consulted_unconverted', 'active', 'completed')),
  risk_score INTEGER DEFAULT 0, -- 이탈 위험도 0-100
  last_visit_date TEXT, -- 마지막 내원일
  days_since_visit INTEGER DEFAULT 0, -- 경과 일수
  remaining_treatment_value INTEGER DEFAULT 0, -- 잔여 치료비 합계
  recommended_contact_date TEXT, -- AI 추천 연락일
  recommended_contact_script TEXT, -- AI 추천 멘트
  recommended_contact_type TEXT CHECK(recommended_contact_type IN ('phone', 'text', 'kakao')),
  priority_score REAL DEFAULT 0, -- 우선순위 점수 (가중합산)
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- retention_contacts: 리텐션 전용 연락 기록
CREATE TABLE IF NOT EXISTS retention_contacts (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  staff_id TEXT NOT NULL,
  treatment_id TEXT, -- 연결된 치료 건
  contact_type TEXT NOT NULL CHECK(contact_type IN ('phone', 'text', 'kakao')),
  result TEXT NOT NULL CHECK(result IN ('connected', 'no_answer', 'message_sent', 'callback_promised', 'appointment_booked', 'refused')),
  notes TEXT,
  next_contact_date TEXT,
  contacted_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (staff_id) REFERENCES users(id),
  FOREIGN KEY (treatment_id) REFERENCES patient_treatments(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_treatments_patient ON patient_treatments(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_treatments_org ON patient_treatments(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_treatments_next ON patient_treatments(organization_id, next_appointment);
CREATE INDEX IF NOT EXISTS idx_retention_status_org ON patient_retention_status(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_retention_status_priority ON patient_retention_status(organization_id, priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_retention_contacts_patient ON retention_contacts(patient_id, contacted_at DESC);
CREATE INDEX IF NOT EXISTS idx_retention_contacts_org ON retention_contacts(organization_id, contacted_at DESC);

-- patients 테이블에 last_visit_date 컬럼 추가
ALTER TABLE patients ADD COLUMN last_visit_date TEXT;
