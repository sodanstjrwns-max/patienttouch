import { FC } from 'hono/jsx'
import { Layout } from '../shared/Layout'

export const HomePage: FC = () => {
  return (
    <Layout activeTab="home">
      {/* ====== HERO HEADER ====== */}
      <header class="relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-dark">
          <div class="absolute inset-0 opacity-40" style="background-image: url(&quot;data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='g' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(99,102,241,0.06)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3C/svg%3E&quot;)" />
          <div class="absolute -top-20 -right-20 w-60 h-60 bg-brand-500/15 rounded-full blur-3xl" />
          <div class="absolute bottom-0 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
        </div>
        
        <div class="relative px-5 pt-14 pb-6 safe-area-top">
          {/* Top row */}
          <div class="flex items-start justify-between mb-5">
            <div id="greetingSection">
              <div class="flex items-center gap-2 mb-1">
                <div class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-soft" />
                <p class="text-brand-300 text-xs font-medium tracking-wide">로딩 중...</p>
              </div>
              <h1 class="text-xl font-black text-white tracking-tight">페이션트 터치</h1>
            </div>
            <div class="flex items-center gap-2">
              <a href="/admin" class="w-9 h-9 glass-dark rounded-xl flex items-center justify-center text-surface-400 hover:text-white transition-colors">
                <i class="fas fa-chart-mixed text-sm"></i>
              </a>
              <a href="/settings" class="w-9 h-9 glass-dark rounded-xl flex items-center justify-center text-surface-400 hover:text-white transition-colors">
                <i class="fas fa-gear text-sm"></i>
              </a>
            </div>
          </div>

          {/* TODAY'S DECISION */}
          <div id="todayRevenueHero" class="mb-5">
            <p class="text-surface-400 text-xs font-semibold mb-1 tracking-wider uppercase">오늘 결정 금액</p>
            <div class="flex items-end gap-2">
              <span id="heroRevenue" class="text-4xl font-black text-white tabular-nums" style="letter-spacing: -0.03em;">0</span>
              <span class="text-lg font-bold text-surface-400 mb-1">만원</span>
            </div>
            <div id="heroSubStats" class="flex items-center gap-3 mt-2">
              <span class="text-xs text-surface-500">로딩 중...</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div class="flex gap-3">
            <a href="/recording" class="flex-1 bg-gradient-brand rounded-2xl p-3.5 flex items-center gap-3 shadow-lg shadow-brand-600/30 hover:shadow-xl transition-all active:scale-[0.97] group">
              <div class="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <i class="fas fa-microphone text-lg text-white"></i>
              </div>
              <div>
                <p class="text-white font-bold text-sm">상담 녹음</p>
                <p class="text-brand-200 text-[11px]">터치 한 번으로 시작</p>
              </div>
            </a>
            <a href="/patients" class="glass-dark rounded-2xl p-3.5 flex flex-col items-center justify-center gap-1 min-w-[72px] hover:bg-white/10 transition-all active:scale-[0.97]">
              <i class="fas fa-user-plus text-lg text-brand-400"></i>
              <span class="text-[10px] font-semibold text-surface-300">환자 등록</span>
            </a>
          </div>
        </div>
      </header>

      {/* IMPORTANT: NO stagger-children class — it causes opacity:0 bug on dynamic content */}
      <div class="px-4 -mt-1 space-y-5">

        {/* ====== WEEK DECISION RING + KPI MINI CARDS ====== */}
        <div class="grid grid-cols-5 gap-3">
          <div id="weekRevenueRing" class="col-span-3 card-premium p-4 flex flex-col items-center justify-center min-h-[180px]">
            <div class="shimmer h-28 w-28 rounded-full"></div>
          </div>
          <div class="col-span-2 flex flex-col gap-2" id="todayMiniStats">
            <div class="card-premium p-3 flex-1"><div class="shimmer h-4 w-12 rounded mb-1"></div><div class="shimmer h-5 w-8 rounded"></div></div>
            <div class="card-premium p-3 flex-1"><div class="shimmer h-4 w-12 rounded mb-1"></div><div class="shimmer h-5 w-8 rounded"></div></div>
            <div class="card-premium p-3 flex-1"><div class="shimmer h-4 w-12 rounded mb-1"></div><div class="shimmer h-5 w-8 rounded"></div></div>
          </div>
        </div>

        {/* ====== KPI SPARKLINE CARDS ====== */}
        <div>
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center">
                <i class="fas fa-chart-line text-xs text-brand-600"></i>
              </div>
              <h2 class="text-base font-bold text-surface-900">이번 주 성과</h2>
            </div>
            <a href="/report" class="text-xs font-semibold text-brand-600 flex items-center gap-1 hover:text-brand-700">
              상세 <i class="fas fa-chevron-right text-[8px]"></i>
            </a>
          </div>
          <div id="kpiSection" class="grid grid-cols-2 gap-2.5">
            <div class="card-premium p-4"><div class="shimmer h-20 rounded-lg w-full"></div></div>
            <div class="card-premium p-4"><div class="shimmer h-20 rounded-lg w-full"></div></div>
          </div>
        </div>

        {/* ====== TODAY CONTACT LIST ====== */}
        <div>
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
                <i class="fas fa-phone-volume text-xs text-rose-600"></i>
              </div>
              <h2 class="text-base font-bold text-surface-900">오늘 연락 리스트</h2>
            </div>
            <div class="flex items-center gap-2">
              <span id="contactCount" class="text-xs font-bold text-white bg-rose-500 px-2 py-0.5 rounded-full min-w-[24px] text-center">0</span>
              <button onclick="generateTasks()" class="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-lg hover:bg-brand-100 transition-all">
                <i class="fas fa-rotate mr-1"></i>갱신
              </button>
            </div>
          </div>
          <div id="contactRevenueBanner" class="hidden mb-2"></div>
          <div id="todayContactsSection" class="space-y-2">
            <div class="card-premium p-4"><div class="shimmer h-16 rounded-lg w-full"></div></div>
          </div>
        </div>

        {/* ====== MVP ====== */}
        <div id="mvpSection" class="hidden"></div>

        {/* ====== RECENT CONSULTATIONS ====== */}
        <div>
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center">
                <i class="fas fa-clock text-xs text-sky-600"></i>
              </div>
              <h2 class="text-base font-bold text-surface-900">오늘 상담</h2>
            </div>
            <a href="/consultations" class="text-xs font-semibold text-brand-600 flex items-center gap-1 hover:text-brand-700">
              전체 <i class="fas fa-chevron-right text-[8px]"></i>
            </a>
          </div>
          <div id="recentConsultations">
            <div class="card-premium p-5">
              <div class="text-center py-4">
                <div class="w-12 h-12 mx-auto bg-surface-100 rounded-xl flex items-center justify-center mb-3">
                  <i class="fas fa-calendar-check text-surface-300 text-lg"></i>
                </div>
                <p class="text-surface-400 text-sm font-medium">로딩 중...</p>
              </div>
            </div>
          </div>
        </div>

        <div class="h-6" />
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          // =========================================
          // COMMAND CENTER v3 — bulletproof edition
          // =========================================

          function fmt(n) {
            if (!n && n !== 0) return '0';
            return Math.round(n / 10000).toLocaleString();
          }

          function animNum(el, rawValue, ms) {
            if (!el) return;
            var target = Math.round((rawValue || 0) / 10000);
            if (target === 0) { el.textContent = '0'; return; }
            var start = 0, startT = null;
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
            // fill
            var grad = ctx.createLinearGradient(0,0,0,ch);
            grad.addColorStop(0, color + '30'); grad.addColorStop(1, color + '05');
            ctx.beginPath(); ctx.moveTo(0, ch);
            vals.forEach(function(v,i){
              var x = i*sx, y = ch - (v/mx)*(ch-4) - 2;
              i===0 ? ctx.lineTo(x,y) : (function(){ var px=(i-1)*sx, py=ch-(vals[i-1]/mx)*(ch-4)-2, cp=(px+x)/2; ctx.bezierCurveTo(cp,py,cp,y,x,y); })();
            });
            ctx.lineTo(cw, ch); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
            // line
            ctx.beginPath();
            vals.forEach(function(v,i){
              var x = i*sx, y = ch - (v/mx)*(ch-4) - 2;
              i===0 ? ctx.moveTo(x,y) : (function(){ var px=(i-1)*sx, py=ch-(vals[i-1]/mx)*(ch-4)-2, cp=(px+x)/2; ctx.bezierCurveTo(cp,py,cp,y,x,y); })();
            });
            ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
            // dot
            if (vals.length > 0) {
              var lx = (vals.length-1)*sx, ly = ch-(vals[vals.length-1]/mx)*(ch-4)-2;
              ctx.beginPath(); ctx.arc(lx,ly,2.5,0,Math.PI*2); ctx.fillStyle=color; ctx.fill();
            }
          }

          function ring(pct, decided, target) {
            var el = document.getElementById('weekRevenueRing');
            if (!el) return;
            var sz=110, sw=8, r=(sz-sw)/2, circ=2*Math.PI*r;
            var p = Math.min(Math.max(pct,0), 100);
            var off = circ - (p/100)*circ;
            var col = p>=100?'#10b981':p>=70?'#6366f1':p>=40?'#f59e0b':'#ef4444';
            el.innerHTML =
              '<p class="text-[10px] font-bold text-surface-400 tracking-wider uppercase mb-2">금주 결정 목표</p>' +
              '<div class="relative" style="width:'+sz+'px;height:'+sz+'px">' +
                '<svg width="'+sz+'" height="'+sz+'" class="transform -rotate-90">' +
                  '<circle cx="'+sz/2+'" cy="'+sz/2+'" r="'+r+'" fill="none" stroke="#f1f5f9" stroke-width="'+sw+'"/>' +
                  '<circle id="rc" cx="'+sz/2+'" cy="'+sz/2+'" r="'+r+'" fill="none" stroke="'+col+'" stroke-width="'+sw+'" stroke-linecap="round" stroke-dasharray="'+circ+'" stroke-dashoffset="'+circ+'" style="transition:stroke-dashoffset 1.5s cubic-bezier(.16,1,.3,1)"/>' +
                '</svg>' +
                '<div class="absolute inset-0 flex flex-col items-center justify-center">' +
                  '<span class="text-2xl font-black" style="color:'+col+'">'+p+'<span class="text-sm">%</span></span>' +
                  '<span class="text-[10px] text-surface-500 font-medium">달성</span>' +
                '</div>' +
              '</div>' +
              '<div class="mt-2 text-center">' +
                '<p class="text-xs font-bold text-surface-700">'+fmt(decided)+'<span class="text-surface-400 font-medium"> / '+fmt(target)+'만</span></p>' +
              '</div>';
            setTimeout(function(){ var c=document.getElementById('rc'); if(c) c.setAttribute('stroke-dashoffset', off); }, 100);
          }

          async function loadHomePage() {
            try {
              var authRes = await fetch('/api/auth/me');
              if (!authRes.ok) { window.location.href = '/login'; return; }
              var authData = await authRes.json();
              if (!authData.success) { window.location.href = '/login'; return; }

              var h = new Date().getHours();
              var gr = h<12 ? '좋은 아침이에요' : h<18 ? '좋은 오후예요' : '좋은 저녁이에요';
              var em = h<12 ? '☀️' : h<18 ? '🌤️' : '🌙';
              
              document.getElementById('greetingSection').innerHTML =
                '<div class="flex items-center gap-2 mb-1"><div class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-soft"></div>' +
                '<p class="text-brand-300 text-xs font-medium tracking-wide">'+em+' '+gr+', '+authData.data.name+'님</p></div>' +
                '<h1 class="text-xl font-black text-white tracking-tight">'+authData.data.organization_name+'</h1>';

              var [sRes, cRes] = await Promise.all([
                fetch('/api/dashboard/summary'),
                fetch('/api/dashboard/today-contacts')
              ]);
              var sData = await sRes.json();
              var cData = await cRes.json();
              
              if (!sData.success) { console.error('Summary failed', sData); return; }
              
              var d = sData.data;
              var ws = d.week_stats || {};
              var td = d.today || {};

              // === HERO DECIDED ===
              animNum(document.getElementById('heroRevenue'), td.decided, 1200);
              
              document.getElementById('heroSubStats').innerHTML =
                '<span class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">' +
                  '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>결정 '+(td.paid||0)+'건</span>' +
                '<span class="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">' +
                  '<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>미결정 '+(td.undecided||0)+'건</span>' +
                '<span class="text-xs text-surface-500">총 '+(td.total_consultations||0)+'건</span>';

              // === WEEK RING ===
              var tgt = ws.decided_target || 50000000;
              var pct = tgt > 0 ? Math.round(((ws.decided||0) / tgt) * 100) : 0;
              ring(pct, ws.decided||0, tgt);

              // === MINI STAT CARDS ===
              document.getElementById('todayMiniStats').innerHTML =
                '<div class="card-premium p-3 flex-1">' +
                  '<div class="text-[10px] font-semibold text-surface-400 mb-0.5">전환율</div>' +
                  '<div class="flex items-end gap-1"><span class="text-lg font-extrabold text-brand-600">'+(ws.conversion_rate||0)+'</span><span class="text-[10px] text-surface-400 mb-0.5">%</span></div>' +
                  '<div class="h-1 bg-surface-100 rounded-full mt-1 overflow-hidden"><div class="h-full bg-brand-500 rounded-full" style="width:'+Math.min(100,ws.conversion_rate||0)+'%"></div></div>' +
                '</div>' +
                '<div class="card-premium p-3 flex-1">' +
                  '<div class="text-[10px] font-semibold text-surface-400 mb-0.5">상담점수</div>' +
                  '<div class="flex items-end gap-1"><span class="text-lg font-extrabold text-emerald-600">'+(ws.avg_score||0)+'</span><span class="text-[10px] text-surface-400 mb-0.5">점</span></div>' +
                  '<div class="h-1 bg-surface-100 rounded-full mt-1 overflow-hidden"><div class="h-full bg-emerald-500 rounded-full" style="width:'+Math.min(100,ws.avg_score||0)+'%"></div></div>' +
                '</div>' +
                '<div class="card-premium p-3 flex-1">' +
                  '<div class="text-[10px] font-semibold text-surface-400 mb-0.5">연락수행</div>' +
                  '<div class="flex items-end gap-1"><span class="text-lg font-extrabold text-amber-600">'+(ws.contact_rate||0)+'</span><span class="text-[10px] text-surface-400 mb-0.5">%</span></div>' +
                  '<div class="h-1 bg-surface-100 rounded-full mt-1 overflow-hidden"><div class="h-full bg-amber-500 rounded-full" style="width:'+Math.min(100,ws.contact_rate||0)+'%"></div></div>' +
                '</div>';

              // === KPI CARDS ===
              var sp = d.sparkline || [];
              var decArr = sp.map(function(s){ return s.decided||0; });
              var cntArr = sp.map(function(s){ return s.total||0; });

              var trend = ws.decided_trend||0;
              var tH = trend > 0
                ? '<span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md"><i class="fas fa-arrow-up text-[8px] mr-0.5"></i>+'+trend+'%</span>'
                : trend < 0
                  ? '<span class="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md"><i class="fas fa-arrow-down text-[8px] mr-0.5"></i>'+trend+'%</span>'
                  : '';

              document.getElementById('kpiSection').innerHTML =
                '<div class="card-premium p-4">' +
                  '<div class="flex items-start justify-between mb-2">' +
                    '<div class="flex items-center gap-2"><div class="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600"><i class="fas fa-won-sign text-sm"></i></div><span class="text-[11px] font-semibold text-surface-500">금주 결정</span></div>' +
                    tH +
                  '</div>' +
                  '<div class="text-xl font-extrabold tracking-tight">'+fmt(ws.decided)+'<span class="text-xs font-medium text-surface-400 ml-0.5">만원</span></div>' +
                  '<canvas id="spkR" class="w-full mt-2" style="height:32px"></canvas>' +
                '</div>' +
                '<div class="card-premium p-4">' +
                  '<div class="flex items-center gap-2 mb-2"><div class="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600"><i class="fas fa-stethoscope text-sm"></i></div><span class="text-[11px] font-semibold text-surface-500">금주 상담</span></div>' +
                  '<div class="text-xl font-extrabold tracking-tight">'+(ws.total_consultations||0)+'<span class="text-xs font-medium text-surface-400 ml-0.5">건</span></div>' +
                  '<div class="flex items-center gap-1.5 mt-1.5">' +
                    '<span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700">'+(ws.paid_consultations||0)+' 결정</span>' +
                    '<span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-surface-100 text-surface-600">'+((ws.total_consultations||0)-(ws.paid_consultations||0))+' 미결정</span>' +
                  '</div>' +
                  '<canvas id="spkC" class="w-full mt-2" style="height:32px"></canvas>' +
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
                  '<div class="flex items-center gap-2 mb-3"><div class="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center"><i class="fas fa-trophy text-xs text-amber-600"></i></div><h2 class="text-base font-bold text-surface-900">이번 주 MVP</h2></div>' +
                  '<a href="/consultations/'+mv.id+'" class="card-premium p-4 block relative overflow-hidden">' +
                    '<div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-amber-50 to-transparent rounded-bl-3xl"></div>' +
                    '<div class="flex items-center gap-3">' +
                      '<div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-400/30"><i class="fas fa-crown text-white text-lg"></i></div>' +
                      '<div class="flex-1">' +
                        '<div class="flex items-center gap-2"><span class="font-bold text-sm">'+(mv.patient_name||'')+'</span><span class="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold">'+(mv.treatment_type||'')+'</span></div>' +
                        '<div class="flex items-center gap-2 mt-0.5"><span class="text-lg font-extrabold text-emerald-600">'+fmt(mv.amount)+'<span class="text-xs text-surface-400 font-medium ml-0.5">만원</span></span>'+(mv.consult_score?'<span class="text-[10px] px-1.5 py-0.5 rounded-md bg-brand-50 text-brand-700 font-semibold">상담 '+mv.consult_score+'점</span>':'')+'</div>' +
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
                  return '<a href="/consultations/'+c.id+'" class="card-premium p-3.5 flex items-center gap-3 block">' +
                    '<div class="w-10 h-10 rounded-xl '+s.bg+' flex items-center justify-center shrink-0"><span class="text-base font-bold '+s.tx+'">'+(c.patient_name?c.patient_name.charAt(0):'?')+'</span></div>' +
                    '<div class="flex-1 min-w-0">' +
                      '<div class="flex items-center justify-between"><span class="font-bold text-sm truncate">'+(c.patient_name||'미지정')+'</span>' +
                      '<span class="inline-flex items-center gap-1 font-semibold rounded-lg ring-1 ring-inset px-1.5 py-0.5 text-[10px] '+s.bg+' '+s.tx+' '+s.rn+'"><span class="w-1.5 h-1.5 rounded-full '+s.dt+'"></span>'+s.lb+'</span></div>' +
                      '<div class="flex items-center gap-2 mt-0.5">'+(c.treatment_type?'<span class="text-xs text-surface-500">'+c.treatment_type+'</span>':'')+(c.amount?'<span class="text-xs font-semibold text-surface-600">'+fmt(c.amount)+'만원</span>':'')+(c.feedback&&c.feedback.total_score?'<span class="text-xs font-semibold text-brand-600">'+c.feedback.total_score+'점</span>':'')+'</div>' +
                    '</div><i class="fas fa-chevron-right text-surface-300 text-xs"></i></a>';
                }).join('') + '</div>';
              } else {
                document.getElementById('recentConsultations').innerHTML =
                  '<div class="card-premium p-5"><div class="text-center py-4">' +
                  '<div class="w-12 h-12 mx-auto bg-surface-100 rounded-xl flex items-center justify-center mb-3"><i class="fas fa-calendar-check text-surface-300 text-lg"></i></div>' +
                  '<p class="text-surface-400 text-sm font-medium">오늘 상담 내역이 없습니다</p></div></div>';
              }

              // === TODAY CONTACTS ===
              renderContacts(cData);

            } catch (err) {
              console.error('Dashboard error:', err);
              // 에러 시에도 기본 UI 표시
              document.getElementById('heroSubStats').innerHTML = '<span class="text-xs text-rose-400">데이터를 불러올 수 없습니다</span>';
            }
          }

          function renderContacts(data) {
            var box = document.getElementById('todayContactsSection');
            var banner = document.getElementById('contactRevenueBanner');
            if (!data || !data.success || !data.data || !data.data.contacts || data.data.contacts.length === 0) {
              if (banner) banner.classList.add('hidden');
              box.innerHTML =
                '<div class="card-premium p-6 text-center">' +
                  '<div class="w-14 h-14 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center mb-3"><i class="fas fa-circle-check text-2xl text-emerald-500"></i></div>' +
                  '<p class="font-bold text-surface-800 mb-0.5">오늘 연락 완료!</p>' +
                  '<p class="text-sm text-surface-500 mb-4">연락할 환자가 없어요</p>' +
                  '<button onclick="generateTasks()" class="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 bg-brand-50 px-4 py-2 rounded-xl"><i class="fas fa-wand-magic-sparkles"></i>연락 대상 찾기</button>' +
                '</div>';
              return;
            }

            var cs = data.data.contacts;
            document.getElementById('contactCount').textContent = cs.length;

            // Potential revenue banner
            var pot = 0;
            cs.forEach(function(c){ if(c.amount) pot+=c.amount; if(c.remaining_value) pot+=c.remaining_value; });
            if (pot > 0 && banner) {
              banner.classList.remove('hidden');
              banner.innerHTML =
                '<div class="bg-gradient-to-r from-brand-600 to-purple-600 rounded-xl p-3 flex items-center justify-between">' +
                  '<div class="flex items-center gap-2"><div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"><i class="fas fa-coins text-white text-sm"></i></div>' +
                  '<div><p class="text-white/70 text-[10px] font-medium">연락 시 예상 결정 금액</p><p class="text-white text-lg font-extrabold">'+fmt(pot)+'<span class="text-sm font-medium text-white/60 ml-0.5">만원</span></p></div></div>' +
                  '<div class="text-white/50 text-[10px] font-medium">'+cs.length+'명</div></div>';
            }

            var uCfg = {
              critical:{bd:'border-l-rose-500',bg:'bg-rose-50',tx:'text-rose-700',ic:'fa-fire',lb:'긴급',pu:true},
              high:{bd:'border-l-amber-500',bg:'bg-amber-50',tx:'text-amber-700',ic:'fa-bolt',lb:'높음',pu:false},
              medium:{bd:'border-l-sky-400',bg:'bg-sky-50',tx:'text-sky-700',ic:'fa-heart',lb:'보통',pu:false}
            };
            var avCol = ['bg-brand-100 text-brand-700','bg-emerald-100 text-emerald-700','bg-amber-100 text-amber-700','bg-rose-100 text-rose-700','bg-sky-100 text-sky-700','bg-purple-100 text-purple-700'];

            var html = '';
            // urgency summary
            var cr=data.data.critical_count||0, hi=data.data.high_count||0, rest=cs.length-cr-hi;
            html += '<div class="flex gap-2 mb-1">';
            if(cr>0) html += '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold ring-1 ring-inset ring-rose-200"><i class="fas fa-fire text-[10px]"></i>긴급 '+cr+'</span>';
            if(hi>0) html += '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold ring-1 ring-inset ring-amber-200"><i class="fas fa-bolt text-[10px]"></i>높음 '+hi+'</span>';
            if(rest>0) html += '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-50 text-sky-700 text-xs font-bold ring-1 ring-inset ring-sky-200"><i class="fas fa-heart text-[10px]"></i>보통 '+rest+'</span>';
            html += '</div>';

            cs.forEach(function(c){
              var u = uCfg[c.urgency] || uCfg.medium;
              var ci = c.patient_name.charCodeAt(0) % avCol.length;
              html += '<div class="card-premium p-3.5 border-l-4 '+u.bd+'">';
              html += '<div class="flex items-start gap-3">';
              html += '<a href="/patients/'+c.patient_id+'" class="w-9 h-9 rounded-xl '+avCol[ci]+' flex items-center justify-center font-bold text-sm shrink-0">'+c.patient_name.charAt(0)+'</a>';
              html += '<div class="flex-1 min-w-0">';
              html += '<div class="flex items-center gap-1.5 flex-wrap">';
              html += '<a href="/patients/'+c.patient_id+'" class="font-bold text-sm text-surface-900 hover:text-brand-600">'+c.patient_name+'</a>';
              html += '<span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold '+u.bg+' '+u.tx+'">';
              if(u.pu) html += '<span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>';
              html += '<i class="fas '+u.ic+' text-[8px]"></i>'+u.lb+'</span></div>';
              html += '<p class="text-[11px] text-surface-600 mt-0.5">'+(c.reason||'')+'</p>';
              html += '<div class="flex flex-wrap gap-1 mt-1">';
              if(c.treatment_type) html += '<span class="text-[10px] px-1.5 py-0.5 rounded-md bg-brand-50 text-brand-600 font-medium">'+c.treatment_type+'</span>';
              if(c.amount) html += '<span class="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 font-medium">'+fmt(c.amount)+'만</span>';
              if(c.decision_score) html += '<span class="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-600 font-medium">결정도 '+c.decision_score+'</span>';
              if(c.risk_score) html += '<span class="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600 font-medium">위험 '+c.risk_score+'</span>';
              html += '</div>';
              if(c.points && c.points.length > 0) html += '<p class="text-[11px] text-surface-500 mt-1 line-clamp-1"><i class="fas fa-lightbulb text-amber-400 mr-1"></i>'+c.points[0]+'</p>';
              else if(c.recommended_script) html += '<p class="text-[11px] text-surface-500 mt-1 line-clamp-1"><i class="fas fa-sparkles text-brand-400 mr-1"></i>'+c.recommended_script+'</p>';
              html += '</div>';
              if(c.patient_phone) html += '<a href="tel:'+c.patient_phone+'" class="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 hover:bg-brand-100 active:scale-90 transition-all shrink-0"><i class="fas fa-phone text-sm"></i></a>';
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
                alert(data.data.generated+'명의 연락 대상을 찾았습니다!');
                window.location.reload();
              } else {
                alert('새로 추가할 연락 대상이 없습니다.');
                if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-rotate mr-1"></i>갱신';}
              }
            } catch(e) { alert('오류가 발생했습니다.'); }
          }

          loadHomePage();
        `
      }} />
    </Layout>
  )
}
