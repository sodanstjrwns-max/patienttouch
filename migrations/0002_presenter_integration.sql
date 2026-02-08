-- Presenter Integration Schema
-- 실시간 STT + AI 상담 레포트 + 환자용 치료 제안서

-- Consultations 테이블 확장 (기존 테이블에 컬럼 추가)
-- 화자 분리된 트랜스크립트, 실시간 힌트 로그, NER 추출 데이터
ALTER TABLE consultations ADD COLUMN transcript_diarized TEXT DEFAULT '[]'; -- JSON: [{speaker, text, start, end, emotion}]
ALTER TABLE consultations ADD COLUMN ner_extracted TEXT DEFAULT '{}'; -- JSON: 치료부위, 금액, 기간 등 추출 정보
ALTER TABLE consultations ADD COLUMN realtime_hints TEXT DEFAULT '[]'; -- JSON: 실시간 힌트 로그
ALTER TABLE consultations ADD COLUMN spin_analysis TEXT DEFAULT '{}'; -- JSON: SPIN 화법 분석 결과
ALTER TABLE consultations ADD COLUMN recording_status TEXT DEFAULT 'idle' CHECK(recording_status IN ('idle', 'recording', 'processing', 'completed'));

-- Consultation Reports (상담 레포트) - AI 자동 생성
CREATE TABLE IF NOT EXISTS consultation_reports (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  consultation_id TEXT NOT NULL UNIQUE, -- 1:1 관계
  
  -- 환자 정보 요약
  patient_summary TEXT, -- 환자 기본 정보 + 이전 내원 이력
  
  -- 상담 요약
  consultation_summary TEXT NOT NULL, -- 3줄 요약
  
  -- 치료 옵션
  treatment_options TEXT DEFAULT '[]', -- JSON: [{name, price, duration, pros, cons, recommendation_level}]
  discussed_amount INTEGER, -- 논의된 총 금액
  payment_options TEXT DEFAULT '{}', -- JSON: {full_payment, installment_options: [{months, monthly_amount}]}
  
  -- 환자 우려사항
  patient_concerns TEXT DEFAULT '[]', -- JSON: [{concern, addressed, resolution}]
  
  -- 감정선 타임라인
  emotion_timeline TEXT DEFAULT '[]', -- JSON: [{timestamp, score, note, highlight}]
  emotion_summary TEXT, -- 감정 변화 요약
  overall_sentiment TEXT CHECK(overall_sentiment IN ('very_positive', 'positive', 'neutral', 'negative', 'very_negative')),
  
  -- 결정 요인 분석
  decision_factors TEXT DEFAULT '{}', -- JSON: {main_concern, decision_maker, budget_range, timeline}
  decision_score INTEGER DEFAULT 0, -- 1-10
  decision_prediction TEXT, -- 예상 결정 여부 및 근거
  
  -- 다음 단계 (Next Action)
  next_actions TEXT DEFAULT '[]', -- JSON: [{action, due_date, priority, assigned_to}]
  recommended_followup_date TEXT,
  followup_message TEXT, -- 추천 연락 멘트
  
  -- 상담사 코칭 피드백
  coaching_feedback TEXT DEFAULT '{}', -- JSON: {
    -- scores: {rapport, spin, objection, pricing, closing, structure},
    -- total_score, strengths: [], improvements: [{issue, suggestion, example}],
    -- patient_code_evaluation
  -- }
  coaching_score INTEGER DEFAULT 0, -- 총점 (100점 만점)
  
  -- 메타 정보
  generated_at TEXT DEFAULT (datetime('now')),
  generation_model TEXT, -- GPT-4o, Claude 등
  generation_version TEXT DEFAULT 'v1.0',
  is_edited INTEGER DEFAULT 0, -- 상담사 수정 여부
  edited_at TEXT,
  
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (consultation_id) REFERENCES consultations(id)
);

-- Treatment Proposals (환자용 치료 제안서 - Presenter)
CREATE TABLE IF NOT EXISTS treatment_proposals (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  consultation_id TEXT NOT NULL,
  report_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  
  -- 제안서 내용
  title TEXT NOT NULL, -- 제안서 제목
  greeting_message TEXT, -- 인사 메시지
  
  -- 치료 옵션 (레포트에서 선별)
  selected_options TEXT DEFAULT '[]', -- JSON: [{name, price, duration, benefits, recommended}]
  recommended_option TEXT, -- 추천 치료명
  
  -- 금액 정보
  total_amount INTEGER,
  discount_amount INTEGER DEFAULT 0,
  final_amount INTEGER,
  
  -- 분납 옵션
  installment_options TEXT DEFAULT '[]', -- JSON: [{months, monthly_amount, interest_rate}]
  default_installment_months INTEGER,
  
  -- 병원 브랜딩
  hospital_name TEXT,
  hospital_logo_url TEXT,
  hospital_message TEXT, -- 병원 소개/슬로건
  doctor_name TEXT,
  doctor_photo_url TEXT,
  
  -- CTA (Call to Action)
  cta_type TEXT DEFAULT 'reservation' CHECK(cta_type IN ('reservation', 'call', 'both')),
  reservation_url TEXT,
  hospital_phone TEXT,
  
  -- 공개 URL 및 토큰
  public_token TEXT UNIQUE NOT NULL, -- URL 접근용 토큰
  public_url TEXT, -- 전체 URL
  expires_at TEXT, -- 만료일
  
  -- 전송 정보
  sent_via TEXT CHECK(sent_via IN ('kakao', 'sms', 'email', 'link')),
  sent_at TEXT,
  sent_by TEXT, -- user_id
  
  -- 열람 추적
  viewed_at TEXT, -- 최초 열람 시간
  view_count INTEGER DEFAULT 0,
  last_viewed_at TEXT,
  time_spent_seconds INTEGER DEFAULT 0, -- 총 체류 시간
  
  -- 환자 액션 추적
  installment_interactions TEXT DEFAULT '[]', -- JSON: 분납 슬라이더 조작 로그
  cta_clicked INTEGER DEFAULT 0, -- CTA 클릭 여부
  cta_clicked_at TEXT,
  
  -- 상태
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'sent', 'viewed', 'expired', 'converted')),
  
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (consultation_id) REFERENCES consultations(id),
  FOREIGN KEY (report_id) REFERENCES consultation_reports(id),
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- STT Chunks (실시간 STT 청크 저장)
CREATE TABLE IF NOT EXISTS stt_chunks (
  id TEXT PRIMARY KEY,
  consultation_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  audio_url TEXT, -- R2 청크 URL
  transcript TEXT,
  speaker TEXT CHECK(speaker IN ('consultant', 'patient', 'unknown')),
  start_time REAL, -- 초 단위
  end_time REAL,
  emotion_score REAL, -- -1 ~ +1
  confidence REAL, -- STT 신뢰도
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (consultation_id) REFERENCES consultations(id)
);

-- AI Hints Log (실시간 힌트 로그)
CREATE TABLE IF NOT EXISTS ai_hints_log (
  id TEXT PRIMARY KEY,
  consultation_id TEXT NOT NULL,
  hint_type TEXT NOT NULL CHECK(hint_type IN ('pricing', 'objection', 'closing', 'rapport', 'spin', 'warning')),
  hint_message TEXT NOT NULL,
  trigger_text TEXT, -- 힌트를 트리거한 발화
  timestamp_seconds REAL,
  shown_to_user INTEGER DEFAULT 1, -- 사용자에게 표시됨
  user_action TEXT, -- 사용자 반응 (dismissed, followed)
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (consultation_id) REFERENCES consultations(id)
);

-- Organization Branding (병원 브랜딩 설정)
CREATE TABLE IF NOT EXISTS organization_branding (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#4F46E5', -- hex
  secondary_color TEXT DEFAULT '#818CF8',
  hospital_slogan TEXT,
  proposal_greeting_template TEXT, -- 제안서 기본 인사말 템플릿
  proposal_footer_message TEXT, -- 제안서 하단 메시지
  doctor_profiles TEXT DEFAULT '[]', -- JSON: [{name, title, photo_url, introduction}]
  default_installment_options TEXT DEFAULT '[3, 6, 12]', -- JSON: 기본 분납 개월 수
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Consultant Stats (상담사 통계 - 원장 대시보드용)
CREATE TABLE IF NOT EXISTS consultant_stats (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK(period_type IN ('daily', 'weekly', 'monthly')),
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  
  -- 상담 통계
  total_consultations INTEGER DEFAULT 0,
  total_duration_minutes INTEGER DEFAULT 0,
  avg_duration_minutes REAL DEFAULT 0,
  
  -- 전환 통계
  converted_count INTEGER DEFAULT 0, -- 결제 완료
  pending_count INTEGER DEFAULT 0, -- 미결정
  lost_count INTEGER DEFAULT 0, -- 이탈
  conversion_rate REAL DEFAULT 0, -- 전환율 (%)
  
  -- 금액 통계
  total_amount INTEGER DEFAULT 0,
  avg_amount INTEGER DEFAULT 0,
  
  -- 코칭 통계
  avg_coaching_score REAL DEFAULT 0,
  rapport_avg REAL DEFAULT 0,
  spin_avg REAL DEFAULT 0,
  objection_avg REAL DEFAULT 0,
  pricing_avg REAL DEFAULT 0,
  closing_avg REAL DEFAULT 0,
  
  -- 연락 통계
  contact_completion_rate REAL DEFAULT 0,
  
  -- 제안서 통계
  proposals_sent INTEGER DEFAULT 0,
  proposals_viewed INTEGER DEFAULT 0,
  proposals_converted INTEGER DEFAULT 0,
  
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, period_type, period_start)
);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_reports_consultation ON consultation_reports(consultation_id);
CREATE INDEX IF NOT EXISTS idx_reports_org_date ON consultation_reports(organization_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_proposals_consultation ON treatment_proposals(consultation_id);
CREATE INDEX IF NOT EXISTS idx_proposals_patient ON treatment_proposals(patient_id);
CREATE INDEX IF NOT EXISTS idx_proposals_token ON treatment_proposals(public_token);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON treatment_proposals(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_stt_chunks_consultation ON stt_chunks(consultation_id, chunk_index);
CREATE INDEX IF NOT EXISTS idx_ai_hints_consultation ON ai_hints_log(consultation_id);
CREATE INDEX IF NOT EXISTS idx_consultant_stats_user ON consultant_stats(user_id, period_type, period_start DESC);
