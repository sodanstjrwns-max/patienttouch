// Patient Routes
import { Hono } from 'hono';
import { generateId, safeParseJSON } from '../lib/utils';
import { authMiddleware } from '../lib/auth';
import type { Env, Patient } from '../types';

const patients = new Hono<{ Bindings: Env }>();

// Apply auth middleware to all routes
patients.use('*', authMiddleware);

// GET /api/patients - List patients
patients.get('/', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const db = c.env.DB;

    const { status, search, limit = '50', offset = '0' } = c.req.query();

    let query = `
      SELECT p.*, 
        (SELECT COUNT(*) FROM consultations WHERE patient_id = p.id) as consultation_count,
        (SELECT MAX(consultation_date) FROM consultations WHERE patient_id = p.id) as last_consultation,
        (SELECT status FROM consultations WHERE patient_id = p.id ORDER BY consultation_date DESC LIMIT 1) as last_consultation_status,
        (SELECT decision_score FROM consultations WHERE patient_id = p.id ORDER BY consultation_date DESC LIMIT 1) as last_decision_score
      FROM patients p
      WHERE p.organization_id = ?
    `;
    const params: (string | number)[] = [orgId];

    if (status && status !== 'all') {
      // Filter by last consultation status
      query += ` AND EXISTS (
        SELECT 1 FROM consultations c 
        WHERE c.patient_id = p.id 
        AND c.id = (SELECT id FROM consultations WHERE patient_id = p.id ORDER BY consultation_date DESC LIMIT 1)
        AND c.status = ?
      )`;
      params.push(status);
    }

    if (search) {
      query += ` AND (p.name LIKE ? OR p.phone LIKE ? OR p.referral_source LIKE ? OR p.region LIKE ? OR p.tags LIKE ? OR p.memo LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY p.updated_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();

    const patients = result.results.map(p => ({
      ...p,
      tags: safeParseJSON(p.tags as string, [])
    }));

    return c.json({ success: true, data: patients });
  } catch (error) {
    console.error('List patients error:', error);
    return c.json({ success: false, error: '환자 목록을 불러오는데 실패했습니다.' }, 500);
  }
});

// GET /api/patients/:id - Get patient detail with history
patients.get('/:id', async (c) => {
  try {
    const patientId = c.req.param('id');
    const orgId = c.get('organizationId');
    const db = c.env.DB;

    // Get patient
    const patient = await db.prepare(`
      SELECT * FROM patients WHERE id = ? AND organization_id = ?
    `).bind(patientId, orgId).first();

    if (!patient) {
      return c.json({ success: false, error: '환자를 찾을 수 없습니다.' }, 404);
    }

    // Get consultations
    const consultations = await db.prepare(`
      SELECT c.*, u.name as user_name
      FROM consultations c
      JOIN users u ON c.user_id = u.id
      WHERE c.patient_id = ? AND c.organization_id = ?
      ORDER BY c.consultation_date DESC
    `).bind(patientId, orgId).all();

    // Get contact logs
    const contactLogs = await db.prepare(`
      SELECT cl.*, u.name as user_name
      FROM contact_logs cl
      JOIN users u ON cl.user_id = u.id
      WHERE cl.patient_id = ? AND cl.organization_id = ?
      ORDER BY cl.created_at DESC
      LIMIT 20
    `).bind(patientId, orgId).all();

    // Get pending tasks
    const pendingTasks = await db.prepare(`
      SELECT * FROM contact_tasks 
      WHERE patient_id = ? AND organization_id = ? AND status = 'pending'
      ORDER BY recommended_date ASC
    `).bind(patientId, orgId).all();

    return c.json({
      success: true,
      data: {
        ...patient,
        tags: safeParseJSON(patient.tags as string, []),
        consultations: consultations.results.map(c => ({
          ...c,
          patient_psychology: safeParseJSON(c.patient_psychology as string, {}),
          emotion_flow: safeParseJSON(c.emotion_flow as string, {}),
          key_quotes: safeParseJSON(c.key_quotes as string, []),
          feedback: safeParseJSON(c.feedback as string, {})
        })),
        contact_logs: contactLogs.results,
        pending_tasks: pendingTasks.results.map(t => ({
          ...t,
          points: safeParseJSON(t.points as string, [])
        }))
      }
    });
  } catch (error) {
    console.error('Get patient error:', error);
    return c.json({ success: false, error: '환자 정보를 불러오는데 실패했습니다.' }, 500);
  }
});

// POST /api/patients - Create patient
patients.post('/', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const { name, phone, age, gender, memo, tags, referral_source, region } = await c.req.json();
    const db = c.env.DB;

    if (!name) {
      return c.json({ success: false, error: '환자 이름을 입력해주세요.' }, 400);
    }

    const patientId = 'patient_' + generateId().slice(0, 8);

    await db.prepare(`
      INSERT INTO patients (id, organization_id, name, phone, age, gender, memo, tags, referral_source, region)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      patientId, orgId, name, phone || null, age || null, gender || null, 
      memo || null, JSON.stringify(tags || []), referral_source || null, region || null
    ).run();

    return c.json({
      success: true,
      data: { id: patientId, name, phone, age, gender, memo, tags: tags || [], referral_source, region }
    });
  } catch (error) {
    console.error('Create patient error:', error);
    return c.json({ success: false, error: '환자 등록에 실패했습니다.' }, 500);
  }
});

// PUT /api/patients/:id - Update patient
patients.put('/:id', async (c) => {
  try {
    const patientId = c.req.param('id');
    const orgId = c.get('organizationId');
    const { name, phone, age, gender, memo, tags, status, referral_source, region } = await c.req.json();
    const db = c.env.DB;

    // Verify ownership
    const existing = await db.prepare(
      'SELECT id FROM patients WHERE id = ? AND organization_id = ?'
    ).bind(patientId, orgId).first();

    if (!existing) {
      return c.json({ success: false, error: '환자를 찾을 수 없습니다.' }, 404);
    }

    await db.prepare(`
      UPDATE patients SET
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        age = COALESCE(?, age),
        gender = COALESCE(?, gender),
        memo = COALESCE(?, memo),
        tags = COALESCE(?, tags),
        status = COALESCE(?, status),
        referral_source = COALESCE(?, referral_source),
        region = COALESCE(?, region),
        updated_at = datetime('now')
      WHERE id = ? AND organization_id = ?
    `).bind(
      name, phone, age, gender, memo, 
      tags ? JSON.stringify(tags) : null, status,
      referral_source, region,
      patientId, orgId
    ).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Update patient error:', error);
    return c.json({ success: false, error: '환자 정보 수정에 실패했습니다.' }, 500);
  }
});

// DELETE /api/patients/:id - Delete patient (soft delete)
patients.delete('/:id', async (c) => {
  try {
    const patientId = c.req.param('id');
    const orgId = c.get('organizationId');
    const db = c.env.DB;

    await db.prepare(`
      UPDATE patients SET status = 'inactive', updated_at = datetime('now')
      WHERE id = ? AND organization_id = ?
    `).bind(patientId, orgId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete patient error:', error);
    return c.json({ success: false, error: '환자 삭제에 실패했습니다.' }, 500);
  }
});

// GET /api/patients/:id/stats - Get patient statistics
patients.get('/:id/stats', async (c) => {
  try {
    const patientId = c.req.param('id');
    const orgId = c.get('organizationId');
    const db = c.env.DB;

    const stats = await db.prepare(`
      SELECT 
        COUNT(*) as total_consultations,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_consultations,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_amount,
        AVG(decision_score) as avg_decision_score
      FROM consultations 
      WHERE patient_id = ? AND organization_id = ?
    `).bind(patientId, orgId).first();

    const contactStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_contacts,
        SUM(CASE WHEN outcome = 'booked' THEN 1 ELSE 0 END) as successful_contacts
      FROM contact_logs 
      WHERE patient_id = ? AND organization_id = ?
    `).bind(patientId, orgId).first();

    return c.json({
      success: true,
      data: { ...stats, ...contactStats }
    });
  } catch (error) {
    console.error('Get patient stats error:', error);
    return c.json({ success: false, error: '통계를 불러오는데 실패했습니다.' }, 500);
  }
});

// ============================================
// FEATURE 12: Duplicate Check & Merge
// ============================================

// GET /api/patients/duplicates/check - Check for duplicate patients by phone
patients.get('/duplicates/check', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const db = c.env.DB;

    // Find phone numbers with multiple patients
    const dupes = await db.prepare(`
      SELECT p.phone, GROUP_CONCAT(p.id) as patient_ids, GROUP_CONCAT(p.name) as patient_names,
             COUNT(*) as cnt
      FROM patients p
      WHERE p.organization_id = ? AND p.phone IS NOT NULL AND p.phone != '' AND p.status = 'active'
      GROUP BY p.phone HAVING COUNT(*) > 1
      ORDER BY cnt DESC
      LIMIT 20
    `).bind(orgId).all();

    const duplicates = dupes.results.map(d => ({
      phone: d.phone,
      count: d.cnt,
      patient_ids: (d.patient_ids as string).split(','),
      patient_names: (d.patient_names as string).split(',')
    }));

    return c.json({ success: true, data: duplicates });
  } catch (error) {
    console.error('Duplicate check error:', error);
    return c.json({ success: false, error: '중복 체크에 실패했습니다.' }, 500);
  }
});

// POST /api/patients/duplicates/merge - Merge duplicate patients
patients.post('/duplicates/merge', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const db = c.env.DB;
    const { keep_id, merge_ids } = await c.req.json();

    if (!keep_id || !merge_ids || merge_ids.length === 0) {
      return c.json({ success: false, error: '병합할 환자를 선택해주세요.' }, 400);
    }

    // Verify all patients belong to org
    for (const id of [keep_id, ...merge_ids]) {
      const exists = await db.prepare('SELECT id FROM patients WHERE id=? AND organization_id=?')
        .bind(id, orgId).first();
      if (!exists) return c.json({ success: false, error: '환자를 찾을 수 없습니다: ' + id }, 404);
    }

    // Move consultations
    for (const mid of merge_ids) {
      await db.prepare('UPDATE consultations SET patient_id=? WHERE patient_id=? AND organization_id=?')
        .bind(keep_id, mid, orgId).run();
      await db.prepare('UPDATE contact_tasks SET patient_id=? WHERE patient_id=? AND organization_id=?')
        .bind(keep_id, mid, orgId).run();
      await db.prepare('UPDATE contact_logs SET patient_id=? WHERE patient_id=? AND organization_id=?')
        .bind(keep_id, mid, orgId).run();
      await db.prepare('UPDATE patient_treatments SET patient_id=? WHERE patient_id=? AND organization_id=?')
        .bind(keep_id, mid, orgId).run();
      await db.prepare('UPDATE retention_contacts SET patient_id=? WHERE patient_id=? AND organization_id=?')
        .bind(keep_id, mid, orgId).run();
      // Soft-delete merged patient
      await db.prepare("UPDATE patients SET status='inactive', memo=COALESCE(memo,'')||' [병합됨→'||?||']' WHERE id=? AND organization_id=?")
        .bind(keep_id, mid, orgId).run();
    }

    return c.json({ success: true, data: { kept: keep_id, merged: merge_ids.length } });
  } catch (error) {
    console.error('Merge patients error:', error);
    return c.json({ success: false, error: '환자 병합에 실패했습니다.' }, 500);
  }
});

// GET /api/patients/duplicates/check-phone - Check single phone for duplicates
patients.get('/duplicates/check-phone', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const db = c.env.DB;
    const { phone } = c.req.query();

    if (!phone) return c.json({ success: true, data: [] });

    const result = await db.prepare(`
      SELECT id, name, phone, created_at FROM patients 
      WHERE organization_id=? AND phone=? AND status='active'
    `).bind(orgId, phone).all();

    return c.json({ success: true, data: result.results });
  } catch (error) {
    return c.json({ success: false, error: '확인에 실패했습니다.' }, 500);
  }
});

export default patients;
