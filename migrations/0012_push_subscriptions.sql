-- v8.4: 웹 푸시 구독 (아침 브리핑 알림)
-- 0001의 구버전 push_subscriptions(미사용, keys 통합 컬럼)를 새 스키마로 교체
DROP TABLE IF EXISTS push_subscriptions;
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  failed_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  last_success_at TEXT,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id, enabled);
