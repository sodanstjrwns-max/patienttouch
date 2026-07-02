// =========================================
// v8.4: PUSH CLIENT — 아침 브리핑 알림 구독 관리
// 공용 유틸: ptPush.isSupported / getState / enable / disable / test
// =========================================
var ptPush = (function() {

  function isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);
    for (var i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }

  // 상태: 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed'
  async function getState() {
    if (!isSupported()) return 'unsupported';
    if (Notification.permission === 'denied') return 'denied';
    try {
      var reg = await navigator.serviceWorker.ready;
      var sub = await reg.pushManager.getSubscription();
      if (!sub) return 'unsubscribed';
      // 서버에도 등록되어 있는지 확인
      var res = await fetch('/api/push/status');
      var data = await res.json();
      return (data.success && data.data.subscribed) ? 'subscribed' : 'unsubscribed';
    } catch (e) {
      return 'unsubscribed';
    }
  }

  async function enable() {
    if (!isSupported()) throw new Error('이 브라우저는 푸시 알림을 지원하지 않습니다.');

    var perm = await Notification.requestPermission();
    if (perm !== 'granted') throw new Error('알림 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.');

    var keyRes = await fetch('/api/push/vapid-public-key');
    var keyData = await keyRes.json();
    if (!keyData.success) throw new Error(keyData.error || '푸시 설정을 불러올 수 없습니다.');

    var reg = await navigator.serviceWorker.ready;
    var sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.data.publicKey)
      });
    }

    var subJson = sub.toJSON();
    var res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subJson.endpoint, keys: subJson.keys })
    });
    var data = await res.json();
    if (!data.success) throw new Error(data.error || '구독 등록에 실패했습니다.');
    return true;
  }

  async function disable() {
    try {
      var reg = await navigator.serviceWorker.ready;
      var sub = await reg.pushManager.getSubscription();
      var endpoint = sub ? sub.endpoint : null;
      if (sub) await sub.unsubscribe();
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: endpoint })
      });
    } catch (e) { console.warn('Push disable:', e); }
    return true;
  }

  async function test() {
    var res = await fetch('/api/push/test', { method: 'POST' });
    var data = await res.json();
    if (!data.success) throw new Error(data.error || '테스트 발송 실패');
    return data.data;
  }

  return { isSupported: isSupported, getState: getState, enable: enable, disable: disable, test: test };
})();
