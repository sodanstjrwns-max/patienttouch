// KakaoTalk Notification Routes
// Integrates with Kakao Business API for sending AlimTalk notifications
import { Hono } from 'hono';
import { generateId, safeParseJSON } from '../lib/utils';
import { authMiddleware } from '../lib/auth';
import type { Env } from '../types';

const kakao = new Hono<{ Bindings: Env }>();

kakao.use('*', authMiddleware);

// =============================================
// KakaoTalk Configuration
// =============================================

// GET /api/kakao/config - Get KakaoTalk configuration status
kakao.get('/config', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const db = c.env.DB;
    
    // Check if kakao config exists in organization settings
    const org = await db.prepare(
      'SELECT kakao_api_key, kakao_sender_key, kakao_channel_id FROM organizations WHERE id = ?'
    ).bind(orgId).first();
    
    return c.json({
      success: true,
      data: {
        configured: !!(org?.kakao_api_key && org?.kakao_sender_key),
        has_api_key: !!org?.kakao_api_key,
        has_sender_key: !!org?.kakao_sender_key,
        channel_id: org?.kakao_channel_id || null
      }
    });
  } catch (error) {
    console.error('Kakao config error:', error);
    return c.json({ success: true, data: { configured: false, has_api_key: false, has_sender_key: false } });
  }
});

// PUT /api/kakao/config - Update KakaoTalk configuration
kakao.put('/config', async (c) => {
  try {
    const orgId = c.get('organizationId'); const role = (c.get('auth') as any)?.role;
    if (role !== 'admin') return c.json({ success: false, error: '관리자만 설정할 수 있습니다' }, 403);
    
    const { api_key, sender_key, channel_id } = await c.req.json();
    const db = c.env.DB;
    
    await db.prepare(
      'UPDATE organizations SET kakao_api_key = ?, kakao_sender_key = ?, kakao_channel_id = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).bind(api_key || null, sender_key || null, channel_id || null, orgId).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Kakao config update error:', error);
    return c.json({ success: false, error: '설정 저장 실패' }, 500);
  }
});

// =============================================
// Message Templates
// =============================================

// GET /api/kakao/templates - Get available message templates
kakao.get('/templates', async (c) => {
  const templates = [
    {
      id: 'appointment_reminder',
      name: '예약 알림',
      category: 'appointment',
      template: '#{patient_name}님, 안녕하세요!\n#{clinic_name}입니다.\n\n#{appointment_date} #{appointment_time}에 예약이 있습니다.\n\n변경이나 취소는 미리 연락 부탁드립니다.\n📞 #{clinic_phone}',
      variables: ['patient_name', 'clinic_name', 'appointment_date', 'appointment_time', 'clinic_phone']
    },
    {
      id: 'treatment_proposal',
      name: '치료 제안서 발송',
      category: 'proposal',
      template: '#{patient_name}님, 안녕하세요!\n#{clinic_name}입니다.\n\n상담 내용을 바탕으로 맞춤 치료 계획서를 준비했습니다.\n\n아래 링크에서 확인해 주세요 😊\n#{proposal_url}\n\n궁금한 점이 있으시면 편하게 연락 주세요!\n📞 #{clinic_phone}',
      variables: ['patient_name', 'clinic_name', 'proposal_url', 'clinic_phone']
    },
    {
      id: 'retention_followup',
      name: '리텐션 팔로업',
      category: 'retention',
      template: '#{patient_name}님, 안녕하세요!\n#{clinic_name}입니다.\n\n마지막 방문 이후 경과가 궁금하여 연락드립니다.\n#{custom_message}\n\n편하신 시간에 방문 예약 부탁드립니다 😊\n📞 #{clinic_phone}',
      variables: ['patient_name', 'clinic_name', 'custom_message', 'clinic_phone']
    },
    {
      id: 'recall_checkup',
      name: '정기검진 리콜',
      category: 'recall',
      template: '#{patient_name}님, 안녕하세요!\n#{clinic_name}입니다.\n\n정기 검진 시기가 되어 안내드립니다.\n6개월마다 정기 검진을 받으시면 큰 치료를 예방할 수 있어요.\n\n예약을 원하시면 편하게 연락 주세요! 😊\n📞 #{clinic_phone}',
      variables: ['patient_name', 'clinic_name', 'clinic_phone']
    },
    {
      id: 'treatment_incomplete',
      name: '치료 미완료 안내',
      category: 'retention',
      template: '#{patient_name}님, 안녕하세요!\n#{clinic_name}입니다.\n\n진행 중이셨던 #{treatment_type} 치료가 남아있어 안내드립니다.\n중단된 치료는 시간이 지날수록 추가 비용이 필요할 수 있습니다.\n\n간단한 체크업만으로도 상태 확인이 가능하니, 부담 갖지 마시고 방문해 주세요 😊\n📞 #{clinic_phone}',
      variables: ['patient_name', 'clinic_name', 'treatment_type', 'clinic_phone']
    },
    {
      id: 'thank_referral',
      name: '감사 & 소개 요청',
      category: 'marketing',
      template: '#{patient_name}님, 안녕하세요!\n#{clinic_name}입니다.\n\n치료 잘 마무리해 주셔서 감사합니다.\n혹시 주변에 치과 치료가 필요하신 분이 계시다면 소개해 주세요.\n소개해 주신 분께도 특별 혜택을 드리겠습니다! 🎁\n📞 #{clinic_phone}',
      variables: ['patient_name', 'clinic_name', 'clinic_phone']
    }
  ];
  
  return c.json({ success: true, data: templates });
});

// =============================================
// Send Messages
// =============================================

// POST /api/kakao/send - Send KakaoTalk message  
kakao.post('/send', async (c) => {
  try {
    const userId = c.get('userId'); const orgId = c.get('organizationId');
    const db = c.env.DB;
    const { 
      patient_id, 
      template_id, 
      variables, 
      custom_message,
      channel // 'kakao' | 'sms' | 'clipboard'
    } = await c.req.json();
    
    if (!patient_id) return c.json({ success: false, error: '환자 ID가 필요합니다' }, 400);
    
    // Get patient info
    const patient = await db.prepare(
      'SELECT name, phone FROM patients WHERE id = ? AND org_id = ?'
    ).bind(patient_id, orgId).first();
    
    if (!patient) return c.json({ success: false, error: '환자를 찾을 수 없습니다' }, 404);
    
    // Build message from template or custom
    let message = custom_message || '';
    if (template_id && !custom_message) {
      // Template-based message would be resolved here
      message = variables?.message || '안녕하세요, ' + patient.name + '님!';
    }
    
    // Get Kakao API config
    const org = await db.prepare(
      'SELECT name, phone, kakao_api_key, kakao_sender_key FROM organizations WHERE id = ?'
    ).bind(orgId).first();
    
    let sendResult = { sent: false, method: channel || 'clipboard', message: message };
    
    // If Kakao API is configured and channel is kakao, attempt API send
    if (channel === 'kakao' && org?.kakao_api_key && org?.kakao_sender_key) {
      try {
        // Kakao AlimTalk API call
        const response = await fetch('https://api-alimtalk.kakao.com/v2/sender/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${org.kakao_api_key}`
          },
          body: JSON.stringify({
            senderKey: org.kakao_sender_key,
            templateCode: template_id || 'custom',
            recipientList: [{
              recipientNo: (patient.phone as string || '').replace(/-/g, ''),
              templateParameter: variables || {}
            }]
          })
        });
        
        if (response.ok) {
          sendResult = { sent: true, method: 'kakao', message: message };
        } else {
          sendResult = { sent: false, method: 'kakao_failed', message: message };
        }
      } catch (apiErr) {
        console.error('Kakao API error:', apiErr);
        sendResult = { sent: false, method: 'kakao_failed', message: message };
      }
    }
    
    // Log the notification attempt
    const logId = generateId();
    await db.prepare(`
      INSERT INTO notification_logs (id, org_id, user_id, patient_id, channel, template_id, message, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      logId, orgId, userId, patient_id, 
      sendResult.method, template_id || 'custom',
      message.substring(0, 500),
      sendResult.sent ? 'sent' : 'prepared'
    ).run().catch(() => {});
    
    return c.json({
      success: true,
      data: {
        id: logId,
        sent: sendResult.sent,
        method: sendResult.method,
        message: sendResult.message,
        patient_name: patient.name,
        patient_phone: patient.phone
      }
    });
  } catch (error) {
    console.error('Kakao send error:', error);
    return c.json({ success: false, error: '메시지 발송 실패' }, 500);
  }
});

// POST /api/kakao/send-proposal - Send treatment proposal via KakaoTalk
kakao.post('/send-proposal', async (c) => {
  try {
    const userId = c.get('userId'); const orgId = c.get('organizationId');
    const db = c.env.DB;
    const { proposal_id, channel } = await c.req.json();
    
    if (!proposal_id) return c.json({ success: false, error: '제안서 ID가 필요합니다' }, 400);
    
    // Get proposal with patient info
    const proposal = await db.prepare(`
      SELECT tp.*, p.name as patient_name, p.phone as patient_phone, c.treatment_type
      FROM treatment_proposals tp
      JOIN consultations c ON tp.consultation_id = c.id
      LEFT JOIN patients p ON c.patient_id = p.id
      WHERE tp.id = ? AND tp.org_id = ?
    `).bind(proposal_id, orgId).first();
    
    if (!proposal) return c.json({ success: false, error: '제안서를 찾을 수 없습니다' }, 404);
    
    const proposalUrl = `${new URL(c.req.url).origin}/proposal/${proposal.public_token}`;
    
    const message = `${proposal.patient_name}님, 안녕하세요!\n상담 내용을 바탕으로 맞춤 치료 계획서를 준비했습니다.\n\n👉 ${proposalUrl}\n\n궁금한 점이 있으시면 편하게 연락 주세요!`;
    
    // Update proposal status
    await db.prepare(`
      UPDATE treatment_proposals SET status = 'sent', sent_at = datetime('now'), sent_channel = ?
      WHERE id = ?
    `).bind(channel || 'kakao', proposal_id).run();
    
    // Log
    const logId = generateId();
    await db.prepare(`
      INSERT INTO notification_logs (id, org_id, user_id, patient_id, channel, template_id, message, status, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, 'treatment_proposal', ?, 'sent', ?, datetime('now'))
    `).bind(
      logId, orgId, userId, proposal.patient_id || '',
      channel || 'kakao', message.substring(0, 500),
      JSON.stringify({ proposal_id, proposal_url: proposalUrl })
    ).run().catch(() => {});
    
    return c.json({
      success: true,
      data: {
        sent: true,
        message: message,
        proposal_url: proposalUrl,
        patient_name: proposal.patient_name,
        channel: channel || 'kakao'
      }
    });
  } catch (error) {
    console.error('Proposal send error:', error);
    return c.json({ success: false, error: '제안서 발송 실패' }, 500);
  }
});

// POST /api/kakao/send-batch - Send batch messages (retention contacts)
kakao.post('/send-batch', async (c) => {
  try {
    const userId = c.get('userId'); const orgId = c.get('organizationId');
    const db = c.env.DB;
    const { patient_ids, template_id, variables_map } = await c.req.json();
    
    if (!patient_ids || !Array.isArray(patient_ids) || patient_ids.length === 0) {
      return c.json({ success: false, error: '환자 목록이 필요합니다' }, 400);
    }
    
    if (patient_ids.length > 50) {
      return c.json({ success: false, error: '한 번에 최대 50명까지 발송할 수 있습니다' }, 400);
    }
    
    // Get patients
    const placeholders = patient_ids.map(() => '?').join(',');
    const patients = await db.prepare(
      `SELECT id, name, phone FROM patients WHERE id IN (${placeholders}) AND org_id = ?`
    ).bind(...patient_ids, orgId).all();
    
    const results = [];
    for (const patient of patients.results) {
      const vars = (variables_map && variables_map[patient.id as string]) || {};
      const message = vars.message || `${patient.name}님, 안녕하세요! 정기 검진 시기가 되어 안내드립니다.`;
      
      const logId = generateId();
      await db.prepare(`
        INSERT INTO notification_logs (id, org_id, user_id, patient_id, channel, template_id, message, status, created_at)
        VALUES (?, ?, ?, ?, 'kakao', ?, ?, 'prepared', datetime('now'))
      `).bind(logId, orgId, userId, patient.id, template_id || 'batch', message.substring(0, 500)).run().catch(() => {});
      
      results.push({
        patient_id: patient.id,
        patient_name: patient.name,
        message: message,
        status: 'prepared'
      });
    }
    
    return c.json({
      success: true,
      data: {
        total: results.length,
        results: results
      }
    });
  } catch (error) {
    console.error('Batch send error:', error);
    return c.json({ success: false, error: '일괄 발송 실패' }, 500);
  }
});

// GET /api/kakao/logs - Get notification logs
kakao.get('/logs', async (c) => {
  try {
    const orgId = c.get('organizationId');
    const db = c.env.DB;
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    const patientId = c.req.query('patient_id');
    
    let query = `
      SELECT nl.*, p.name as patient_name, u.name as user_name
      FROM notification_logs nl
      LEFT JOIN patients p ON nl.patient_id = p.id
      LEFT JOIN users u ON nl.user_id = u.id
      WHERE nl.org_id = ?
    `;
    const params: any[] = [orgId];
    
    if (patientId) {
      query += ' AND nl.patient_id = ?';
      params.push(patientId);
    }
    
    query += ' ORDER BY nl.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const logs = await db.prepare(query).bind(...params).all();
    
    return c.json({
      success: true,
      data: logs.results.map(l => ({
        ...l,
        metadata: safeParseJSON(l.metadata as string, null)
      }))
    });
  } catch (error) {
    console.error('Kakao logs error:', error);
    return c.json({ success: true, data: [] });
  }
});

export default kakao;
