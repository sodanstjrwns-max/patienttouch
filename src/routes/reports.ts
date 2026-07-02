// Report Routes - Consultation Reports & Treatment Proposals
import { Hono } from 'hono';
import { generateId, safeParseJSON } from '../lib/utils';
import { authMiddleware } from '../lib/auth';
import { 
  runFullAnalysisPipeline, 
  generateProposalContent,
  type ConsultationReport,
  type DiarizedSegment,
  type NERExtracted,
  type PreviousFeedbackContext
} from '../lib/ai-presenter';
import type { AppEnv, Env } from '../types';

const reports = new Hono<AppEnv>();

// Apply auth middleware to all routes except public proposal view
reports.use('*', async (c, next) => {
  // Skip auth for public proposal view (path can be /api/reports/proposals/view/... or /proposals/view/... depending on mount)
  if (c.req.path.includes('/proposals/view/')) {
    return next();
  }
  return authMiddleware(c, next);
});

// ============================================
// Consultation Reports
// ============================================

// GET /api/reports/:consultationId - Get report for consultation
reports.get('/:consultationId', async (c) => {
  try {
    const consultationId = c.req.param('consultationId');
    const orgId = c.get('organizationId');
    const db = c.env.DB;

    const report = await db.prepare(`
      SELECT r.*, c.patient_id, p.name as patient_name
      FROM consultation_reports r
      JOIN consultations c ON r.consultation_id = c.id
      JOIN patients p ON c.patient_id = p.id
      WHERE r.consultation_id = ? AND r.organization_id = ?
    `).bind(consultationId, orgId).first();

    if (!report) {
      return c.json({ success: false, error: '레포트를 찾을 수 없습니다.' }, 404);
    }

    return c.json({
      success: true,
      data: {
        ...report,
        treatment_options: safeParseJSON(report.treatment_options as string, []),
        payment_options: safeParseJSON(report.payment_options as string, { installment_options: [] as any[] }),
        patient_concerns: safeParseJSON(report.patient_concerns as string, []),
        emotion_timeline: safeParseJSON(report.emotion_timeline as string, []),
        decision_factors: safeParseJSON(report.decision_factors as string, {}),
        next_actions: safeParseJSON(report.next_actions as string, []),
        coaching_feedback: safeParseJSON(report.coaching_feedback as string, {}),
        growth_comparison: (safeParseJSON(report.coaching_feedback as string, {}) as any).growth_comparison || null
      }
    });
  } catch (error) {
    console.error('Get report error:', error);
    return c.json({ success: false, error: '레포트 조회에 실패했습니다.' }, 500);
  }
});

// POST /api/reports/:consultationId/generate - Start async report generation
reports.post('/:consultationId/generate', async (c) => {
  try {
    const consultationId = c.req.param('consultationId');
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;
    const apiKey = c.env.OPENAI_API_KEY;

    if (!apiKey) {
      return c.json({ success: false, error: 'OpenAI API 키가 설정되지 않았습니다.' }, 500);
    }

    // Get consultation with patient info
    const consultation = await db.prepare(`
      SELECT c.*, p.name as patient_name, p.age as patient_age, p.gender as patient_gender
      FROM consultations c
      LEFT JOIN patients p ON c.patient_id = p.id
      WHERE c.id = ? AND c.organization_id = ?
    `).bind(consultationId, orgId).first();

    if (!consultation) {
      return c.json({ success: false, error: '상담 기록을 찾을 수 없습니다.' }, 404);
    }

    if (!consultation.audio_url) {
      return c.json({ success: false, error: '녹음 파일이 없습니다.' }, 400);
    }

    // Mark as processing immediately
    await db.prepare(`
      UPDATE consultations SET ai_analysis_status = 'processing', updated_at = datetime('now') WHERE id = ?
    `).bind(consultationId).run();

    // Get audio from R2
    const audioObject = await c.env.R2.get(consultation.audio_url as string);
    if (!audioObject) {
      await db.prepare(`UPDATE consultations SET ai_analysis_status = 'failed' WHERE id = ?`).bind(consultationId).run();
      return c.json({ success: false, error: '녹음 파일을 찾을 수 없습니다.' }, 404);
    }

    const audioData = await audioObject.arrayBuffer();

    // Get AI config for model name
    const { getAIConfig } = await import('../lib/ai-config');
    const aiConfig = getAIConfig(c.env as any);

    // Run pipeline in background with waitUntil (won't block response)
    const bgTask = (async () => {
      try {
        console.log('[BG Pipeline] Starting for', consultationId);

        // Fetch previous feedback for growth comparison
        let previousFeedback: PreviousFeedbackContext | null = null;
        try {
          const prevReports = await db.prepare(`
            SELECT r.coaching_feedback, r.coaching_score, c.consultation_date, c.treatment_type
            FROM consultation_reports r
            JOIN consultations c ON r.consultation_id = c.id
            WHERE c.user_id = ? AND c.organization_id = ? AND r.coaching_score > 0
            ORDER BY c.consultation_date DESC
            LIMIT 5
          `).bind(userId, orgId).all();

          if (prevReports.results.length > 0) {
            const sessions = prevReports.results.map((r: any) => {
              const fb = safeParseJSON<any>(r.coaching_feedback, {});
              return {
                date: r.consultation_date?.split('T')[0] || '',
                total_score: r.coaching_score || 0,
                scores: fb.scores || { rapport: 0, spin: 0, objection_handling: 0, pricing_framing: 0, closing: 0, structure: 0 },
                top_improvement: fb.improvements?.[0]?.issue || '없음',
                treatment_type: r.treatment_type || undefined,
              };
            });
            const avgScores = { rapport: 0, spin: 0, objection_handling: 0, pricing_framing: 0, closing: 0, structure: 0 };
            let totalSum = 0;
            sessions.forEach((s: any) => {
              totalSum += s.total_score;
              (Object.keys(avgScores) as Array<keyof typeof avgScores>).forEach(k => { avgScores[k] += (s.scores[k] || 0); });
            });
            const cnt = sessions.length;
            (Object.keys(avgScores) as Array<keyof typeof avgScores>).forEach(k => { avgScores[k] = avgScores[k] / cnt; });
            const issueCounts: Record<string, number> = {};
            sessions.forEach((s: any) => { if (s.top_improvement !== '없음') { const k = s.top_improvement.slice(0, 30); issueCounts[k] = (issueCounts[k] || 0) + 1; } });
            const recurring = Object.entries(issueCounts).filter(([, c]) => c >= 2).map(([i]) => i);
            previousFeedback = { sessions, avg_scores: avgScores, avg_total: totalSum / cnt, recurring_issues: recurring.length > 0 ? recurring : sessions.slice(0, 2).map((s: any) => s.top_improvement).filter(Boolean) };
          }
        } catch (e) { console.warn('[BG Pipeline] Previous feedback load failed:', e); }

        const analysis = await runFullAnalysisPipeline(
          audioData,
          {
            name: consultation.patient_name as string || '미지정',
            age: consultation.patient_age as number,
            gender: consultation.patient_gender as string
          },
          apiKey,
          c.env as any,
          previousFeedback
        );

        // Safely convert values for D1
        const toStr = (v: any): string => {
          if (v === null || v === undefined) return '';
          if (typeof v === 'string') return v;
          if (Array.isArray(v)) return v.join('\n');
          if (typeof v === 'object') return JSON.stringify(v);
          return String(v);
        };
        const toJsonStr = (v: any): string => {
          if (typeof v === 'string') return v;
          return JSON.stringify(v ?? null);
        };

        // Create or update report
        const existingReport = await db.prepare(
          'SELECT id FROM consultation_reports WHERE consultation_id = ?'
        ).bind(consultationId).first();

        const reportId = existingReport?.id || 'report_' + generateId().slice(0, 8);
        const modelName = aiConfig.primaryModel;

        if (existingReport) {
          await db.prepare(`
            UPDATE consultation_reports SET
              consultation_summary = ?, treatment_options = ?, discussed_amount = ?,
              payment_options = ?, patient_concerns = ?, emotion_timeline = ?,
              emotion_summary = ?, overall_sentiment = ?, decision_factors = ?,
              decision_score = ?, decision_prediction = ?, next_actions = ?,
              recommended_followup_date = ?, followup_message = ?,
              coaching_feedback = ?, coaching_score = ?,
              generation_model = ?, updated_at = datetime('now')
            WHERE id = ?
          `).bind(
            toStr(analysis.report.consultation_summary),
            toJsonStr(analysis.report.treatment_options),
            analysis.report.discussed_amount || null,
            toJsonStr(analysis.report.payment_options),
            toJsonStr(analysis.report.patient_concerns),
            toJsonStr(analysis.report.emotion_timeline),
            toStr(analysis.report.emotion_summary),
            toStr(analysis.report.overall_sentiment),
            toJsonStr(analysis.report.decision_factors),
            analysis.report.decision_score || 5,
            toStr(analysis.report.decision_prediction),
            toJsonStr(analysis.report.next_actions),
            toStr(analysis.report.recommended_followup_date),
            toStr(analysis.report.followup_message),
            toJsonStr(analysis.report.coaching_feedback),
            analysis.report.coaching_feedback?.total_score || 0,
            modelName,
            reportId
          ).run();
        } else {
          await db.prepare(`
            INSERT INTO consultation_reports (
              id, organization_id, consultation_id,
              consultation_summary, treatment_options, discussed_amount, payment_options,
              patient_concerns, emotion_timeline, emotion_summary, overall_sentiment,
              decision_factors, decision_score, decision_prediction,
              next_actions, recommended_followup_date, followup_message,
              coaching_feedback, coaching_score, generation_model
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            reportId, orgId, consultationId,
            toStr(analysis.report.consultation_summary),
            toJsonStr(analysis.report.treatment_options),
            analysis.report.discussed_amount || null,
            toJsonStr(analysis.report.payment_options),
            toJsonStr(analysis.report.patient_concerns),
            toJsonStr(analysis.report.emotion_timeline),
            toStr(analysis.report.emotion_summary),
            toStr(analysis.report.overall_sentiment),
            toJsonStr(analysis.report.decision_factors),
            analysis.report.decision_score || 5,
            toStr(analysis.report.decision_prediction),
            toJsonStr(analysis.report.next_actions),
            toStr(analysis.report.recommended_followup_date),
            toStr(analysis.report.followup_message),
            toJsonStr(analysis.report.coaching_feedback),
            analysis.report.coaching_feedback?.total_score || 0,
            modelName
          ).run();
        }

        // Update consultation
        await db.prepare(`
          UPDATE consultations SET
            transcript = ?, transcript_diarized = ?, ner_extracted = ?,
            spin_analysis = ?, summary = ?, decision_score = ?,
            ai_analysis_status = 'completed', updated_at = datetime('now')
          WHERE id = ?
        `).bind(
          toStr(analysis.transcript),
          toJsonStr(analysis.diarizedSegments),
          toJsonStr(analysis.nerData),
          toJsonStr(analysis.spinAnalysis),
          toStr(analysis.report.consultation_summary),
          analysis.report.decision_score || 5,
          consultationId
        ).run();

        // v8.2: 리포트 생성 완료 즉시 AI 팔로업 태스크 동기화
        const { syncFollowupTask } = await import('../lib/analysis-runner');
        await syncFollowupTask(db, orgId, userId, consultationId, analysis.report);

        console.log('[BG Pipeline] Complete for', consultationId, '— Score:', analysis.report.coaching_feedback?.total_score);
      } catch (error: any) {
        console.error('[BG Pipeline] Failed for', consultationId, ':', error?.message || error);
        await db.prepare(`
          UPDATE consultations SET ai_analysis_status = 'failed', updated_at = datetime('now') WHERE id = ?
        `).bind(consultationId).run();
      }
    })();

    // Use waitUntil to keep the background task alive after response
    c.executionCtx.waitUntil(bgTask);

    // Return immediately — client will poll for status
    return c.json({
      success: true,
      data: { status: 'processing', consultation_id: consultationId }
    });
  } catch (error: any) {
    console.error('Generate report error:', error?.message || error);
    return c.json({ success: false, error: '레포트 생성에 실패했습니다: ' + (error?.message || String(error)) }, 500);
  }
});

// GET /api/reports/:consultationId/status - Poll report generation status
reports.get('/:consultationId/status', async (c) => {
  try {
    const consultationId = c.req.param('consultationId');
    const orgId = c.get('organizationId');
    const db = c.env.DB;

    const consultation = await db.prepare(`
      SELECT ai_analysis_status FROM consultations WHERE id = ? AND organization_id = ?
    `).bind(consultationId, orgId).first();

    if (!consultation) {
      return c.json({ success: false, error: '상담을 찾을 수 없습니다.' }, 404);
    }

    const status = consultation.ai_analysis_status || 'pending';

    if (status === 'completed') {
      // Fetch the full report
      const report = await db.prepare(`
        SELECT r.*, c.patient_id, p.name as patient_name
        FROM consultation_reports r
        JOIN consultations c ON r.consultation_id = c.id
        JOIN patients p ON c.patient_id = p.id
        WHERE r.consultation_id = ? AND r.organization_id = ?
      `).bind(consultationId, orgId).first();

      if (report) {
        return c.json({
          success: true,
          data: {
            status: 'completed',
            report_id: report.id,
            report: {
              ...report,
              treatment_options: safeParseJSON(report.treatment_options as string, []),
              payment_options: safeParseJSON(report.payment_options as string, { installment_options: [] as any[] }),
              patient_concerns: safeParseJSON(report.patient_concerns as string, []),
              emotion_timeline: safeParseJSON(report.emotion_timeline as string, []),
              decision_factors: safeParseJSON(report.decision_factors as string, {}),
              next_actions: safeParseJSON(report.next_actions as string, []),
              coaching_feedback: safeParseJSON(report.coaching_feedback as string, {})
            }
          }
        });
      }
    }

    return c.json({
      success: true,
      data: { status }
    });
  } catch (error) {
    console.error('Check report status error:', error);
    return c.json({ success: false, error: '상태 확인에 실패했습니다.' }, 500);
  }
});

// PATCH /api/reports/:reportId - Update report (consultant edits)
reports.patch('/:reportId', async (c) => {
  try {
    const reportId = c.req.param('reportId');
    const orgId = c.get('organizationId');
    const db = c.env.DB;
    const body = await c.req.json();

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    // Allowed editable fields
    const editableFields = [
      'consultation_summary', 'treatment_options', 'patient_concerns',
      'next_actions', 'followup_message'
    ];

    for (const field of editableFields) {
      if (body[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(
          typeof body[field] === 'object' ? JSON.stringify(body[field]) : body[field]
        );
      }
    }

    if (updateFields.length === 0) {
      return c.json({ success: false, error: '수정할 내용이 없습니다.' }, 400);
    }

    updateFields.push('is_edited = 1', 'edited_at = datetime("now")', 'updated_at = datetime("now")');

    await db.prepare(`
      UPDATE consultation_reports SET ${updateFields.join(', ')}
      WHERE id = ? AND organization_id = ?
    `).bind(...updateValues, reportId, orgId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Update report error:', error);
    return c.json({ success: false, error: '레포트 수정에 실패했습니다.' }, 500);
  }
});

// ============================================
// Treatment Proposals (환자용 제안서)
// ============================================

// POST /api/reports/:consultationId/proposal - Create treatment proposal
reports.post('/:consultationId/proposal', async (c) => {
  try {
    const consultationId = c.req.param('consultationId');
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;
    const apiKey = c.env.OPENAI_API_KEY;

    // Get report and patient info
    const report = await db.prepare(`
      SELECT r.*, c.patient_id, p.name as patient_name, p.phone as patient_phone,
             u.name as consultant_name, o.name as hospital_name
      FROM consultation_reports r
      JOIN consultations c ON r.consultation_id = c.id
      JOIN patients p ON c.patient_id = p.id
      JOIN users u ON c.user_id = u.id
      JOIN organizations o ON r.organization_id = o.id
      WHERE r.consultation_id = ? AND r.organization_id = ?
    `).bind(consultationId, orgId).first();

    if (!report) {
      return c.json({ success: false, error: '레포트를 찾을 수 없습니다. 먼저 레포트를 생성해주세요.' }, 404);
    }

    // Get branding
    const branding = await db.prepare(
      'SELECT * FROM organization_branding WHERE organization_id = ?'
    ).bind(orgId).first();

    // Generate proposal content using AI
    const reportData: ConsultationReport = {
      consultation_summary: report.consultation_summary as string,
      treatment_options: safeParseJSON(report.treatment_options as string, []),
      discussed_amount: report.discussed_amount as number,
      payment_options: safeParseJSON(report.payment_options as string, { installment_options: [] as any[] }),
      patient_concerns: safeParseJSON(report.patient_concerns as string, []),
      emotion_timeline: safeParseJSON(report.emotion_timeline as string, []),
      emotion_summary: report.emotion_summary as string,
      overall_sentiment: report.overall_sentiment as any,
      decision_factors: safeParseJSON(report.decision_factors as string, {}),
      decision_score: report.decision_score as number,
      decision_prediction: report.decision_prediction as string,
      next_actions: safeParseJSON(report.next_actions as string, []),
      coaching_feedback: safeParseJSON(report.coaching_feedback as string, {}) as any
    };

    let proposalContent;
    if (apiKey) {
      proposalContent = await generateProposalContent(
        reportData,
        report.patient_name as string,
        report.hospital_name as string,
        report.consultant_name as string,
        apiKey,
        c.env as any
      );
    } else {
      // Fallback without AI
      proposalContent = {
        title: `${report.patient_name}님을 위한 맞춤 치료 안내`,
        greeting_message: `안녕하세요, ${report.patient_name}님. ${report.hospital_name}입니다.\n상담해 주셔서 감사합니다.`,
        selected_options: reportData.treatment_options.map(opt => ({
          name: opt.name,
          price: opt.price,
          duration: opt.duration,
          benefits: opt.pros,
          recommended: opt.recommendation_level === 'high'
        })),
        recommended_option: reportData.treatment_options.find(o => o.recommendation_level === 'high')?.name || '',
        total_amount: reportData.discussed_amount || 0,
        discount_amount: 0,
        final_amount: reportData.discussed_amount || 0,
        installment_options: reportData.payment_options.installment_options || [],
        closing_message: '궁금한 점이 있으시면 언제든 문의해 주세요.'
      };
    }

    // Generate unique token for public URL
    const publicToken = generateId().replace(/-/g, '').slice(0, 16);
    const proposalId = 'prop_' + generateId().slice(0, 8);

    // Save proposal
    await db.prepare(`
      INSERT INTO treatment_proposals (
        id, organization_id, consultation_id, report_id, patient_id,
        title, greeting_message, selected_options, recommended_option,
        total_amount, discount_amount, final_amount, installment_options,
        default_installment_months,
        hospital_name, hospital_logo_url, hospital_phone,
        public_token, public_url, expires_at, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+30 days'), 'draft')
    `).bind(
      proposalId, orgId, consultationId, report.id, report.patient_id,
      proposalContent.title,
      proposalContent.greeting_message,
      JSON.stringify(proposalContent.selected_options),
      proposalContent.recommended_option,
      proposalContent.total_amount,
      proposalContent.discount_amount,
      proposalContent.final_amount,
      JSON.stringify(proposalContent.installment_options),
      6, // default installment months
      branding?.hospital_name || report.hospital_name,
      branding?.logo_url,
      branding?.hospital_phone || null,
      publicToken,
      `/proposal/${publicToken}`
    ).run();

    return c.json({
      success: true,
      data: {
        proposal_id: proposalId,
        public_token: publicToken,
        public_url: `/proposal/${publicToken}`,
        content: proposalContent
      }
    });
  } catch (error) {
    console.error('Create proposal error:', error);
    return c.json({ success: false, error: '제안서 생성에 실패했습니다.' }, 500);
  }
});

// GET /api/proposals/:proposalId - Get proposal (for consultant)
reports.get('/proposals/:proposalId', async (c) => {
  try {
    const proposalId = c.req.param('proposalId');
    const orgId = c.get('organizationId');
    const db = c.env.DB;

    const proposal = await db.prepare(`
      SELECT p.*, pt.name as patient_name, pt.phone as patient_phone
      FROM treatment_proposals p
      JOIN patients pt ON p.patient_id = pt.id
      WHERE p.id = ? AND p.organization_id = ?
    `).bind(proposalId, orgId).first();

    if (!proposal) {
      return c.json({ success: false, error: '제안서를 찾을 수 없습니다.' }, 404);
    }

    return c.json({
      success: true,
      data: {
        ...proposal,
        selected_options: safeParseJSON(proposal.selected_options as string, []),
        installment_options: safeParseJSON(proposal.installment_options as string, []),
        installment_interactions: safeParseJSON(proposal.installment_interactions as string, [])
      }
    });
  } catch (error) {
    console.error('Get proposal error:', error);
    return c.json({ success: false, error: '제안서 조회에 실패했습니다.' }, 500);
  }
});

// POST /api/proposals/:proposalId/send - Send proposal to patient
reports.post('/proposals/:proposalId/send', async (c) => {
  try {
    const proposalId = c.req.param('proposalId');
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;
    const { send_via } = await c.req.json(); // 'kakao', 'sms', 'link'

    // Update proposal status
    await db.prepare(`
      UPDATE treatment_proposals SET
        status = 'sent',
        sent_via = ?,
        sent_at = datetime('now'),
        sent_by = ?,
        updated_at = datetime('now')
      WHERE id = ? AND organization_id = ?
    `).bind(send_via, userId, proposalId, orgId).run();

    // Get proposal for response
    const proposal = await db.prepare(
      'SELECT public_token, public_url FROM treatment_proposals WHERE id = ?'
    ).bind(proposalId).first();

    return c.json({
      success: true,
      data: {
        public_url: proposal?.public_url,
        public_token: proposal?.public_token
      }
    });
  } catch (error) {
    console.error('Send proposal error:', error);
    return c.json({ success: false, error: '제안서 전송에 실패했습니다.' }, 500);
  }
});

// ============================================
// Public Proposal View (No auth required)
// ============================================

// GET /api/proposals/view/:token - Public proposal view
reports.get('/proposals/view/:token', async (c) => {
  try {
    const token = c.req.param('token');
    const db = c.env.DB;

    const proposal = await db.prepare(`
      SELECT p.*, o.name as org_name, ob.logo_url, ob.primary_color, ob.secondary_color,
             ob.hospital_slogan, ob.proposal_footer_message
      FROM treatment_proposals p
      JOIN organizations o ON p.organization_id = o.id
      LEFT JOIN organization_branding ob ON p.organization_id = ob.organization_id
      WHERE p.public_token = ? AND p.expires_at > datetime('now')
    `).bind(token).first();

    if (!proposal) {
      return c.json({ success: false, error: '제안서를 찾을 수 없거나 만료되었습니다.' }, 404);
    }

    // Update view tracking
    const isFirstView = !proposal.viewed_at;
    await db.prepare(`
      UPDATE treatment_proposals SET
        viewed_at = COALESCE(viewed_at, datetime('now')),
        view_count = view_count + 1,
        last_viewed_at = datetime('now'),
        status = CASE WHEN status = 'sent' THEN 'viewed' ELSE status END
      WHERE id = ?
    `).bind(proposal.id).run();

    return c.json({
      success: true,
      data: {
        title: proposal.title,
        greeting_message: proposal.greeting_message,
        selected_options: safeParseJSON(proposal.selected_options as string, []),
        recommended_option: proposal.recommended_option,
        total_amount: proposal.total_amount,
        discount_amount: proposal.discount_amount,
        final_amount: proposal.final_amount,
        installment_options: safeParseJSON(proposal.installment_options as string, []),
        default_installment_months: proposal.default_installment_months,
        // Branding
        hospital_name: proposal.hospital_name || proposal.org_name,
        hospital_logo_url: proposal.logo_url,
        hospital_phone: proposal.hospital_phone,
        primary_color: proposal.primary_color || '#4F46E5',
        secondary_color: proposal.secondary_color || '#818CF8',
        hospital_slogan: proposal.hospital_slogan,
        footer_message: proposal.proposal_footer_message,
        // CTA
        cta_type: proposal.cta_type,
        reservation_url: proposal.reservation_url
      }
    });
  } catch (error) {
    console.error('Public proposal view error:', error);
    return c.json({ success: false, error: '제안서 조회에 실패했습니다.' }, 500);
  }
});

// POST /api/proposals/view/:token/interaction - Track interactions
reports.post('/proposals/view/:token/interaction', async (c) => {
  try {
    const token = c.req.param('token');
    const db = c.env.DB;
    const { type, data } = await c.req.json();

    const proposal = await db.prepare(
      'SELECT id, installment_interactions FROM treatment_proposals WHERE public_token = ?'
    ).bind(token).first();

    if (!proposal) {
      return c.json({ success: false }, 404);
    }

    if (type === 'installment_slider') {
      // Track installment slider interaction
      const interactions = safeParseJSON<any[]>(proposal.installment_interactions as string, []);
      interactions.push({
        timestamp: new Date().toISOString(),
        months_selected: data.months,
        monthly_amount: data.monthly_amount
      });

      await db.prepare(`
        UPDATE treatment_proposals SET
          installment_interactions = ?,
          time_spent_seconds = time_spent_seconds + ?
        WHERE id = ?
      `).bind(JSON.stringify(interactions), data.time_spent || 0, proposal.id).run();
    } else if (type === 'cta_click') {
      // Track CTA click
      await db.prepare(`
        UPDATE treatment_proposals SET
          cta_clicked = 1,
          cta_clicked_at = datetime('now')
        WHERE id = ?
      `).bind(proposal.id).run();
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false }, 500);
  }
});

export default reports;
