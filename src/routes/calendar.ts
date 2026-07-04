// Calendar Routes — 상담/태스크/예약/리콜 통합 캘린더
import { Hono } from 'hono';
import { authMiddleware } from '../lib/auth';
import type { AppEnv } from '../types';

const calendar = new Hono<AppEnv>();

calendar.use('*', authMiddleware);

// 유효한 YYYY-MM-DD 검증
function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s).getTime());
}

// ============================================
// GET /api/calendar/month?year=2026&month=7&my_only=true
// 월별 일자별 이벤트 카운트 (달력 도트/뱃지용)
// ============================================
calendar.get('/month', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;

    const now = new Date();
    const year = parseInt(c.req.query('year') || '') || now.getFullYear();
    const month = parseInt(c.req.query('month') || '') || (now.getMonth() + 1);
    const myOnly = c.req.query('my_only') === 'true';

    if (year < 2020 || year > 2100 || month < 1 || month > 12) {
      return c.json({ error: '유효하지 않은 연/월입니다.' }, 400);
    }

    const mm = String(month).padStart(2, '0');
    const from = `${year}-${mm}-01`;
    // 다음달 1일 (미만 비교)
    const nextY = month === 12 ? year + 1 : year;
    const nextM = month === 12 ? 1 : month + 1;
    const to = `${nextY}-${String(nextM).padStart(2, '0')}-01`;

    const userFilter = myOnly ? ' AND user_id = ?' : '';

    // 1) 상담 기록 (consultation_date)
    const consultQuery = `
      SELECT date(consultation_date) as d,
        COUNT(*) as cnt,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_cnt,
        SUM(CASE WHEN status = 'paid' THEN COALESCE(amount,0) ELSE 0 END) as paid_amount
      FROM consultations
      WHERE organization_id = ?${userFilter}
        AND date(consultation_date) >= ? AND date(consultation_date) < ?
      GROUP BY date(consultation_date)
    `;
    const consultParams: (string | number)[] = myOnly ? [orgId, userId, from, to] : [orgId, from, to];

    // 2) 연락 태스크 (recommended_date, pending만 액션 필요)
    const taskQuery = `
      SELECT date(recommended_date) as d,
        COUNT(*) as cnt,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_cnt
      FROM contact_tasks
      WHERE organization_id = ?${userFilter}
        AND date(recommended_date) >= ? AND date(recommended_date) < ?
      GROUP BY date(recommended_date)
    `;

    // 3) 치료 예약 (patient_treatments.next_appointment) — 병원 공유
    const apptQuery = `
      SELECT date(next_appointment) as d, COUNT(*) as cnt
      FROM patient_treatments
      WHERE organization_id = ? AND next_appointment IS NOT NULL
        AND date(next_appointment) >= ? AND date(next_appointment) < ?
        AND status NOT IN ('completed', 'abandoned')
      GROUP BY date(next_appointment)
    `;

    // 4) 리텐션 다음 연락 예정 (retention_contacts.next_contact_date) — 병원 공유
    const retentionQuery = `
      SELECT date(next_contact_date) as d, COUNT(*) as cnt
      FROM retention_contacts
      WHERE organization_id = ? AND next_contact_date IS NOT NULL
        AND date(next_contact_date) >= ? AND date(next_contact_date) < ?
      GROUP BY date(next_contact_date)
    `;

    const [consults, tasksRes, appts, retention] = await Promise.all([
      db.prepare(consultQuery).bind(...consultParams).all(),
      db.prepare(taskQuery).bind(...consultParams).all(),
      db.prepare(apptQuery).bind(orgId, from, to).all(),
      db.prepare(retentionQuery).bind(orgId, from, to).all(),
    ]);

    // 일자별 병합
    const days: Record<string, {
      consultations: number; paid: number; paid_amount: number;
      tasks: number; tasks_pending: number;
      appointments: number; retention_contacts: number; total: number;
    }> = {};
    const ensure = (d: string) => {
      if (!days[d]) days[d] = { consultations: 0, paid: 0, paid_amount: 0, tasks: 0, tasks_pending: 0, appointments: 0, retention_contacts: 0, total: 0 };
      return days[d];
    };

    for (const r of (consults.results || []) as any[]) {
      const o = ensure(r.d); o.consultations = r.cnt; o.paid = r.paid_cnt || 0; o.paid_amount = r.paid_amount || 0;
    }
    for (const r of (tasksRes.results || []) as any[]) {
      const o = ensure(r.d); o.tasks = r.cnt; o.tasks_pending = r.pending_cnt || 0;
    }
    for (const r of (appts.results || []) as any[]) {
      const o = ensure(r.d); o.appointments = r.cnt;
    }
    for (const r of (retention.results || []) as any[]) {
      const o = ensure(r.d); o.retention_contacts = r.cnt;
    }
    for (const d of Object.keys(days)) {
      const o = days[d];
      o.total = o.consultations + o.tasks + o.appointments + o.retention_contacts;
    }

    // 월 합계
    const summary = Object.values(days).reduce((acc, o) => {
      acc.consultations += o.consultations;
      acc.paid += o.paid;
      acc.paid_amount += o.paid_amount;
      acc.tasks += o.tasks;
      acc.tasks_pending += o.tasks_pending;
      acc.appointments += o.appointments;
      acc.retention_contacts += o.retention_contacts;
      return acc;
    }, { consultations: 0, paid: 0, paid_amount: 0, tasks: 0, tasks_pending: 0, appointments: 0, retention_contacts: 0 });

    return c.json({ year, month, days, summary });
  } catch (error) {
    console.error('Calendar month error:', error);
    return c.json({ error: '캘린더 조회에 실패했습니다.' }, 500);
  }
});

// ============================================
// GET /api/calendar/day?date=2026-07-04&my_only=true
// 특정 일자의 상세 이벤트 목록
// ============================================
calendar.get('/day', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;

    const date = c.req.query('date') || '';
    const myOnly = c.req.query('my_only') === 'true';
    if (!isValidDate(date)) {
      return c.json({ error: '유효하지 않은 날짜입니다. (YYYY-MM-DD)' }, 400);
    }

    const userFilter = myOnly ? ' AND c.user_id = ?' : '';
    const consultParams: (string | number)[] = myOnly ? [orgId, userId, date] : [orgId, date];

    // 1) 상담 기록
    const consultQuery = `
      SELECT c.id, c.consultation_date, c.treatment_type, c.amount, c.status,
        c.decision_score, c.ai_analysis_status,
        p.id as patient_id, p.name as patient_name, u.name as user_name
      FROM consultations c
      LEFT JOIN patients p ON c.patient_id = p.id
      JOIN users u ON c.user_id = u.id
      WHERE c.organization_id = ?${userFilter} AND date(c.consultation_date) = ?
      ORDER BY c.consultation_date ASC
    `;

    // 2) 연락 태스크
    const taskFilter = myOnly ? ' AND t.user_id = ?' : '';
    const taskQuery = `
      SELECT t.id, t.task_type, t.recommended_date, t.status, t.result,
        t.recommended_message,
        p.id as patient_id, p.name as patient_name, p.phone as patient_phone,
        c.treatment_type, c.amount
      FROM contact_tasks t
      LEFT JOIN patients p ON t.patient_id = p.id
      LEFT JOIN consultations c ON t.consultation_id = c.id
      WHERE t.organization_id = ?${taskFilter} AND date(t.recommended_date) = ?
      ORDER BY t.status ASC, t.recommended_date ASC
    `;

    // 3) 치료 예약
    const apptQuery = `
      SELECT tr.id, tr.treatment_type, tr.treatment_name, tr.status,
        tr.next_appointment, tr.total_amount, tr.remaining_amount,
        p.id as patient_id, p.name as patient_name, p.phone as patient_phone
      FROM patient_treatments tr
      LEFT JOIN patients p ON tr.patient_id = p.id
      WHERE tr.organization_id = ? AND date(tr.next_appointment) = ?
        AND tr.status NOT IN ('completed', 'abandoned')
      ORDER BY tr.next_appointment ASC
    `;

    // 4) 리텐션 다음 연락 예정
    const retentionQuery = `
      SELECT rc.id, rc.contact_type, rc.result as last_result, rc.notes,
        rc.next_contact_date,
        p.id as patient_id, p.name as patient_name, p.phone as patient_phone,
        u.name as staff_name
      FROM retention_contacts rc
      LEFT JOIN patients p ON rc.patient_id = p.id
      LEFT JOIN users u ON rc.staff_id = u.id
      WHERE rc.organization_id = ? AND date(rc.next_contact_date) = ?
      ORDER BY rc.next_contact_date ASC
    `;

    const [consults, tasksRes, appts, retention] = await Promise.all([
      db.prepare(consultQuery).bind(...consultParams).all(),
      db.prepare(taskQuery).bind(...consultParams).all(),
      db.prepare(apptQuery).bind(orgId, date).all(),
      db.prepare(retentionQuery).bind(orgId, date).all(),
    ]);

    return c.json({
      date,
      consultations: consults.results || [],
      tasks: tasksRes.results || [],
      appointments: appts.results || [],
      retention_contacts: retention.results || [],
    });
  } catch (error) {
    console.error('Calendar day error:', error);
    return c.json({ error: '일별 일정 조회에 실패했습니다.' }, 500);
  }
});

export default calendar;
