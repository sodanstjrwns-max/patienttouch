// Dashboard & KPI Routes
import { Hono } from 'hono';
import { safeParseJSON } from '../lib/utils';
import { authMiddleware } from '../lib/auth';
import { safeInt, validatePeriod, validateAdminPeriod, periodToDays, setCacheHeaders, maskPatientData, maskPhone } from '../lib/middleware';
import type { Env, KPIData } from '../types';

const dashboard = new Hono<{ Bindings: Env }>();

// Apply auth middleware to all routes
dashboard.use('*', authMiddleware);

// GET /api/dashboard/kpi - Get KPI data
dashboard.get('/kpi', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;

    const { period = 'week' } = c.req.query();
    const daysBack = periodToDays(validatePeriod(period));

    // Parallel KPI queries
    const [consultStats, taskStats, reConsultStats] = await Promise.all([
      db.prepare(`
        SELECT COUNT(*) as total_consultations,
          SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_consultations,
          SUM(CASE WHEN status = 'undecided' THEN 1 ELSE 0 END) as undecided_consultations,
          AVG(CASE WHEN ai_analysis_status = 'completed' THEN 
            CAST(json_extract(feedback, '$.total_score') AS INTEGER) END) as avg_score,
          SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_amount
        FROM consultations 
        WHERE organization_id = ? AND user_id = ?
          AND consultation_date >= datetime('now', '-' || ? || ' days')
      `).bind(orgId, userId, daysBack).first(),
      db.prepare(`
        SELECT COUNT(*) as total_tasks,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
          SUM(CASE WHEN status = 'completed' AND result = 'booked' THEN 1 ELSE 0 END) as successful_tasks
        FROM contact_tasks
        WHERE organization_id = ? AND user_id = ?
          AND created_at >= datetime('now', '-' || ? || ' days')
      `).bind(orgId, userId, daysBack).first(),
      db.prepare(`
        SELECT COUNT(DISTINCT c.patient_id) as re_consultation_success
        FROM consultations c
        WHERE c.organization_id = ? AND c.user_id = ? AND c.status = 'paid'
          AND c.consultation_date >= datetime('now', '-' || ? || ' days')
          AND EXISTS (
            SELECT 1 FROM consultations prev
            WHERE prev.patient_id = c.patient_id AND prev.status = 'undecided' AND prev.consultation_date < c.consultation_date
          )
      `).bind(orgId, userId, daysBack).first()
    ]);

    // Calculate KPIs
    const totalConsultations = (consultStats?.total_consultations as number) || 0;
    const paidConsultations = (consultStats?.paid_consultations as number) || 0;
    const totalTasks = (taskStats?.total_tasks as number) || 0;
    const completedTasks = (taskStats?.completed_tasks as number) || 0;

    const kpi: KPIData = {
      conversion_rate: totalConsultations > 0 
        ? Math.round((paidConsultations / totalConsultations) * 100) 
        : 0,
      avg_score: Math.round((consultStats?.avg_score as number) || 0),
      contact_rate: totalTasks > 0 
        ? Math.round((completedTasks / totalTasks) * 100) 
        : 0,
      re_consultation: (reConsultStats?.re_consultation_success as number) || 0,
      total_consultations: totalConsultations,
      paid_consultations: paidConsultations,
      total_tasks: totalTasks,
      completed_tasks: completedTasks
    };

    // Get user goals
    const user = await db.prepare(
      'SELECT goals FROM users WHERE id = ?'
    ).bind(userId).first();

    const goals = safeParseJSON(user?.goals as string, {
      conversion_rate: 80,
      avg_score: 85,
      contact_rate: 95,
      re_consultation: 3
    });

    return c.json({
      success: true,
      data: {
        kpi,
        goals,
        period,
        total_amount: consultStats?.total_amount || 0
      }
    });
  } catch (error) {
    console.error('Get KPI error:', error);
    return c.json({ success: false, error: 'KPI를 불러오는데 실패했습니다.' }, 500);
  }
});

// GET /api/dashboard/summary - Get home dashboard summary (OPTIMIZED v3)
dashboard.get('/summary', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;
    const today = new Date().toISOString().split('T')[0];

    // === BATCH ALL QUERIES IN PARALLEL (12→6 batched) ===
    const [
      user,
      todayTasks,
      todayConsults,
      weekRevenue,
      prevWeekRevenue,
      dailySparkline,
      weekTaskStats,
      prevWeekTaskStats,
      mvpCase,
      recentConsults,
      prevWeekKPI,
      staleUndecided,
      todayCompletedTasks
    ] = await Promise.all([
      // User info
      db.prepare(`
        SELECT u.name, u.goals, o.name as organization_name
        FROM users u JOIN organizations o ON u.organization_id = o.id
        WHERE u.id = ?
      `).bind(userId).first(),
      // Today's pending tasks
      db.prepare(`
        SELECT COUNT(*) as total,
          SUM(CASE WHEN task_type = 'closing' THEN 1 ELSE 0 END) as closing,
          SUM(CASE WHEN task_type = 'proactive' THEN 1 ELSE 0 END) as proactive
        FROM contact_tasks
        WHERE organization_id = ? AND user_id = ? AND status = 'pending' AND recommended_date <= ?
      `).bind(orgId, userId, today).first(),
      // Today's consultations
      db.prepare(`
        SELECT COUNT(*) as total,
          SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
          SUM(CASE WHEN status = 'undecided' THEN 1 ELSE 0 END) as undecided,
          SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as today_decided,
          SUM(COALESCE(amount, 0)) as today_consulted
        FROM consultations 
        WHERE organization_id = ? AND user_id = ? AND date(consultation_date) = date('now')
      `).bind(orgId, userId).first(),
      // Week revenue & stats
      db.prepare(`
        SELECT SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as week_decided,
          SUM(COALESCE(amount, 0)) as week_consulted,
          COUNT(*) as total_consultations,
          SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_consultations,
          AVG(CASE WHEN ai_analysis_status = 'completed' THEN CAST(json_extract(feedback, '$.total_score') AS INTEGER) END) as avg_score
        FROM consultations 
        WHERE organization_id = ? AND user_id = ? AND consultation_date >= datetime('now', '-7 days')
      `).bind(orgId, userId).first(),
      // Previous week revenue
      db.prepare(`
        SELECT SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as prev_week_decided
        FROM consultations WHERE organization_id = ? AND user_id = ?
          AND consultation_date >= datetime('now', '-14 days') AND consultation_date < datetime('now', '-7 days')
      `).bind(orgId, userId).first(),
      // Sparkline (7 days)
      db.prepare(`
        SELECT date(consultation_date) as date, COUNT(*) as total,
          SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
          SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as decided,
          SUM(COALESCE(amount, 0)) as consulted
        FROM consultations WHERE organization_id = ? AND user_id = ? AND consultation_date >= datetime('now', '-7 days')
        GROUP BY date(consultation_date) ORDER BY date ASC
      `).bind(orgId, userId).all(),
      // Week task stats
      db.prepare(`
        SELECT COUNT(*) as total_tasks,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
        FROM contact_tasks WHERE organization_id = ? AND user_id = ? AND created_at >= datetime('now', '-7 days')
      `).bind(orgId, userId).first(),
      // Previous week task stats
      db.prepare(`
        SELECT COUNT(*) as total_tasks,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
        FROM contact_tasks WHERE organization_id = ? AND user_id = ?
          AND created_at >= datetime('now', '-14 days') AND created_at < datetime('now', '-7 days')
      `).bind(orgId, userId).first(),
      // MVP case
      db.prepare(`
        SELECT c.id, c.treatment_type, c.amount, c.decision_score,
          p.name as patient_name, json_extract(c.feedback, '$.total_score') as consult_score
        FROM consultations c JOIN patients p ON c.patient_id = p.id
        WHERE c.organization_id = ? AND c.user_id = ? AND c.status = 'paid' AND c.consultation_date >= datetime('now', '-7 days')
        ORDER BY c.amount DESC LIMIT 1
      `).bind(orgId, userId).first(),
      // Recent consultations (today)
      db.prepare(`
        SELECT c.*, p.name as patient_name FROM consultations c
        JOIN patients p ON c.patient_id = p.id
        WHERE c.organization_id = ? AND c.user_id = ? AND date(c.consultation_date) = date('now')
        ORDER BY c.consultation_date DESC LIMIT 5
      `).bind(orgId, userId).all(),
      // Previous week KPI
      db.prepare(`
        SELECT COUNT(*) as total_consultations,
          SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_consultations,
          AVG(CASE WHEN ai_analysis_status = 'completed' THEN CAST(json_extract(feedback, '$.total_score') AS INTEGER) END) as avg_score
        FROM consultations WHERE organization_id = ? AND user_id = ?
          AND consultation_date >= datetime('now', '-14 days') AND consultation_date < datetime('now', '-7 days')
      `).bind(orgId, userId).first(),
      // Stale undecided alert (3+ days without contact)
      db.prepare(`
        SELECT COUNT(*) as count, SUM(COALESCE(c.amount, 0)) as total_amount
        FROM consultations c
        WHERE c.organization_id = ? AND c.user_id = ? AND c.status = 'undecided'
          AND julianday('now') - julianday(c.consultation_date) >= 3
          AND NOT EXISTS (SELECT 1 FROM contact_tasks t WHERE t.consultation_id = c.id AND t.status = 'completed')
      `).bind(orgId, userId).first(),
      // Today completed tasks
      db.prepare(`
        SELECT COUNT(*) as done FROM contact_tasks
        WHERE organization_id = ? AND user_id = ? AND status = 'completed' AND date(completed_at) = date('now')
      `).bind(orgId, userId).first()
    ]);

    // === COMPUTE ALL METRICS ===
    const goals = safeParseJSON(user?.goals as string, {});
    const monthlyTarget = (goals as any).monthly_revenue_target || 200000000;
    const weeklyTarget = Math.round(monthlyTarget / 4);

    const currentWeekDecided = (weekRevenue?.week_decided as number) || 0;
    const currentWeekConsulted = (weekRevenue?.week_consulted as number) || 0;
    const previousWeekDecided = (prevWeekRevenue?.prev_week_decided as number) || 0;
    const decidedTrend = previousWeekDecided > 0 
      ? Math.round(((currentWeekDecided - previousWeekDecided) / previousWeekDecided) * 100) : 0;

    const totalConsultations = (weekRevenue?.total_consultations as number) || 0;
    const paidConsultations = (weekRevenue?.paid_consultations as number) || 0;
    const prevTotalConsultations = (prevWeekKPI?.total_consultations as number) || 0;
    const prevPaidConsultations = (prevWeekKPI?.paid_consultations as number) || 0;
    const prevConversionRate = prevTotalConsultations > 0 ? Math.round((prevPaidConsultations / prevTotalConsultations) * 100) : 0;
    const prevAvgScore = Math.round((prevWeekKPI?.avg_score as number) || 0);
    const prevTotalTasks = (prevWeekTaskStats?.total_tasks as number) || 0;
    const prevCompletedTasks = (prevWeekTaskStats?.completed_tasks as number) || 0;
    const prevContactRate = prevTotalTasks > 0 ? Math.round((prevCompletedTasks / prevTotalTasks) * 100) : 0;
    const currentConversionRate = totalConsultations > 0 ? Math.round((paidConsultations / totalConsultations) * 100) : 0;
    const currentAvgScore = Math.round((weekRevenue?.avg_score as number) || 0);
    const currentContactRate = (weekTaskStats?.total_tasks as number) > 0
      ? Math.round(((weekTaskStats?.completed_tasks as number) / (weekTaskStats?.total_tasks as number)) * 100) : 0;

    const td = todayConsults || {} as any;
    const tm = todayTasks || {} as any;

    setCacheHeaders(c, 30); // Cache for 30s
    return c.json({
      success: true,
      data: {
        user: { name: user?.name, organization_name: user?.organization_name, goals },
        today: {
          total_consultations: (td.total as number) || 0,
          paid: (td.paid as number) || 0,
          undecided: (td.undecided as number) || 0,
          decided: (td.today_decided as number) || 0,
          consulted: (td.today_consulted as number) || 0,
        },
        today_tasks: { total: tm.total || 0, closing: tm.closing || 0, proactive: tm.proactive || 0 },
        today_mission: {
          contacts_done: (todayCompletedTasks?.done as number) || 0,
          contacts_total: (tm.total as number) || 0,
          consultations_done: (td.total as number) || 0,
          decisions_done: (td.paid as number) || 0,
        },
        stale_alert: { count: (staleUndecided?.count as number) || 0, amount: (staleUndecided?.total_amount as number) || 0 },
        week_stats: {
          total_consultations: totalConsultations, paid_consultations: paidConsultations,
          conversion_rate: currentConversionRate, avg_score: currentAvgScore,
          total_tasks: weekTaskStats?.total_tasks || 0, completed_tasks: weekTaskStats?.completed_tasks || 0,
          contact_rate: currentContactRate, decided: currentWeekDecided, consulted: currentWeekConsulted,
          decided_target: weeklyTarget, decided_trend: decidedTrend,
          prev_conversion_rate: prevConversionRate, prev_avg_score: prevAvgScore,
          prev_contact_rate: prevContactRate, prev_total_consultations: prevTotalConsultations,
        },
        sparkline: dailySparkline.results,
        mvp_case: mvpCase ? {
          id: mvpCase.id, patient_name: mvpCase.patient_name, treatment_type: mvpCase.treatment_type,
          amount: mvpCase.amount, decision_score: mvpCase.decision_score, consult_score: mvpCase.consult_score,
        } : null,
        recent_consultations: recentConsults.results.map(c => ({
          ...c, feedback: safeParseJSON(c.feedback as string, {})
        })),
      }
    });
  } catch (error) {
    console.error('Get summary error:', error);
    return c.json({ success: false, error: '대시보드 요약을 불러오는데 실패했습니다.' }, 500);
  }
});

// GET /api/dashboard/chart - Get chart data (SAFE: uses validated days)
dashboard.get('/chart', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;

    const { type = 'consultations', days: rawDays = '30' } = c.req.query();
    const days = safeInt(rawDays, 30, 1, 365);

    if (type === 'consultations') {
      const result = await db.prepare(`
        SELECT 
          date(consultation_date) as date,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
          SUM(CASE WHEN status = 'undecided' THEN 1 ELSE 0 END) as undecided
        FROM consultations
        WHERE organization_id = ? AND user_id = ?
          AND consultation_date >= datetime('now', '-' || ? || ' days')
        GROUP BY date(consultation_date)
        ORDER BY date ASC
      `).bind(orgId, userId, days).all();
      return c.json({ success: true, data: result.results });
    }

    if (type === 'scores') {
      const result = await db.prepare(`
        SELECT 
          date(consultation_date) as date,
          AVG(CAST(json_extract(feedback, '$.total_score') AS INTEGER)) as avg_score
        FROM consultations
        WHERE organization_id = ? AND user_id = ?
          AND ai_analysis_status = 'completed'
          AND consultation_date >= datetime('now', '-' || ? || ' days')
        GROUP BY date(consultation_date)
        ORDER BY date ASC
      `).bind(orgId, userId, days).all();
      return c.json({ success: true, data: result.results });
    }

    if (type === 'contacts') {
      const result = await db.prepare(`
        SELECT 
          date(created_at) as date,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
        FROM contact_tasks
        WHERE organization_id = ? AND user_id = ?
          AND created_at >= datetime('now', '-' || ? || ' days')
        GROUP BY date(created_at)
        ORDER BY date ASC
      `).bind(orgId, userId, days).all();
      return c.json({ success: true, data: result.results });
    }

    return c.json({ success: false, error: 'Invalid chart type' }, 400);
  } catch (error) {
    console.error('Get chart error:', error);
    return c.json({ success: false, error: '차트 데이터를 불러오는데 실패했습니다.' }, 500);
  }
});

// GET /api/dashboard/team - Get team comparison (admin only)
dashboard.get('/team', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const db = c.env.DB;

    // Get all users' stats
    const result = await db.prepare(`
      SELECT 
        u.id, u.name,
        COUNT(c.id) as total_consultations,
        SUM(CASE WHEN c.status = 'paid' THEN 1 ELSE 0 END) as paid_consultations,
        AVG(CASE WHEN c.ai_analysis_status = 'completed' THEN 
          CAST(json_extract(c.feedback, '$.total_score') AS INTEGER) 
        END) as avg_score,
        SUM(CASE WHEN c.status = 'paid' THEN c.amount ELSE 0 END) as total_amount
      FROM users u
      LEFT JOIN consultations c ON c.user_id = u.id 
        AND c.consultation_date >= datetime('now', '-30 days')
      WHERE u.organization_id = ?
      GROUP BY u.id, u.name
      ORDER BY paid_consultations DESC
    `).bind(orgId).all();

    return c.json({
      success: true,
      data: result.results.map(r => ({
        ...r,
        conversion_rate: (r.total_consultations as number) > 0
          ? Math.round(((r.paid_consultations as number) / (r.total_consultations as number)) * 100)
          : 0,
        avg_score: Math.round((r.avg_score as number) || 0)
      }))
    });
  } catch (error) {
    console.error('Get team stats error:', error);
    return c.json({ success: false, error: '팀 통계를 불러오는데 실패했습니다.' }, 500);
  }
});

// ============================================
// Admin Dashboard Endpoints
// ============================================

// GET /api/dashboard/admin-summary - Admin overview (OPTIMIZED)
dashboard.get('/admin-summary', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const db = c.env.DB;
    const { period = 'weekly' } = c.req.query();
    const daysBack = periodToDays(validateAdminPeriod(period));

    // Parallel queries
    const [currentStats, prevStats, proposalStats, prevProposalStats, contactStats] = await Promise.all([
      db.prepare(`
        SELECT COUNT(*) as total_consultations,
          SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_consultations,
          AVG(COALESCE(r.coaching_score, 0)) as avg_coaching_score
        FROM consultations c
        LEFT JOIN consultation_reports r ON c.id = r.consultation_id
        WHERE c.organization_id = ? AND c.consultation_date >= datetime('now', '-' || ? || ' days')
      `).bind(orgId, daysBack).first(),
      db.prepare(`
        SELECT COUNT(*) as total_consultations,
          SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_consultations,
          AVG(COALESCE(r.coaching_score, 0)) as avg_coaching_score
        FROM consultations c
        LEFT JOIN consultation_reports r ON c.id = r.consultation_id
        WHERE c.organization_id = ? 
          AND c.consultation_date >= datetime('now', '-' || ? || ' days')
          AND c.consultation_date < datetime('now', '-' || ? || ' days')
      `).bind(orgId, daysBack * 2, daysBack).first(),
      db.prepare(`
        SELECT COUNT(*) as total_sent,
          SUM(CASE WHEN status IN ('viewed', 'converted') THEN 1 ELSE 0 END) as viewed,
          SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted
        FROM treatment_proposals
        WHERE organization_id = ? AND sent_at >= datetime('now', '-' || ? || ' days')
      `).bind(orgId, daysBack).first(),
      db.prepare(`
        SELECT COUNT(*) as total_sent,
          SUM(CASE WHEN status IN ('viewed', 'converted') THEN 1 ELSE 0 END) as viewed
        FROM treatment_proposals
        WHERE organization_id = ? 
          AND sent_at >= datetime('now', '-' || ? || ' days') AND sent_at < datetime('now', '-' || ? || ' days')
      `).bind(orgId, daysBack * 2, daysBack).first(),
      // Contact rate query
      db.prepare(`
        SELECT 
          (SELECT COUNT(DISTINCT patient_id) FROM retention_contacts WHERE organization_id = ? AND contacted_at >= datetime('now', '-' || ? || ' days')) as contacted,
          (SELECT COUNT(*) FROM patient_retention_status WHERE organization_id = ? AND status NOT IN ('active', 'completed', 'in_treatment')) as need_contact
      `).bind(orgId, daysBack, orgId).first()
    ]);

    // Calculate metrics
    const totalConsults = (currentStats?.total_consultations as number) || 0;
    const paidConsults = (currentStats?.paid_consultations as number) || 0;
    const conversionRate = totalConsults > 0 ? (paidConsults / totalConsults) * 100 : 0;

    const prevTotalConsults = (prevStats?.total_consultations as number) || 0;
    const prevPaidConsults = (prevStats?.paid_consultations as number) || 0;
    const prevConversionRate = prevTotalConsults > 0 ? (prevPaidConsults / prevTotalConsults) * 100 : 0;

    const totalProposals = (proposalStats?.total_sent as number) || 0;
    const viewedProposals = (proposalStats?.viewed as number) || 0;
    const proposalViewRate = totalProposals > 0 ? (viewedProposals / totalProposals) * 100 : 0;

    const prevTotalProposals = (prevProposalStats?.total_sent as number) || 0;
    const prevViewedProposals = (prevProposalStats?.viewed as number) || 0;
    const prevProposalViewRate = prevTotalProposals > 0 ? (prevViewedProposals / prevTotalProposals) * 100 : 0;

    const needContact = (contactStats?.need_contact as number) || 0;
    const contacted = (contactStats?.contacted as number) || 0;
    const contactRate = needContact > 0 ? Math.round(contacted / needContact * 100) : 0;

    return c.json({
      success: true,
      data: {
        total_consultations: totalConsults,
        conversion_rate: conversionRate,
        avg_coaching_score: (currentStats?.avg_coaching_score as number) || 0,
        proposal_view_rate: proposalViewRate,
        contact_rate: contactRate,
        // Trends (percentage change)
        consultation_trend: prevTotalConsults > 0 
          ? ((totalConsults - prevTotalConsults) / prevTotalConsults) * 100 : 0,
        conversion_trend: prevConversionRate > 0 
          ? conversionRate - prevConversionRate : 0,
        coaching_trend: (prevStats?.avg_coaching_score as number) > 0 
          ? ((currentStats?.avg_coaching_score as number) || 0) - ((prevStats?.avg_coaching_score as number) || 0) : 0,
        proposal_trend: prevProposalViewRate > 0 
          ? proposalViewRate - prevProposalViewRate : 0
      }
    });
  } catch (error) {
    console.error('Admin summary error:', error);
    return c.json({ success: false, error: '대시보드 요약을 불러오는데 실패했습니다.' }, 500);
  }
});

// GET /api/dashboard/staff-performance - Staff performance list
dashboard.get('/staff-performance', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const db = c.env.DB;
    const { period = 'weekly' } = c.req.query();
    const daysBack = periodToDays(validateAdminPeriod(period));

    const result = await db.prepare(`
      SELECT 
        u.id, u.name,
        COUNT(c.id) as total_consultations,
        SUM(CASE WHEN c.status = 'paid' THEN 1 ELSE 0 END) as paid_consultations,
        AVG(COALESCE(r.coaching_score, 0)) as avg_coaching_score,
        SUM(CASE WHEN c.status = 'paid' THEN c.amount ELSE 0 END) as total_amount
      FROM users u
      LEFT JOIN consultations c ON c.user_id = u.id 
        AND c.consultation_date >= datetime('now', '-' || ? || ' days')
      LEFT JOIN consultation_reports r ON c.id = r.consultation_id
      WHERE u.organization_id = ?
      GROUP BY u.id, u.name
      ORDER BY paid_consultations DESC
    `).bind(daysBack, orgId).all();

    return c.json({
      success: true,
      data: result.results.map(r => ({
        id: r.id,
        name: r.name,
        total_consultations: r.total_consultations || 0,
        paid_consultations: r.paid_consultations || 0,
        conversion_rate: (r.total_consultations as number) > 0
          ? ((r.paid_consultations as number) / (r.total_consultations as number)) * 100
          : 0,
        avg_coaching_score: r.avg_coaching_score || 0,
        total_amount: r.total_amount || 0
      }))
    });
  } catch (error) {
    console.error('Staff performance error:', error);
    return c.json({ success: false, error: '상담사 성과를 불러오는데 실패했습니다.' }, 500);
  }
});

// GET /api/dashboard/coaching-breakdown - Coaching area averages
dashboard.get('/coaching-breakdown', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const db = c.env.DB;
    const { period = 'weekly' } = c.req.query();
    const daysBack = periodToDays(validateAdminPeriod(period));

    const result = await db.prepare(`
      SELECT 
        AVG(CAST(json_extract(r.coaching_feedback, '$.scores.rapport') AS REAL)) as rapport,
        AVG(CAST(json_extract(r.coaching_feedback, '$.scores.spin') AS REAL)) as spin,
        AVG(CAST(json_extract(r.coaching_feedback, '$.scores.objection_handling') AS REAL)) as objection,
        AVG(CAST(json_extract(r.coaching_feedback, '$.scores.pricing_framing') AS REAL)) as pricing,
        AVG(CAST(json_extract(r.coaching_feedback, '$.scores.closing') AS REAL)) as closing,
        AVG(CAST(json_extract(r.coaching_feedback, '$.scores.structure') AS REAL)) as structure
      FROM consultation_reports r
      JOIN consultations c ON r.consultation_id = c.id
      WHERE r.organization_id = ? 
        AND c.consultation_date >= datetime('now', '-' || ? || ' days')
    `).bind(orgId, daysBack).first();

    return c.json({
      success: true,
      data: {
        rapport: result?.rapport || 0,
        spin: result?.spin || 0,
        objection: result?.objection || 0,
        pricing: result?.pricing || 0,
        closing: result?.closing || 0,
        structure: result?.structure || 0
      }
    });
  } catch (error) {
    console.error('Coaching breakdown error:', error);
    return c.json({ success: false, error: '코칭 분석을 불러오는데 실패했습니다.' }, 500);
  }
});

// GET /api/dashboard/low-score-consultations - Consultations needing coaching
dashboard.get('/low-score-consultations', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const db = c.env.DB;
    const { threshold = '70', limit = '10' } = c.req.query();

    const result = await db.prepare(`
      SELECT 
        c.id, c.consultation_date, c.patient_id,
        p.name as patient_name,
        u.name as user_name,
        r.coaching_score,
        json_extract(r.coaching_feedback, '$.improvements[0].issue') as improvement_needed
      FROM consultations c
      JOIN consultation_reports r ON c.id = r.consultation_id
      LEFT JOIN patients p ON c.patient_id = p.id
      JOIN users u ON c.user_id = u.id
      WHERE c.organization_id = ? 
        AND r.coaching_score < ?
      ORDER BY c.consultation_date DESC
      LIMIT ?
    `).bind(orgId, parseInt(threshold), parseInt(limit)).all();

    return c.json({
      success: true,
      data: result.results
    });
  } catch (error) {
    console.error('Low score consultations error:', error);
    return c.json({ success: false, error: '코칭 필요 상담을 불러오는데 실패했습니다.' }, 500);
  }
});

// GET /api/dashboard/proposal-analytics - Proposal statistics
dashboard.get('/proposal-analytics', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const db = c.env.DB;
    const { period = 'weekly' } = c.req.query();
    const daysBack = periodToDays(validateAdminPeriod(period));

    const result = await db.prepare(`
      SELECT 
        COUNT(CASE WHEN status IN ('sent', 'viewed', 'converted') THEN 1 END) as sent,
        COUNT(CASE WHEN status IN ('viewed', 'converted') THEN 1 END) as viewed,
        COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted
      FROM treatment_proposals
      WHERE organization_id = ?
        AND created_at >= datetime('now', '-' || ? || ' days')
    `).bind(orgId, daysBack).first();

    return c.json({
      success: true,
      data: {
        sent: result?.sent || 0,
        viewed: result?.viewed || 0,
        converted: result?.converted || 0
      }
    });
  } catch (error) {
    console.error('Proposal analytics error:', error);
    return c.json({ success: false, error: '제안서 통계를 불러오는데 실패했습니다.' }, 500);
  }
});

// GET /api/dashboard/today-contacts - 오늘 연락해야 할 환자 통합 리스트 (OPTIMIZED: parallel queries)
dashboard.get('/today-contacts', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;

    const today = new Date().toISOString().split('T')[0];
    const contacts: any[] = [];

    // === PARALLEL: Run all 3 source queries at once ===
    const [pendingTasks, noTaskUndecided, retentionNeed] = await Promise.all([
      // 1. contact_tasks: 오늘 이전까지 pending인 클로징/안부 태스크
      db.prepare(`
        SELECT t.id as task_id, t.task_type, t.recommended_date, t.recommended_message, t.points,
               p.id as patient_id, p.name as patient_name, p.phone as patient_phone, p.referral_source, p.region,
               c.treatment_type, c.amount, c.decision_score, c.consultation_date,
               (SELECT MAX(ct2.completed_at) FROM contact_tasks ct2 
                WHERE ct2.patient_id = p.id AND ct2.status = 'completed') as last_contact_date
        FROM contact_tasks t
        JOIN patients p ON t.patient_id = p.id
        LEFT JOIN consultations c ON t.consultation_id = c.id
        WHERE t.organization_id = ? AND t.user_id = ?
          AND t.status = 'pending'
          AND t.recommended_date <= ?
        ORDER BY t.task_type = 'closing' DESC, t.recommended_date ASC
      `).bind(orgId, userId, today).all(),
      // 2. 미결정 상담인데 아직 태스크가 없는 환자 (1일 이상 경과)
      db.prepare(`
        SELECT c.id as consultation_id, c.treatment_type, c.amount, c.decision_score, c.consultation_date,
               p.id as patient_id, p.name as patient_name, p.phone as patient_phone, p.referral_source, p.region,
               CAST(julianday('now') - julianday(c.consultation_date) AS INTEGER) as days_passed
        FROM consultations c
        JOIN patients p ON c.patient_id = p.id
        WHERE c.organization_id = ? AND c.user_id = ?
          AND c.status = 'undecided'
          AND julianday('now') - julianday(c.consultation_date) >= 1
          AND NOT EXISTS (
            SELECT 1 FROM contact_tasks t 
            WHERE t.consultation_id = c.id AND t.status = 'pending'
          )
        ORDER BY c.decision_score DESC, days_passed DESC
        LIMIT 10
      `).bind(orgId, userId).all(),
      // 3. 리텐션 연락 필요 환자 (이탈위험, 미예약 등)
      db.prepare(`
        SELECT r.status as retention_status, r.days_since_visit, r.risk_score, r.remaining_treatment_value,
               r.recommended_contact_script,
               p.id as patient_id, p.name as patient_name, p.phone as patient_phone, p.referral_source, p.region
        FROM patient_retention_status r
        JOIN patients p ON r.patient_id = p.id
        WHERE r.organization_id = ?
          AND r.status IN ('unscheduled_urgent', 'unscheduled_warning', 'at_risk', 'consulted_unconverted')
          AND NOT EXISTS (
            SELECT 1 FROM retention_contacts rc 
            WHERE rc.patient_id = p.id AND date(rc.contacted_at) >= date('now', '-3 days')
          )
        ORDER BY r.priority_score DESC
        LIMIT 10
      `).bind(orgId).all()
    ]);

    for (const t of pendingTasks.results) {
      const daysPassed = Math.floor((Date.now() - new Date(t.recommended_date as string).getTime()) / 86400000);
      contacts.push({
        source: 'task',
        task_id: t.task_id,
        task_type: t.task_type,
        patient_id: t.patient_id,
        patient_name: t.patient_name,
        patient_phone: t.patient_phone,
        referral_source: t.referral_source,
        region: t.region,
        treatment_type: t.treatment_type,
        amount: t.amount,
        decision_score: t.decision_score,
        recommended_message: t.recommended_message,
        points: safeParseJSON(t.points as string, []),
        days_overdue: daysPassed,
        last_contact_date: t.last_contact_date || null,
        urgency: t.task_type === 'closing' ? (daysPassed > 3 ? 'critical' : 'high') : 'medium',
        reason: t.task_type === 'closing' 
          ? '미결정 클로징 (예정일' + (daysPassed > 0 ? ' ' + daysPassed + '일 초과' : ' 오늘') + ')' 
          : '안부 연락'
      });
    }

    // === PROCESS SOURCE 2: Undecided without tasks ===

    for (const c of noTaskUndecided.results) {
      const dp = c.days_passed as number;
      const ds = (c.decision_score as number) || 5;
      const amt = (c.amount as number) || 0;
      
      // Smart urgency calculation based on multiple factors
      let urgencyScore = 0;
      if (amt >= 5000000) urgencyScore += 3;
      else if (amt >= 1000000) urgencyScore += 2;
      if (ds >= 7) urgencyScore += 3;
      else if (ds >= 5) urgencyScore += 2;
      if (dp >= 5) urgencyScore += 3;
      else if (dp >= 3) urgencyScore += 2;
      else urgencyScore += 1;
      
      const smartUrgency = urgencyScore >= 7 ? 'critical' : urgencyScore >= 4 ? 'high' : 'medium';
      
      contacts.push({
        source: 'undecided',
        consultation_id: c.consultation_id,
        patient_id: c.patient_id,
        patient_name: c.patient_name,
        patient_phone: c.patient_phone,
        referral_source: c.referral_source,
        region: c.region,
        treatment_type: c.treatment_type,
        amount: c.amount,
        decision_score: c.decision_score,
        days_passed: dp,
        urgency: smartUrgency,
        reason: '미결정 ' + dp + '일 경과' + (ds >= 7 ? ' (결정도 높음!)' : amt >= 5000000 ? ' (고액 상담)' : '')
      });
    }

    // === PROCESS SOURCE 3: Retention contacts ===

    const retStatusLabel: Record<string, string> = {
      unscheduled_urgent: '미예약 긴급',
      unscheduled_warning: '미예약 주의',
      at_risk: '이탈 위험',
      consulted_unconverted: '상담 미전환'
    };

    for (const r of retentionNeed.results) {
      // 이미 같은 환자가 contacts에 있으면 스킵
      if (contacts.find(c => c.patient_id === r.patient_id)) continue;

      contacts.push({
        source: 'retention',
        patient_id: r.patient_id,
        patient_name: r.patient_name,
        patient_phone: r.patient_phone,
        referral_source: r.referral_source,
        region: r.region,
        retention_status: r.retention_status,
        days_since_visit: r.days_since_visit,
        risk_score: r.risk_score,
        remaining_value: r.remaining_treatment_value,
        recommended_script: r.recommended_contact_script,
        urgency: (r.risk_score as number) >= 70 ? 'critical' : (r.risk_score as number) >= 40 ? 'high' : 'medium',
        reason: (retStatusLabel[r.retention_status as string] || '리텐션') + ' (' + r.days_since_visit + '일 미내원)'
      });
    }

    // urgency 순 정렬: critical > high > medium
    const urgencyOrder: Record<string, number> = { critical: 0, high: 1, medium: 2 };
    contacts.sort((a, b) => (urgencyOrder[a.urgency] || 2) - (urgencyOrder[b.urgency] || 2));

    return c.json({
      success: true,
      data: {
        contacts: maskPatientData(contacts),
        total: contacts.length,
        critical_count: contacts.filter(c => c.urgency === 'critical').length,
        high_count: contacts.filter(c => c.urgency === 'high').length
      }
    });
  } catch (error) {
    console.error('Today contacts error:', error);
    return c.json({ success: false, error: '오늘 연락 목록을 불러오는데 실패했습니다.' }, 500);
  }
});

// ============================================
// Report Analysis Endpoints (경로별/치료항목별)
// ============================================

// GET /api/dashboard/referral-roi - 내원경로별 ROI 분석
dashboard.get('/referral-roi', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;
    const { period = 'month' } = c.req.query();
    const daysBack = periodToDays(validatePeriod(period));

    const result = await db.prepare(`
      SELECT 
        COALESCE(p.referral_source, '미분류') as referral_source,
        COUNT(c.id) as total_consultations,
        SUM(CASE WHEN c.status = 'paid' THEN 1 ELSE 0 END) as paid_consultations,
        SUM(CASE WHEN c.status = 'undecided' THEN 1 ELSE 0 END) as undecided_consultations,
        SUM(CASE WHEN c.status = 'lost' THEN 1 ELSE 0 END) as lost_consultations,
        SUM(CASE WHEN c.status = 'paid' THEN c.amount ELSE 0 END) as paid_amount,
        SUM(COALESCE(c.amount, 0)) as total_amount,
        AVG(CASE WHEN c.ai_analysis_status = 'completed' THEN 
          CAST(json_extract(c.feedback, '$.total_score') AS REAL) 
        END) as avg_score,
        AVG(c.decision_score) as avg_decision_score,
        COUNT(DISTINCT p.id) as unique_patients
      FROM consultations c
      JOIN patients p ON c.patient_id = p.id
      WHERE c.organization_id = ? AND c.user_id = ?
        AND c.consultation_date >= datetime('now', '-' || ? || ' days')
      GROUP BY COALESCE(p.referral_source, '미분류')
      ORDER BY paid_amount DESC
    `).bind(orgId, userId, daysBack).all();

    const data = result.results.map(r => {
      const total = (r.total_consultations as number) || 0;
      const paid = (r.paid_consultations as number) || 0;
      return {
        referral_source: r.referral_source,
        total_consultations: total,
        paid_consultations: paid,
        undecided_consultations: r.undecided_consultations || 0,
        lost_consultations: r.lost_consultations || 0,
        conversion_rate: total > 0 ? Math.round((paid / total) * 100) : 0,
        paid_amount: r.paid_amount || 0,
        total_amount: r.total_amount || 0,
        avg_score: Math.round((r.avg_score as number) || 0),
        avg_decision_score: Math.round(((r.avg_decision_score as number) || 0) * 10) / 10,
        unique_patients: r.unique_patients || 0,
        // ROI = paid_amount / total_consultations (단가)
        revenue_per_consult: total > 0 ? Math.round(((r.paid_amount as number) || 0) / total) : 0
      };
    });

    return c.json({ success: true, data, period });
  } catch (error) {
    console.error('Referral ROI error:', error);
    return c.json({ success: false, error: '내원경로 분석에 실패했습니다.' }, 500);
  }
});

// GET /api/dashboard/treatment-analysis - 치료항목별 전환율 분석
dashboard.get('/treatment-analysis', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;
    const { period = 'month' } = c.req.query();
    const daysBack = periodToDays(validatePeriod(period));

    const result = await db.prepare(`
      SELECT 
        COALESCE(c.treatment_type, '미분류') as treatment_type,
        COUNT(c.id) as total_consultations,
        SUM(CASE WHEN c.status = 'paid' THEN 1 ELSE 0 END) as paid_consultations,
        SUM(CASE WHEN c.status = 'undecided' THEN 1 ELSE 0 END) as undecided_consultations,
        SUM(CASE WHEN c.status = 'lost' THEN 1 ELSE 0 END) as lost_consultations,
        SUM(CASE WHEN c.status = 'paid' THEN c.amount ELSE 0 END) as paid_amount,
        SUM(COALESCE(c.amount, 0)) as total_amount,
        AVG(c.amount) as avg_amount,
        AVG(CASE WHEN c.ai_analysis_status = 'completed' THEN 
          CAST(json_extract(c.feedback, '$.total_score') AS REAL) 
        END) as avg_score,
        AVG(c.decision_score) as avg_decision_score
      FROM consultations c
      WHERE c.organization_id = ? AND c.user_id = ?
        AND c.consultation_date >= datetime('now', '-' || ? || ' days')
      GROUP BY COALESCE(c.treatment_type, '미분류')
      ORDER BY paid_amount DESC
    `).bind(orgId, userId, daysBack).all();

    const data = result.results.map(r => {
      const total = (r.total_consultations as number) || 0;
      const paid = (r.paid_consultations as number) || 0;
      return {
        treatment_type: r.treatment_type,
        total_consultations: total,
        paid_consultations: paid,
        undecided_consultations: r.undecided_consultations || 0,
        lost_consultations: r.lost_consultations || 0,
        conversion_rate: total > 0 ? Math.round((paid / total) * 100) : 0,
        paid_amount: r.paid_amount || 0,
        total_amount: r.total_amount || 0,
        avg_amount: Math.round((r.avg_amount as number) || 0),
        avg_score: Math.round((r.avg_score as number) || 0),
        avg_decision_score: Math.round(((r.avg_decision_score as number) || 0) * 10) / 10
      };
    });

    return c.json({ success: true, data, period });
  } catch (error) {
    console.error('Treatment analysis error:', error);
    return c.json({ success: false, error: '치료항목 분석에 실패했습니다.' }, 500);
  }
});

// GET /api/dashboard/revenue-trend - 매출 추이 (일별)
dashboard.get('/revenue-trend', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;
    const { days: rawDays = '30' } = c.req.query();
    const days = safeInt(rawDays, 30, 1, 365);

    const result = await db.prepare(`
      SELECT 
        date(consultation_date) as date,
        COUNT(*) as total_consultations,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_consultations,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_amount,
        SUM(COALESCE(amount, 0)) as total_amount,
        AVG(CASE WHEN ai_analysis_status = 'completed' THEN 
          CAST(json_extract(feedback, '$.total_score') AS REAL) 
        END) as avg_score
      FROM consultations
      WHERE organization_id = ? AND user_id = ?
        AND consultation_date >= datetime('now', '-' || ? || ' days')
      GROUP BY date(consultation_date)
      ORDER BY date ASC
    `).bind(orgId, userId, days).all();

    return c.json({
      success: true,
      data: result.results.map(r => ({
        date: r.date,
        total_consultations: r.total_consultations || 0,
        paid_consultations: r.paid_consultations || 0,
        paid_amount: r.paid_amount || 0,
        total_amount: r.total_amount || 0,
        avg_score: Math.round((r.avg_score as number) || 0),
        conversion_rate: (r.total_consultations as number) > 0
          ? Math.round(((r.paid_consultations as number) || 0) / (r.total_consultations as number) * 100)
          : 0
      }))
    });
  } catch (error) {
    console.error('Revenue trend error:', error);
    return c.json({ success: false, error: '매출 추이 조회에 실패했습니다.' }, 500);
  }
});

// ============================================
// FEATURE 7: Period Comparison KPI
// ============================================
dashboard.get('/period-compare', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;
    const { period = 'week' } = c.req.query();
    const daysBack = periodToDays(validatePeriod(period));

    const getStats = async (startDays: number, endDays: number) => {
      const r = await db.prepare(`
        SELECT 
          COUNT(*) as total, 
          SUM(CASE WHEN status='paid' THEN 1 ELSE 0 END) as paid,
          SUM(CASE WHEN status='paid' THEN amount ELSE 0 END) as revenue,
          AVG(CASE WHEN ai_analysis_status='completed' THEN CAST(json_extract(feedback,'$.total_score') AS REAL) END) as avg_score
        FROM consultations
        WHERE organization_id=? AND user_id=? 
          AND consultation_date >= datetime('now', '-' || ? || ' days') 
          AND consultation_date < datetime('now', '-' || ? || ' days')
      `).bind(orgId, userId, startDays, endDays).first();
      return {
        total: (r?.total as number) || 0,
        paid: (r?.paid as number) || 0,
        revenue: (r?.revenue as number) || 0,
        avg_score: Math.round((r?.avg_score as number) || 0),
        conversion: (r?.total as number) > 0 ? Math.round(((r?.paid as number) || 0) / (r?.total as number) * 100) : 0
      };
    };

    const current = await getStats(daysBack, 0);
    const previous = await getStats(daysBack * 2, daysBack);

    const pctChange = (cur: number, prev: number) => prev > 0 ? Math.round(((cur - prev) / prev) * 100) : (cur > 0 ? 100 : 0);

    return c.json({
      success: true,
      data: {
        period,
        current,
        previous,
        changes: {
          revenue: pctChange(current.revenue, previous.revenue),
          total: pctChange(current.total, previous.total),
          paid: pctChange(current.paid, previous.paid),
          conversion: current.conversion - previous.conversion,
          avg_score: current.avg_score - previous.avg_score
        }
      }
    });
  } catch (error) {
    console.error('Period compare error:', error);
    return c.json({ success: false, error: '기간 비교 데이터 조회에 실패했습니다.' }, 500);
  }
});

// ============================================
// FEATURE 8: Smart Contact Scheduling
// ============================================
dashboard.get('/smart-schedule', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;

    // Get undecided consultations with AI-recommended contact times
    const undecided = await db.prepare(`
      SELECT c.id, c.patient_id, c.treatment_type, c.amount, c.decision_score,
             c.consultation_date, c.status,
             p.name as patient_name, p.phone as patient_phone,
             CAST(julianday('now') - julianday(c.consultation_date) AS INTEGER) as days_passed,
             (SELECT MAX(rc.contacted_at) FROM retention_contacts rc WHERE rc.patient_id = c.patient_id) as last_contact,
             (SELECT COUNT(*) FROM contact_tasks ct WHERE ct.patient_id = c.patient_id AND ct.status='completed') as contact_count
      FROM consultations c
      JOIN patients p ON c.patient_id = p.id
      WHERE c.organization_id=? AND c.user_id=? AND c.status='undecided'
      ORDER BY c.decision_score DESC, c.amount DESC
      LIMIT 20
    `).bind(orgId, userId).all();

    const schedule = undecided.results.map((c: any) => {
      const dp = c.days_passed || 0;
      const ds = c.decision_score || 5;
      const amt = c.amount || 0;
      const cc = c.contact_count || 0;

      // AI scoring: higher score = contact sooner
      // Factors: decision_score (high = ready), days_passed (sweet spot 2-5 days), amount, contact_count
      let urgency = 0;
      if (ds >= 8) urgency += 40;
      else if (ds >= 6) urgency += 25;
      else urgency += 10;

      if (dp >= 2 && dp <= 5) urgency += 30; // Golden window
      else if (dp >= 6 && dp <= 10) urgency += 20;
      else if (dp > 10) urgency += 15;
      else urgency += 5; // too soon

      if (amt >= 5000000) urgency += 20;
      else if (amt >= 2000000) urgency += 10;

      if (cc === 0) urgency += 10; // Never contacted

      // Recommended time
      let recommendedDay = 'today';
      let reason = '';
      if (ds >= 8 && dp >= 2) {
        recommendedDay = 'today';
        reason = '결정도 높음! 지금 연락이 최적';
      } else if (dp < 2) {
        recommendedDay = 'tomorrow';
        reason = '상담 직후, 하루 뒤 연락 추천';
      } else if (dp >= 7) {
        recommendedDay = 'today';
        reason = dp + '일 경과 - 이탈 방지 긴급';
      } else {
        recommendedDay = 'today';
        reason = '연락 적기 (2-5일 골든타임)';
      }

      // Best time of day
      let bestTime = '10:00-11:30';
      if (amt >= 5000000) bestTime = '14:00-16:00'; // High-value: afternoon (more time)
      
      return {
        consultation_id: c.id,
        patient_id: c.patient_id,
        patient_name: c.patient_name,
        patient_phone: c.patient_phone,
        treatment_type: c.treatment_type,
        amount: c.amount,
        decision_score: c.decision_score,
        days_passed: dp,
        contact_count: cc,
        last_contact: c.last_contact,
        urgency_score: urgency,
        recommended_day: recommendedDay,
        recommended_time: bestTime,
        reason: reason
      };
    });

    schedule.sort((a: any, b: any) => b.urgency_score - a.urgency_score);

    return c.json({ success: true, data: schedule });
  } catch (error) {
    console.error('Smart schedule error:', error);
    return c.json({ success: false, error: '스마트 스케줄 조회에 실패했습니다.' }, 500);
  }
});

// ============================================
// FEATURE 9: Consultation Comparison
// ============================================
dashboard.get('/consultation-compare/:patientId', async (c) => {
  try {
    const patientId = c.req.param('patientId');
    const orgId = c.get('organizationId');
    const db = c.env.DB;

    const consults = await db.prepare(`
      SELECT c.*, u.name as user_name
      FROM consultations c
      JOIN users u ON c.user_id = u.id
      WHERE c.patient_id=? AND c.organization_id=?
      ORDER BY c.consultation_date ASC
    `).bind(patientId, orgId).all();

    if (consults.results.length < 2) {
      return c.json({ success: true, data: { items: consults.results.map(c => ({...c, feedback: safeParseJSON(c.feedback as string, {}), emotion_flow: safeParseJSON(c.emotion_flow as string, {})})), comparison: null } });
    }

    const first = consults.results[0];
    const last = consults.results[consults.results.length - 1];

    const fb1 = safeParseJSON(first.feedback as string, {} as any);
    const fb2 = safeParseJSON(last.feedback as string, {} as any);

    const comparison = {
      first: {
        id: first.id, date: first.consultation_date, status: first.status,
        treatment_type: first.treatment_type, amount: first.amount,
        decision_score: first.decision_score,
        total_score: fb1.total_score || 0,
        feedback: fb1
      },
      last: {
        id: last.id, date: last.consultation_date, status: last.status,
        treatment_type: last.treatment_type, amount: last.amount,
        decision_score: last.decision_score,
        total_score: fb2.total_score || 0,
        feedback: fb2
      },
      improvements: {
        decision_score: (last.decision_score as number || 0) - (first.decision_score as number || 0),
        total_score: (fb2.total_score || 0) - (fb1.total_score || 0),
        status_changed: first.status !== last.status
      },
      total_consultations: consults.results.length
    };

    return c.json({
      success: true,
      data: {
        items: consults.results.map(c => ({...c, feedback: safeParseJSON(c.feedback as string, {}), emotion_flow: safeParseJSON(c.emotion_flow as string, {})})),
        comparison
      }
    });
  } catch (error) {
    console.error('Consultation compare error:', error);
    return c.json({ success: false, error: '상담 비교 데이터 조회에 실패했습니다.' }, 500);
  }
});

// ============================================
// FEATURE 11: Data Export (CSV format for Excel)
// ============================================
// ============================================
// FEATURE 11: Data Export (CSV format for Excel)
// ============================================

// ============================================
// FEATURE 13: Coaching Score Trend (Weekly per-staff)
// ============================================
dashboard.get('/coaching-trend', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const db = c.env.DB;
    const { weeks: rawWeeks = '8', user_id } = c.req.query();
    const weeks = safeInt(rawWeeks, 8, 1, 52);

    let userFilter = '';
    const params: (string | number)[] = [orgId, weeks * 7];
    if (user_id) {
      userFilter = 'AND c.user_id = ?';
      params.push(user_id);
    }

    // Weekly coaching scores by area
    const result = await db.prepare(`
      SELECT 
        strftime('%Y-W%W', c.consultation_date) as week_label,
        MIN(date(c.consultation_date, 'weekday 1', '-6 days')) as week_start,
        COUNT(c.id) as consultation_count,
        ROUND(AVG(r.coaching_score), 1) as avg_total_score,
        ROUND(AVG(CAST(json_extract(r.coaching_feedback, '$.scores.rapport') AS REAL)), 1) as rapport,
        ROUND(AVG(CAST(json_extract(r.coaching_feedback, '$.scores.spin') AS REAL)), 1) as spin,
        ROUND(AVG(CAST(json_extract(r.coaching_feedback, '$.scores.objection_handling') AS REAL)), 1) as objection,
        ROUND(AVG(CAST(json_extract(r.coaching_feedback, '$.scores.pricing_framing') AS REAL)), 1) as pricing,
        ROUND(AVG(CAST(json_extract(r.coaching_feedback, '$.scores.closing') AS REAL)), 1) as closing,
        ROUND(AVG(CAST(json_extract(r.coaching_feedback, '$.scores.structure') AS REAL)), 1) as structure
      FROM consultations c
      JOIN consultation_reports r ON c.id = r.consultation_id
      WHERE c.organization_id = ? 
        AND c.consultation_date >= datetime('now', '-' || ? || ' days')
        ${userFilter}
      GROUP BY week_label
      ORDER BY week_start ASC
    `).bind(...params).all();

    // Find biggest improvement and weakest area
    const weeks_data = result.results;
    let biggestImprovement = null;
    let weakestArea = null;

    if (weeks_data.length >= 2) {
      const first = weeks_data[0] as any;
      const last = weeks_data[weeks_data.length - 1] as any;
      const areas = ['rapport', 'spin', 'objection', 'pricing', 'closing', 'structure'];
      const areaLabels: Record<string, string> = {
        rapport: '라포형성', spin: 'SPIN질문', objection: '반론처리',
        pricing: '가격프레이밍', closing: '클로징', structure: '상담구조'
      };

      let maxGain = -100, maxGainArea = '';
      let minScore = 101, minScoreArea = '';
      for (const a of areas) {
        const diff = (last[a] || 0) - (first[a] || 0);
        if (diff > maxGain) { maxGain = diff; maxGainArea = a; }
        if ((last[a] || 0) < minScore) { minScore = last[a] || 0; minScoreArea = a; }
      }
      biggestImprovement = { area: maxGainArea, label: areaLabels[maxGainArea], change: maxGain };
      weakestArea = { area: minScoreArea, label: areaLabels[minScoreArea], score: minScore };
    }

    return c.json({
      success: true,
      data: {
        weeks: weeks_data,
        insights: { biggest_improvement: biggestImprovement, weakest_area: weakestArea }
      }
    });
  } catch (error) {
    console.error('Coaching trend error:', error);
    return c.json({ success: false, error: '코칭 트렌드 조회에 실패했습니다.' }, 500);
  }
});

// ============================================
// FEATURE 15: Growth Tracker - Session-by-session score history
// ============================================
dashboard.get('/growth-sessions', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;
    const { limit: rawLimit = '20' } = c.req.query();
    const limit = safeInt(rawLimit, 20, 1, 100);

    // Individual session scores in reverse chronological order
    const sessions = await db.prepare(`
      SELECT 
        c.id, c.consultation_date, c.treatment_type, c.amount,
        p.name as patient_name,
        r.coaching_score as total_score,
        json_extract(r.coaching_feedback, '$.scores.rapport') as rapport,
        json_extract(r.coaching_feedback, '$.scores.spin') as spin,
        json_extract(r.coaching_feedback, '$.scores.objection_handling') as objection,
        json_extract(r.coaching_feedback, '$.scores.pricing_framing') as pricing,
        json_extract(r.coaching_feedback, '$.scores.closing') as closing,
        json_extract(r.coaching_feedback, '$.scores.structure') as structure,
        json_extract(r.coaching_feedback, '$.patient_code_evaluation') as grade_text,
        json_extract(r.coaching_feedback, '$.improvements[0].issue') as top_improvement,
        json_extract(r.coaching_feedback, '$.strengths[0]') as top_strength,
        r.id as report_id
      FROM consultations c
      JOIN consultation_reports r ON c.id = r.consultation_id
      LEFT JOIN patients p ON c.patient_id = p.id
      WHERE c.organization_id = ? AND c.user_id = ? AND r.coaching_score > 0
      ORDER BY c.consultation_date DESC
      LIMIT ?
    `).bind(orgId, userId, limit).all();

    // Calculate running averages and streaks
    const data = sessions.results.reverse(); // chronological order
    let runningTotal = 0;
    let bestStreak = 0;
    let currentStreak = 0;
    let prevScore = 0;
    let personalBest = 0;

    const processed = data.map((s: any, i: number) => {
      runningTotal += (s.total_score || 0);
      const runningAvg = runningTotal / (i + 1);
      
      if (s.total_score > personalBest) personalBest = s.total_score;
      
      // Track improvement streak
      if (i > 0 && s.total_score >= prevScore) {
        currentStreak++;
        if (currentStreak > bestStreak) bestStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
      prevScore = s.total_score || 0;

      // Extract grade from grade_text
      let grade = '';
      if (s.grade_text) {
        const m = String(s.grade_text).match(/등급[：:]\s*([SABCD])/i);
        if (m) grade = m[1].toUpperCase();
      }

      return {
        ...s,
        running_avg: Math.round(runningAvg * 10) / 10,
        is_personal_best: s.total_score === personalBest && i > 0,
        grade,
        session_number: i + 1,
      };
    });

    // Overall stats
    const totalSessions = processed.length;
    const latestScore = totalSessions > 0 ? processed[totalSessions - 1].total_score : 0;
    const firstScore = totalSessions > 0 ? processed[0].total_score : 0;
    const totalGrowth = latestScore - firstScore;
    const overallAvg = totalSessions > 0 ? runningTotal / totalSessions : 0;

    // Per-area trend (first 3 vs last 3 comparison)
    const areaNames = ['rapport', 'spin', 'objection', 'pricing', 'closing', 'structure'];
    const areaLabels: Record<string, string> = {
      rapport: '라포형성', spin: 'SPIN질문', objection: '반론처리',
      pricing: '가격프레이밍', closing: '클로징', structure: '상담구조'
    };
    const areaTrend = areaNames.map(a => {
      const early = processed.slice(0, Math.min(3, Math.floor(totalSessions / 2)));
      const recent = processed.slice(-Math.min(3, Math.ceil(totalSessions / 2)));
      const earlyAvg = early.length > 0 ? early.reduce((sum: number, s: any) => sum + (s[a] || 0), 0) / early.length : 0;
      const recentAvg = recent.length > 0 ? recent.reduce((sum: number, s: any) => sum + (s[a] || 0), 0) / recent.length : 0;
      return {
        area: a,
        label: areaLabels[a],
        early_avg: Math.round(earlyAvg * 10) / 10,
        recent_avg: Math.round(recentAvg * 10) / 10,
        delta: Math.round((recentAvg - earlyAvg) * 10) / 10,
      };
    });

    return c.json({
      success: true,
      data: {
        sessions: processed,
        stats: {
          total_sessions: totalSessions,
          latest_score: latestScore,
          first_score: firstScore,
          total_growth: totalGrowth,
          overall_avg: Math.round(overallAvg * 10) / 10,
          personal_best: personalBest,
          best_streak: bestStreak,
          current_streak: currentStreak,
        },
        area_trend: areaTrend,
      }
    });
  } catch (error) {
    console.error('Growth sessions error:', error);
    return c.json({ success: false, error: '성장 추적 데이터 조회에 실패했습니다.' }, 500);
  }
});

// ============================================
// FEATURE 14: Achievement & Alert Summary (for HomePage banners)
// ============================================
dashboard.get('/achievements', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;

    const [todayDecided, weekBest, consecutiveWins, upcomingAppointments] = await Promise.all([
      // Today's decided amount for milestone check
      db.prepare(`
        SELECT SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as today_decided,
          COUNT(CASE WHEN status = 'paid' THEN 1 END) as today_paid_count
        FROM consultations WHERE organization_id = ? AND user_id = ? AND date(consultation_date) = date('now')
      `).bind(orgId, userId).first(),
      // Best day this week
      db.prepare(`
        SELECT date(consultation_date) as best_date,
          SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as amount
        FROM consultations WHERE organization_id = ? AND user_id = ? AND consultation_date >= datetime('now', '-7 days')
        GROUP BY date(consultation_date) ORDER BY amount DESC LIMIT 1
      `).bind(orgId, userId).first(),
      // Consecutive paid consultations streak
      db.prepare(`
        SELECT COUNT(*) as streak FROM (
          SELECT status, ROW_NUMBER() OVER (ORDER BY consultation_date DESC) as rn
          FROM consultations WHERE organization_id = ? AND user_id = ? AND status IN ('paid', 'undecided', 'lost')
          ORDER BY consultation_date DESC LIMIT 20
        ) WHERE status = 'paid' AND rn <= (
          SELECT MIN(rn) - 1 FROM (
            SELECT status, ROW_NUMBER() OVER (ORDER BY consultation_date DESC) as rn
            FROM consultations WHERE organization_id = ? AND user_id = ? AND status != 'paid'
            ORDER BY consultation_date DESC LIMIT 20
          )
        )
      `).bind(orgId, userId, orgId, userId).first(),
      // Today's appointments (treatments with next_appointment = today)
      db.prepare(`
        SELECT COUNT(*) as cnt FROM patient_treatments pt
        JOIN patients p ON pt.patient_id = p.id
        WHERE p.organization_id = ? AND date(pt.next_appointment) = date('now') AND pt.status NOT IN ('completed', 'abandoned')
      `).bind(orgId).first()
    ]);

    const achievements: any[] = [];
    const todayAmount = (todayDecided?.today_decided as number) || 0;
    const todayCount = (todayDecided?.today_paid_count as number) || 0;

    // Milestones
    if (todayAmount >= 10000000) achievements.push({ type: 'milestone', icon: 'fa-crown', color: 'amber', message: `오늘 결정 1천만원 돌파!`, level: 'gold' });
    else if (todayAmount >= 5000000) achievements.push({ type: 'milestone', icon: 'fa-star', color: 'brand', message: `오늘 결정 5백만원 달성!`, level: 'silver' });
    if (todayCount >= 5) achievements.push({ type: 'streak', icon: 'fa-fire', color: 'rose', message: `오늘 ${todayCount}건 연속 결정!`, level: 'hot' });

    // Streak
    const streak = (consecutiveWins?.streak as number) || 0;
    if (streak >= 3) achievements.push({ type: 'streak', icon: 'fa-bolt', color: 'amber', message: `${streak}연속 결제 달성 중!` });

    // Appointments
    const apptCount = (upcomingAppointments?.cnt as number) || 0;
    
    return c.json({
      success: true,
      data: {
        achievements,
        today_appointments: apptCount,
        best_day_this_week: weekBest ? { date: weekBest.best_date, amount: weekBest.amount } : null,
        consecutive_wins: streak
      }
    });
  } catch (error) {
    console.error('Achievements error:', error);
    return c.json({ success: false, error: '실적 조회에 실패했습니다.' }, 500);
  }
});

dashboard.get('/export', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;
    const { type = 'consultations', period = '30' } = c.req.query();
    const days = safeInt(period, 30, 1, 365);

    if (type === 'consultations') {
      const result = await db.prepare(`
        SELECT c.consultation_date, p.name as patient_name, c.treatment_type, c.amount,
               c.status, c.decision_score,
               CAST(json_extract(c.feedback, '$.total_score') AS INTEGER) as consult_score,
               u.name as consultant_name
        FROM consultations c
        LEFT JOIN patients p ON c.patient_id = p.id
        JOIN users u ON c.user_id = u.id
        WHERE c.organization_id=? AND c.consultation_date >= datetime('now', '-' || ? || ' days')
        ORDER BY c.consultation_date DESC
      `).bind(orgId, days).all();

      // BOM for Excel Korean support
      let csv = '\\uFEFF날짜,환자명,치료항목,금액,상태,결정도,상담점수,상담사\\n';
      const statusMap: Record<string,string> = {paid:'결제완료',undecided:'미결정',lost:'이탈',pending:'대기중'};
      for (const r of result.results) {
        csv += `${r.consultation_date},${r.patient_name||''},${r.treatment_type||''},${r.amount||0},${statusMap[r.status as string]||r.status},${r.decision_score||0},${r.consult_score||0},${r.consultant_name}\\n`;
      }

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename=consultations_${new Date().toISOString().split('T')[0]}.csv`
        }
      });
    }

    if (type === 'patients') {
      const result = await db.prepare(`
        SELECT p.name, p.phone, p.age, p.gender, p.referral_source, p.region, p.tags, p.status, p.created_at,
               (SELECT COUNT(*) FROM consultations c WHERE c.patient_id = p.id) as consult_count,
               (SELECT SUM(CASE WHEN c.status='paid' THEN c.amount ELSE 0 END) FROM consultations c WHERE c.patient_id = p.id) as total_paid
        FROM patients p
        WHERE p.organization_id=? AND p.status='active'
        ORDER BY p.created_at DESC
      `).bind(orgId).all();

      let csv = '\\uFEFF이름,전화,나이,성별,내원경로,지역,태그,등록일,상담횟수,결제금액\\n';
      for (const r of result.results) {
        csv += `${r.name},${maskPhone(r.phone as string)},${r.age||''},${r.gender==='male'?'남':'여'},${r.referral_source||''},${r.region||''},${r.tags||''},${(r.created_at as string||'').split('T')[0]},${r.consult_count||0},${r.total_paid||0}\\n`;
      }

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename=patients_${new Date().toISOString().split('T')[0]}.csv`
        }
      });
    }

    if (type === 'retention') {
      const result = await db.prepare(`
        SELECT p.name as patient_name, p.phone, r.status, r.risk_score, r.days_since_visit, r.remaining_treatment_value, r.priority_score
        FROM patient_retention_status r
        JOIN patients p ON r.patient_id = p.id
        WHERE r.organization_id=?
        ORDER BY r.priority_score DESC
      `).bind(orgId).all();

      const sMap: Record<string,string> = {in_treatment:'치료중',unscheduled_urgent:'긴급미예약',unscheduled_warning:'주의미예약',recall_6m:'6개월리콜',recall_12m:'12개월리콜',at_risk:'이탈위험',consulted_unconverted:'상담미전환',active:'활성',completed:'완료'};
      let csv = '\\uFEFF환자명,전화,상태,위험도,미내원일수,잔여치료비,우선도\\n';
      for (const r of result.results) {
        csv += `${r.patient_name},${maskPhone(r.phone as string)},${sMap[r.status as string]||r.status},${r.risk_score},${r.days_since_visit},${r.remaining_treatment_value},${r.priority_score}\\n`;
      }

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename=retention_${new Date().toISOString().split('T')[0]}.csv`
        }
      });
    }

    return c.json({ success: false, error: 'Invalid export type' }, 400);
  } catch (error) {
    console.error('Export error:', error);
    return c.json({ success: false, error: '데이터 내보내기에 실패했습니다.' }, 500);
  }
});

export default dashboard;
