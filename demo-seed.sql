-- =============================================
-- Patient Touch 대규모 데모 데이터
-- org_bd_dental (서울BD치과) 기준
-- =============================================

-- 환자 추가 (다양한 내원경로, 지역, 태그)
INSERT OR IGNORE INTO patients (id, organization_id, name, phone, age, gender, memo, tags, status, referral_source, region, created_at) VALUES
  ('patient_d01', 'org_bd_dental', '강지훈', '010-8001-1001', 38, 'male', '교정 후 유지장치 필요. 야간 진료 선호.', '["교정","야간"]', 'active', '네이버검색', '강남구', '2025-11-10'),
  ('patient_d02', 'org_bd_dental', '윤서연', '010-8001-1002', 29, 'female', '웨딩 전 미백+라미네이트 희망. 급함.', '["웨딩","심미","VIP"]', 'active', '인스타그램', '서초구', '2025-12-05'),
  ('patient_d03', 'org_bd_dental', '장현우', '010-8001-1003', 52, 'male', '전체 보철 필요. 여러 병원 비교 중.', '["보철","비교중"]', 'active', '온라인광고', '송파구', '2026-01-03'),
  ('patient_d04', 'org_bd_dental', '오수빈', '010-8001-1004', 25, 'female', '사랑니 4개 발치 예정. 대학생.', '["발치"]', 'active', '지인소개', '관악구', '2026-01-15'),
  ('patient_d05', 'org_bd_dental', '배준호', '010-8001-1005', 47, 'male', '임플란트 3개 필요. 사업가. 시간 없음.', '["임플란트","VIP","빠른치료"]', 'active', '블로그', '강남구', '2026-01-20'),
  ('patient_d06', 'org_bd_dental', '임하늘', '010-8001-1006', 34, 'female', '충치 다수. 치과 공포증 있음.', '["충치","공포증"]', 'active', '네이버검색', '마포구', '2026-01-22'),
  ('patient_d07', 'org_bd_dental', '신동현', '010-8001-1007', 61, 'male', '틀니→임플란트 전환 희망. 연금생활자.', '["임플란트","실버"]', 'active', '간판', '강동구', '2026-01-25'),
  ('patient_d08', 'org_bd_dental', '조은지', '010-8001-1008', 31, 'female', '앞니 외상 보철. 보험 처리 문의.', '["보철","보험"]', 'active', '온라인광고', '용산구', '2026-02-01'),
  ('patient_d09', 'org_bd_dental', '권태민', '010-8001-1009', 43, 'male', '잇몸 질환 심함. 정기 스케일링 필요.', '["잇몸","정기관리"]', 'active', '재내원', '성북구', '2026-02-05'),
  ('patient_d10', 'org_bd_dental', '홍예린', '010-8001-1010', 27, 'female', '투명교정 관심. 해외 출장 잦음.', '["교정","해외"]', 'active', '유튜브', '강남구', '2026-02-08'),
  ('patient_d11', 'org_bd_dental', '문재석', '010-8001-1011', 56, 'male', '상악동 거상술+임플란트 필요. 고혈압.', '["임플란트","주의","고혈압"]', 'active', '지인소개', '노원구', '2026-02-10'),
  ('patient_d12', 'org_bd_dental', '서지민', '010-8001-1012', 22, 'female', '교정 종료 후 미백 상담.', '["미백","교정완료"]', 'active', '카페/커뮤니티', '동작구', '2026-02-12'),
  ('patient_d13', 'org_bd_dental', '유민호', '010-8001-1013', 39, 'male', '크라운 재제작 필요. 타 병원 불만.', '["보철","재치료"]', 'active', '네이버검색', '영등포구', '2026-02-14'),
  ('patient_d14', 'org_bd_dental', '정수아', '010-8001-1014', 33, 'female', '임신 중. 충치 응급 치료.', '["충치","임산부","주의"]', 'active', '온라인광고', '강서구', '2026-02-15'),
  ('patient_d15', 'org_bd_dental', '김태호', '010-8001-1015', 50, 'male', '전악 임플란트 상담. 예산 넉넉.', '["임플란트","VIP","전악"]', 'active', '블로그', '서초구', '2026-02-18'),
  ('patient_d16', 'org_bd_dental', '이나연', '010-8001-1016', 36, 'female', '소개환자. 박영희님 직장동료.', '["소개환자","교정"]', 'active', '지인소개', '강남구', '2026-02-20'),
  ('patient_d17', 'org_bd_dental', '박성민', '010-8001-1017', 44, 'male', '브릿지→임플란트 교체 고민 중.', '["임플란트","보철교체"]', 'active', '유튜브', '중랑구', '2026-02-22'),
  ('patient_d18', 'org_bd_dental', '최윤아', '010-8001-1018', 28, 'female', '미백+잇몸 성형 상담. SNS 인플루언서.', '["심미","VIP","인플루언서"]', 'active', '인스타그램', '마포구', '2026-03-01'),
  ('patient_d19', 'org_bd_dental', '한승우', '010-8001-1019', 58, 'male', '임플란트 2차 수술 대기. 흡연자.', '["임플란트","흡연","주의"]', 'active', '재내원', '송파구', '2026-03-03'),
  ('patient_d20', 'org_bd_dental', '남지현', '010-8001-1020', 41, 'female', '교정+임플란트 복합치료. 교사.', '["교정","임플란트"]', 'active', '온라인광고', '서대문구', '2026-03-05'),
  ('patient_d21', 'org_bd_dental', '양현석', '010-8001-1021', 65, 'male', '잔존치 발치 후 틀니. 경제적 부담.', '["틀니","경제적"]', 'active', '간판', '동대문구', '2026-03-07'),
  ('patient_d22', 'org_bd_dental', '전소희', '010-8001-1022', 30, 'female', '라미네이트 6개 재시술. 만족도 높음.', '["라미네이트","재시술","VIP"]', 'active', '지인소개', '강남구', '2026-03-10'),
  ('patient_d23', 'org_bd_dental', '고민수', '010-8001-1023', 48, 'male', '잇몸치료+보철 동시 필요. 공무원.', '["잇몸","보철"]', 'active', '네이버검색', '광진구', '2026-03-12'),
  ('patient_d24', 'org_bd_dental', '백서윤', '010-8001-1024', 26, 'female', '충치 5개. 한번에 치료 희망.', '["충치","다수"]', 'active', '카페/커뮤니티', '은평구', '2026-03-14'),
  ('patient_d25', 'org_bd_dental', '송재현', '010-8001-1025', 55, 'male', '어금니 임플란트 2개. 당뇨 경계.', '["임플란트","당뇨주의"]', 'active', '블로그', '강동구', '2026-03-16');

-- 상담 데이터 대량 생성 (다양한 상태/치료유형/점수)
INSERT OR IGNORE INTO consultations (id, organization_id, user_id, patient_id, consultation_date, duration, treatment_type, treatment_area, amount, status, decision_score, ai_analysis_status, summary, feedback, patient_psychology, emotion_flow, key_quotes) VALUES
  -- 강지훈: 교정 결제완료
  ('consult_d01', 'org_bd_dental', 'user_kim', 'patient_d01', '2026-01-20 15:00:00', 25, '교정', '전체', 4500000, 'paid', 9, 'completed',
   '• 교정 후 유지장치 관련 재상담\n• 투명교정 옵션 설명\n• 4,500만원 → 할부 안내\n• 바로 결정하고 결제 진행',
   '{"good_points": ["교정 전후 비교 사진 효과적", "환자 라이프스타일 고려한 추천"], "improve_points": [], "scores": {"needs_identification": 90, "value_delivery": 92, "objection_handling": 88, "closing": 95}, "total_score": 91}',
   '{"fear": "재교정", "decision_factor": "빠른 결과"}',
   '{"overall_tone": "positive", "decision_score": 9}',
   '["이거면 딱이네요", "바로 시작할게요"]'),

  -- 윤서연: 미백+라미네이트 결제완료
  ('consult_d02', 'org_bd_dental', 'user_kim', 'patient_d02', '2026-01-22 11:00:00', 30, '라미네이트', '상악 전치 4개', 3800000, 'paid', 10, 'completed',
   '• 웨딩 3개월 전, 미백+라미네이트 희망\n• 자연스러운 톤 강조\n• 타임라인 설명 → 안심\n• 즉시 결제',
   '{"good_points": ["웨딩 타임라인에 맞춘 스케줄링", "비포/애프터 포트폴리오 효과적", "감정적 니즈 파악 우수"], "improve_points": [], "scores": {"needs_identification": 95, "value_delivery": 93, "objection_handling": 90, "closing": 98}, "total_score": 94}',
   '{"fear": "부자연스러움", "decision_factor": "웨딩 전 완료"}',
   '{"overall_tone": "very_positive", "decision_score": 10}',
   '["너무 예쁘게 해주실 거죠?", "바로 할게요!"]'),

  -- 장현우: 보철 미결정 (비교중)
  ('consult_d03', 'org_bd_dental', 'user_lee', 'patient_d03', '2026-02-05 14:00:00', 35, '보철', '전체', 8000000, 'undecided', 5, 'completed',
   '• 전체 보철 필요, 여러 병원 비교 중\n• 우리 병원 장점 설명\n• 가격 고민 → 분할납부 안내\n• 2주 내 결정하겠다고 함',
   '{"good_points": ["체계적 치료계획 제시"], "improve_points": [{"issue": "경쟁 병원 대비 차별점 미흡", "suggestion": "재료/보증 차별화 강조"}], "scores": {"needs_identification": 75, "value_delivery": 70, "objection_handling": 65, "closing": 55}, "total_score": 66}',
   '{"fear": "잘못된 선택", "hesitation_reason": "가격비교", "decision_maker": "본인"}',
   '{"overall_tone": "neutral", "decision_score": 5}',
   '["다른 데도 좀 알아보고요", "가격이 좀..."]'),

  -- 오수빈: 발치 결제완료
  ('consult_d04', 'org_bd_dental', 'user_park', 'patient_d04', '2026-02-10 09:30:00', 10, '발치', '사랑니 4개', 400000, 'paid', 10, 'completed',
   '• 사랑니 4개 동시 발치 상담\n• 전신마취 vs 부분마취 설명\n• 부분마취 선택, 바로 예약',
   '{"good_points": ["명확한 시술 설명", "학생 할인 안내"], "scores": {"needs_identification": 85, "value_delivery": 80, "objection_handling": 85, "closing": 90}, "total_score": 85}',
   '{}', '{"overall_tone": "positive", "decision_score": 10}', '[]'),

  -- 배준호: 임플란트 미결정 (시간 없음)
  ('consult_d05', 'org_bd_dental', 'user_kim', 'patient_d05', '2026-02-12 18:00:00', 15, '임플란트', '#26, #36, #47', 9000000, 'undecided', 7, 'completed',
   '• 임플란트 3개 필요, 사업가\n• 원데이 임플란트 문의\n• 9,000만원 안내 → OK\n• 스케줄 맞추기 어려워 보류',
   '{"good_points": ["VIP 맞춤 응대", "원데이 옵션 설명 적절"], "improve_points": [{"issue": "스케줄 해결책 제시 부족", "suggestion": "주말/야간 진료 옵션 적극 제안"}], "scores": {"needs_identification": 85, "value_delivery": 82, "objection_handling": 72, "closing": 68}, "total_score": 77}',
   '{"fear": "시간소요", "decision_factor": "빠른치료", "budget": "무관"}',
   '{"overall_tone": "positive", "decision_score": 7}',
   '["돈은 상관없는데 시간이...", "주말에 되나요?"]'),

  -- 임하늘: 충치 치료 진행중
  ('consult_d06', 'org_bd_dental', 'user_lee', 'patient_d06', '2026-02-15 10:00:00', 20, '충치치료', '다수', 1200000, 'paid', 8, 'completed',
   '• 충치 7개, 치과 공포증 있음\n• 무통 마취 강조\n• 3회 분할 치료 계획\n• 안심 후 결제',
   '{"good_points": ["공포증 환자 대응 우수", "단계별 치료계획 효과적"], "scores": {"needs_identification": 88, "value_delivery": 85, "objection_handling": 90, "closing": 82}, "total_score": 86}',
   '{"fear": "통증", "hesitation_reason": "공포증"}',
   '{"overall_tone": "relieved", "decision_score": 8}',
   '["안 아프게 해주세요", "선생님 믿을게요"]'),

  -- 신동현: 임플란트 미결정 (가격)
  ('consult_d07', 'org_bd_dental', 'user_kim', 'patient_d07', '2026-02-18 14:00:00', 30, '임플란트', '하악 전체', 12000000, 'undecided', 4, 'completed',
   '• 하악 틀니→임플란트 전환 상담\n• 1,200만원 부담 크다고 함\n• 부분 임플란트 옵션 제안\n• 자녀와 상의하겠다고 함',
   '{"good_points": ["환자 눈높이 맞춘 설명"], "improve_points": [{"issue": "경제적 부담 해결 방안 부족", "suggestion": "국민건강보험 임플란트 안내, 분할납부 강조"}], "scores": {"needs_identification": 78, "value_delivery": 72, "objection_handling": 60, "closing": 50}, "total_score": 65}',
   '{"fear": "경제적 부담", "decision_maker": "자녀", "budget": "500만원 이하"}',
   '{"overall_tone": "worried", "decision_score": 4}',
   '["이 나이에 그 돈을...", "아들한테 얘기해봐야지"]'),

  -- 조은지: 보철 결제완료
  ('consult_d08', 'org_bd_dental', 'user_park', 'patient_d08', '2026-02-20 16:00:00', 12, '보철', '상악 전치 2개', 1500000, 'paid', 9, 'completed',
   '• 앞니 외상 보철 상담\n• 보험 처리 가능 여부 확인\n• 지르코니아 크라운 추천\n• 보험+자비 설명 후 결제',
   '{"good_points": ["보험 처리 안내 정확", "응급상황 공감"], "scores": {"needs_identification": 90, "value_delivery": 88, "objection_handling": 85, "closing": 92}, "total_score": 89}',
   '{}', '{"overall_tone": "positive", "decision_score": 9}', '["보험 되는 거 맞죠?"]'),

  -- 홍예린: 교정 미결정 (해외출장)
  ('consult_d09', 'org_bd_dental', 'user_kim', 'patient_d10', '2026-02-22 11:30:00', 25, '교정', '전체', 5500000, 'undecided', 6, 'completed',
   '• 투명교정 상담, 해외 출장 잦음\n• 원격 모니터링 가능 여부 문의\n• 550만원 안내\n• 출장 일정 확인 후 결정',
   '{"good_points": ["해외출장 고려한 플랜 제안"], "improve_points": [{"issue": "원격관리 구체적 방법 미설명", "suggestion": "앱 기반 모니터링 시스템 시연"}], "scores": {"needs_identification": 82, "value_delivery": 78, "objection_handling": 70, "closing": 65}, "total_score": 74}',
   '{"fear": "관리 어려움", "decision_factor": "편의성"}',
   '{"overall_tone": "interested", "decision_score": 6}',
   '["출장 중에도 관리가 되나요?", "좀 더 알아볼게요"]'),

  -- 문재석: 임플란트 미결정 (건강걱정)
  ('consult_d10', 'org_bd_dental', 'user_lee', 'patient_d11', '2026-02-25 15:00:00', 30, '임플란트', '상악', 7500000, 'undecided', 5, 'completed',
   '• 상악동 거상술+임플란트 설명\n• 고혈압 관련 리스크 설명\n• 내과 협진 필요 안내\n• 내과 결과 후 결정',
   '{"good_points": ["전신질환 고려한 안전한 접근"], "improve_points": [{"issue": "내과 의뢰서 즉시 발급 안함", "suggestion": "바로 의뢰서 작성해 드리겠다 제안"}], "scores": {"needs_identification": 80, "value_delivery": 75, "objection_handling": 72, "closing": 60}, "total_score": 72}',
   '{"fear": "전신마취 리스크", "hesitation_reason": "건강"}',
   '{"overall_tone": "cautious", "decision_score": 5}',
   '["혈압 높은데 괜찮을까요?", "내과 먼저 다녀올게요"]'),

  -- 서지민: 미백 결제완료
  ('consult_d11', 'org_bd_dental', 'user_park', 'patient_d12', '2026-02-28 13:00:00', 8, '미백', '전체', 300000, 'paid', 10, 'completed',
   '• 교정 끝나고 미백 상담\n• 홈블리칭 vs 오피스블리칭 설명\n• 오피스블리칭 선택, 즉시 결제',
   '{"scores": {"needs_identification": 85, "value_delivery": 88, "objection_handling": 85, "closing": 92}, "total_score": 88}',
   '{}', '{"overall_tone": "excited", "decision_score": 10}', '["빨리 하고 싶어요!"]'),

  -- 유민호: 재치료 미결정
  ('consult_d12', 'org_bd_dental', 'user_kim', 'patient_d13', '2026-03-01 10:00:00', 20, '보철', '하악 구치부', 2000000, 'undecided', 6, 'completed',
   '• 타 병원 크라운 재제작 상담\n• 불만 사항 경청\n• 재시술 계획 설명\n• 이전 병원과 비교 후 결정',
   '{"good_points": ["환자 불만 공감 잘함"], "improve_points": [{"issue": "자신감 있는 보증 제시 부족", "suggestion": "5년 보증 프로그램 안내"}], "scores": {"needs_identification": 80, "value_delivery": 75, "objection_handling": 78, "closing": 62}, "total_score": 74}',
   '{"fear": "또 실패", "hesitation_reason": "신뢰"}',
   '{"overall_tone": "skeptical", "decision_score": 6}',
   '["전 병원에서 되게 안 좋았거든요", "여기는 좀 다르려나..."]'),

  -- 정수아: 충치 결제완료 (응급)
  ('consult_d13', 'org_bd_dental', 'user_lee', 'patient_d14', '2026-03-03 09:00:00', 10, '충치치료', '#36', 200000, 'paid', 10, 'completed',
   '• 임산부 응급 충치\n• 안전한 마취 방법 설명\n• 즉시 치료 동의',
   '{"good_points": ["임산부 안전 프로토콜 설명 우수", "빠른 응급 대응"], "scores": {"needs_identification": 92, "value_delivery": 90, "objection_handling": 95, "closing": 95}, "total_score": 93}',
   '{}', '{"overall_tone": "relieved", "decision_score": 10}', '["아기한테 괜찮은 거죠?"]'),

  -- 김태호: 전악임플란트 미결정 (고민중)
  ('consult_d14', 'org_bd_dental', 'user_kim', 'patient_d15', '2026-03-05 14:00:00', 45, '임플란트', '전악', 35000000, 'undecided', 7, 'completed',
   '• 전악 임플란트 상담, 3,500만원\n• 올온4 vs 개별 임플란트 비교\n• 예산은 충분, 결과물 고민\n• 케이스 더 보고 결정',
   '{"good_points": ["전악 치료 옵션 체계적 비교", "고가 치료 경험 공유"], "improve_points": [{"issue": "결정 촉진 부족", "suggestion": "비슷한 케이스 환자 후기 영상 공유"}], "scores": {"needs_identification": 88, "value_delivery": 85, "objection_handling": 80, "closing": 70}, "total_score": 81}',
   '{"fear": "결과물 불만족", "decision_factor": "자연스러운 결과", "budget": "무관"}',
   '{"overall_tone": "thoughtful", "decision_score": 7}',
   '["돈보다 결과가 중요해요", "다른 분들 케이스 좀 더 볼 수 있을까요?"]'),

  -- 이나연: 교정 결제완료 (소개환자)
  ('consult_d15', 'org_bd_dental', 'user_kim', 'patient_d16', '2026-03-07 12:00:00', 20, '교정', '전체', 4800000, 'paid', 9, 'completed',
   '• 박영희님 소개로 내원\n• 투명교정 상담\n• 480만원 → 소개 할인 적용\n• 즉시 결제',
   '{"good_points": ["소개환자 맞춤 응대", "소개 할인 적절한 적용"], "scores": {"needs_identification": 88, "value_delivery": 90, "objection_handling": 85, "closing": 95}, "total_score": 90}',
   '{}', '{"overall_tone": "positive", "decision_score": 9}', '["영희 말대로 여기 좋네요!"]'),

  -- 박성민: 임플란트 미결정
  ('consult_d16', 'org_bd_dental', 'user_lee', 'patient_d17', '2026-03-08 16:30:00', 25, '임플란트', '#36', 3000000, 'undecided', 6, 'completed',
   '• 브릿지→임플란트 교체 상담\n• 기존 브릿지 수명 설명\n• 300만원 안내\n• 아내와 상의 후 결정',
   '{"good_points": ["브릿지 vs 임플란트 비교 명확"], "improve_points": [{"issue": "의사결정자(아내) 참여 유도 부족", "suggestion": "다음 상담에 부인도 함께 오시도록 제안"}], "scores": {"needs_identification": 78, "value_delivery": 80, "objection_handling": 72, "closing": 60}, "total_score": 73}',
   '{"decision_maker": "아내", "hesitation_reason": "가격"}',
   '{"overall_tone": "neutral", "decision_score": 6}',
   '["와이프한테 물어봐야 해요"]'),

  -- 최윤아: 심미치료 결제완료 (VIP)
  ('consult_d17', 'org_bd_dental', 'user_kim', 'patient_d18', '2026-03-10 13:00:00', 35, '라미네이트', '상악 전치 6개', 5400000, 'paid', 10, 'completed',
   '• 미백+잇몸성형+라미네이트 패키지\n• SNS 포트폴리오용 사진 촬영 제안\n• 540만원 → VIP 패키지 적용\n• 즉시 결제, 매우 만족',
   '{"good_points": ["VIP 맞춤 패키지 제안 탁월", "SNS 활용 제안으로 부가가치 창출", "전체 코디네이션 우수"], "improve_points": [], "scores": {"needs_identification": 96, "value_delivery": 95, "objection_handling": 92, "closing": 98}, "total_score": 95}',
   '{"decision_factor": "SNS 콘텐츠"}',
   '{"overall_tone": "very_positive", "decision_score": 10}',
   '["대박! 이거 인스타에 올려도 돼요?", "팔로워들이 좋아하겠다!"]'),

  -- 한승우: 임플란트 2차 대기중
  ('consult_d18', 'org_bd_dental', 'user_lee', 'patient_d19', '2026-03-05 10:00:00', 10, '임플란트', '#46', 3000000, 'paid', 10, 'completed',
   '• 임플란트 1차 후 2차 보철 상담\n• 금연 상태 확인 → 아직 피움\n• 금연 강력 권고\n• 2주 후 2차 진행 예정',
   '{"scores": {"needs_identification": 82, "value_delivery": 80, "objection_handling": 78, "closing": 85}, "total_score": 81}',
   '{}', '{"overall_tone": "positive", "decision_score": 10}', '["담배 끊기 어렵네요"]'),

  -- 남지현: 복합치료 미결정
  ('consult_d19', 'org_bd_dental', 'user_kim', 'patient_d20', '2026-03-10 15:00:00', 40, '교정', '전체+임플란트', 8500000, 'undecided', 6, 'completed',
   '• 교정+임플란트 복합치료 상담\n• 치료 순서/기간 설명 (2년+)\n• 850만원 → 부담 표현\n• 방학 시작에 맞춰 고민 중',
   '{"good_points": ["복합치료 로드맵 체계적"], "improve_points": [{"issue": "교사 특성 고려한 스케줄링 미제안", "suggestion": "방학 활용 집중 치료 플랜 제안"}], "scores": {"needs_identification": 82, "value_delivery": 78, "objection_handling": 70, "closing": 62}, "total_score": 73}',
   '{"fear": "긴 치료기간", "hesitation_reason": "가격+기간", "decision_factor": "방학 활용"}',
   '{"overall_tone": "interested", "decision_score": 6}',
   '["방학 때 시작하면 안 될까요?", "좀 비싸네요..."]'),

  -- 양현석: 틀니 결제완료
  ('consult_d20', 'org_bd_dental', 'user_park', 'patient_d21', '2026-03-12 09:00:00', 15, '보철', '상하악 틀니', 1800000, 'paid', 8, 'completed',
   '• 잔존치 발치 후 틀니 상담\n• 경제적 부담 → 분할납부 안내\n• 180만원 4회 분할 동의\n• 결제 완료',
   '{"good_points": ["경제적 상황 배려", "분할납부 유연한 제안"], "scores": {"needs_identification": 82, "value_delivery": 80, "objection_handling": 85, "closing": 80}, "total_score": 82}',
   '{}', '{"overall_tone": "grateful", "decision_score": 8}', '["감사합니다, 나눠서 내도 되는 거죠?"]'),

  -- 전소희: 라미네이트 결제완료 (VIP)
  ('consult_d21', 'org_bd_dental', 'user_kim', 'patient_d22', '2026-03-13 11:00:00', 20, '라미네이트', '상악 전치 6개', 4800000, 'paid', 10, 'completed',
   '• 라미네이트 재시술 상담\n• 이전 결과 만족, 색상 변경 희망\n• 480만원 → 재시술 할인 적용\n• 즉시 결제',
   '{"good_points": ["재방문 환자 맞춤 응대", "기존 시술 히스토리 파악"], "scores": {"needs_identification": 92, "value_delivery": 90, "objection_handling": 88, "closing": 95}, "total_score": 91}',
   '{}', '{"overall_tone": "very_positive", "decision_score": 10}', '["역시 여기가 최고예요"]'),

  -- 고민수: 잇몸+보철 미결정
  ('consult_d22', 'org_bd_dental', 'user_lee', 'patient_d23', '2026-03-14 14:00:00', 25, '보철', '잇몸치료+보철', 3500000, 'undecided', 5, 'completed',
   '• 잇몸치료 선행 후 보철 필요\n• 치료 기간 6개월 예상\n• 350만원 안내\n• 시간/비용 모두 고민',
   '{"good_points": ["치료 순서 명확히 설명"], "improve_points": [{"issue": "장기 치료 부담 해소 부족", "suggestion": "단계별 납부 플랜 + 중간 성과 공유 약속"}], "scores": {"needs_identification": 75, "value_delivery": 72, "objection_handling": 68, "closing": 55}, "total_score": 68}',
   '{"fear": "긴 치료기간", "hesitation_reason": "시간+비용"}',
   '{"overall_tone": "hesitant", "decision_score": 5}',
   '["6개월이나 걸려요?", "좀 더 생각해볼게요"]'),

  -- 백서윤: 충치 결제완료
  ('consult_d23', 'org_bd_dental', 'user_park', 'patient_d24', '2026-03-15 10:30:00', 12, '충치치료', '다수 (5개)', 800000, 'paid', 9, 'completed',
   '• 충치 5개 한번에 치료 희망\n• 2회 방문으로 가능 안내\n• 80만원 → 한번에 결제\n• 다음 주 첫 치료 예약',
   '{"scores": {"needs_identification": 85, "value_delivery": 88, "objection_handling": 82, "closing": 90}, "total_score": 86}',
   '{}', '{"overall_tone": "positive", "decision_score": 9}', '["한번에 끝내고 싶어요"]'),

  -- 송재현: 임플란트 미결정
  ('consult_d24', 'org_bd_dental', 'user_kim', 'patient_d25', '2026-03-17 15:30:00', 20, '임플란트', '#36, #46', 6000000, 'undecided', 7, 'completed',
   '• 어금니 임플란트 2개 상담\n• 당뇨 경계 → 혈당 관리 상태 확인\n• 600만원 → OK\n• 내과 확인 후 진행 예정',
   '{"good_points": ["전신질환 고려 안전 접근"], "improve_points": [{"issue": "내과 협진 프로세스 구체화 필요"}], "scores": {"needs_identification": 82, "value_delivery": 80, "objection_handling": 78, "closing": 72}, "total_score": 78}',
   '{"fear": "당뇨 합병증", "decision_factor": "안전성"}',
   '{"overall_tone": "cautious", "decision_score": 7}',
   '["당뇨가 좀 있어서...", "내과에서 OK 나오면 바로 할게요"]'),

  -- 추가 과거 상담들 (통계 풍부하게)
  ('consult_d25', 'org_bd_dental', 'user_kim', 'patient_d01', '2025-12-15 10:00:00', 15, '스케일링', '전체', 50000, 'paid', 10, 'completed',
   '• 정기 스케일링', '{"scores": {"needs_identification": 90, "value_delivery": 88, "objection_handling": 85, "closing": 95}, "total_score": 90}', '{}', '{}', '[]'),
  ('consult_d26', 'org_bd_dental', 'user_lee', 'patient_d02', '2025-12-20 14:00:00', 20, '미백', '전체', 350000, 'paid', 10, 'completed',
   '• 미백 1차 시술', '{"scores": {"needs_identification": 85, "value_delivery": 88, "objection_handling": 82, "closing": 90}, "total_score": 86}', '{}', '{}', '[]'),
  ('consult_d27', 'org_bd_dental', 'user_kim', 'patient_d09', '2026-02-10 11:00:00', 10, '스케일링', '전체', 50000, 'paid', 10, 'completed',
   '• 정기 스케일링 + 잇몸 체크', '{"scores": {"needs_identification": 88, "value_delivery": 85, "objection_handling": 80, "closing": 92}, "total_score": 86}', '{}', '{}', '[]'),
  ('consult_d28', 'org_bd_dental', 'user_park', 'patient_d06', '2026-03-01 15:00:00', 15, '충치치료', '#14, #25', 600000, 'paid', 9, 'completed',
   '• 충치 2개 추가 치료 (2회차)', '{"scores": {"needs_identification": 90, "value_delivery": 85, "objection_handling": 92, "closing": 88}, "total_score": 89}', '{}', '{}', '[]'),
  ('consult_d29', 'org_bd_dental', 'user_kim', 'patient_d08', '2026-03-05 11:00:00', 10, '보철', '상악 전치 최종', 0, 'paid', 10, 'completed',
   '• 보철 최종 세팅 체크', '{"scores": {"needs_identification": 85, "value_delivery": 90, "objection_handling": 85, "closing": 90}, "total_score": 88}', '{}', '{}', '[]'),
  ('consult_d30', 'org_bd_dental', 'user_lee', 'patient_d04', '2026-03-15 09:00:00', 8, '발치', '사랑니 4개 시술', 0, 'paid', 10, 'completed',
   '• 사랑니 발치 완료 후 경과 체크', '{"scores": {"needs_identification": 82, "value_delivery": 80, "objection_handling": 78, "closing": 85}, "total_score": 81}', '{}', '{}', '[]');

-- 연락 태스크 (오늘 연락해야 할 사람들)
INSERT OR IGNORE INTO contact_tasks (id, organization_id, consultation_id, user_id, patient_id, task_type, recommended_date, recommended_message, points, status) VALUES
  -- 클로징 (미결정 환자 팔로업)
  ('task_d01', 'org_bd_dental', 'consult_d03', 'user_kim', 'patient_d03', 'closing', '2026-03-20',
   '장현우님, BD치과 김실장입니다. 보철 상담 관련해서 결정하셨는지 여쭤보려고요.',
   '["타 병원 대비 5년 보증 프로그램 강조", "분할납부 구체적 시뮬레이션 제안", "이번 달 보철 프로모션 안내"]', 'pending'),
  ('task_d02', 'org_bd_dental', 'consult_d05', 'user_kim', 'patient_d05', 'closing', '2026-03-22',
   '배준호님, BD치과 김실장입니다. 주말 진료 가능한 날짜 확인되어서 연락드렸어요.',
   '["주말/야간 진료 가능 시간 안내", "원데이 임플란트 스케줄 제안"]', 'pending'),
  ('task_d03', 'org_bd_dental', 'consult_d07', 'user_kim', 'patient_d07', 'closing', '2026-03-24',
   '신동현님, BD치과 김실장입니다. 건강보험 임플란트 관련 안내드리려고 연락드렸어요.',
   '["65세 이상 건강보험 임플란트 안내", "부분 임플란트+틀니 혼합 옵션", "자녀분 함께 오실 수 있도록 제안"]', 'pending'),
  ('task_d04', 'org_bd_dental', 'consult_d09', 'user_kim', 'patient_d10', 'closing', '2026-03-24',
   '홍예린님, BD치과 김실장입니다. 투명교정 원격 모니터링 시스템 자료 보내드리려고요.',
   '["원격 모니터링 앱 시연", "해외 출장 중 관리 플랜 제안"]', 'pending'),
  ('task_d05', 'org_bd_dental', 'consult_d12', 'user_kim', 'patient_d13', 'closing', '2026-03-24',
   '유민호님, BD치과 김실장입니다. 보철 5년 보증 프로그램 상세 안내드리려고요.',
   '["5년 보증 프로그램 설명", "이전 병원과의 차별점 강조"]', 'pending'),
  ('task_d06', 'org_bd_dental', 'consult_d14', 'user_kim', 'patient_d15', 'closing', '2026-03-24',
   '김태호님, BD치과 김실장입니다. 전악 임플란트 비슷한 케이스 영상 준비했습니다.',
   '["유사 케이스 비포/애프터 영상 공유", "올온4 장기 결과물 설명"]', 'pending'),
  ('task_d07', 'org_bd_dental', 'consult_d16', 'user_lee', 'patient_d17', 'closing', '2026-03-23',
   '박성민님, BD치과 이상담입니다. 부인분과 함께 오실 수 있는 날짜 여쭤보려고요.',
   '["부인 동반 상담 제안", "임플란트 vs 브릿지 비교 자료 준비"]', 'pending'),
  ('task_d08', 'org_bd_dental', 'consult_d19', 'user_kim', 'patient_d20', 'closing', '2026-03-24',
   '남지현님, BD치과 김실장입니다. 방학 맞춤 치료 플랜 만들어봤는데 공유드려도 될까요?',
   '["여름방학 집중 치료 스케줄", "교사 맞춤 시간대 제안"]', 'pending'),
  ('task_d09', 'org_bd_dental', 'consult_d22', 'user_lee', 'patient_d23', 'closing', '2026-03-22',
   '고민수님, BD치과 이상담입니다. 잇몸치료 단계별 비용 안내서 보내드리려고요.',
   '["단계별 납부 플랜 안내", "중간 경과 사진 공유 약속"]', 'pending'),
  ('task_d10', 'org_bd_dental', 'consult_d24', 'user_kim', 'patient_d25', 'closing', '2026-03-24',
   '송재현님, BD치과 김실장입니다. 내과 결과 나오셨는지 여쭤보려고요.',
   '["내과 소견서 확인", "당뇨 환자 임플란트 성공 사례 공유"]', 'pending'),

  -- 안부 연락 (치료 완료 환자)
  ('task_d11', 'org_bd_dental', 'consult_d02', 'user_kim', 'patient_d02', 'proactive', '2026-03-24',
   '윤서연님, BD치과 김실장입니다. 라미네이트 시술 후 2개월 되셨는데, 만족스러우신가요?',
   '["시술 만족도 체크", "웨딩 사진 잘 나왔는지 축하인사", "정기 체크업 안내"]', 'pending'),
  ('task_d12', 'org_bd_dental', 'consult_d06', 'user_lee', 'patient_d06', 'proactive', '2026-03-24',
   '임하늘님, BD치과 이상담입니다. 충치 치료 잘 마무리하셨는데, 불편하신 거 없으세요?',
   '["치료 후 불편감 체크", "정기 관리 스케줄 안내"]', 'pending'),
  ('task_d13', 'org_bd_dental', 'consult_d20', 'user_park', 'patient_d21', 'proactive', '2026-03-24',
   '양현석님, BD치과 박코디입니다. 틀니 적응은 잘 되고 계신가요?',
   '["틀니 적응 체크", "관리 방법 재안내", "다음 방문 예약"]', 'pending');

-- 연락 로그 (과거 연락 기록)
INSERT OR IGNORE INTO contact_logs (id, organization_id, patient_id, user_id, task_id, contact_type, contact_result, outcome, content, created_at) VALUES
  ('log_d01', 'org_bd_dental', 'patient_d01', 'user_kim', null, 'call', 'success', 'booked', '교정 상담 후 예약 확정. 다음 주 내원 예정.', '2026-01-18 10:00:00'),
  ('log_d02', 'org_bd_dental', 'patient_d02', 'user_kim', null, 'call', 'success', 'booked', '웨딩 일정 확인, 라미네이트 예약 완료.', '2026-01-20 14:00:00'),
  ('log_d03', 'org_bd_dental', 'patient_d03', 'user_lee', null, 'call', 'no_answer', null, '부재중. 문자 발송.', '2026-02-08 11:00:00'),
  ('log_d04', 'org_bd_dental', 'patient_d03', 'user_lee', null, 'text', 'success', 'callback', '보철 상담 자료 문자 발송. 회신 대기.', '2026-02-08 11:30:00'),
  ('log_d05', 'org_bd_dental', 'patient_d05', 'user_kim', null, 'call', 'success', 'callback', '주말 진료 확인 후 재연락 약속.', '2026-02-15 18:00:00'),
  ('log_d06', 'org_bd_dental', 'patient_d07', 'user_kim', null, 'call', 'no_answer', null, '부재중 3회. 문자 발송.', '2026-02-22 10:00:00'),
  ('log_d07', 'org_bd_dental', 'patient_d10', 'user_kim', null, 'kakao', 'success', 'callback', '카톡으로 투명교정 자료 공유. 출장 후 연락 약속.', '2026-02-25 15:00:00'),
  ('log_d08', 'org_bd_dental', 'patient_d15', 'user_kim', null, 'call', 'success', 'callback', '케이스 사진 추가 요청. 준비 후 재연락.', '2026-03-07 16:00:00'),
  ('log_d09', 'org_bd_dental', 'patient_d16', 'user_kim', null, 'call', 'success', 'booked', '소개 감사인사 + 예약 완료.', '2026-03-06 10:00:00'),
  ('log_d10', 'org_bd_dental', 'patient_d18', 'user_kim', null, 'kakao', 'success', 'booked', 'SNS 포트폴리오 컨셉 논의. 다음 주 시술 예약.', '2026-03-08 14:00:00'),
  ('log_d11', 'org_bd_dental', 'patient_d17', 'user_lee', null, 'call', 'no_answer', null, '부재중. 저녁에 재시도.', '2026-03-10 10:00:00'),
  ('log_d12', 'org_bd_dental', 'patient_d17', 'user_lee', null, 'call', 'success', 'callback', '아내와 상의 중. 다음주 결정.', '2026-03-10 19:00:00'),
  ('log_d13', 'org_bd_dental', 'patient_d20', 'user_kim', null, 'call', 'success', 'callback', '방학 시작일 확인 중. 스케줄 나오면 연락 예정.', '2026-03-12 16:00:00'),
  ('log_d14', 'org_bd_dental', 'patient_d23', 'user_lee', null, 'call', 'success', 'hold', '비용 부담. 보류 중. 2주 후 재연락.', '2026-03-16 11:00:00'),
  ('log_d15', 'org_bd_dental', 'patient_d25', 'user_kim', null, 'call', 'success', 'callback', '내과 진료 예약함. 결과 나오면 연락 주기로.', '2026-03-18 14:00:00');

-- 리텐션 치료 데이터
INSERT OR IGNORE INTO patient_treatments (id, organization_id, patient_id, treatment_type, treatment_name, status, total_amount, paid_amount, started_at, next_appointment, notes) VALUES
  ('treat_d01', 'org_bd_dental', 'patient_d01', 'ortho', '투명교정 전체', 'in_progress', 4500000, 4500000, '2026-01-25', '2026-04-01', '교정 진행중. 월 1회 체크.'),
  ('treat_d02', 'org_bd_dental', 'patient_d02', 'laminate', '라미네이트 상악 4개', 'completed', 3800000, 3800000, '2026-01-25', null, '웨딩 전 완료. 매우 만족.'),
  ('treat_d03', 'org_bd_dental', 'patient_d03', 'prosthetic', '전체 보철', 'consulted', 8000000, 0, null, null, '미결정. 비교 중.'),
  ('treat_d04', 'org_bd_dental', 'patient_d05', 'implant', '임플란트 3개', 'consulted', 9000000, 0, null, null, '미결정. 시간 문제.'),
  ('treat_d05', 'org_bd_dental', 'patient_d06', 'general', '충치 다수 치료', 'in_progress', 1200000, 800000, '2026-02-20', '2026-03-28', '3회 중 2회 완료.'),
  ('treat_d06', 'org_bd_dental', 'patient_d07', 'implant', '하악 임플란트', 'consulted', 12000000, 0, null, null, '미결정. 경제적 부담.'),
  ('treat_d07', 'org_bd_dental', 'patient_d08', 'prosthetic', '앞니 보철 2개', 'completed', 1500000, 1500000, '2026-02-22', null, '보철 완료.'),
  ('treat_d08', 'org_bd_dental', 'patient_d10', 'ortho', '투명교정', 'consulted', 5500000, 0, null, null, '미결정. 출장 일정 확인 중.'),
  ('treat_d09', 'org_bd_dental', 'patient_d11', 'implant', '상악동 거상+임플란트', 'consulted', 7500000, 0, null, null, '내과 협진 대기.'),
  ('treat_d10', 'org_bd_dental', 'patient_d15', 'implant', '전악 임플란트', 'consulted', 35000000, 0, null, null, '케이스 검토 중.'),
  ('treat_d11', 'org_bd_dental', 'patient_d16', 'ortho', '투명교정', 'in_progress', 4800000, 4800000, '2026-03-10', '2026-04-10', '소개환자. 교정 시작.'),
  ('treat_d12', 'org_bd_dental', 'patient_d17', 'implant', '임플란트 #36', 'consulted', 3000000, 0, null, null, '아내 상의 후 결정.'),
  ('treat_d13', 'org_bd_dental', 'patient_d18', 'laminate', '미백+잇몸성형+라미네이트', 'in_progress', 5400000, 5400000, '2026-03-12', '2026-03-26', 'VIP 패키지. SNS 콘텐츠용.'),
  ('treat_d14', 'org_bd_dental', 'patient_d19', 'implant', '임플란트 2차 보철', 'scheduled', 3000000, 3000000, '2026-03-05', '2026-03-28', '금연 상태 확인 후 진행.'),
  ('treat_d15', 'org_bd_dental', 'patient_d20', 'ortho', '교정+임플란트 복합', 'consulted', 8500000, 0, null, null, '방학 시작에 맞춰 고민.'),
  ('treat_d16', 'org_bd_dental', 'patient_d21', 'prosthetic', '상하악 틀니', 'in_progress', 1800000, 900000, '2026-03-15', '2026-03-29', '2회 분납 중 1회 완료.'),
  ('treat_d17', 'org_bd_dental', 'patient_d22', 'laminate', '라미네이트 재시술 6개', 'in_progress', 4800000, 4800000, '2026-03-15', '2026-03-28', '재시술 진행중.'),
  ('treat_d18', 'org_bd_dental', 'patient_d23', 'prosthetic', '잇몸+보철 복합', 'consulted', 3500000, 0, null, null, '시간+비용 고민 중.'),
  ('treat_d19', 'org_bd_dental', 'patient_d24', 'general', '충치 5개 치료', 'in_progress', 800000, 800000, '2026-03-17', '2026-03-25', '1회 차 완료. 다음 주 2회차.'),
  ('treat_d20', 'org_bd_dental', 'patient_d25', 'implant', '임플란트 2개', 'consulted', 6000000, 0, null, null, '내과 확인 대기.');

-- 리텐션 상태 업데이트 (데모 환자들)
INSERT OR REPLACE INTO patient_retention_status (id, organization_id, patient_id, status, risk_score, last_visit_date, days_since_visit, remaining_treatment_value, recommended_contact_date, recommended_contact_script, recommended_contact_type, priority_score) VALUES
  ('ret_d01', 'org_bd_dental', 'patient_d01', 'in_treatment', 10, '2026-03-01', 23, 0, null, null, null, 10),
  ('ret_d02', 'org_bd_dental', 'patient_d02', 'completed', 5, '2026-01-25', 58, 0, '2026-07-25', null, null, 5),
  ('ret_d03', 'org_bd_dental', 'patient_d03', 'consulted_unconverted', 65, '2026-02-05', 47, 8000000, '2026-03-24',
   '장현우님, 지난번 보철 상담 이후 결정하셨는지 궁금합니다. 이번 달 5년 무상 보증 프로모션이 있어서 안내드려요.', 'phone', 82),
  ('ret_d04', 'org_bd_dental', 'patient_d04', 'completed', 5, '2026-03-15', 9, 0, null, null, null, 5),
  ('ret_d05', 'org_bd_dental', 'patient_d05', 'consulted_unconverted', 55, '2026-02-12', 40, 9000000, '2026-03-24',
   '배준호님, 주말 야간 진료 일정이 확정되었습니다. 편하신 시간에 임플란트 진행 가능합니다.', 'phone', 78),
  ('ret_d06', 'org_bd_dental', 'patient_d06', 'in_treatment', 15, '2026-03-01', 23, 400000, '2026-03-28', null, null, 15),
  ('ret_d07', 'org_bd_dental', 'patient_d07', 'consulted_unconverted', 70, '2026-02-18', 34, 12000000, '2026-03-24',
   '신동현님, 65세 이상 건강보험 적용 임플란트 안내드립니다. 본인부담금 30%로 가능합니다.', 'phone', 88),
  ('ret_d08', 'org_bd_dental', 'patient_d08', 'completed', 5, '2026-03-05', 19, 0, null, null, null, 5),
  ('ret_d09', 'org_bd_dental', 'patient_d09', 'active', 10, '2026-02-10', 42, 0, null, null, null, 10),
  ('ret_d10', 'org_bd_dental', 'patient_d10', 'consulted_unconverted', 50, '2026-02-22', 30, 5500000, '2026-03-25',
   '홍예린님, 투명교정 원격 모니터링 앱 데모 영상 준비했습니다. 해외에서도 편하게 관리 가능해요.', 'kakao', 72),
  ('ret_d11', 'org_bd_dental', 'patient_d11', 'consulted_unconverted', 58, '2026-02-25', 27, 7500000, '2026-03-25',
   '문재석님, 내과 검사 결과는 어떠셨나요? 결과에 따라 안전한 치료 계획 세워드리겠습니다.', 'phone', 75),
  ('ret_d12', 'org_bd_dental', 'patient_d12', 'active', 5, '2026-02-28', 24, 0, null, null, null, 5),
  ('ret_d13', 'org_bd_dental', 'patient_d13', 'consulted_unconverted', 48, '2026-03-01', 23, 2000000, '2026-03-25',
   '유민호님, 보철 5년 무상 보증 프로그램 안내서 보내드립니다. 이전 병원과는 다른 결과 보장해드려요.', 'text', 68),
  ('ret_d14', 'org_bd_dental', 'patient_d14', 'completed', 5, '2026-03-03', 21, 0, null, null, null, 5),
  ('ret_d15', 'org_bd_dental', 'patient_d15', 'consulted_unconverted', 45, '2026-03-05', 19, 35000000, '2026-03-26',
   '김태호님, 전악 임플란트 비슷한 케이스 비포/애프터 영상 준비했습니다. 확인 후 연락주세요.', 'phone', 90),
  ('ret_d16', 'org_bd_dental', 'patient_d16', 'in_treatment', 5, '2026-03-10', 14, 0, null, null, null, 5),
  ('ret_d17', 'org_bd_dental', 'patient_d17', 'consulted_unconverted', 52, '2026-03-08', 16, 3000000, '2026-03-24',
   '박성민님, 부인분과 함께 상담 가능한 시간 안내드립니다. 임플란트 관련 궁금한 점 함께 설명드리겠습니다.', 'phone', 70),
  ('ret_d18', 'org_bd_dental', 'patient_d18', 'in_treatment', 5, '2026-03-12', 12, 0, null, null, null, 5),
  ('ret_d19', 'org_bd_dental', 'patient_d19', 'in_treatment', 20, '2026-03-05', 19, 0, '2026-03-28', null, null, 20),
  ('ret_d20', 'org_bd_dental', 'patient_d20', 'consulted_unconverted', 42, '2026-03-10', 14, 8500000, '2026-03-26',
   '남지현님, 여름방학 맞춤 치료 스케줄 플랜 준비했습니다. 확인해보시겠어요?', 'phone', 65),
  ('ret_d21', 'org_bd_dental', 'patient_d21', 'in_treatment', 15, '2026-03-15', 9, 900000, '2026-03-29', null, null, 15),
  ('ret_d22', 'org_bd_dental', 'patient_d22', 'in_treatment', 5, '2026-03-15', 9, 0, null, null, null, 5),
  ('ret_d23', 'org_bd_dental', 'patient_d23', 'consulted_unconverted', 55, '2026-03-14', 10, 3500000, '2026-03-26',
   '고민수님, 잇몸치료+보철 단계별 납부 플랜 안내서 보내드립니다. 부담 없이 시작하실 수 있어요.', 'phone', 72),
  ('ret_d24', 'org_bd_dental', 'patient_d24', 'in_treatment', 5, '2026-03-17', 7, 0, null, null, null, 5),
  ('ret_d25', 'org_bd_dental', 'patient_d25', 'consulted_unconverted', 40, '2026-03-17', 7, 6000000, '2026-03-28',
   '송재현님, 내과 결과가 나오시면 안전한 임플란트 치료 계획 바로 세워드리겠습니다.', 'phone', 62);

-- 리텐션 연락 기록
INSERT OR IGNORE INTO retention_contacts (id, organization_id, patient_id, staff_id, treatment_id, contact_type, result, notes, next_contact_date, contacted_at) VALUES
  ('rcon_d01', 'org_bd_dental', 'patient_d03', 'user_lee', 'treat_d03', 'phone', 'no_answer', '부재중. 문자 발송.', '2026-03-15', '2026-02-20'),
  ('rcon_d02', 'org_bd_dental', 'patient_d03', 'user_lee', 'treat_d03', 'text', 'message_sent', '보철 자료 문자 발송. 읽음.', '2026-03-20', '2026-03-01'),
  ('rcon_d03', 'org_bd_dental', 'patient_d05', 'user_kim', 'treat_d04', 'phone', 'connected', '주말 진료 문의. 확인 후 재연락 약속.', '2026-03-20', '2026-02-20'),
  ('rcon_d04', 'org_bd_dental', 'patient_d07', 'user_kim', 'treat_d06', 'phone', 'connected', '아들과 상의 중. 건보 임플란트 안내 요청.', '2026-03-20', '2026-03-01'),
  ('rcon_d05', 'org_bd_dental', 'patient_d07', 'user_kim', 'treat_d06', 'text', 'message_sent', '건강보험 임플란트 안내 문자 발송.', '2026-03-24', '2026-03-10'),
  ('rcon_d06', 'org_bd_dental', 'patient_d10', 'user_kim', 'treat_d08', 'kakao', 'message_sent', '투명교정 자료 카톡 전송. 출장 후 연락 약속.', '2026-03-22', '2026-03-01'),
  ('rcon_d07', 'org_bd_dental', 'patient_d15', 'user_kim', 'treat_d10', 'phone', 'connected', '케이스 영상 더 보고 싶다고 함. 준비 후 재연락.', '2026-03-20', '2026-03-10'),
  ('rcon_d08', 'org_bd_dental', 'patient_d17', 'user_lee', 'treat_d12', 'phone', 'connected', '아내와 상의 중. 다음주 결정 예정.', '2026-03-24', '2026-03-15');
