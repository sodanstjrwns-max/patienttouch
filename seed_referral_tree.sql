-- v7.4 데모용 풍성한 소개 트리 시드
-- 김민수(patient_1)를 루트로 총 15명 다운스트림 트리 구성

-- 1단계: 김민수 직속 환자 2명 추가
INSERT OR REPLACE INTO patients (id, organization_id, name, phone, age, gender, status, referral_source, referrer_patient_id, referred_at, region, created_at, updated_at)
VALUES 
  ('patient_demo_01', 'org_bd_dental', '오현우', '010-1001-2001', 42, 'male', 'active', '지인소개', 'patient_1', datetime('now', '-30 days'), '강남구', datetime('now', '-30 days'), datetime('now')),
  ('patient_demo_02', 'org_bd_dental', '백서연', '010-1001-2002', 36, 'female', 'active', '지인소개', 'patient_1', datetime('now', '-25 days'), '서초구', datetime('now', '-25 days'), datetime('now'));

-- 2단계: 한미영 자손 (임소영)
INSERT OR REPLACE INTO patients (id, organization_id, name, phone, age, gender, status, referral_source, referrer_patient_id, referred_at, region, created_at, updated_at)
VALUES 
  ('patient_demo_03', 'org_bd_dental', '임소영', '010-1001-2003', 31, 'female', 'active', '지인소개', 'patient_5', datetime('now', '-20 days'), '강남구', datetime('now', '-20 days'), datetime('now'));

-- 3단계: 송미라 자손 (강주현 → 윤재훈)
INSERT OR REPLACE INTO patients (id, organization_id, name, phone, age, gender, status, referral_source, referrer_patient_id, referred_at, region, created_at, updated_at)
VALUES 
  ('patient_demo_04', 'org_bd_dental', '강주현', '010-1001-2004', 45, 'male', 'active', '지인소개', 'patient_7', datetime('now', '-18 days'), '서초구', datetime('now', '-18 days'), datetime('now')),
  ('patient_demo_05', 'org_bd_dental', '윤재훈', '010-1001-2005', 28, 'male', 'active', '지인소개', 'patient_demo_04', datetime('now', '-10 days'), '송파구', datetime('now', '-10 days'), datetime('now'));

-- 4단계: 이정호 자손 (박지원 → 김다은)
INSERT OR REPLACE INTO patients (id, organization_id, name, phone, age, gender, status, referral_source, referrer_patient_id, referred_at, region, created_at, updated_at)
VALUES 
  ('patient_demo_06', 'org_bd_dental', '박지원', '010-1001-2006', 39, 'female', 'active', '지인소개', 'patient_4', datetime('now', '-22 days'), '강남구', datetime('now', '-22 days'), datetime('now')),
  ('patient_demo_07', 'org_bd_dental', '김다은', '010-1001-2007', 26, 'female', 'active', '지인소개', 'patient_demo_06', datetime('now', '-12 days'), '강남구', datetime('now', '-12 days'), datetime('now'));

-- 5단계: 오현우 자손 (신예린)
INSERT OR REPLACE INTO patients (id, organization_id, name, phone, age, gender, status, referral_source, referrer_patient_id, referred_at, region, created_at, updated_at)
VALUES 
  ('patient_demo_08', 'org_bd_dental', '신예린', '010-1001-2008', 33, 'female', 'active', '지인소개', 'patient_demo_01', datetime('now', '-15 days'), '서초구', datetime('now', '-15 days'), datetime('now'));

-- 6단계: 백서연 자손 (정유빈 → 황도현)
INSERT OR REPLACE INTO patients (id, organization_id, name, phone, age, gender, status, referral_source, referrer_patient_id, referred_at, region, created_at, updated_at)
VALUES 
  ('patient_demo_09', 'org_bd_dental', '정유빈', '010-1001-2009', 41, 'female', 'active', '지인소개', 'patient_demo_02', datetime('now', '-13 days'), '강남구', datetime('now', '-13 days'), datetime('now')),
  ('patient_demo_10', 'org_bd_dental', '황도현', '010-1001-2010', 29, 'male', 'active', '지인소개', 'patient_demo_02', datetime('now', '-7 days'), '강남구', datetime('now', '-7 days'), datetime('now'));

-- 매출 데이터 (consultations - decided 상태)
INSERT OR REPLACE INTO consultations (id, organization_id, user_id, patient_id, consultation_date, status, amount, decision_score, created_at)
VALUES 
  ('consult_demo_01', 'org_bd_dental', 'user_kim', 'patient_demo_01', date('now', '-28 days'), 'paid', 3500000, 85, datetime('now', '-28 days')),
  ('consult_demo_02', 'org_bd_dental', 'user_kim', 'patient_demo_02', date('now', '-23 days'), 'paid', 4200000, 90, datetime('now', '-23 days')),
  ('consult_demo_03', 'org_bd_dental', 'user_kim', 'patient_demo_03', date('now', '-18 days'), 'paid', 1800000, 75, datetime('now', '-18 days')),
  ('consult_demo_04', 'org_bd_dental', 'user_kim', 'patient_demo_04', date('now', '-16 days'), 'paid', 5500000, 92, datetime('now', '-16 days')),
  ('consult_demo_05', 'org_bd_dental', 'user_kim', 'patient_demo_05', date('now', '-8 days'), 'paid', 2200000, 80, datetime('now', '-8 days')),
  ('consult_demo_06', 'org_bd_dental', 'user_kim', 'patient_demo_06', date('now', '-20 days'), 'paid', 3800000, 88, datetime('now', '-20 days')),
  ('consult_demo_07', 'org_bd_dental', 'user_kim', 'patient_demo_07', date('now', '-10 days'), 'paid', 1600000, 70, datetime('now', '-10 days')),
  ('consult_demo_08', 'org_bd_dental', 'user_kim', 'patient_demo_08', date('now', '-13 days'), 'paid', 2900000, 82, datetime('now', '-13 days')),
  ('consult_demo_09', 'org_bd_dental', 'user_kim', 'patient_demo_09', date('now', '-11 days'), 'paid', 4500000, 87, datetime('now', '-11 days')),
  ('consult_demo_10', 'org_bd_dental', 'user_kim', 'patient_demo_10', date('now', '-5 days'), 'paid', 2100000, 78, datetime('now', '-5 days'));
