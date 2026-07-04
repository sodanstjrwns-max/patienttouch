-- Calendar performance indexes (v8.9.0)
-- 월별 캘린더 집계 쿼리용: org 단위 날짜 범위 스캔 최적화

-- contact_tasks: 기존 인덱스는 (user_id, ...) / (org, user, status)뿐 →
-- org 전체 기준 recommended_date 범위 조회용 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_contact_tasks_org_recdate
  ON contact_tasks(organization_id, recommended_date);

-- retention_contacts: 기존 (org, contacted_at)만 존재 →
-- next_contact_date 범위 조회용 부분 인덱스 (NULL 제외로 크기 절감)
CREATE INDEX IF NOT EXISTS idx_retention_contacts_org_nextdate
  ON retention_contacts(organization_id, next_contact_date)
  WHERE next_contact_date IS NOT NULL;
