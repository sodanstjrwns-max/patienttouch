-- Staff Daily Schedule (일일 근무 스케줄)
-- 원장/직원의 일별 출근 현황 관리
-- 기본 등록된 직원 외에 추가 원장, 알바 직원도 등록 가능

CREATE TABLE IF NOT EXISTS staff_schedules (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD
  staff_name TEXT NOT NULL,
  staff_role TEXT NOT NULL CHECK(staff_role IN ('doctor', 'staff', 'part_time', 'hygienist', 'coordinator')),
  -- doctor: 원장, staff: 정직원, part_time: 알바/파트타임, hygienist: 치위생사, coordinator: 코디네이터
  user_id TEXT, -- NULL이면 외부 인력 (등록 안 된 사람)
  status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'working', 'off', 'absent', 'half_day')),
  -- scheduled: 근무예정, working: 근무중, off: 퇴근, absent: 결근, half_day: 반차
  start_time TEXT, -- HH:MM
  end_time TEXT, -- HH:MM
  memo TEXT, -- 비고 (예: "오전만 근무", "수술 전담")
  assigned_patients INTEGER DEFAULT 0, -- 배정된 환자 수
  created_by TEXT, -- 등록한 사람 user_id
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_staff_schedules_org_date 
  ON staff_schedules(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_staff_schedules_user_date 
  ON staff_schedules(user_id, date);
CREATE INDEX IF NOT EXISTS idx_staff_schedules_date_role 
  ON staff_schedules(date, staff_role);
