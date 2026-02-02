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

// GET /api/dashboard/summary - Get home dashboard summary
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

    // Get week stats
    const weekStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_consultations,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_consultations,
        AVG(CASE WHEN ai_analysis_status = 'completed' THEN 
          CAST(json_extract(feedback, '$.total_score') AS INTEGER) 
        END) as avg_score
      FROM consultations 
      WHERE organization_id = ? AND user_id = ?
        AND consultation_date >= datetime('now', '-7 days')
    `).bind(orgId, userId).first();

    const weekTaskStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
      FROM contact_tasks
      WHERE organization_id = ? AND user_id = ?
        AND created_at >= datetime('now', '-7 days')
    `).bind(orgId, userId).first();

    return c.json({
      success: true,
      data: {
        user: {
          name: user?.name,
          organization_name: user?.organization_name,
          goals: safeParseJSON(user?.goals as string, {})
        },
        today_tasks: {
          total: todayTasks?.total || 0,
          closing: todayTasks?.closing || 0,
          proactive: todayTasks?.proactive || 0
        },
        recent_consultations: recentConsults.results.map(c => ({
          ...c,
          feedback: safeParseJSON(c.feedback as string, {})
        })),
        week_stats: {
          total_consultations: weekStats?.total_consultations || 0,
          paid_consultations: weekStats?.paid_consultations || 0,
          conversion_rate: (weekStats?.total_consultations as number) > 0
            ? Math.round(((weekStats?.paid_consultations as number) / (weekStats?.total_consultations as number)) * 100)
            : 0,
          avg_score: Math.round((weekStats?.avg_score as number) || 0),
          total_tasks: weekTaskStats?.total_tasks || 0,
          completed_tasks: weekTaskStats?.completed_tasks || 0,
          contact_rate: (weekTaskStats?.total_tasks as number) > 0
            ? Math.round(((weekTaskStats?.completed_tasks as number) / (weekTaskStats?.total_tasks as number)) * 100)
            : 0
        }
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

export default dashboard;
