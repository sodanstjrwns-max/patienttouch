// v8.4: Web Push — 아침 브리핑 알림
import { Hono } from 'hono';
import { buildPushPayload, type PushSubscription, type PushMessage } from '@block65/webcrypto-web-push';
import { generateId } from '../lib/utils';
import { authMiddleware } from '../lib/auth';
import type { AppEnv } from '../types';

const push = new Hono<AppEnv>();

// ============================================
// Helpers
// ============================================
function getVapid(env: any) {
  return {
    subject: 'mailto:admin@patienttouch.kr',
    publicKey: env.VAPID_PUBLIC_KEY || '',
    privateKey: env.VAPID_PRIVATE_KEY || ''
  };
}

async function sendPush(env: any, sub: { endpoint: string; p256dh: string; auth: string }, data: any): Promise<{ ok: boolean; status: number }> {
  const subscription: PushSubscription = {
    endpoint: sub.endpoint,
    expirationTime: null,
    keys: { p256dh: sub.p256dh, auth: sub.auth }
  };
  const message: PushMessage = { data, options: { ttl: 60 * 60 * 12, urgency: 'high' } };
  const payload = await buildPushPayload(message, subscription, getVapid(env));
  const res = await fetch(sub.endpoint, payload as RequestInit);
  return { ok: res.ok || res.status === 201, status: res.status };
}

// 사용자별 아침 브리핑 데이터 계산 (today-contacts 요약판)
async function computeBriefing(db: D1Database, orgId: string, userId: string) {
  const today = new Date().toISOString().split('T')[0];

  const [tasksRes, undecidedRes] = await Promise.all([
    db.prepare(`
      SELECT t.recommended_date, t.task_type, p.name as patient_name,
             c.amount, c.decision_score
      FROM contact_tasks t
      JOIN patients p ON t.patient_id = p.id
      LEFT JOIN consultations c ON t.consultation_id = c.id
      WHERE t.organization_id = ? AND t.user_id = ? AND t.status = 'pending'
        AND t.recommended_date <= ?
      ORDER BY t.task_type = 'closing' DESC, t.recommended_date ASC
      LIMIT 20
    `).bind(orgId, userId, today).all(),
    db.prepare(`
      SELECT COUNT(*) as cnt, SUM(COALESCE(c.amount, 0)) as amt
      FROM consultations c
      WHERE c.organization_id = ? AND c.user_id = ? AND c.status = 'undecided'
        AND julianday('now') - julianday(c.consultation_date) >= 1
        AND NOT EXISTS (SELECT 1 FROM contact_tasks t WHERE t.consultation_id = c.id AND t.status = 'pending')
    `).bind(orgId, userId).first()
  ]);

  const tasks = tasksRes.results as any[];
  let expectedRevenue = 0;
  let overdueCount = 0;
  for (const t of tasks) {
    if (t.amount) expectedRevenue += t.amount as number;
    const days = Math.floor((Date.now() - new Date(t.recommended_date as string).getTime()) / 86400000);
    if (days >= 1) overdueCount++;
  }
  expectedRevenue += (undecidedRes?.amt as number) || 0;

  const total = tasks.length + ((undecidedRes?.cnt as number) || 0);
  const top = tasks[0] || null;
  return {
    total,
    expectedRevenue,
    overdueCount,
    topName: top ? (top.patient_name as string) : null
  };
}

function briefingNotification(b: { total: number; expectedRevenue: number; overdueCount: number; topName: string | null }) {
  const man = Math.round(b.expectedRevenue / 10000).toLocaleString();
  let body = `예상 결정 금액 ${man}만원`;
  if (b.topName) body += ` · 최우선: ${b.topName}님`;
  if (b.overdueCount > 0) body += ` · ⏰ 이월 ${b.overdueCount}건`;
  return {
    title: `☀️ 오늘 연락 ${b.total}건이 기다려요`,
    body,
    url: '/today',
    tag: 'morning-briefing'
  };
}

// ============================================
// CRON endpoint (no auth middleware — CRON_SECRET protected)
// POST /api/push/send-morning-briefings
// ============================================
push.post('/send-morning-briefings', async (c) => {
  const secret = c.req.header('X-Cron-Secret');
  if (!secret || secret !== (c.env as any).CRON_SECRET) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  const db = c.env.DB;

  // KST 기준 현재 시간 (시간대별 발송: 유저 notification_time의 '시'가 일치할 때만)
  const kstNow = new Date(Date.now() + 9 * 3600 * 1000);
  const kstHour = kstNow.getUTCHours();
  const kstDay = kstNow.getUTCDay(); // 0=일, 6=토
  const isWeekend = kstDay === 0 || kstDay === 6;
  const force = c.req.query('force') === '1'; // 테스트용: 시간/주말 필터 무시

  const subs = await db.prepare(`
    SELECT s.*, u.settings as user_settings
    FROM push_subscriptions s
    JOIN users u ON s.user_id = u.id
    WHERE s.enabled = 1 AND s.failed_count < 5
  `).all();

  let sent = 0, skipped = 0, failed = 0;
  // 유저별 브리핑 캐시 (같은 유저의 다중 기기)
  const briefingCache = new Map<string, any>();

  for (const s of subs.results as any[]) {
    try {
      // 유저 설정 존중: notification_enabled / notification_time(시 단위) / weekend_notification
      if (!force) {
        let settings: any = {};
        try { settings = JSON.parse((s.user_settings as string) || '{}'); } catch (e) {}
        if (settings.notification_enabled === false) { skipped++; continue; }
        if (isWeekend && settings.weekend_notification !== true) { skipped++; continue; }
        const prefHour = parseInt(((settings.notification_time as string) || '09:00').split(':')[0], 10);
        if (!isNaN(prefHour) && prefHour !== kstHour) { skipped++; continue; }
      }

      let b = briefingCache.get(s.user_id);
      if (!b) {
        b = await computeBriefing(db, s.organization_id, s.user_id);
        briefingCache.set(s.user_id, b);
      }
      if (!b || b.total === 0) { skipped++; continue; } // 연락할 게 없으면 방해 금지

      const result = await sendPush(c.env, s, briefingNotification(b));
      if (result.ok) {
        sent++;
        await db.prepare(`UPDATE push_subscriptions SET failed_count = 0, last_success_at = datetime('now') WHERE id = ?`).bind(s.id).run();
      } else if (result.status === 404 || result.status === 410) {
        // 구독 만료 → 삭제
        await db.prepare(`DELETE FROM push_subscriptions WHERE id = ?`).bind(s.id).run();
        failed++;
      } else {
        await db.prepare(`UPDATE push_subscriptions SET failed_count = failed_count + 1 WHERE id = ?`).bind(s.id).run();
        failed++;
      }
    } catch (e) {
      console.error('Push send error:', e);
      failed++;
    }
  }

  return c.json({ success: true, data: { total_subs: subs.results.length, sent, skipped, failed } });
});

// ============================================
// Authenticated endpoints
// ============================================
push.use('*', authMiddleware);

// GET /api/push/vapid-public-key
push.get('/vapid-public-key', (c) => {
  const key = (c.env as any).VAPID_PUBLIC_KEY || '';
  if (!key) return c.json({ success: false, error: '푸시 알림이 아직 설정되지 않았습니다.' }, 503);
  return c.json({ success: true, data: { publicKey: key } });
});

// GET /api/push/status - 현재 사용자의 구독 여부
push.get('/status', async (c) => {
  const userId = c.get('userId');
  const row = await c.env.DB.prepare(`SELECT COUNT(*) as cnt FROM push_subscriptions WHERE user_id = ? AND enabled = 1`).bind(userId).first();
  return c.json({ success: true, data: { subscribed: ((row?.cnt as number) || 0) > 0, device_count: (row?.cnt as number) || 0 } });
});

// POST /api/push/subscribe
push.post('/subscribe', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const { endpoint, keys } = await c.req.json();
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return c.json({ success: false, error: '잘못된 구독 정보입니다.' }, 400);
    }
    await c.env.DB.prepare(`
      INSERT INTO push_subscriptions (id, organization_id, user_id, endpoint, p256dh, auth, enabled, failed_count)
      VALUES (?, ?, ?, ?, ?, ?, 1, 0)
      ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, organization_id = excluded.organization_id,
        p256dh = excluded.p256dh, auth = excluded.auth, enabled = 1, failed_count = 0
    `).bind('push_' + generateId(), orgId, userId, endpoint, keys.p256dh, keys.auth).run();
    return c.json({ success: true });
  } catch (e) {
    console.error('Subscribe error:', e);
    return c.json({ success: false, error: '구독 등록에 실패했습니다.' }, 500);
  }
});

// POST /api/push/unsubscribe
push.post('/unsubscribe', async (c) => {
  try {
    const userId = c.get('userId');
    const { endpoint } = await c.req.json();
    if (endpoint) {
      await c.env.DB.prepare(`DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?`).bind(userId, endpoint).run();
    } else {
      await c.env.DB.prepare(`DELETE FROM push_subscriptions WHERE user_id = ?`).bind(userId).run();
    }
    return c.json({ success: true });
  } catch (e) {
    return c.json({ success: false, error: '구독 해제에 실패했습니다.' }, 500);
  }
});

// POST /api/push/test - 내 기기로 즉시 테스트 발송 (실제 브리핑 데이터)
push.post('/test', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;

    const subs = await db.prepare(`SELECT * FROM push_subscriptions WHERE user_id = ? AND enabled = 1`).bind(userId).all();
    if (subs.results.length === 0) {
      return c.json({ success: false, error: '등록된 기기가 없습니다. 알림을 먼저 켜주세요.' }, 400);
    }

    const b = await computeBriefing(db, orgId, userId);
    const noti = b.total > 0 ? briefingNotification(b) : {
      title: '✅ 알림 테스트 성공!',
      body: '오늘은 연락할 환자가 없어요. 매일 아침 9시에 브리핑을 보내드릴게요.',
      url: '/today',
      tag: 'test'
    };

    let sent = 0;
    for (const s of subs.results as any[]) {
      const result = await sendPush(c.env, s, noti);
      if (result.ok) sent++;
      else if (result.status === 404 || result.status === 410) {
        await db.prepare(`DELETE FROM push_subscriptions WHERE id = ?`).bind(s.id).run();
      }
    }
    return c.json({ success: true, data: { sent, devices: subs.results.length } });
  } catch (e) {
    console.error('Test push error:', e);
    return c.json({ success: false, error: '테스트 발송에 실패했습니다: ' + (e as Error).message }, 500);
  }
});

export default push;
