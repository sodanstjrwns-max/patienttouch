// Patient Touch v7.6 Service Worker — Precache + Stale-While-Revalidate
// 전략:
//   1) Install: 핵심 페이지 + 정적 자산 사전 워밍업 (Precaching)
//   2) Activate: 오래된 캐시 정리 + 백그라운드 페이지 워밍업
//   3) Fetch:
//      - API: Network-first (캐싱 X)
//      - /static/*: Stale-While-Revalidate (즉시 캐시 응답 + 백그라운드 업데이트)
//      - HTML 페이지: Network-first + 오프라인 fallback

const CACHE_VERSION = 'pt-v9.1.2';
const STATIC_CACHE = `pt-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `pt-runtime-${CACHE_VERSION}`;
const PAGE_CACHE = `pt-pages-${CACHE_VERSION}`;

// 설치 시 미리 캐싱할 핵심 정적 자산
const PRECACHE_STATIC = [
  '/static/manifest.json',
  '/static/icons/icon-192.png',
  '/static/icons/icon-512.png',
  '/static/icons/apple-touch-icon.png',
  '/static/icons/favicon-32.png',
  '/static/tailwind.css',
  '/static/pwa-register.js',
  '/static/utils.js',
  '/static/components.js',
  // 페이지별 핵심 스크립트 (v7.6 추가)
  '/static/pages/admin-dashboard.js',
  '/static/pages/churn-prediction.js',
  '/static/pages/churn-retraining.js',
  '/favicon.svg',
];

// 설치 시 미리 워밍업할 핵심 페이지 (Patient Funnel 핵심 동선)
const PRECACHE_PAGES = [
  '/',                     // 홈
  '/recording',            // 녹음 (가장 자주 사용)
  '/admin',                // 원장 대시보드
  '/retention/churn',      // 이탈 예측
  '/retention/retraining', // 모델 재학습 (v7.6)
  '/network',              // 소개 네트워크
];

// ---- Install: precache static + pages ----
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v7.6...');
  event.waitUntil(
    Promise.all([
      // 정적 자산 캐싱 — 실패해도 부분 성공 허용
      caches.open(STATIC_CACHE).then((cache) =>
        Promise.allSettled(
          PRECACHE_STATIC.map((url) =>
            cache.add(url).catch((err) => {
              console.warn(`[SW] Precache static fail: ${url}`, err.message);
            })
          )
        )
      ),
      // 페이지 캐싱 — 동일 정책
      caches.open(PAGE_CACHE).then((cache) =>
        Promise.allSettled(
          PRECACHE_PAGES.map((url) =>
            fetch(url, { credentials: 'same-origin' })
              .then((res) => {
                if (res.ok) return cache.put(url, res);
                throw new Error(`HTTP ${res.status}`);
              })
              .catch((err) => {
                console.warn(`[SW] Precache page fail: ${url}`, err.message);
              })
          )
        )
      ),
    ]).then(() => {
      console.log('[SW] Precache complete');
      return self.skipWaiting();
    })
  );
});

// ---- Activate: 오래된 캐시 정리 ----
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v7.6...');
  const validCaches = new Set([STATIC_CACHE, RUNTIME_CACHE, PAGE_CACHE]);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => !validCaches.has(k)).map((k) => {
          console.log(`[SW] Delete old cache: ${k}`);
          return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ---- Helper: Stale-While-Revalidate ----
function staleWhileRevalidate(request, cacheName) {
  return caches.open(cacheName).then((cache) => {
    return cache.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);
      // 캐시가 있으면 즉시 반환 + 백그라운드 업데이트
      return cached || fetchPromise;
    });
  });
}

// ---- Fetch: routing strategy ----
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // GET 요청만 처리
  if (request.method !== 'GET') return;
  // Cross-origin 패스
  if (url.origin !== self.location.origin) return;

  // 1) API 요청: Network-first (실시간성 우선)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(
          JSON.stringify({
            success: false,
            error: '오프라인 상태입니다. 네트워크 연결을 확인해주세요.',
            offline: true,
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    return;
  }

  // 2) 정적 자산 (/static/*, /favicon.*): Stale-While-Revalidate
  //    - 즉시 캐시 응답 → 페이지 로드 속도 ↑
  //    - 백그라운드에서 최신 버전으로 업데이트 → 다음 방문 시 fresh
  if (url.pathname.startsWith('/static/') || url.pathname.startsWith('/favicon')) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // 3) HTML 페이지: Network-first + 캐시 fallback + 오프라인 페이지
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
          const clone = response.clone();
          caches.open(PAGE_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          // 최후 폴백: 오프라인 페이지
          return new Response(
            `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>오프라인 - 페이션트 터치</title>
            <meta name="viewport" content="width=device-width,initial-scale=1">
            <style>body{font-family:-apple-system,sans-serif;background:#f8fafc;color:#0f172a;padding:40px 20px;text-align:center;margin:0;}
            h1{color:#6366f1;margin:8px 0;}p{color:#64748b;line-height:1.6;}
            button{background:#6366f1;color:white;border:none;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:600;margin-top:16px;cursor:pointer;}
            button:active{transform:scale(0.97);}
            .links{margin-top:24px;display:flex;flex-direction:column;gap:8px;}
            .links a{display:block;padding:10px 16px;background:white;border:1px solid #e2e8f0;border-radius:10px;color:#475569;text-decoration:none;font-size:13px;font-weight:500;}
            .links a:active{background:#f1f5f9;}</style>
            </head><body>
            <div style="max-width:400px;margin:80px auto;">
            <div style="font-size:48px;margin-bottom:16px;">📡</div>
            <h1>오프라인 상태</h1>
            <p>네트워크 연결을 확인해주세요.<br/>일부 캐시된 페이지는 접근 가능합니다.</p>
            <button onclick="location.reload()">다시 시도</button>
            <div class="links">
              <a href="/">🏠 홈</a>
              <a href="/admin">📊 원장 대시보드</a>
              <a href="/retention/churn">🚨 이탈 예측</a>
              <a href="/network">🕸️ 소개 네트워크</a>
            </div>
            </div></body></html>`,
            { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
      )
  );
});

// ---- Message: 강제 업데이트 + 캐시 상태 조회 ----
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data.type === 'CACHE_STATUS') {
    Promise.all([
      caches.open(STATIC_CACHE).then((c) => c.keys().then((k) => k.length)),
      caches.open(RUNTIME_CACHE).then((c) => c.keys().then((k) => k.length)),
      caches.open(PAGE_CACHE).then((c) => c.keys().then((k) => k.length)),
    ]).then(([staticCount, runtimeCount, pageCount]) => {
      event.source?.postMessage({
        type: 'CACHE_STATUS_REPLY',
        version: CACHE_VERSION,
        static: staticCount,
        runtime: runtimeCount,
        pages: pageCount,
      });
    });
  }
  // v7.6: 수동 페이지 재워밍업 (사용자가 로그인 후 호출 가능)
  if (event.data.type === 'WARM_PAGES') {
    caches.open(PAGE_CACHE).then((cache) =>
      Promise.allSettled(
        PRECACHE_PAGES.map((url) =>
          fetch(url, { credentials: 'same-origin' })
            .then((res) => res.ok && cache.put(url, res))
            .catch(() => {})
        )
      )
    ).then(() => {
      event.source?.postMessage({ type: 'WARM_PAGES_DONE' });
    });
  }
});

// =========================================
// v8.4: WEB PUSH — 아침 브리핑 알림
// =========================================
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { title: '페이션트 터치', body: event.data ? event.data.text() : '' }; }

  const title = data.title || '페이션트 터치';
  const options = {
    body: data.body || '',
    icon: '/static/icons/apple-touch-icon.png',
    badge: '/static/icons/favicon-32.png',
    tag: data.tag || 'pt-notification',
    renotify: true,
    data: { url: data.url || '/today' },
    vibrate: [100, 50, 100],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/today';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
