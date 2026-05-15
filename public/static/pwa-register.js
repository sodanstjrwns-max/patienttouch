// PWA Service Worker 등록 + 설치 프롬프트 핸들링 (v7.4)
(function () {
  'use strict';

  // ---- Service Worker 등록 ----
  // v7.5: _routes.json에 /sw.js exclude 추가하여 활성화
  const SW_ENABLED = true;
  if (SW_ENABLED && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.log('[PWA] Service Worker registered:', reg.scope);
          // 업데이트 감지
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // 새 버전 사용 가능 — 사용자에게 알림
                  console.log('[PWA] New version available');
                  showUpdateBanner();
                }
              });
            }
          });
        })
        .catch((err) => console.warn('[PWA] SW registration failed:', err));
    });

    // SW 컨트롤러 변경 감지 (스킵 후)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }

  // ---- Install prompt 핸들링 ----
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallBanner();
  });

  function showInstallBanner() {
    // 이미 표시중이거나 닫은 적 있으면 패스
    if (document.getElementById('pwaInstallBanner')) return;
    if (localStorage.getItem('pwa_install_dismissed') === '1') return;

    const banner = document.createElement('div');
    banner.id = 'pwaInstallBanner';
    banner.style.cssText = 'position:fixed;bottom:80px;left:12px;right:12px;background:linear-gradient(135deg,#6366f1,#4f46e5);color:white;padding:12px 16px;border-radius:16px;box-shadow:0 10px 25px rgba(99,102,241,0.3);z-index:9999;display:flex;align-items:center;gap:12px;font-family:-apple-system,sans-serif;animation:slideUp 0.3s ease-out;';
    banner.innerHTML = `
      <div style="font-size:24px;">📱</div>
      <div style="flex:1;min-width:0;">
        <p style="font-size:13px;font-weight:600;margin:0 0 2px;">홈 화면에 설치하기</p>
        <p style="font-size:11px;margin:0;opacity:0.85;">앱처럼 빠르게 접근하세요</p>
      </div>
      <button id="pwaInstallBtn" style="background:white;color:#4f46e5;border:none;padding:8px 12px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">설치</button>
      <button id="pwaDismissBtn" style="background:transparent;color:white;border:none;padding:4px 8px;font-size:18px;cursor:pointer;opacity:0.7;">×</button>
    `;
    document.body.appendChild(banner);

    document.getElementById('pwaInstallBtn').addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] Install prompt outcome:', outcome);
      deferredPrompt = null;
      banner.remove();
    });

    document.getElementById('pwaDismissBtn').addEventListener('click', () => {
      localStorage.setItem('pwa_install_dismissed', '1');
      banner.remove();
    });
  }

  function showUpdateBanner() {
    if (document.getElementById('pwaUpdateBanner')) return;
    const banner = document.createElement('div');
    banner.id = 'pwaUpdateBanner';
    banner.style.cssText = 'position:fixed;top:12px;left:12px;right:12px;background:linear-gradient(135deg,#10b981,#059669);color:white;padding:10px 14px;border-radius:12px;box-shadow:0 10px 25px rgba(16,185,129,0.3);z-index:9999;display:flex;align-items:center;gap:10px;font-family:-apple-system,sans-serif;font-size:12px;';
    banner.innerHTML = `
      <span>🚀 새 버전이 준비됐어요</span>
      <button id="pwaUpdateBtn" style="margin-left:auto;background:white;color:#059669;border:none;padding:6px 10px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">업데이트</button>
    `;
    document.body.appendChild(banner);
    document.getElementById('pwaUpdateBtn').addEventListener('click', () => {
      navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
    });
  }

  // ---- 설치 완료 감지 ----
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed');
    localStorage.setItem('pwa_installed', '1');
    const banner = document.getElementById('pwaInstallBanner');
    if (banner) banner.remove();
  });
})();
