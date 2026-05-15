// Patient Touch v7.4 Service Worker
// 전략: Network-first for API, Cache-first for static assets, Offline fallback
//
// 주의 — Cloudflare Pages 환경:
//   1) sw.js는 반드시 origin scope에서 서빙 (/sw.js)
//   2) API 응답은 캐싱하지 않음 (실시간 데이터)
//   3) 정적 자산만 캐싱 (HTML, JS, CSS, 이미지)

const CACHE_VERSION = 'pt-v7.4.0';
const STATIC_CACHE = `pt-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `pt-runtime-${CACHE_VERSION}`;

// 설치 시 미리 캐싱할 핵심 자산
const PRECACHE_URLS = [
  '/static/manifest.json',
  '/static/icons/icon-192.png',
  '/static/icons/icon-512.png',
  '/static/icons/apple-touch-icon.png',
];

// ---- Install: precache ----
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Precache partial fail:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ---- Activate: clean old caches ----
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
            .map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// ---- Fetch: routing strategy ----
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // GET 요청만 처리
  if (request.method !== 'GET') return;

  // Cross-origin은 패스
  if (url.origin !== self.location.origin) return;

  // 1) API 요청: Network-first, 캐싱 안 함
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            success: false,
            error: '오프라인 상태입니다. 네트워크 연결을 확인해주세요.',
            offline: true,
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // 2) 정적 자산 (/static/*): Cache-first
  if (url.pathname.startsWith('/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // 3) HTML 페이지: Network-first, 실패 시 캐시 fallback
  event.respondWith(
    fetch(request).then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
      }
      return response;
    }).catch(() => {
      return caches.match(request).then((cached) => {
        if (cached) return cached;
        // 마지막 폴백: 오프라인 안내 페이지
        return new Response(
          `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>오프라인 - 페이션트 터치</title>
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <style>body{font-family:-apple-system,sans-serif;background:#f8fafc;color:#0f172a;padding:40px 20px;text-align:center;}
          h1{color:#6366f1;}p{color:#64748b;}button{background:#6366f1;color:white;border:none;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:600;margin-top:16px;cursor:pointer;}</style>
          </head><body>
          <div style="max-width:400px;margin:80px auto;">
          <div style="font-size:48px;margin-bottom:16px;">📡</div>
          <h1>오프라인 상태</h1>
          <p>네트워크 연결을 확인해주세요.<br/>연결되면 자동으로 다시 시도합니다.</p>
          <button onclick="location.reload()">다시 시도</button>
          </div></body></html>`,
          { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      });
    })
  );
});

// ---- Message: 강제 업데이트용 ----
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
