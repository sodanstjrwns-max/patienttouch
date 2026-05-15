import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children, title }) => {
  return (
    <html lang="ko" class="dark-support">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="페이션트 터치" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="description" content="Patient Touch - AI 기반 치과 상담 CRM + 환자 소개 네트워크 + 이탈 예측" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/static/icons/favicon-32.png" />
        <link rel="apple-touch-icon" href="/static/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/static/manifest.json" />
        <title>{title || '페이션트 터치'}</title>
        
        {/* Tailwind CSS (v7.5: PostCSS pre-built bundle, removed CDN to drop production warning) */}
        <link rel="stylesheet" href="/static/tailwind.css" />
        
        {/* Font Awesome 6 Pro */}
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.1/css/all.min.css" rel="stylesheet" />
        
        {/* Pretendard Variable */}
        <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" rel="stylesheet" />
        
        {/* Chart.js */}
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        
        {/* v7.5: Inline tailwind.config + custom <style> blocks removed.
            → Tailwind config:    /tailwind.config.js
            → Custom CSS source:  /src/styles/index.css
            → Compiled bundle:    /public/static/tailwind.css  (loaded via <link> above) */}
        
        {/* Global Auth Interceptor + Utilities */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // ==========================================
            // GLOBAL UTILITIES v2
            // ==========================================

            // === 1. Auth Interceptor ===
            (function() {
              var origFetch = window.fetch;
              window.fetch = function(url, opts) {
                return origFetch.apply(this, arguments).then(function(res) {
                  if (res.status === 401 && typeof url === 'string' && url.startsWith('/api/') && !url.includes('/api/auth/login') && !url.includes('/api/reports/proposals/view/')) {
                    window.location.href = '/login';
                  }
                  return res;
                });
              };
            })();

            // === 2. XSS Protection ===
            function escapeHtml(str) {
              if (str === null || str === undefined) return '';
              return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
            }
            // Shorthand alias
            var esc = escapeHtml;

            // === 3. Toast Notification System ===
            window._toastContainer = null;
            window._toastQueue = [];
            function showToast(msg, type, duration) {
              type = type || 'info';
              duration = duration || 3000;
              if (!window._toastContainer) {
                window._toastContainer = document.createElement('div');
                window._toastContainer.id = 'toast-container';
                window._toastContainer.style.cssText = 'position:fixed;top:env(safe-area-inset-top,12px);left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none;width:90%;max-width:400px;padding-top:12px;';
                document.body.appendChild(window._toastContainer);
              }
              var icons = {success:'fa-circle-check',error:'fa-circle-xmark',warning:'fa-triangle-exclamation',info:'fa-circle-info'};
              var colors = {success:'#10b981',error:'#ef4444',warning:'#f59e0b',info:'#6366f1'};
              var bgColors = {success:'rgba(16,185,129,0.12)',error:'rgba(239,68,68,0.12)',warning:'rgba(245,158,11,0.12)',info:'rgba(99,102,241,0.12)'};
              var t = document.createElement('div');
              t.style.cssText = 'pointer-events:auto;display:flex;align-items:center;gap:10px;padding:12px 18px;border-radius:14px;font-size:13px;font-weight:600;color:#1e293b;background:white;box-shadow:0 4px 24px rgba(0,0,0,0.12),0 1px 4px rgba(0,0,0,0.06);border:1px solid '+bgColors[type]+';backdrop-filter:blur(16px);opacity:0;transform:translateY(-12px) scale(0.96);transition:all 0.35s cubic-bezier(0.16,1,0.3,1);max-width:100%;';
              t.innerHTML = '<i class="fas '+icons[type]+'" style="color:'+colors[type]+';font-size:15px;flex-shrink:0;"></i><span style="flex:1;line-height:1.4;">'+msg+'</span>';
              window._toastContainer.appendChild(t);
              requestAnimationFrame(function(){ requestAnimationFrame(function(){ t.style.opacity='1'; t.style.transform='translateY(0) scale(1)'; }); });
              setTimeout(function(){
                t.style.opacity='0'; t.style.transform='translateY(-8px) scale(0.96)';
                setTimeout(function(){ t.remove(); }, 350);
              }, duration);
            }

            // === 3. Pull-to-Refresh ===
            function initPullToRefresh(refreshFn) {
              var startY=0, pulling=false, indicator=null;
              var main = document.querySelector('main') || document.body;
              main.addEventListener('touchstart', function(e) {
                if (window.scrollY <= 0) { startY = e.touches[0].clientY; pulling = true; }
              }, {passive:true});
              main.addEventListener('touchmove', function(e) {
                if (!pulling) return;
                var dy = e.touches[0].clientY - startY;
                if (dy > 10 && dy < 200) {
                  if (!indicator) {
                    indicator = document.createElement('div');
                    indicator.style.cssText = 'position:fixed;top:0;left:0;right:0;display:flex;justify-content:center;padding:16px;z-index:9998;transition:opacity 0.3s;';
                    indicator.innerHTML = '<div style="background:white;border-radius:999px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 12px rgba(0,0,0,0.1);"><i class="fas fa-arrow-rotate-right text-brand-600" style="font-size:14px;"></i></div>';
                    document.body.appendChild(indicator);
                  }
                  var p = Math.min(1, dy/80);
                  indicator.style.opacity = p;
                  indicator.querySelector('i').style.transform = 'rotate('+(p*360)+'deg)';
                }
              }, {passive:true});
              main.addEventListener('touchend', function(e) {
                if (!pulling) return;
                pulling = false;
                var dy = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY - startY : 0;
                if (indicator) {
                  if (dy >= 80) {
                    indicator.querySelector('i').className = 'fas fa-spinner fa-spin text-brand-600';
                    if (refreshFn) refreshFn();
                    setTimeout(function(){ indicator && indicator.remove(); indicator=null; }, 1000);
                  } else { indicator.remove(); indicator=null; }
                }
              }, {passive:true});
            }

            // === 4. Error State with Retry (Enhanced) ===
            function showErrorState(containerId, message, retryFn) {
              var el = document.getElementById(containerId);
              if (!el) return;
              var retryId = 'retry_' + Date.now();
              el.innerHTML = '<div class="card-premium p-6 text-center animate-fade-in"><div class="w-14 h-14 mx-auto bg-rose-50 rounded-2xl flex items-center justify-center mb-3"><i class="fas fa-triangle-exclamation text-rose-400 text-xl"></i></div><p class="text-sm font-bold text-surface-800 mb-1">\ub370\uc774\ud130\ub97c \ubd88\ub7ec\uc62c \uc218 \uc5c6\uc2b5\ub2c8\ub2e4</p><p class="text-xs text-surface-500 mb-4 leading-relaxed">'+(message||'\ub124\ud2b8\uc6cc\ud06c \uc5f0\uacb0\uc744 \ud655\uc778\ud574\uc8fc\uc138\uc694')+'</p>' + (retryFn ? '<button id="'+retryId+'" class="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 bg-brand-50 px-4 py-2.5 rounded-xl hover:bg-brand-100 transition-all active:scale-95 shadow-sm"><i class="fas fa-rotate text-xs"></i>\ub2e4\uc2dc \uc2dc\ub3c4</button>' : '') + '</div>';
              if (retryFn) {
                var btn = document.getElementById(retryId);
                if (btn) btn.addEventListener('click', function() {
                  showLoadingState(containerId);
                  retryFn();
                });
              }
            }

            // === 4b. Loading State (standard) ===
            function showLoadingState(containerId, count) {
              var el = document.getElementById(containerId);
              if (!el) return;
              count = count || 3;
              var html = '<div class="space-y-3 animate-fade-in">';
              for (var i = 0; i < count; i++) {
                html += '<div class="card-premium p-4"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-xl skeleton-pulse shrink-0"></div><div class="flex-1 space-y-2"><div class="skeleton-pulse h-4 rounded-lg" style="width:'+(75-i*10)+'%"></div><div class="skeleton-pulse h-3 rounded-lg" style="width:'+(55-i*5)+'%"></div></div></div></div>';
              }
              html += '</div>';
              el.innerHTML = html;
            }

            // === 4c. Empty State (standard) ===
            function showEmptyState(containerId, icon, title, desc, action) {
              var el = document.getElementById(containerId);
              if (!el) return;
              el.innerHTML = '<div class="text-center py-16 px-6 animate-fade-in"><div class="w-20 h-20 mx-auto mb-5 rounded-2xl bg-surface-100 flex items-center justify-center"><i class="'+icon+' text-3xl text-surface-300"></i></div><h3 class="text-base font-bold text-surface-800 mb-1">'+title+'</h3>' + (desc ? '<p class="text-surface-500 text-sm mb-5 max-w-xs mx-auto leading-relaxed">'+desc+'</p>' : '') + (action || '') + '</div>';
            }

            // === 4d. Safe Fetch with error handling + retry ===
            function safeFetch(url, options, retryCount) {
              retryCount = retryCount || 0;
              var maxRetries = (options && options._maxRetries) || 1;
              return fetch(url, options)
                .then(function(res) {
                  if (!res.ok) {
                    if (res.status === 401) { window.location.href = '/login'; return Promise.reject('auth'); }
                    if (res.status === 429) { showToast('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', 'warning'); return Promise.reject('rate_limited'); }
                    if (res.status >= 500 && retryCount < maxRetries) {
                      return new Promise(function(resolve){ setTimeout(resolve, 1000 * (retryCount + 1)); })
                        .then(function(){ return safeFetch(url, options, retryCount + 1); });
                    }
                    return res.json().catch(function(){ return {}; }).then(function(d){ return Promise.reject(d.error || '오류가 발생했습니다 ('+res.status+')'); });
                  }
                  return res.json();
                })
                .catch(function(err) {
                  if (err === 'auth' || err === 'rate_limited') return Promise.reject(err);
                  if (err instanceof TypeError && retryCount < maxRetries) {
                    return new Promise(function(resolve){ setTimeout(resolve, 1500); })
                      .then(function(){ return safeFetch(url, options, retryCount + 1); });
                  }
                  if (err instanceof TypeError) return Promise.reject('네트워크 연결을 확인해주세요');
                  return Promise.reject(err);
                });
            }

            // === 4d-2. Common auth check ===
            function requireAuth() {
              return fetch('/api/auth/me')
                .then(function(res) {
                  if (!res.ok) { window.location.href = '/login'; return Promise.reject('auth'); }
                  return res.json();
                })
                .then(function(data) {
                  if (!data.success) { window.location.href = '/login'; return Promise.reject('auth'); }
                  return data;
                });
            }

            // === 4d-3. Parallel fetch with graceful degradation ===
            function fetchAll(urls) {
              return Promise.all(urls.map(function(url) {
                return fetch(url)
                  .then(function(r) { return r.ok ? r.json() : null; })
                  .catch(function() { return null; });
              }));
            }

            // === 4e. Phone masking utility ===
            function maskPhone(phone) {
              if (!phone) return '-';
              var p = phone.replace(/[^0-9]/g, '');
              if (p.length === 11) return p.slice(0,3) + '-****-' + p.slice(7);
              if (p.length === 10) return p.slice(0,3) + '-***-' + p.slice(6);
              return phone.slice(0, Math.ceil(phone.length/2)) + '****';
            }
            function phoneWithReveal(phone, elId) {
              if (!phone) return '-';
              var masked = maskPhone(phone);
              var uid = 'ph_' + elId;
              setTimeout(function(){
                var btn = document.getElementById('rv_' + elId);
                if (btn) btn.addEventListener('click', function(){
                  var sp = document.getElementById(uid);
                  if (sp) sp.textContent = phone;
                });
              }, 100);
              return '<span class="phone-masked" id="'+uid+'">'+masked+' <span class="reveal-btn cursor-pointer" id="rv_'+elId+'">\uD83D\uDC41</span></span>';
            }

            // === 5. Page Transition (smooth) ===
            function navigateTo(url, animate) {
              if (animate === false) { window.location.href = url; return; }
              document.body.style.transition = 'opacity 0.15s ease-out';
              document.body.style.opacity = '0';
              setTimeout(function(){ window.location.href = url; }, 150);
            }
            window.addEventListener('pageshow', function() {
              document.body.style.opacity = '1';
            });

            // === 6. Empty-State with Onboarding ===
            function showOnboardingState(containerId, steps) {
              var el = document.getElementById(containerId);
              if (!el) return;
              var html = '<div class="card-premium p-6 text-center animate-fade-in">';
              html += '<div class="w-16 h-16 mx-auto bg-gradient-to-br from-brand-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4"><i class="fas fa-rocket text-brand-600 text-2xl"></i></div>';
              html += '<h3 class="text-base font-bold text-surface-900 mb-1">\uc2dc\uc791\ud574\ubcfc\uae4c\uc694?</h3>';
              html += '<p class="text-xs text-surface-500 mb-5">\uc544\ub798 \ub2e8\uacc4\ub97c \ub530\ub77c\ud574\ubcf4\uc138\uc694</p>';
              html += '<div class="space-y-2.5 text-left">';
              (steps||[]).forEach(function(s, i) {
                html += '<a href="'+(s.href||'#')+'" class="flex items-center gap-3 p-3 rounded-xl bg-surface-50 hover:bg-brand-50 transition-all group">';
                html += '<div class="w-8 h-8 rounded-lg '+(s.done?'bg-emerald-100':'bg-brand-100')+' flex items-center justify-center shrink-0">';
                html += s.done ? '<i class="fas fa-check text-emerald-600 text-xs"></i>' : '<span class="text-xs font-bold text-brand-600">'+(i+1)+'</span>';
                html += '</div>';
                html += '<div class="flex-1"><p class="text-sm font-semibold text-surface-900 group-hover:text-brand-700">'+s.title+'</p><p class="text-[11px] text-surface-500">'+s.desc+'</p></div>';
                html += '<i class="fas fa-chevron-right text-surface-300 text-xs group-hover:text-brand-400"></i></a>';
              });
              html += '</div></div>';
              el.innerHTML = html;
            }

            // === 7. Format helpers ===
            function fmtWon(n){ if(!n&&n!==0) return '0'; return Math.round(n/10000).toLocaleString(); }
            function fmtDate(d){ if(!d) return '-'; return new Date(d).toLocaleDateString('ko-KR',{month:'short',day:'numeric'}); }
            function fmtFullDate(d){ if(!d) return '-'; return new Date(d).toLocaleDateString('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit'}); }

            // === 8. Debounce utility ===
            function debounce(fn, delay) {
              var timer;
              return function() {
                var ctx = this, args = arguments;
                clearTimeout(timer);
                timer = setTimeout(function(){ fn.apply(ctx, args); }, delay);
              };
            }

            // === 9. Request dedup / in-flight cache ===
            var _fetchCache = {};
            function fetchCached(url, ttlMs) {
              ttlMs = ttlMs || 5000;
              var now = Date.now();
              if (_fetchCache[url] && (now - _fetchCache[url].t) < ttlMs) {
                return Promise.resolve(_fetchCache[url].data);
              }
              return fetch(url).then(function(r){ return r.json(); }).then(function(d){
                _fetchCache[url] = { data: d, t: Date.now() };
                return d;
              });
            }

            // === 10. Number format with animation ===
            function animateValue(el, end, duration, suffix) {
              if (!el) return;
              suffix = suffix || '';
              var start = 0;
              var startTime = null;
              function step(ts) {
                if (!startTime) startTime = ts;
                var progress = Math.min((ts - startTime) / duration, 1);
                var ease = 1 - Math.pow(1 - progress, 3);
                el.textContent = Math.round(ease * end).toLocaleString() + suffix;
                if (progress < 1) requestAnimationFrame(step);
              }
              requestAnimationFrame(step);
            }

            // === 11. Lazy intersection observer ===
            function lazyLoad(selector, callback) {
              if (!('IntersectionObserver' in window)) { callback(); return; }
              var observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                  if (entry.isIntersecting) { callback(entry.target); observer.unobserve(entry.target); }
                });
              }, { rootMargin: '100px' });
              document.querySelectorAll(selector).forEach(function(el) { observer.observe(el); });
            }
          `
        }} />

      </head>
      <body class="bg-gradient-mesh min-h-screen text-surface-900 antialiased">
        {children}
        <script src="/static/pwa-register.js" defer></script>
      </body>
    </html>
  )
})
