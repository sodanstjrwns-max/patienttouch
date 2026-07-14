-- ============================================
-- Touch Report (터치 리포트) v1.0
-- 상담 녹음 기반 환자용 상담 보고서 + 카카오 발송
-- ============================================

-- 보고서 본체
CREATE TABLE IF NOT EXISTS touch_reports (
  id TEXT PRIMARY KEY,                    -- 추측 불가능한 고유 토큰 (URL용)
  organization_id TEXT NOT NULL,
  consultation_id TEXT NOT NULL,          -- 기존 상담 레코드 FK
  patient_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'generating',  -- generating / review / approved / sent / failed
  content_json TEXT,                      -- 섹션별 구조화 콘텐츠
  evidence_json TEXT,                     -- 문장별 근거(녹취 인용) 매핑
  flags_json TEXT,                        -- 확인필요 배지 항목 [{path, reason, quote}]
  banned_hits_json TEXT,                  -- 금칙어 검출 내역
  generation_model TEXT,
  verify_model TEXT,
  auth_required INTEGER DEFAULT 1,        -- 열람 시 생년월일 인증 여부
  auth_hint TEXT,                         -- 인증값 (생년월일 뒤 4자리 등)
  expires_at TEXT,                        -- 열람 만료
  approved_by TEXT,
  approved_at TEXT,
  sent_at TEXT,
  first_opened_at TEXT,
  last_opened_at TEXT,
  open_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (consultation_id) REFERENCES consultations(id)
);
CREATE INDEX IF NOT EXISTS idx_touch_reports_org ON touch_reports(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_touch_reports_consult ON touch_reports(consultation_id);
CREATE INDEX IF NOT EXISTS idx_touch_reports_patient ON touch_reports(patient_id);

-- 검수 및 수정 이력
CREATE TABLE IF NOT EXISTS touch_report_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id TEXT NOT NULL,
  editor_id TEXT NOT NULL,
  diff_json TEXT NOT NULL,                -- {path, before, after}
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES touch_reports(id)
);
CREATE INDEX IF NOT EXISTS idx_tr_revisions_report ON touch_report_revisions(report_id);

-- 발송 및 열람 이벤트 (써모 온도지표 연동 대비 이벤트 스키마)
CREATE TABLE IF NOT EXISTS touch_report_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  event_type TEXT NOT NULL,               -- sent / delivered / opened / auth_failed / pdf_saved / shared / booking_clicked
  meta_json TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES touch_reports(id)
);
CREATE INDEX IF NOT EXISTS idx_tr_events_report ON touch_report_events(report_id, event_type);
CREATE INDEX IF NOT EXISTS idx_tr_events_org ON touch_report_events(organization_id, created_at);

-- 병원 브랜드 키트
CREATE TABLE IF NOT EXISTS clinic_brand_kits (
  organization_id TEXT PRIMARY KEY,
  clinic_display_name TEXT,               -- 보고서 표기 병원명
  logo_url TEXT,
  primary_color TEXT DEFAULT '#7c4dff',
  secondary_color TEXT DEFAULT '#22d3ee',
  staff_profiles_json TEXT,               -- [{name, role, photo_url, intro}]
  clinic_address TEXT,
  clinic_phone TEXT,
  clinic_hours TEXT,
  booking_url TEXT,                       -- 예약하기 버튼 링크
  banned_words_json TEXT,                 -- 병원별 추가 금칙어
  auth_required INTEGER DEFAULT 1,
  report_ttl_days INTEGER DEFAULT 90,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 동의 기록 (민감정보 별도 동의)
CREATE TABLE IF NOT EXISTS patient_consents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  consent_type TEXT NOT NULL,             -- recording / ai_processing / kakao_delivery
  granted INTEGER NOT NULL DEFAULT 0,
  granted_by TEXT,                        -- 기록한 직원
  granted_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_consents_patient ON patient_consents(patient_id, consent_type);
