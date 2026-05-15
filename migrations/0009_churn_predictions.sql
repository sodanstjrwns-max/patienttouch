-- v7.4: 이탈 예측 결과 + 피드백 루프
-- predictions 테이블: AI 예측 결과 저장
-- feedback 테이블: 실제 결과(이탈 발생 여부) 추적해서 모델 정확도 측정

CREATE TABLE IF NOT EXISTS churn_predictions (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  churn_probability INTEGER NOT NULL,        -- 0-100
  risk_level TEXT NOT NULL,                  -- critical/high/medium/low
  predicted_window_days INTEGER NOT NULL,
  key_risk_factors TEXT,                     -- JSON array
  recommended_action TEXT,
  recommended_script TEXT,
  confidence REAL DEFAULT 0.7,
  rule_based_score INTEGER,                  -- 폴백 점수 (비교용)
  features_snapshot TEXT,                    -- 예측 당시 입력 features JSON
  predicted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- 피드백 (나중에 업데이트됨)
  actual_outcome TEXT,                       -- churned / retained / unknown
  feedback_at DATETIME,
  feedback_note TEXT,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE INDEX IF NOT EXISTS idx_churn_org_patient ON churn_predictions(organization_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_churn_risk ON churn_predictions(organization_id, risk_level, predicted_at DESC);
CREATE INDEX IF NOT EXISTS idx_churn_outcome ON churn_predictions(organization_id, actual_outcome) WHERE actual_outcome IS NOT NULL;
