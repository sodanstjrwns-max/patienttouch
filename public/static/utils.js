// Global Utilities v2 — extracted from renderer (cacheable)
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

// === 12. Patient Transcript Viewer (환자 이름 클릭 → 기존 상담 원문 보기) ===
// 사용법: openTranscriptViewer(patientId, patientName)
// 어느 페이지에서든 환자 이름에 onclick으로 연결
var _tvState = { patientId: null, data: null };

function openTranscriptViewer(patientId, patientName) {
  if (!patientId) { showToast('환자 정보가 없습니다', 'warning'); return; }
  _tvState.patientId = patientId;

  var existing = document.getElementById('transcriptViewerModal');
  if (existing) existing.remove();

  var modal = document.createElement('div');
  modal.id = 'transcriptViewerModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9998;display:flex;align-items:flex-end;justify-content:center;';
  modal.innerHTML =
    '<div onclick="closeTranscriptViewer()" style="position:absolute;inset:0;background:rgba(15,23,42,0.55);backdrop-filter:blur(3px);opacity:0;transition:opacity 0.25s;" id="tvBackdrop"></div>' +
    '<div id="tvSheet" style="position:relative;width:100%;max-width:480px;max-height:88vh;background:white;border-radius:24px 24px 0 0;display:flex;flex-direction:column;transform:translateY(100%);transition:transform 0.32s cubic-bezier(0.16,1,0.3,1);overflow:hidden;">' +
      '<div style="padding:14px 20px 10px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap-10px;flex-shrink:0;">' +
        '<div style="width:36px;height:36px;border-radius:12px;background:#eef2ff;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:10px;"><i class="fas fa-scroll" style="color:#6366f1;font-size:14px;"></i></div>' +
        '<div style="flex:1;min-width:0;">' +
          '<p style="font-weight:800;font-size:15px;color:#0f172a;margin:0;">' + escapeHtml(patientName || '환자') + '님 상담 원문</p>' +
          '<p id="tvSubtitle" style="font-size:11px;color:#94a3b8;margin:2px 0 0;">불러오는 중...</p>' +
        '</div>' +
        '<button onclick="closeTranscriptViewer()" style="width:32px;height:32px;border-radius:10px;background:#f8fafc;border:none;color:#64748b;cursor:pointer;flex-shrink:0;"><i class="fas fa-xmark"></i></button>' +
      '</div>' +
      '<div id="tvBody" style="flex:1;overflow-y:auto;padding:14px 16px;-webkit-overflow-scrolling:touch;">' +
        '<div style="text-align:center;padding:40px 0;"><i class="fas fa-circle-notch fa-spin" style="color:#a5b4fc;font-size:22px;"></i></div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(function(){ requestAnimationFrame(function(){
    document.getElementById('tvBackdrop').style.opacity = '1';
    document.getElementById('tvSheet').style.transform = 'translateY(0)';
  }); });

  fetch('/api/patients/' + patientId + '/transcripts')
    .then(function(r){ return r.json(); })
    .then(function(res) {
      if (!res.success) throw new Error(res.error || '조회 실패');
      _tvState.data = res.data;
      renderTranscriptViewer(res.data);
    })
    .catch(function(err) {
      var body = document.getElementById('tvBody');
      if (body) body.innerHTML = '<div style="text-align:center;padding:40px 16px;"><i class="fas fa-triangle-exclamation" style="color:#f59e0b;font-size:22px;"></i><p style="font-size:13px;color:#64748b;margin-top:10px;">' + escapeHtml(err.message || '상담 원문을 불러올 수 없습니다') + '</p></div>';
    });
}

function renderTranscriptViewer(data) {
  var sub = document.getElementById('tvSubtitle');
  var body = document.getElementById('tvBody');
  if (!sub || !body) return;

  var list = data.transcripts || [];
  sub.textContent = '총 상담 ' + data.total + '건 · 원문 보유 ' + data.with_transcript + '건';

  if (list.length === 0) {
    body.innerHTML = '<div style="text-align:center;padding:48px 16px;"><i class="fas fa-microphone-slash" style="color:#cbd5e1;font-size:26px;"></i><p style="font-weight:700;font-size:14px;color:#334155;margin:12px 0 4px;">아직 상담 기록이 없습니다</p><p style="font-size:12px;color:#94a3b8;">첫 상담을 녹음하면 원문이 여기에 쌓입니다</p></div>';
    return;
  }

  var stMap = {
    paid: { c:'#10b981', bg:'#ecfdf5', l:'결제완료' },
    undecided: { c:'#f59e0b', bg:'#fffbeb', l:'미결정' },
    lost: { c:'#f43f5e', bg:'#fff1f2', l:'이탈' },
    pending: { c:'#64748b', bg:'#f8fafc', l:'대기중' }
  };

  var html = '';
  list.forEach(function(t, i) {
    var s = stMap[t.status] || stMap.pending;
    var d = new Date(t.consultation_date);
    var dateStr = d.getFullYear() + '.' + String(d.getMonth()+1).padStart(2,'0') + '.' + String(d.getDate()).padStart(2,'0');
    var meta = [dateStr];
    if (t.treatment_type) meta.push(t.treatment_type);
    if (t.amount) meta.push(Math.round(t.amount/10000).toLocaleString() + '만원');
    if (t.user_name) meta.push(t.user_name);

    html += '<div style="border:1px solid #f1f5f9;border-radius:16px;margin-bottom:10px;overflow:hidden;background:white;">';
    html += '<button onclick="toggleTvItem(' + i + ')" style="width:100%;padding:13px 14px;background:none;border:none;cursor:pointer;text-align:left;display:flex;align-items:center;gap:10px;">' +
      '<span style="padding:3px 8px;border-radius:8px;font-size:10px;font-weight:700;color:' + s.c + ';background:' + s.bg + ';flex-shrink:0;">' + s.l + '</span>' +
      '<span style="flex:1;min-width:0;font-size:12px;color:#475569;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(meta.join(' · ')) + '</span>' +
      (t.has_transcript
        ? '<span style="font-size:10px;color:#6366f1;font-weight:700;flex-shrink:0;">' + (t.char_count >= 1000 ? (t.char_count/1000).toFixed(1) + 'k자' : t.char_count + '자') + '</span><i id="tvChev' + i + '" class="fas fa-chevron-down" style="color:#cbd5e1;font-size:10px;flex-shrink:0;transition:transform 0.2s;"></i>'
        : '<span style="font-size:10px;color:#cbd5e1;font-weight:600;flex-shrink:0;">원문 없음</span>') +
    '</button>';

    if (t.has_transcript) {
      html += '<div id="tvItem' + i + '" style="display:none;border-top:1px solid #f8fafc;">';
      if (t.summary) {
        html += '<div style="margin:10px 12px 0;padding:10px 12px;background:#f0f4ff;border-radius:12px;"><p style="font-size:10px;font-weight:800;color:#6366f1;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;"><i class="fas fa-wand-magic-sparkles" style="margin-right:4px;"></i>AI 요약</p><p style="font-size:12px;color:#334155;line-height:1.6;margin:0;white-space:pre-line;">' + escapeHtml(t.summary) + '</p></div>';
      }
      html += '<div style="margin:10px 12px;padding:12px;background:#f8fafc;border-radius:12px;max-height:280px;overflow-y:auto;-webkit-overflow-scrolling:touch;">' +
        '<p style="font-size:10px;font-weight:800;color:#94a3b8;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.05em;"><i class="fas fa-scroll" style="margin-right:4px;"></i>스크립트 원문</p>' +
        '<p style="font-size:12px;color:#475569;line-height:1.75;margin:0;white-space:pre-line;word-break:break-word;">' + escapeHtml(t.transcript) + '</p>' +
      '</div>';
      html += '<div style="padding:0 12px 12px;display:flex;gap:8px;">' +
        '<button onclick="copyTvTranscript(' + i + ')" style="flex:1;padding:9px;border-radius:10px;border:1px solid #e2e8f0;background:white;font-size:11px;font-weight:700;color:#475569;cursor:pointer;"><i class="fas fa-copy" style="margin-right:4px;"></i>원문 복사</button>' +
        '<a href="/consultations/' + t.consultation_id + '" style="flex:1;padding:9px;border-radius:10px;background:#6366f1;font-size:11px;font-weight:700;color:white;text-align:center;text-decoration:none;"><i class="fas fa-arrow-up-right-from-square" style="margin-right:4px;"></i>상담 상세</a>' +
      '</div>';
      html += '</div>';
    }
    html += '</div>';
  });

  body.innerHTML = html;
}

function toggleTvItem(i) {
  var el = document.getElementById('tvItem' + i);
  var chev = document.getElementById('tvChev' + i);
  if (!el) return;
  var open = el.style.display !== 'none';
  el.style.display = open ? 'none' : 'block';
  if (chev) chev.style.transform = open ? 'rotate(0deg)' : 'rotate(180deg)';
}

function copyTvTranscript(i) {
  var t = _tvState.data && _tvState.data.transcripts && _tvState.data.transcripts[i];
  if (!t || !t.transcript) return;
  var text = t.transcript;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function(){ showToast('원문이 복사되었습니다', 'success'); })
      .catch(function(){ fallbackCopy(text); });
  } else { fallbackCopy(text); }
  function fallbackCopy(txt) {
    var ta = document.createElement('textarea');
    ta.value = txt; ta.style.cssText = 'position:fixed;opacity:0;';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); showToast('원문이 복사되었습니다', 'success'); }
    catch(e) { showToast('복사에 실패했습니다', 'error'); }
    ta.remove();
  }
}

function closeTranscriptViewer() {
  var modal = document.getElementById('transcriptViewerModal');
  if (!modal) return;
  var bd = document.getElementById('tvBackdrop');
  var sheet = document.getElementById('tvSheet');
  if (bd) bd.style.opacity = '0';
  if (sheet) sheet.style.transform = 'translateY(100%)';
  document.body.style.overflow = '';
  setTimeout(function(){ modal.remove(); }, 320);
}
