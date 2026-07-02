// Patient Routes
import { Hono } from 'hono';
import { generateId, safeParseJSON } from '../lib/utils';
import { authMiddleware } from '../lib/auth';
import { maskPatientData } from '../lib/middleware';
import type { AppEnv, Env, Patient } from '../types';

const patients = new Hono<AppEnv>();

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

    return c.json({ success: true, data: maskPatientData(patients) });
  } catch (error) {
    console.error('List patients error:', error);
    return c.json({ success: false, error: '환자 목록을 불러오는데 실패했습니다.' }, 500);
  }
});

// GET /api/patients/:id - Get patient detail with full history (OPTIMIZED: parallel queries)
patients.get('/:id', async (c) => {
  try {
    const patientId = c.req.param('id');
    const orgId = c.get('organizationId');
    const db = c.env.DB;

    // Get patient first (needed for 404 check)
    const patient = await db.prepare(`
      SELECT * FROM patients WHERE id = ? AND organization_id = ?
    `).bind(patientId, orgId).first();

    if (!patient) {
      return c.json({ success: false, error: '환자를 찾을 수 없습니다.' }, 404);
    }

    // === PARALLEL: All sub-queries at once ===
    const [consultations, contactLogs, pendingTasks, retentionStatus, treatments, retentionContacts, consultStats] = await Promise.all([
      // Consultations
      db.prepare(`
        SELECT c.*, u.name as user_name,
          json_extract(c.feedback, '$.total_score') as consult_score
        FROM consultations c
        JOIN users u ON c.user_id = u.id
        WHERE c.patient_id = ? AND c.organization_id = ?
        ORDER BY c.consultation_date DESC
      `).bind(patientId, orgId).all(),
      // Contact logs
      db.prepare(`
        SELECT cl.*, u.name as user_name
        FROM contact_logs cl
        JOIN users u ON cl.user_id = u.id
        WHERE cl.patient_id = ? AND cl.organization_id = ?
        ORDER BY cl.created_at DESC LIMIT 20
      `).bind(patientId, orgId).all(),
      // Pending tasks
      db.prepare(`
        SELECT * FROM contact_tasks 
        WHERE patient_id = ? AND organization_id = ? AND status = 'pending'
        ORDER BY recommended_date ASC
      `).bind(patientId, orgId).all(),
      // Retention status
      db.prepare(`
        SELECT * FROM patient_retention_status WHERE patient_id = ? AND organization_id = ?
      `).bind(patientId, orgId).first(),
      // Treatments
      db.prepare(`
        SELECT * FROM patient_treatments WHERE patient_id = ? AND organization_id = ? ORDER BY created_at DESC
      `).bind(patientId, orgId).all(),
      // Retention contacts
      db.prepare(`
        SELECT rc.*, u.name as staff_name FROM retention_contacts rc
        LEFT JOIN users u ON rc.staff_id = u.id
        WHERE rc.patient_id = ? AND rc.organization_id = ?
        ORDER BY rc.contacted_at DESC LIMIT 10
      `).bind(patientId, orgId).all(),
      // Summary statistics
      db.prepare(`
        SELECT 
          COUNT(*) as total_consultations,
          SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_consultations,
          SUM(CASE WHEN status = 'undecided' THEN 1 ELSE 0 END) as undecided_count,
          SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_paid,
          SUM(COALESCE(amount, 0)) as total_consulted,
          AVG(decision_score) as avg_decision_score,
          AVG(CASE WHEN ai_analysis_status = 'completed' THEN CAST(json_extract(feedback, '$.total_score') AS REAL) END) as avg_consult_score,
          MIN(consultation_date) as first_visit,
          MAX(consultation_date) as last_visit
        FROM consultations WHERE patient_id = ? AND organization_id = ?
      `).bind(patientId, orgId).first()
    ]);

    // Build unified timeline (consultations + treatments + contacts)
    const timeline = [
      ...consultations.results.map(e => ({
        date: e.consultation_date, type: 'consultation', id: e.id,
        treatment_type: e.treatment_type, amount: e.amount, status: e.status,
        score: e.consult_score, user_name: e.user_name
      })),
      ...treatments.results.map(e => ({
        date: e.started_at || e.created_at, type: 'treatment', id: e.id,
        treatment_type: e.treatment_type, treatment_name: e.treatment_name,
        amount: e.total_amount, status: e.status
      })),
      ...retentionContacts.results.map(e => ({
        date: e.contacted_at, type: 'contact', id: e.id,
        contact_type: e.contact_type, result: e.result, notes: e.notes,
        staff_name: e.staff_name
      })),
      ...contactLogs.results.map(e => ({
        date: e.created_at, type: 'contact_log', id: e.id,
        contact_type: e.contact_type, outcome: e.outcome, content: e.content,
        user_name: e.user_name
      }))
    ].sort((a: any, b: any) => (b.date || '').localeCompare(a.date || '')).slice(0, 50);

    // Remaining treatment value
    const remainingValue = treatments.results
      .filter((t: any) => !['completed', 'abandoned'].includes(t.status as string))
      .reduce((sum: number, t: any) => sum + ((t.remaining_amount as number) || 0), 0);

    return c.json({
      success: true,
      data: maskPatientData({
        ...patient,
        tags: safeParseJSON(patient.tags as string, []),
        // Summary stats
        summary_stats: {
          total_consultations: consultStats?.total_consultations || 0,
          paid_consultations: consultStats?.paid_consultations || 0,
          undecided_count: consultStats?.undecided_count || 0,
          conversion_rate: (consultStats?.total_consultations as number) > 0
            ? Math.round(((consultStats?.paid_consultations as number) || 0) / (consultStats?.total_consultations as number) * 100)
            : 0,
          total_paid: consultStats?.total_paid || 0,
          total_consulted: consultStats?.total_consulted || 0,
          avg_decision_score: Math.round(((consultStats?.avg_decision_score as number) || 0) * 10) / 10,
          avg_consult_score: Math.round((consultStats?.avg_consult_score as number) || 0),
          first_visit: consultStats?.first_visit,
          last_visit: consultStats?.last_visit,
          remaining_treatment_value: remainingValue,
        },
        // Detailed data
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
        })),
        retention_status: retentionStatus,
        treatments: treatments.results,
        timeline
      })
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

    // Verify ownership and get current memo
    const existing = await db.prepare(
      'SELECT id, memo FROM patients WHERE id = ? AND organization_id = ?'
    ).bind(patientId, orgId).first<{ id: string; memo: string | null }>();

    if (!existing) {
      return c.json({ success: false, error: '환자를 찾을 수 없습니다.' }, 404);
    }

    // Track memo changes
    if (memo !== undefined && memo !== existing.memo) {
      const userId = c.get('userId');
      const userRecord = await db.prepare('SELECT name FROM users WHERE id = ?').bind(userId).first<{ name: string }>();
      const userName = userRecord?.name || 'unknown';
      await db.prepare(`
        INSERT INTO patient_memo_history (patient_id, organization_id, user_id, user_name, old_memo, new_memo)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(patientId, orgId, userId, userName, existing.memo || '', memo || '').run();
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
      name ?? null, phone ?? null, age ?? null, gender ?? null, memo ?? null, 
      tags ? JSON.stringify(tags) : null, status ?? null,
      referral_source ?? null, region ?? null,
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

// GET /api/patients/:id/memo-history - Get memo change history
patients.get('/:id/memo-history', async (c) => {
  try {
    const patientId = c.req.param('id');
    const orgId = c.get('organizationId');
    const db = c.env.DB;

    const result = await db.prepare(`
      SELECT id, user_name, old_memo, new_memo, changed_at
      FROM patient_memo_history
      WHERE patient_id = ? AND organization_id = ?
      ORDER BY changed_at DESC
      LIMIT 50
    `).bind(patientId, orgId).all();

    return c.json({ success: true, data: result.results });
  } catch (error) {
    console.error('Memo history error:', error);
    return c.json({ success: false, error: '메모 이력 조회 실패' }, 500);
  }
});

// GET /api/patients/:id/transcripts - 환자의 기존 상담 스크립트 원문 목록 (환자 이름 클릭 → 원문 뷰어)
patients.get('/:id/transcripts', async (c) => {
  try {
    const patientId = c.req.param('id');
    const orgId = c.get('organizationId');
    const db = c.env.DB;

    const patient = await db.prepare(
      'SELECT id, name FROM patients WHERE id = ? AND organization_id = ?'
    ).bind(patientId, orgId).first();
    if (!patient) {
      return c.json({ success: false, error: '환자를 찾을 수 없습니다.' }, 404);
    }

    // 상담별 원문: consultations.transcript 우선, 없으면 stt_chunks 병합으로 폴백
    const result = await db.prepare(`
      SELECT c.id, c.consultation_date, c.treatment_type, c.status, c.summary,
        c.transcript, c.duration, c.amount, c.decision_score, c.ai_analysis_status,
        u.name as user_name,
        (SELECT GROUP_CONCAT(transcript, ' ') FROM stt_chunks
         WHERE consultation_id = c.id AND transcript IS NOT NULL AND transcript != ''
        ) as chunks_transcript
      FROM consultations c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.patient_id = ? AND c.organization_id = ?
      ORDER BY c.consultation_date DESC
      LIMIT 30
    `).bind(patientId, orgId).all();

    const transcripts = (result.results as any[]).map(r => {
      const raw = (r.transcript && String(r.transcript).trim()) || (r.chunks_transcript && String(r.chunks_transcript).trim()) || '';
      return {
        consultation_id: r.id,
        consultation_date: r.consultation_date,
        treatment_type: r.treatment_type,
        status: r.status,
        summary: r.summary,
        user_name: r.user_name,
        duration: r.duration,
        amount: r.amount,
        decision_score: r.decision_score,
        ai_analysis_status: r.ai_analysis_status,
        transcript: raw,
        has_transcript: raw.length > 0,
        char_count: raw.length,
      };
    });

    // 감사 로그: 원문 열람 기록 (v8.6 컴플라이언스)
    const userId = c.get('userId');
    const { writeAuditLog } = await import('./privacy');
    c.executionCtx.waitUntil(
      writeAuditLog(db, orgId, userId, null, 'transcript_view', 'patient', patientId, {
        transcripts_returned: transcripts.filter(t => t.has_transcript).length,
      })
    );

    return c.json({
      success: true,
      data: {
        patient: { id: patient.id, name: patient.name },
        transcripts,
        total: transcripts.length,
        with_transcript: transcripts.filter(t => t.has_transcript).length,
      }
    });
  } catch (error) {
    console.error('Patient transcripts error:', error);
    return c.json({ success: false, error: '상담 원문 조회에 실패했습니다.' }, 500);
  }
});

// GET /api/patients/:id/contact-timeline - Get unified contact timeline
patients.get('/:id/contact-timeline', async (c) => {
  try {
    const patientId = c.req.param('id');
    const orgId = c.get('organizationId');
    const db = c.env.DB;

    // Fetch contact logs, tasks, and consultation history in parallel
    const [contactLogs, contactTasks, consultations, treatments, retentionContacts] = await Promise.all([
      db.prepare(`
        SELECT cl.*, u.name as user_name
        FROM contact_logs cl
        LEFT JOIN contact_tasks ct ON cl.task_id = ct.id
        LEFT JOIN users u ON cl.user_id = u.id
        WHERE cl.patient_id = ? AND cl.organization_id = ?
        ORDER BY cl.created_at DESC
        LIMIT 100
      `).bind(patientId, orgId).all(),
      db.prepare(`
        SELECT ct.*, u.name as assigned_user_name
        FROM contact_tasks ct
        LEFT JOIN users u ON ct.user_id = u.id
        WHERE ct.patient_id = ? AND ct.organization_id = ?
        ORDER BY ct.created_at DESC
        LIMIT 50
      `).bind(patientId, orgId).all(),
      db.prepare(`
        SELECT c.id, c.consultation_date, c.treatment_type, c.amount, c.status, c.decision_score, 
               u.name as consultant_name,
               json_extract(c.feedback, '$.total_score') as consult_score
        FROM consultations c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.patient_id = ? AND c.organization_id = ?
        ORDER BY c.consultation_date DESC
        LIMIT 50
      `).bind(patientId, orgId).all(),
      db.prepare(`
        SELECT * FROM patient_treatments
        WHERE patient_id = ? AND organization_id = ?
        ORDER BY started_at DESC
        LIMIT 20
      `).bind(patientId, orgId).all(),
      db.prepare(`
        SELECT rc.*, u.name as staff_name, pt.treatment_type
        FROM retention_contacts rc
        LEFT JOIN users u ON rc.staff_id = u.id
        LEFT JOIN patient_treatments pt ON rc.treatment_id = pt.id
        WHERE rc.patient_id = ? AND rc.organization_id = ?
        ORDER BY rc.contacted_at DESC
        LIMIT 50
      `).bind(patientId, orgId).all()
    ]);

    return c.json({
      success: true,
      data: {
        contact_logs: contactLogs.results,
        contact_tasks: contactTasks.results,
        consultations: consultations.results,
        treatments: treatments.results,
        retention_contacts: retentionContacts.results
      }
    });
  } catch (error) {
    console.error('Contact timeline error:', error);
    return c.json({ success: false, error: '타임라인 조회 실패' }, 500);
  }
});

// GET /api/patients/:id/retention-summary - Integrated retention view
patients.get('/:id/retention-summary', async (c) => {
  try {
    const patientId = c.req.param('id');
    const orgId = c.get('organizationId');
    const db = c.env.DB;

    const [retStatus, treatments, contacts, patient] = await Promise.all([
      db.prepare(`
        SELECT * FROM patient_retention_status
        WHERE patient_id = ? AND organization_id = ?
      `).bind(patientId, orgId).first(),
      db.prepare(`
        SELECT * FROM patient_treatments
        WHERE patient_id = ? AND organization_id = ?
        ORDER BY started_at DESC
      `).bind(patientId, orgId).all(),
      db.prepare(`
        SELECT rc.*, u.name as staff_name, pt.treatment_type
        FROM retention_contacts rc
        LEFT JOIN users u ON rc.staff_id = u.id
        LEFT JOIN patient_treatments pt ON rc.treatment_id = pt.id
        WHERE rc.patient_id = ? AND rc.organization_id = ?
        ORDER BY rc.contacted_at DESC
        LIMIT 20
      `).bind(patientId, orgId).all(),
      db.prepare(`
        SELECT p.*, 
          (SELECT COUNT(*) FROM consultations WHERE patient_id = p.id) as total_consultations,
          (SELECT SUM(amount) FROM consultations WHERE patient_id = p.id AND status = 'paid') as total_paid
        FROM patients p
        WHERE p.id = ? AND p.organization_id = ?
      `).bind(patientId, orgId).first()
    ]);

    // Calculate treatment progress
    const treatmentList = (treatments.results || []) as any[];
    const totalTreatmentAmount = treatmentList.reduce((s: number, t: any) => s + (t.total_amount || 0), 0);
    const totalPaidAmount = treatmentList.reduce((s: number, t: any) => s + (t.paid_amount || 0), 0);
    const remainingAmount = totalTreatmentAmount - totalPaidAmount;
    const completedTreatments = treatmentList.filter((t: any) => t.status === 'completed').length;
    const activeTreatments = treatmentList.filter((t: any) => t.status === 'in_progress' || t.status === 'scheduled').length;

    return c.json({
      success: true,
      data: {
        retention_status: retStatus || null,
        treatments: treatmentList,
        contacts: contacts.results,
        patient_summary: patient || null,
        stats: {
          total_treatment_amount: totalTreatmentAmount,
          total_paid_amount: totalPaidAmount,
          remaining_amount: remainingAmount,
          completed_treatments: completedTreatments,
          active_treatments: activeTreatments,
          total_treatments: treatmentList.length
        }
      }
    });
  } catch (error) {
    console.error('Retention summary error:', error);
    return c.json({ success: false, error: '리텐션 요약 조회 실패' }, 500);
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

// ============================================
// v7.3: Patient Referral Network
// ============================================

// GET /api/patients/network/graph - 전체 소개 네트워크 그래프 데이터
patients.get('/network/graph', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const db = c.env.DB;

    const result = await db.prepare(`
      SELECT
        p.id, p.name, p.referral_source, p.referrer_patient_id, p.referred_at,
        p.created_at, p.tags,
        (SELECT COUNT(*) FROM patients child WHERE child.referrer_patient_id = p.id) as direct_referrals,
        (SELECT COUNT(*) FROM consultations c WHERE c.patient_id = p.id) as consultation_count,
        (SELECT COALESCE(SUM(CASE WHEN c.status='paid' THEN c.amount ELSE 0 END), 0) FROM consultations c WHERE c.patient_id = p.id) as paid_amount,
        (SELECT COALESCE(SUM(c.amount), 0) FROM consultations c WHERE c.patient_id = p.id) as total_amount
      FROM patients p
      WHERE p.organization_id = ? AND p.status = 'active'
      ORDER BY p.created_at ASC
    `).bind(orgId).all();

    const rows = result.results as any[];

    // Build child map for BFS
    const childMap = new Map<string, string[]>();
    for (const r of rows) {
      if (r.referrer_patient_id) {
        const list = childMap.get(r.referrer_patient_id) || [];
        list.push(r.id);
        childMap.set(r.referrer_patient_id, list);
      }
    }

    function totalDownstream(rootId: string): { count: number; revenue: number } {
      let count = 0, revenue = 0;
      const queue = [...(childMap.get(rootId) || [])];
      const seen = new Set<string>();
      while (queue.length) {
        const id = queue.shift()!;
        if (seen.has(id)) continue;
        seen.add(id);
        const node = rows.find(r => r.id === id);
        if (!node) continue;
        count++;
        revenue += node.paid_amount || 0;
        for (const k of (childMap.get(id) || [])) queue.push(k);
      }
      return { count, revenue };
    }

    const nodes = rows.map(r => {
      const down = totalDownstream(r.id);
      let depth = 0, cur = r;
      const guard = new Set<string>([r.id]);
      while (cur.referrer_patient_id) {
        depth++;
        const parent = rows.find(rr => rr.id === cur.referrer_patient_id);
        if (!parent || guard.has(parent.id) || depth > 20) break;
        guard.add(parent.id);
        cur = parent;
      }
      const isVip = (r.paid_amount || 0) >= 5000000 || down.count >= 3;
      return {
        id: r.id,
        name: r.name,
        referral_source: r.referral_source || '미지정',
        referrer_patient_id: r.referrer_patient_id,
        referred_at: r.referred_at,
        depth,
        direct_referrals: r.direct_referrals || 0,
        downstream_count: down.count,
        downstream_revenue: down.revenue,
        consultation_count: r.consultation_count || 0,
        paid_amount: r.paid_amount || 0,
        total_amount: r.total_amount || 0,
        is_vip: isVip,
        is_root: !r.referrer_patient_id,
      };
    });

    const edges = rows
      .filter(r => r.referrer_patient_id)
      .map(r => ({
        source: r.referrer_patient_id,
        target: r.id,
        referred_at: r.referred_at,
      }));

    const sourceBreakdown: Record<string, { count: number; revenue: number; with_referrals: number }> = {};
    for (const n of nodes) {
      const src = n.referral_source;
      if (!sourceBreakdown[src]) sourceBreakdown[src] = { count: 0, revenue: 0, with_referrals: 0 };
      sourceBreakdown[src].count++;
      sourceBreakdown[src].revenue += n.paid_amount;
      if (n.direct_referrals > 0) sourceBreakdown[src].with_referrals++;
    }

    const topInfluencers = [...nodes]
      .filter(n => n.downstream_count > 0)
      .sort((a, b) => b.downstream_count - a.downstream_count)
      .slice(0, 5);

    const totalReferrals = edges.length;
    const totalPatients = nodes.length;
    const kFactor = totalPatients > 0 ? Math.round((totalReferrals / totalPatients) * 100) / 100 : 0;

    return c.json({
      success: true,
      data: {
        nodes,
        edges,
        stats: {
          total_patients: totalPatients,
          total_referrals: totalReferrals,
          root_patients: nodes.filter(n => n.is_root).length,
          referred_patients: nodes.filter(n => !n.is_root).length,
          k_factor: kFactor,
          max_depth: Math.max(0, ...nodes.map(n => n.depth)),
        },
        source_breakdown: sourceBreakdown,
        top_influencers: topInfluencers,
      }
    });
  } catch (error) {
    console.error('Referral network error:', error);
    return c.json({ success: false, error: '소개 네트워크 데이터를 불러오는데 실패했습니다.' }, 500);
  }
});

// GET /api/patients/network/by-staff - 상담사별 K-factor 분해 (v7.6)
// 한 환자의 "주 담당 상담사"는 첫 결제 상담의 user_id로 정의
patients.get('/network/by-staff', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const db = c.env.DB;

    // 1) 모든 환자 + (첫 결제 상담 또는 첫 상담의) 주담당 상담사
    const patientsResult = await db.prepare(`
      SELECT
        p.id, p.name, p.referrer_patient_id,
        (SELECT c.user_id FROM consultations c
          WHERE c.patient_id = p.id AND c.organization_id = p.organization_id
          ORDER BY (CASE WHEN c.status='paid' THEN 0 ELSE 1 END), c.consultation_date ASC
          LIMIT 1) as primary_user_id,
        (SELECT COUNT(*) FROM patients child WHERE child.referrer_patient_id = p.id) as direct_referrals,
        (SELECT COALESCE(SUM(CASE WHEN c.status='paid' THEN c.amount ELSE 0 END), 0)
          FROM consultations c WHERE c.patient_id = p.id) as paid_amount
      FROM patients p
      WHERE p.organization_id = ? AND p.status = 'active'
    `).bind(orgId).all();

    const nodes: any[] = (patientsResult.results || []) as any[];
    const childMap = new Map<string, string[]>();
    for (const n of nodes) {
      const ref = n.referrer_patient_id;
      if (ref) {
        if (!childMap.has(ref)) childMap.set(ref, []);
        childMap.get(ref)!.push(n.id);
      }
    }

    // 2) 상담사 목록
    const usersResult = await db.prepare(`
      SELECT id, name, role FROM users WHERE organization_id = ?
    `).bind(orgId).all();
    const users: any[] = (usersResult.results || []) as any[];
    const userMap = new Map<string, any>(users.map((u: any) => [u.id, u]));

    // 3) 상담사별로 그룹핑
    type StaffStats = {
      user_id: string;
      name: string;
      role: string;
      total_patients: number;
      total_referrals: number;
      referred_patients: number;
      total_downstream: number;
      downstream_revenue: number;
      paid_amount: number;
      k_factor: number;
      viral_k_factor: number;
      top_influencer: { id: string; name: string; downstream: number } | null;
    };
    const byStaff = new Map<string, StaffStats>();

    // BFS downstream 카운트 (한 노드 기준)
    const downstreamCount = (rootId: string): { count: number; revenue: number } => {
      const visited = new Set<string>();
      const queue: string[] = [...(childMap.get(rootId) || [])];
      let count = 0;
      let revenue = 0;
      while (queue.length > 0) {
        const id = queue.shift()!;
        if (visited.has(id)) continue;
        visited.add(id);
        const node = nodes.find((x: any) => x.id === id);
        if (!node) continue;
        count++;
        revenue += node.paid_amount || 0;
        for (const k of (childMap.get(id) || [])) queue.push(k);
      }
      return { count, revenue };
    };

    for (const n of nodes) {
      const uid = n.primary_user_id;
      if (!uid) continue;
      const u = userMap.get(uid);
      if (!u) continue;

      if (!byStaff.has(uid)) {
        byStaff.set(uid, {
          user_id: uid,
          name: u.name,
          role: u.role || 'staff',
          total_patients: 0,
          total_referrals: 0,
          referred_patients: 0,
          total_downstream: 0,
          downstream_revenue: 0,
          paid_amount: 0,
          k_factor: 0,
          viral_k_factor: 0,
          top_influencer: null,
        });
      }
      const s = byStaff.get(uid)!;
      s.total_patients++;
      s.total_referrals += n.direct_referrals || 0;
      if (n.referrer_patient_id) s.referred_patients++;
      s.paid_amount += n.paid_amount || 0;

      const down = downstreamCount(n.id);
      s.total_downstream += down.count;
      s.downstream_revenue += down.revenue;

      // 이 상담사가 담당한 환자 중 최고 인플루언서 추적
      if (!s.top_influencer || down.count > s.top_influencer.downstream) {
        if (down.count > 0) {
          s.top_influencer = { id: n.id, name: n.name, downstream: down.count };
        }
      }
    }

    // K-factor 계산
    // 일반 K = 직접소개수 / 총환자수
    // 바이럴 K = 전체 다운스트림 / 총환자수 (장기 누적 효과)
    const result = Array.from(byStaff.values()).map((s) => ({
      ...s,
      k_factor: s.total_patients > 0
        ? Math.round((s.total_referrals / s.total_patients) * 100) / 100
        : 0,
      viral_k_factor: s.total_patients > 0
        ? Math.round((s.total_downstream / s.total_patients) * 100) / 100
        : 0,
    })).sort((a, b) => b.k_factor - a.k_factor);

    return c.json({
      success: true,
      data: {
        staff_count: result.length,
        staff: result,
        // 전사 평균 (비교용)
        org_avg_k_factor: result.length > 0
          ? Math.round(
              (result.reduce((s, x) => s + x.k_factor, 0) / result.length) * 100
            ) / 100
          : 0,
      }
    });
  } catch (error) {
    console.error('Staff K-factor error:', error);
    return c.json({ success: false, error: '상담사별 K-factor 데이터를 불러오는데 실패했습니다.' }, 500);
  }
});

// PUT /api/patients/:id/referrer - 특정 환자의 소개자 설정 (cycle-safe)
patients.put('/:id/referrer', async (c) => {
  try {
    const patientId = c.req.param('id');
    const orgId = c.get('organizationId');
    const db = c.env.DB;
    const { referrer_patient_id, referred_at } = await c.req.json();

    const target = await db.prepare('SELECT id FROM patients WHERE id=? AND organization_id=?')
      .bind(patientId, orgId).first();
    if (!target) return c.json({ success: false, error: '환자를 찾을 수 없습니다.' }, 404);

    if (referrer_patient_id) {
      if (referrer_patient_id === patientId) {
        return c.json({ success: false, error: '자기 자신을 소개자로 지정할 수 없습니다.' }, 400);
      }
      const referrer: any = await db.prepare('SELECT id, referrer_patient_id FROM patients WHERE id=? AND organization_id=?')
        .bind(referrer_patient_id, orgId).first();
      if (!referrer) return c.json({ success: false, error: '소개자 환자를 찾을 수 없습니다.' }, 404);

      // Cycle detection: walk up chain from referrer; if we encounter patientId, abort
      let cur: any = referrer;
      const seen = new Set<string>([patientId]);
      let hops = 0;
      while (cur && cur.referrer_patient_id && hops < 50) {
        if (seen.has(cur.referrer_patient_id)) {
          return c.json({ success: false, error: '순환 소개 관계가 됩니다.' }, 400);
        }
        seen.add(cur.referrer_patient_id);
        cur = await db.prepare('SELECT id, referrer_patient_id FROM patients WHERE id=?')
          .bind(cur.referrer_patient_id).first();
        hops++;
      }
    }

    await db.prepare(`
      UPDATE patients SET
        referrer_patient_id = ?,
        referred_at = COALESCE(?, referred_at, datetime('now')),
        referral_source = CASE WHEN ? IS NOT NULL THEN '지인소개' ELSE referral_source END,
        updated_at = datetime('now')
      WHERE id = ? AND organization_id = ?
    `).bind(referrer_patient_id || null, referred_at || null, referrer_patient_id || null, patientId, orgId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Set referrer error:', error);
    return c.json({ success: false, error: '소개자 설정에 실패했습니다.' }, 500);
  }
});

export default patients;
