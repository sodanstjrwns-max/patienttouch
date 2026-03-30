// Staff Schedule Routes - 진료보드 근무 스케줄 관리
import { Hono } from 'hono';
import { generateId } from '../lib/utils';
import { authMiddleware } from '../lib/auth';
import { sanitize } from '../lib/middleware';
import type { Env } from '../types';

const staffSchedule = new Hono<{ Bindings: Env }>();
staffSchedule.use('*', authMiddleware);

// ============================================
// GET /api/staff-schedule/today - 오늘 근무자 목록
// ============================================
staffSchedule.get('/today', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const db = c.env.DB;
    const today = new Date().toISOString().split('T')[0];
    const dateParam = c.req.query('date') || today;

    // 오늘 스케줄 조회 (원장 + 직원 모두)
    const schedules = await db.prepare(`
      SELECT s.*, u.name as linked_user_name, u.email as linked_user_email
      FROM staff_schedules s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.organization_id = ? AND s.date = ?
      ORDER BY 
        CASE s.staff_role 
          WHEN 'doctor' THEN 1 
          WHEN 'coordinator' THEN 2
          WHEN 'hygienist' THEN 3
          WHEN 'staff' THEN 4
          WHEN 'part_time' THEN 5
        END,
        s.created_at ASC
    `).bind(orgId, dateParam).all();

    // 등록된 사용자 목록 (스케줄에 추가할 수 있는 후보)
    const users = await db.prepare(`
      SELECT id, name, email, role FROM users 
      WHERE organization_id = ? 
      ORDER BY role DESC, name ASC
    `).bind(orgId).all();

    // 오늘 상담 현황 요약
    const consultationSummary = await db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid,
        COUNT(CASE WHEN status = 'undecided' THEN 1 END) as undecided,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
      FROM consultations 
      WHERE organization_id = ? AND date(consultation_date) = ?
    `).bind(orgId, dateParam).first();

    // 원장별 배정 환자 수 (오늘 상담 기준)
    const doctorPatients = await db.prepare(`
      SELECT u.id as user_id, u.name, COUNT(c.id) as patient_count
      FROM users u
      LEFT JOIN consultations c ON c.user_id = u.id AND date(c.consultation_date) = ?
      WHERE u.organization_id = ?
      GROUP BY u.id
    `).bind(dateParam, orgId).all();

    return c.json({
      success: true,
      data: {
        date: dateParam,
        schedules: schedules.results,
        users: users.results,
        consultation_summary: consultationSummary,
        doctor_patients: doctorPatients.results,
        doctors: schedules.results.filter((s: any) => s.staff_role === 'doctor'),
        staff: schedules.results.filter((s: any) => s.staff_role !== 'doctor'),
      }
    });
  } catch (error) {
    console.error('Staff schedule error:', error);
    return c.json({ success: false, error: '근무 스케줄을 불러오는데 실패했습니다.' }, 500);
  }
});

// ============================================
// POST /api/staff-schedule - 근무자 추가
// ============================================
staffSchedule.post('/', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;
    const body = await c.req.json();

    const {
      staff_name,
      staff_role = 'staff',
      user_id = null,
      date,
      start_time,
      end_time,
      memo,
      status = 'scheduled'
    } = body;

    if (!staff_name || !date) {
      return c.json({ success: false, error: '이름과 날짜는 필수입니다.' }, 400);
    }

    // 중복 체크 (같은 날 같은 이름)
    const existing = await db.prepare(`
      SELECT id FROM staff_schedules 
      WHERE organization_id = ? AND date = ? AND staff_name = ?
    `).bind(orgId, date, sanitize(staff_name)).first();

    if (existing) {
      return c.json({ success: false, error: '이미 등록된 근무자입니다.' }, 409);
    }

    const id = 'sched_' + generateId().slice(0, 8);

    await db.prepare(`
      INSERT INTO staff_schedules (id, organization_id, date, staff_name, staff_role, user_id, status, start_time, end_time, memo, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, orgId, date, sanitize(staff_name), staff_role,
      user_id, status,
      start_time || null, end_time || null,
      memo ? sanitize(memo) : null,
      userId
    ).run();

    return c.json({ success: true, data: { id, staff_name, staff_role, date } });
  } catch (error) {
    console.error('Add staff schedule error:', error);
    return c.json({ success: false, error: '근무자 추가에 실패했습니다.' }, 500);
  }
});

// ============================================
// PUT /api/staff-schedule/:id - 근무 상태 변경
// ============================================
staffSchedule.put('/:id', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const scheduleId = c.req.param('id');
    const db = c.env.DB;
    const body = await c.req.json();

    const updates: string[] = [];
    const values: any[] = [];

    if (body.status) { updates.push('status = ?'); values.push(body.status); }
    if (body.start_time !== undefined) { updates.push('start_time = ?'); values.push(body.start_time); }
    if (body.end_time !== undefined) { updates.push('end_time = ?'); values.push(body.end_time); }
    if (body.memo !== undefined) { updates.push('memo = ?'); values.push(body.memo ? sanitize(body.memo) : null); }
    if (body.assigned_patients !== undefined) { updates.push('assigned_patients = ?'); values.push(body.assigned_patients); }

    updates.push("updated_at = datetime('now')");

    await db.prepare(`
      UPDATE staff_schedules SET ${updates.join(', ')} 
      WHERE id = ? AND organization_id = ?
    `).bind(...values, scheduleId, orgId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Update staff schedule error:', error);
    return c.json({ success: false, error: '근무 상태 변경에 실패했습니다.' }, 500);
  }
});

// ============================================
// DELETE /api/staff-schedule/:id - 근무자 삭제
// ============================================
staffSchedule.delete('/:id', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const scheduleId = c.req.param('id');
    const db = c.env.DB;

    await db.prepare(`
      DELETE FROM staff_schedules WHERE id = ? AND organization_id = ?
    `).bind(scheduleId, orgId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete staff schedule error:', error);
    return c.json({ success: false, error: '근무자 삭제에 실패했습니다.' }, 500);
  }
});

// ============================================
// POST /api/staff-schedule/bulk - 일괄 등록 (다음 날 스케줄 복사 등)
// ============================================
staffSchedule.post('/bulk', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;
    const { source_date, target_date } = await c.req.json();

    if (!source_date || !target_date) {
      return c.json({ success: false, error: '원본 날짜와 대상 날짜가 필요합니다.' }, 400);
    }

    // 원본 날짜 스케줄 가져오기
    const sources = await db.prepare(`
      SELECT staff_name, staff_role, user_id, start_time, end_time, memo
      FROM staff_schedules WHERE organization_id = ? AND date = ?
    `).bind(orgId, source_date).all();

    if (!sources.results.length) {
      return c.json({ success: false, error: '원본 날짜에 등록된 근무자가 없습니다.' }, 404);
    }

    // 대상 날짜에 이미 있는지 확인
    const existingTarget = await db.prepare(`
      SELECT COUNT(*) as cnt FROM staff_schedules WHERE organization_id = ? AND date = ?
    `).bind(orgId, target_date).first<{cnt: number}>();

    if ((existingTarget?.cnt || 0) > 0) {
      return c.json({ success: false, error: '대상 날짜에 이미 스케줄이 있습니다.' }, 409);
    }

    // 일괄 복사
    for (const s of sources.results) {
      const id = 'sched_' + generateId().slice(0, 8);
      await db.prepare(`
        INSERT INTO staff_schedules (id, organization_id, date, staff_name, staff_role, user_id, status, start_time, end_time, memo, created_by)
        VALUES (?, ?, ?, ?, ?, ?, 'scheduled', ?, ?, ?, ?)
      `).bind(
        id, orgId, target_date,
        s.staff_name, s.staff_role, s.user_id,
        s.start_time, s.end_time, s.memo, userId
      ).run();
    }

    return c.json({ success: true, data: { copied: sources.results.length, target_date } });
  } catch (error) {
    console.error('Bulk schedule error:', error);
    return c.json({ success: false, error: '스케줄 복사에 실패했습니다.' }, 500);
  }
});

export default staffSchedule;
