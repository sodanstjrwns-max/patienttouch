-- Patient Touch Seed Data for Development

-- Organization (테스트 병원)
INSERT OR IGNORE INTO organizations (id, name, plan_type, subscription_status, subscription_start_date, subscription_end_date, settings) VALUES
  ('org_bd_dental', '서울BD치과', 'premium', 'active', '2026-01-01', '2027-01-01', '{"notification_time": "08:30", "recording_notice": "상담 품질 향상을 위해 녹음됩니다."}'),
  ('org_demo', '데모치과', 'basic', 'trial', '2026-02-01', '2026-03-01', '{"notification_time": "09:00"}');

-- Users (실장/상담사)
-- password: test1234 (SHA-256 hash)
INSERT OR IGNORE INTO users (id, organization_id, name, email, password_hash, role, phone, goals, settings) VALUES
  ('user_kim', 'org_bd_dental', '김실장', 'kim@bddental.com', '937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244', 'admin', '010-1234-5678', '{"conversion_rate": 80, "avg_score": 85, "contact_rate": 95, "re_consultation": 3}', '{"notification_enabled": true, "weekend_notification": false}'),
  ('user_lee', 'org_bd_dental', '이상담', 'lee@bddental.com', '937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244', 'staff', '010-2345-6789', '{"conversion_rate": 75, "avg_score": 80, "contact_rate": 90, "re_consultation": 2}', '{"notification_enabled": true}'),
  ('user_park', 'org_bd_dental', '박코디', 'park@bddental.com', '937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244', 'staff', '010-3456-7890', '{"conversion_rate": 70, "avg_score": 75, "contact_rate": 85, "re_consultation": 2}', '{}'),
  ('user_demo', 'org_demo', '데모실장', 'demo@demo.com', '937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244', 'admin', '010-0000-0000', '{}', '{}');

-- Patients (환자)
INSERT OR IGNORE INTO patients (id, organization_id, name, phone, age, gender, memo, tags, status) VALUES
  ('patient_1', 'org_bd_dental', '김민수', '010-1111-1111', 45, 'male', '와이프 설득이 관건. 통증에 민감함.', '["VIP", "임플란트"]', 'active'),
  ('patient_2', 'org_bd_dental', '박영희', '010-2222-2222', 32, 'female', '직장인. 점심시간 예약 선호.', '["교정"]', 'active'),
  ('patient_3', 'org_bd_dental', '최수진', '010-3333-3333', 55, 'female', '꼼꼼한 성격. 설명 자세히 원함.', '["임플란트", "완료"]', 'active'),
  ('patient_4', 'org_bd_dental', '이정호', '010-4444-4444', 28, 'male', '가격에 민감. 할부 선호.', '[]', 'active'),
  ('patient_5', 'org_bd_dental', '한미영', '010-5555-5555', 41, 'female', '소개 환자. 김민수님 지인.', '["소개환자"]', 'active'),
  ('patient_6', 'org_bd_dental', '정대철', '010-6666-6666', 60, 'male', '당뇨 있음. 주의 필요.', '["주의"]', 'active'),
  ('patient_7', 'org_bd_dental', '송미라', '010-7777-7777', 35, 'female', '라미네이트 관심. 연예인 치아 원함.', '["심미"]', 'active');

-- Consultations (상담 기록) - 다양한 상태로
INSERT OR IGNORE INTO consultations (id, organization_id, user_id, patient_id, consultation_date, duration, treatment_type, treatment_area, amount, patient_psychology, emotion_flow, key_quotes, feedback, status, decision_score, ai_analysis_status, summary) VALUES
  -- 김민수: 미결정 상태, 결정 근접도 높음
  ('consult_1', 'org_bd_dental', 'user_kim', 'patient_1', '2026-01-30 14:30:00', 12, '임플란트', '#36, #46', 6000000, 
   '{"fear": "통증", "hesitation_reason": "가격", "decision_factor": "자연스러운 결과물", "decision_maker": "와이프", "budget": "400-600만원"}',
   '{"overall_tone": "positive", "decision_score": 7, "timeline": [{"time": "0:00", "emotion": "neutral", "note": "긴장"}, {"time": "5:00", "emotion": "interested", "note": "무통마취 설명 후"}, {"time": "10:00", "emotion": "positive", "note": "할부 안내 후"}], "summary": "초반 긴장 → 중반 관심↑ → 후반 긍정"}',
   '["이 정도면 할 만하네요", "와이프한테 얘기해볼게요"]',
   '{"good_points": ["통증 걱정에 무통 마취 바로 안내", "할부 옵션 적절한 타이밍에 제시", "친근한 톤 유지"], "improve_points": [{"issue": "와이프 설득 자료 제안 기회 놓침", "suggestion": "사모님께 보여드릴 자료 준비해드릴까요?"}, {"issue": "다음 연락 일정 확정 안 함", "suggestion": "수요일쯤 연락드려도 될까요?"}], "scores": {"needs_identification": 85, "value_delivery": 80, "objection_handling": 70, "closing": 65}, "total_score": 78}',
   'undecided', 7, 'completed',
   '• 환자 어금니 2개 상실, 임플란트 희망\n• 통증 걱정 → 원장님 무통 마취 설명\n• 600만원 안내 → "한 번에 내기엔" 부담 표현\n• 무이자 할부 안내 → 관심 보임\n• 와이프와 상의 후 결정하겠다고 함'),

  -- 박영희: 미결정 상태, 교정
  ('consult_2', 'org_bd_dental', 'user_kim', 'patient_2', '2026-01-28 12:00:00', 20, '교정', '전체', 5000000,
   '{"fear": "발치", "hesitation_reason": "기간", "decision_factor": "빠른 결과", "decision_maker": "본인"}',
   '{"overall_tone": "neutral", "decision_score": 6, "timeline": [{"time": "0:00", "emotion": "interested"}, {"time": "10:00", "emotion": "worried", "note": "발치 얘기"}, {"time": "18:00", "emotion": "neutral"}], "summary": "관심 있으나 발치가 걸림"}',
   '["발치 안 하면 안 되나요?", "생각해볼게요"]',
   '{"good_points": ["교정 전후 사진 잘 보여줌"], "improve_points": [{"issue": "발치 필요성 설명 부족", "suggestion": "발치 안 하면 어떤 결과가 나오는지 시뮬레이션"}], "scores": {"needs_identification": 80, "value_delivery": 75, "objection_handling": 60, "closing": 55}, "total_score": 68}',
   'undecided', 6, 'completed',
   '• 덧니 교정 희망, 투명교정 문의\n• 발치 필요 설명 → 걱정 표현\n• 2년 기간 안내 → 너무 길다고 함\n• 빠른 교정 옵션 설명\n• 더 알아보겠다고 함'),

  -- 최수진: 완료 상태 (안부 연락 대상)
  ('consult_3', 'org_bd_dental', 'user_lee', 'patient_3', '2026-01-15 10:00:00', 15, '임플란트', '#16, #17, #26', 9000000,
   '{"fear": "실패", "decision_factor": "안전성"}',
   '{"overall_tone": "positive", "decision_score": 9}',
   '["원장님 믿고 맡길게요"]',
   '{"good_points": ["꼼꼼한 설명", "케이스 사진 효과적"], "scores": {"needs_identification": 90, "value_delivery": 95, "objection_handling": 85, "closing": 90}, "total_score": 90}',
   'paid', 9, 'completed',
   '• 상악 임플란트 3개 진행\n• 꼼꼼한 설명 요청 → 자세히 안내\n• 케이스 사진 보고 신뢰\n• 바로 결제 완료'),

  -- 이정호: 결제 완료
  ('consult_4', 'org_bd_dental', 'user_kim', 'patient_4', '2026-02-02 11:00:00', 8, '스케일링', '전체', 50000,
   '{}',
   '{"overall_tone": "positive", "decision_score": 10}',
   '[]',
   '{"scores": {"needs_identification": 95, "value_delivery": 90, "objection_handling": 90, "closing": 95}, "total_score": 92}',
   'paid', 10, 'completed',
   '• 정기 스케일링 방문\n• 추가 치료 필요 없음\n• 바로 진행'),

  -- 송미라: 미결정 (라미네이트)
  ('consult_5', 'org_bd_dental', 'user_park', 'patient_7', '2026-01-31 16:00:00', 25, '라미네이트', '상악 전치 6개', 4800000,
   '{"fear": "부자연스러움", "hesitation_reason": "가격", "decision_factor": "자연스러운 모양"}',
   '{"overall_tone": "positive", "decision_score": 8, "summary": "매우 관심 있음, 가격만 고민"}',
   '["너무 예쁜데요!", "좀 더 생각해볼게요"]',
   '{"good_points": ["비포/애프터 사진 효과적", "자연스러운 디자인 강조"], "improve_points": [{"issue": "할부 안내 타이밍 늦음"}], "scores": {"needs_identification": 85, "value_delivery": 90, "objection_handling": 75, "closing": 70}, "total_score": 80}',
   'undecided', 8, 'completed',
   '• 연예인 같은 치아 원함\n• 비포/애프터 사진 보고 매우 만족\n• 가격 480만원 → 부담 표현\n• 할부 안내 → 관심 보임\n• 남편과 상의 후 결정');

-- Contact Tasks (연락 태스크)
INSERT OR IGNORE INTO contact_tasks (id, organization_id, consultation_id, user_id, patient_id, task_type, recommended_date, recommended_message, points, status) VALUES
  -- 클로징 연락 (미결정 환자)
  ('task_1', 'org_bd_dental', 'consult_1', 'user_kim', 'patient_1', 'closing', '2026-02-02', 
   '안녕하세요 김민수님, BD치과 김실장입니다.\n지난번 상담 후 궁금하신 점 있으셨을까 해서요.',
   '["할부 옵션 다시 안내 (6개월 무이자)", "와이프분 설득 자료 제안", "이번 달 프로모션 안내"]',
   'pending'),
  ('task_2', 'org_bd_dental', 'consult_2', 'user_kim', 'patient_2', 'closing', '2026-02-02',
   '안녕하세요 박영희님, BD치과 김실장입니다.\n지난번 교정 상담 관련해서 여쭤볼 게 있어서요.',
   '["발치 걱정 해소 - 발치 후 케이스 사진", "기간 단축 옵션 설명"]',
   'pending'),
  ('task_3', 'org_bd_dental', 'consult_5', 'user_park', 'patient_7', 'closing', '2026-02-03',
   '안녕하세요 송미라님, BD치과 박코디입니다.\n라미네이트 상담 이후 고민은 좀 해결되셨나요?',
   '["할부 상세 안내", "자연스러운 결과물 사진 추가 공유"]',
   'pending'),
  
  -- 안부 연락 (치료 완료 환자)
  ('task_4', 'org_bd_dental', 'consult_3', 'user_lee', 'patient_3', 'proactive', '2026-02-02',
   '안녕하세요 최수진님, BD치과 이상담입니다.\n임플란트 하신 지 2주 정도 되셨는데 불편하신 거 없으신지 궁금해서요.',
   '["불편한 점 체크", "다음 내원일 확인"]',
   'pending'),
  ('task_5', 'org_bd_dental', null, 'user_kim', 'patient_6', 'proactive', '2026-02-02',
   '안녕하세요 정대철님, BD치과 김실장입니다.\n오랜만에 안부 인사 드려요. 건강은 어떠세요?',
   '["정기 검진 안내", "당뇨 관리 상태 체크"]',
   'pending');

-- Contact Logs (연락 기록)
INSERT OR IGNORE INTO contact_logs (id, organization_id, patient_id, user_id, task_id, contact_type, contact_result, outcome, content) VALUES
  ('log_1', 'org_bd_dental', 'patient_1', 'user_kim', null, 'message', 'success', null, '상담 감사 문자 발송'),
  ('log_2', 'org_bd_dental', 'patient_3', 'user_lee', null, 'call', 'success', 'booked', '수술 후 경과 체크. 불편 없다고 함. 다음 주 내원 예약.');

-- ============================================
-- Retention Module Seed Data
-- ============================================

-- patients.last_visit_date 업데이트
UPDATE patients SET last_visit_date = '2026-01-30' WHERE id = 'patient_1'; -- 김민수: 임플란트 상담
UPDATE patients SET last_visit_date = '2026-01-28' WHERE id = 'patient_2'; -- 박영희: 교정 상담
UPDATE patients SET last_visit_date = '2026-01-15' WHERE id = 'patient_3'; -- 최수진: 임플란트 완료
UPDATE patients SET last_visit_date = '2026-02-02' WHERE id = 'patient_4'; -- 이정호: 스케일링 완료
UPDATE patients SET last_visit_date = '2025-08-10' WHERE id = 'patient_5'; -- 한미영: 6개월 경과
UPDATE patients SET last_visit_date = '2025-02-20' WHERE id = 'patient_6'; -- 정대철: 12개월 경과 (이탈 위험)
UPDATE patients SET last_visit_date = '2026-01-31' WHERE id = 'patient_7'; -- 송미라: 라미네이트 상담

-- Patient Treatments (치료 이력)
INSERT OR IGNORE INTO patient_treatments (id, organization_id, patient_id, treatment_type, treatment_name, status, total_amount, paid_amount, started_at, completed_at, next_appointment, source_consultation_id, notes) VALUES
  -- 김민수: 임플란트 1차 완료, 2차 미예약 (치료 미완료 - 가장 긴급)
  ('treat_1a', 'org_bd_dental', 'patient_1', 'implant', '임플란트 #36 식립 (1차)', 'completed', 3000000, 3000000, '2026-01-20', '2026-01-20', null, null, '1차 식립 완료. 경과 양호.'),
  ('treat_1b', 'org_bd_dental', 'patient_1', 'implant', '임플란트 #36 보철 (2차)', 'scheduled', 3000000, 0, null, null, null, 'consult_1', '2차 보철 미예약 상태. 와이프와 상의 중.'),
  ('treat_1c', 'org_bd_dental', 'patient_1', 'implant', '임플란트 #46 식립 (1차)', 'in_progress', 3000000, 1500000, '2026-01-30', null, null, 'consult_1', '1차 진행 중'),

  -- 박영희: 교정 상담 완료, 미결정
  ('treat_2', 'org_bd_dental', 'patient_2', 'ortho', '투명교정 (전체)', 'consulted', 5000000, 0, null, null, null, 'consult_2', '발치 걱정. 더 알아보겠다고 함.'),

  -- 최수진: 임플란트 3개 완료 (정기검진 리콜 대상)
  ('treat_3a', 'org_bd_dental', 'patient_3', 'implant', '임플란트 #16 식립+보철', 'completed', 3000000, 3000000, '2025-12-01', '2026-01-15', null, 'consult_3', null),
  ('treat_3b', 'org_bd_dental', 'patient_3', 'implant', '임플란트 #17 식립+보철', 'completed', 3000000, 3000000, '2025-12-01', '2026-01-15', null, 'consult_3', null),
  ('treat_3c', 'org_bd_dental', 'patient_3', 'implant', '임플란트 #26 식립+보철', 'completed', 3000000, 3000000, '2025-12-01', '2026-01-15', null, 'consult_3', null),

  -- 이정호: 스케일링 완료
  ('treat_4', 'org_bd_dental', 'patient_4', 'scaling', '정기 스케일링', 'completed', 50000, 50000, '2026-02-02', '2026-02-02', null, 'consult_4', null),

  -- 한미영: 신경치료 중단 (치료 미완료)
  ('treat_5a', 'org_bd_dental', 'patient_5', 'endo', '신경치료 #25 (1/3회차)', 'completed', 100000, 100000, '2025-07-20', '2025-07-20', null, null, '1회차 완료'),
  ('treat_5b', 'org_bd_dental', 'patient_5', 'endo', '신경치료 #25 (2/3회차)', 'completed', 100000, 100000, '2025-08-03', '2025-08-03', null, null, '2회차 완료'),
  ('treat_5c', 'org_bd_dental', 'patient_5', 'endo', '신경치료 #25 (3/3회차)', 'scheduled', 100000, 0, null, null, null, null, '3회차 미예약. 시간이 안 맞는다고 함.'),
  ('treat_5d', 'org_bd_dental', 'patient_5', 'prosthetic', '크라운 #25', 'scheduled', 400000, 0, null, null, null, null, '신경치료 완료 후 크라운 예정'),

  -- 정대철: 12개월 이상 미내원 (이탈 위험)
  ('treat_6', 'org_bd_dental', 'patient_6', 'scaling', '정기 스케일링', 'completed', 50000, 50000, '2025-02-20', '2025-02-20', null, null, '당뇨 관리 중. 정기 검진 필요.'),

  -- 송미라: 라미네이트 상담만 (미전환)
  ('treat_7', 'org_bd_dental', 'patient_7', 'laminate', '라미네이트 상악 전치 6개', 'consulted', 4800000, 0, null, null, null, 'consult_5', '남편과 상의 후 결정. 가격 고민.');

-- Patient Retention Status (AI 자동 분류)
INSERT OR IGNORE INTO patient_retention_status (id, organization_id, patient_id, status, risk_score, last_visit_date, days_since_visit, remaining_treatment_value, recommended_contact_date, recommended_contact_script, recommended_contact_type, priority_score) VALUES
  -- 김민수: 치료 미완료 긴급 (임플란트 2차 미예약, 16일 경과)
  ('ret_1', 'org_bd_dental', 'patient_1', 'unscheduled_urgent', 72, '2026-01-30', 16, 4500000,
   '2026-02-15',
   '안녕하세요 김민수님, 서울BD치과 김실장입니다. 지난번 임플란트 1차 수술 이후 경과는 어떠세요? 2차 보철 진행하시면 좋을 시기가 되어서 연락드렸어요. 편하신 시간에 예약 잡아드릴까요?',
   'phone', 92.5),

  -- 박영희: 상담 미전환 (교정 상담 후 30일 이상 경과)
  ('ret_2', 'org_bd_dental', 'patient_2', 'consulted_unconverted', 45, '2026-01-28', 18, 5000000,
   '2026-02-17',
   '안녕하세요 박영희님, 서울BD치과 김실장입니다. 지난번 교정 상담 이후 고민은 좀 해결되셨나요? 발치 없이 가능한 옵션도 다시 한번 설명드릴 수 있어요.',
   'phone', 68.0),

  -- 최수진: 정기검진 리콜 (마지막 내원 1개월)
  ('ret_3', 'org_bd_dental', 'patient_3', 'completed', 10, '2026-01-15', 31, 0,
   null, null, null, 10.0),

  -- 이정호: 정상 (최근 내원)
  ('ret_4', 'org_bd_dental', 'patient_4', 'active', 5, '2026-02-02', 13, 0,
   null, null, null, 5.0),

  -- 한미영: 치료 미완료 긴급 (신경치료 3회차 중단, 6개월 경과)
  ('ret_5', 'org_bd_dental', 'patient_5', 'unscheduled_urgent', 85, '2025-08-10', 189, 500000,
   '2026-02-15',
   '안녕하세요 한미영님, 서울BD치과입니다. 지난번 신경치료 마지막 회차가 남아있는데, 마무리하시면 좋을 것 같아서 연락드렸어요. 저녁 시간대 예약도 가능합니다.',
   'phone', 95.0),

  -- 정대철: 이탈 위험 (12개월 이상 미내원)
  ('ret_6', 'org_bd_dental', 'patient_6', 'at_risk', 90, '2025-02-20', 361, 0,
   '2026-02-15',
   '안녕하세요 정대철님, 서울BD치과 김실장입니다. 오랜만에 안부 여쭤보려고요. 요즘 치아 상태는 괜찮으신가요? 당뇨 관리도 잘 되고 계신지... 정기검진 한번 받아보시면 좋겠어요.',
   'text', 78.0),

  -- 송미라: 상담 미전환 (라미네이트, 가격 고민)
  ('ret_7', 'org_bd_dental', 'patient_7', 'consulted_unconverted', 55, '2026-01-31', 15, 4800000,
   '2026-02-16',
   '안녕하세요 송미라님, 서울BD치과 박코디입니다. 라미네이트 상담 이후 고민은 좀 해결되셨나요? 이번 달 프로모션 안내 드릴게 있어서 연락드렸어요.',
   'text', 72.0);

-- Retention Contacts (리텐션 연락 기록 샘플)
INSERT OR IGNORE INTO retention_contacts (id, organization_id, patient_id, staff_id, treatment_id, contact_type, result, notes, next_contact_date, contacted_at) VALUES
  -- 한미영: 2회 연락 시도
  ('rcon_1', 'org_bd_dental', 'patient_5', 'user_kim', 'treat_5c', 'phone', 'no_answer', '부재중', '2026-01-20', '2026-01-15'),
  ('rcon_2', 'org_bd_dental', 'patient_5', 'user_kim', 'treat_5c', 'text', 'message_sent', '신경치료 마무리 안내 문자 발송. 읽음, 미회신.', '2026-02-01', '2026-01-20'),
  ('rcon_3', 'org_bd_dental', 'patient_5', 'user_kim', 'treat_5c', 'phone', 'connected', '통화 성공. "다음달에 할게요"라고 함. 3월 첫째 주 재연락 예정.', '2026-03-03', '2026-02-01'),

  -- 정대철: 1회 연락
  ('rcon_4', 'org_bd_dental', 'patient_6', 'user_kim', null, 'text', 'message_sent', '안부 문자 + 정기검진 안내. 읽음 확인.', '2026-02-20', '2026-02-10');
