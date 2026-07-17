// Consultation Routes
import { Hono } from 'hono';
import { generateId, safeParseJSON } from '../lib/utils';
import { authMiddleware } from '../lib/auth';
import { analyzeConsultation } from '../lib/ai';
import { runAnalysisJob, transcribeSegmentJob } from '../lib/analysis-runner';
import { safeInt } from '../lib/middleware';
import type { AppEnv, Env, Consultation } from '../types';

const consultations = new Hono<AppEnv>();

// Apply auth middleware to all routes
consultations.use('*', authMiddleware);

// GET /api/consultations - List consultations (ENHANCED: date/amount/score filters, multi-sort)
consultations.get('/', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;

    const { 
      status, patient_id, my_only, search, 
      date_from, date_to, amount_min, amount_max,
      score_min, score_max, treatment_type,
      sort = 'date_desc',
      limit = '50', offset = '0' 
    } = c.req.query();

    let query = `
      SELECT c.*, p.name as patient_name, u.name as user_name,
        json_extract(c.feedback, '$.total_score') as consult_score
      FROM consultations c
      LEFT JOIN patients p ON c.patient_id = p.id
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

    if (search) {
      query += ` AND (p.name LIKE ? OR c.treatment_type LIKE ? OR u.name LIKE ? OR c.summary LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Date range filter
    if (date_from) {
      query += ` AND date(c.consultation_date) >= date(?)`;
      params.push(date_from);
    }
    if (date_to) {
      query += ` AND date(c.consultation_date) <= date(?)`;
      params.push(date_to);
    }

    // Amount range filter
    if (amount_min) {
      query += ` AND c.amount >= ?`;
      params.push(safeInt(amount_min, 0, 0, 999999999));
    }
    if (amount_max) {
      query += ` AND c.amount <= ?`;
      params.push(safeInt(amount_max, 999999999, 0, 999999999));
    }

    // Coaching score filter
    if (score_min) {
      query += ` AND CAST(json_extract(c.feedback, '$.total_score') AS INTEGER) >= ?`;
      params.push(safeInt(score_min, 0, 0, 100));
    }
    if (score_max) {
      query += ` AND CAST(json_extract(c.feedback, '$.total_score') AS INTEGER) <= ?`;
      params.push(safeInt(score_max, 100, 0, 100));
    }

    // Treatment type filter
    if (treatment_type) {
      query += ` AND c.treatment_type = ?`;
      params.push(treatment_type);
    }

    // Multi-sort
    const sortMap: Record<string, string> = {
      'date_desc': 'c.consultation_date DESC',
      'date_asc': 'c.consultation_date ASC',
      'amount_desc': 'c.amount DESC',
      'amount_asc': 'c.amount ASC',
      'score_desc': 'CAST(json_extract(c.feedback, \'$.total_score\') AS INTEGER) DESC',
      'score_asc': 'CAST(json_extract(c.feedback, \'$.total_score\') AS INTEGER) ASC',
      'decision_desc': 'c.decision_score DESC',
    };
    const orderBy = sortMap[sort] || sortMap['date_desc'];

    // Count total matching rows (before LIMIT/OFFSET)
    const selectIdx = query.indexOf('SELECT');
    const fromIdx = query.indexOf('FROM consultations');
    const countQuery = 'SELECT COUNT(*) as total ' + query.substring(fromIdx);
    const countResult = await db.prepare(countQuery).bind(...params).first<{ total: number }>();
    const total = countResult?.total || 0;

    query += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    params.push(safeInt(limit, 50, 1, 200), safeInt(offset, 0, 0, 100000));

    const result = await db.prepare(query).bind(...params).all();

    const data = result.results.map(c => ({
      ...c,
      patient_psychology: safeParseJSON(c.patient_psychology as string, {}),
      emotion_flow: safeParseJSON(c.emotion_flow as string, {}),
      key_quotes: safeParseJSON(c.key_quotes as string, []),
      feedback: safeParseJSON(c.feedback as string, {})
    }));

    const parsedLimit = safeInt(limit, 50, 1, 200);
    const parsedOffset = safeInt(offset, 0, 0, 100000);
    return c.json({ 
      success: true, 
      data, 
      total,
      has_more: parsedOffset + parsedLimit < total,
      limit: parsedLimit,
      offset: parsedOffset
    });
  } catch (error) {
    console.error('List consultations error:', error);
    return c.json({ success: false, error: '상담 목록을 불러오는데 실패했습니다.' }, 500);
  }
});

// GET /api/consultations/search-transcripts?q=키워드 - 상담 원문 전문 검색 (v8.6)
// "그때 임플란트 가격 뭐라고 했더라?" → 원문에서 키워드 스니펫 검색
consultations.get('/search-transcripts', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;
    const { q, patient_id, limit = '20' } = c.req.query();

    const keyword = (q || '').trim();
    if (keyword.length < 2) {
      return c.json({ success: false, error: '검색어는 2자 이상 입력해주세요.' }, 400);
    }
    if (keyword.length > 50) {
      return c.json({ success: false, error: '검색어가 너무 깁니다.' }, 400);
    }

    let query = `
      SELECT c.id, c.consultation_date, c.treatment_type, c.status, c.amount,
        c.transcript, c.patient_id, p.name as patient_name, u.name as user_name
      FROM consultations c
      LEFT JOIN patients p ON c.patient_id = p.id
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.organization_id = ? AND c.transcript LIKE ?
    `;
    const params: (string | number)[] = [orgId, `%${keyword}%`];
    if (patient_id) { query += ' AND c.patient_id = ?'; params.push(patient_id); }
    query += ' ORDER BY c.consultation_date DESC LIMIT ?';
    params.push(Math.min(parseInt(limit) || 20, 50));

    const result = await db.prepare(query).bind(...params).all();

    // 스니펫 추출: 키워드 주변 ±60자, 상담당 최대 3개
    const lowerKw = keyword.toLowerCase();
    const matches = (result.results as any[]).map(r => {
      const text = (r.transcript || '') as string;
      const lowerText = text.toLowerCase();
      const snippets: { text: string; index: number }[] = [];
      let pos = 0;
      while (snippets.length < 3) {
        const idx = lowerText.indexOf(lowerKw, pos);
        if (idx === -1) break;
        const start = Math.max(0, idx - 60);
        const end = Math.min(text.length, idx + keyword.length + 60);
        snippets.push({
          text: (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : ''),
          index: idx,
        });
        pos = idx + keyword.length;
      }
      // 총 매치 수 카운트
      let count = 0; let p2 = 0;
      while (true) {
        const i = lowerText.indexOf(lowerKw, p2);
        if (i === -1) break;
        count++; p2 = i + keyword.length;
      }
      return {
        consultation_id: r.id,
        consultation_date: r.consultation_date,
        treatment_type: r.treatment_type,
        status: r.status,
        amount: r.amount,
        patient_id: r.patient_id,
        patient_name: r.patient_name,
        user_name: r.user_name,
        match_count: count,
        snippets,
      };
    });

    // 감사 로그: 원문 검색 행위 기록 (검색어 포함 — 접근 추적)
    const { writeAuditLog } = await import('./privacy');
    const user = await db.prepare('SELECT name FROM users WHERE id = ?').bind(userId).first();
    c.executionCtx.waitUntil(
      writeAuditLog(db, orgId, userId, (user?.name as string) || null, 'transcript_search', 'organization', orgId, {
        keyword, result_count: matches.length,
      })
    );

    return c.json({ success: true, data: { keyword, results: matches, total: matches.length } });
  } catch (error) {
    console.error('Transcript search error:', error);
    return c.json({ success: false, error: '원문 검색에 실패했습니다.' }, 500);
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
    const { patient_id, consultation_date, duration, treatment_type, treatment_area, amount, status, recording_consent } = body;

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

    const hasConsent = recording_consent === true || recording_consent === 1;
    await db.prepare(`
      INSERT INTO consultations (
        id, organization_id, user_id, patient_id, consultation_date, 
        duration, treatment_type, treatment_area, amount, status,
        recording_consent, consent_at, consent_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      consultId, orgId, userId, actualPatientId,
      consultation_date || new Date().toISOString(),
      duration || null, treatment_type || null, treatment_area || null,
      amount || null, status || 'pending',
      hasConsent ? 1 : 0,
      hasConsent ? new Date().toISOString() : null,
      hasConsent ? userId : null
    ).run();

    // 동의 확인 감사 로그
    if (hasConsent) {
      const { writeAuditLog } = await import('./privacy');
      c.executionCtx.waitUntil(
        writeAuditLog(db, orgId, userId, null, 'consent_recorded', 'consultation', consultId, {
          patient_id: actualPatientId,
        })
      );
    }

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

// ============================================================
// v8.0 RELIABLE RECORDING & ASYNC ANALYSIS
// - 세그먼트 업로드 (긴 상담도 안전: 탭 죽어도 마지막 세그먼트만 손실)
// - 비동기 분석 (waitUntil) + analysis_step 폴링
// - 재분석 / 오디오 다시듣기
// ============================================================

// POST /api/consultations/:id/segments - Upload one recording segment (v8.0)
consultations.post('/:id/segments', async (c) => {
  try {
    const consultId = c.req.param('id');
    const orgId = c.get('organizationId');
    const db = c.env.DB;

    const consultation = await db.prepare(
      'SELECT id FROM consultations WHERE id = ? AND organization_id = ?'
    ).bind(consultId, orgId).first();
    if (!consultation) {
      return c.json({ success: false, error: '상담 기록을 찾을 수 없습니다.' }, 404);
    }

    const formData = await c.req.formData();
    const audioFile = formData.get('audio') as File;
    const indexStr = formData.get('index') as string;
    if (!audioFile || indexStr === null) {
      return c.json({ success: false, error: '세그먼트 데이터가 없습니다.' }, 400);
    }
    // 60초 webm 세그먼트는 통상 1~2MB — 10MB 초과는 비정상 (R2 오남용 방지)
    if (audioFile.size > 10 * 1024 * 1024) {
      return c.json({ success: false, error: '세그먼트 크기가 10MB를 초과합니다.' }, 413);
    }
    const segIndex = parseInt(indexStr, 10);
    if (!Number.isInteger(segIndex) || segIndex < 0 || segIndex > 9999) {
      return c.json({ success: false, error: '유효하지 않은 세그먼트 번호입니다.' }, 400);
    }

    // R2에 세그먼트 저장
    const segKey = `consultations/${consultId}/segments/${String(segIndex).padStart(4, '0')}.webm`;
    const audioData = await audioFile.arrayBuffer();
    await c.env.R2.put(segKey, audioData, { httpMetadata: { contentType: audioFile.type || 'audio/webm' } });

    // stt_chunks 레코드 (transcript는 백그라운드 STT가 채움)
    const chunkId = 'seg_' + generateId().slice(0, 12);
    await db.prepare(`
      INSERT INTO stt_chunks (id, consultation_id, chunk_index, audio_url, transcript)
      VALUES (?, ?, ?, ?, NULL)
    `).bind(chunkId, consultId, segIndex, segKey).run();

    await db.prepare('UPDATE consultations SET segment_count = MAX(COALESCE(segment_count,0), ?), recording_status = \'recording\', updated_at = datetime(\'now\') WHERE id = ?')
      .bind(segIndex + 1, consultId).run();

    // 백그라운드 STT (응답 차단 없음) — 실패해도 finalize에서 재시도
    const apiKey = c.env.OPENAI_API_KEY;
    if (apiKey) {
      c.executionCtx.waitUntil(transcribeSegmentJob(db, c.env as any, apiKey, chunkId, audioData));
    }

    return c.json({ success: true, data: { segment_index: segIndex, chunk_id: chunkId } });
  } catch (error) {
    console.error('Segment upload error:', error);
    return c.json({ success: false, error: '세그먼트 업로드에 실패했습니다.' }, 500);
  }
});

// POST /api/consultations/:id/finalize - Finish segmented recording → async full analysis (v8.0)
consultations.post('/:id/finalize', async (c) => {
  try {
    const consultId = c.req.param('id');
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;

    const consultation = await db.prepare(`
      SELECT c.id, c.patient_id, p.name as patient_name, p.age as patient_age, p.gender as patient_gender
      FROM consultations c LEFT JOIN patients p ON c.patient_id = p.id
      WHERE c.id = ? AND c.organization_id = ?
    `).bind(consultId, orgId).first();
    if (!consultation) {
      return c.json({ success: false, error: '상담 기록을 찾을 수 없습니다.' }, 404);
    }

    const body = await c.req.json().catch(() => ({}));
    const duration = body.duration ? parseInt(String(body.duration), 10) : null;

    const apiKey = c.env.OPENAI_API_KEY;
    if (!apiKey) {
      return c.json({ success: false, error: 'OpenAI API 키가 설정되지 않았습니다.' }, 500);
    }

    // 상태 전환: 즉시 응답 → 백그라운드 분석
    await db.prepare(`
      UPDATE consultations SET ai_analysis_status = 'processing', analysis_step = 'transcribing',
        analysis_error = NULL, duration = COALESCE(?, duration), recording_status = 'completed', updated_at = datetime('now')
      WHERE id = ?
    `).bind(duration, consultId).run();

    const patientInfo = {
      name: (consultation.patient_name as string) || '미지정',
      age: consultation.patient_age as number | undefined,
      gender: consultation.patient_gender as string | undefined,
    };

    // 백그라운드 잡: 미완료 세그먼트 STT 재시도 → transcript 병합 → 분석
    const env = c.env as any;
    const job = (async () => {
      try {
        const chunks = await db.prepare(
          'SELECT id, chunk_index, audio_url, transcript FROM stt_chunks WHERE consultation_id = ? ORDER BY chunk_index ASC'
        ).bind(consultId).all();

        if (!chunks.results.length) {
          throw new Error('업로드된 녹음 세그먼트가 없습니다.');
        }

        // 누락 STT 재시도 (세그먼트 업로드 시 백그라운드 STT 실패분)
        for (const ch of chunks.results as any[]) {
          if (!ch.transcript && ch.audio_url) {
            const obj = await env.R2.get(ch.audio_url);
            if (obj) {
              const buf = await obj.arrayBuffer();
              await transcribeSegmentJob(db, env, apiKey, ch.id, buf);
            }
          }
        }

        // 병합
        const refreshed = await db.prepare(
          'SELECT chunk_index, transcript FROM stt_chunks WHERE consultation_id = ? ORDER BY chunk_index ASC'
        ).bind(consultId).all();
        const mergedTranscript = (refreshed.results as any[])
          .map(r => (r.transcript || '').trim())
          .filter(Boolean)
          .join(' ');

        if (!mergedTranscript) {
          throw new Error('음성 인식 결과가 없습니다. 녹음 상태를 확인해주세요.');
        }

        // audioKey는 null — audio_url을 세그먼트 하나로 오염시키면 재생이 첫 1분만 됨.
        // 세그먼트 녹음의 재생은 /audio 가 stt_chunks 목록으로 순차 재생 처리.
        await runAnalysisJob({
          db, env, apiKey, consultId, orgId, userId, patientInfo,
          transcript: mergedTranscript,
          audioKey: null,
        });
      } catch (err: any) {
        console.error('[Finalize] job failed:', err?.message);
        await db.prepare(`
          UPDATE consultations SET ai_analysis_status = 'failed', analysis_step = 'failed:transcribing', analysis_error = ?, updated_at = datetime('now')
          WHERE id = ?
        `).bind(String(err?.message || '알 수 없는 오류').slice(0, 500), consultId).run();
      }
    })();
    c.executionCtx.waitUntil(job);

    return c.json({ success: true, data: { consultation_id: consultId, status: 'processing' } });
  } catch (error) {
    console.error('Finalize error:', error);
    return c.json({ success: false, error: '녹음 마무리에 실패했습니다.' }, 500);
  }
});

// GET /api/consultations/:id/analysis-status - Poll analysis progress (v8.0)
consultations.get('/:id/analysis-status', async (c) => {
  try {
    const consultId = c.req.param('id');
    const orgId = c.get('organizationId');
    const db = c.env.DB;

    const row = await db.prepare(`
      SELECT c.ai_analysis_status, c.analysis_step, c.analysis_error,
        CAST((julianday('now') - julianday(c.updated_at)) * 1440 AS INTEGER) as stale_minutes,
        (SELECT r.id FROM consultation_reports r WHERE r.consultation_id = c.id) as report_id,
        (SELECT r.coaching_score FROM consultation_reports r WHERE r.consultation_id = c.id) as coaching_score
      FROM consultations c WHERE c.id = ? AND c.organization_id = ?
    `).bind(consultId, orgId).first();

    if (!row) return c.json({ success: false, error: '상담 기록을 찾을 수 없습니다.' }, 404);

    // 좌초 감지: 10분 이상 진행 없는 processing → failed 전환 (워커 재배포/크래시로 waitUntil 유실 케이스)
    // v9.0.1: AI 호출 타임아웃 축소(90s×2)로 정상 스텝은 최대 ~6분 → 10분이면 확실히 좌초
    if (row.ai_analysis_status === 'processing' && (row.stale_minutes as number) >= 10) {
      await db.prepare(`
        UPDATE consultations SET ai_analysis_status = 'failed', analysis_step = 'failed:stalled',
          analysis_error = '분석이 중단되었습니다. 다시 분석해주세요. (녹음은 안전하게 저장되어 있습니다)', updated_at = datetime('now')
        WHERE id = ?
      `).bind(consultId).run();
      (row as any).ai_analysis_status = 'failed';
      (row as any).analysis_step = 'failed:stalled';
      (row as any).analysis_error = '분석이 중단되었습니다. 다시 분석해주세요. (녹음은 안전하게 저장되어 있습니다)';
    }

    const stepLabels: Record<string, { label: string; pct: number }> = {
      'transcribing': { label: '음성 인식 중', pct: 25 },
      'diarizing': { label: '화자 분리 중', pct: 50 },
      'extracting': { label: 'NER + SPIN 분석 중', pct: 70 },
      'reporting': { label: '코칭 리포트 생성 중', pct: 88 },
      'done': { label: '분석 완료', pct: 100 },
    };
    const step = (row.analysis_step as string) || '';
    const info = stepLabels[step] || { label: step.startsWith('failed') ? '분석 실패' : '대기 중', pct: step.startsWith('failed') ? 0 : 10 };

    return c.json({
      success: true,
      data: {
        status: row.ai_analysis_status,
        step, step_label: info.label, progress: info.pct,
        error: row.analysis_error || null,
        report_id: row.report_id || null,
        coaching_score: row.coaching_score || null,
      }
    });
  } catch (error) {
    console.error('Analysis status error:', error);
    return c.json({ success: false, error: '상태 조회에 실패했습니다.' }, 500);
  }
});

// POST /api/consultations/:id/reanalyze - Re-run analysis from stored audio/segments (v8.0)
consultations.post('/:id/reanalyze', async (c) => {
  try {
    const consultId = c.req.param('id');
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;

    const consultation = await db.prepare(`
      SELECT c.id, c.audio_url, c.transcript, p.name as patient_name, p.age as patient_age, p.gender as patient_gender
      FROM consultations c LEFT JOIN patients p ON c.patient_id = p.id
      WHERE c.id = ? AND c.organization_id = ?
    `).bind(consultId, orgId).first();
    if (!consultation) return c.json({ success: false, error: '상담 기록을 찾을 수 없습니다.' }, 404);

    const apiKey = c.env.OPENAI_API_KEY;
    if (!apiKey) return c.json({ success: false, error: 'OpenAI API 키가 설정되지 않았습니다.' }, 500);

    const patientInfo = {
      name: (consultation.patient_name as string) || '미지정',
      age: consultation.patient_age as number | undefined,
      gender: consultation.patient_gender as string | undefined,
    };

    await db.prepare(`
      UPDATE consultations SET ai_analysis_status = 'processing', analysis_step = 'transcribing', analysis_error = NULL, updated_at = datetime('now')
      WHERE id = ?
    `).bind(consultId).run();

    const env = c.env as any;
    const job = (async () => {
      // 소스 우선순위: 세그먼트 transcript → 기존 transcript → 단일 오디오 파일
      const chunks = await db.prepare(
        'SELECT chunk_index, transcript FROM stt_chunks WHERE consultation_id = ? AND transcript IS NOT NULL ORDER BY chunk_index ASC'
      ).bind(consultId).all();
      const mergedTranscript = (chunks.results as any[]).map(r => (r.transcript || '').trim()).filter(Boolean).join(' ');

      if (mergedTranscript) {
        await runAnalysisJob({ db, env, apiKey, consultId, orgId, userId, patientInfo, transcript: mergedTranscript, audioKey: null });
      } else if (consultation.transcript) {
        await runAnalysisJob({ db, env, apiKey, consultId, orgId, userId, patientInfo, transcript: consultation.transcript as string, audioKey: null });
      } else if (consultation.audio_url) {
        const obj = await env.R2.get(consultation.audio_url as string);
        if (!obj) {
          await db.prepare('UPDATE consultations SET ai_analysis_status = \'failed\', analysis_step = \'failed:transcribing\', analysis_error = \'저장된 녹음 파일을 찾을 수 없습니다.\' WHERE id = ?').bind(consultId).run();
          return;
        }
        const buf = await obj.arrayBuffer();
        await runAnalysisJob({ db, env, apiKey, consultId, orgId, userId, patientInfo, audioData: buf, audioKey: consultation.audio_url as string });
      } else {
        await db.prepare('UPDATE consultations SET ai_analysis_status = \'failed\', analysis_step = \'failed:transcribing\', analysis_error = \'분석할 녹음이나 스크립트가 없습니다.\' WHERE id = ?').bind(consultId).run();
      }
    })();
    c.executionCtx.waitUntil(job);

    return c.json({ success: true, data: { consultation_id: consultId, status: 'processing' } });
  } catch (error) {
    console.error('Reanalyze error:', error);
    return c.json({ success: false, error: '재분석 시작에 실패했습니다.' }, 500);
  }
});

// GET /api/consultations/:id/audio - Stream recording for playback (v8.0)
// ?segment=N 지정 시 해당 세그먼트, 미지정 시 단일 녹음 파일 또는 세그먼트 목록 반환
consultations.get('/:id/audio', async (c) => {
  try {
    const consultId = c.req.param('id');
    const orgId = c.get('organizationId');
    const db = c.env.DB;
    const segParam = c.req.query('segment');

    const consultation = await db.prepare(
      'SELECT id, audio_url FROM consultations WHERE id = ? AND organization_id = ?'
    ).bind(consultId, orgId).first();
    if (!consultation) return c.json({ success: false, error: '상담 기록을 찾을 수 없습니다.' }, 404);

    // 세그먼트 지정 재생
    if (segParam !== undefined && segParam !== null && segParam !== '') {
      const chunk = await db.prepare(
        'SELECT audio_url FROM stt_chunks WHERE consultation_id = ? AND chunk_index = ?'
      ).bind(consultId, parseInt(segParam, 10)).first();
      if (!chunk?.audio_url) return c.json({ success: false, error: '세그먼트를 찾을 수 없습니다.' }, 404);
      const obj = await c.env.R2.get(chunk.audio_url as string);
      if (!obj) return c.json({ success: false, error: '오디오 파일이 없습니다.' }, 404);
      return new Response(obj.body, { headers: { 'Content-Type': obj.httpMetadata?.contentType || 'audio/webm', 'Cache-Control': 'private, max-age=3600' } });
    }

    // 단일 파일 재생 (레거시 녹음)
    if (consultation.audio_url) {
      const obj = await c.env.R2.get(consultation.audio_url as string);
      if (obj) {
        return new Response(obj.body, { headers: { 'Content-Type': obj.httpMetadata?.contentType || 'audio/webm', 'Cache-Control': 'private, max-age=3600' } });
      }
    }

    // 세그먼트 목록 반환 (프론트가 순차 재생)
    const chunks = await db.prepare(
      'SELECT chunk_index FROM stt_chunks WHERE consultation_id = ? AND audio_url IS NOT NULL ORDER BY chunk_index ASC'
    ).bind(consultId).all();
    if (chunks.results.length > 0) {
      return c.json({ success: true, data: { type: 'segments', segments: chunks.results.map((r: any) => r.chunk_index) } });
    }

    return c.json({ success: false, error: '재생 가능한 녹음이 없습니다.' }, 404);
  } catch (error) {
    console.error('Audio fetch error:', error);
    return c.json({ success: false, error: '오디오 로드에 실패했습니다.' }, 500);
  }
});

// POST /api/consultations/:id/upload-audio - Upload single audio → async analysis (v8.0 rewrite)
consultations.post('/:id/upload-audio', async (c) => {
  try {
    const consultId = c.req.param('id');
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const db = c.env.DB;

    const consultation = await db.prepare(`
      SELECT c.id, p.name as patient_name, p.age as patient_age, p.gender as patient_gender
      FROM consultations c LEFT JOIN patients p ON c.patient_id = p.id
      WHERE c.id = ? AND c.organization_id = ?
    `).bind(consultId, orgId).first();
    if (!consultation) {
      return c.json({ success: false, error: '상담 기록을 찾을 수 없습니다.' }, 404);
    }

    const formData = await c.req.formData();
    const audioFile = formData.get('audio') as File;
    const duration = formData.get('duration') as string;
    if (!audioFile) {
      return c.json({ success: false, error: '녹음 파일이 없습니다.' }, 400);
    }

    const apiKey = c.env.OPENAI_API_KEY;
    if (!apiKey) {
      return c.json({ success: false, error: 'OpenAI API 키가 설정되지 않았습니다.' }, 500);
    }

    // R2 저장
    const audioKey = `consultations/${consultId}/recording.webm`;
    const audioData = await audioFile.arrayBuffer();
    await c.env.R2.put(audioKey, audioData, { httpMetadata: { contentType: audioFile.type } });

    // 즉시 processing 전환 후 응답 — 분석은 백그라운드
    await db.prepare(`
      UPDATE consultations SET ai_analysis_status = 'processing', analysis_step = 'transcribing',
        analysis_error = NULL, duration = ?, audio_url = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(duration ? parseInt(duration) : null, audioKey, consultId).run();

    const patientInfo = {
      name: (consultation.patient_name as string) || '미지정',
      age: consultation.patient_age as number | undefined,
      gender: consultation.patient_gender as string | undefined,
    };

    c.executionCtx.waitUntil(runAnalysisJob({
      db, env: c.env as any, apiKey, consultId, orgId, userId, patientInfo, audioData, audioKey,
    }));

    return c.json({ success: true, data: { consultation_id: consultId, status: 'processing', async: true } });
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

    const analysis = await analyzeConsultation(transcript, apiKey, c.env as any);

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
    const userId = c.get('userId');
    const db = c.env.DB;
    const body = await c.req.json();

    const {
      status, treatment_type, treatment_area, amount, summary,
      patient_psychology, emotion_flow, key_quotes, feedback, decision_score
    } = body;

    // status 화이트리스트 검증 — 임의 값 저장 시 KPI 집계/자동 트리거 오작동 방지
    const VALID_STATUSES = ['pending', 'paid', 'undecided', 'lost'];
    if (status !== undefined && status !== null && !VALID_STATUSES.includes(status)) {
      return c.json({ success: false, error: `유효하지 않은 상태값입니다. (허용: ${VALID_STATUSES.join(', ')})` }, 400);
    }
    // amount 숫자 검증 — 문자열/음수 유입 시 매출 집계 오염 방지
    if (amount !== undefined && amount !== null && (typeof amount !== 'number' || amount < 0 || !Number.isFinite(amount))) {
      return c.json({ success: false, error: '금액은 0 이상의 숫자여야 합니다.' }, 400);
    }

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
      status ?? null,
      treatment_type ?? null,
      treatment_area ?? null,
      amount ?? null,
      summary ?? null,
      patient_psychology ? JSON.stringify(patient_psychology) : null,
      emotion_flow ? JSON.stringify(emotion_flow) : null,
      key_quotes ? JSON.stringify(key_quotes) : null,
      feedback ? JSON.stringify(feedback) : null,
      decision_score ?? null,
      consultId, orgId
    ).run();

    // === AUTO RETENTION TRIGGER ===
    // When status changes to 'paid', auto-update patient's last_visit_date
    if (status === 'paid') {
      try {
        const consult = await db.prepare('SELECT patient_id FROM consultations WHERE id = ? AND organization_id = ?').bind(consultId, orgId).first();
        if (consult?.patient_id) {
          await db.prepare(`
            UPDATE patients SET last_visit_date = datetime('now'), updated_at = datetime('now')
            WHERE id = ? AND organization_id = ?
          `).bind(consult.patient_id, orgId).run();
        }
      } catch (e) { console.error('Auto retention trigger error:', e); }
    }

    // === AUTO TASK GENERATION TRIGGER ===
    // When a new consultation is created as 'undecided', schedule a closing task for 2 days later
    if (status === 'undecided') {
      try {
        const consult = await db.prepare('SELECT patient_id, user_id, treatment_type, amount, summary FROM consultations WHERE id = ? AND organization_id = ?')
          .bind(consultId, orgId).first();
        if (consult?.patient_id) {
          // Check no pending closing task exists for this consultation
          const existingTask = await db.prepare(`
            SELECT id FROM contact_tasks WHERE consultation_id = ? AND task_type = 'closing' AND status = 'pending'
          `).bind(consultId).first();
          
          if (!existingTask) {
            const taskDate = new Date();
            taskDate.setDate(taskDate.getDate() + 2);
            const taskDateStr = taskDate.toISOString().split('T')[0];
            const taskId = 'task_' + generateId().slice(0, 8);

            // Get patient name for the message
            const patient = await db.prepare('SELECT name FROM patients WHERE id = ?').bind(consult.patient_id).first();
            const pName = (patient?.name || '환자') as string;
            const treatType = (consult.treatment_type || '치료') as string;
            
            await db.prepare(`
              INSERT INTO contact_tasks (id, organization_id, consultation_id, user_id, patient_id, task_type, recommended_date, recommended_message, points, origin)
              VALUES (?, ?, ?, ?, ?, 'closing', ?, ?, ?, 'auto_rule')
            `).bind(
              taskId, orgId, consultId, userId, consult.patient_id, taskDateStr,
              `${pName}님, 지난번 ${treatType} 상담 후 고민은 좀 정리되셨나요? 궁금하신 점이 있으시면 편하게 말씀해주세요.`,
              JSON.stringify(['상담 후 고민 포인트 확인', '추가 질문 응대', '결정 유도 (부드럽게)'])
            ).run();
          }
        }
      } catch (e) { console.error('Auto task generation error:', e); }
    }

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
