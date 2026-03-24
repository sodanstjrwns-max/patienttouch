// Dashboard & KPI Routes
import { Hono } from 'hono';
import { safeParseJSON } from '../lib/utils';
import { authMiddleware } from '../lib/auth';
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

    // Calculate date range
    let daysBack = 7;
    if (period === 'month') daysBack = 30;
    if (period === 'quarter') daysBack = 90;

    const dateCondition = `datetime('now', '-${daysBack} days')`;

    // Get consultation stats
    const consultStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_consultations,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_consultations,
        SUM(CASE WHEN status = 'undecided' THEN 1 ELSE 0 END) as undecided_consultations,
        AVG(CASE WHEN ai_analysis_status = 'completed' THEN 
          CAST(json_extract(feedback, '$.total_score') AS INTEGER) 
        END) as avg_score,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_amount
      FROM consultations 
      WHERE organization_id = ? AND user_id = ?
        AND consultation_date >= ${dateCondition}
    `).bind(orgId, userId).first();

    // Get task stats
    const taskStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'completed' AND result = 'booked' THEN 1 ELSE 0 END) as successful_tasks
      FROM contact_tasks
      WHERE organization_id = ? AND user_id = ?
        AND created_at >= ${dateCondition}
    `).bind(orgId, userId).first();

    // Get re-consultation success (미결정 → 결제)
    const reConsultStats = await db.prepare(`
      SELECT COUNT(DISTINCT c.patient_id) as re_consultation_success
      FROM consultations c
      WHERE c.organization_id = ? AND c.user_id = ?
        AND c.status = 'paid'
        AND c.consultation_date >= ${dateCondition}
        AND EXISTS (
          SELECT 1 FROM consultations prev
          WHERE prev.patient_id = c.patient_id
            AND prev.status = 'undecided'
            AND prev.consultation_date < c.consultation_date
        )
    `).bind(orgId, userId).first();

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

// GET /api/dashboard/summary - Get home dashboard summary (ENHANCED v2)
dashboard.get('/summary', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;

    // Get user info
    const user = await db.prepare(`
      SELECT u.name, u.goals, o.name as organization_name
      FROM users u
      JOIN organizations o ON u.organization_id = o.id
      WHERE u.id = ?
    `).bind(userId).first();

    // Get today's tasks count
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = await db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN task_type = 'closing' THEN 1 ELSE 0 END) as closing,
        SUM(CASE WHEN task_type = 'proactive' THEN 1 ELSE 0 END) as proactive
      FROM contact_tasks
      WHERE organization_id = ? AND user_id = ? 
        AND status = 'pending'
        AND recommended_date <= ?
    `).bind(orgId, userId, today).first();

    // ====== TODAY STATS (NEW) ======
    const todayConsults = await db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN status = 'undecided' THEN 1 ELSE 0 END) as undecided,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as today_revenue
      FROM consultations 
      WHERE organization_id = ? AND user_id = ?
        AND date(consultation_date) = date('now')
    `).bind(orgId, userId).first();

    // ====== WEEK REVENUE & TARGET (NEW) ======
    const weekRevenue = await db.prepare(`
      SELECT 
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as week_revenue,
        COUNT(*) as total_consultations,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_consultations,
        AVG(CASE WHEN ai_analysis_status = 'completed' THEN 
          CAST(json_extract(feedback, '$.total_score') AS INTEGER) 
        END) as avg_score
      FROM consultations 
      WHERE organization_id = ? AND user_id = ?
        AND consultation_date >= datetime('now', '-7 days')
    `).bind(orgId, userId).first();

    // ====== PREVIOUS WEEK REVENUE (for comparison) ======
    const prevWeekRevenue = await db.prepare(`
      SELECT SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as prev_week_revenue
      FROM consultations 
      WHERE organization_id = ? AND user_id = ?
        AND consultation_date >= datetime('now', '-14 days')
        AND consultation_date < datetime('now', '-7 days')
    `).bind(orgId, userId).first();

    // ====== DAILY SPARKLINE (last 7 days) ======
    const dailySparkline = await db.prepare(`
      SELECT 
        date(consultation_date) as date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as revenue
      FROM consultations
      WHERE organization_id = ? AND user_id = ?
        AND consultation_date >= datetime('now', '-7 days')
      GROUP BY date(consultation_date)
      ORDER BY date ASC
    `).bind(orgId, userId).all();

    // ====== WEEK TASK STATS ======
    const weekTaskStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
      FROM contact_tasks
      WHERE organization_id = ? AND user_id = ?
        AND created_at >= datetime('now', '-7 days')
    `).bind(orgId, userId).first();

    // ====== MVP CASE (best conversion this week) ======
    const mvpCase = await db.prepare(`
      SELECT c.id, c.treatment_type, c.amount, c.decision_score,
             p.name as patient_name,
             json_extract(c.feedback, '$.total_score') as consult_score
      FROM consultations c
      JOIN patients p ON c.patient_id = p.id
      WHERE c.organization_id = ? AND c.user_id = ?
        AND c.status = 'paid'
        AND c.consultation_date >= datetime('now', '-7 days')
      ORDER BY c.amount DESC
      LIMIT 1
    `).bind(orgId, userId).first();

    // Get recent consultations (today)
    const recentConsults = await db.prepare(`
      SELECT c.*, p.name as patient_name
      FROM consultations c
      JOIN patients p ON c.patient_id = p.id
      WHERE c.organization_id = ? AND c.user_id = ?
        AND date(c.consultation_date) = date('now')
      ORDER BY c.consultation_date DESC
      LIMIT 5
    `).bind(orgId, userId).all();

    // ====== MONTHLY REVENUE TARGET ======
    const goals = safeParseJSON(user?.goals as string, {});
    const monthlyTarget = (goals as any).monthly_revenue_target || 200000000; // default 2억
    const weeklyTarget = Math.round(monthlyTarget / 4);

    const currentWeekRevenue = (weekRevenue?.week_revenue as number) || 0;
    const previousWeekRevenue = (prevWeekRevenue?.prev_week_revenue as number) || 0;
    const revenueTrend = previousWeekRevenue > 0 
      ? Math.round(((currentWeekRevenue - previousWeekRevenue) / previousWeekRevenue) * 100) 
      : 0;

    const totalConsultations = (weekRevenue?.total_consultations as number) || 0;
    const paidConsultations = (weekRevenue?.paid_consultations as number) || 0;

    return c.json({
      success: true,
      data: {
        user: {
          name: user?.name,
          organization_name: user?.organization_name,
          goals
        },
        // NEW: today snapshot
        today: {
          total_consultations: (todayConsults?.total as number) || 0,
          paid: (todayConsults?.paid as number) || 0,
          undecided: (todayConsults?.undecided as number) || 0,
          revenue: (todayConsults?.today_revenue as number) || 0,
        },
        today_tasks: {
          total: todayTasks?.total || 0,
          closing: todayTasks?.closing || 0,
          proactive: todayTasks?.proactive || 0
        },
        // ENHANCED: week stats with revenue
        week_stats: {
          total_consultations: totalConsultations,
          paid_consultations: paidConsultations,
          conversion_rate: totalConsultations > 0
            ? Math.round((paidConsultations / totalConsultations) * 100)
            : 0,
          avg_score: Math.round((weekRevenue?.avg_score as number) || 0),
          total_tasks: weekTaskStats?.total_tasks || 0,
          completed_tasks: weekTaskStats?.completed_tasks || 0,
          contact_rate: (weekTaskStats?.total_tasks as number) > 0
            ? Math.round(((weekTaskStats?.completed_tasks as number) / (weekTaskStats?.total_tasks as number)) * 100)
            : 0,
          revenue: currentWeekRevenue,
          revenue_target: weeklyTarget,
          revenue_trend: revenueTrend,
        },
        // NEW: sparkline data (7 days)
        sparkline: dailySparkline.results,
        // NEW: MVP case of the week
        mvp_case: mvpCase ? {
          id: mvpCase.id,
          patient_name: mvpCase.patient_name,
          treatment_type: mvpCase.treatment_type,
          amount: mvpCase.amount,
          decision_score: mvpCase.decision_score,
          consult_score: mvpCase.consult_score,
        } : null,
        recent_consultations: recentConsults.results.map(c => ({
          ...c,
          feedback: safeParseJSON(c.feedback as string, {})
        })),
      }
    });
  } catch (error) {
    console.error('Get summary error:', error);
    return c.json({ success: false, error: '대시보드 요약을 불러오는데 실패했습니다.' }, 500);
  }
});

// GET /api/dashboard/chart - Get chart data
dashboard.get('/chart', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;

    const { type = 'consultations', days = '30' } = c.req.query();

    if (type === 'consultations') {
      const result = await db.prepare(`
        SELECT 
          date(consultation_date) as date,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
          SUM(CASE WHEN status = 'undecided' THEN 1 ELSE 0 END) as undecided
        FROM consultations
        WHERE organization_id = ? AND user_id = ?
          AND consultation_date >= datetime('now', '-${parseInt(days)} days')
        GROUP BY date(consultation_date)
        ORDER BY date ASC
      `).bind(orgId, userId).all();

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
          AND consultation_date >= datetime('now', '-${parseInt(days)} days')
        GROUP BY date(consultation_date)
        ORDER BY date ASC
      `).bind(orgId, userId).all();

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
          AND created_at >= datetime('now', '-${parseInt(days)} days')
        GROUP BY date(created_at)
        ORDER BY date ASC
      `).bind(orgId, userId).all();

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

// GET /api/dashboard/admin-summary - Admin overview
dashboard.get('/admin-summary', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const db = c.env.DB;
    const { period = 'weekly' } = c.req.query();

    let daysBack = 7;
    if (period === 'daily') daysBack = 1;
    if (period === 'monthly') daysBack = 30;

    const dateCondition = `datetime('now', '-${daysBack} days')`;
    const prevDateCondition = `datetime('now', '-${daysBack * 2} days')`;

    // Current period stats
    const currentStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_consultations,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_consultations,
        AVG(COALESCE(r.coaching_score, 0)) as avg_coaching_score
      FROM consultations c
      LEFT JOIN consultation_reports r ON c.id = r.consultation_id
      WHERE c.organization_id = ? AND c.consultation_date >= ${dateCondition}
    `).bind(orgId).first();

    // Previous period stats (for trend)
    const prevStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_consultations,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_consultations,
        AVG(COALESCE(r.coaching_score, 0)) as avg_coaching_score
      FROM consultations c
      LEFT JOIN consultation_reports r ON c.id = r.consultation_id
      WHERE c.organization_id = ? 
        AND c.consultation_date >= ${prevDateCondition}
        AND c.consultation_date < ${dateCondition}
    `).bind(orgId).first();

    // Proposal stats
    const proposalStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_sent,
        SUM(CASE WHEN status IN ('viewed', 'converted') THEN 1 ELSE 0 END) as viewed,
        SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted
      FROM treatment_proposals
      WHERE organization_id = ? AND sent_at >= ${dateCondition}
    `).bind(orgId).first();

    const prevProposalStats = await db.prepare(`
      SELECT COUNT(*) as total_sent,
             SUM(CASE WHEN status IN ('viewed', 'converted') THEN 1 ELSE 0 END) as viewed
      FROM treatment_proposals
      WHERE organization_id = ? 
        AND sent_at >= ${prevDateCondition} AND sent_at < ${dateCondition}
    `).bind(orgId).first();

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

    return c.json({
      success: true,
      data: {
        total_consultations: totalConsults,
        conversion_rate: conversionRate,
        avg_coaching_score: (currentStats?.avg_coaching_score as number) || 0,
        proposal_view_rate: proposalViewRate,
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

    let daysBack = 7;
    if (period === 'daily') daysBack = 1;
    if (period === 'monthly') daysBack = 30;

    const result = await db.prepare(`
      SELECT 
        u.id, u.name,
        COUNT(c.id) as total_consultations,
        SUM(CASE WHEN c.status = 'paid' THEN 1 ELSE 0 END) as paid_consultations,
        AVG(COALESCE(r.coaching_score, 0)) as avg_coaching_score,
        SUM(CASE WHEN c.status = 'paid' THEN c.amount ELSE 0 END) as total_amount
      FROM users u
      LEFT JOIN consultations c ON c.user_id = u.id 
        AND c.consultation_date >= datetime('now', '-${daysBack} days')
      LEFT JOIN consultation_reports r ON c.id = r.consultation_id
      WHERE u.organization_id = ?
      GROUP BY u.id, u.name
      ORDER BY paid_consultations DESC
    `).bind(orgId).all();

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

    let daysBack = 7;
    if (period === 'daily') daysBack = 1;
    if (period === 'monthly') daysBack = 30;

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
        AND c.consultation_date >= datetime('now', '-${daysBack} days')
    `).bind(orgId).first();

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

    let daysBack = 7;
    if (period === 'daily') daysBack = 1;
    if (period === 'monthly') daysBack = 30;

    const result = await db.prepare(`
      SELECT 
        COUNT(CASE WHEN status IN ('sent', 'viewed', 'converted') THEN 1 END) as sent,
        COUNT(CASE WHEN status IN ('viewed', 'converted') THEN 1 END) as viewed,
        COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted
      FROM treatment_proposals
      WHERE organization_id = ?
        AND created_at >= datetime('now', '-${daysBack} days')
    `).bind(orgId).first();

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

// GET /api/dashboard/today-contacts - 오늘 연락해야 할 환자 통합 리스트
dashboard.get('/today-contacts', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;

    const today = new Date().toISOString().split('T')[0];
    const contacts: any[] = [];

    // 1. contact_tasks: 오늘 이전까지 pending인 클로징/안부 태스크
    const pendingTasks = await db.prepare(`
      SELECT t.id as task_id, t.task_type, t.recommended_date, t.recommended_message, t.points,
             p.id as patient_id, p.name as patient_name, p.phone as patient_phone, p.referral_source, p.region,
             c.treatment_type, c.amount, c.decision_score, c.consultation_date
      FROM contact_tasks t
      JOIN patients p ON t.patient_id = p.id
      LEFT JOIN consultations c ON t.consultation_id = c.id
      WHERE t.organization_id = ? AND t.user_id = ?
        AND t.status = 'pending'
        AND t.recommended_date <= ?
      ORDER BY t.task_type = 'closing' DESC, t.recommended_date ASC
    `).bind(orgId, userId, today).all();

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
        urgency: t.task_type === 'closing' ? (daysPassed > 3 ? 'critical' : 'high') : 'medium',
        reason: t.task_type === 'closing' 
          ? '미결정 클로징 (예정일' + (daysPassed > 0 ? ' ' + daysPassed + '일 초과' : ' 오늘') + ')' 
          : '안부 연락'
      });
    }

    // 2. 미결정 상담인데 아직 태스크가 없는 환자 (2일 이상 경과)
    const noTaskUndecided = await db.prepare(`
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
    `).bind(orgId, userId).all();

    for (const c of noTaskUndecided.results) {
      const dp = c.days_passed as number;
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
        urgency: dp >= 5 ? 'critical' : dp >= 3 ? 'high' : 'medium',
        reason: '미결정 ' + dp + '일 경과' + ((c.decision_score as number) >= 7 ? ' (결정도 높음!)' : '')
      });
    }

    // 3. 리텐션 연락 필요 환자 (이탈위험, 미예약 등)
    const retentionNeed = await db.prepare(`
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
    `).bind(orgId).all();

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
        contacts,
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

export default dashboard;
