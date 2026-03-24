-- ============================================================
-- PatientTouch 대규모 데모 데이터 시드
-- 서울BD치과 (org_bd_dental) 데모 계정용
-- ============================================================

-- ================================
-- 1. 환자 30명 추가 (다양한 내원경로, 지역, 태그)
-- ================================
INSERT OR IGNORE INTO patients (id, organization_id, name, phone, age, gender, memo, tags, status, referral_source, region, created_at) VALUES
  ('patient_d01', 'org_bd_dental', '강서연', '010-8101-2001', 29, 'female', '첫 방문. 치아미백 관심 높음.', '["미백","신규"]', 'active', '인스타그램', '강남구', '2025-11-10'),
  ('patient_d02', 'org_bd_dental', '윤태호', '010-8102-2002', 52, 'male', '상악 전체 보철 필요. 예산 충분.', '["VIP","보철"]', 'active', '지인소개', '서초구', '2025-10-05'),
  ('patient_d03', 'org_bd_dental', '임수빈', '010-8103-2003', 24, 'female', '대학원생. 투명교정 문의.', '["교정","학생"]', 'active', '네이버검색', '관악구', '2025-12-15'),
  ('patient_d04', 'org_bd_dental', '오정민', '010-8104-2004', 38, 'male', '사업가. 시간 없어서 빠른 치료 선호.', '["임플란트","VIP"]', 'active', '유튜브', '강남구', '2025-09-20'),
  ('patient_d05', 'org_bd_dental', '배지현', '010-8105-2005', 44, 'female', '치과 공포증 있음. 매우 조심스럽게.', '["공포증","주의"]', 'active', '지인소개', '송파구', '2025-11-28'),
  ('patient_d06', 'org_bd_dental', '장우진', '010-8106-2006', 33, 'male', '운동선수. 외상으로 전치부 파절.', '["외상","긴급"]', 'active', '온라인광고', '마포구', '2026-01-05'),
  ('patient_d07', 'org_bd_dental', '노은지', '010-8107-2007', 27, 'female', '웨딩 준비 중. 3개월 내 완료 원함.', '["심미","웨딩"]', 'active', '인스타그램', '용산구', '2026-01-12'),
  ('patient_d08', 'org_bd_dental', '문재혁', '010-8108-2008', 61, 'male', '전체 틀니에서 임플란트로 전환 희망.', '["임플란트","노인"]', 'active', '간판', '강남구', '2025-08-15'),
  ('patient_d09', 'org_bd_dental', '신예진', '010-8109-2009', 31, 'female', '출산 후 치아 상태 악화. 종합치료 필요.', '["종합","산후"]', 'active', '카페/커뮤니티', '성동구', '2025-12-01'),
  ('patient_d10', 'org_bd_dental', '홍석준', '010-8110-2010', 47, 'male', '당뇨+고혈압. 임플란트 가능 여부 확인.', '["주의","전신질환"]', 'active', '블로그', '강동구', '2025-10-20'),
  ('patient_d11', 'org_bd_dental', '차유리', '010-8111-2011', 36, 'female', '해외 거주. 한국 방문 시 집중치료 원함.', '["해외","VIP"]', 'active', '지인소개', '강남구', '2026-02-01'),
  ('patient_d12', 'org_bd_dental', '권도현', '010-8112-2012', 42, 'male', '치주질환 심함. 잇몸치료 우선.', '["치주","정기"]', 'active', '네이버검색', '영등포구', '2025-07-10'),
  ('patient_d13', 'org_bd_dental', '양서윤', '010-8113-2013', 25, 'female', '치아교정 중 다른 병원에서 전원.', '["교정","전원"]', 'active', '블로그', '동작구', '2025-11-05'),
  ('patient_d14', 'org_bd_dental', '조현우', '010-8114-2014', 56, 'male', '임플란트 실패 경험. 재수술 문의.', '["재수술","임플란트"]', 'active', '온라인광고', '서초구', '2025-09-15'),
  ('patient_d15', 'org_bd_dental', '유하은', '010-8115-2015', 22, 'female', '사랑니 4개 발치 예정.', '["발치","대학생"]', 'active', '네이버검색', '관악구', '2026-01-20'),
  ('patient_d16', 'org_bd_dental', '서동훈', '010-8116-2016', 49, 'male', '기업 CEO. 세라믹 크라운 다수 필요.', '["VIP","보철"]', 'active', '지인소개', '강남구', '2025-10-01'),
  ('patient_d17', 'org_bd_dental', '안지우', '010-8117-2017', 34, 'female', '잇몸 미소. 잇몸성형 + 라미네이트.', '["심미","잇몸성형"]', 'active', '인스타그램', '마포구', '2026-02-05'),
  ('patient_d18', 'org_bd_dental', '전승호', '010-8118-2018', 39, 'male', '교통사고 후유증. 악관절 문제.', '["악관절","보험"]', 'active', '온라인광고', '노원구', '2025-12-20'),
  ('patient_d19', 'org_bd_dental', '고미래', '010-8119-2019', 28, 'female', '해외여행 전 스케일링+미백 원함.', '["미백","단기"]', 'active', '카페/커뮤니티', '서대문구', '2026-03-01'),
  ('patient_d20', 'org_bd_dental', '백승준', '010-8120-2020', 65, 'male', '전체 보철 리뉴얼. 예산 2000만원대.', '["VIP","보철","임플란트"]', 'active', '재내원', '강남구', '2025-06-15'),
  ('patient_d21', 'org_bd_dental', '탁지연', '010-8121-2021', 30, 'female', '첫 스케일링. 충치 다수 발견 예상.', '["신규","충치"]', 'active', '네이버검색', '은평구', '2026-03-10'),
  ('patient_d22', 'org_bd_dental', '피영수', '010-8122-2022', 43, 'male', '야간진료 선호. 직장인.', '["야간","직장인"]', 'active', '온라인광고', '구로구', '2026-01-08'),
  ('patient_d23', 'org_bd_dental', '하은서', '010-8123-2023', 26, 'female', '앞니 사이 벌어짐 교정 희망.', '["교정","심미"]', 'active', '인스타그램', '강남구', '2026-02-10'),
  ('patient_d24', 'org_bd_dental', '방준혁', '010-8124-2024', 58, 'male', '상하악 임플란트 All-on-4 문의.', '["All-on-4","VIP"]', 'active', '유튜브', '용산구', '2025-11-01'),
  ('patient_d25', 'org_bd_dental', '추가영', '010-8125-2025', 37, 'female', '어린이 동반. 본인+아이 동시 진료.', '["가족","소아"]', 'active', '지인소개', '송파구', '2026-02-15'),
  ('patient_d26', 'org_bd_dental', '남궁호', '010-8126-2026', 51, 'male', '비즈니스 미팅 전 급히 크라운 필요.', '["긴급","보철"]', 'active', '재내원', '강남구', '2026-03-05'),
  ('patient_d27', 'org_bd_dental', '소예림', '010-8127-2027', 23, 'female', 'SNS 인플루언서. 시술 후기 공유 가능.', '["인플루언서","심미","VIP"]', 'active', '인스타그램', '성수동', '2026-02-20'),
  ('patient_d28', 'org_bd_dental', '설재민', '010-8128-2028', 46, 'male', '치주+임플란트 복합 케이스.', '["치주","임플란트","복합"]', 'active', '블로그', '광진구', '2025-10-10'),
  ('patient_d29', 'org_bd_dental', '봉수진', '010-8129-2029', 32, 'female', '교정 후 유지장치 교체 문의.', '["교정","유지장치"]', 'active', '재내원', '서초구', '2026-03-15'),
  ('patient_d30', 'org_bd_dental', '엄태식', '010-8130-2030', 70, 'male', '노인복지관 연계 환자. 틀니 수리.', '["복지","틀니"]', 'active', '기타', '강서구', '2026-01-25');

-- ================================
-- 2. 상담 데이터 60건+ (다양한 상태, 날짜, 치료유형)
-- ================================

-- == 3월 최근 상담들 (오늘 기준 며칠 내) ==
INSERT OR IGNORE INTO consultations (id, organization_id, user_id, patient_id, consultation_date, duration, treatment_type, treatment_area, amount, patient_psychology, emotion_flow, key_quotes, feedback, status, decision_score, ai_analysis_status, summary) VALUES
  ('consult_d01', 'org_bd_dental', 'user_kim', 'patient_d01', '2026-03-24 09:30:00', 18, '미백', '전체', 800000,
   '{"fear":"시림","hesitation_reason":"효과 지속기간","decision_factor":"자연스러운 색상"}',
   '{"overall_tone":"positive","decision_score":8,"summary":"매우 관심, 가격 OK, 시간 맞추기만 하면 진행"}',
   '["인스타에서 봤는데 정말 자연스럽네요","이번 주 토요일 되나요?"]',
   '{"good_points":["비포/애프터 사진 효과적","시림 최소화 방법 잘 설명"],"improve_points":[{"issue":"유지 방법 설명 부족","suggestion":"미백 후 관리법 안내 자료 제공"}],"scores":{"needs_identification":90,"value_delivery":85,"objection_handling":88,"closing":82},"total_score":86}',
   'undecided', 8, 'completed',
   '• 인스타그램 보고 방문, 치아 미백 희망\n• 자연스러운 색상에 만족\n• 80만원 가격 수용 가능\n• 이번 주 토요일 예약 희망\n• 최종 확인 후 예약하겠다고 함'),

  ('consult_d02', 'org_bd_dental', 'user_kim', 'patient_d04', '2026-03-24 11:00:00', 22, '임플란트', '#36, #37', 7000000,
   '{"fear":"치료기간","hesitation_reason":"바쁜 일정","decision_factor":"빠른 치료","budget":"제한없음"}',
   '{"overall_tone":"positive","decision_score":9,"summary":"예산 무관, 빠른 치료가 핵심"}',
   '["시간이 없어서 빨리 끝내야 해요","돈은 상관없으니 좋은 걸로"]',
   '{"good_points":["네비게이션 임플란트 설명","당일 수술 가능 안내"],"improve_points":[{"issue":"후속 관리 일정 안내 미흡"}],"scores":{"needs_identification":92,"value_delivery":95,"objection_handling":90,"closing":88},"total_score":91}',
   'paid', 9, 'completed',
   '• VIP 환자, 시간이 핵심 관건\n• 네비게이션 임플란트로 당일 식립 제안\n• 700만원 즉시 결제\n• 내일 수술 예약 완료'),

  ('consult_d03', 'org_bd_dental', 'user_lee', 'patient_d05', '2026-03-23 14:00:00', 35, '임플란트', '#46', 3500000,
   '{"fear":"통증","hesitation_reason":"치과공포","decision_factor":"무통시술","decision_maker":"본인"}',
   '{"overall_tone":"worried","decision_score":5,"timeline":[{"time":"0:00","emotion":"fearful","note":"손 떨림"},{"time":"15:00","emotion":"neutral","note":"무통설명 후"},{"time":"30:00","emotion":"worried","note":"가격듣고"}],"summary":"공포증 심해서 시간 필요"}',
   '["무서워서요...","정말 안 아파요?","좀 더 생각해볼게요"]',
   '{"good_points":["공감 잘 함","무통마취 자세히 설명"],"improve_points":[{"issue":"공포증 환자 맞춤 자료 부족","suggestion":"수면마취 옵션 먼저 제안"},{"issue":"다음 단계 제시 약함","suggestion":"체험 방문 제안"}],"scores":{"needs_identification":75,"value_delivery":70,"objection_handling":65,"closing":50},"total_score":65}',
   'undecided', 5, 'completed',
   '• 치과 공포증 심한 환자\n• 손 떨릴 정도로 긴장\n• 무통마취 설명 후 약간 안정\n• 350만원 안내 → 가격도 부담\n• 좀 더 생각해보겠다고 함'),

  ('consult_d04', 'org_bd_dental', 'user_kim', 'patient_d06', '2026-03-23 10:00:00', 15, '보철', '상악 전치 #11', 1500000,
   '{"fear":"부자연스러움","decision_factor":"심미성","budget":"200만원이내"}',
   '{"overall_tone":"positive","decision_score":9}',
   '["운동하다 부러졌어요","빨리 해주세요"]',
   '{"good_points":["긴급 대응 빠름","심미적 설명 우수"],"scores":{"needs_identification":95,"value_delivery":90,"objection_handling":92,"closing":95},"total_score":93}',
   'paid', 9, 'completed',
   '• 운동 중 전치부 파절 긴급 내원\n• 당일 임시치아 장착\n• 지르코니아 크라운 150만원 동의\n• 2주 후 최종 보철 예약'),

  ('consult_d05', 'org_bd_dental', 'user_park', 'patient_d07', '2026-03-22 16:00:00', 30, '라미네이트', '상악 전치 8개', 6400000,
   '{"fear":"삭제량","hesitation_reason":"가격","decision_factor":"웨딩사진","decision_maker":"본인+약혼자"}',
   '{"overall_tone":"excited","decision_score":7,"summary":"매우 원하지만 가격이 부담"}',
   '["결혼식 전에 꼭 하고 싶어요","640만원이면...약혼자한테 얘기해볼게요"]',
   '{"good_points":["웨딩 케이스 사진 잘 보여줌","기간 맞춤 플랜 제시"],"improve_points":[{"issue":"할부 옵션 늦게 제시","suggestion":"가격 안내 시 바로 할부 옵션 함께"}],"scores":{"needs_identification":88,"value_delivery":92,"objection_handling":72,"closing":68},"total_score":80}',
   'undecided', 7, 'completed',
   '• 6월 결혼 예정, 웨딩 전 라미네이트 희망\n• 상악 8개 640만원\n• 비포/애프터 케이스 보고 매우 원함\n• 가격이 부담 → 약혼자와 상의 예정\n• 3개월 내 완료 가능 플랜 안내'),

  ('consult_d06', 'org_bd_dental', 'user_kim', 'patient_d08', '2026-03-22 11:00:00', 40, '임플란트', 'All-on-4 하악', 15000000,
   '{"fear":"전신마취","hesitation_reason":"나이","decision_factor":"삶의질","budget":"2000만원"}',
   '{"overall_tone":"positive","decision_score":8,"summary":"의지 강함, 나이 걱정만 해소하면 진행"}',
   '["이 나이에 해도 되나요?","이가 없으니 밥을 못 먹어요"]',
   '{"good_points":["고령환자 맞춤 설명","식사 품질 개선 강조"],"improve_points":[{"issue":"보호자 동반 상담 제안 놓침"}],"scores":{"needs_identification":88,"value_delivery":90,"objection_handling":85,"closing":80},"total_score":86}',
   'undecided', 8, 'completed',
   '• 61세, 하악 무치악 → All-on-4 제안\n• 1500만원 안내, 예산 내\n• 나이 걱정 → 65세 케이스 보여줌\n• 아들과 상의 후 결정 예정'),

  ('consult_d07', 'org_bd_dental', 'user_lee', 'patient_d09', '2026-03-21 15:00:00', 25, '충치치료', '#14,#15,#24,#25,#36', 2500000,
   '{"fear":"비용","hesitation_reason":"치아 많아서","decision_factor":"통증해결"}',
   '{"overall_tone":"worried","decision_score":6,"summary":"치료 필요성 인정하나 비용 부담"}',
   '["이렇게 많은 줄 몰랐어요","한꺼번에 다 해야 하나요?"]',
   '{"good_points":["단계별 치료 계획 제시","우선순위 설명"],"improve_points":[{"issue":"보험 적용 안내 부족","suggestion":"보험 적용 가능 항목 먼저 안내"}],"scores":{"needs_identification":80,"value_delivery":78,"objection_handling":70,"closing":62},"total_score":72}',
   'undecided', 6, 'completed',
   '• 출산 후 치아 상태 악화, 충치 5개 발견\n• 총 250만원 → 단계별 치료 제안\n• 1단계(긴급) 80만원부터 시작 제안\n• 고민 중, 남편과 상의 예정'),

  ('consult_d08', 'org_bd_dental', 'user_kim', 'patient_d10', '2026-03-21 10:30:00', 20, '임플란트', '#36', 3500000,
   '{"fear":"전신질환","hesitation_reason":"당뇨합병증","decision_factor":"안전성"}',
   '{"overall_tone":"cautious","decision_score":6,"summary":"하고 싶지만 건강이 걱정"}',
   '["당뇨가 있어서 걱정이에요","혈당이 잘 조절되면 괜찮을까요?"]',
   '{"good_points":["전신질환 환자 경험 공유","내과 협진 제안"],"improve_points":[{"issue":"구체적 수치 기준 미제시","suggestion":"당화혈색소 7% 이하 시 안전하다는 데이터 제시"}],"scores":{"needs_identification":82,"value_delivery":80,"objection_handling":75,"closing":65},"total_score":75}',
   'undecided', 6, 'completed',
   '• 당뇨+고혈압 환자, 임플란트 희망\n• 건강 걱정 → 내과 협진 제안\n• 혈당 조절 후 진행 권유\n• 내과 검진 후 재방문 예정');

-- == 3월 중순 상담들 ==
INSERT OR IGNORE INTO consultations (id, organization_id, user_id, patient_id, consultation_date, duration, treatment_type, treatment_area, amount, patient_psychology, emotion_flow, key_quotes, feedback, status, decision_score, ai_analysis_status, summary) VALUES
  ('consult_d09', 'org_bd_dental', 'user_kim', 'patient_d02', '2026-03-20 14:00:00', 45, '보철', '상악 전체', 12000000,
   '{"fear":"없음","decision_factor":"품질","budget":"무제한"}',
   '{"overall_tone":"confident","decision_score":10}',
   '["가장 좋은 걸로 해주세요","돈은 걱정 마세요"]',
   '{"good_points":["프리미엄 옵션 잘 안내","케이스 다양하게 제시","VIP 대우"],"scores":{"needs_identification":95,"value_delivery":98,"objection_handling":95,"closing":98},"total_score":96}',
   'paid', 10, 'completed',
   '• VIP 소개환자, 상악 전체 보철\n• 지르코니아 풀마우스 1200만원\n• 즉시 결제, 다음 주 인상채득 예약\n• 최고급 옵션 선택'),

  ('consult_d10', 'org_bd_dental', 'user_park', 'patient_d03', '2026-03-19 13:00:00', 30, '교정', '전체', 4500000,
   '{"fear":"발치","hesitation_reason":"비용","decision_factor":"심미","decision_maker":"부모님"}',
   '{"overall_tone":"interested","decision_score":7,"summary":"본인은 하고 싶지만 부모님 설득 필요"}',
   '["부모님이 비싸다고 하실 것 같아요","발치는 꼭 해야 하나요?"]',
   '{"good_points":["학생 할인 안내","비발치 옵션도 설명"],"improve_points":[{"issue":"부모님 상담 제안 놓침","suggestion":"부모님 동반 상담 일정 제안"}],"scores":{"needs_identification":85,"value_delivery":82,"objection_handling":75,"closing":70},"total_score":78}',
   'undecided', 7, 'completed',
   '• 대학원생, 투명교정 희망\n• 450만원 → 부모님과 상의 필요\n• 비발치 옵션에 관심\n• 부모님 동반 재상담 제안'),

  ('consult_d11', 'org_bd_dental', 'user_kim', 'patient_d11', '2026-03-18 10:00:00', 35, '임플란트', '#26,#27,#36,#37', 14000000,
   '{"fear":"없음","hesitation_reason":"한국체류기간","decision_factor":"품질+속도"}',
   '{"overall_tone":"decisive","decision_score":9}',
   '["한국에 2주밖에 없어요","빨리 해주세요"]',
   '{"good_points":["해외환자 맞춤 스케줄링","원데이 임플란트 제안"],"scores":{"needs_identification":92,"value_delivery":95,"objection_handling":90,"closing":92},"total_score":92}',
   'paid', 9, 'completed',
   '• 해외거주, 한국 방문 중 집중치료\n• 4개 임플란트 원데이 진행\n• 1400만원 즉시 결제\n• 2주 내 보철까지 완료 계획'),

  ('consult_d12', 'org_bd_dental', 'user_lee', 'patient_d12', '2026-03-18 15:00:00', 20, '치주치료', '전체', 1200000,
   '{"fear":"발치","hesitation_reason":"비용누적","decision_factor":"잇몸건강"}',
   '{"overall_tone":"worried","decision_score":5}',
   '["이가 흔들려요","돈이 얼마나 들지..."]',
   '{"good_points":["환자 걱정 공감"],"improve_points":[{"issue":"치료 안 하면 어떻게 되는지 설명 부족"}],"scores":{"needs_identification":75,"value_delivery":68,"objection_handling":60,"closing":55},"total_score":64}',
   'undecided', 5, 'completed',
   '• 치주질환 심함, 전체 잇몸치료 필요\n• 120만원 안내 → 부담 표현\n• 방치 시 발치 가능성 설명 필요했으나 놓침\n• 추가 상담 필요'),

  ('consult_d13', 'org_bd_dental', 'user_kim', 'patient_d13', '2026-03-17 11:00:00', 25, '교정', '전체 재교정', 5500000,
   '{"fear":"재실패","hesitation_reason":"이전병원트라우마","decision_factor":"신뢰"}',
   '{"overall_tone":"cautious","decision_score":6}',
   '["전에 다니던 데서 엉망이 됐어요","여기는 괜찮을까요?"]',
   '{"good_points":["이전 치료 분석 자세히","신뢰 구축 잘함"],"improve_points":[{"issue":"보증 제도 안내 미흡"}],"scores":{"needs_identification":88,"value_delivery":82,"objection_handling":78,"closing":72},"total_score":80}',
   'undecided', 6, 'completed',
   '• 전원 환자, 이전 교정 실패\n• 재교정 550만원\n• 이전 상태 분석해서 차별화 설명\n• 신뢰는 쌓였으나 결정 보류'),

  ('consult_d14', 'org_bd_dental', 'user_park', 'patient_d14', '2026-03-17 14:00:00', 30, '임플란트', '#36 재수술', 5000000,
   '{"fear":"재실패","hesitation_reason":"이전실패트라우마","decision_factor":"성공률"}',
   '{"overall_tone":"anxious","decision_score":4}',
   '["또 실패하면 어쩌죠","다른 데서 안 된다고 했어요"]',
   '{"good_points":["재수술 전문성 강조","CT 분석 자세히"],"improve_points":[{"issue":"성공 케이스 더 보여줘야","suggestion":"재수술 성공 사례 5개 이상 준비"}],"scores":{"needs_identification":80,"value_delivery":75,"objection_handling":70,"closing":55},"total_score":70}',
   'undecided', 4, 'completed',
   '• 타병원 임플란트 실패 후 재수술 문의\n• 500만원 → 가격보다 성공 여부가 관건\n• CT 분석으로 가능성 설명\n• 많이 불안해함, 추가 상담 필요');

-- == 3월 초 상담들 ==
INSERT OR IGNORE INTO consultations (id, organization_id, user_id, patient_id, consultation_date, duration, treatment_type, treatment_area, amount, patient_psychology, emotion_flow, key_quotes, feedback, status, decision_score, ai_analysis_status, summary) VALUES
  ('consult_d15', 'org_bd_dental', 'user_kim', 'patient_d15', '2026-03-15 09:00:00', 10, '발치', '사랑니 4개', 400000,
   '{}', '{"overall_tone":"positive","decision_score":10}', '["빨리 빼주세요"]',
   '{"scores":{"needs_identification":95,"value_delivery":90,"objection_handling":95,"closing":98},"total_score":94}',
   'paid', 10, 'completed', '• 사랑니 4개 발치\n• 40만원 즉시 결제\n• 2회 나눠서 발치 예약'),

  ('consult_d16', 'org_bd_dental', 'user_kim', 'patient_d16', '2026-03-14 15:00:00', 35, '보철', '크라운 6개', 9000000,
   '{"decision_factor":"품질","budget":"무제한"}',
   '{"overall_tone":"confident","decision_score":10}', '["최고급으로 해주세요"]',
   '{"good_points":["VIP 맞춤 서비스","프리미엄 재료 설명 우수"],"scores":{"needs_identification":95,"value_delivery":98,"objection_handling":95,"closing":99},"total_score":97}',
   'paid', 10, 'completed', '• CEO 환자, 지르코니아 크라운 6개\n• 900만원 카드결제\n• 프리미엄 서비스 만족'),

  ('consult_d17', 'org_bd_dental', 'user_lee', 'patient_d17', '2026-03-14 11:00:00', 28, '라미네이트', '상악 전치 6개 + 잇몸성형', 7200000,
   '{"fear":"부자연스러움","decision_factor":"자연스러운결과","budget":"800만원이내"}',
   '{"overall_tone":"excited","decision_score":8}',
   '["잇몸 웃음 안 나오게 해주세요!","너무 기대돼요"]',
   '{"good_points":["잇몸성형 케이스 잘 보여줌","3D 시뮬레이션 효과적"],"improve_points":[{"issue":"회복기간 상세 안내 부족"}],"scores":{"needs_identification":90,"value_delivery":92,"objection_handling":85,"closing":80},"total_score":87}',
   'undecided', 8, 'completed', '• 잇몸미소 + 라미네이트 희망\n• 720만원 → 예산 내\n• 3D 시뮬레이션 보고 매우 만족\n• 연차 날짜 확인 후 예약 예정'),

  ('consult_d18', 'org_bd_dental', 'user_kim', 'patient_d18', '2026-03-13 10:00:00', 20, '악관절', 'TMJ', 2000000,
   '{"fear":"수술","hesitation_reason":"보험적용여부","decision_factor":"통증해결"}',
   '{"overall_tone":"hopeful","decision_score":7}',
   '["턱이 너무 아파요","보험 되나요?"]',
   '{"good_points":["보험 적용 항목 안내","비수술 치료 먼저 제안"],"scores":{"needs_identification":85,"value_delivery":82,"objection_handling":80,"closing":75},"total_score":80}',
   'undecided', 7, 'completed', '• 교통사고 후 악관절 문제\n• 비수술 치료 200만원\n• 보험 일부 적용 안내\n• 보험사 확인 후 결정'),

  ('consult_d19', 'org_bd_dental', 'user_park', 'patient_d19', '2026-03-12 14:00:00', 12, '미백', '전체', 600000,
   '{}', '{"overall_tone":"positive","decision_score":9}',
   '["여행 전에 하고 싶어요"]',
   '{"scores":{"needs_identification":92,"value_delivery":88,"objection_handling":90,"closing":90},"total_score":90}',
   'paid', 9, 'completed', '• 해외여행 전 미백\n• 60만원 결제\n• 다음 주 시술 예약');

-- == 2월 상담들 (이전 데이터) ==
INSERT OR IGNORE INTO consultations (id, organization_id, user_id, patient_id, consultation_date, duration, treatment_type, treatment_area, amount, patient_psychology, emotion_flow, key_quotes, feedback, status, decision_score, ai_analysis_status, summary) VALUES
  ('consult_d20', 'org_bd_dental', 'user_kim', 'patient_d20', '2026-02-28 10:00:00', 50, '임플란트', '상하악 전체 보철', 22000000,
   '{"decision_factor":"삶의질","budget":"3000만원"}',
   '{"overall_tone":"positive","decision_score":9}', '["이제 편하게 먹고 싶어요"]',
   '{"good_points":["종합 치료 계획 우수","고령 환자 맞춤 설명"],"scores":{"needs_identification":95,"value_delivery":95,"objection_handling":92,"closing":90},"total_score":93}',
   'paid', 9, 'completed', '• 65세 VIP, 전체 보철 리뉴얼\n• 2200만원 결제\n• 3개월 치료계획 수립'),

  ('consult_d21', 'org_bd_dental', 'user_lee', 'patient_d22', '2026-02-25 19:00:00', 15, '충치치료', '#26,#27', 800000,
   '{"hesitation_reason":"야간시간부족"}',
   '{"overall_tone":"neutral","decision_score":7}', '["야근이 많아서..."]',
   '{"scores":{"needs_identification":80,"value_delivery":78,"objection_handling":75,"closing":72},"total_score":76}',
   'undecided', 7, 'completed', '• 직장인, 야간진료 선호\n• 충치 2개 80만원\n• 야간 예약 가능 확인 후 결정'),

  ('consult_d22', 'org_bd_dental', 'user_kim', 'patient_d23', '2026-02-20 16:00:00', 25, '교정', '부분교정', 2500000,
   '{"decision_factor":"심미","budget":"300만원"}',
   '{"overall_tone":"excited","decision_score":8}', '["앞니 사이만 좀 붙여주세요"]',
   '{"good_points":["부분교정 잘 설명","기간 안내 적절"],"scores":{"needs_identification":88,"value_delivery":85,"objection_handling":82,"closing":80},"total_score":84}',
   'paid', 8, 'completed', '• 앞니 틈새 부분교정\n• 250만원 결제, 6개월 과정'),

  ('consult_d23', 'org_bd_dental', 'user_park', 'patient_d24', '2026-02-15 11:00:00', 45, '임플란트', 'All-on-4 상하악', 28000000,
   '{"decision_factor":"삶의질","budget":"3000만원이상"}',
   '{"overall_tone":"decisive","decision_score":10}', '["유튜브에서 많이 봤어요. 여기가 최고라던데"]',
   '{"good_points":["유튜브 컨텐츠와 연계","All-on-4 전문성 강조"],"scores":{"needs_identification":98,"value_delivery":98,"objection_handling":95,"closing":99},"total_score":98}',
   'paid', 10, 'completed', '• 유튜브 보고 방문, All-on-4 상하악\n• 2800만원 즉시 결제\n• 최고 만족도'),

  ('consult_d24', 'org_bd_dental', 'user_kim', 'patient_d25', '2026-02-10 10:00:00', 18, '스케일링', '전체', 50000,
   '{}', '{"overall_tone":"positive","decision_score":10}', '[]',
   '{"scores":{"needs_identification":90,"value_delivery":85,"objection_handling":90,"closing":95},"total_score":90}',
   'paid', 10, 'completed', '• 가족 동반, 본인 스케일링\n• 5만원 결제'),

  ('consult_d25', 'org_bd_dental', 'user_lee', 'patient_d26', '2026-03-10 09:00:00', 12, '보철', '크라운 #15', 800000,
   '{"decision_factor":"속도"}',
   '{"overall_tone":"urgent","decision_score":10}', '["내일 미팅이에요! 빨리 해주세요"]',
   '{"scores":{"needs_identification":95,"value_delivery":90,"objection_handling":95,"closing":98},"total_score":94}',
   'paid', 10, 'completed', '• 긴급 크라운, 당일 임시+인상\n• 80만원 결제'),

  ('consult_d26', 'org_bd_dental', 'user_park', 'patient_d27', '2026-03-08 15:00:00', 30, '라미네이트', '상악 전치 4개', 3200000,
   '{"decision_factor":"SNS콘텐츠","budget":"400만원"}',
   '{"overall_tone":"excited","decision_score":9}', '["인스타에 올릴 거예요!","비포/애프터 찍어주세요"]',
   '{"good_points":["SNS 콜라보 제안","촬영 서비스 안내"],"scores":{"needs_identification":92,"value_delivery":95,"objection_handling":90,"closing":92},"total_score":92}',
   'paid', 9, 'completed', '• SNS 인플루언서, 라미네이트 4개\n• 320만원 결제 + 후기 게시 합의\n• 마케팅 협업 가능성'),

  ('consult_d27', 'org_bd_dental', 'user_kim', 'patient_d28', '2026-03-05 11:00:00', 35, '임플란트', '#36,#46 + 치주치료', 9000000,
   '{"fear":"치주합병","hesitation_reason":"복합치료부담","decision_factor":"한곳에서 해결"}',
   '{"overall_tone":"worried","decision_score":6}',
   '["여기서 다 해결되나요?","치주치료 먼저 해야 하나요?"]',
   '{"good_points":["원스톱 치료 장점 강조","치주-임플란트 연계 설명"],"improve_points":[{"issue":"치료 순서 시각화 부족","suggestion":"단계별 치료 로드맵 시각자료 제공"}],"scores":{"needs_identification":82,"value_delivery":80,"objection_handling":75,"closing":68},"total_score":76}',
   'undecided', 6, 'completed', '• 치주+임플란트 복합 케이스\n• 900만원 → 단계별 치료 제안\n• 1단계 치주치료 후 임플란트 계획\n• 치료 기간이 길어 고민 중'),

  ('consult_d28', 'org_bd_dental', 'user_lee', 'patient_d29', '2026-03-16 14:00:00', 10, '교정', '유지장치 교체', 200000,
   '{}', '{"overall_tone":"positive","decision_score":10}', '[]',
   '{"scores":{"needs_identification":95,"value_delivery":90,"objection_handling":95,"closing":98},"total_score":94}',
   'paid', 10, 'completed', '• 교정 유지장치 교체\n• 20만원 결제'),

  ('consult_d29', 'org_bd_dental', 'user_kim', 'patient_d30', '2026-03-03 10:00:00', 15, '보철', '하악 틀니 수리', 150000,
   '{}', '{"overall_tone":"positive","decision_score":10}', '[]',
   '{"scores":{"needs_identification":90,"value_delivery":85,"objection_handling":90,"closing":95},"total_score":90}',
   'paid', 10, 'completed', '• 틀니 수리 15만원\n• 당일 완료'),

  -- 김실장 추가 상담 (이전 달)
  ('consult_d30', 'org_bd_dental', 'user_kim', 'patient_d21', '2026-03-20 09:00:00', 15, '스케일링', '전체', 50000,
   '{}', '{"overall_tone":"positive","decision_score":10}', '["충치도 봐주세요"]',
   '{"scores":{"needs_identification":85,"value_delivery":82,"objection_handling":80,"closing":85},"total_score":83}',
   'paid', 10, 'completed', '• 첫 스케일링, 충치 3개 발견\n• 스케일링 5만원 결제\n• 충치치료 별도 상담 예정'),

  ('consult_d31', 'org_bd_dental', 'user_kim', 'patient_d21', '2026-03-22 09:30:00', 20, '충치치료', '#16,#26,#36', 1500000,
   '{"hesitation_reason":"비용","decision_factor":"통증"}',
   '{"overall_tone":"worried","decision_score":6}', '["이렇게 비싼 줄 몰랐어요"]',
   '{"good_points":["단계별 치료 제안"],"improve_points":[{"issue":"보험 안내 부족"}],"scores":{"needs_identification":78,"value_delivery":75,"objection_handling":70,"closing":65},"total_score":72}',
   'undecided', 6, 'completed', '• 충치 3개 치료\n• 150만원 → 비용 부담\n• 급한 것부터 단계별 치료 제안');

-- ================================
-- 3. 연락 태스크 (오늘 기준 pending)
-- ================================
INSERT OR IGNORE INTO contact_tasks (id, organization_id, consultation_id, user_id, patient_id, task_type, recommended_date, recommended_message, points, status) VALUES
  ('task_d01', 'org_bd_dental', 'consult_d01', 'user_kim', 'patient_d01', 'closing', '2026-03-24',
   '강서연님, 지난번 미백 상담 관련 토요일 예약 확정해드릴까요?',
   '["토요일 예약 확인","시술 전 주의사항 안내","인스타 케이스 추가 공유"]', 'pending'),

  ('task_d02', 'org_bd_dental', 'consult_d03', 'user_lee', 'patient_d05', 'closing', '2026-03-24',
   '배지현님, 지난번 방문 후 고민은 좀 해결되셨나요? 수면마취로 편안하게 진행 가능해요.',
   '["수면마취 옵션 설명","무통 시술 영상 공유","체험 방문 제안"]', 'pending'),

  ('task_d03', 'org_bd_dental', 'consult_d05', 'user_park', 'patient_d07', 'closing', '2026-03-24',
   '노은지님, 웨딩 라미네이트 일정 맞추려면 이번 주가 좋을 것 같아요!',
   '["결혼일 역산 스케줄 안내","할부 옵션 재안내","약혼자 동반 상담 제안"]', 'pending'),

  ('task_d04', 'org_bd_dental', 'consult_d06', 'user_kim', 'patient_d08', 'closing', '2026-03-24',
   '문재혁님, 아드님과 상의는 어떻게 되셨나요? 궁금하신 점 있으시면 말씀해주세요.',
   '["아들 동반 상담 제안","고령환자 성공 케이스 추가","식사 품질 개선 강조"]', 'pending'),

  ('task_d05', 'org_bd_dental', 'consult_d07', 'user_lee', 'patient_d09', 'closing', '2026-03-24',
   '신예진님, 긴급한 충치부터 먼저 치료하면 부담이 줄어요. 1단계 80만원부터 시작해볼까요?',
   '["1단계 치료비 80만원만 먼저","보험 적용 항목 안내","통증 있는 치아 우선"]', 'pending'),

  ('task_d06', 'org_bd_dental', 'consult_d08', 'user_kim', 'patient_d10', 'closing', '2026-03-25',
   '홍석준님, 내과 검진 결과는 어떠셨나요?',
   '["내과 검진 결과 확인","혈당 조절 상태 체크","안전한 시술 계획 안내"]', 'pending'),

  ('task_d07', 'org_bd_dental', 'consult_d10', 'user_park', 'patient_d03', 'closing', '2026-03-24',
   '임수빈님, 부모님과 함께 오시면 더 자세히 설명드릴 수 있어요.',
   '["부모님 동반 상담 일정 조율","학생 할인 프로그램 안내","비발치 시뮬레이션 준비"]', 'pending'),

  ('task_d08', 'org_bd_dental', 'consult_d12', 'user_lee', 'patient_d12', 'closing', '2026-03-24',
   '권도현님, 잇몸 상태가 걱정됩니다. 빨리 치료 시작하는 게 좋을 것 같아요.',
   '["치료 안 하면 발치 위험 설명","분할 치료 옵션","잇몸 자가관리법 안내"]', 'pending'),

  ('task_d09', 'org_bd_dental', 'consult_d13', 'user_kim', 'patient_d13', 'closing', '2026-03-25',
   '양서윤님, 저희 교정 보증 프로그램 안내드릴게요.',
   '["교정 보증제도 안내","이전 교정 분석 자료 공유","재교정 성공 케이스 추가"]', 'pending'),

  ('task_d10', 'org_bd_dental', 'consult_d14', 'user_park', 'patient_d14', 'closing', '2026-03-25',
   '조현우님, 재수술 성공 사례 자료 정리해서 보내드릴게요.',
   '["재수술 성공 케이스 5개 사진","CT 기반 가능성 분석 자료","보증 프로그램 안내"]', 'pending'),

  ('task_d11', 'org_bd_dental', 'consult_d17', 'user_lee', 'patient_d17', 'closing', '2026-03-24',
   '안지우님, 연차 날짜 확인되셨나요? 빠른 예약이 좋을 것 같아요.',
   '["시술 날짜 확정","3D 시뮬레이션 결과 공유","회복기간 상세 안내"]', 'pending'),

  ('task_d12', 'org_bd_dental', 'consult_d18', 'user_kim', 'patient_d18', 'closing', '2026-03-25',
   '전승호님, 보험사 확인은 어떻게 되셨나요?',
   '["보험 적용 결과 확인","비수술 치료 일정 안내","통증 관리 방법 추가"]', 'pending'),

  ('task_d13', 'org_bd_dental', 'consult_d21', 'user_lee', 'patient_d22', 'closing', '2026-03-24',
   '피영수님, 야간진료 시간대 예약 잡아드릴까요?',
   '["야간 예약 가능 시간 안내","치료 소요시간 안내"]', 'pending'),

  ('task_d14', 'org_bd_dental', 'consult_d27', 'user_kim', 'patient_d28', 'closing', '2026-03-25',
   '설재민님, 1단계 치주치료부터 시작하시면 어떨까요?',
   '["단계별 치료 로드맵 자료","1단계 비용 안내","치주-임플란트 연계 설명"]', 'pending'),

  ('task_d15', 'org_bd_dental', 'consult_d31', 'user_kim', 'patient_d21', 'closing', '2026-03-24',
   '탁지연님, 급한 충치부터 먼저 치료하면 부담이 적어요.',
   '["보험 적용 충치 안내","통증 있는 치아 우선 치료"]', 'pending'),

  -- 안부 연락
  ('task_d16', 'org_bd_dental', 'consult_d02', 'user_kim', 'patient_d04', 'proactive', '2026-03-25',
   '오정민님, 임플란트 수술 후 경과는 어떠세요?',
   '["수술 후 통증/부기 체크","식사 가이드","다음 방문일 확인"]', 'pending'),

  ('task_d17', 'org_bd_dental', 'consult_d04', 'user_kim', 'patient_d06', 'proactive', '2026-03-25',
   '장우진님, 임시치아 불편하신 건 없으세요?',
   '["임시치아 상태 확인","최종보철 일정 리마인드"]', 'pending'),

  ('task_d18', 'org_bd_dental', 'consult_d09', 'user_kim', 'patient_d02', 'proactive', '2026-03-24',
   '윤태호님, 보철 인상채득 예약 리마인드 드려요.',
   '["다음 주 예약 확인","식사 주의사항"]', 'pending'),

  ('task_d19', 'org_bd_dental', 'consult_d15', 'user_kim', 'patient_d15', 'proactive', '2026-03-24',
   '유하은님, 발치 후 경과는 괜찮으세요?',
   '["발치 부위 통증/출혈 체크","음식 주의사항","2차 발치 일정"]', 'pending'),

  ('task_d20', 'org_bd_dental', 'consult_d19', 'user_park', 'patient_d19', 'proactive', '2026-03-24',
   '고미래님, 미백 시술 후 색상 유지는 잘 되시나요?',
   '["미백 유지 팁 안내","착색 음식 주의","재시술 시기 안내"]', 'pending');

-- ================================
-- 4. 연락 기록 (contact_logs)
-- ================================
INSERT OR IGNORE INTO contact_logs (id, organization_id, patient_id, user_id, task_id, contact_type, contact_result, outcome, content, created_at) VALUES
  ('log_d01', 'org_bd_dental', 'patient_d02', 'user_kim', null, 'call', 'success', 'booked', '첫 상담 예약 확인 전화. 수요일 14시 예약.', '2026-03-18 10:00:00'),
  ('log_d02', 'org_bd_dental', 'patient_d04', 'user_kim', null, 'call', 'success', 'booked', '임플란트 상담 예약. 바쁘셔서 점심시간.', '2026-03-22 09:00:00'),
  ('log_d03', 'org_bd_dental', 'patient_d07', 'user_park', null, 'kakao', 'success', 'callback', '라미네이트 문의. 약혼자와 같이 오겠다고 함.', '2026-03-20 15:00:00'),
  ('log_d04', 'org_bd_dental', 'patient_d08', 'user_kim', null, 'call', 'success', 'booked', '아들분 연락으로 예약. 토요일 11시.', '2026-03-20 11:00:00'),
  ('log_d05', 'org_bd_dental', 'patient_d11', 'user_kim', null, 'call', 'success', 'booked', '해외거주 환자 긴급 예약. 바로 내일.', '2026-03-17 16:00:00'),
  ('log_d06', 'org_bd_dental', 'patient_d16', 'user_kim', null, 'call', 'success', 'booked', 'CEO 비서실에서 예약. 목요일 15시.', '2026-03-12 14:00:00'),
  ('log_d07', 'org_bd_dental', 'patient_d20', 'user_kim', null, 'call', 'success', 'booked', '보철 리뉴얼 상담 예약. 토요일.', '2026-02-26 10:00:00'),
  ('log_d08', 'org_bd_dental', 'patient_d24', 'user_kim', null, 'kakao', 'success', 'booked', '유튜브 보고 카카오 문의. 바로 예약.', '2026-02-13 11:00:00'),
  ('log_d09', 'org_bd_dental', 'patient_d05', 'user_lee', null, 'call', 'no_answer', null, '부재중. 문자 남김.', '2026-03-20 14:00:00'),
  ('log_d10', 'org_bd_dental', 'patient_d05', 'user_lee', null, 'text', 'success', 'callback', '수면마취 안내 문자 발송. "알겠습니다" 답장.', '2026-03-21 10:00:00'),
  ('log_d11', 'org_bd_dental', 'patient_d12', 'user_lee', null, 'call', 'no_answer', null, '3회 부재중.', '2026-03-20 15:30:00'),
  ('log_d12', 'org_bd_dental', 'patient_d14', 'user_park', null, 'call', 'success', 'hold', '재수술 고민 중이라 함. 자료 보내달라고.', '2026-03-19 11:00:00'),
  ('log_d13', 'org_bd_dental', 'patient_d22', 'user_lee', null, 'text', 'success', 'callback', '야간진료 시간 안내. 확인 후 연락주겠다고.', '2026-03-01 18:00:00'),
  ('log_d14', 'org_bd_dental', 'patient_d27', 'user_park', null, 'kakao', 'success', 'booked', '인플루언서 DM으로 예약. 촬영도 함께.', '2026-03-06 12:00:00'),
  ('log_d15', 'org_bd_dental', 'patient_d13', 'user_kim', null, 'call', 'success', 'callback', '재교정 고민 중. 보증 자료 요청.', '2026-03-18 16:00:00');

-- ================================
-- 5. 리텐션 데이터 (치료 등록 + 리텐션 상태)
-- ================================
INSERT OR IGNORE INTO patient_treatments (id, organization_id, patient_id, treatment_type, treatment_name, status, total_amount, paid_amount, started_at, next_appointment, notes) VALUES
  ('treat_d01', 'org_bd_dental', 'patient_d04', 'implant', '네비게이션 임플란트 #36,#37', 'in_progress', 7000000, 7000000, '2026-03-24', '2026-04-07', '수술 완료, 2주 후 체크'),
  ('treat_d02', 'org_bd_dental', 'patient_d02', 'prosthetic', '지르코니아 풀마우스 상악', 'in_progress', 12000000, 12000000, '2026-03-20', '2026-03-27', '인상채득 예정'),
  ('treat_d03', 'org_bd_dental', 'patient_d06', 'prosthetic', '지르코니아 크라운 #11', 'in_progress', 1500000, 1500000, '2026-03-23', '2026-04-06', '임시치아 장착, 2주 후 최종보철'),
  ('treat_d04', 'org_bd_dental', 'patient_d11', 'implant', '원데이 임플란트 4개', 'in_progress', 14000000, 14000000, '2026-03-18', '2026-04-01', '보철 작업 진행 중'),
  ('treat_d05', 'org_bd_dental', 'patient_d15', 'extraction', '사랑니 발치 4개 (2회)', 'in_progress', 400000, 400000, '2026-03-15', '2026-03-29', '좌측 완료, 우측 예정'),
  ('treat_d06', 'org_bd_dental', 'patient_d16', 'prosthetic', '프리미엄 지르코니아 크라운 6개', 'in_progress', 9000000, 9000000, '2026-03-14', '2026-04-04', '인상채득 완료, 기공 진행'),
  ('treat_d07', 'org_bd_dental', 'patient_d19', 'whitening', '프리미엄 미백', 'completed', 600000, 600000, '2026-03-12', null, '시술 완료'),
  ('treat_d08', 'org_bd_dental', 'patient_d20', 'implant', '상하악 전체 보철 리뉴얼', 'in_progress', 22000000, 22000000, '2026-02-28', '2026-04-15', '1단계 완료, 2단계 진행'),
  ('treat_d09', 'org_bd_dental', 'patient_d23', 'ortho', '부분교정 앞니', 'in_progress', 2500000, 2500000, '2026-02-20', '2026-04-20', '교정 진행 중, 2개월차'),
  ('treat_d10', 'org_bd_dental', 'patient_d24', 'implant', 'All-on-4 상하악', 'in_progress', 28000000, 28000000, '2026-02-15', '2026-04-15', '상악 완료, 하악 진행'),
  ('treat_d11', 'org_bd_dental', 'patient_d26', 'prosthetic', '긴급 크라운 #15', 'completed', 800000, 800000, '2026-03-10', null, '완료'),
  ('treat_d12', 'org_bd_dental', 'patient_d27', 'laminate', '라미네이트 상악 4개', 'in_progress', 3200000, 3200000, '2026-03-08', '2026-03-29', '1차 삭제 완료, 임시장착'),
  ('treat_d13', 'org_bd_dental', 'patient_d29', 'ortho', '유지장치 교체', 'completed', 200000, 200000, '2026-03-16', null, '완료'),
  ('treat_d14', 'org_bd_dental', 'patient_d30', 'prosthetic', '하악 틀니 수리', 'completed', 150000, 150000, '2026-03-03', null, '완료'),
  ('treat_d15', 'org_bd_dental', 'patient_d21', 'scaling', '스케일링', 'completed', 50000, 50000, '2026-03-20', null, '완료, 충치 3개 발견'),

  -- 미결정 환자들 (치료 등록은 했으나 status=consulted)
  ('treat_d16', 'org_bd_dental', 'patient_d01', 'whitening', '치아미백 상담', 'consulted', 800000, 0, null, null, '토요일 예약 확정 대기'),
  ('treat_d17', 'org_bd_dental', 'patient_d05', 'implant', '임플란트 #46 상담', 'consulted', 3500000, 0, null, null, '수면마취 옵션 안내 완료'),
  ('treat_d18', 'org_bd_dental', 'patient_d07', 'laminate', '웨딩 라미네이트 8개', 'consulted', 6400000, 0, null, null, '약혼자 상의 후 결정'),
  ('treat_d19', 'org_bd_dental', 'patient_d08', 'implant', 'All-on-4 하악', 'consulted', 15000000, 0, null, null, '아들과 상의 예정'),
  ('treat_d20', 'org_bd_dental', 'patient_d09', 'general', '충치 5개 종합치료', 'consulted', 2500000, 0, null, null, '단계별 치료 제안 중'),
  ('treat_d21', 'org_bd_dental', 'patient_d10', 'implant', '임플란트 #36 (당뇨관리 후)', 'consulted', 3500000, 0, null, null, '내과 협진 진행'),
  ('treat_d22', 'org_bd_dental', 'patient_d17', 'laminate', '잇몸성형+라미네이트 6개', 'consulted', 7200000, 0, null, null, '연차 확인 후 예약'),
  ('treat_d23', 'org_bd_dental', 'patient_d28', 'implant', '치주+임플란트 복합', 'consulted', 9000000, 0, null, null, '1단계 치주치료부터');

-- ================================
-- 6. 리텐션 상태 업데이트 (신규 환자들)
-- ================================
INSERT OR REPLACE INTO patient_retention_status (id, organization_id, patient_id, status, risk_score, last_visit_date, days_since_visit, remaining_treatment_value, recommended_contact_date, recommended_contact_script, recommended_contact_type, priority_score) VALUES
  ('ret_d01', 'org_bd_dental', 'patient_d01', 'consulted_unconverted', 50, '2026-03-24', 0, 800000,
   '2026-03-26', '강서연님, 미백 토요일 예약 확정하시겠어요?', 'phone', 75),
  ('ret_d03', 'org_bd_dental', 'patient_d03', 'consulted_unconverted', 40, '2026-03-19', 5, 4500000,
   '2026-03-25', '임수빈님, 부모님과 함께 상담 오시면 자세히 설명드릴게요.', 'phone', 65),
  ('ret_d05', 'org_bd_dental', 'patient_d05', 'consulted_unconverted', 55, '2026-03-23', 1, 3500000,
   '2026-03-26', '배지현님, 수면마취로 편안하게 진행 가능합니다.', 'text', 72),
  ('ret_d07', 'org_bd_dental', 'patient_d07', 'consulted_unconverted', 48, '2026-03-22', 2, 6400000,
   '2026-03-25', '노은지님, 웨딩 일정에 맞추려면 이번 주가 마지막이에요!', 'phone', 80),
  ('ret_d08', 'org_bd_dental', 'patient_d08', 'consulted_unconverted', 52, '2026-03-22', 2, 15000000,
   '2026-03-25', '문재혁님, 아드님 의견은 어떠셨나요?', 'phone', 82),
  ('ret_d09', 'org_bd_dental', 'patient_d09', 'consulted_unconverted', 45, '2026-03-21', 3, 2500000,
   '2026-03-25', '신예진님, 긴급 충치부터 80만원으로 시작해볼까요?', 'phone', 68),
  ('ret_d10', 'org_bd_dental', 'patient_d10', 'consulted_unconverted', 42, '2026-03-21', 3, 3500000,
   '2026-03-26', '홍석준님, 내과 결과 확인되셨나요?', 'phone', 60),
  ('ret_d12', 'org_bd_dental', 'patient_d12', 'unscheduled_urgent', 75, '2026-03-18', 6, 1200000,
   '2026-03-24', '권도현님, 잇몸 치료 미루시면 악화될 수 있어요.', 'phone', 88),
  ('ret_d13', 'org_bd_dental', 'patient_d13', 'consulted_unconverted', 48, '2026-03-17', 7, 5500000,
   '2026-03-25', '양서윤님, 교정 보증 프로그램 안내 드릴게요.', 'phone', 70),
  ('ret_d14', 'org_bd_dental', 'patient_d14', 'consulted_unconverted', 60, '2026-03-17', 7, 5000000,
   '2026-03-25', '조현우님, 재수술 성공 사례 보내드렸어요. 보셨나요?', 'phone', 76),
  ('ret_d17', 'org_bd_dental', 'patient_d17', 'consulted_unconverted', 42, '2026-03-14', 10, 7200000,
   '2026-03-24', '안지우님, 잇몸성형 날짜 잡으실까요?', 'phone', 73),
  ('ret_d18', 'org_bd_dental', 'patient_d18', 'consulted_unconverted', 45, '2026-03-13', 11, 2000000,
   '2026-03-25', '전승호님, 보험사 답변 오셨나요?', 'phone', 67),
  ('ret_d21', 'org_bd_dental', 'patient_d21', 'consulted_unconverted', 38, '2026-03-22', 2, 1500000,
   '2026-03-25', '탁지연님, 충치 치료 일정 잡아드릴까요?', 'phone', 60),
  ('ret_d22', 'org_bd_dental', 'patient_d22', 'unscheduled_warning', 55, '2026-02-25', 27, 800000,
   '2026-03-24', '피영수님, 충치 치료 미루면 더 커질 수 있어요. 야간 예약 가능합니다.', 'phone', 78),
  ('ret_d28', 'org_bd_dental', 'patient_d28', 'consulted_unconverted', 50, '2026-03-05', 19, 9000000,
   '2026-03-24', '설재민님, 치주치료 1단계부터 시작하시면 어떨까요?', 'phone', 74);

-- ================================
-- 7. 리텐션 연락 기록
-- ================================
INSERT OR IGNORE INTO retention_contacts (id, organization_id, patient_id, staff_id, treatment_id, contact_type, result, notes, next_contact_date, contacted_at) VALUES
  ('rcon_d01', 'org_bd_dental', 'patient_d05', 'user_lee', 'treat_d17', 'phone', 'no_answer', '부재중, 문자 남김', '2026-03-23', '2026-03-21 10:00:00'),
  ('rcon_d02', 'org_bd_dental', 'patient_d05', 'user_lee', 'treat_d17', 'text', 'message_sent', '수면마취 안내 문자. "알겠습니다" 답장', '2026-03-25', '2026-03-22 11:00:00'),
  ('rcon_d03', 'org_bd_dental', 'patient_d12', 'user_lee', 'treat_d16', 'phone', 'no_answer', '3회 부재중', '2026-03-22', '2026-03-19 15:00:00'),
  ('rcon_d04', 'org_bd_dental', 'patient_d12', 'user_lee', null, 'text', 'message_sent', '잇몸치료 중요성 안내 문자', '2026-03-25', '2026-03-21 10:00:00'),
  ('rcon_d05', 'org_bd_dental', 'patient_d14', 'user_park', 'treat_d16', 'phone', 'connected', '재수술 자료 요청. 이메일로 보내기로 함.', '2026-03-25', '2026-03-19 11:00:00'),
  ('rcon_d06', 'org_bd_dental', 'patient_d22', 'user_lee', null, 'text', 'message_sent', '야간진료 안내. 확인 후 연락주겠다고.', '2026-03-15', '2026-03-01 18:00:00');

-- ================================
-- 8. consultation_reports (AI 리포트)
-- ================================
INSERT OR IGNORE INTO consultation_reports (id, organization_id, consultation_id, consultation_summary, treatment_options, discussed_amount, payment_options, patient_concerns, emotion_timeline, emotion_summary, overall_sentiment, decision_factors, decision_score, decision_prediction, next_actions, recommended_followup_date, followup_message, coaching_feedback, coaching_score, generation_model) VALUES
  ('rpt_d01', 'org_bd_dental', 'consult_d01',
   '환자(29세 여성)가 인스타그램을 보고 미백 상담 방문. 자연스러운 색상에 만족하며 토요일 예약 희망.',
   '[{"name":"프리미엄 오피스 미백","price":800000,"recommended":true,"reason":"즉시 효과, 자연스러운 색상"}]',
   800000,
   '일시불 80만원, 카드 2개월 무이자 가능',
   '["시린 증상이 걱정됩니다","효과가 얼마나 지속되나요?"]',
   '[{"time":"0:00","emotion":"excited","score":8},{"time":"10:00","emotion":"positive","score":9},{"time":"18:00","emotion":"positive","score":8}]',
   '전반적으로 매우 긍정적. 인스타 케이스를 보고 높은 기대감으로 방문.',
   'positive',
   '["자연스러운 결과물","인스타 후기","토요일 가능 여부"]',
   8, '매우 긍정적 - 토요일 예약 확정 시 90% 이상 전환 예상',
   '["토요일 예약 확정 전화","시술 전 주의사항 안내","미백 후 관리법 자료 전달"]',
   '2026-03-26', '강서연님, 토요일 미백 예약 확정해드릴까요? 시술 전 커피/카레는 피해주세요!',
   '{"scores":{"rapport":90,"spin":85,"objection_handling":88,"pricing_framing":82,"closing":82,"structure":86},"strengths":["비포/애프터 사진 활용 우수","시림 최소화 설명 적절","친근한 톤 유지"],"improvements":[{"issue":"미백 유지 방법 설명 부족","suggestion":"시술 후 관리법 안내 자료 준비"},{"issue":"다음 단계 확정 놓침","suggestion":"토요일 예약 바로 잡아드릴까요? 물어보기"}],"next_actions":["미백 전후 관리 가이드 준비","토요일 예약 확정 전화"]}',
   86, 'gpt-4o'),

  ('rpt_d02', 'org_bd_dental', 'consult_d02',
   'VIP 환자(38세 남성). 사업가로 시간이 핵심. 네비게이션 임플란트 당일 식립 진행, 700만원 즉시 결제.',
   '[{"name":"네비게이션 임플란트 2개","price":7000000,"recommended":true,"reason":"당일 식립 가능, 정밀도 높음"}]',
   7000000, '일시불 카드결제',
   '["시간이 없어요","빨리 끝나나요?"]',
   '[{"time":"0:00","emotion":"impatient","score":6},{"time":"10:00","emotion":"satisfied","score":9},{"time":"22:00","emotion":"very_positive","score":10}]',
   '초반 조급 → 네비게이션 설명 후 만족 → 즉시 결제. VIP 성향.',
   'very_positive',
   '["속도","정밀도","최신 기술"]', 9, '전환 완료',
   '["수술 후 경과 체크 (1주)","보철 일정 안내"]',
   '2026-03-31', '오정민님, 수술 후 경과는 어떠세요? 불편한 점 있으시면 말씀해주세요.',
   '{"scores":{"rapport":92,"spin":95,"objection_handling":90,"pricing_framing":95,"closing":88,"structure":90},"strengths":["네비게이션 기술 설명 우수","VIP 환자 맞춤 응대","빠른 의사결정 유도"],"improvements":[{"issue":"후속 관리 일정 안내 미흡","suggestion":"수술 직후 체크업 일정 바로 안내"}]}',
   91, 'gpt-4o'),

  ('rpt_d03', 'org_bd_dental', 'consult_d03',
   '치과 공포증 환자(44세 여성). 손이 떨릴 정도로 긴장. 무통마취 설명 후 약간 안정되었으나 결정 보류.',
   '[{"name":"임플란트 #46","price":3500000,"recommended":true},{"name":"수면마취 추가","price":300000,"recommended":true,"reason":"공포증 환자에게 필수"}]',
   3500000, '할부 가능',
   '["너무 무서워요","정말 안 아파요?","생각 좀 해볼게요"]',
   '[{"time":"0:00","emotion":"fearful","score":2},{"time":"15:00","emotion":"cautious","score":5},{"time":"35:00","emotion":"still_worried","score":4}]',
   '시종일관 공포감. 무통마취 설명으로 일시 완화되었으나 완전 해소 안 됨.',
   'worried',
   '["통증","공포","안전성"]', 5, '추가 관리 필요 - 수면마취 체험 제안 시 전환 가능',
   '["수면마취 영상 자료 전달","체험 방문 제안","충분한 시간 두고 재연락"]',
   '2026-03-27', '배지현님, 수면마취 시술 영상 보내드렸어요. 한번 봐주시겠어요?',
   '{"scores":{"rapport":75,"spin":70,"objection_handling":65,"pricing_framing":68,"closing":50,"structure":72},"strengths":["환자 공감 능력 좋음","무통마취 설명 자세히 함"],"improvements":[{"issue":"수면마취를 먼저 제안했어야","suggestion":"공포증 환자에게는 수면마취 옵션을 첫 번째로 안내"},{"issue":"체험 방문을 제안하지 않음","suggestion":"무료 체험 방문으로 환경에 익숙해지게 하기"},{"issue":"결정 압박 없이 마무리","suggestion":"다음 단계만 가볍게 제안"}]}',
   65, 'gpt-4o');

-- 제안서 데이터 (treatment_proposals 스키마에 맞춤)
INSERT OR IGNORE INTO treatment_proposals (id, organization_id, consultation_id, patient_id, title, greeting_message, selected_options, total_amount, final_amount, installment_options, hospital_name, hospital_message, doctor_name, public_token, status, sent_by, sent_via, sent_at, created_at) VALUES
  ('prop_d01', 'org_bd_dental', 'consult_d01', 'patient_d01',
   '치아 미백 맞춤 플랜',
   '강서연님, 자연스럽고 환한 미소를 위한 미백 플랜을 준비했어요!',
   '[{"name":"프리미엄 오피스 미백","price":800000,"description":"1회 시술로 자연스러운 화이트닝"}]',
   800000, 800000,
   '[{"months":2,"monthly":400000,"interest":0}]',
   '서울BD치과', '최상의 결과를 약속드립니다.', '문석준', 'tkn_demo_01',
   'sent', 'user_kim', 'kakao', '2026-03-24 10:05:00', '2026-03-24 10:00:00'),

  ('prop_d02', 'org_bd_dental', 'consult_d05', 'patient_d07',
   '웨딩 라미네이트 맞춤 플랜',
   '노은지님, 결혼식 전 완벽한 스마일 라인을 위한 플랜이에요!',
   '[{"name":"라미네이트 8개 (상악전치)","price":6400000,"description":"6월 결혼식 전 완료 가능"}]',
   6400000, 6400000,
   '[{"months":12,"monthly":534000,"interest":0}]',
   '서울BD치과', '아름다운 결혼식을 응원합니다!', '문석준', 'tkn_demo_02',
   'viewed', 'user_park', 'kakao', '2026-03-22 17:05:00', '2026-03-22 17:00:00'),

  ('prop_d03', 'org_bd_dental', 'consult_d06', 'patient_d08',
   'All-on-4 임플란트 치료계획',
   '문재혁님, 편안한 식사와 건강한 삶을 위한 치료 계획입니다.',
   '[{"name":"All-on-4 하악","price":15000000,"description":"하루만에 고정식 치아 완성"}]',
   15000000, 15000000,
   '[{"months":24,"monthly":625000,"interest":0}]',
   '서울BD치과', '풍요로운 식생활을 되찾아 드리겠습니다.', '문석준', 'tkn_demo_03',
   'sent', 'user_kim', 'kakao', '2026-03-22 12:05:00', '2026-03-22 12:00:00');
