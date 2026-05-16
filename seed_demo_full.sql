-- =====================================================================
-- 🎬 Patient Touch v7.7 - 전체 기능 데모 시뮬레이션 시드
-- =====================================================================
-- 목적: 데모 계정 로그인 후 ALL v7.6 기능을 직접 체험 가능하도록
--   - Admin Dashboard (전체 K-factor + 상담사별 K-factor)
--   - Network Graph (다단계 소개 트리, depth 4)
--   - Churn Prediction Dashboard
--   - Retraining Dashboard (피드백 누적 → 재학습 추천)
--   - Retention Contacts (안부 연락 대상)
--   - Presenter & Proposals
--
-- 로그인 정보:
--   원장:    demo@patienttouch.kr / test1234
--   상담사1: yujin@patienttouch.kr / test1234  (김유진)
--   상담사2: seoyeon@patienttouch.kr / test1234 (박서연)
--   상담사3: jiwon@patienttouch.kr / test1234   (이지원)
-- =====================================================================

-- 기존 데모 데이터 클린업 (org_demo_full 전용 데이터만)
DELETE FROM retention_contacts WHERE patient_id LIKE 'pd_%';
DELETE FROM patient_retention_status WHERE patient_id LIKE 'pd_%';
DELETE FROM patient_treatments WHERE patient_id LIKE 'pd_%';
DELETE FROM churn_predictions WHERE patient_id LIKE 'pd_%';
DELETE FROM treatment_proposals WHERE consultation_id LIKE 'cd_%';
DELETE FROM consultation_reports WHERE consultation_id LIKE 'cd_%';
DELETE FROM stt_chunks WHERE consultation_id LIKE 'cd_%';
DELETE FROM ai_hints_log WHERE consultation_id LIKE 'cd_%';
DELETE FROM contact_logs WHERE task_id LIKE 'td_%';
DELETE FROM contact_tasks WHERE id LIKE 'td_%';
DELETE FROM consultations WHERE id LIKE 'cd_%';
DELETE FROM patients WHERE id LIKE 'pd_%';
DELETE FROM users WHERE id LIKE 'ud_%';
DELETE FROM organizations WHERE id = 'org_demo_full';

-- =====================================================================
-- 1. 조직 (Demo Organization)
-- =====================================================================
INSERT INTO organizations (id, name, plan_type, subscription_status, subscription_start_date, subscription_end_date, settings)
VALUES ('org_demo_full', '데모치과 (Patient Touch Demo)', 'premium', 'active', '2026-01-01', '2027-01-01',
  '{"notification_time":"09:00","recording_notice":"상담 품질 향상을 위해 녹음됩니다."}');

-- =====================================================================
-- 2. 사용자 4명 (1 admin + 3 staff)
-- password: test1234 → SHA-256: 937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244
-- =====================================================================
INSERT INTO users (id, organization_id, name, email, password_hash, role, phone, goals, settings) VALUES
  ('ud_admin',   'org_demo_full', '문석준 원장', 'demo@patienttouch.kr',    '937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244', 'admin', '010-0000-1000', '{"conversion_rate":80,"avg_score":85,"contact_rate":95,"re_consultation":3}', '{"notification_enabled":true}'),
  ('ud_yujin',   'org_demo_full', '김유진 실장', 'yujin@patienttouch.kr',   '937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244', 'staff', '010-0000-1001', '{"conversion_rate":75,"avg_score":82,"contact_rate":90,"re_consultation":2}', '{"notification_enabled":true}'),
  ('ud_seoyeon', 'org_demo_full', '박서연 상담', 'seoyeon@patienttouch.kr', '937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244', 'staff', '010-0000-1002', '{"conversion_rate":72,"avg_score":78,"contact_rate":88,"re_consultation":2}', '{"notification_enabled":true}'),
  ('ud_jiwon',   'org_demo_full', '이지원 상담', 'jiwon@patienttouch.kr',   '937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244', 'staff', '010-0000-1003', '{"conversion_rate":70,"avg_score":75,"contact_rate":85,"re_consultation":2}', '{"notification_enabled":true}');

-- =====================================================================
-- 3. 환자 25명 + 다단계 소개 네트워크 (Tree depth 4)
-- =====================================================================
-- 🌳 소개 트리 구조 (영향력 분포 의도):
--   Root1: pd_01 김민수 (유진 환자) ─┬─ pd_06 → pd_11 → pd_16 → pd_21
--                                   ├─ pd_07 → pd_12
--                                   └─ pd_08
--   Root2: pd_02 박영희 (유진 환자) ─┬─ pd_09 → pd_13
--                                   └─ pd_10 → pd_14 → pd_17
--   Root3: pd_03 최수진 (서연 환자) ─── pd_15 → pd_18 → pd_22
--   Root4: pd_04 이정호 (서연 환자) ─── pd_19
--   Root5: pd_05 한미영 (지원 환자) ─── pd_20 → pd_23
--   고립: pd_24, pd_25 (소개 X)

INSERT INTO patients (id, organization_id, name, phone, age, gender, status, memo, tags, referral_source, referrer_patient_id, referred_at, region, created_at) VALUES
  -- Root 환자 5명 (소개자 없음)
  ('pd_01', 'org_demo_full', '김민수', '010-2001-0001', 45, 'male',   'active', '와이프 설득이 관건. VIP', '["VIP","임플란트","핵심소개자"]', '검색광고', NULL, NULL, '강남구', datetime('now','-180 days')),
  ('pd_02', 'org_demo_full', '박영희', '010-2001-0002', 32, 'female', 'active', '직장인. 빠른 결과 선호', '["교정","적극소개자"]',           '인스타그램', NULL, NULL, '서초구', datetime('now','-170 days')),
  ('pd_03', 'org_demo_full', '최수진', '010-2001-0003', 55, 'female', 'active', '꼼꼼한 성격. VIP',          '["임플란트","VIP"]',             '지인소개',   NULL, NULL, '강남구', datetime('now','-160 days')),
  ('pd_04', 'org_demo_full', '이정호', '010-2001-0004', 28, 'male',   'active', '가격 민감, 할부 선호',       '["라미네이트"]',                  '검색광고',   NULL, NULL, '송파구', datetime('now','-150 days')),
  ('pd_05', 'org_demo_full', '한미영', '010-2001-0005', 41, 'female', 'active', '소개 환자',                  '["임플란트"]',                   '지인소개',   NULL, NULL, '강남구', datetime('now','-145 days')),

  -- 2단계: 5명 (Root 직속)
  ('pd_06', 'org_demo_full', '오현우', '010-2001-0006', 42, 'male',   'active', '김민수님 직장동료',          '["임플란트"]',                   '지인소개',   'pd_01', datetime('now','-120 days'), '강남구', datetime('now','-120 days')),
  ('pd_07', 'org_demo_full', '백서영', '010-2001-0007', 36, 'female', 'active', '김민수님 와이프 친구',        '["교정"]',                       '지인소개',   'pd_01', datetime('now','-115 days'), '서초구', datetime('now','-115 days')),
  ('pd_08', 'org_demo_full', '신지호', '010-2001-0008', 30, 'male',   'active', '김민수님 처남',              '["치아미백"]',                   '지인소개',   'pd_01', datetime('now','-110 days'), '강남구', datetime('now','-110 days')),
  ('pd_09', 'org_demo_full', '임소영', '010-2001-0009', 31, 'female', 'active', '박영희님 헬스장 친구',        '["교정"]',                       '지인소개',   'pd_02', datetime('now','-105 days'), '서초구', datetime('now','-105 days')),
  ('pd_10', 'org_demo_full', '강주현', '010-2001-0010', 38, 'male',   'active', '박영희님 회사 동료',          '["임플란트"]',                   '지인소개',   'pd_02', datetime('now','-100 days'), '서초구', datetime('now','-100 days')),

  -- 3단계: 5명
  ('pd_11', 'org_demo_full', '윤재훈', '010-2001-0011', 33, 'male',   'active', '오현우님 동생',              '["라미네이트"]',                  '지인소개',   'pd_06', datetime('now','-90 days'), '강남구', datetime('now','-90 days')),
  ('pd_12', 'org_demo_full', '박지원', '010-2001-0012', 39, 'female', 'active', '백서영님 친구',              '["교정"]',                       '지인소개',   'pd_07', datetime('now','-85 days'), '서초구', datetime('now','-85 days')),
  ('pd_13', 'org_demo_full', '김다은', '010-2001-0013', 26, 'female', 'active', '임소영님 후배',              '["치아미백"]',                   '지인소개',   'pd_09', datetime('now','-80 days'), '서초구', datetime('now','-80 days')),
  ('pd_14', 'org_demo_full', '정태웅', '010-2001-0014', 44, 'male',   'active', '강주현님 거래처',            '["임플란트"]',                   '지인소개',   'pd_10', datetime('now','-75 days'), '강남구', datetime('now','-75 days')),
  ('pd_15', 'org_demo_full', '송예린', '010-2001-0015', 29, 'female', 'active', '최수진님 딸 친구',          '["교정"]',                       '지인소개',   'pd_03', datetime('now','-70 days'), '강남구', datetime('now','-70 days')),

  -- 4단계: 5명
  ('pd_16', 'org_demo_full', '하태진', '010-2001-0016', 35, 'male',   'active', '윤재훈님 친구',              '["임플란트"]',                   '지인소개',   'pd_11', datetime('now','-60 days'), '송파구', datetime('now','-60 days')),
  ('pd_17', 'org_demo_full', '문혜진', '010-2001-0017', 40, 'female', 'active', '정태웅님 아내',              '["교정"]',                       '지인소개',   'pd_14', datetime('now','-55 days'), '강남구', datetime('now','-55 days')),
  ('pd_18', 'org_demo_full', '오세훈', '010-2001-0018', 33, 'male',   'active', '송예린님 오빠',              '["임플란트"]',                   '지인소개',   'pd_15', datetime('now','-50 days'), '강남구', datetime('now','-50 days')),
  ('pd_19', 'org_demo_full', '배유나', '010-2001-0019', 27, 'female', 'active', '이정호님 여자친구',          '["라미네이트"]',                  '지인소개',   'pd_04', datetime('now','-45 days'), '송파구', datetime('now','-45 days')),
  ('pd_20', 'org_demo_full', '곽민재', '010-2001-0020', 50, 'male',   'active', '한미영님 남편',              '["임플란트","VIP"]',             '지인소개',   'pd_05', datetime('now','-40 days'), '강남구', datetime('now','-40 days')),

  -- 5단계: 3명 (가장 깊은 트리)
  ('pd_21', 'org_demo_full', '진현주', '010-2001-0021', 31, 'female', 'active', '하태진님 동료',              '["교정"]',                       '지인소개',   'pd_16', datetime('now','-30 days'), '송파구', datetime('now','-30 days')),
  ('pd_22', 'org_demo_full', '서주영', '010-2001-0022', 28, 'male',   'active', '오세훈님 동생',              '["치아미백"]',                   '지인소개',   'pd_18', datetime('now','-25 days'), '강남구', datetime('now','-25 days')),
  ('pd_23', 'org_demo_full', '한지수', '010-2001-0023', 36, 'female', 'active', '곽민재님 처제',              '["임플란트"]',                   '지인소개',   'pd_20', datetime('now','-20 days'), '강남구', datetime('now','-20 days')),

  -- 고립 환자 2명
  ('pd_24', 'org_demo_full', '나단비', '010-2001-0024', 24, 'female', 'active', '신규 광고 유입',            '["치아미백"]',                   '검색광고',   NULL, NULL, '서초구', datetime('now','-15 days')),
  ('pd_25', 'org_demo_full', '유성호', '010-2001-0025', 52, 'male',   'active', '워크인',                    '["임플란트"]',                   '워크인',     NULL, NULL, '강남구', datetime('now','-10 days'));

-- =====================================================================
-- 4. 상담 30건 (4명 사용자 분산 → 상담사별 K-factor 변별력)
-- =====================================================================
-- 분포 의도:
--   ud_admin (원장):  6건 (VIP/큰 결정만)
--   ud_yujin (김유진): 12건 (가장 많이 + 핵심 소개자 pd_01, pd_02 담당 → 최고 viral K)
--   ud_seoyeon (박서연): 8건
--   ud_jiwon (이지원):   4건
-- status: paid (결제), undecided (미결정), pending (대기), lost (이탈)
INSERT INTO consultations (id, organization_id, user_id, patient_id, consultation_date, duration, treatment_type, treatment_area, amount, patient_psychology, emotion_flow, key_quotes, feedback, status, decision_score, ai_analysis_status, summary, created_at) VALUES

  -- 김유진 - 핵심 소개자 pd_01 김민수 (paid)
  ('cd_01', 'org_demo_full', 'ud_yujin', 'pd_01', datetime('now','-175 days'), 18, '임플란트', '#36, #46', 6000000,
    '{"fear":"통증","decision_factor":"자연스러움","decision_maker":"본인+와이프","budget":"500-700만"}',
    '{"overall_tone":"positive","decision_score":9,"summary":"긴장→관심→결정"}',
    '["진짜 자연스럽네요","바로 진행할게요"]',
    '{"good_points":["통증 설명 명확","할부 적절"],"scores":{"needs_identification":90,"value_delivery":85,"objection_handling":80,"closing":90},"total_score":86}',
    'paid', 9, 'completed', '• 어금니 임플란트 결정\n• 무이자 할부 12개월\n• 와이프 동행', datetime('now','-175 days')),

  -- 김유진 - pd_02 박영희 (paid)
  ('cd_02', 'org_demo_full', 'ud_yujin', 'pd_02', datetime('now','-165 days'), 22, '교정', '전체', 5500000,
    '{"fear":"발치","decision_factor":"빠른 결과","budget":"500만"}',
    '{"overall_tone":"positive","decision_score":8}', '["빠르게 시작할게요"]',
    '{"scores":{"needs_identification":85,"value_delivery":80,"objection_handling":75,"closing":82},"total_score":80}',
    'paid', 8, 'completed', '• 투명교정\n• 24개월 계획', datetime('now','-165 days')),

  -- 박서연 - pd_03 최수진 (paid VIP)
  ('cd_03', 'org_demo_full', 'ud_seoyeon', 'pd_03', datetime('now','-155 days'), 15, '임플란트', '#16, #17, #26', 9000000,
    '{"fear":"실패","decision_factor":"안전성","budget":"무제한"}',
    '{"overall_tone":"positive","decision_score":9}', '["원장님 믿고 맡길게요"]',
    '{"scores":{"needs_identification":92,"value_delivery":88,"objection_handling":85,"closing":92},"total_score":89}',
    'paid', 9, 'completed', '• 어금니 3개 임플란트\n• 안전성 강조 통함', datetime('now','-155 days')),

  -- 박서연 - pd_04 이정호 (paid)
  ('cd_04', 'org_demo_full', 'ud_seoyeon', 'pd_04', datetime('now','-145 days'), 14, '라미네이트', '전치부 6개', 3600000,
    '{"decision_factor":"가격","budget":"300-400만"}',
    '{"overall_tone":"neutral","decision_score":7}', '["할부되면 진행"]',
    '{"scores":{"closing":75},"total_score":75}',
    'paid', 7, 'completed', '• 라미네이트 6개\n• 무이자 6개월', datetime('now','-145 days')),

  -- 이지원 - pd_05 한미영 (paid)
  ('cd_05', 'org_demo_full', 'ud_jiwon', 'pd_05', datetime('now','-140 days'), 13, '임플란트', '#26', 2800000,
    '{"decision_factor":"신뢰"}',
    '{"overall_tone":"positive","decision_score":8}', '["소개받아서 왔어요"]',
    '{"scores":{"closing":78},"total_score":78}',
    'paid', 8, 'completed', '• 단일 임플란트', datetime('now','-140 days')),

  -- 원장 - pd_06 오현우 (paid VIP 케이스)
  ('cd_06', 'org_demo_full', 'ud_admin', 'pd_06', datetime('now','-115 days'), 20, '임플란트', '전체 상악', 12000000,
    '{"decision_factor":"원장 신뢰","budget":"1000만+"}',
    '{"overall_tone":"positive","decision_score":10}', '["원장님께 맡기면 안심"]',
    '{"scores":{"total_score":92},"total_score":92}',
    'paid', 10, 'completed', '• 전악 임플란트\n• 원장 직접 케어', datetime('now','-115 days')),

  -- 김유진 - pd_07 백서영 (paid)
  ('cd_07', 'org_demo_full', 'ud_yujin', 'pd_07', datetime('now','-110 days'), 17, '교정', '전체', 5800000,
    '{"decision_factor":"기간"}',
    '{"overall_tone":"positive","decision_score":8}', '["빠르면 좋겠어요"]',
    '{"scores":{"total_score":83},"total_score":83}',
    'paid', 8, 'completed', '• 투명교정 18개월', datetime('now','-110 days')),

  -- 김유진 - pd_08 신지호 (paid)
  ('cd_08', 'org_demo_full', 'ud_yujin', 'pd_08', datetime('now','-105 days'), 10, '치아미백', '전치부', 600000,
    '{"decision_factor":"가격"}',
    '{"overall_tone":"positive","decision_score":9}', '["오늘 바로 할게요"]',
    '{"scores":{"total_score":80},"total_score":80}',
    'paid', 9, 'completed', '• 즉시 미백', datetime('now','-105 days')),

  -- 김유진 - pd_09 임소영 (paid)
  ('cd_09', 'org_demo_full', 'ud_yujin', 'pd_09', datetime('now','-100 days'), 19, '교정', '전체', 5500000,
    '{"decision_factor":"안정성"}',
    '{"overall_tone":"positive","decision_score":8}', '["친구가 추천해서요"]',
    '{"scores":{"total_score":81},"total_score":81}',
    'paid', 8, 'completed', '• 메탈교정 2년', datetime('now','-100 days')),

  -- 박서연 - pd_10 강주현 (paid)
  ('cd_10', 'org_demo_full', 'ud_seoyeon', 'pd_10', datetime('now','-95 days'), 16, '임플란트', '#36, #37', 5600000,
    '{"decision_factor":"품질"}',
    '{"overall_tone":"positive","decision_score":8}', '["좋은 거로 해주세요"]',
    '{"scores":{"total_score":82},"total_score":82}',
    'paid', 8, 'completed', '• 임플란트 2개', datetime('now','-95 days')),

  -- 김유진 - pd_11 윤재훈 (paid)
  ('cd_11', 'org_demo_full', 'ud_yujin', 'pd_11', datetime('now','-85 days'), 12, '라미네이트', '전치부 4개', 2400000,
    '{"decision_factor":"심미"}',
    '{"overall_tone":"positive","decision_score":8}', '["형이 추천해서 왔어요"]',
    '{"scores":{"total_score":79},"total_score":79}',
    'paid', 8, 'completed', '• 라미네이트 4개', datetime('now','-85 days')),

  -- 박서연 - pd_12 박지원 (paid)
  ('cd_12', 'org_demo_full', 'ud_seoyeon', 'pd_12', datetime('now','-80 days'), 18, '교정', '전체', 5500000,
    '{"decision_factor":"기간"}',
    '{"overall_tone":"positive","decision_score":7}', '["고민해볼게요","역시 해야겠어요"]',
    '{"scores":{"total_score":77},"total_score":77}',
    'paid', 7, 'completed', '• 교정 시작', datetime('now','-78 days')),

  -- 김유진 - pd_13 김다은 (paid)
  ('cd_13', 'org_demo_full', 'ud_yujin', 'pd_13', datetime('now','-75 days'), 9, '치아미백', '전체', 500000,
    '{"decision_factor":"가격"}',
    '{"overall_tone":"positive","decision_score":9}', '["바로 할게요"]',
    '{"scores":{"total_score":78},"total_score":78}',
    'paid', 9, 'completed', '• 미백 진행', datetime('now','-75 days')),

  -- 원장 - pd_14 정태웅 (paid VIP)
  ('cd_14', 'org_demo_full', 'ud_admin', 'pd_14', datetime('now','-70 days'), 22, '임플란트', '하악 전체', 11000000,
    '{"decision_factor":"원장 신뢰"}',
    '{"overall_tone":"positive","decision_score":9}', '["원장님이라 안심"]',
    '{"scores":{"total_score":90},"total_score":90}',
    'paid', 9, 'completed', '• 하악 전악', datetime('now','-70 days')),

  -- 박서연 - pd_15 송예린 (paid)
  ('cd_15', 'org_demo_full', 'ud_seoyeon', 'pd_15', datetime('now','-65 days'), 15, '교정', '전체', 5300000,
    '{"decision_factor":"가격"}',
    '{"overall_tone":"positive","decision_score":7}', '["할부되니 진행"]',
    '{"scores":{"total_score":76},"total_score":76}',
    'paid', 7, 'completed', '• 교정', datetime('now','-65 days')),

  -- 김유진 - pd_16 하태진 (paid)
  ('cd_16', 'org_demo_full', 'ud_yujin', 'pd_16', datetime('now','-55 days'), 16, '임플란트', '#36', 3000000,
    '{"decision_factor":"품질"}',
    '{"overall_tone":"positive","decision_score":8}', '["해야죠"]',
    '{"scores":{"total_score":80},"total_score":80}',
    'paid', 8, 'completed', '• 단일 임플란트', datetime('now','-55 days')),

  -- 박서연 - pd_17 문혜진 (paid)
  ('cd_17', 'org_demo_full', 'ud_seoyeon', 'pd_17', datetime('now','-50 days'), 17, '교정', '전체', 5500000,
    '{"decision_factor":"기간"}',
    '{"overall_tone":"positive","decision_score":8}', '["남편이 받았던 곳"]',
    '{"scores":{"total_score":81},"total_score":81}',
    'paid', 8, 'completed', '• 교정', datetime('now','-48 days')),

  -- 원장 - pd_18 오세훈 (paid)
  ('cd_18', 'org_demo_full', 'ud_admin', 'pd_18', datetime('now','-45 days'), 18, '임플란트', '#46, #47', 5600000,
    '{"decision_factor":"신뢰"}',
    '{"overall_tone":"positive","decision_score":9}', '["원장님께"]',
    '{"scores":{"total_score":85},"total_score":85}',
    'paid', 9, 'completed', '• 어금니 2개', datetime('now','-45 days')),

  -- 김유진 - pd_19 배유나 (paid)
  ('cd_19', 'org_demo_full', 'ud_yujin', 'pd_19', datetime('now','-42 days'), 11, '라미네이트', '전치부 2개', 1200000,
    '{"decision_factor":"심미"}',
    '{"overall_tone":"positive","decision_score":8}', '["남친 추천"]',
    '{"scores":{"total_score":77},"total_score":77}',
    'paid', 8, 'completed', '• 라미네이트', datetime('now','-42 days')),

  -- 이지원 - pd_20 곽민재 (paid)
  ('cd_20', 'org_demo_full', 'ud_jiwon', 'pd_20', datetime('now','-38 days'), 16, '임플란트', '#16, #26', 5600000,
    '{"decision_factor":"안전"}',
    '{"overall_tone":"positive","decision_score":8}', '["아내가 다녔어요"]',
    '{"scores":{"total_score":80},"total_score":80}',
    'paid', 8, 'completed', '• 임플란트 2개', datetime('now','-38 days')),

  -- ----- 미결정/대기/이탈 케이스 (decision_score 다양화) -----

  -- 김유진 - pd_21 진현주 (undecided)
  ('cd_21', 'org_demo_full', 'ud_yujin', 'pd_21', datetime('now','-28 days'), 14, '교정', '전체', 5500000,
    '{"hesitation_reason":"가격","decision_factor":"기간"}',
    '{"overall_tone":"neutral","decision_score":6}', '["생각해볼게요"]',
    '{"scores":{"total_score":72},"total_score":72}',
    'undecided', 6, 'completed', '• 교정 고민 중', datetime('now','-28 days')),

  -- 박서연 - pd_22 서주영 (paid)
  ('cd_22', 'org_demo_full', 'ud_seoyeon', 'pd_22', datetime('now','-23 days'), 8, '치아미백', '전체', 450000,
    '{"decision_factor":"가격"}',
    '{"overall_tone":"positive","decision_score":9}', '["바로 할게요"]',
    '{"scores":{"total_score":78},"total_score":78}',
    'paid', 9, 'completed', '• 미백', datetime('now','-23 days')),

  -- 이지원 - pd_23 한지수 (undecided)
  ('cd_23', 'org_demo_full', 'ud_jiwon', 'pd_23', datetime('now','-18 days'), 13, '임플란트', '#36', 3000000,
    '{"hesitation_reason":"통증"}',
    '{"overall_tone":"neutral","decision_score":5}', '["무서워요"]',
    '{"scores":{"total_score":68},"total_score":68}',
    'undecided', 5, 'completed', '• 통증 걱정', datetime('now','-18 days')),

  -- 김유진 - pd_24 나단비 (lost)
  ('cd_24', 'org_demo_full', 'ud_yujin', 'pd_24', datetime('now','-13 days'), 10, '치아미백', '전체', 500000,
    '{"hesitation_reason":"가격"}',
    '{"overall_tone":"negative","decision_score":3}', '["비싸요","다른 데도 알아볼게요"]',
    '{"scores":{"objection_handling":50,"total_score":58}}',
    'lost', 3, 'completed', '• 가격 이탈', datetime('now','-13 days')),

  -- 이지원 - pd_25 유성호 (pending)
  ('cd_25', 'org_demo_full', 'ud_jiwon', 'pd_25', datetime('now','-8 days'), 12, '임플란트', '#46', 2800000,
    '{"decision_factor":"고민중"}',
    '{"overall_tone":"neutral","decision_score":5}', '["다음에 다시 올게요"]',
    '{"scores":{"total_score":70},"total_score":70}',
    'pending', 5, 'completed', '• 재방문 약속', datetime('now','-8 days')),

  -- 추가 5건 (총 30건 채우기)
  ('cd_26', 'org_demo_full', 'ud_yujin', 'pd_06', datetime('now','-7 days'), 8, '재상담', '경과 확인', 0,
    '{}','{"overall_tone":"positive","decision_score":9}','["만족해요"]','{"total_score":85}','paid', 9, 'completed', '• 경과 양호', datetime('now','-7 days')),
  ('cd_27', 'org_demo_full', 'ud_seoyeon', 'pd_03', datetime('now','-6 days'), 10, '재상담', '경과 확인', 0,
    '{}','{"overall_tone":"positive","decision_score":10}','["다음에 친구 데려올게요"]','{"total_score":88}','paid', 10, 'completed', '• 추가 소개 약속', datetime('now','-6 days')),
  ('cd_28', 'org_demo_full', 'ud_admin', 'pd_01', datetime('now','-5 days'), 12, '재상담', 'VIP 케어', 0,
    '{}','{"overall_tone":"positive","decision_score":10}','["원장님 짱"]','{"total_score":95}','paid', 10, 'completed', '• VIP 케어', datetime('now','-5 days')),
  ('cd_29', 'org_demo_full', 'ud_yujin', 'pd_02', datetime('now','-4 days'), 9, '재상담', '교정 진행', 0,
    '{}','{"overall_tone":"positive","decision_score":9}','["순조로워요"]','{"total_score":86}','paid', 9, 'completed', '• 교정 순조', datetime('now','-4 days')),
  ('cd_30', 'org_demo_full', 'ud_seoyeon', 'pd_15', datetime('now','-3 days'), 14, '교정', '전체 (추가)', 1500000,
    '{"decision_factor":"추가옵션"}','{"overall_tone":"positive","decision_score":8}','["옵션 추가 할게요"]','{"total_score":82}','paid', 8, 'completed', '• 옵션 추가 결제', datetime('now','-3 days'));

-- =====================================================================
-- 5. Consultation Reports (상담 보고서)
-- =====================================================================
INSERT INTO consultation_reports (id, organization_id, consultation_id, consultation_summary, overall_sentiment, patient_concerns, next_actions, decision_score, coaching_score, generated_at, created_at) VALUES
  ('rep_01', 'org_demo_full', 'cd_01', '환자는 어금니 임플란트를 결정했고, 무이자 12개월 할부로 진행. 와이프 동행 결정 자료가 효과적이었음.', 'very_positive', '["임플란트","할부","와이프설득"]', '["계약서 작성","수술 일정 확정"]', 9, 86, datetime('now','-175 days'), datetime('now','-175 days')),
  ('rep_02', 'org_demo_full', 'cd_02', '투명교정 결정. 발치 설명 후 24개월 계획에 동의.',                                       'positive',      '["투명교정","발치"]',                       '["검사 일정","계약"]',           8, 80, datetime('now','-165 days'), datetime('now','-165 days')),
  ('rep_03', 'org_demo_full', 'cd_03', 'VIP 환자. 어금니 3개 임플란트 안전성 강조로 결정.',                                     'very_positive', '["VIP","임플란트","안전성"]',              '["CT 촬영","계약"]',             9, 89, datetime('now','-155 days'), datetime('now','-155 days')),
  ('rep_06', 'org_demo_full', 'cd_06', '전악 임플란트 1,200만원. 원장 직접 진료에 대한 신뢰가 결정 요인.',                       'very_positive', '["전악","원장신뢰"]',                       '["스케일링 우선","수술 일정"]',  10, 92, datetime('now','-115 days'), datetime('now','-115 days')),
  ('rep_14', 'org_demo_full', 'cd_14', '하악 전악 임플란트 1,100만원. 케이스 난이도 높음.',                                     'very_positive', '["하악전악","난이도높음"]',                 '["골이식 검토","수술 일정"]',    9, 90, datetime('now','-70 days'),  datetime('now','-70 days')),
  ('rep_21', 'org_demo_full', 'cd_21', '교정 가격 부담. 객관식 동의 안함, 재상담 필요.',                                          'neutral',       '["가격저항","재상담필요"]',                 '["3일 후 콜백","할부 제안서"]',  6, 72, datetime('now','-28 days'),  datetime('now','-28 days')),
  ('rep_24', 'org_demo_full', 'cd_24', '미백 가격 비싸다며 거절. 다른 데 알아본다고 함.',                                        'negative',      '["이탈","가격불만"]',                       '["프로모션 검토"]',              3, 58, datetime('now','-13 days'),  datetime('now','-13 days'));

-- =====================================================================
-- 6. Treatment Proposals (제안서)
-- =====================================================================
INSERT INTO treatment_proposals (id, organization_id, consultation_id, report_id, patient_id, title, total_amount, final_amount, cta_type, public_token, sent_via, status, created_at, sent_at, viewed_at) VALUES
  ('prop_01', 'org_demo_full', 'cd_01', 'rep_01', 'pd_01', '김민수님 임플란트 진료 제안서', 6000000,  6000000,  'both',         'tok_demo_pd01_aa11', 'kakao', 'converted', datetime('now','-174 days'), datetime('now','-174 days'), datetime('now','-173 days')),
  ('prop_02', 'org_demo_full', 'cd_02', 'rep_02', 'pd_02', '박영희님 교정 진료 제안서',    5500000,  5500000,  'reservation',  'tok_demo_pd02_bb22', 'kakao', 'converted', datetime('now','-164 days'), datetime('now','-164 days'), datetime('now','-163 days')),
  ('prop_03', 'org_demo_full', 'cd_03', 'rep_03', 'pd_03', '최수진님 VIP 임플란트 제안서', 9000000,  9000000,  'both',         'tok_demo_pd03_cc33', 'email', 'converted', datetime('now','-154 days'), datetime('now','-154 days'), datetime('now','-153 days')),
  ('prop_06', 'org_demo_full', 'cd_06', 'rep_06', 'pd_06', '오현우님 전악 임플란트 제안서',12000000, 12000000, 'both',         'tok_demo_pd06_dd44', 'kakao', 'converted', datetime('now','-114 days'), datetime('now','-114 days'), datetime('now','-113 days')),
  ('prop_14', 'org_demo_full', 'cd_14', 'rep_14', 'pd_14', '정태웅님 하악 전악 제안서',    11000000, 11000000, 'both',         'tok_demo_pd14_ee55', 'kakao', 'converted', datetime('now','-69 days'),  datetime('now','-69 days'),  datetime('now','-68 days')),
  ('prop_21', 'org_demo_full', 'cd_21', 'rep_21', 'pd_21', '진현주님 교정 할부 제안서',    5500000,  4900000,  'reservation',  'tok_demo_pd21_ff66', 'kakao', 'sent',      datetime('now','-27 days'),  datetime('now','-27 days'),  NULL),
  ('prop_24', 'org_demo_full', 'cd_24', 'rep_24', 'pd_24', '나단비님 미백 프로모션 제안서',500000,   350000,   'reservation',  'tok_demo_pd24_gg77', 'sms',   'viewed',    datetime('now','-12 days'),  datetime('now','-12 days'),  datetime('now','-11 days'));

-- =====================================================================
-- 7. STT Chunks (음성 인식 청크)
-- =====================================================================
INSERT INTO stt_chunks (id, consultation_id, chunk_index, speaker, transcript, start_time, end_time, created_at) VALUES
  ('stt_01_1', 'cd_01', 0, 'consultant', '안녕하세요 김민수님, 오늘 어떤 부분이 불편하셔서 오셨어요?', 0.0,  5.0,  datetime('now','-175 days')),
  ('stt_01_2', 'cd_01', 1, 'patient',    '아랫니가 빠진 지 좀 됐는데요, 임플란트 하려고요.',                5.5,  12.0, datetime('now','-175 days')),
  ('stt_01_3', 'cd_01', 2, 'consultant', '아 네, 두 개 다 임플란트 가능합니다. 통증 걱정은 없으세요?',       13.0, 19.0, datetime('now','-175 days')),
  ('stt_01_4', 'cd_01', 3, 'patient',    '통증이 제일 걱정이에요.',                                          20.0, 23.0, datetime('now','-175 days')),
  ('stt_01_5', 'cd_01', 4, 'consultant', '저희는 무통 마취 시스템 갖추고 있어서 거의 안 아프세요.',           24.0, 30.0, datetime('now','-175 days')),
  ('stt_03_1', 'cd_03', 0, 'consultant', '최수진님, 오늘 어금니 세 개 보겠습니다.',                          0.0,  4.0,  datetime('now','-155 days')),
  ('stt_03_2', 'cd_03', 1, 'patient',    '제일 중요한 건 안전성이에요. 원장님 직접 봐주실 거죠?',            4.5,  11.0, datetime('now','-155 days')),
  ('stt_03_3', 'cd_03', 2, 'consultant', '네 원장님이 직접 케어하시고 케이스도 다 보세요.',                  12.0, 18.0, datetime('now','-155 days'));

-- =====================================================================
-- 8. AI Hints Log (실시간 코칭 힌트)
-- =====================================================================
INSERT INTO ai_hints_log (id, consultation_id, hint_type, hint_message, shown_to_user, created_at) VALUES
  ('hint_01_1', 'cd_01', 'rapport',   '환자가 긴장 상태입니다. 간단한 농담이나 어색함 깨기를 시도하세요.', 1, datetime('now','-175 days')),
  ('hint_01_2', 'cd_01', 'objection', '통증 우려 제기 - 무통 마취 시스템 강조 추천',                       1, datetime('now','-175 days')),
  ('hint_01_3', 'cd_01', 'closing',   '환자 결정 신호 감지. 무이자 할부 옵션을 지금 제시하세요.',          1, datetime('now','-175 days')),
  ('hint_03_1', 'cd_03', 'pricing',   '환자가 안전성 중시 - 가격보다 품질 강조 우선',                      1, datetime('now','-155 days')),
  ('hint_21_1', 'cd_21', 'objection', '가격 망설임 명확. 할부 옵션을 즉시 제시하세요.',                    0, datetime('now','-28 days')),
  ('hint_24_1', 'cd_24', 'warning',   '환자 이탈 위험 신호 감지! 가격 가치 재설명 시도',                   0, datetime('now','-13 days'));

-- =====================================================================
-- 9. Patient Treatments (치료 데이터) - 이탈 예측 input
-- =====================================================================
INSERT INTO patient_treatments (id, organization_id, patient_id, treatment_type, treatment_name, status, total_amount, paid_amount, started_at, completed_at, next_appointment, source_consultation_id, created_at) VALUES
  ('pt_01', 'org_demo_full', 'pd_01', 'implant',   '어금니 임플란트 #36, #46',  'in_progress', 6000000,  4000000, datetime('now','-170 days'), NULL,                       datetime('now','+7 days'),  'cd_01', datetime('now','-170 days')),
  ('pt_02', 'org_demo_full', 'pd_02', 'ortho',     '투명교정 전체',              'in_progress', 5500000,  2000000, datetime('now','-160 days'), NULL,                       datetime('now','+14 days'), 'cd_02', datetime('now','-160 days')),
  ('pt_03', 'org_demo_full', 'pd_03', 'implant',   'VIP 임플란트 #16,#17,#26',  'completed',   9000000,  9000000, datetime('now','-150 days'), datetime('now','-30 days'), NULL,                       'cd_03', datetime('now','-150 days')),
  ('pt_04', 'org_demo_full', 'pd_04', 'laminate',  '라미네이트 6개',             'completed',   3600000,  3600000, datetime('now','-140 days'), datetime('now','-60 days'), NULL,                       'cd_04', datetime('now','-140 days')),
  ('pt_05', 'org_demo_full', 'pd_05', 'implant',   '단일 임플란트 #26',          'completed',   2800000,  2800000, datetime('now','-135 days'), datetime('now','-80 days'), NULL,                       'cd_05', datetime('now','-135 days')),
  ('pt_06', 'org_demo_full', 'pd_06', 'implant',   '전악 상악 임플란트',         'in_progress', 12000000, 8000000, datetime('now','-110 days'), NULL,                       datetime('now','+10 days'), 'cd_06', datetime('now','-110 days')),
  ('pt_07', 'org_demo_full', 'pd_07', 'ortho',     '투명교정',                   'in_progress', 5800000,  2000000, datetime('now','-105 days'), NULL,                       datetime('now','+21 days'), 'cd_07', datetime('now','-105 days')),
  ('pt_08', 'org_demo_full', 'pd_08', 'whitening', '치아미백',                   'completed',   600000,   600000,  datetime('now','-100 days'), datetime('now','-95 days'), NULL,                       'cd_08', datetime('now','-100 days')),
  ('pt_09', 'org_demo_full', 'pd_09', 'ortho',     '메탈교정',                   'in_progress', 5500000,  1500000, datetime('now','-95 days'),  NULL,                       datetime('now','+30 days'), 'cd_09', datetime('now','-95 days')),
  ('pt_10', 'org_demo_full', 'pd_10', 'implant',   '임플란트 #36,#37',          'in_progress', 5600000,  3000000, datetime('now','-90 days'),  NULL,                       datetime('now','+7 days'),  'cd_10', datetime('now','-90 days')),
  ('pt_11', 'org_demo_full', 'pd_11', 'laminate',  '라미네이트 4개',             'completed',   2400000,  2400000, datetime('now','-80 days'),  datetime('now','-50 days'), NULL,                       'cd_11', datetime('now','-80 days')),
  ('pt_12', 'org_demo_full', 'pd_12', 'ortho',     '교정',                       'in_progress', 5500000,  1000000, datetime('now','-75 days'),  NULL,                       datetime('now','+30 days'), 'cd_12', datetime('now','-75 days')),
  ('pt_13', 'org_demo_full', 'pd_13', 'whitening', '미백',                       'completed',   500000,   500000,  datetime('now','-70 days'),  datetime('now','-68 days'), NULL,                       'cd_13', datetime('now','-70 days')),
  ('pt_14', 'org_demo_full', 'pd_14', 'implant',   '하악 전악',                  'in_progress', 11000000, 5000000, datetime('now','-65 days'),  NULL,                       datetime('now','+14 days'), 'cd_14', datetime('now','-65 days')),
  ('pt_15', 'org_demo_full', 'pd_15', 'ortho',     '교정',                       'in_progress', 5300000,  500000,  datetime('now','-60 days'),  NULL,                       datetime('now','+30 days'), 'cd_15', datetime('now','-60 days')),
  ('pt_16', 'org_demo_full', 'pd_16', 'implant',   '임플란트 #36',               'in_progress', 3000000,  1500000, datetime('now','-50 days'),  NULL,                       datetime('now','+10 days'), 'cd_16', datetime('now','-50 days')),
  ('pt_17', 'org_demo_full', 'pd_17', 'ortho',     '교정',                       'in_progress', 5500000,  500000,  datetime('now','-45 days'),  NULL,                       datetime('now','+21 days'), 'cd_17', datetime('now','-45 days')),
  ('pt_18', 'org_demo_full', 'pd_18', 'implant',   '어금니 임플란트',            'in_progress', 5600000,  2500000, datetime('now','-40 days'),  NULL,                       datetime('now','+7 days'),  'cd_18', datetime('now','-40 days')),
  ('pt_19', 'org_demo_full', 'pd_19', 'laminate',  '라미네이트 2개',             'completed',   1200000,  1200000, datetime('now','-38 days'),  datetime('now','-20 days'), NULL,                       'cd_19', datetime('now','-38 days')),
  ('pt_20', 'org_demo_full', 'pd_20', 'implant',   '임플란트 #16,#26',          'in_progress', 5600000,  2000000, datetime('now','-35 days'),  NULL,                       datetime('now','+14 days'), 'cd_20', datetime('now','-35 days')),
  ('pt_22', 'org_demo_full', 'pd_22', 'whitening', '미백',                       'completed',   450000,   450000,  datetime('now','-22 days'),  datetime('now','-21 days'), NULL,                       'cd_22', datetime('now','-22 days'));

-- =====================================================================
-- 10. Patient Retention Status (안부 연락 추천 대상)
-- =====================================================================
INSERT INTO patient_retention_status (id, organization_id, patient_id, status, risk_score, last_visit_date, recommended_contact_date, recommended_contact_type, recommended_contact_script, priority_score, updated_at) VALUES
  ('rs_01', 'org_demo_full', 'pd_03', 'recall_6m',              30, datetime('now','-30 days'),  datetime('now','+5 days'),  'kakao', 'VIP - 정기 검진 안내',                 85, datetime('now','-1 days')),
  ('rs_02', 'org_demo_full', 'pd_05', 'recall_6m',              40, datetime('now','-80 days'),  datetime('now','-10 days'), 'phone', '6개월 검진 시기',                       90, datetime('now','-1 days')),
  ('rs_03', 'org_demo_full', 'pd_08', 'recall_6m',              55, datetime('now','-95 days'),  datetime('now','-25 days'), 'kakao', '미백 후 케어 안내',                     75, datetime('now','-1 days')),
  ('rs_04', 'org_demo_full', 'pd_13', 'recall_6m',              45, datetime('now','-68 days'),  datetime('now','+2 days'),  'kakao', '미백 6개월 후 케어',                     70, datetime('now','-1 days')),
  ('rs_05', 'org_demo_full', 'pd_21', 'consulted_unconverted',  75, datetime('now','-28 days'),  datetime('now','+1 days'),  'phone', '미결정 → 결정 유도 필요',                95, datetime('now','-1 days')),
  ('rs_06', 'org_demo_full', 'pd_23', 'at_risk',                80, datetime('now','-18 days'),  datetime('now','-3 days'),  'phone', '통증 걱정으로 미결정 - 안심 멘트 필요',  92, datetime('now','-1 days')),
  ('rs_07', 'org_demo_full', 'pd_24', 'at_risk',                90, datetime('now','-13 days'),  datetime('now','-5 days'),  'phone', '이탈 직전 - 즉시 컨택 필요',              98, datetime('now','-1 days')),
  ('rs_08', 'org_demo_full', 'pd_25', 'consulted_unconverted',  65, datetime('now','-8 days'),   datetime('now','+3 days'),  'kakao', '재방문 약속 확인',                       80, datetime('now','-1 days')),
  ('rs_09', 'org_demo_full', 'pd_19', 'recall_6m',              35, datetime('now','-20 days'),  datetime('now','+45 days'), 'kakao', '라미네이트 후 케어',                     60, datetime('now','-1 days')),
  ('rs_10', 'org_demo_full', 'pd_04', 'recall_12m',             50, datetime('now','-60 days'),  datetime('now','+300 days'),'kakao', '연 1회 검진',                            50, datetime('now','-1 days'));

-- =====================================================================
-- 11. Retention Contacts (실제 연락 실행 기록)
-- =====================================================================
INSERT INTO retention_contacts (id, organization_id, patient_id, staff_id, contact_type, result, notes, contacted_at) VALUES
  ('rc_01', 'org_demo_full', 'pd_03', 'ud_seoyeon', 'kakao', 'message_sent',        '6개월 검진 안내 - 답장 대기',           datetime('now','-25 days')),
  ('rc_02', 'org_demo_full', 'pd_03', 'ud_seoyeon', 'kakao', 'appointment_booked',  '다음 주 검진 예약 잡힘',                datetime('now','-23 days')),
  ('rc_03', 'org_demo_full', 'pd_05', 'ud_jiwon',   'phone', 'connected',           '안부 통화, 만족도 높음',                datetime('now','-15 days')),
  ('rc_04', 'org_demo_full', 'pd_05', 'ud_jiwon',   'phone', 'appointment_booked',  '6개월 검진 예약',                       datetime('now','-15 days')),
  ('rc_05', 'org_demo_full', 'pd_08', 'ud_yujin',   'kakao', 'message_sent',        '미백 케어 메시지',                      datetime('now','-20 days')),
  ('rc_06', 'org_demo_full', 'pd_13', 'ud_yujin',   'kakao', 'connected',           '안부 인사',                             datetime('now','-10 days')),
  ('rc_07', 'org_demo_full', 'pd_21', 'ud_yujin',   'phone', 'callback_promised',   '다음 주 다시 연락 요청',                 datetime('now','-12 days')),
  ('rc_08', 'org_demo_full', 'pd_21', 'ud_yujin',   'phone', 'connected',           '할부 제안서 확인 → 긍정적 반응',         datetime('now','-5 days')),
  ('rc_09', 'org_demo_full', 'pd_24', 'ud_yujin',   'phone', 'no_answer',           '응답 없음',                              datetime('now','-8 days')),
  ('rc_10', 'org_demo_full', 'pd_24', 'ud_yujin',   'phone', 'refused',             '거절 의사 표명',                         datetime('now','-3 days')),
  ('rc_11', 'org_demo_full', 'pd_23', 'ud_jiwon',   'phone', 'connected',           '통증 걱정 다시 설명',                    datetime('now','-7 days')),
  ('rc_12', 'org_demo_full', 'pd_23', 'ud_jiwon',   'kakao', 'message_sent',        '무통 마취 영상 전송',                    datetime('now','-4 days'));

-- =====================================================================
-- 12. Contact Tasks (해야 할 연락 작업)
-- =====================================================================
INSERT INTO contact_tasks (id, organization_id, consultation_id, user_id, patient_id, task_type, recommended_date, recommended_message, points, status, created_at) VALUES
  ('td_01', 'org_demo_full', 'cd_21', 'ud_yujin',   'pd_21', 'closing',   datetime('now','+1 days', 'start of day', '+10 hours'), '진현주님 안녕하세요, 할부 제안서 확인하셨나요? 부담 없이 시작하실 수 있도록 도와드리겠습니다.', '["할부 강조","부담 완화"]', 'pending',   datetime('now','-25 days')),
  ('td_02', 'org_demo_full', 'cd_23', 'ud_jiwon',   'pd_23', 'closing',   datetime('now','+0 days', 'start of day', '+11 hours'), '한지수님, 통증 걱정에 대해 안심하실 수 있는 자료 추가로 보내드릴게요.', '["통증 안심","무통 마취"]', 'pending',   datetime('now','-15 days')),
  ('td_03', 'org_demo_full', 'cd_24', 'ud_yujin',   'pd_24', 'closing',   datetime('now','-3 days'),                               '나단비님, 미백 프로모션 진행 중입니다.',                                                  '["프로모션"]',          'completed', datetime('now','-10 days')),
  ('td_04', 'org_demo_full', 'cd_25', 'ud_jiwon',   'pd_25', 'closing',   datetime('now','+2 days', 'start of day', '+14 hours'), '유성호님, 약속하신 재방문 안내드립니다.',                                                  '["재방문 확정"]',       'pending',   datetime('now','-5 days')),
  ('td_05', 'org_demo_full', NULL,    'ud_seoyeon', 'pd_03', 'proactive', datetime('now','+5 days', 'start of day', '+10 hours'), '최수진님, 정기 검진 시기가 다가오고 있어요.',                                              '["검진","VIP 케어"]',   'pending',   datetime('now','-1 days')),
  ('td_06', 'org_demo_full', NULL,    'ud_jiwon',   'pd_05', 'proactive', datetime('now','+0 days', 'start of day', '+15 hours'), '한미영님 6개월 검진 시기예요.',                                                              '["검진"]',              'pending',   datetime('now','-1 days'));

-- =====================================================================
-- 13. Contact Logs (컨택 로그 - completed task에 대한)
-- =====================================================================
INSERT INTO contact_logs (id, organization_id, patient_id, user_id, task_id, contact_type, contact_result, outcome, content, created_at) VALUES
  ('cl_01', 'org_demo_full', 'pd_24', 'ud_yujin', 'td_03', 'call', 'success', 'rejected', '거절 의사 - 다른 데서 진행하겠다고 함', datetime('now','-3 days'));

-- =====================================================================
-- 14. Churn Predictions (이탈 예측 + 피드백 누적)
-- =====================================================================
-- 60건 예측: 50건은 actual_outcome 있음 (학습 데이터), 10건은 NULL (미평가)
-- 정확도 의도적으로 변동: 1~2주 전 70%, 3~4주 전 75%, 최근 85% (개선 추세 → 'optional' or 'recommended' 추천)

INSERT INTO churn_predictions (id, organization_id, patient_id, churn_probability, risk_level, predicted_window_days, key_risk_factors, recommended_action, recommended_script, confidence, rule_based_score, predicted_at, actual_outcome, feedback_at, feedback_note) VALUES
  -- 최근 2주 (정확도 85% → 5개 중 4개 적중)
  ('chp_01', 'org_demo_full', 'pd_24', 85, 'high',     14, '["가격저항","즉시이탈징후","2회미응답"]', '프로모션 안내 + 가격 가치 재설명', '나단비님, 더 합리적인 옵션을 안내드릴 수 있어요.', 0.85, 80, datetime('now','-12 days'), 'churned',  datetime('now','-3 days'),  '거절 의사 확정'),
  ('chp_02', 'org_demo_full', 'pd_23', 75, 'high',     21, '["통증걱정","미결정장기화"]',           '무통 마취 영상 전송 + 안심 멘트',     '한지수님, 통증 걱정 안심시켜 드릴게요.',           0.80, 70, datetime('now','-10 days'), 'retained', datetime('now','-4 days'),  '메시지 응답 + 긍정 전환'),
  ('chp_03', 'org_demo_full', 'pd_21', 65, 'medium',   21, '["가격저항","결정유보"]',               '할부 제안서 + 콜백',                 '진현주님, 할부 옵션 확인 부탁드려요.',             0.78, 60, datetime('now','-8 days'),  'retained', datetime('now','-2 days'),  '할부 제안서 확인 후 긍정'),
  ('chp_04', 'org_demo_full', 'pd_25', 55, 'medium',   30, '["재방문대기","결정유보"]',             '약속 시점 컨택',                     '유성호님, 약속하신 방문 잘 부탁드려요.',           0.72, 55, datetime('now','-5 days'),  'unknown',  datetime('now','-1 days'),  '재방문 대기 중'),
  ('chp_05', 'org_demo_full', 'pd_19', 30, 'low',      45, '["만족도양호"]',                        '주기적 안부',                        '배유나님, 잘 지내시죠?',                           0.75, 25, datetime('now','-7 days'),  'retained', datetime('now','-2 days'),  '만족도 유지'),

  -- 3~4주 전 (정확도 75% → 12개 중 9개 적중)
  ('chp_06', 'org_demo_full', 'pd_24', 70, 'high',     21, '["가격저항"]',                          '프로모션',                           '나단비님 안내드려요',                              0.75, 65, datetime('now','-22 days'), 'churned',  datetime('now','-15 days'), '실제 이탈'),
  ('chp_07', 'org_demo_full', 'pd_21', 50, 'medium',   30, '["미결정","가격민감"]',                 '재상담',                             '진현주님, 추가 안내드려요',                        0.65, 45, datetime('now','-25 days'), 'retained', datetime('now','-10 days'), '재상담 진행'),
  ('chp_08', 'org_demo_full', 'pd_22', 40, 'low',      30, '["일회성환자"]',                        '안부',                               '서주영님 잘 지내시죠?',                            0.70, 35, datetime('now','-20 days'), 'retained', datetime('now','-12 days'), '미백 완료 후 만족'),
  ('chp_09', 'org_demo_full', 'pd_20', 25, 'low',      60, '["VIP","치료중"]',                      '없음',                               '곽민재님, 다음 시술 안내드려요',                   0.80, 20, datetime('now','-21 days'), 'retained', datetime('now','-8 days'),  'VIP 유지'),
  ('chp_10', 'org_demo_full', 'pd_18', 30, 'low',      45, '["치료중","순조"]',                     '안부',                               '오세훈님, 다음 진료 준비됐어요',                   0.75, 25, datetime('now','-23 days'), 'retained', datetime('now','-9 days'),  '치료 진행 양호'),
  ('chp_11', 'org_demo_full', 'pd_17', 35, 'low',      45, '["교정초기"]',                          '안부',                               '문혜진님, 적응 잘 되시죠?',                        0.70, 30, datetime('now','-24 days'), 'retained', datetime('now','-11 days'), '교정 적응 OK'),
  ('chp_12', 'org_demo_full', 'pd_16', 25, 'low',      60, '["치료중"]',                            '없음',                               '하태진님',                                         0.78, 20, datetime('now','-25 days'), 'retained', datetime('now','-10 days'), '진행 양호'),
  ('chp_13', 'org_demo_full', 'pd_15', 60, 'medium',   30, '["교정중도이탈위험"]',                  '교정 진행 안내',                     '송예린님, 교정 진행 잘 따라오시죠?',               0.65, 55, datetime('now','-22 days'), 'churned',  datetime('now','-8 days'),  '예측 적중 - 이탈'),
  ('chp_14', 'org_demo_full', 'pd_14', 20, 'low',      90, '["VIP"]',                               '없음',                               '정태웅님, VIP 케어',                               0.85, 15, datetime('now','-23 days'), 'retained', datetime('now','-9 days'),  'VIP 유지'),
  ('chp_15', 'org_demo_full', 'pd_13', 45, 'medium',   45, '["일회성환자"]',                        '안부',                               '김다은님 잘 지내시죠?',                            0.70, 40, datetime('now','-24 days'), 'churned',  datetime('now','-7 days'),  '추가 진료 없음'),
  ('chp_16', 'org_demo_full', 'pd_12', 30, 'low',      60, '["교정중"]',                            '없음',                               '박지원님',                                         0.75, 25, datetime('now','-25 days'), 'retained', datetime('now','-8 days'),  '진행 양호'),
  ('chp_17', 'org_demo_full', 'pd_11', 50, 'medium',   45, '["일회성"]',                            '안부',                               '윤재훈님',                                         0.65, 45, datetime('now','-26 days'), 'retained', datetime('now','-6 days'),  '재방문'),

  -- 5~6주 전 (정확도 70% → 12개 중 8~9개 적중)
  ('chp_18', 'org_demo_full', 'pd_10', 35, 'low',      60, '["치료중"]',                            '없음',                               '강주현님',                                         0.70, 30, datetime('now','-35 days'), 'retained', datetime('now','-15 days'), 'OK'),
  ('chp_19', 'org_demo_full', 'pd_09', 40, 'low',      60, '["교정초기"]',                          '안부',                               '임소영님',                                         0.65, 35, datetime('now','-36 days'), 'retained', datetime('now','-14 days'), 'OK'),
  ('chp_20', 'org_demo_full', 'pd_08', 55, 'medium',   30, '["일회성"]',                            '재방문 유도',                        '신지호님, 미백 케어 안내',                         0.60, 50, datetime('now','-38 days'), 'churned',  datetime('now','-13 days'), '예측 적중'),
  ('chp_21', 'org_demo_full', 'pd_07', 30, 'low',      90, '["교정"]',                              '없음',                               '백서영님',                                         0.75, 25, datetime('now','-37 days'), 'retained', datetime('now','-15 days'), 'OK'),
  ('chp_22', 'org_demo_full', 'pd_06', 20, 'low',      120,'["VIP","전악치료"]',                    '없음',                               '오현우님',                                         0.85, 15, datetime('now','-38 days'), 'retained', datetime('now','-14 days'), 'VIP'),
  ('chp_23', 'org_demo_full', 'pd_05', 50, 'medium',   45, '["완료환자"]',                          '검진 안내',                          '한미영님',                                         0.65, 45, datetime('now','-39 days'), 'retained', datetime('now','-13 days'), '검진 예약'),
  ('chp_24', 'org_demo_full', 'pd_04', 60, 'medium',   30, '["일회성","가격민감"]',                 '안부',                               '이정호님',                                         0.55, 55, datetime('now','-40 days'), 'churned',  datetime('now','-12 days'), '예측 빗나감 (실제 만족 후 이탈)'),
  ('chp_25', 'org_demo_full', 'pd_03', 15, 'low',      120,'["VIP"]',                               '없음',                               '최수진님',                                         0.90, 10, datetime('now','-41 days'), 'retained', datetime('now','-11 days'), 'VIP'),
  ('chp_26', 'org_demo_full', 'pd_02', 25, 'low',      90, '["교정중"]',                            '없음',                               '박영희님',                                         0.80, 20, datetime('now','-42 days'), 'retained', datetime('now','-10 days'), 'OK'),
  ('chp_27', 'org_demo_full', 'pd_01', 20, 'low',      120,'["VIP","핵심소개자"]',                  '없음',                               '김민수님',                                         0.85, 15, datetime('now','-43 days'), 'retained', datetime('now','-9 days'),  'VIP'),
  ('chp_28', 'org_demo_full', 'pd_22', 70, 'high',     21, '["일회성"]',                            '재방문 유도',                        '서주영님 안내',                                    0.55, 65, datetime('now','-35 days'), 'retained', datetime('now','-8 days'),  '예측 빗나감'),
  ('chp_29', 'org_demo_full', 'pd_19', 35, 'low',      60, '["완료"]',                              '안부',                               '배유나님',                                         0.75, 30, datetime('now','-36 days'), 'retained', datetime('now','-7 days'),  'OK'),

  -- 7~8주 전 (오래된 데이터, 정확도 65%)
  ('chp_30', 'org_demo_full', 'pd_18', 50, 'medium',   45, '["치료중"]',                            '안부',                               '오세훈님',                                         0.60, 45, datetime('now','-52 days'), 'retained', datetime('now','-15 days'), 'OK'),
  ('chp_31', 'org_demo_full', 'pd_17', 60, 'medium',   30, '["교정"]',                              '안부',                               '문혜진님',                                         0.55, 55, datetime('now','-53 days'), 'retained', datetime('now','-15 days'), '예측 빗나감'),
  ('chp_32', 'org_demo_full', 'pd_16', 45, 'medium',   45, '["일회성"]',                            '안부',                               '하태진님',                                         0.60, 40, datetime('now','-54 days'), 'retained', datetime('now','-16 days'), '예측 빗나감'),
  ('chp_33', 'org_demo_full', 'pd_15', 70, 'high',     21, '["교정초기위험"]',                      '컨택',                               '송예린님',                                         0.65, 65, datetime('now','-55 days'), 'churned',  datetime('now','-17 days'), '적중'),
  ('chp_34', 'org_demo_full', 'pd_14', 30, 'low',      90, '["VIP"]',                               '없음',                               '정태웅님',                                         0.80, 25, datetime('now','-56 days'), 'retained', datetime('now','-16 days'), 'OK'),
  ('chp_35', 'org_demo_full', 'pd_13', 65, 'medium',   30, '["일회성"]',                            '안부',                               '김다은님',                                         0.60, 60, datetime('now','-57 days'), 'churned',  datetime('now','-15 days'), '적중'),
  ('chp_36', 'org_demo_full', 'pd_12', 45, 'medium',   45, '["교정"]',                              '안부',                               '박지원님',                                         0.65, 40, datetime('now','-58 days'), 'retained', datetime('now','-14 days'), '예측 빗나감'),
  ('chp_37', 'org_demo_full', 'pd_11', 60, 'medium',   30, '["일회성"]',                            '재상담',                             '윤재훈님',                                         0.55, 55, datetime('now','-59 days'), 'retained', datetime('now','-13 days'), '예측 빗나감'),
  ('chp_38', 'org_demo_full', 'pd_10', 45, 'medium',   45, '["치료중"]',                            '안부',                               '강주현님',                                         0.70, 40, datetime('now','-60 days'), 'retained', datetime('now','-12 days'), 'OK'),
  ('chp_39', 'org_demo_full', 'pd_09', 50, 'medium',   45, '["교정"]',                              '안부',                               '임소영님',                                         0.65, 45, datetime('now','-61 days'), 'retained', datetime('now','-11 days'), '예측 빗나감'),
  ('chp_40', 'org_demo_full', 'pd_08', 70, 'high',     21, '["일회성"]',                            '재상담',                             '신지호님',                                         0.55, 65, datetime('now','-62 days'), 'churned',  datetime('now','-10 days'), '적중'),

  -- 9~12주 전 (가장 오래됨, 정확도 60% - 모델 초기)
  ('chp_41', 'org_demo_full', 'pd_07', 55, 'medium',   45, '["교정"]',                              '안부',                               '백서영님',                                         0.55, 50, datetime('now','-75 days'), 'retained', datetime('now','-30 days'), '예측 빗나감'),
  ('chp_42', 'org_demo_full', 'pd_06', 40, 'low',      60, '["VIP"]',                               '없음',                               '오현우님',                                         0.70, 35, datetime('now','-76 days'), 'retained', datetime('now','-29 days'), 'OK'),
  ('chp_43', 'org_demo_full', 'pd_05', 65, 'medium',   30, '["완료"]',                              '검진 안내',                          '한미영님',                                         0.55, 60, datetime('now','-78 days'), 'retained', datetime('now','-28 days'), '예측 빗나감'),
  ('chp_44', 'org_demo_full', 'pd_04', 75, 'high',     21, '["가격민감"]',                          '프로모션',                           '이정호님',                                         0.55, 70, datetime('now','-80 days'), 'churned',  datetime('now','-27 days'), '적중'),
  ('chp_45', 'org_demo_full', 'pd_03', 30, 'low',      90, '["VIP"]',                               '없음',                               '최수진님',                                         0.80, 25, datetime('now','-82 days'), 'retained', datetime('now','-26 days'), 'OK'),
  ('chp_46', 'org_demo_full', 'pd_02', 50, 'medium',   45, '["교정"]',                              '안부',                               '박영희님',                                         0.55, 45, datetime('now','-84 days'), 'retained', datetime('now','-25 days'), '예측 빗나감'),
  ('chp_47', 'org_demo_full', 'pd_01', 35, 'low',      60, '["VIP","소개자"]',                      '없음',                               '김민수님',                                         0.75, 30, datetime('now','-86 days'), 'retained', datetime('now','-24 days'), 'OK'),
  ('chp_48', 'org_demo_full', 'pd_22', 50, 'medium',   45, '["일회성"]',                            '안부',                               '서주영님',                                         0.60, 45, datetime('now','-70 days'), 'retained', datetime('now','-20 days'), '예측 빗나감'),
  ('chp_49', 'org_demo_full', 'pd_19', 60, 'medium',   30, '["일회성"]',                            '안부',                               '배유나님',                                         0.55, 55, datetime('now','-71 days'), 'retained', datetime('now','-19 days'), '예측 빗나감'),
  ('chp_50', 'org_demo_full', 'pd_20', 25, 'low',      90, '["VIP"]',                               '없음',                               '곽민재님',                                         0.80, 20, datetime('now','-72 days'), 'retained', datetime('now','-18 days'), 'OK'),

  -- 미평가 (NULL) - 최근 예측
  ('chp_51', 'org_demo_full', 'pd_25', 60, 'medium',   30, '["재방문대기"]',                        '컨택',                               '유성호님 안내',                                     0.70, 55, datetime('now','-2 days'),  NULL, NULL, NULL),
  ('chp_52', 'org_demo_full', 'pd_24', 90, 'critical', 7,  '["이탈징후강함"]',                     '긴급 컨택',                          '나단비님 마지막 안내',                              0.85, 88, datetime('now','-1 days'),  NULL, NULL, NULL),
  ('chp_53', 'org_demo_full', 'pd_23', 65, 'medium',   21, '["미결정"]',                            '재상담',                             '한지수님 추가 안내',                                0.75, 60, datetime('now','-1 days'),  NULL, NULL, NULL),
  ('chp_54', 'org_demo_full', 'pd_21', 55, 'medium',   30, '["할부고민"]',                          '콜백',                               '진현주님',                                          0.70, 50, datetime('now','-1 days'),  NULL, NULL, NULL),
  ('chp_55', 'org_demo_full', 'pd_15', 60, 'medium',   30, '["교정초기"]',                          '안부',                               '송예린님',                                          0.65, 55, datetime('now','-1 days'),  NULL, NULL, NULL),
  ('chp_56', 'org_demo_full', 'pd_17', 35, 'low',      60, '["교정"]',                              '없음',                               '문혜진님',                                          0.75, 30, datetime('now','-1 days'),  NULL, NULL, NULL),
  ('chp_57', 'org_demo_full', 'pd_18', 30, 'low',      60, '["치료중"]',                            '없음',                               '오세훈님',                                          0.78, 25, datetime('now','-1 days'),  NULL, NULL, NULL),
  ('chp_58', 'org_demo_full', 'pd_20', 20, 'low',      120,'["VIP"]',                               '없음',                               '곽민재님',                                          0.85, 15, datetime('now','-1 days'),  NULL, NULL, NULL),
  ('chp_59', 'org_demo_full', 'pd_03', 15, 'low',      120,'["VIP"]',                               '없음',                               '최수진님',                                          0.90, 10, datetime('now','-1 days'),  NULL, NULL, NULL),
  ('chp_60', 'org_demo_full', 'pd_01', 25, 'low',      90, '["VIP","핵심"]',                        '없음',                               '김민수님',                                          0.85, 20, datetime('now','-1 days'),  NULL, NULL, NULL);

-- =====================================================================
-- 완료!
-- =====================================================================
SELECT 'Demo seed loaded' as status,
       (SELECT COUNT(*) FROM users WHERE organization_id='org_demo_full') as users,
       (SELECT COUNT(*) FROM patients WHERE organization_id='org_demo_full') as patients,
       (SELECT COUNT(*) FROM consultations WHERE organization_id='org_demo_full') as consultations,
       (SELECT COUNT(*) FROM churn_predictions WHERE organization_id='org_demo_full') as predictions,
       (SELECT COUNT(*) FROM churn_predictions WHERE organization_id='org_demo_full' AND actual_outcome IS NOT NULL) as feedback_count;
