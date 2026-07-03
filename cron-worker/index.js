// v8.4: Patient Touch 아침 브리핑 크론 워커
// Cloudflare Pages는 cron trigger를 지원하지 않으므로,
// 이 초경량 Worker가 스케줄에 맞춰 Pages API를 호출한다.
//   ① 매시 정각 (KST 06~22시): 아침 브리핑 발송 판단 → /api/push/send-morning-briefings
//   ② KST 04:00 (UTC 19:00): 보존기간 경과 원문 자동 파기 → /api/privacy/purge-expired (v8.6.1)
// 실제 실행 여부(유저별 알림 시간/병원별 보존 정책)는 Pages 쪽 엔드포인트가 판단.

const BASE = 'https://patienttouch.pages.dev';

export default {
  async scheduled(event, env, ctx) {
    // UTC 19:00 = KST 04:00 → 보존기간 파기 전용 슬롯
    if (event.cron === '0 19 * * *') {
      const res = await fetch(BASE + '/api/privacy/purge-expired', {
        method: 'POST',
        headers: { 'X-Cron-Secret': env.CRON_SECRET, 'Content-Type': 'application/json' }
      });
      console.log('Retention purge cron:', res.status, await res.text());
      return;
    }

    // 그 외 슬롯 → 아침 브리핑
    const res = await fetch(BASE + '/api/push/send-morning-briefings', {
      method: 'POST',
      headers: { 'X-Cron-Secret': env.CRON_SECRET, 'Content-Type': 'application/json' }
    });
    console.log('Briefing cron:', res.status, await res.text());
  },

  // 수동 트리거/헬스체크용
  async fetch(request, env) {
    return new Response('patient-touch-briefing-cron OK', { status: 200 });
  }
};
