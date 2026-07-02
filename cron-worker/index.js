// v8.4: Patient Touch 아침 브리핑 크론 워커
// Cloudflare Pages는 cron trigger를 지원하지 않으므로,
// 이 초경량 Worker가 매시간 정각(KST 06~22시)에 Pages API를 호출한다.
// 실제 발송 여부(유저별 알림 시간/주말 설정)는 Pages 쪽 엔드포인트가 판단.

export default {
  async scheduled(event, env, ctx) {
    const res = await fetch('https://patienttouch.pages.dev/api/push/send-morning-briefings', {
      method: 'POST',
      headers: { 'X-Cron-Secret': env.CRON_SECRET, 'Content-Type': 'application/json' }
    });
    const body = await res.text();
    console.log('Briefing cron:', res.status, body);
  },

  // 수동 트리거/헬스체크용
  async fetch(request, env) {
    return new Response('patient-touch-briefing-cron OK', { status: 200 });
  }
};
