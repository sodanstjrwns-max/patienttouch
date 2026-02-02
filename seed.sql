-- Patient Touch Seed Data for Development

-- Organization (테스트 병원)
INSERT OR IGNORE INTO organizations (id, name, plan_type, subscription_status, subscription_start_date, subscription_end_date, settings) VALUES
  ('org_bd_dental', '서울BD치과', 'premium', 'active', '2026-01-01', '2027-01-01', '{"notification_time": "08:30", "recording_notice": "상담 품질 향상을 위해 녹음됩니다."}'),
  ('org_demo', '데모치과', 'basic', 'trial', '2026-02-01', '2026-03-01', '{"notification_time": "09:00"}');

-- Users (실장/상담사)
-- password: test1234 (bcrypt hash)
INSERT OR IGNORE INTO users (id, organization_id, name, email, password_hash, role, phone, goals, settings) VALUES
  ('user_kim', 'org_bd_dental', '김실장', 'kim@bddental.com', '$2a$10$rQnM1kE8nK5L5Q5Q5Q5Q5OzHvHvHvHvHvHvHvHvHvHvHvHvHvHvHv', 'admin', '010-1234-5678', '{"conversion_rate": 80, "avg_score": 85, "contact_rate": 95, "re_consultation": 3}', '{"notification_enabled": true, "weekend_notification": false}'),
  ('user_lee', 'org_bd_dental', '이상담', 'lee@bddental.com', '$2a$10$rQnM1kE8nK5L5Q5Q5Q5Q5OzHvHvHvHvHvHvHvHvHvHvHvHvHvHvHv', 'staff', '010-2345-6789', '{"conversion_rate": 75, "avg_score": 80, "contact_rate": 90, "re_consultation": 2}', '{"notification_enabled": true}'),
  ('user_park', 'org_bd_dental', '박코디', 'park@bddental.com', '$2a$10$rQnM1kE8nK5L5Q5Q5Q5Q5OzHvHvHvHvHvHvHvHvHvHvHvHvHvHvHv', 'staff', '010-3456-7890', '{"conversion_rate": 70, "avg_score": 75, "contact_rate": 85, "re_consultation": 2}', '{}'),
  ('user_demo', 'org_demo', '데모실장', 'demo@demo.com', '$2a$10$rQnM1kE8nK5L5Q5Q5Q5Q5OzHvHvHvHvHvHvHvHvHvHvHvHvHvHvHv', 'admin', '010-0000-0000', '{}', '{}');

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
