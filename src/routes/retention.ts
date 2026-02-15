// Retention Module Routes - R-1 ~ R-6
// 스펙: "찾는 건 기계가, 연락은 사람이"
import { Hono } from 'hono';
import { generateId, safeParseJSON } from '../lib/utils';
import { authMiddleware } from '../lib/auth';
import type { Env } from '../types';

const retention = new Hono<{ Bindings: Env }>();

retention.use('*', authMiddleware);

// ============================================
// R-2: GET /api/retention/dashboard - 리텐션 대시보드
// ============================================
retention.get('/dashboard', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const db = c.env.DB;
    const { filter } = c.req.query(); // all, urgent, recall, at_risk, unconverted

    // 1. 치료 미완료 환자 수
    const incomplete = await db.prepare(`
      SELECT COUNT(DISTINCT patient_id) as cnt FROM patient_retention_status 
      WHERE organization_id = ? AND status IN ('unscheduled_urgent', 'unscheduled_warning')
    `).bind(orgId).first<{cnt: number}>();

    // 2. 이번 달 리콜 대상 수
    const recall = await db.prepare(`
      SELECT COUNT(DISTINCT patient_id) as cnt FROM patient_retention_status
      WHERE organization_id = ? AND status IN ('recall_6m', 'recall_12m')
    `).bind(orgId).first<{cnt: number}>();

    // 3. 이번 주 연락 완료율
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];
    
    const totalNeedContact = await db.prepare(`
      SELECT COUNT(*) as cnt FROM patient_retention_status
      WHERE organization_id = ? AND status NOT IN ('active', 'completed', 'in_treatment')
    `).bind(orgId).first<{cnt: number}>();

    const completedContacts = await db.prepare(`
      SELECT COUNT(DISTINCT patient_id) as cnt FROM retention_contacts
      WHERE organization_id = ? AND contacted_at >= ?
    `).bind(orgId, weekStartStr).first<{cnt: number}>();

    const contactRate = totalNeedContact?.cnt ? Math.round((completedContacts?.cnt || 0) / totalNeedContact.cnt * 100) : 0;

    // 4. 예상 이탈 매출
    const lostRevenue = await db.prepare(`
      SELECT COALESCE(SUM(remaining_treatment_value), 0) as total FROM patient_retention_status
      WHERE organization_id = ? AND status IN ('unscheduled_urgent', 'unscheduled_warning', 'at_risk', 'consulted_unconverted')
    `).bind(orgId).first<{total: number}>();

    // 5. 오늘의 리텐션 연락 리스트 (우선순위 순, 필터 적용)
    let statusFilter = `AND r.status NOT IN ('active', 'completed', 'in_treatment')`;
    if (filter === 'urgent') statusFilter = `AND r.status IN ('unscheduled_urgent', 'unscheduled_warning')`;
    else if (filter === 'recall') statusFilter = `AND r.status IN ('recall_6m', 'recall_12m')`;
    else if (filter === 'at_risk') statusFilter = `AND r.status = 'at_risk'`;
    else if (filter === 'unconverted') statusFilter = `AND r.status = 'consulted_unconverted'`;

    const todayContacts = await db.prepare(`
      SELECT r.*, p.name as patient_name, p.phone as patient_phone, p.age as patient_age, p.gender as patient_gender
      FROM patient_retention_status r
      JOIN patients p ON r.patient_id = p.id
      WHERE r.organization_id = ? 
        ${statusFilter}
      ORDER BY r.priority_score DESC
      LIMIT 30
    `).bind(orgId).all();

    // 각 연락 대상에 치료 정보 추가
    const contactsWithTreatments = [];
    for (const contact of todayContacts.results) {
      const treatments = await db.prepare(`
        SELECT * FROM patient_treatments 
        WHERE patient_id = ? AND status NOT IN ('completed', 'abandoned')
        ORDER BY created_at DESC
      `).bind(contact.patient_id).all();

      const recentContacts = await db.prepare(`
        SELECT * FROM retention_contacts
        WHERE patient_id = ? ORDER BY contacted_at DESC LIMIT 3
      `).bind(contact.patient_id).all();

      // 마지막 상담 피드백 점수
      const lastConsult = await db.prepare(`
        SELECT feedback FROM consultations
        WHERE patient_id = ? ORDER BY consultation_date DESC LIMIT 1
      `).bind(contact.patient_id).first<{feedback: string}>();
      const feedback = safeParseJSON(lastConsult?.feedback || '{}', {});

      contactsWithTreatments.push({
        ...contact,
        treatments: treatments.results,
        recent_contacts: recentContacts.results,
        satisfaction_score: (feedback as any)?.total_score || null
      });
    }

    // 6. 상태 분포
    const distribution = await db.prepare(`
      SELECT status, COUNT(*) as cnt FROM patient_retention_status
      WHERE organization_id = ? GROUP BY status
    `).bind(orgId).all();

    const statusDist: Record<string, number> = {};
    for (const row of distribution.results) {
      statusDist[row.status as string] = row.cnt as number;
    }

    return c.json({
      success: true,
      data: {
        incomplete_count: incomplete?.cnt || 0,
        recall_count: recall?.cnt || 0,
        contact_completion_rate: contactRate,
        estimated_lost_revenue: lostRevenue?.total || 0,
        today_contacts: contactsWithTreatments,
        status_distribution: statusDist
      }
    });
  } catch (error) {
    console.error('Retention dashboard error:', error);
    return c.json({ success: false, error: '리텐션 대시보드를 불러오는데 실패했습니다.' }, 500);
  }
});

// ============================================
// R-4: GET /api/retention/patients/:id - 환자별 리텐션 상세
// ============================================
retention.get('/patients/:id', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const patientId = c.req.param('id');
    const db = c.env.DB;

    const status = await db.prepare(`
      SELECT * FROM patient_retention_status WHERE patient_id = ? AND organization_id = ?
    `).bind(patientId, orgId).first();

    const treatments = await db.prepare(`
      SELECT * FROM patient_treatments WHERE patient_id = ? AND organization_id = ? ORDER BY created_at DESC
    `).bind(patientId, orgId).all();

    const contacts = await db.prepare(`
      SELECT rc.*, u.name as staff_name FROM retention_contacts rc
      LEFT JOIN users u ON rc.staff_id = u.id
      WHERE rc.patient_id = ? AND rc.organization_id = ?
      ORDER BY rc.contacted_at DESC LIMIT 30
    `).bind(patientId, orgId).all();

    // 타임라인 데이터 (상담 + 치료 + 연락 기록 통합)
    const consultations = await db.prepare(`
      SELECT id, consultation_date as date, treatment_type, amount, status, 'consultation' as event_type
      FROM consultations WHERE patient_id = ? AND organization_id = ?
      ORDER BY consultation_date DESC
    `).bind(patientId, orgId).all();

    const treatmentEvents = await db.prepare(`
      SELECT id, started_at as date, treatment_type, treatment_name, total_amount as amount, status, 'treatment' as event_type
      FROM patient_treatments WHERE patient_id = ? AND organization_id = ?
      ORDER BY created_at DESC
    `).bind(patientId, orgId).all();

    const contactEvents = await db.prepare(`
      SELECT rc.id, rc.contacted_at as date, rc.contact_type, rc.result, rc.notes, 'contact' as event_type, u.name as staff_name
      FROM retention_contacts rc LEFT JOIN users u ON rc.staff_id = u.id
      WHERE rc.patient_id = ? AND rc.organization_id = ?
      ORDER BY rc.contacted_at DESC
    `).bind(patientId, orgId).all();

    // 통합 타임라인 (모두 합쳐서 날짜순)
    const timeline = [
      ...consultations.results.map(e => ({ ...e, event_type: 'consultation' })),
      ...treatmentEvents.results.map(e => ({ ...e, event_type: 'treatment' })),
      ...contactEvents.results.map(e => ({ ...e, event_type: 'contact' }))
    ].sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''));

    // 잔여 치료비 합계
    const remainingSum = await db.prepare(`
      SELECT COALESCE(SUM(remaining_amount), 0) as total FROM patient_treatments
      WHERE patient_id = ? AND organization_id = ? AND status NOT IN ('completed', 'abandoned')
    `).bind(patientId, orgId).first<{total: number}>();

    // 리콜 일정 (마지막 스케일링 + 6개월)
    const lastScaling = await db.prepare(`
      SELECT completed_at FROM patient_treatments
      WHERE patient_id = ? AND treatment_type = 'scaling' AND status = 'completed'
      ORDER BY completed_at DESC LIMIT 1
    `).bind(patientId).first<{completed_at: string}>();

    let nextRecallDate = null;
    if (lastScaling?.completed_at) {
      const d = new Date(lastScaling.completed_at);
      d.setMonth(d.getMonth() + 6);
      nextRecallDate = d.toISOString().split('T')[0];
    }

    return c.json({
      success: true,
      data: {
        retention_status: status,
        treatments: treatments.results,
        retention_contacts: contacts.results,
        timeline: timeline.slice(0, 50),
        remaining_treatment_value: remainingSum?.total || 0,
        next_recall_date: nextRecallDate
      }
    });
  } catch (error) {
    console.error('Patient retention error:', error);
    return c.json({ success: false, error: '리텐션 정보를 불러오는데 실패했습니다.' }, 500);
  }
});

// ============================================
// R-5: POST /api/retention/treatments - 치료 수동 등록
// ============================================
retention.post('/treatments', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const body = await c.req.json();
    const db = c.env.DB;

    const id = 'treat_' + generateId().slice(0, 8);
    await db.prepare(`
      INSERT INTO patient_treatments (id, organization_id, patient_id, treatment_type, treatment_name, status, total_amount, paid_amount, started_at, next_appointment, source_consultation_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, orgId, body.patient_id, body.treatment_type, body.treatment_name || null,
      body.status || 'scheduled', body.total_amount || 0, body.paid_amount || 0,
      body.started_at || null, body.next_appointment || null,
      body.source_consultation_id || null, body.notes || null
    ).run();

    // 치료 등록 후 리텐션 상태 자동 갱신 (해당 환자만)
    await updateSinglePatientStatus(db, orgId, body.patient_id);

    return c.json({ success: true, data: { id } });
  } catch (error) {
    console.error('Create treatment error:', error);
    return c.json({ success: false, error: '치료 등록에 실패했습니다.' }, 500);
  }
});

// ============================================
// R-5: PUT /api/retention/treatments/:id - 치료 상태 업데이트
// ============================================
retention.put('/treatments/:id', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const treatId = c.req.param('id');
    const body = await c.req.json();
    const db = c.env.DB;

    const sets: string[] = [];
    const vals: any[] = [];
    if (body.status !== undefined) { sets.push('status = ?'); vals.push(body.status); }
    if (body.paid_amount !== undefined) { sets.push('paid_amount = ?'); vals.push(body.paid_amount); }
    if (body.next_appointment !== undefined) { sets.push('next_appointment = ?'); vals.push(body.next_appointment); }
    if (body.completed_at !== undefined) { sets.push('completed_at = ?'); vals.push(body.completed_at); }
    if (body.notes !== undefined) { sets.push('notes = ?'); vals.push(body.notes); }
    sets.push("updated_at = datetime('now')");

    if (sets.length > 1) {
      vals.push(treatId, orgId);
      await db.prepare(`UPDATE patient_treatments SET ${sets.join(', ')} WHERE id = ? AND organization_id = ?`)
        .bind(...vals).run();
    }

    // 변경된 치료의 환자 리텐션 상태 갱신
    const treat = await db.prepare(`SELECT patient_id FROM patient_treatments WHERE id = ? AND organization_id = ?`)
      .bind(treatId, orgId).first<{patient_id: string}>();
    if (treat) {
      await updateSinglePatientStatus(db, orgId, treat.patient_id);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Update treatment error:', error);
    return c.json({ success: false, error: '치료 업데이트에 실패했습니다.' }, 500);
  }
});

// ============================================
// POST /api/retention/contacts - 리텐션 연락 기록
// ============================================
retention.post('/contacts', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const body = await c.req.json();
    const db = c.env.DB;

    const id = 'rcon_' + generateId().slice(0, 8);
    await db.prepare(`
      INSERT INTO retention_contacts (id, organization_id, patient_id, staff_id, treatment_id, contact_type, result, notes, next_contact_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, orgId, body.patient_id, userId,
      body.treatment_id || null, body.contact_type, body.result,
      body.notes || null, body.next_contact_date || null
    ).run();

    // 예약 완료 시 리텐션 상태 갱신
    if (body.result === 'appointment_booked') {
      await updateSinglePatientStatus(db, orgId, body.patient_id);
    }

    return c.json({ success: true, data: { id } });
  } catch (error) {
    console.error('Create retention contact error:', error);
    return c.json({ success: false, error: '연락 기록 저장에 실패했습니다.' }, 500);
  }
});

// ============================================
// R-1/R-3: POST /api/retention/update-status - 자동 분류 엔진
// 가중치: 긴급도 40%, 잔여치료비 25%, 경과일수 15%, 이전 연락 반응 10%, 상담 만족도 10%
// ============================================
retention.post('/update-status', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const db = c.env.DB;

    const patients = await db.prepare(`
      SELECT p.*, 
        CAST(julianday('now') - julianday(COALESCE(p.last_visit_date, p.created_at)) AS INTEGER) as days_since
      FROM patients p WHERE p.organization_id = ? AND p.status = 'active'
    `).bind(orgId).all();

    let updated = 0;
    for (const patient of patients.results) {
      await updateSinglePatientStatus(db, orgId, patient.id as string, patient);
      updated++;
    }

    return c.json({ success: true, data: { updated } });
  } catch (error) {
    console.error('Update retention status error:', error);
    return c.json({ success: false, error: '리텐션 상태 업데이트에 실패했습니다.' }, 500);
  }
});

// ============================================
// R-8: GET /api/retention/ai-script/:patientId - AI 추천 멘트
// ============================================
retention.get('/ai-script/:patientId', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const patientId = c.req.param('patientId');
    const db = c.env.DB;

    const patient = await db.prepare(`SELECT * FROM patients WHERE id = ? AND organization_id = ?`)
      .bind(patientId, orgId).first();
    if (!patient) return c.json({ success: false, error: '환자를 찾을 수 없습니다.' }, 404);

    const retStatus = await db.prepare(`SELECT * FROM patient_retention_status WHERE patient_id = ?`)
      .bind(patientId).first();

    const treatments = await db.prepare(`
      SELECT * FROM patient_treatments WHERE patient_id = ? AND status NOT IN ('completed', 'abandoned') ORDER BY created_at DESC
    `).bind(patientId).all();

    const lastContact = await db.prepare(`
      SELECT * FROM retention_contacts WHERE patient_id = ? ORDER BY contacted_at DESC LIMIT 1
    `).bind(patientId).first();

    const lastConsult = await db.prepare(`
      SELECT * FROM consultations WHERE patient_id = ? ORDER BY consultation_date DESC LIMIT 1
    `).bind(patientId).first();

    // AI 추천 멘트 생성 (규칙 기반 - OpenAI 없이도 동작)
    const script = generateContactScript({
      patient: patient as any,
      status: (retStatus as any)?.status || 'active',
      daysSince: (retStatus as any)?.days_since_visit || 0,
      treatments: treatments.results as any[],
      lastContact: lastContact as any,
      lastConsult: lastConsult as any
    });

    // DB에 추천 멘트 저장
    if (retStatus) {
      await db.prepare(`
        UPDATE patient_retention_status SET recommended_contact_script = ?, updated_at = datetime('now') WHERE patient_id = ?
      `).bind(script.message, patientId).run();
    }

    return c.json({ success: true, data: script });
  } catch (error) {
    console.error('AI script error:', error);
    return c.json({ success: false, error: 'AI 멘트 생성에 실패했습니다.' }, 500);
  }
});

// ============================================
// R-6: GET /api/retention/report - 리텐션 리포트 (주간/월간)
// ============================================
retention.get('/report', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const db = c.env.DB;
    const { period = 'week' } = c.req.query(); // week or month

    const now = new Date();
    let startDate: string;
    if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    } else {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      startDate = d.toISOString().split('T')[0];
    }

    // 기간 내 연락 통계
    const contactStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_contacts,
        COUNT(DISTINCT patient_id) as unique_patients,
        SUM(CASE WHEN result = 'appointment_booked' THEN 1 ELSE 0 END) as booked,
        SUM(CASE WHEN result = 'connected' THEN 1 ELSE 0 END) as connected,
        SUM(CASE WHEN result = 'no_answer' THEN 1 ELSE 0 END) as no_answer,
        SUM(CASE WHEN result = 'refused' THEN 1 ELSE 0 END) as refused,
        SUM(CASE WHEN result = 'callback_promised' THEN 1 ELSE 0 END) as callback,
        SUM(CASE WHEN result = 'message_sent' THEN 1 ELSE 0 END) as message_sent
      FROM retention_contacts WHERE organization_id = ? AND contacted_at >= ?
    `).bind(orgId, startDate).first();

    // 직원별 성과
    const staffStats = await db.prepare(`
      SELECT u.name as staff_name, 
        COUNT(*) as contacts,
        SUM(CASE WHEN rc.result = 'appointment_booked' THEN 1 ELSE 0 END) as booked
      FROM retention_contacts rc
      JOIN users u ON rc.staff_id = u.id
      WHERE rc.organization_id = ? AND rc.contacted_at >= ?
      GROUP BY rc.staff_id ORDER BY contacts DESC
    `).bind(orgId, startDate).all();

    // 상태별 변화 추이 (현재 vs 이전)
    const currentDist = await db.prepare(`
      SELECT status, COUNT(*) as cnt FROM patient_retention_status WHERE organization_id = ? GROUP BY status
    `).bind(orgId).all();

    // 치료 전환율 (연락 후 예약된 비율)
    const conversionRate = contactStats
      ? Math.round(((contactStats as any).booked || 0) / Math.max(1, (contactStats as any).total_contacts) * 100)
      : 0;

    // 일별 연락 추이
    const dailyTrend = await db.prepare(`
      SELECT date(contacted_at) as day, COUNT(*) as cnt,
        SUM(CASE WHEN result = 'appointment_booked' THEN 1 ELSE 0 END) as booked
      FROM retention_contacts WHERE organization_id = ? AND contacted_at >= ?
      GROUP BY date(contacted_at) ORDER BY day
    `).bind(orgId, startDate).all();

    // 이탈 위험 매출
    const riskRevenue = await db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'unscheduled_urgent' THEN remaining_treatment_value ELSE 0 END), 0) as urgent,
        COALESCE(SUM(CASE WHEN status = 'unscheduled_warning' THEN remaining_treatment_value ELSE 0 END), 0) as warning,
        COALESCE(SUM(CASE WHEN status = 'at_risk' THEN remaining_treatment_value ELSE 0 END), 0) as at_risk,
        COALESCE(SUM(CASE WHEN status = 'consulted_unconverted' THEN remaining_treatment_value ELSE 0 END), 0) as unconverted
      FROM patient_retention_status WHERE organization_id = ?
    `).bind(orgId).first();

    return c.json({
      success: true,
      data: {
        period,
        start_date: startDate,
        contact_stats: contactStats,
        staff_stats: staffStats.results,
        status_distribution: currentDist.results.reduce((acc: any, r: any) => { acc[r.status] = r.cnt; return acc; }, {}),
        conversion_rate: conversionRate,
        daily_trend: dailyTrend.results,
        risk_revenue: riskRevenue
      }
    });
  } catch (error) {
    console.error('Retention report error:', error);
    return c.json({ success: false, error: '리텐션 리포트를 불러오는데 실패했습니다.' }, 500);
  }
});

// ============================================
// GET /api/retention/home-summary - 홈 화면용 리텐션 요약
// ============================================
retention.get('/home-summary', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const db = c.env.DB;

    const contacts = await db.prepare(`
      SELECT r.*, p.name as patient_name, p.phone as patient_phone
      FROM patient_retention_status r
      JOIN patients p ON r.patient_id = p.id
      WHERE r.organization_id = ? AND r.status NOT IN ('active', 'completed', 'in_treatment')
      ORDER BY r.priority_score DESC LIMIT 5
    `).bind(orgId).all();

    const todayDone = await db.prepare(`
      SELECT COUNT(*) as cnt FROM retention_contacts WHERE organization_id = ? AND date(contacted_at) = date('now')
    `).bind(orgId).first<{cnt: number}>();

    return c.json({
      success: true,
      data: {
        contacts: contacts.results,
        total: contacts.results.length,
        completed_today: todayDone?.cnt || 0
      }
    });
  } catch (error) {
    return c.json({ success: false, error: '리텐션 요약을 불러오는데 실패했습니다.' }, 500);
  }
});

// ============================================
// 내부 헬퍼: 단일 환자 리텐션 상태 업데이트
// ============================================
async function updateSinglePatientStatus(db: D1Database, orgId: string, patientId: string, patientRow?: any) {
  let daysSince = 0;
  let lastVisitDate = null;

  if (patientRow) {
    daysSince = patientRow.days_since as number || 0;
    lastVisitDate = patientRow.last_visit_date;
  } else {
    const p = await db.prepare(`
      SELECT *, CAST(julianday('now') - julianday(COALESCE(last_visit_date, created_at)) AS INTEGER) as days_since
      FROM patients WHERE id = ? AND organization_id = ?
    `).bind(patientId, orgId).first();
    if (!p) return;
    daysSince = p.days_since as number || 0;
    lastVisitDate = p.last_visit_date;
  }

  // 진행 중 치료 확인
  const activeTreatments = await db.prepare(`
    SELECT COUNT(*) as cnt, COALESCE(SUM(CASE WHEN remaining_amount > 0 THEN remaining_amount ELSE 0 END), 0) as remaining
    FROM patient_treatments WHERE patient_id = ? AND status IN ('scheduled', 'in_progress', 'consulted')
  `).bind(patientId).first<{cnt: number; remaining: number}>();

  const hasNextAppt = await db.prepare(`
    SELECT COUNT(*) as cnt FROM patient_treatments WHERE patient_id = ? AND next_appointment IS NOT NULL AND next_appointment >= date('now') AND status NOT IN ('completed', 'abandoned')
  `).bind(patientId).first<{cnt: number}>();

  // 이전 연락 반응도 (최근 3건)
  const recentContacts = await db.prepare(`
    SELECT result FROM retention_contacts WHERE patient_id = ? ORDER BY contacted_at DESC LIMIT 3
  `).bind(patientId).all();
  
  let contactResponseScore = 0.5; // 기본값 (연락 기록 없으면 중립)
  if (recentContacts.results.length > 0) {
    const positiveResults = ['connected', 'appointment_booked', 'callback_promised', 'message_sent'];
    const positiveCount = recentContacts.results.filter(r => positiveResults.includes(r.result as string)).length;
    contactResponseScore = positiveCount / recentContacts.results.length;
  }

  // 상담 만족도 (마지막 상담)
  const lastConsult = await db.prepare(`
    SELECT feedback FROM consultations WHERE patient_id = ? ORDER BY consultation_date DESC LIMIT 1
  `).bind(patientId).first<{feedback: string}>();
  const feedback = safeParseJSON(lastConsult?.feedback || '{}', {});
  const satisfactionScore = ((feedback as any)?.total_score || 50) / 100; // 0~1 정규화

  // ============================================
  // R-1: 상태 결정 (순서 중요! 우선순위 높은 것부터)
  // ============================================
  let status = 'active';
  let riskScore = 0;
  let urgencyFactor = 0; // 0~1

  const hasTreatments = activeTreatments && activeTreatments.cnt > 0;
  const remaining = activeTreatments?.remaining || 0;

  // 1) 예약이 잡혀있으면 = 치료중 (안전)
  if (hasNextAppt && hasNextAppt.cnt > 0) {
    status = 'in_treatment'; riskScore = 5; urgencyFactor = 0;

  // 2) 365일+ 방문 없음 = 이탈 위험 (가장 위험, recall보다 먼저 체크!)
  } else if (daysSince >= 365) {
    status = 'at_risk'; 
    riskScore = Math.min(100, 60 + Math.floor(daysSince / 30));
    urgencyFactor = 0.9;

  // 3) 치료가 있는데 14일+ 미예약 = 긴급
  } else if (hasTreatments && daysSince >= 14) {
    status = 'unscheduled_urgent'; 
    riskScore = Math.min(95, 50 + daysSince);
    urgencyFactor = 1.0;

  // 4) 치료가 있는데 7일+ 미예약 = 주의
  } else if (hasTreatments && daysSince >= 7) {
    status = 'unscheduled_warning'; 
    riskScore = 30 + daysSince;
    urgencyFactor = 0.8;

  // 5) 11개월+ = 12개월 리콜 대상 (1개월 전 알림)
  } else if (daysSince >= 335) {
    status = 'recall_12m'; riskScore = 40;
    urgencyFactor = 0.3;

  // 6) 5개월+ = 6개월 리콜 대상
  } else if (daysSince >= 150) {
    status = 'recall_6m'; riskScore = 25;
    urgencyFactor = 0.3;

  // 7) 치료 진행중 (예약은 없지만 치료가 있음)
  } else if (hasTreatments) {
    status = 'in_treatment'; riskScore = 10;
    urgencyFactor = 0.1;
  }

  // 8) 상담 미전환 체크 (active 상태이고, 30일 이상 지난 미결정 상담이 있으면)
  const unconverted = await db.prepare(`
    SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total_amount FROM consultations 
    WHERE patient_id = ? AND status = 'undecided' AND julianday('now') - julianday(consultation_date) >= 30
  `).bind(patientId).first<{cnt: number; total_amount: number}>();
  
  if (unconverted && unconverted.cnt > 0 && status === 'active') {
    status = 'consulted_unconverted'; 
    riskScore = Math.min(85, 40 + daysSince);
    urgencyFactor = 0.6;
  }

  // ============================================
  // R-3: 우선순위 점수 계산 (가중치 스펙)
  // 긴급도 40% + 잔여치료비 25% + 경과일수 15% + 이전 연락 반응 10% + 상담 만족도 10%
  // ============================================
  const priorityScore = (
    40 * urgencyFactor +                                          // 긴급도 40%
    25 * Math.min(1, remaining / 10000000) +                     // 잔여치료비 25% (1000만원 기준 정규화)
    15 * Math.min(1, daysSince / 365) +                          // 경과일수 15% (1년 기준 정규화)
    10 * (1 - contactResponseScore) +                            // 이전 연락 반응 10% (반응 나쁠수록 높음)
    10 * (1 - satisfactionScore)                                 // 상담 만족도 10% (불만족일수록 높음)
  );

  // AI 추천 멘트 생성
  const script = generateContactScript({
    patient: { name: patientRow?.name || '' } as any,
    status,
    daysSince,
    treatments: [],
    lastContact: null,
    lastConsult: null
  });

  // 추천 연락일: 긴급은 오늘, 주의는 3일 내, 리콜/이탈은 이번 주
  let recommendedDate = new Date().toISOString().split('T')[0];
  if (status === 'unscheduled_warning') {
    const d = new Date(); d.setDate(d.getDate() + 2); recommendedDate = d.toISOString().split('T')[0];
  } else if (status.startsWith('recall_') || status === 'at_risk') {
    const d = new Date(); d.setDate(d.getDate() + 5); recommendedDate = d.toISOString().split('T')[0];
  } else if (status === 'consulted_unconverted') {
    const d = new Date(); d.setDate(d.getDate() + 1); recommendedDate = d.toISOString().split('T')[0];
  }

  // UPSERT
  await db.prepare(`
    INSERT INTO patient_retention_status (id, organization_id, patient_id, status, risk_score, last_visit_date, days_since_visit, remaining_treatment_value, priority_score, recommended_contact_date, recommended_contact_script, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(patient_id) DO UPDATE SET
      status = excluded.status, risk_score = excluded.risk_score, 
      days_since_visit = excluded.days_since_visit, remaining_treatment_value = excluded.remaining_treatment_value,
      priority_score = excluded.priority_score, recommended_contact_date = excluded.recommended_contact_date,
      recommended_contact_script = excluded.recommended_contact_script, updated_at = datetime('now')
  `).bind(
    'ret_' + generateId().slice(0, 8), orgId, patientId, status, riskScore,
    lastVisitDate || null, daysSince,
    remaining, Math.round(priorityScore * 100), // 0~10000
    status !== 'active' && status !== 'in_treatment' && status !== 'completed' ? recommendedDate : null,
    script.message
  ).run();
}

// ============================================
// AI 추천 멘트 생성 (규칙 기반)
// ============================================
interface ScriptContext {
  patient: { name: string; age?: number; gender?: string };
  status: string;
  daysSince: number;
  treatments: any[];
  lastContact: any;
  lastConsult: any;
}

function generateContactScript(ctx: ScriptContext): { message: string; tone: string; tips: string[] } {
  const name = ctx.patient.name || '환자';
  const honorific = name + '님';
  const dayText = ctx.daysSince > 30 ? Math.floor(ctx.daysSince / 30) + '개월' : ctx.daysSince + '일';

  switch (ctx.status) {
    case 'unscheduled_urgent':
      return {
        message: `${honorific}, 안녕하세요! 서울BD치과입니다. 지난번 치료 이후 경과가 어떠신지 궁금해서 연락드렸어요. 혹시 불편하신 곳은 없으셨나요? 다음 치료 일정을 잡아드리면 좋을 것 같아서요.`,
        tone: '따뜻하고 걱정하는 톤',
        tips: [
          '치료 미완료 상태임을 직접 언급하지 않기',
          '경과 확인 → 불편사항 체크 → 예약 유도 순서로',
          `마지막 내원: ${dayText} 전`
        ]
      };
    case 'unscheduled_warning':
      return {
        message: `${honorific}, 안녕하세요! 지난번 진료 잘 마무리되셨나요? 다음 내원 일정을 잡아드리려고 연락드렸습니다. 편하신 날짜가 있으실까요?`,
        tone: '자연스럽고 친근한 톤',
        tips: [
          '가벼운 안부 인사로 시작',
          '다음 예약을 자연스럽게 제안',
          `아직 긴급하지 않으니 부담주지 않기`
        ]
      };
    case 'recall_6m':
      return {
        message: `${honorific}, 안녕하세요! 서울BD치과입니다. 정기검진 시기가 다가와서 안내드려요. 스케일링과 함께 전체 검진 받으시면 좋을 것 같습니다. 편하신 시간에 예약해 드릴까요?`,
        tone: '밝고 건강 관리 안내 톤',
        tips: [
          '6개월 주기 정기검진 안내',
          '스케일링은 보험 적용 가능함을 안내',
          '건강 관리 관점에서 접근'
        ]
      };
    case 'recall_12m':
      return {
        message: `${honorific}, 오랜만에 인사드려요! 서울BD치과입니다. 마지막 내원 이후 1년 정도 되어서 종합 검진 안내드리려고요. 정기적인 구강검진은 문제를 미리 발견하는 데 정말 중요하거든요.`,
        tone: '친근하면서도 전문적인 톤',
        tips: [
          '1년 검진의 중요성 강조',
          '구체적 검사 항목 안내하면 효과적',
          '이전 치료 이력 참고하여 맞춤 안내'
        ]
      };
    case 'at_risk':
      return {
        message: `${honorific}, 안녕하세요! 서울BD치과 김실장입니다. 오랜만에 안부 인사드려요. 건강은 어떠세요? 혹시 치아 쪽으로 불편하신 건 없으셨나요? 편하실 때 한번 들러주시면 좋겠습니다.`,
        tone: '따뜻하고 인간적인 안부 톤',
        tips: [
          '치료보다는 안부 인사 중심으로',
          '부담을 주지 않는 것이 핵심',
          `${dayText} 이상 미방문 - 재연결이 목표`,
          '이전에 좋은 경험이 있었다면 상기시키기'
        ]
      };
    case 'consulted_unconverted':
      return {
        message: `${honorific}, 안녕하세요! 지난번 상담 때 궁금하셨던 부분이 있으셨을 것 같아서 연락드렸어요. 혹시 추가로 여쭤보고 싶으신 점이 있으시면 편하게 말씀해 주세요.`,
        tone: '부담 없이 도움을 주려는 톤',
        tips: [
          '결정을 재촉하지 않기',
          '추가 정보 제공 관점으로 접근',
          '고민 포인트가 있었다면 해소해주기',
          '비용 부담이 원인이라면 할부/분납 안내'
        ]
      };
    default:
      return {
        message: `${honorific}, 안녕하세요! 서울BD치과입니다. 안부 인사 겸 연락드렸습니다. 건강하게 잘 지내고 계시죠?`,
        tone: '일반 안부 톤',
        tips: ['가벼운 안부 인사']
      };
  }
}

export default retention;
