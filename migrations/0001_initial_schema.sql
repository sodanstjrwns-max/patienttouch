-- Patient Touch Database Schema
-- 멀티테넌트 구조: Organizations > Users, Patients, Consultations

-- Organizations (병원)
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  plan_type TEXT DEFAULT 'basic' CHECK(plan_type IN ('basic', 'standard', 'premium', 'enterprise')),
  subscription_status TEXT DEFAULT 'trial' CHECK(subscription_status IN ('active', 'expired', 'trial')),
  subscription_start_date TEXT,
  subscription_end_date TEXT,
  settings TEXT DEFAULT '{}', -- JSON: 알림 시간, 고지 문구 등
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Users (실장/상담사)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'staff' CHECK(role IN ('admin', 'staff')),
  phone TEXT,
  goals TEXT DEFAULT '{}', -- JSON: 개인 KPI 목표
  settings TEXT DEFAULT '{}', -- JSON: 개인 설정 (알림 시간 등)
  created_at TEXT DEFAULT (datetime('now')),
  last_login_at TEXT,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Patients (환자)
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  age INTEGER,
  gender TEXT CHECK(gender IN ('male', 'female')),
  memo TEXT,
  tags TEXT DEFAULT '[]', -- JSON: 태그 배열
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Consultations (상담 기록)
CREATE TABLE IF NOT EXISTS consultations (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  consultation_date TEXT NOT NULL,
  duration INTEGER, -- 분 단위
  audio_url TEXT, -- R2 URL
  transcript TEXT, -- 전체 스크립트
  summary TEXT, -- 스크립트 요약
  treatment_type TEXT, -- 진료 항목 (임플란트, 교정 등)
  treatment_area TEXT, -- 치료 부위
  amount INTEGER, -- 상담 금액 (원)
  patient_psychology TEXT DEFAULT '{}', -- JSON: 환자 심리 분석
  emotion_flow TEXT DEFAULT '{}', -- JSON: 감정선 분석
  key_quotes TEXT DEFAULT '[]', -- JSON: 핵심 멘트 배열
  companion TEXT, -- JSON: 동반자 정보
  referrer TEXT, -- JSON: 소개자 정보
  previous_experience TEXT, -- 이전 병원 경험
  feedback TEXT DEFAULT '{}', -- JSON: 상담 피드백
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'undecided', 'paid', 'lost')),
  decision_score INTEGER DEFAULT 0, -- 결정 근접도 (1-10)
  ai_analysis_status TEXT DEFAULT 'pending' CHECK(ai_analysis_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- Contact Tasks (연락 태스크)
CREATE TABLE IF NOT EXISTS contact_tasks (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  consultation_id TEXT,
  user_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK(task_type IN ('closing', 'proactive')),
  recommended_date TEXT NOT NULL,
  recommended_message TEXT, -- 멘트 가이드
  points TEXT DEFAULT '[]', -- JSON: 연락 포인트 배열
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'skipped')),
  completed_at TEXT,
  result TEXT CHECK(result IN ('booked', 'callback', 'hold', 'rejected')),
  result_note TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (consultation_id) REFERENCES consultations(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- Contact Logs (연락 기록)
CREATE TABLE IF NOT EXISTS contact_logs (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  task_id TEXT,
  contact_type TEXT NOT NULL CHECK(contact_type IN ('call', 'message', 'kakao')),
  contact_result TEXT CHECK(contact_result IN ('success', 'no_answer', 'busy')),
  outcome TEXT CHECK(outcome IN ('booked', 'callback', 'hold', 'rejected')),
  content TEXT, -- 연락 내용 메모
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (task_id) REFERENCES contact_tasks(id)
);

-- Push Subscriptions (푸시 알림 구독)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  keys TEXT NOT NULL, -- JSON: p256dh, auth
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_patients_org ON patients(organization_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(organization_id, phone);
CREATE INDEX IF NOT EXISTS idx_consultations_org_date ON consultations(organization_id, consultation_date DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations(patient_id, consultation_date DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_consultations_user ON consultations(user_id, consultation_date DESC);
CREATE INDEX IF NOT EXISTS idx_contact_tasks_date ON contact_tasks(user_id, recommended_date, status);
CREATE INDEX IF NOT EXISTS idx_contact_tasks_patient ON contact_tasks(patient_id);
CREATE INDEX IF NOT EXISTS idx_contact_logs_patient ON contact_logs(patient_id, created_at DESC);
