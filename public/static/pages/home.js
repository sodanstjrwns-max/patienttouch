// =========================================
// COMMAND CENTER v5 — full enhancement
// =========================================

function fmt(n) {
  if (!n && n !== 0) return '0';
  return Math.round(n / 10000).toLocaleString();
}

function animNum(el, rawValue, ms) {
  if (!el) return;
  var target = Math.round((rawValue || 0) / 10000);
  if (target === 0) { el.textContent = '0'; return; }
  var startT = null;
  function tick(ts) {
    if (!startT) startT = ts;
    var p = Math.min((ts - startT) / ms, 1);
    var e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(e * target).toLocaleString();
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function sparkline(id, vals, color) {
  var c = document.getElementById(id);
  if (!c) return;
  if (!vals || vals.length === 0) { c.style.display = 'none'; return; }
  var ctx = c.getContext('2d');
  var dpr = window.devicePixelRatio || 2;
  var cw = c.offsetWidth, ch = c.offsetHeight;
  c.width = cw * dpr; c.height = ch * dpr;
  ctx.scale(dpr, dpr);
  var mx = Math.max.apply(null, vals) || 1;
  var sx = cw / Math.max(vals.length - 1, 1);
  var grad = ctx.createLinearGradient(0,0,0,ch);
  grad.addColorStop(0, color + '25'); grad.addColorStop(1, color + '05');
  ctx.beginPath(); ctx.moveTo(0, ch);
  vals.forEach(function(v,i){
    var x = i*sx, y = ch - (v/mx)*(ch-4) - 2;
    i===0 ? ctx.lineTo(x,y) : (function(){ var px=(i-1)*sx, py=ch-(vals[i-1]/mx)*(ch-4)-2, cp=(px+x)/2; ctx.bezierCurveTo(cp,py,cp,y,x,y); })();
  });
  ctx.lineTo(cw, ch); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
  ctx.beginPath();
  vals.forEach(function(v,i){
    var x = i*sx, y = ch - (v/mx)*(ch-4) - 2;
    i===0 ? ctx.moveTo(x,y) : (function(){ var px=(i-1)*sx, py=ch-(vals[i-1]/mx)*(ch-4)-2, cp=(px+x)/2; ctx.bezierCurveTo(cp,py,cp,y,x,y); })();
  });
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
  if (vals.length > 0) {
    var lx = (vals.length-1)*sx, ly = ch-(vals[vals.length-1]/mx)*(ch-4)-2;
    ctx.beginPath(); ctx.arc(lx,ly,2.5,0,Math.PI*2); ctx.fillStyle=color; ctx.fill();
  }
}

function ring(pct, decided, target) {
  var el = document.getElementById('weekRevenueRing');
  if (!el) return;
  var sz=100, sw=7, r=(sz-sw)/2, circ=2*Math.PI*r;
  var p = Math.min(Math.max(pct,0), 100);
  var off = circ - (p/100)*circ;
  var col = p>=100?'#10b981':p>=70?'#6366f1':p>=40?'#f59e0b':'#ef4444';
  el.innerHTML =
    '<p class="text-[10px] font-bold text-surface-400 tracking-wider uppercase mb-1.5">금주 결정</p>' +
    '<div class="relative" style="width:'+sz+'px;height:'+sz+'px">' +
      '<svg width="'+sz+'" height="'+sz+'" class="transform -rotate-90">' +
        '<circle cx="'+sz/2+'" cy="'+sz/2+'" r="'+r+'" fill="none" stroke="#f1f5f9" stroke-width="'+sw+'"/>' +
        '<circle id="rc" cx="'+sz/2+'" cy="'+sz/2+'" r="'+r+'" fill="none" stroke="'+col+'" stroke-width="'+sw+'" stroke-linecap="round" stroke-dasharray="'+circ+'" stroke-dashoffset="'+circ+'" style="transition:stroke-dashoffset 1.5s cubic-bezier(.16,1,.3,1)"/>' +
      '</svg>' +
      '<div class="absolute inset-0 flex flex-col items-center justify-center">' +
        '<span class="text-xl font-black" style="color:'+col+'">'+p+'<span class="text-xs">%</span></span>' +
        '<span class="text-[9px] text-surface-500 font-medium">달성</span>' +
      '</div>' +
    '</div>' +
    '<p class="text-[11px] font-bold text-surface-600 mt-1.5">'+fmt(decided)+'<span class="text-surface-400 font-medium"> / '+fmt(target)+'만</span></p>';
  setTimeout(function(){ var c=document.getElementById('rc'); if(c) c.setAttribute('stroke-dashoffset', off); }, 100);
}

// Helper: comparison arrow
function cmpArrow(cur, prev) {
  var diff = cur - prev;
  if (diff > 0) return '<div class="text-[8px] font-bold text-emerald-600 mt-0.5"><i class="fas fa-caret-up"></i>+'+diff+'</div>';
  if (diff < 0) return '<div class="text-[8px] font-bold text-rose-600 mt-0.5"><i class="fas fa-caret-down"></i>'+diff+'</div>';
  return '<div class="text-[8px] font-bold text-surface-400 mt-0.5">—</div>';
}

// Helper: days ago label
function daysAgoLabel(dateStr) {
  if (!dateStr) return '<span class="text-[8px] px-1 py-0.5 rounded bg-rose-50 text-rose-600 font-bold">미연락</span>';
  var d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (d === 0) return '<span class="text-[8px] px-1 py-0.5 rounded bg-emerald-50 text-emerald-600 font-bold">오늘</span>';
  if (d <= 3) return '<span class="text-[8px] px-1 py-0.5 rounded bg-sky-50 text-sky-600 font-bold">'+d+'일전</span>';
  if (d <= 7) return '<span class="text-[8px] px-1 py-0.5 rounded bg-amber-50 text-amber-600 font-bold">'+d+'일전</span>';
  return '<span class="text-[8px] px-1 py-0.5 rounded bg-rose-50 text-rose-600 font-bold">'+d+'일전</span>';
}

async function loadHomePage() {
  try {
    var authData = await requireAuth();

    var h = new Date().getHours();
    var gr = h<12 ? '좋은 아침이에요' : h<18 ? '좋은 오후예요' : '좋은 저녁이에요';
    var em = h<12 ? '☀️' : h<18 ? '🌤️' : '🌙';
    
    document.getElementById('greetingSection').innerHTML =
      '<p class="text-surface-500 text-xs font-medium tracking-wide mb-0.5">'+em+' '+gr+', '+esc(authData.data.name)+'님</p>' +
      '<h1 class="text-lg font-extrabold text-surface-900 tracking-tight">'+esc(authData.data.organization_name)+'</h1>';

    var briefingUserName = authData.data.name;
    var [sRes, cRes, achRes] = await Promise.all([
      fetch('/api/dashboard/summary').then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; }),
      fetch('/api/dashboard/today-contacts').then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; }),
      fetch('/api/dashboard/achievements').then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; }),
      // Auto-generate daily CRM mission silently in background
      fetch('/api/tasks/auto-daily', { method: 'POST' }).catch(function(){ return null; })
    ]);
    var sData = sRes || {};
    var cData = cRes || {};
    var achData = achRes || {};
    
    if (!sData.success) { 
      console.warn('Summary unavailable, showing fallback');
      // Show fallback UI instead of blank page
      var hero = document.getElementById('heroRevenue');
      if (hero) hero.textContent = '0';
      document.getElementById('heroSubStats').innerHTML = '<span class="text-xs text-white/50">데이터 로딩 중 오류</span>';
      // Still render contacts and other sections
      renderContacts(cData);
      showAIInsight(null);
      renderLevelCard({}).catch(function(e){ console.warn('Level card:', e); });
      return; 
    }

    // === v8.3: MORNING BRIEFING (하루 1회 자동 표시) ===
    showMorningBriefing(cData, briefingUserName);
    
    var d = sData.data;
    var ws = d.week_stats || {};
    var td = d.today || {};
    var tm = d.today_mission || {};
    var sa = d.stale_alert || {};

    // === LEVEL PROGRESS CARD (fetch growth data, non-blocking) ===
    renderLevelCard(ws).catch(function(e){ console.warn('Level card:', e); });

    // Show AI insight with pre-loaded data (no duplicate API call)
    showAIInsight(sData);

    // === HERO DECIDED ===
    animNum(document.getElementById('heroRevenue'), td.decided, 1200);
    
    document.getElementById('heroSubStats').innerHTML =
      '<span class="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80">' +
        '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>결정 '+(td.paid||0)+'건</span>' +
      '<span class="inline-flex items-center gap-1.5 text-xs font-semibold text-white/60">' +
        '<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>미결정 '+(td.undecided||0)+'건</span>' +
      '<span class="text-xs text-white/40">총 '+(td.total_consultations||0)+'건</span>';

    // === ACHIEVEMENT BANNERS ===
    if (achData && achData.success && achData.data) {
      var achEl = document.getElementById('achievementBanners');
      var achHtml = '';
      var achs = achData.data.achievements || [];
      if (achs.length > 0) {
        achs.forEach(function(a) {
          var colors = {
            amber: 'from-amber-400 to-orange-500 shadow-amber-400/30',
            brand: 'from-brand-500 to-indigo-600 shadow-brand-500/30',
            rose: 'from-rose-500 to-pink-600 shadow-rose-500/30'
          };
          achHtml += '<div class="bg-gradient-to-r '+(colors[a.color]||colors.brand)+' rounded-xl p-3.5 flex items-center gap-3 shadow-md animate-slide-up">' +
            '<div class="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0"><i class="fas '+a.icon+' text-white text-sm"></i></div>' +
            '<div class="flex-1"><p class="text-white font-bold text-xs">'+esc(a.message)+'</p></div>' +
            '<div class="text-white/60 text-lg">🎉</div></div>';
        });
      }
      // Today appointments alert
      if (achData.data.today_appointments > 0) {
        achHtml += '<div class="bg-gradient-to-r from-sky-500 to-cyan-600 rounded-xl p-3 flex items-center gap-3 shadow-md shadow-sky-500/20">' +
          '<div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"><i class="fas fa-calendar-check text-white text-xs"></i></div>' +
          '<div class="flex-1"><p class="text-white font-bold text-xs">오늘 예약 환자 '+achData.data.today_appointments+'명</p><p class="text-white/60 text-[10px]">치료 일정을 확인하세요</p></div></div>';
      }
      if (achHtml) achEl.innerHTML = achHtml;
    }

    // === STALE UNDECIDED ALERT ===
    if (sa.count > 0) {
      var alertEl = document.getElementById('staleAlertBanner');
      alertEl.classList.remove('hidden');
      alertEl.innerHTML =
        '<div class="bg-gradient-to-r from-rose-500 to-orange-500 rounded-xl p-3.5 flex items-center gap-3 shadow-md shadow-rose-500/20">' +
          '<div class="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0"><i class="fas fa-triangle-exclamation text-white"></i></div>' +
          '<div class="flex-1 min-w-0">' +
            '<p class="text-white font-bold text-xs">미결정 3일+ 방치 '+sa.count+'명</p>' +
            '<p class="text-white/70 text-[11px]">'+fmt(sa.amount)+'만원 이탈 위험</p>' +
          '</div>' +
          '<a href="/retention" class="text-white/90 text-[10px] font-bold bg-white/20 px-2.5 py-1.5 rounded-lg hover:bg-white/30 transition-all shrink-0">연락하기</a>' +
        '</div>';
    }

    // === TODAY CHECKLIST ===
    loadChecklist(td, tm, d);

    // === KPI STATS ROW with comparison arrows ===
    var cr = ws.conversion_rate||0, pcr = ws.prev_conversion_rate||0;
    var sc = ws.avg_score||0, psc = ws.prev_avg_score||0;
    var ct = ws.contact_rate||0, pct2 = ws.prev_contact_rate||0;
    var tc = ws.total_consultations||0, ptc = ws.prev_total_consultations||0;
    document.getElementById('kpiStatsRow').innerHTML =
      '<div class="card-premium p-2.5 text-center">' +
        '<div class="text-lg font-extrabold text-brand-600 leading-none mb-0.5">'+cr+'<span class="text-[10px]">%</span></div>' +
        '<div class="text-[10px] font-medium text-surface-500">전환율</div>' +
        cmpArrow(cr,pcr) +
      '</div>' +
      '<div class="card-premium p-2.5 text-center">' +
        '<div class="text-lg font-extrabold text-emerald-600 leading-none mb-0.5">'+sc+'<span class="text-[10px]">점</span></div>' +
        '<div class="text-[10px] font-medium text-surface-500">상담점수</div>' +
        cmpArrow(sc,psc) +
      '</div>' +
      '<div class="card-premium p-2.5 text-center">' +
        '<div class="text-lg font-extrabold text-amber-600 leading-none mb-0.5">'+ct+'<span class="text-[10px]">%</span></div>' +
        '<div class="text-[10px] font-medium text-surface-500">연락수행</div>' +
        cmpArrow(ct,pct2) +
      '</div>' +
      '<div class="card-premium p-2.5 text-center">' +
        '<div class="text-lg font-extrabold text-sky-600 leading-none mb-0.5">'+tc+'<span class="text-[10px]">건</span></div>' +
        '<div class="text-[10px] font-medium text-surface-500">상담건수</div>' +
        cmpArrow(tc,ptc) +
      '</div>';

    // === WEEK RING ===
    var tgt = ws.decided_target || 50000000;
    var ringPct = tgt > 0 ? Math.round(((ws.decided||0) / tgt) * 100) : 0;
    ring(ringPct, ws.decided||0, tgt);

    // === KPI SPARKLINE CARDS ===
    var sp = d.sparkline || [];
    var decArr = sp.map(function(s){ return s.decided||0; });
    var cntArr = sp.map(function(s){ return s.total||0; });

    var trend = ws.decided_trend||0;
    var tH = trend > 0
      ? '<span class="text-[10px] font-bold text-emerald-600"><i class="fas fa-arrow-up text-[8px]"></i>+'+trend+'%</span>'
      : trend < 0
        ? '<span class="text-[10px] font-bold text-rose-600"><i class="fas fa-arrow-down text-[8px]"></i>'+trend+'%</span>'
        : '';

    document.getElementById('kpiSection').innerHTML =
      '<div class="card-premium p-3">' +
        '<div class="flex items-center justify-between mb-1">' +
          '<span class="text-[11px] font-semibold text-surface-500">금주 결정</span>' +
          tH +
        '</div>' +
        '<div class="text-base font-extrabold tracking-tight">'+fmt(ws.decided)+'<span class="text-[10px] font-medium text-surface-400 ml-0.5">만원</span></div>' +
        '<canvas id="spkR" class="w-full mt-1" style="height:28px"></canvas>' +
      '</div>' +
      '<div class="card-premium p-3">' +
        '<div class="flex items-center justify-between mb-1">' +
          '<span class="text-[11px] font-semibold text-surface-500">금주 상담</span>' +
          '<div class="flex gap-1">' +
            '<span class="text-[9px] font-semibold px-1 py-0.5 rounded bg-emerald-50 text-emerald-700">'+(ws.paid_consultations||0)+'결정</span>' +
            '<span class="text-[9px] font-semibold px-1 py-0.5 rounded bg-surface-100 text-surface-600">'+((ws.total_consultations||0)-(ws.paid_consultations||0))+'미결정</span>' +
          '</div>' +
        '</div>' +
        '<div class="text-base font-extrabold tracking-tight">'+(ws.total_consultations||0)+'<span class="text-[10px] font-medium text-surface-400 ml-0.5">건</span></div>' +
        '<canvas id="spkC" class="w-full mt-1" style="height:28px"></canvas>' +
      '</div>';

    setTimeout(function(){
      sparkline('spkR', decArr, '#6366f1');
      sparkline('spkC', cntArr, '#0ea5e9');
    }, 50);

    // === MVP ===
    var mv = d.mvp_case;
    if (mv) {
      var mvE = document.getElementById('mvpSection');
      mvE.classList.remove('hidden');
      mvE.innerHTML =
        '<div class="flex items-center gap-2 mb-3"><div class="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center"><i class="fas fa-trophy text-[10px] text-amber-600"></i></div><h2 class="text-sm font-bold text-surface-900">이번 주 MVP</h2></div>' +
        '<a href="/consultations/'+mv.id+'" class="card-premium p-4 block relative overflow-hidden">' +
          '<div class="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-50 to-transparent rounded-bl-3xl"></div>' +
          '<div class="flex items-center gap-3">' +
            '<div class="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-400/30"><i class="fas fa-crown text-white"></i></div>' +
            '<div class="flex-1">' +
              '<div class="flex items-center gap-2">'+PT.patientNameLink(mv.patient_id, mv.patient_name, {stop:true})+'<span class="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold">'+(esc(mv.treatment_type)||'')+'</span></div>' +
              '<div class="flex items-center gap-2 mt-0.5"><span class="text-base font-extrabold text-emerald-600">'+fmt(mv.amount)+'<span class="text-xs text-surface-400 font-medium ml-0.5">만원</span></span>'+(mv.consult_score?'<span class="text-[10px] px-1.5 py-0.5 rounded-md bg-brand-50 text-brand-700 font-semibold">'+mv.consult_score+'점</span>':'')+'</div>' +
            '</div>' +
            '<i class="fas fa-chevron-right text-surface-300 text-xs"></i>' +
          '</div>' +
        '</a>';
    }

    // === RECENT CONSULTATIONS ===
    var rc = d.recent_consultations || [];
    if (rc.length > 0) {
      var stMap = {
        paid:{bg:'bg-emerald-50',tx:'text-emerald-700',rn:'ring-emerald-200/50',lb:'결정',dt:'bg-emerald-500'},
        undecided:{bg:'bg-amber-50',tx:'text-amber-700',rn:'ring-amber-200/50',lb:'미결정',dt:'bg-amber-500'},
        lost:{bg:'bg-rose-50',tx:'text-rose-700',rn:'ring-rose-200/50',lb:'이탈',dt:'bg-rose-500'},
        pending:{bg:'bg-surface-50',tx:'text-surface-600',rn:'ring-surface-200/50',lb:'대기',dt:'bg-surface-400'}
      };
      document.getElementById('recentConsultations').innerHTML = '<div class="space-y-2">' + rc.map(function(c){
        var s = stMap[c.status] || stMap.pending;
        return '<a href="/consultations/'+c.id+'" class="card-premium p-3 flex items-center gap-3 block">' +
          '<div class="w-9 h-9 rounded-xl '+s.bg+' flex items-center justify-center shrink-0"><span class="text-sm font-bold '+s.tx+'">'+(esc(c.patient_name)?esc(c.patient_name).charAt(0):'?')+'</span></div>' +
          '<div class="flex-1 min-w-0">' +
            '<div class="flex items-center justify-between">'+PT.patientNameLink(c.patient_id, c.patient_name, {stop:true, cls:'font-bold text-sm truncate text-brand-700 underline decoration-dotted decoration-brand-300 underline-offset-2 active:opacity-60', fallbackCls:'font-bold text-sm truncate', emptyText:'미지정'}) +
            '<span class="inline-flex items-center gap-1 font-semibold rounded-lg ring-1 ring-inset px-1.5 py-0.5 text-[10px] '+s.bg+' '+s.tx+' '+s.rn+'"><span class="w-1.5 h-1.5 rounded-full '+s.dt+'"></span>'+s.lb+'</span></div>' +
            '<div class="flex items-center gap-2 mt-0.5">'+(esc(c.treatment_type)?'<span class="text-xs text-surface-500">'+esc(c.treatment_type)+'</span>':'')+(c.amount?'<span class="text-xs font-semibold text-surface-600">'+fmt(c.amount)+'만원</span>':'')+(c.feedback&&c.feedback.total_score?'<span class="text-xs font-semibold text-brand-600">'+c.feedback.total_score+'점</span>':'')+'</div>' +
          '</div><i class="fas fa-chevron-right text-surface-300 text-xs"></i></a>';
      }).join('') + '</div>';
    } else {
      // Feature 5: Onboarding empty state when no data at all
      if (td.total_consultations === 0 && (ws.total_consultations||0) === 0) {
        showOnboardingState('recentConsultations', [
          {title:'첫 환자 등록하기', desc:'환자 정보를 등록하세요', href:'/patients', done: false},
          {title:'상담 녹음해보기', desc:'AI가 자동으로 분석해줍니다', href:'/recording', done: false},
          {title:'리포트 확인하기', desc:'상담 분석 결과를 확인하세요', href:'/report', done: false}
        ]);
      } else {
        document.getElementById('recentConsultations').innerHTML =
          '<div class="card-premium p-5"><div class="text-center py-3">' +
          '<div class="w-10 h-10 mx-auto bg-surface-100 rounded-xl flex items-center justify-center mb-2"><i class="fas fa-calendar-check text-surface-300 text-sm"></i></div>' +
          '<p class="text-surface-400 text-sm font-medium">오늘 상담 내역이 없습니다</p></div></div>';
      }
    }

    // === TODAY CONTACTS ===
    renderContacts(cData);

  } catch (err) {
    if (err === 'auth') return; // already redirecting
    console.error('Dashboard error:', err);
    showErrorState('recentConsultations', '대시보드 데이터를 불러올 수 없습니다', loadHomePage);
    document.getElementById('heroSubStats').innerHTML = '<span class="text-xs text-white/50">데이터를 불러올 수 없습니다</span>';
  }
}

function renderContacts(data) {
  var box = document.getElementById('todayContactsSection');
  var banner = document.getElementById('contactRevenueBanner');
  if (!data || !data.success || !data.data || !data.data.contacts || data.data.contacts.length === 0) {
    if (banner) banner.classList.add('hidden');
    box.innerHTML =
      '<div class="card-premium p-5 text-center">' +
        '<div class="w-12 h-12 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center mb-2"><i class="fas fa-circle-check text-xl text-emerald-500"></i></div>' +
        '<p class="font-bold text-sm text-surface-800 mb-0.5">오늘 연락 완료!</p>' +
        '<p class="text-xs text-surface-500 mb-3">연락할 환자가 없어요</p>' +
        '<button onclick="generateTasks()" class="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 bg-brand-50 px-3.5 py-2 rounded-xl"><i class="fas fa-wand-magic-sparkles text-[10px]"></i>연락 대상 찾기</button>' +
      '</div>';
    return;
  }

  var cs = data.data.contacts;
  document.getElementById('contactCount').textContent = cs.length;

  var pot = 0;
  cs.forEach(function(c){ if(c.amount) pot+=c.amount; if(c.remaining_value) pot+=c.remaining_value; });
  if (pot > 0 && banner) {
    banner.classList.remove('hidden');
    banner.innerHTML =
      '<div class="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-xl p-3 flex items-center justify-between">' +
        '<div class="flex items-center gap-2"><div class="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center"><i class="fas fa-coins text-white text-xs"></i></div>' +
        '<div><p class="text-white/60 text-[10px] font-medium">예상 결정 금액</p><p class="text-white text-base font-extrabold">'+fmt(pot)+'<span class="text-xs font-medium text-white/50 ml-0.5">만원</span></p></div></div>' +
        '<div class="text-white/40 text-[10px] font-medium">'+cs.length+'명</div></div>';
  }

  var uCfg = {
    critical:{bd:'border-l-rose-500',bg:'bg-rose-50',tx:'text-rose-700',ic:'fa-fire',lb:'긴급',pu:true},
    high:{bd:'border-l-amber-500',bg:'bg-amber-50',tx:'text-amber-700',ic:'fa-bolt',lb:'높음',pu:false},
    medium:{bd:'border-l-sky-400',bg:'bg-sky-50',tx:'text-sky-700',ic:'fa-heart',lb:'보통',pu:false}
  };
  var avCol = ['bg-brand-100 text-brand-700','bg-emerald-100 text-emerald-700','bg-amber-100 text-amber-700','bg-rose-100 text-rose-700','bg-sky-100 text-sky-700','bg-purple-100 text-purple-700'];

  // Referral source icons
  var refIcons = {
    'naver':'fa-n','blog':'fa-blog','instagram':'fa-instagram','youtube':'fa-youtube',
    'google':'fa-google','kakao':'fa-comment','referral':'fa-user-group','walk_in':'fa-walking'
  };

  var html = '';
  var cr=data.data.critical_count||0, hi=data.data.high_count||0, rest=cs.length-cr-hi;
  if(cr>0||hi>0) {
    html += '<div class="flex gap-1.5 mb-2">';
    if(cr>0) html += '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 text-[10px] font-bold"><i class="fas fa-fire text-[8px]"></i>긴급 '+cr+'</span>';
    if(hi>0) html += '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-bold"><i class="fas fa-bolt text-[8px]"></i>높음 '+hi+'</span>';
    if(rest>0) html += '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50 text-sky-700 text-[10px] font-bold">보통 '+rest+'</span>';
    html += '</div>';
  }

  cs.forEach(function(c){
    var u = uCfg[c.urgency] || uCfg.medium;
    var ci = esc(c.patient_name).charCodeAt(0) % avCol.length;
    html += '<div class="card-premium p-3 border-l-[3px] '+u.bd+'">';
    html += '<div class="flex items-start gap-2.5">';
    html += '<a href="/patients/'+c.patient_id+'" class="w-8 h-8 rounded-lg '+avCol[ci]+' flex items-center justify-center font-bold text-xs shrink-0">'+esc(c.patient_name).charAt(0)+'</a>';
    html += '<div class="flex-1 min-w-0">';
    // Name + urgency + last contact
    html += '<div class="flex items-center gap-1.5 flex-wrap">';
    html += '<a href="/patients/'+c.patient_id+'" class="font-bold text-sm text-surface-900 hover:text-brand-600">'+esc(c.patient_name)+'</a>';
    html += PT.transcriptBtn(c.patient_id, c.patient_name);
    html += '<span class="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold '+u.bg+' '+u.tx+'">';
    if(u.pu) html += '<span class="w-1 h-1 rounded-full bg-rose-500 animate-pulse"></span>';
    html += '<i class="fas '+u.ic+' text-[7px]"></i>'+u.lb+'</span>';
    if(c.origin === 'ai_analysis') html += '<span class="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-700"><i class="fas fa-robot text-[7px]"></i>AI 추천</span>';
    if(c.days_overdue >= 1) html += '<span class="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold bg-orange-100 text-orange-700">⏰ '+c.days_overdue+'일 지연</span>';
    // Last contact date tag
    html += daysAgoLabel(c.last_contact_date);
    html += '</div>';
    html += '<p class="text-[11px] text-surface-600 mt-0.5 line-clamp-1">'+(esc(c.reason)||'')+'</p>';
    // Tags: treatment + amount + referral_source + region
    html += '<div class="flex flex-wrap gap-1 mt-1">';
    if(esc(c.treatment_type)) html += '<span class="text-[9px] px-1 py-0.5 rounded bg-brand-50 text-brand-600 font-medium">'+esc(c.treatment_type)+'</span>';
    if(c.amount) html += '<span class="text-[9px] px-1 py-0.5 rounded bg-emerald-50 text-emerald-600 font-medium">'+fmt(c.amount)+'만</span>';
    if(c.referral_source) {
      var rIcon = refIcons[c.referral_source] || 'fa-tag';
      var rLabel = c.referral_source === 'naver' ? '네이버' : c.referral_source === 'blog' ? '블로그' : c.referral_source === 'instagram' ? '인스타' : c.referral_source === 'youtube' ? '유튜브' : c.referral_source === 'google' ? '구글' : c.referral_source === 'kakao' ? '카카오' : c.referral_source === 'referral' ? '소개' : c.referral_source === 'walk_in' ? '워크인' : c.referral_source;
      html += '<span class="text-[9px] px-1 py-0.5 rounded bg-orange-50 text-orange-600 font-medium"><i class="fab '+rIcon+' text-[7px] mr-0.5"></i>'+rLabel+'</span>';
    }
    if(c.region) html += '<span class="text-[9px] px-1 py-0.5 rounded bg-slate-100 text-slate-600 font-medium"><i class="fas fa-location-dot text-[7px] mr-0.5"></i>'+c.region+'</span>';
    if(c.decision_score) html += '<span class="text-[9px] px-1 py-0.5 rounded bg-purple-50 text-purple-600 font-medium">결정도 '+c.decision_score+'</span>';
    html += '</div>';
    if(c.ai_reason) html += '<p class="text-[10px] text-purple-600 mt-1 line-clamp-1"><i class="fas fa-wand-magic-sparkles mr-1 text-[8px]"></i>'+esc(c.ai_reason)+'</p>';
    if(esc(c.points) && esc(c.points).length > 0) html += '<p class="text-[10px] text-surface-500 mt-1 line-clamp-1"><i class="fas fa-lightbulb text-amber-400 mr-1 text-[8px]"></i>'+esc(c.points)[0]+'</p>';
    else if(esc(c.recommended_script)) html += '<p class="text-[10px] text-surface-500 mt-1 line-clamp-1"><i class="fas fa-sparkles text-brand-400 mr-1 text-[8px]"></i>'+esc(c.recommended_script)+'</p>';
    html += '</div>';
    html += '<div class="flex flex-col gap-1.5 shrink-0">';
    if(c.patient_phone_full) html += '<a href="tel:'+c.patient_phone_full+'" class="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 hover:bg-brand-100 active:scale-90 transition-all"><i class="fas fa-phone text-xs"></i></a>';
    html += '<button onclick="openHomeContactModal(\'' + c.patient_id + '\', \'' + (c.task_id||'') + '\', \'' + (c.source||'task') + '\')" class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 active:scale-90 transition-all"><i class="fas fa-check text-xs"></i></button>';
    html += '</div>';
    html += '</div></div>';
  });

  box.innerHTML = html;
}

async function generateTasks() {
  try {
    var btn = event && event.target;
    if(btn){btn.disabled=true;btn.innerHTML='<i class="fas fa-spinner fa-spin mr-1"></i>찾는 중...';}
    var res = await fetch('/api/tasks/generate',{method:'POST'});
    var data = await res.json();
    if(data.success && data.data.generated > 0){
      showToast(data.data.generated+'명의 연락 대상을 찾았습니다!', 'success');
      var cR = await fetch('/api/dashboard/today-contacts');
      var cD = await cR.json();
      renderContacts(cD);
    } else {
      showToast('새로 추가할 연락 대상이 없습니다.', 'info');
      if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-rotate mr-1"></i>갱신';}
    }
  } catch(e) { showToast('오류가 발생했습니다.', 'error'); }
}

// =========================================
// v8.3: MORNING BRIEFING OVERLAY (하루 1회)
// =========================================
function showMorningBriefing(cData, userName) {
  try {
    var todayKey = 'pt_briefing_' + new Date().toISOString().split('T')[0];
    if (localStorage.getItem(todayKey)) return; // 오늘 이미 봤음

    var d = (cData && cData.success && cData.data) ? cData.data : null;
    if (!d || !d.contacts || d.contacts.length === 0) return; // 연락할 게 없으면 스킵

    var cs = d.contacts;
    var revenue = d.expected_revenue || 0;
    var overdue = d.overdue_count || 0;
    var critical = d.critical_count || 0;
    var top = cs[0];

    var h = new Date().getHours();
    var greet = h < 12 ? '좋은 아침이에요' : h < 18 ? '좋은 오후예요' : '좋은 저녁이에요';
    var emoji = h < 12 ? '☀️' : h < 18 ? '🌤️' : '🌙';
    var now = new Date();
    var days = ['일','월','화','수','목','금','토'];
    var dateStr = (now.getMonth()+1) + '월 ' + now.getDate() + '일 (' + days[now.getDay()] + ')';

    var overlay = document.createElement('div');
    overlay.id = 'morningBriefingOverlay';
    overlay.className = 'fixed inset-0 bg-surface-900/70 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center';

    var html =
      '<div class="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md overflow-hidden animate-slide-up max-h-[85vh] overflow-y-auto">' +
        // Header
        '<div class="bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-700 p-6 relative overflow-hidden">' +
          '<div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-10 translate-x-10"></div>' +
          '<div class="relative">' +
            '<p class="text-white/60 text-[11px] font-semibold mb-1">' + dateStr + '</p>' +
            '<h2 class="text-xl font-black text-white mb-0.5">' + emoji + ' ' + greet + ', ' + esc(userName) + '님</h2>' +
            '<p class="text-white/70 text-xs">오늘의 브리핑을 확인하세요</p>' +
          '</div>' +
        '</div>' +
        // Stats
        '<div class="p-5 space-y-4">' +
          '<div class="grid grid-cols-3 gap-2">' +
            '<div class="bg-brand-50 rounded-xl p-3 text-center">' +
              '<p class="text-2xl font-black text-brand-600 tabular-nums">' + cs.length + '</p>' +
              '<p class="text-[10px] font-semibold text-brand-500">오늘 연락</p>' +
            '</div>' +
            '<div class="bg-emerald-50 rounded-xl p-3 text-center">' +
              '<p class="text-2xl font-black text-emerald-600 tabular-nums">' + fmt(revenue) + '</p>' +
              '<p class="text-[10px] font-semibold text-emerald-500">예상 만원</p>' +
            '</div>' +
            '<div class="' + (overdue > 0 ? 'bg-orange-50' : 'bg-surface-50') + ' rounded-xl p-3 text-center">' +
              '<p class="text-2xl font-black ' + (overdue > 0 ? 'text-orange-600' : 'text-surface-400') + ' tabular-nums">' + overdue + '</p>' +
              '<p class="text-[10px] font-semibold ' + (overdue > 0 ? 'text-orange-500' : 'text-surface-400') + '">이월 연락</p>' +
            '</div>' +
          '</div>';

    // Overdue warning
    if (overdue > 0) {
      html +=
        '<div class="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-3 flex items-center gap-2.5">' +
          '<span class="text-lg">⏰</span>' +
          '<p class="text-white text-xs font-bold flex-1">어제 못 한 연락 ' + overdue + '건이 이월됐어요. 오늘 최우선으로!</p>' +
        '</div>';
    }

    // Top priority
    if (top) {
      var topOv = (top.days_overdue >= 1) ? '<span class="text-[9px] px-1 py-0.5 rounded font-bold bg-orange-100 text-orange-700 ml-1">⏰ ' + top.days_overdue + '일 지연</span>' : '';
      html +=
        '<div class="border-2 border-brand-200 bg-brand-50/50 rounded-xl p-3.5">' +
          '<p class="text-[10px] font-bold text-brand-500 tracking-wider uppercase mb-1.5"><i class="fas fa-crosshairs mr-1"></i>최우선 연락</p>' +
          '<div class="flex items-center gap-2 mb-1">' +
            PT.patientNameLink(top.patient_id, top.patient_name, {tag:'p', suffix:'님', cls:'font-bold text-base text-brand-700 underline decoration-dotted decoration-brand-300 underline-offset-2 active:opacity-60', fallbackCls:'font-bold text-base text-surface-900'}) + topOv +
          '</div>' +
          '<p class="text-xs text-surface-600 mb-1">' + esc(top.reason || '') + '</p>' +
          '<div class="flex flex-wrap gap-1">' +
            (top.treatment_type ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-brand-100 text-brand-600 font-medium">' + esc(top.treatment_type) + '</span>' : '') +
            (top.amount ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-600 font-medium">' + fmt(top.amount) + '만원</span>' : '') +
            (critical > 0 ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-600 font-medium"><i class="fas fa-fire text-[7px] mr-0.5"></i>긴급 총 ' + critical + '건</span>' : '') +
          '</div>' +
        '</div>';
    }

    // Actions
    html +=
          '<div class="flex gap-2 pt-1">' +
            '<button onclick="dismissMorningBriefing()" class="flex-1 py-3 rounded-xl text-sm font-semibold text-surface-600 bg-surface-100 hover:bg-surface-200 transition-all active:scale-[0.98]">나중에</button>' +
            '<a href="/today" onclick="dismissMorningBriefing()" class="flex-[2] py-3 rounded-xl text-sm font-bold text-white bg-gradient-brand text-center shadow-lg shadow-brand-600/20 transition-all active:scale-[0.98]"><i class="fas fa-bolt mr-1.5"></i>오늘의 액션 시작하기</a>' +
          '</div>' +
        '</div>' +
      '</div>';

    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    localStorage.setItem(todayKey, '1');

    // Cleanup old briefing keys (keep only today)
    try {
      for (var i = localStorage.length - 1; i >= 0; i--) {
        var k = localStorage.key(i);
        if (k && k.indexOf('pt_briefing_') === 0 && k !== todayKey) localStorage.removeItem(k);
      }
    } catch(e) {}
  } catch(e) { console.warn('Briefing error:', e); }
}

function dismissMorningBriefing() {
  var el = document.getElementById('morningBriefingOverlay');
  if (el) el.remove();
}

// === HOME CONTACT MODAL ===
var hcContactType = 'phone';
function openHomeContactModal(patientId, taskId, source) {
  document.getElementById('hcPatientId').value = patientId || '';
  document.getElementById('hcTaskId').value = taskId || '';
  document.getElementById('hcSource').value = source || 'task';
  document.getElementById('hcResult').value = 'connected';
  document.getElementById('hcNotes').value = '';
  document.getElementById('hcNextDate').value = '';
  hcContactType = 'phone';
  document.querySelectorAll('.hc-type-btn').forEach(function(b) {
    b.className = b.dataset.type === 'phone'
      ? 'hc-type-btn flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-brand-500 text-brand-600 bg-brand-50 transition-all'
      : 'hc-type-btn flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-surface-200 text-surface-600 transition-all';
  });
  document.getElementById('homeContactModal').classList.remove('hidden');
}
function closeHomeContactModal() { document.getElementById('homeContactModal').classList.add('hidden'); }
function selectHcType(type) {
  hcContactType = type;
  document.querySelectorAll('.hc-type-btn').forEach(function(b) {
    b.className = b.dataset.type === type
      ? 'hc-type-btn flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-brand-500 text-brand-600 bg-brand-50 transition-all'
      : 'hc-type-btn flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-surface-200 text-surface-600 transition-all';
  });
}
async function saveHomeContact() {
  var btn = document.getElementById('hcSaveBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>저장 중...';
  try {
    var patientId = document.getElementById('hcPatientId').value;
    var taskId = document.getElementById('hcTaskId').value;
    var source = document.getElementById('hcSource').value;
    var result = document.getElementById('hcResult').value;
    var notes = document.getElementById('hcNotes').value;
    var nextDate = document.getElementById('hcNextDate').value;

    // Save via retention contacts API
    var res = await fetch('/api/retention/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: patientId,
        contact_type: hcContactType === 'text' ? 'text' : hcContactType,
        result: result,
        notes: notes,
        next_contact_date: nextDate || null
      })
    });
    var data = await res.json();

    // Also complete the task if it came from a task
    if (taskId && source === 'task') {
      // Map modal result to task outcome for auto follow-up
      var outcomeMap = {
        'appointment_booked': 'booked',
        'callback_promised': 'callback',
        'refused': 'rejected',
        'no_answer': 'no_answer',
        'connected': 'hold',
        'message_sent': 'hold'
      };
      var taskOutcome = outcomeMap[result] || 'hold';
      await fetch('/api/tasks/' + taskId + '/complete', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contact_type: hcContactType,
          contact_result: result,
          outcome: taskOutcome, 
          content: notes 
        })
      });
    }

    if (data.success) {
      closeHomeContactModal();
      // Reload contacts section without full page reload
      var cRes = await fetch('/api/dashboard/today-contacts');
      var cData = await cRes.json();
      renderContacts(cData);
      // Update mission progress
      var sRes = await fetch('/api/dashboard/summary');
      var sData = await sRes.json();
      if (sData.success) {
        var tm = sData.data.today_mission || {};
        var td = sData.data.today || {};
        var mTotal = (tm.contacts_total||0) + (td.total_consultations||0);
        var mDone = (tm.contacts_done||0) + (td.total_consultations||0);
        var mPct = mTotal > 0 ? Math.min(100, Math.round((mDone / mTotal) * 100)) : 0;
        var mEl = document.getElementById('todayMission');
        if (mEl) {
          mEl.classList.remove('hidden');
          mEl.innerHTML =
            '<div class="flex items-center justify-between mb-2.5"><div class="flex items-center gap-2"><div class="w-6 h-6 rounded-lg bg-brand-50 flex items-center justify-center"><i class="fas fa-flag text-[10px] text-brand-600"></i></div><span class="text-sm font-bold text-surface-900">\uc624\ub298 \ubbf8\uc158</span></div><span class="text-xs font-extrabold '+(mPct>=100?'text-emerald-600':'text-brand-600')+'">'+mPct+'%</span></div>' +
            '<div class="h-2 bg-surface-100 rounded-full overflow-hidden mb-3"><div class="h-full rounded-full transition-all duration-1000 '+(mPct>=100?'bg-emerald-500':'bg-brand-500')+'" style="width:'+mPct+'%"></div></div>' +
            '<div class="flex items-center gap-3"><div class="flex items-center gap-1.5"><i class="fas fa-phone text-[10px] text-brand-500"></i><span class="text-[11px] font-semibold text-surface-700">\uc5f0\ub77d <b class="text-brand-600">'+(tm.contacts_done||0)+'</b>/'+(tm.contacts_total||0)+'</span></div><div class="flex items-center gap-1.5"><i class="fas fa-stethoscope text-[10px] text-sky-500"></i><span class="text-[11px] font-semibold text-surface-700">\uc0c1\ub2f4 <b class="text-sky-600">'+(tm.consultations_done||0)+'</b>\uac74</span></div><div class="flex items-center gap-1.5"><i class="fas fa-circle-check text-[10px] text-emerald-500"></i><span class="text-[11px] font-semibold text-surface-700">\uacb0\uc815 <b class="text-emerald-600">'+(tm.decisions_done||0)+'</b>\uac74</span></div></div>';
        }
      }
    } else { showToast(data.error || '저장에 실패했습니다.', 'error'); }
  } catch (err) { showToast('오류가 발생했습니다.', 'error'); }
  finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check mr-2"></i>기록 저장'; }
}

// =========================================
// PATIENT QUICK SEARCH
// =========================================
(function() {
  var input = document.getElementById('quickSearchInput');
  var results = document.getElementById('quickSearchResults');
  var list = document.getElementById('quickSearchList');
  var clearBtn = document.getElementById('quickSearchClear');
  var timer = null;
  var avCol = ['bg-brand-100 text-brand-700','bg-emerald-100 text-emerald-700','bg-amber-100 text-amber-700','bg-rose-100 text-rose-700','bg-sky-100 text-sky-700','bg-purple-100 text-purple-700'];

  input.addEventListener('input', function() {
    var q = input.value.trim();
    clearBtn.classList.toggle('hidden', q.length === 0);
    if (timer) clearTimeout(timer);
    if (q.length < 1) { results.classList.add('hidden'); return; }
    timer = setTimeout(function(){ searchPatients(q); }, 250);
  });

  clearBtn.addEventListener('click', function() {
    input.value = '';
    clearBtn.classList.add('hidden');
    results.classList.add('hidden');
  });

  // Close on outside click
  document.addEventListener('click', function(e) {
    if (!input.contains(e.target) && !results.contains(e.target) && !clearBtn.contains(e.target)) {
      results.classList.add('hidden');
    }
  });

  input.addEventListener('focus', function() {
    if (input.value.trim().length >= 1 && list.children.length > 0) {
      results.classList.remove('hidden');
    }
  });

  async function searchPatients(q) {
    try {
      var res = await safeFetch('/api/patients?search=' + encodeURIComponent(q) + '&limit=8');
      var data = await res.json();
      if (!data.success || !data.data || data.data.length === 0) {
        list.innerHTML =
          '<div class="p-4 text-center">' +
            '<div class="w-10 h-10 mx-auto bg-surface-100 rounded-xl flex items-center justify-center mb-2">' +
              '<i class="fas fa-user-slash text-surface-300 text-sm"></i></div>' +
            '<p class="text-surface-500 text-xs">검색 결과가 없습니다</p>' +
            '<a href="/patients" class="inline-block mt-2 text-[11px] font-semibold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100">환자 등록하기</a>' +
          '</div>';
        results.classList.remove('hidden');
        return;
      }

      var statusMap = {paid:'결제',undecided:'미결정',pending:'대기',lost:'이탈'};
      var statusColor = {paid:'bg-emerald-50 text-emerald-700',undecided:'bg-amber-50 text-amber-700',pending:'bg-surface-100 text-surface-600',lost:'bg-rose-50 text-rose-700'};

      var html = '';
      data.data.forEach(function(p) {
        var ci = (esc(p.name)||'?').charCodeAt(0) % avCol.length;
        var ph = p.phone ? esc(p.phone) : '';
        var ls = p.last_consultation_status;
        var sBadge = ls ? '<span class="text-[9px] px-1.5 py-0.5 rounded-md font-bold '+(statusColor[ls]||statusColor.pending)+'">'+(statusMap[ls]||ls)+'</span>' : '';
        var cntBadge = p.consultation_count > 0 ? '<span class="text-[9px] px-1.5 py-0.5 rounded-md bg-surface-100 text-surface-500 font-medium">상담 '+p.consultation_count+'회</span>' : '';

        html += '<a href="/patients/'+p.id+'" class="flex items-center gap-3 p-3 hover:bg-brand-50/50 transition-all active:bg-brand-50 cursor-pointer">';
        html += '<div class="w-9 h-9 rounded-xl '+avCol[ci]+' flex items-center justify-center font-bold text-xs shrink-0">'+(esc(p.name)||'?').charAt(0)+'</div>';
        html += '<div class="flex-1 min-w-0">';
        html += '<div class="flex items-center gap-1.5"><span class="font-bold text-sm text-surface-900">'+esc(p.name)+'</span>'+sBadge+'</div>';
        html += '<div class="flex items-center gap-1.5 mt-0.5">';
        if (ph) html += '<span class="text-[11px] text-surface-500">'+ph+'</span>';
        html += cntBadge;
        html += '</div></div>';
        html += '<i class="fas fa-chevron-right text-surface-300 text-[10px] shrink-0"></i>';
        html += '</a>';
      });
      if (data.data.length >= 8) {
        html += '<a href="/patients?search='+encodeURIComponent(q)+'" class="block p-3 text-center text-[11px] font-semibold text-brand-600 hover:bg-brand-50/50 transition-all">' +
          '<i class="fas fa-arrow-right mr-1 text-[10px]"></i>전체 결과 보기</a>';
      }
      list.innerHTML = html;
      results.classList.remove('hidden');
    } catch(e) {
      list.innerHTML = '<div class="p-4 text-center text-xs text-surface-500">검색 중 오류 발생</div>';
      results.classList.remove('hidden');
    }
  }
})();

// =========================================
// TODAY CHECKLIST
// =========================================
var checklistExpanded = false;
var checklistAllItems = [];

async function loadChecklist(td, tm, summaryData) {
  try {
    var wrap = document.getElementById('todayChecklist');
    var items = [];

    // 1. Contacts: fetch today-contacts
    var cRes = await safeFetch('/api/dashboard/today-contacts');
    var cData = await cRes.json();
    if (cData.success && cData.data && cData.data.contacts) {
      cData.data.contacts.forEach(function(c) {
        items.push({
          type: 'contact',
          id: 'contact_' + c.patient_id + '_' + (c.task_id||''),
          done: false,
          urgency: c.urgency || 'medium',
          days_overdue: c.days_overdue || 0,
          icon: 'fa-phone',
          color: c.urgency === 'critical' ? 'rose' : c.urgency === 'high' ? 'amber' : 'sky',
          title: esc(c.patient_name) + ' 연락',
          subtitle: esc(c.reason) || esc(c.treatment_type) || '미결정 환자',
          amount: c.amount,
          patient_id: c.patient_id,
          task_id: c.task_id || '',
          source: c.source || 'task',
          phone: c.patient_phone_full || ''
        });
      });
    }

    // 2. Retention urgent: fetch retention dashboard
    try {
      var rRes = await safeFetch('/api/retention/dashboard?filter=urgent');
      var rData = await rRes.json();
      if (rData.success && rData.data && rData.data.patients) {
        var retPatientIds = new Set(items.map(function(i){ return i.patient_id; }));
        rData.data.patients.slice(0, 5).forEach(function(p) {
          if (retPatientIds.has(p.patient_id)) return; // skip duplicates
          var sLabel = p.status === 'unscheduled_urgent' ? '예약 미완 (긴급)' :
                       p.status === 'unscheduled_warning' ? '예약 미완' :
                       p.status === 'at_risk' ? '이탈 위험' :
                       p.status === 'consulted_unconverted' ? '상담 후 미전환' :
                       p.status === 'recall_6m' ? '6개월 리콜' :
                       p.status === 'recall_12m' ? '12개월 리콜' : '리텐션 대상';
          items.push({
            type: 'retention',
            id: 'ret_' + p.patient_id,
            done: false,
            urgency: p.risk_score >= 70 ? 'critical' : p.risk_score >= 40 ? 'high' : 'medium',
            icon: 'fa-heart-pulse',
            color: p.risk_score >= 70 ? 'rose' : p.risk_score >= 40 ? 'amber' : 'purple',
            title: esc(p.patient_name) + ' 관리',
            subtitle: sLabel + (p.days_since_visit > 0 ? ' · ' + p.days_since_visit + '일 경과' : ''),
            amount: p.remaining_treatment_value || 0,
            patient_id: p.patient_id,
            task_id: '',
            source: 'retention',
            phone: p.patient_phone || ''
          });
        });
      }
    } catch(e) { /* retention not critical */ }

    // 3. Summary-based mission items
    if (td.undecided > 0) {
      items.unshift({
        type: 'mission',
        id: 'mission_undecided',
        done: false,
        urgency: td.undecided >= 3 ? 'high' : 'medium',
        icon: 'fa-hourglass-half',
        color: 'amber',
        title: '미결정 환자 ' + td.undecided + '명 팔로업',
        subtitle: '빠른 연락이 전환율을 높입니다',
        amount: 0,
        patient_id: '',
        task_id: '',
        source: 'mission',
        phone: '',
        link: '/consultations?status=undecided'
      });
    }

    // Sort: 이월(지연) 우선 → critical > high > medium → 지연일 내림차순
    var urgOrder = {critical:0, high:1, medium:2};
    items.sort(function(a,b) {
      var aO = (a.days_overdue||0) >= 1 ? 1 : 0, bO = (b.days_overdue||0) >= 1 ? 1 : 0;
      if (aO !== bO) return bO - aO;
      var u = (urgOrder[a.urgency]||2) - (urgOrder[b.urgency]||2);
      if (u !== 0) return u;
      return (b.days_overdue||0) - (a.days_overdue||0);
    });

    checklistAllItems = items;
    renderChecklist(items);
    wrap.classList.remove('hidden');

  } catch(e) { console.error('Checklist error:', e); }
}

function renderChecklist(items) {
  var listEl = document.getElementById('checklistItems');
  var progEl = document.getElementById('checklistProgress');
  var footerEl = document.getElementById('checklistFooter');
  var ringEl = document.getElementById('checklistProgressRing');

  var doneCount = items.filter(function(i){ return i.done; }).length;
  var total = items.length;
  var pct = total > 0 ? Math.round((doneCount / total) * 100) : 100;

  progEl.textContent = doneCount + '/' + total + ' 완료';

  // Progress ring
  var sz=36, sw=4, r=(sz-sw)/2, circ=2*Math.PI*r;
  var off = circ - (pct/100)*circ;
  var col = pct >= 100 ? '#10b981' : pct >= 50 ? '#6366f1' : '#f59e0b';
  ringEl.innerHTML =
    '<svg width="'+sz+'" height="'+sz+'" class="transform -rotate-90">' +
      '<circle cx="'+sz/2+'" cy="'+sz/2+'" r="'+r+'" fill="none" stroke="#f1f5f9" stroke-width="'+sw+'"/>' +
      '<circle cx="'+sz/2+'" cy="'+sz/2+'" r="'+r+'" fill="none" stroke="'+col+'" stroke-width="'+sw+'" stroke-linecap="round" stroke-dasharray="'+circ+'" stroke-dashoffset="'+off+'" style="transition:stroke-dashoffset 0.6s ease"/>' +
    '</svg>';

  if (total === 0) {
    listEl.innerHTML =
      '<div class="p-5 text-center">' +
        '<div class="w-12 h-12 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center mb-2"><i class="fas fa-party-horn text-xl text-emerald-500"></i></div>' +
        '<p class="font-bold text-sm text-surface-800 mb-0.5">오늘 할 일 완료!</p>' +
        '<p class="text-xs text-surface-500">새 연락 대상은 갱신 버튼으로 찾아보세요</p>' +
      '</div>';
    footerEl.classList.add('hidden');
    return;
  }

  var showCount = checklistExpanded ? items.length : Math.min(items.length, 5);
  var html = '';

  for (var i = 0; i < showCount; i++) {
    var it = items[i];
    var urgBorder = it.urgency === 'critical' ? 'border-l-rose-500' : it.urgency === 'high' ? 'border-l-amber-400' : 'border-l-surface-200';
    var bgColor = it.color;

    html += '<div class="flex items-center gap-3 p-3 border-l-[3px] ' + urgBorder + ' ' + (it.done ? 'opacity-50' : '') + ' transition-all">';

    // Checkbox
    html += '<button onclick="toggleCheckItem(\'' + it.id + '\')" class="w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ' +
      (it.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-surface-300 hover:border-brand-400') + '">' +
      (it.done ? '<i class="fas fa-check text-[9px]"></i>' : '') + '</button>';

    // Icon
    html += '<div class="w-7 h-7 rounded-lg bg-' + bgColor + '-50 flex items-center justify-center shrink-0">' +
      '<i class="fas ' + it.icon + ' text-' + bgColor + '-600 text-[10px]"></i></div>';

    // Content
    html += '<div class="flex-1 min-w-0">';
    html += '<p class="text-sm font-semibold text-surface-900 ' + (it.done ? 'line-through' : '') + ' truncate">' + it.title +
      ((it.days_overdue||0) >= 1 ? ' <span class="text-[9px] px-1 py-0.5 rounded font-bold bg-orange-100 text-orange-700">⏰ ' + it.days_overdue + '일 지연</span>' : '') + '</p>';
    html += '<p class="text-[10px] text-surface-500 truncate">' + it.subtitle;
    if (it.amount > 0) html += ' · <span class="font-semibold text-emerald-600">' + fmt(it.amount) + '만</span>';
    html += '</p></div>';

    // Actions
    html += '<div class="flex gap-1 shrink-0">';
    if (it.patient_id && it.phone && !it.done) {
      html += '<a href="tel:' + it.phone + '" class="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 hover:bg-brand-100 active:scale-90 transition-all"><i class="fas fa-phone text-[10px]"></i></a>';
    }
    if (it.patient_id && !it.done) {
      if (it.type === 'contact') {
        html += '<button onclick="openHomeContactModal(\'' + it.patient_id + '\', \'' + it.task_id + '\', \'' + it.source + '\')" class="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 active:scale-90 transition-all"><i class="fas fa-clipboard-check text-[10px]"></i></button>';
      } else {
        html += '<a href="/patients/' + it.patient_id + '" class="w-7 h-7 rounded-lg bg-surface-100 flex items-center justify-center text-surface-500 hover:bg-surface-200 active:scale-90 transition-all"><i class="fas fa-arrow-right text-[10px]"></i></a>';
      }
    }
    if (it.link && !it.done) {
      html += '<a href="' + it.link + '" class="w-7 h-7 rounded-lg bg-surface-100 flex items-center justify-center text-surface-500 hover:bg-surface-200 active:scale-90 transition-all"><i class="fas fa-arrow-right text-[10px]"></i></a>';
    }
    html += '</div></div>';
  }

  listEl.innerHTML = html;

  // Footer toggle
  if (items.length > 5) {
    footerEl.classList.remove('hidden');
    document.getElementById('checklistToggleText').textContent = checklistExpanded ? '접기' : '더 보기 (' + (items.length - 5) + '건)';
    document.getElementById('checklistToggleIcon').className = 'fas fa-chevron-' + (checklistExpanded ? 'up' : 'down') + ' text-[9px] ml-0.5';
  } else {
    footerEl.classList.add('hidden');
  }
}

function toggleCheckItem(itemId) {
  for (var i = 0; i < checklistAllItems.length; i++) {
    if (checklistAllItems[i].id === itemId) {
      checklistAllItems[i].done = !checklistAllItems[i].done;
      break;
    }
  }
  renderChecklist(checklistAllItems);
}

function toggleChecklistExpand() {
  checklistExpanded = !checklistExpanded;
  renderChecklist(checklistAllItems);
}

// === LOGOUT ===
document.getElementById('headerLogoutBtn').addEventListener('click', async function() {
  if (!confirm('로그아웃 하시겠습니까?')) return;
  try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (e) {}
  document.cookie.split(';').forEach(function(c) {
    document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
  });
  window.location.href = '/login';
});

loadHomePage();
// showAIInsight is called from within loadHomePage with pre-loaded data

// === LEVEL CARD RENDERER ===
async function renderLevelCard(ws) {
  try {
    if (typeof getLevel !== 'function') { return; }
    var gRes = await fetch('/api/dashboard/growth-sessions?limit=20');
    var gData = await gRes.json();
    var card = document.getElementById('levelProgressCard');
    if (!card) return;

    if (!gData.success || !gData.data.sessions || gData.data.sessions.length === 0) {
      // No data yet — show starter card
      card.classList.remove('hidden');
      card.innerHTML = '<a href="/recording" class="block card-premium p-4 bg-gradient-to-r from-brand-50 to-purple-50 border-2 border-brand-200/50 hover:shadow-md transition-all">' +
        '<div class="flex items-center gap-3">' +
          '<span style="font-size:32px">🌱</span>' +
          '<div class="flex-1">' +
            '<p class="text-sm font-bold text-surface-900">상담 레벨 시스템</p>' +
            '<p class="text-[11px] text-surface-500">첫 상담을 녹음하면 레벨이 시작됩니다!</p>' +
          '</div>' +
          '<i class="fas fa-chevron-right text-surface-300"></i>' +
        '</div></a>';
      return;
    }

    var stats = gData.data.stats;
    var score = stats.latest_score || stats.overall_avg || 0;
    var lv = getLevel(score);
    var exp = getExpProgress(score);
    var next = getNextLevel(score);
    var nudge = levelNudge(score, stats.total_sessions);

    card.classList.remove('hidden');
    card.innerHTML = '<a href="/growth" class="block card-premium p-4 hover:shadow-md transition-all relative overflow-hidden">' +
      '<div class="absolute top-0 right-0 w-24 h-24 opacity-5" style="font-size:80px;line-height:1">' + lv.emoji + '</div>' +
      '<div class="relative">' +
        '<div class="flex items-center gap-3 mb-2.5">' +
          '<div class="w-11 h-11 rounded-2xl bg-gradient-to-br ' + lv.gradient + ' flex items-center justify-center shadow-lg" style="font-size:22px">' + lv.emoji + '</div>' +
          '<div class="flex-1">' +
            '<div class="flex items-center gap-1.5 mb-0.5">' +
              '<span class="text-[10px] font-black text-' + lv.color + '-600 bg-' + lv.color + '-100 px-1.5 py-0.5 rounded">Lv.' + lv.level + '</span>' +
              '<span class="text-xs font-bold text-surface-900">' + lv.title + '</span>' +
              (stats.current_streak >= 2 ? showStreakBadge(stats.current_streak) : '') +
            '</div>' +
            '<div class="flex items-center gap-2">' +
              '<span class="text-lg font-black text-' + lv.color + '-600">' + score + '<span class="text-[10px] text-surface-400 font-medium">점</span></span>' +
              '<span class="text-[10px] text-surface-400">' + stats.total_sessions + '회 상담</span>' +
            '</div>' +
          '</div>' +
          '<i class="fas fa-chevron-right text-surface-300"></i>' +
        '</div>' +
        // EXP bar
        '<div class="mb-2">' +
          '<div class="flex items-center justify-between mb-1">' +
            '<span class="text-[9px] text-surface-500">' + (next ? next.emoji + ' ' + next.title + '까지' : '🏆 MAX') + '</span>' +
            '<span class="text-[9px] font-bold text-' + lv.color + '-600">' + (next ? exp.toNext + '점 남음' : '달성!') + '</span>' +
          '</div>' +
          '<div class="h-2 bg-surface-100 rounded-full overflow-hidden">' +
            '<div class="h-full bg-gradient-to-r ' + lv.gradient + ' rounded-full transition-all duration-1000" style="width:' + exp.percent + '%"></div>' +
          '</div>' +
        '</div>' +
        // Nudge message
        '<p class="text-[11px] text-surface-600 leading-relaxed">' + nudge + '</p>' +
      '</div></a>';
  } catch(e) {
    console.warn('Level card error:', e);
  }
}

// Pull-to-Refresh
initPullToRefresh(function(){ loadHomePage(); });

// AI Daily Insight - 실제 데이터 기반 코칭 팁 생성 (사전 로딩된 데이터 활용)
async function showAIInsight(preloadedSummary) {
  try {
    var staticInsights = [
      '💡 오늘의 팁: 상담 시작 후 첫 2분 안에 환자 이름을 3번 이상 부르면 라포 형성이 40% 향상됩니다.',
      '📊 페이션트 퍼널 데이터에 따르면, SPIN 질문 중 Implication(암시) 질문을 추가하면 결정률이 평균 23% 상승합니다.',
      '🎯 미결정 환자에게 48시간 이내 첫 연락을 하면 전환율이 2.3배 높아집니다.',
      '💰 가격 제시 전 3가지 이상 치료 가치를 먼저 설명하면 가격 저항이 35% 감소합니다.',
      '🤝 "비싸다"는 이의에 "네, 맞습니다" 로 시작하면 환자 신뢰도가 즉시 높아집니다.',
      '📞 리텐션 연락 시 "안부 인사 → 상태 확인 → 정보 제공" 순서가 재방문율 최적입니다.',
      '⏰ 오전 10-11시 상담은 오후보다 결정률이 18% 높습니다. 중요 상담은 오전에 배치하세요.',
      '🎯 양자택일 클로징("A와 B 중 어떤 게 좋으세요?")은 개방형 질문보다 전환율이 67% 높습니다.'
    ];
    var today = new Date().getDay();
    var insight = staticInsights[today % staticInsights.length];
    
    // 사전 로딩된 데이터 사용 → 중복 /api/dashboard/summary 호출 제거
    var sData = preloadedSummary;
    if (!sData) {
      try { var r = await fetch('/api/dashboard/summary'); sData = await r.json(); } catch(e) { sData = null; }
    }
    if (sData && sData.success) {
      var d = sData.data;
      var ws = d.week_stats || {};
      var td = d.today || {};
      var sa = d.stale_alert || {};
      
      var dataInsights = [];
      
      if (ws.conversion_rate && ws.prev_conversion_rate) {
        var crDiff = ws.conversion_rate - ws.prev_conversion_rate;
        if (crDiff > 5) dataInsights.push('🔥 전환율이 지난주 대비 +' + crDiff + '%p 상승! 이 기세를 유지하세요. 현재 사용 중인 클로징 기법을 팀에 공유해보세요.');
        else if (crDiff < -5) dataInsights.push('⚠️ 전환율이 지난주 대비 ' + crDiff + '%p 하락했어요. 상담 시 가치 전달 단계에서 구체적 수치(성공률, 만족도)를 더 활용해보세요.');
      }
      
      if (sa.count >= 3) dataInsights.push('🚨 3일 이상 방치된 미결정 환자 ' + sa.count + '명! 오늘 안에 최소 3명은 연락하세요. 첫 멘트: "얼마 전 상담하셨는데, 궁금한 점은 없으셨을까 싶어 연락드렸습니다."');
      
      if (ws.avg_score && ws.avg_score < 70) dataInsights.push('📈 금주 평균 상담점수 ' + ws.avg_score + '점. 라포 형성과 SPIN 질문을 강화하면 80점대 진입이 가능합니다!');
      else if (ws.avg_score >= 85) dataInsights.push('🏆 금주 평균 상담점수 ' + ws.avg_score + '점! 탁월합니다. 이 수준을 유지하면서 크로스셀 기회를 포착해보세요.');
      
      if (td.undecided >= 3) dataInsights.push('📋 오늘 미결정 ' + td.undecided + '건. 각 환자의 "결정을 망설이는 진짜 이유"를 파악하면 전환율이 올라갑니다. AI 레포트의 심리분석을 참고하세요.');

      if (ws.contact_rate !== undefined && ws.contact_rate < 60) dataInsights.push('📞 연락수행률이 ' + ws.contact_rate + '%입니다. 미연락 환자에게 "안녕하세요, 지난번 상담 때 말씀하신 부분이 걱정되어 연락드렸습니다"로 시작해보세요.');
      
      if (dataInsights.length > 0) {
        insight = dataInsights[Math.floor(Math.random() * dataInsights.length)];
      }
    }
    
    document.getElementById('aiInsightText').textContent = insight;
    document.getElementById('aiInsightCard').classList.remove('hidden');
  } catch(e) {
    var fallback = [
      '💡 오늘의 팁: 상담 시작 후 첫 2분 안에 환자 이름을 3번 이상 부르면 라포 형성이 40% 향상됩니다.',
      '🎯 미결정 환자에게 48시간 이내 첫 연락을 하면 전환율이 2.3배 높아집니다.'
    ];
    document.getElementById('aiInsightText').textContent = fallback[new Date().getDay() % fallback.length];
    document.getElementById('aiInsightCard').classList.remove('hidden');
  }
}
