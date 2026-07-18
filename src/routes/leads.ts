// v8.7: 도입 문의(리드) API — /welcome 랜딩페이지
import { Hono } from 'hono'
import { authMiddleware } from '../lib/auth'
import { rateLimit } from '../lib/middleware'

type Bindings = { DB: D1Database }
const leads = new Hono<{ Bindings: Bindings }>()

// 파운더 50 카운터 (공개) — 랜딩페이지 잔여 슬롯 표시
leads.get('/founder-count', async (c) => {
  try {
    const row = await c.env.DB.prepare(
      `SELECT COUNT(*) as cnt FROM leads WHERE status != 'lost'`
    ).first<{ cnt: number }>()
    const taken = Math.min(row?.cnt || 0, 50)
    return c.json({ success: true, data: { total: 50, taken, remaining: 50 - taken } })
  } catch (e) {
    return c.json({ success: true, data: { total: 50, taken: 0, remaining: 50 } })
  }
})

// 도입 문의 접수 (공개, 인증 불필요)
leads.post('/', rateLimit(5, 60000), async (c) => {
  try {
    const body = await c.req.json()

    // v8.7.1 honeypot: hidden field bots fill in — silently accept and drop
    if (body.website) {
      return c.json({ success: true, data: { id: 'lead_ok' } })
    }

    const clinicName = String(body.clinic_name || '').trim()
    const contactName = String(body.contact_name || '').trim()
    const phone = String(body.phone || '').trim()
    const email = String(body.email || '').trim()
    const planInterest = ['starter', 'growth', 'enterprise'].includes(body.plan_interest) ? body.plan_interest : 'growth'
    const monthlyConsultations = String(body.monthly_consultations || '').slice(0, 20)
    const message = String(body.message || '').slice(0, 1000)
    const source = String(body.source || 'landing').slice(0, 30)

    if (!clinicName || clinicName.length < 2) return c.json({ success: false, error: '병원명을 입력해주세요.' }, 400)
    if (!contactName || contactName.length < 2) return c.json({ success: false, error: '담당자 성함을 입력해주세요.' }, 400)
    if (!/^[\d\-+() ]{9,20}$/.test(phone)) return c.json({ success: false, error: '올바른 연락처를 입력해주세요.' }, 400)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return c.json({ success: false, error: '올바른 이메일을 입력해주세요.' }, 400)

    // 24시간 내 동일 전화번호 중복 접수 방지
    const dup = await c.env.DB.prepare(
      `SELECT id FROM leads WHERE phone = ? AND created_at > datetime('now', '-1 day')`
    ).bind(phone).first()
    if (dup) return c.json({ success: false, error: '이미 접수된 문의입니다. 곧 연락드리겠습니다!' }, 409)

    // IP당 일일 접수 캐핑 (다른 전화번호로 대량 등록 방지)
    const clientIp = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
    const ipCount = await c.env.DB.prepare(
      `SELECT COUNT(*) as cnt FROM leads WHERE source LIKE ? AND created_at > datetime('now', '-1 day')`
    ).bind(`%|${clientIp}`).first<{ cnt: number }>()
    if ((ipCount?.cnt || 0) >= 10) {
      return c.json({ success: false, error: '접수 한도를 초과했습니다. 내일 다시 시도해주세요.' }, 429)
    }

    const id = 'lead_' + crypto.randomUUID().slice(0, 8)
    await c.env.DB.prepare(`
      INSERT INTO leads (id, clinic_name, contact_name, phone, email, plan_interest, monthly_consultations, message, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, clinicName, contactName, phone, email || null, planInterest, monthlyConsultations || null, message || null, `${source}|${clientIp}`.slice(0, 80)).run()

    return c.json({ success: true, data: { id } })
  } catch (e) {
    console.error('Lead create error:', e)
    return c.json({ success: false, error: '접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }, 500)
  }
})

// ===== 이하 플랫폼 운영자 전용 =====
// v9.2: 리드(도입 문의)는 Patient Touch 플랫폼의 영업 데이터 —
// 임의 병원의 admin이 아니라 플랫폼 운영 조직(PLATFORM_ORG_ID)의 admin만 접근 가능
leads.use('*', authMiddleware)

const DEFAULT_PLATFORM_ORG = 'org_bd_dental'
async function platformAdminOnly(c: any, next: any) {
  const auth = c.get('auth')
  const platformOrg = (c.env as any).PLATFORM_ORG_ID || DEFAULT_PLATFORM_ORG
  if (auth?.role !== 'admin' || auth?.organization_id !== platformOrg) {
    return c.json({ success: false, error: '관리자 권한이 필요합니다.' }, 403)
  }
  await next()
}

// 리드 목록 조회 (플랫폼 운영자)
leads.get('/', platformAdminOnly, async (c) => {
  const status = c.req.query('status')
  const limit = Math.min(parseInt(c.req.query('limit') || '100', 10), 200)
  let sql = `SELECT * FROM leads`
  const binds: any[] = []
  if (status) { sql += ` WHERE status = ?`; binds.push(status) }
  sql += ` ORDER BY created_at DESC LIMIT ?`
  binds.push(limit)
  const rows = await c.env.DB.prepare(sql).bind(...binds).all()
  return c.json({ success: true, data: rows.results })
})

// 리드 상태 변경 (플랫폼 운영자)
leads.put('/:id/status', platformAdminOnly, async (c) => {
  const id = c.req.param('id')
  const { status } = await c.req.json()
  if (!['new', 'contacted', 'demo', 'won', 'lost'].includes(status)) {
    return c.json({ success: false, error: '잘못된 상태값입니다.' }, 400)
  }
  await c.env.DB.prepare(
    `UPDATE leads SET status = ?, updated_at = datetime('now') WHERE id = ?`
  ).bind(status, id).run()
  return c.json({ success: true })
})

export default leads
