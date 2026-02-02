// Contact Tasks & Logs Routes
import { Hono } from 'hono';
import { generateId, safeParseJSON, daysSince } from '../lib/utils';
import { authMiddleware } from '../lib/auth';
import { generateContactMessage } from '../lib/ai';
import type { Env } from '../types';

const tasks = new Hono<{ Bindings: Env }>();

// Apply auth middleware to all routes
tasks.use('*', authMiddleware);

// GET /api/tasks/today - Get today's recommended contacts
tasks.get('/today', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;

    const today = new Date().toISOString().split('T')[0];

    // Get pending tasks for today
    const result = await db.prepare(`
      SELECT t.*, p.name as patient_name, p.phone as patient_phone,
             c.treatment_type, c.amount, c.decision_score, c.patient_psychology,
             c.summary as consultation_summary
      FROM contact_tasks t
      JOIN patients p ON t.patient_id = p.id
      LEFT JOIN consultations c ON t.consultation_id = c.id
      WHERE t.organization_id = ? AND t.user_id = ? 
        AND t.status = 'pending'
        AND t.recommended_date <= ?
      ORDER BY t.task_type = 'closing' DESC, t.recommended_date ASC
    `).bind(orgId, userId, today).all();

    const tasks = result.results.map(t => ({
      ...t,
      points: safeParseJSON(t.points as string, []),
      patient_psychology: safeParseJSON(t.patient_psychology as string, {})
    }));

    // Separate by type
    const closingTasks = tasks.filter(t => t.task_type === 'closing');
    const proactiveTasks = tasks.filter(t => t.task_type === 'proactive');

    return c.json({
      success: true,
      data: {
        closing: closingTasks,
        proactive: proactiveTasks,
        total: tasks.length
      }
    });
  } catch (error) {
    console.error('Get today tasks error:', error);
    return c.json({ success: false, error: '오늘의 연락을 불러오는데 실패했습니다.' }, 500);
  }
});

// GET /api/tasks - List all tasks
tasks.get('/', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;

    const { status, type, limit = '50', offset = '0' } = c.req.query();

    let query = `
      SELECT t.*, p.name as patient_name, p.phone as patient_phone
      FROM contact_tasks t
      JOIN patients p ON t.patient_id = p.id
      WHERE t.organization_id = ? AND t.user_id = ?
    `;
    const params: (string | number)[] = [orgId, userId];

    if (status && status !== 'all') {
      query += ` AND t.status = ?`;
      params.push(status);
    }

    if (type && type !== 'all') {
      query += ` AND t.task_type = ?`;
      params.push(type);
    }

    query += ` ORDER BY t.recommended_date DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();

    const data = result.results.map(t => ({
      ...t,
      points: safeParseJSON(t.points as string, [])
    }));

    return c.json({ success: true, data });
  } catch (error) {
    console.error('List tasks error:', error);
    return c.json({ success: false, error: '연락 목록을 불러오는데 실패했습니다.' }, 500);
  }
});

// POST /api/tasks - Create task manually
tasks.post('/', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;

    const { patient_id, consultation_id, task_type, recommended_date, recommended_message, points } = await c.req.json();

    if (!patient_id || !task_type || !recommended_date) {
      return c.json({ success: false, error: '필수 정보를 입력해주세요.' }, 400);
    }

    const taskId = 'task_' + generateId().slice(0, 8);

    await db.prepare(`
      INSERT INTO contact_tasks (
        id, organization_id, consultation_id, user_id, patient_id,
        task_type, recommended_date, recommended_message, points
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      taskId, orgId, consultation_id || null, userId, patient_id,
      task_type, recommended_date, recommended_message || null,
      JSON.stringify(points || [])
    ).run();

    return c.json({ success: true, data: { id: taskId } });
  } catch (error) {
    console.error('Create task error:', error);
    return c.json({ success: false, error: '연락 태스크 생성에 실패했습니다.' }, 500);
  }
});

// POST /api/tasks/generate - Auto-generate tasks based on consultations
tasks.post('/generate', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;

    // Find consultations that need follow-up (미결정, 2-7일 전)
    const undecidedConsults = await db.prepare(`
      SELECT c.*, p.name as patient_name
      FROM consultations c
      JOIN patients p ON c.patient_id = p.id
      WHERE c.organization_id = ? AND c.user_id = ?
        AND c.status = 'undecided'
        AND c.decision_score >= 5
        AND julianday('now') - julianday(c.consultation_date) BETWEEN 2 AND 7
        AND NOT EXISTS (
          SELECT 1 FROM contact_tasks t 
          WHERE t.consultation_id = c.id AND t.status = 'pending'
        )
    `).bind(orgId, userId).all();

    // Find completed treatments that need follow-up (완료 후 1-4주)
    const completedConsults = await db.prepare(`
      SELECT c.*, p.name as patient_name
      FROM consultations c
      JOIN patients p ON c.patient_id = p.id
      WHERE c.organization_id = ? AND c.user_id = ?
        AND c.status = 'paid'
        AND julianday('now') - julianday(c.consultation_date) BETWEEN 7 AND 30
        AND NOT EXISTS (
          SELECT 1 FROM contact_tasks t 
          WHERE t.consultation_id = c.id AND t.task_type = 'proactive' AND t.status = 'pending'
        )
    `).bind(orgId, userId).all();

    const apiKey = c.env.OPENAI_API_KEY;
    const generatedTasks: string[] = [];
    const today = new Date().toISOString().split('T')[0];

    // Generate closing tasks
    for (const consult of undecidedConsults.results) {
      const taskId = 'task_' + generateId().slice(0, 8);
      let message = '';
      let points: string[] = [];

      if (apiKey) {
        try {
          const result = await generateContactMessage(
            consult.patient_name as string,
            consult.summary as string || '',
            'closing',
            safeParseJSON(consult.patient_psychology as string, {}),
            apiKey
          );
          message = result.message;
          points = result.points;
        } catch (e) {
          console.error('Failed to generate message:', e);
        }
      }

      await db.prepare(`
        INSERT INTO contact_tasks (
          id, organization_id, consultation_id, user_id, patient_id,
          task_type, recommended_date, recommended_message, points
        ) VALUES (?, ?, ?, ?, ?, 'closing', ?, ?, ?)
      `).bind(
        taskId, orgId, consult.id, userId, consult.patient_id,
        today, message, JSON.stringify(points)
      ).run();

      generatedTasks.push(taskId);
    }

    // Generate proactive tasks
    for (const consult of completedConsults.results) {
      const taskId = 'task_' + generateId().slice(0, 8);
      let message = `안녕하세요 ${consult.patient_name}님, 치료 후 불편하신 점은 없으신지 확인차 연락드렸어요.`;
      const points = ['불편한 점 체크', '다음 내원일 확인'];

      await db.prepare(`
        INSERT INTO contact_tasks (
          id, organization_id, consultation_id, user_id, patient_id,
          task_type, recommended_date, recommended_message, points
        ) VALUES (?, ?, ?, ?, ?, 'proactive', ?, ?, ?)
      `).bind(
        taskId, orgId, consult.id, userId, consult.patient_id,
        today, message, JSON.stringify(points)
      ).run();

      generatedTasks.push(taskId);
    }

    return c.json({
      success: true,
      data: {
        generated: generatedTasks.length,
        closing: undecidedConsults.results.length,
        proactive: completedConsults.results.length
      }
    });
  } catch (error) {
    console.error('Generate tasks error:', error);
    return c.json({ success: false, error: '연락 태스크 생성에 실패했습니다.' }, 500);
  }
});

// PUT /api/tasks/:id/complete - Complete a task
tasks.put('/:id/complete', async (c) => {
  try {
    const taskId = c.req.param('id');
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;

    const { contact_type, contact_result, outcome, content } = await c.req.json();

    // Get task info
    const task = await db.prepare(
      'SELECT * FROM contact_tasks WHERE id = ? AND organization_id = ?'
    ).bind(taskId, orgId).first();

    if (!task) {
      return c.json({ success: false, error: '연락 태스크를 찾을 수 없습니다.' }, 404);
    }

    // Update task
    await db.prepare(`
      UPDATE contact_tasks SET
        status = 'completed',
        completed_at = datetime('now'),
        result = ?,
        result_note = ?
      WHERE id = ?
    `).bind(outcome, content, taskId).run();

    // Create contact log
    const logId = 'log_' + generateId().slice(0, 8);
    await db.prepare(`
      INSERT INTO contact_logs (
        id, organization_id, patient_id, user_id, task_id,
        contact_type, contact_result, outcome, content
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      logId, orgId, task.patient_id, userId, taskId,
      contact_type || 'call', contact_result || 'success', outcome, content
    ).run();

    // If booked, update consultation status
    if (outcome === 'booked' && task.consultation_id) {
      await db.prepare(
        'UPDATE consultations SET status = ? WHERE id = ?'
      ).bind('paid', task.consultation_id).run();
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Complete task error:', error);
    return c.json({ success: false, error: '연락 완료 처리에 실패했습니다.' }, 500);
  }
});

// PUT /api/tasks/:id/skip - Skip a task
tasks.put('/:id/skip', async (c) => {
  try {
    const taskId = c.req.param('id');
    const orgId = c.get('organizationId');
    const db = c.env.DB;

    const { reason } = await c.req.json();

    await db.prepare(`
      UPDATE contact_tasks SET
        status = 'skipped',
        result_note = ?
      WHERE id = ? AND organization_id = ?
    `).bind(reason || null, taskId, orgId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Skip task error:', error);
    return c.json({ success: false, error: '연락 스킵 처리에 실패했습니다.' }, 500);
  }
});

// POST /api/tasks/logs - Create contact log without task
tasks.post('/logs', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;

    const { patient_id, contact_type, contact_result, outcome, content } = await c.req.json();

    if (!patient_id || !contact_type) {
      return c.json({ success: false, error: '필수 정보를 입력해주세요.' }, 400);
    }

    const logId = 'log_' + generateId().slice(0, 8);

    await db.prepare(`
      INSERT INTO contact_logs (
        id, organization_id, patient_id, user_id,
        contact_type, contact_result, outcome, content
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      logId, orgId, patient_id, userId,
      contact_type, contact_result || null, outcome || null, content || null
    ).run();

    return c.json({ success: true, data: { id: logId } });
  } catch (error) {
    console.error('Create log error:', error);
    return c.json({ success: false, error: '연락 기록 생성에 실패했습니다.' }, 500);
  }
});

// GET /api/tasks/logs - Get contact logs
tasks.get('/logs', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const db = c.env.DB;

    const { patient_id, limit = '50', offset = '0' } = c.req.query();

    let query = `
      SELECT cl.*, p.name as patient_name, u.name as user_name
      FROM contact_logs cl
      JOIN patients p ON cl.patient_id = p.id
      JOIN users u ON cl.user_id = u.id
      WHERE cl.organization_id = ?
    `;
    const params: (string | number)[] = [orgId];

    if (patient_id) {
      query += ` AND cl.patient_id = ?`;
      params.push(patient_id);
    }

    query += ` ORDER BY cl.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();

    return c.json({ success: true, data: result.results });
  } catch (error) {
    console.error('Get logs error:', error);
    return c.json({ success: false, error: '연락 기록을 불러오는데 실패했습니다.' }, 500);
  }
});

export default tasks;
