// Consultation Routes
import { Hono } from 'hono';
import { generateId, safeParseJSON } from '../lib/utils';
import { authMiddleware } from '../lib/auth';
import { analyzeAudio, analyzeConsultation } from '../lib/ai';
import { runFullAnalysisPipeline } from '../lib/ai-presenter';
import type { Env, Consultation } from '../types';

const consultations = new Hono<{ Bindings: Env }>();

// Apply auth middleware to all routes
consultations.use('*', authMiddleware);

// GET /api/consultations - List consultations
consultations.get('/', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;

    const { status, patient_id, my_only, limit = '50', offset = '0' } = c.req.query();

    let query = `
      SELECT c.*, p.name as patient_name, u.name as user_name
      FROM consultations c
      JOIN patients p ON c.patient_id = p.id
      JOIN users u ON c.user_id = u.id
      WHERE c.organization_id = ?
    `;
    const params: (string | number)[] = [orgId];

    if (my_only === 'true') {
      query += ` AND c.user_id = ?`;
      params.push(userId);
    }

    if (status && status !== 'all') {
      query += ` AND c.status = ?`;
      params.push(status);
    }

    if (patient_id) {
      query += ` AND c.patient_id = ?`;
      params.push(patient_id);
    }

    query += ` ORDER BY c.consultation_date DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();

    const data = result.results.map(c => ({
      ...c,
      patient_psychology: safeParseJSON(c.patient_psychology as string, {}),
      emotion_flow: safeParseJSON(c.emotion_flow as string, {}),
      key_quotes: safeParseJSON(c.key_quotes as string, []),
      feedback: safeParseJSON(c.feedback as string, {})
    }));

    return c.json({ success: true, data });
  } catch (error) {
    console.error('List consultations error:', error);
    return c.json({ success: false, error: '상담 목록을 불러오는데 실패했습니다.' }, 500);
  }
});

// GET /api/consultations/:id - Get consultation detail
consultations.get('/:id', async (c) => {
  try {
    const consultId = c.req.param('id');
    const orgId = c.get('organizationId');
    const db = c.env.DB;

    // Use LEFT JOIN to support consultations without patient (quick recording mode)
    const consultation = await db.prepare(`
      SELECT c.*, 
             p.name as patient_name, p.phone as patient_phone, p.age as patient_age,
             p.gender as patient_gender, u.name as user_name
      FROM consultations c
      LEFT JOIN patients p ON c.patient_id = p.id
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ? AND c.organization_id = ?
    `).bind(consultId, orgId).first();

    if (!consultation) {
      return c.json({ success: false, error: '상담 기록을 찾을 수 없습니다.' }, 404);
    }

    return c.json({
      success: true,
      data: {
        ...consultation,
        patient_psychology: safeParseJSON(consultation.patient_psychology as string, {}),
        emotion_flow: safeParseJSON(consultation.emotion_flow as string, {}),
        key_quotes: safeParseJSON(consultation.key_quotes as string, []),
        feedback: safeParseJSON(consultation.feedback as string, {}),
        companion: safeParseJSON(consultation.companion as string, null),
        referrer: safeParseJSON(consultation.referrer as string, null)
      }
    });
  } catch (error) {
    console.error('Get consultation error:', error);
    return c.json({ success: false, error: '상담 기록을 불러오는데 실패했습니다.' }, 500);
  }
});

// POST /api/consultations - Create consultation (with or without recording)
// patient_id can be null for "quick recording" mode - patient can be linked later
consultations.post('/', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;

    const body = await c.req.json();
    const { patient_id, consultation_date, duration, treatment_type, treatment_area, amount, status } = body;

    let patientName = null;
    let actualPatientId = patient_id || null;

    // patient_id is now optional - allows "record first, link patient later"
    if (actualPatientId) {
      // Verify patient exists
      const patient = await db.prepare(
        'SELECT id, name FROM patients WHERE id = ? AND organization_id = ?'
      ).bind(actualPatientId, orgId).first();

      if (!patient) {
        return c.json({ success: false, error: '환자를 찾을 수 없습니다.' }, 404);
      }
      patientName = patient.name;
    } else {
      // Auto-create temporary patient for quick recording mode
      actualPatientId = 'patient_' + generateId().slice(0, 8);
      const now = new Date();
      const tempName = `녹음_${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}`;
      
      await db.prepare(`
        INSERT INTO patients (id, organization_id, name, tags, status)
        VALUES (?, ?, ?, '["미지정"]', 'active')
      `).bind(actualPatientId, orgId, tempName).run();
      
      patientName = tempName;
    }

    const consultId = 'consult_' + generateId().slice(0, 8);

    await db.prepare(`
      INSERT INTO consultations (
        id, organization_id, user_id, patient_id, consultation_date, 
        duration, treatment_type, treatment_area, amount, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      consultId, orgId, userId, actualPatientId,
      consultation_date || new Date().toISOString(),
      duration || null, treatment_type || null, treatment_area || null,
      amount || null, status || 'pending'
    ).run();

    return c.json({
      success: true,
      data: { 
        id: consultId, 
        patient_name: patientName,
        patient_id: actualPatientId,
        is_unlinked: !patient_id  // Flag to indicate patient needs to be linked
      }
    });
  } catch (error) {
    console.error('Create consultation error:', error);
    return c.json({ success: false, error: '상담 기록 생성에 실패했습니다.' }, 500);
  }
});

// POST /api/consultations/:id/upload-audio - Upload and analyze audio
consultations.post('/:id/upload-audio', async (c) => {
  try {
    const consultId = c.req.param('id');
    const orgId = c.get('organizationId');
    const db = c.env.DB;

    // Verify consultation exists
    const consultation = await db.prepare(
      'SELECT id FROM consultations WHERE id = ? AND organization_id = ?'
    ).bind(consultId, orgId).first();

    if (!consultation) {
      return c.json({ success: false, error: '상담 기록을 찾을 수 없습니다.' }, 404);
    }

    // Get audio data from request
    const formData = await c.req.formData();
    const audioFile = formData.get('audio') as File;
    const duration = formData.get('duration') as string;

    if (!audioFile) {
      return c.json({ success: false, error: '녹음 파일이 없습니다.' }, 400);
    }

    // Update status to processing
    await db.prepare(
      'UPDATE consultations SET ai_analysis_status = ?, duration = ? WHERE id = ?'
    ).bind('processing', duration ? parseInt(duration) : null, consultId).run();

    // Upload to R2
    const audioKey = `consultations/${consultId}/recording.webm`;
    const audioData = await audioFile.arrayBuffer();
    
    await c.env.R2.put(audioKey, audioData, {
      httpMetadata: { contentType: audioFile.type }
    });

    // Analyze with OpenAI
    const apiKey = c.env.OPENAI_API_KEY;
    if (!apiKey) {
      await db.prepare(
        'UPDATE consultations SET ai_analysis_status = ?, audio_url = ? WHERE id = ?'
      ).bind('failed', audioKey, consultId).run();
      return c.json({ success: false, error: 'OpenAI API 키가 설정되지 않았습니다.' }, 500);
    }

    try {
      // Get patient info for full analysis
      let patientInfo = { name: '미지정', age: undefined, gender: undefined };
      
      const consultWithPatient = await db.prepare(`
        SELECT c.*, p.name as patient_name, p.age as patient_age, p.gender as patient_gender
        FROM consultations c
        LEFT JOIN patients p ON c.patient_id = p.id
        WHERE c.id = ?
      `).bind(consultId).first();
      
      if (consultWithPatient?.patient_name) {
        patientInfo = {
          name: consultWithPatient.patient_name as string,
          age: consultWithPatient.patient_age as number,
          gender: consultWithPatient.patient_gender as string
        };
      }

      // Run full AI analysis pipeline (includes report generation)
      const fullAnalysis = await runFullAnalysisPipeline(audioData, patientInfo, apiKey);

      // Update consultation with analysis
      await db.prepare(`
        UPDATE consultations SET
          audio_url = ?,
          transcript = ?,
          transcript_diarized = ?,
          ner_extracted = ?,
          spin_analysis = ?,
          summary = ?,
          treatment_type = COALESCE(treatment_type, ?),
          treatment_area = COALESCE(treatment_area, ?),
          amount = COALESCE(amount, ?),
          patient_psychology = ?,
          emotion_flow = ?,
          key_quotes = ?,
          feedback = ?,
          decision_score = ?,
          ai_analysis_status = 'completed',
          recording_status = 'completed',
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        audioKey,
        fullAnalysis.transcript,
        JSON.stringify(fullAnalysis.diarizedSegments),
        JSON.stringify(fullAnalysis.nerData),
        JSON.stringify(fullAnalysis.spinAnalysis),
        fullAnalysis.report.consultation_summary,
        fullAnalysis.nerData.treatment_type || null,
        fullAnalysis.nerData.treatment_area || null,
        fullAnalysis.nerData.amount || null,
        JSON.stringify(fullAnalysis.report.decision_factors),
        JSON.stringify({
          overall_tone: fullAnalysis.report.overall_sentiment,
          decision_score: fullAnalysis.report.decision_score,
          timeline: fullAnalysis.report.emotion_timeline,
          summary: fullAnalysis.report.emotion_summary
        }),
        JSON.stringify(fullAnalysis.report.patient_concerns?.map(c => c.concern) || []),
        JSON.stringify(fullAnalysis.report.coaching_feedback),
        fullAnalysis.report.decision_score,
        consultId
      ).run();

      // Auto-create consultation report
      const reportId = 'report_' + generateId().slice(0, 8);
      await db.prepare(`
        INSERT INTO consultation_reports (
          id, organization_id, consultation_id,
          consultation_summary, treatment_options, discussed_amount, payment_options,
          patient_concerns, emotion_timeline, emotion_summary, overall_sentiment,
          decision_factors, decision_score, decision_prediction,
          next_actions, recommended_followup_date, followup_message,
          coaching_feedback, coaching_score, generation_model
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'gpt-4o')
      `).bind(
        reportId, orgId, consultId,
        fullAnalysis.report.consultation_summary,
        JSON.stringify(fullAnalysis.report.treatment_options),
        fullAnalysis.report.discussed_amount,
        JSON.stringify(fullAnalysis.report.payment_options),
        JSON.stringify(fullAnalysis.report.patient_concerns),
        JSON.stringify(fullAnalysis.report.emotion_timeline),
        fullAnalysis.report.emotion_summary,
        fullAnalysis.report.overall_sentiment,
        JSON.stringify(fullAnalysis.report.decision_factors),
        fullAnalysis.report.decision_score,
        fullAnalysis.report.decision_prediction,
        JSON.stringify(fullAnalysis.report.next_actions),
        fullAnalysis.report.recommended_followup_date,
        fullAnalysis.report.followup_message,
        JSON.stringify(fullAnalysis.report.coaching_feedback),
        fullAnalysis.report.coaching_feedback.total_score
      ).run();

      return c.json({ 
        success: true, 
        data: {
          ...fullAnalysis,
          report_id: reportId
        }
      });
    } catch (aiError) {
      console.error('AI analysis error:', aiError);
      await db.prepare(
        'UPDATE consultations SET ai_analysis_status = ?, audio_url = ? WHERE id = ?'
      ).bind('failed', audioKey, consultId).run();
      return c.json({ success: false, error: 'AI 분석에 실패했습니다.' }, 500);
    }
  } catch (error) {
    console.error('Upload audio error:', error);
    return c.json({ success: false, error: '녹음 업로드에 실패했습니다.' }, 500);
  }
});

// POST /api/consultations/:id/analyze - Analyze existing transcript
consultations.post('/:id/analyze', async (c) => {
  try {
    const consultId = c.req.param('id');
    const orgId = c.get('organizationId');
    const db = c.env.DB;
    const { transcript } = await c.req.json();

    if (!transcript) {
      return c.json({ success: false, error: '스크립트가 필요합니다.' }, 400);
    }

    const apiKey = c.env.OPENAI_API_KEY;
    if (!apiKey) {
      return c.json({ success: false, error: 'OpenAI API 키가 설정되지 않았습니다.' }, 500);
    }

    const analysis = await analyzeConsultation(transcript, apiKey);

    // Update consultation
    await db.prepare(`
      UPDATE consultations SET
        transcript = ?,
        summary = ?,
        treatment_type = COALESCE(treatment_type, ?),
        treatment_area = COALESCE(treatment_area, ?),
        amount = COALESCE(amount, ?),
        patient_psychology = ?,
        emotion_flow = ?,
        key_quotes = ?,
        feedback = ?,
        decision_score = ?,
        ai_analysis_status = 'completed',
        updated_at = datetime('now')
      WHERE id = ? AND organization_id = ?
    `).bind(
      transcript,
      analysis.summary,
      analysis.treatment_type,
      analysis.treatment_area,
      analysis.amount,
      JSON.stringify(analysis.patient_psychology),
      JSON.stringify(analysis.emotion_flow),
      JSON.stringify(analysis.key_quotes),
      JSON.stringify(analysis.feedback),
      analysis.decision_score,
      consultId, orgId
    ).run();

    return c.json({ success: true, data: analysis });
  } catch (error) {
    console.error('Analyze error:', error);
    return c.json({ success: false, error: '분석에 실패했습니다.' }, 500);
  }
});

// PUT /api/consultations/:id - Update consultation
consultations.put('/:id', async (c) => {
  try {
    const consultId = c.req.param('id');
    const orgId = c.get('organizationId');
    const db = c.env.DB;
    const body = await c.req.json();

    const {
      status, treatment_type, treatment_area, amount, summary,
      patient_psychology, emotion_flow, key_quotes, feedback, decision_score
    } = body;

    await db.prepare(`
      UPDATE consultations SET
        status = COALESCE(?, status),
        treatment_type = COALESCE(?, treatment_type),
        treatment_area = COALESCE(?, treatment_area),
        amount = COALESCE(?, amount),
        summary = COALESCE(?, summary),
        patient_psychology = COALESCE(?, patient_psychology),
        emotion_flow = COALESCE(?, emotion_flow),
        key_quotes = COALESCE(?, key_quotes),
        feedback = COALESCE(?, feedback),
        decision_score = COALESCE(?, decision_score),
        updated_at = datetime('now')
      WHERE id = ? AND organization_id = ?
    `).bind(
      status,
      treatment_type,
      treatment_area,
      amount,
      summary,
      patient_psychology ? JSON.stringify(patient_psychology) : null,
      emotion_flow ? JSON.stringify(emotion_flow) : null,
      key_quotes ? JSON.stringify(key_quotes) : null,
      feedback ? JSON.stringify(feedback) : null,
      decision_score,
      consultId, orgId
    ).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Update consultation error:', error);
    return c.json({ success: false, error: '상담 기록 수정에 실패했습니다.' }, 500);
  }
});

// PUT /api/consultations/:id/link-patient - Link patient to consultation (for quick recording)
consultations.put('/:id/link-patient', async (c) => {
  try {
    const consultId = c.req.param('id');
    const orgId = c.get('organizationId');
    const db = c.env.DB;
    const { patient_id } = await c.req.json();

    if (!patient_id) {
      return c.json({ success: false, error: '환자를 선택해주세요.' }, 400);
    }

    // Verify consultation exists and has no patient linked
    const consultation = await db.prepare(
      'SELECT id, patient_id FROM consultations WHERE id = ? AND organization_id = ?'
    ).bind(consultId, orgId).first();

    if (!consultation) {
      return c.json({ success: false, error: '상담 기록을 찾을 수 없습니다.' }, 404);
    }

    // Verify patient exists
    const patient = await db.prepare(
      'SELECT id, name FROM patients WHERE id = ? AND organization_id = ?'
    ).bind(patient_id, orgId).first();

    if (!patient) {
      return c.json({ success: false, error: '환자를 찾을 수 없습니다.' }, 404);
    }

    // Update consultation with patient
    await db.prepare(
      'UPDATE consultations SET patient_id = ?, updated_at = datetime("now") WHERE id = ?'
    ).bind(patient_id, consultId).run();

    return c.json({
      success: true,
      data: { 
        consultation_id: consultId,
        patient_id: patient_id,
        patient_name: patient.name
      }
    });
  } catch (error) {
    console.error('Link patient error:', error);
    return c.json({ success: false, error: '환자 연결에 실패했습니다.' }, 500);
  }
});

// GET /api/consultations/unlinked - Get consultations without patient linked
consultations.get('/unlinked/list', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;

    const result = await db.prepare(`
      SELECT c.*, u.name as user_name
      FROM consultations c
      JOIN users u ON c.user_id = u.id
      WHERE c.organization_id = ? AND c.patient_id IS NULL
      ORDER BY c.consultation_date DESC
      LIMIT 50
    `).bind(orgId).all();

    return c.json({ success: true, data: result.results });
  } catch (error) {
    console.error('Get unlinked consultations error:', error);
    return c.json({ success: false, error: '미연결 상담 목록을 불러오는데 실패했습니다.' }, 500);
  }
});

// DELETE /api/consultations/:id - Delete consultation
consultations.delete('/:id', async (c) => {
  try {
    const consultId = c.req.param('id');
    const orgId = c.get('organizationId');
    const db = c.env.DB;

    await db.prepare(
      'DELETE FROM consultations WHERE id = ? AND organization_id = ?'
    ).bind(consultId, orgId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete consultation error:', error);
    return c.json({ success: false, error: '상담 기록 삭제에 실패했습니다.' }, 500);
  }
});

export default consultations;
