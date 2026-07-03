// Contact Tasks & Logs Routes (v2 - Smart CRM Engine)
import { Hono } from 'hono';
import { generateId, safeParseJSON, daysSince } from '../lib/utils';
import { authMiddleware } from '../lib/auth';
import { generateContactMessage } from '../lib/ai';
import type { AppEnv, Env } from '../types';

const tasks = new Hono<AppEnv>();

// Apply auth middleware to all routes
tasks.use('*', authMiddleware);

// ============================================
// SMART PRIORITY SCORING ENGINE
// ============================================
function calculatePriorityScore(params: {
  amount?: number;
  decision_score?: number;
  days_elapsed: number;
  treatment_type?: string;
  contact_attempts?: number;
  source?: string;
}): { score: number; urgency: 'critical' | 'high' | 'medium'; factors: string[] } {
  let score = 0;
  const factors: string[] = [];

  // 1. Amount weight (0-30 points): Higher value = higher priority
  const amt = params.amount || 0;
  if (amt >= 10000000) { score += 30; factors.push('고액(1천만+)'); }
  else if (amt >= 5000000) { score += 25; factors.push('고액(5백만+)'); }
  else if (amt >= 3000000) { score += 20; factors.push('중액(3백만+)'); }
  else if (amt >= 1000000) { score += 15; factors.push('일반(1백만+)'); }
  else if (amt > 0) { score += 8; }

  // 2. Decision score weight (0-25 points): Higher decision likelihood = higher priority
  const ds = params.decision_score || 5;
  if (ds >= 8) { score += 25; factors.push('결정 근접(8+)'); }
  else if (ds >= 6) { score += 20; factors.push('관심 높음(6+)'); }
  else if (ds >= 4) { score += 12; }
  else { score += 5; }

  // 3. Time decay (0-25 points): 2-4일 최적, 5일+ 긴급, 1일 이하 대기
  const days = params.days_elapsed;
  if (days >= 7) { score += 25; factors.push('7일+ 경과(이탈 위험)'); }
  else if (days >= 5) { score += 22; factors.push('5일+ 경과(긴급)'); }
  else if (days >= 3) { score += 18; factors.push('3일 경과(적기)'); }
  else if (days >= 2) { score += 15; factors.push('2일 경과(골든타임)'); }
  else if (days >= 1) { score += 10; }
  else { score += 3; }

  // 4. Treatment type bonus (0-10 points)
  const highValueTreatments = ['임플란트', '교정', '라미네이트', '올세라믹', '전체틀니', '올온4', '올온6'];
  if (params.treatment_type && highValueTreatments.some(t => (params.treatment_type || '').includes(t))) {
    score += 10; factors.push('고부가 치료');
  }

  // 5. Contact attempt penalty (-5 per attempt after 2nd)
  const attempts = params.contact_attempts || 0;
  if (attempts >= 3) { score -= 10; factors.push('3회+ 시도'); }
  else if (attempts >= 2) { score -= 5; }

  // Determine urgency
  const urgency: 'critical' | 'high' | 'medium' = score >= 65 ? 'critical' : score >= 40 ? 'high' : 'medium';

  return { score: Math.max(0, Math.min(100, score)), urgency, factors };
}

// GET /api/tasks/today - Get today's recommended contacts (ENHANCED with smart scoring)
tasks.get('/today', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;

    const today = new Date().toISOString().split('T')[0];

    // Get pending tasks with contact attempt counts
    const result = await db.prepare(`
      SELECT t.*, p.name as patient_name, p.phone as patient_phone,
             c.treatment_type, c.amount, c.decision_score, c.patient_psychology,
             c.summary as consultation_summary, c.consultation_date,
             (SELECT COUNT(*) FROM contact_logs cl WHERE cl.patient_id = t.patient_id AND cl.organization_id = t.organization_id) as contact_attempts
      FROM contact_tasks t
      JOIN patients p ON t.patient_id = p.id
      LEFT JOIN consultations c ON t.consultation_id = c.id
      WHERE t.organization_id = ? AND t.user_id = ? 
        AND t.status = 'pending'
        AND t.recommended_date <= ?
      ORDER BY t.recommended_date ASC
    `).bind(orgId, userId, today).all();

    const scoredTasks = result.results.map((t: Record<string, unknown>) => {
      const daysElapsed = t.consultation_date 
        ? Math.floor((Date.now() - new Date(t.consultation_date as string).getTime()) / 86400000)
        : Math.floor((Date.now() - new Date(t.recommended_date as string).getTime()) / 86400000);

      const priority = calculatePriorityScore({
        amount: t.amount as number,
        decision_score: t.decision_score as number,
        days_elapsed: daysElapsed,
        treatment_type: t.treatment_type as string,
        contact_attempts: t.contact_attempts as number,
      });

      return {
        ...(t as Record<string, unknown>),
        points: safeParseJSON(t.points as string, []),
        patient_psychology: safeParseJSON(t.patient_psychology as string, {}),
        priority_score: priority.score,
        urgency: priority.urgency,
        priority_factors: priority.factors,
        days_elapsed: daysElapsed,
      } as Record<string, any> & { priority_score: number; task_type?: string };
    });

    // Sort by priority score descending
    scoredTasks.sort((a, b) => b.priority_score - a.priority_score);

    // Separate by type
    const closingTasks = scoredTasks.filter(t => t.task_type === 'closing');
    const proactiveTasks = scoredTasks.filter(t => t.task_type === 'proactive');

    return c.json({
      success: true,
      data: {
        closing: closingTasks,
        proactive: proactiveTasks,
        total: scoredTasks.length,
        critical_count: scoredTasks.filter(t => t.urgency === 'critical').length,
        high_count: scoredTasks.filter(t => t.urgency === 'high').length,
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

    const { status, type, consultation_id, limit = '50', offset = '0' } = c.req.query();

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

    // v8.2: 리포트 페이지에서 상담별 팔로업 태스크 상태 확인용
    if (consultation_id) {
      query += ` AND t.consultation_id = ?`;
      params.push(consultation_id);
    }

    query += ` ORDER BY t.recommended_date DESC LIMIT ? OFFSET ?`;
    params.push(Math.min(parseInt(limit) || 50, 200), Math.max(parseInt(offset) || 0, 0));

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

    // 환자 소유권 검증 — 타 조직 환자 ID 유입 차단
    const owned = await db.prepare('SELECT id FROM patients WHERE id = ? AND organization_id = ?')
      .bind(patient_id, orgId).first();
    if (!owned) return c.json({ success: false, error: '환자를 찾을 수 없습니다.' }, 404);

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

    // Find consultations that need follow-up (미결정, 1-14일 전, decision_score >= 3)
    const undecidedConsults = await db.prepare(`
      SELECT c.*, p.name as patient_name, c.decision_score, c.amount, c.treatment_type,
             CAST(julianday('now') - julianday(c.consultation_date) AS INTEGER) as days_passed
      FROM consultations c
      JOIN patients p ON c.patient_id = p.id
      WHERE c.organization_id = ? AND c.user_id = ?
        AND c.status = 'undecided'
        AND c.decision_score >= 3
        AND julianday('now') - julianday(c.consultation_date) BETWEEN 1 AND 14
        AND NOT EXISTS (
          SELECT 1 FROM contact_tasks t 
          WHERE t.consultation_id = c.id AND t.status = 'pending'
        )
    `).bind(orgId, userId).all();

    // Find completed treatments that need follow-up (완료 후 3-30일)
    const completedConsults = await db.prepare(`
      SELECT c.*, p.name as patient_name
      FROM consultations c
      JOIN patients p ON c.patient_id = p.id
      WHERE c.organization_id = ? AND c.user_id = ?
        AND c.status = 'paid'
        AND julianday('now') - julianday(c.consultation_date) BETWEEN 3 AND 30
        AND NOT EXISTS (
          SELECT 1 FROM contact_tasks t 
          WHERE t.consultation_id = c.id AND t.task_type = 'proactive' AND t.status = 'pending'
        )
    `).bind(orgId, userId).all();

    const apiKey = c.env.OPENAI_API_KEY;
    const generatedTasks: string[] = [];
    const today = new Date().toISOString().split('T')[0];

    // Generate closing tasks with smart priority
    for (const consult of undecidedConsults.results) {
      const taskId = 'task_' + generateId().slice(0, 8);
      let message = '';
      let points: string[] = [];

      // Smart scheduling: high decision_score → sooner, low → later
      const ds = (consult.decision_score as number) || 5;
      const dayOffset = ds >= 7 ? 0 : ds >= 5 ? 1 : 2; // 결정도 높으면 즉시, 낮으면 2일 후
      const taskDate = new Date();
      taskDate.setDate(taskDate.getDate() + dayOffset);
      const taskDateStr = taskDate.toISOString().split('T')[0];

      if (apiKey) {
        try {
          const result = await generateContactMessage(
            consult.patient_name as string,
            consult.summary as string || '',
            'closing',
            safeParseJSON(consult.patient_psychology as string, {}),
            apiKey,
            c.env as any
          );
          message = result.message;
          points = result.points;
        } catch (e) {
          console.error('Failed to generate message:', e);
          message = `${consult.patient_name}님, 지난번 상담 후 고민은 정리되셨나요? 궁금하신 점 있으시면 말씀해주세요.`;
          points = ['상담 후 고민 확인', '추가 질문 응대', '부드러운 결정 유도'];
        }
      } else {
        message = `${consult.patient_name}님, 지난번 상담 후 고민은 정리되셨나요? 궁금하신 점 있으시면 말씀해주세요.`;
        points = ['상담 후 고민 확인', '추가 질문 응대', '부드러운 결정 유도'];
      }

      await db.prepare(`
        INSERT INTO contact_tasks (
          id, organization_id, consultation_id, user_id, patient_id,
          task_type, recommended_date, recommended_message, points, origin
        ) VALUES (?, ?, ?, ?, ?, 'closing', ?, ?, ?, 'auto_rule')
      `).bind(
        taskId, orgId, consult.id, userId, consult.patient_id,
        taskDateStr, message, JSON.stringify(points)
      ).run();

      generatedTasks.push(taskId);
    }

    // Generate proactive tasks
    for (const consult of completedConsults.results) {
      const taskId = 'task_' + generateId().slice(0, 8);
      const pName = (consult.patient_name || '환자') as string;
      const message = `안녕하세요 ${pName}님, 치료 후 불편하신 점은 없으신지 확인차 연락드렸어요. 잘 지내고 계시죠?`;
      const points = ['치료 후 불편 체크', '다음 내원일 확인', '크로스셀 기회 탐색'];

      await db.prepare(`
        INSERT INTO contact_tasks (
          id, organization_id, consultation_id, user_id, patient_id,
          task_type, recommended_date, recommended_message, points, origin
        ) VALUES (?, ?, ?, ?, ?, 'proactive', ?, ?, ?, 'auto_rule')
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

// POST /api/tasks/auto-daily - Auto-generate daily CRM mission (called on login/home load)
tasks.post('/auto-daily', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;
    const today = new Date().toISOString().split('T')[0];

    // Check if we already generated today (prevent duplicates)
    const alreadyGenerated = await db.prepare(`
      SELECT COUNT(*) as cnt FROM contact_tasks 
      WHERE organization_id = ? AND user_id = ? 
        AND date(created_at) = ? AND recommended_date = ?
    `).bind(orgId, userId, today, today).first();

    if ((alreadyGenerated?.cnt as number) > 0) {
      // Already generated today - return existing pending tasks count
      const pending = await db.prepare(`
        SELECT COUNT(*) as cnt FROM contact_tasks
        WHERE organization_id = ? AND user_id = ? AND status = 'pending' AND recommended_date <= ?
      `).bind(orgId, userId, today).first();
      
      return c.json({
        success: true,
        data: { 
          generated: 0, 
          already_exists: true, 
          pending_count: (pending?.cnt as number) || 0 
        }
      });
    }

    // 1. Auto-generate closing tasks for undecided consultations (1+ days, no pending task)
    const undecided = await db.prepare(`
      SELECT c.id, c.patient_id, c.treatment_type, c.amount, c.decision_score, c.summary, c.patient_psychology,
             p.name as patient_name,
             CAST(julianday('now') - julianday(c.consultation_date) AS INTEGER) as days_passed,
             (SELECT COUNT(*) FROM contact_logs cl WHERE cl.patient_id = c.patient_id) as contact_attempts
      FROM consultations c
      JOIN patients p ON c.patient_id = p.id
      WHERE c.organization_id = ? AND c.user_id = ?
        AND c.status = 'undecided'
        AND julianday('now') - julianday(c.consultation_date) >= 1
        AND NOT EXISTS (SELECT 1 FROM contact_tasks t WHERE t.consultation_id = c.id AND t.status = 'pending')
      ORDER BY c.decision_score DESC, c.amount DESC
      LIMIT 10
    `).bind(orgId, userId).all();

    // 2. Auto-generate proactive tasks for paid consultations (7-30 days, no proactive task)
    const paid = await db.prepare(`
      SELECT c.id, c.patient_id, c.treatment_type, c.amount,
             p.name as patient_name,
             CAST(julianday('now') - julianday(c.consultation_date) AS INTEGER) as days_passed
      FROM consultations c
      JOIN patients p ON c.patient_id = p.id
      WHERE c.organization_id = ? AND c.user_id = ?
        AND c.status = 'paid'
        AND julianday('now') - julianday(c.consultation_date) BETWEEN 7 AND 30
        AND NOT EXISTS (SELECT 1 FROM contact_tasks t WHERE t.consultation_id = c.id AND t.task_type = 'proactive' AND t.status = 'pending')
      ORDER BY c.amount DESC
      LIMIT 5
    `).bind(orgId, userId).all();

    let generated = 0;
    const apiKey = c.env.OPENAI_API_KEY;

    // Create closing tasks with smart messages
    for (const consult of undecided.results) {
      const taskId = 'task_' + generateId().slice(0, 8);
      const pName = (consult.patient_name || '환자') as string;
      const treatType = (consult.treatment_type || '치료') as string;
      const dp = consult.days_passed as number;

      let message = '';
      let points: string[] = [];

      // Try AI message generation for high-value consultations
      if (apiKey && (consult.amount as number) >= 1000000) {
        try {
          const result = await generateContactMessage(
            pName,
            consult.summary as string || '',
            'closing',
            safeParseJSON(consult.patient_psychology as string, {}),
            apiKey,
            c.env as any
          );
          message = result.message;
          points = result.points;
        } catch(e) {
          // Fallback
        }
      }
      
      if (!message) {
        // Smart default messages based on days elapsed
        if (dp <= 2) {
          message = `${pName}님, 어제 ${treatType} 상담 때 말씀하신 부분 추가로 궁금하신 점은 없으셨나요? 편하게 연락주세요 😊`;
          points = ['상담 후 궁금한 점 확인', '부담 없이 질문 유도', '다음 단계 자연스럽게 안내'];
        } else if (dp <= 5) {
          message = `${pName}님, 지난번 ${treatType} 상담 후 고민은 좀 정리되셨나요? 결정하시는 데 도움이 필요하시면 말씀해주세요.`;
          points = ['고민 포인트 재확인', '결정 장벽 해소', '시간 제한 활용 (자연스럽게)'];
        } else {
          message = `${pName}님 안녕하세요, 며칠 전 ${treatType} 상담 후 연락드려요. 혹시 다른 궁금한 점이나 비교 검토 중이신 부분이 있으시면 도움드릴게요.`;
          points = ['이탈 방지 연락', '경쟁 병원 비교 대응', '재내원 유도'];
        }
      }

      await db.prepare(`
        INSERT INTO contact_tasks (id, organization_id, consultation_id, user_id, patient_id, task_type, recommended_date, recommended_message, points, origin)
        VALUES (?, ?, ?, ?, ?, 'closing', ?, ?, ?, 'auto_rule')
      `).bind(taskId, orgId, consult.id, userId, consult.patient_id, today, message, JSON.stringify(points)).run();
      generated++;
    }

    // Create proactive tasks
    for (const consult of paid.results) {
      const taskId = 'task_' + generateId().slice(0, 8);
      const pName = (consult.patient_name || '환자') as string;
      const dp = consult.days_passed as number;
      
      let message = `${pName}님, 치료 후 ${dp}일 지났는데 불편하신 점은 없으세요? 잘 지내고 계시죠? 😊`;
      const points = ['치료 후 상태 확인', '다음 내원일 안내', '추가 치료 필요 여부 탐색'];

      await db.prepare(`
        INSERT INTO contact_tasks (id, organization_id, consultation_id, user_id, patient_id, task_type, recommended_date, recommended_message, points, origin)
        VALUES (?, ?, ?, ?, ?, 'proactive', ?, ?, ?, 'auto_rule')
      `).bind(taskId, orgId, consult.id, userId, consult.patient_id, today, message, JSON.stringify(points)).run();
      generated++;
    }

    return c.json({
      success: true,
      data: {
        generated,
        closing: undecided.results.length,
        proactive: paid.results.length,
        auto_generated: true
      }
    });
  } catch (error) {
    console.error('Auto-daily tasks error:', error);
    return c.json({ success: false, error: '자동 미션 생성에 실패했습니다.' }, 500);
  }
});

// PUT /api/tasks/:id/complete - Complete a task (ENHANCED: auto follow-up generation)
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
        'UPDATE consultations SET status = ? WHERE id = ? AND organization_id = ?'
      ).bind('paid', task.consultation_id, orgId).run();
    }

    // ===== AUTO FOLLOW-UP TASK GENERATION =====
    let followUpCreated = false;

    // Case 1: No answer / Callback promised → retry tomorrow
    if (outcome === 'no_answer' || outcome === 'callback') {
      const followUpId = 'task_' + generateId().slice(0, 8);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const patient = await db.prepare('SELECT name FROM patients WHERE id = ?').bind(task.patient_id).first();
      const pName = (patient?.name || '환자') as string;

      const followUpMessage = outcome === 'no_answer'
        ? `${pName}님, 어제 연락드렸는데 부재중이셨어요. 편하신 시간에 한번 더 연락드려볼게요!`
        : `${pName}님, 어제 통화 시 다시 연락 주시기로 하셨는데, 혹시 추가 궁금한 점 있으시면 말씀해주세요.`;
      const followUpPoints = outcome === 'no_answer'
        ? ['재통화 시도', '시간대 변경 (오전→오후 등)', '문자/카톡 병행 시도']
        : ['콜백 약속 이행 확인', '추가 궁금점 해소', '결정 유도'];

      await db.prepare(`
        INSERT INTO contact_tasks (id, organization_id, consultation_id, user_id, patient_id, task_type, recommended_date, recommended_message, points, origin)
        VALUES (?, ?, ?, ?, ?, 'closing', ?, ?, ?, 'auto_rule')
      `).bind(
        followUpId, orgId, task.consultation_id || null, userId, task.patient_id,
        tomorrowStr, followUpMessage, JSON.stringify(followUpPoints)
      ).run();
      followUpCreated = true;
    }

    // Case 2: Hold / Think → follow up in 3 days
    if (outcome === 'hold') {
      const followUpId = 'task_' + generateId().slice(0, 8);
      const followDate = new Date();
      followDate.setDate(followDate.getDate() + 3);
      const followDateStr = followDate.toISOString().split('T')[0];

      const patient = await db.prepare('SELECT name FROM patients WHERE id = ?').bind(task.patient_id).first();
      const pName = (patient?.name || '환자') as string;

      await db.prepare(`
        INSERT INTO contact_tasks (id, organization_id, consultation_id, user_id, patient_id, task_type, recommended_date, recommended_message, points, origin)
        VALUES (?, ?, ?, ?, ?, 'closing', ?, ?, ?, 'auto_rule')
      `).bind(
        followUpId, orgId, task.consultation_id || null, userId, task.patient_id,
        followDateStr,
        `${pName}님, 지난번 통화 후 고민 정리는 되셨나요? 결정에 도움될 만한 정보가 있으면 공유드릴게요.`,
        JSON.stringify(['보류 후 재접촉', '새로운 정보/혜택 제공', '결정 장벽 재확인'])
      ).run();
      followUpCreated = true;
    }

    // Case 3: Rejected → schedule proactive in 2 weeks (maintain relationship)
    if (outcome === 'rejected') {
      const followUpId = 'task_' + generateId().slice(0, 8);
      const followDate = new Date();
      followDate.setDate(followDate.getDate() + 14);
      const followDateStr = followDate.toISOString().split('T')[0];

      const patient = await db.prepare('SELECT name FROM patients WHERE id = ?').bind(task.patient_id).first();
      const pName = (patient?.name || '환자') as string;

      await db.prepare(`
        INSERT INTO contact_tasks (id, organization_id, consultation_id, user_id, patient_id, task_type, recommended_date, recommended_message, points, origin)
        VALUES (?, ?, ?, ?, ?, 'proactive', ?, ?, ?, 'auto_rule')
      `).bind(
        followUpId, orgId, task.consultation_id || null, userId, task.patient_id,
        followDateStr,
        `${pName}님 안녕하세요, 얼마 전 상담 때 감사했습니다. 혹시 나중에라도 도움이 필요하시면 편하게 연락주세요 😊`,
        JSON.stringify(['관계 유지 연락', '부담 없는 안부 인사', '재상담 가능성 열어두기'])
      ).run();
      followUpCreated = true;
    }

    return c.json({ success: true, data: { follow_up_created: followUpCreated } });
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
    params.push(Math.min(parseInt(limit) || 50, 200), Math.max(parseInt(offset) || 0, 0));

    const result = await db.prepare(query).bind(...params).all();

    return c.json({ success: true, data: result.results });
  } catch (error) {
    console.error('Get logs error:', error);
    return c.json({ success: false, error: '연락 기록을 불러오는데 실패했습니다.' }, 500);
  }
});

export default tasks;
