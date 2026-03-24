import { FC } from 'hono/jsx'
import { Layout } from '../shared/Layout'

export const HomePage: FC = () => {
  return (
    <Layout activeTab="home">
      {/* ====== CLEAN HEADER ====== */}
      <header class="px-5 pt-14 pb-4 safe-area-top">
        <div class="flex items-center justify-between mb-6">
          <div id="greetingSection">
            <p class="text-surface-500 text-xs font-medium tracking-wide mb-0.5">로딩 중...</p>
            <h1 class="text-lg font-extrabold text-surface-900 tracking-tight">페이션트 터치</h1>
          </div>
          <div class="flex items-center gap-1.5">
            <a href="/admin" class="w-8 h-8 rounded-xl bg-surface-100 flex items-center justify-center text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-all">
              <i class="fas fa-chart-mixed text-xs"></i>
            </a>
            <a href="/settings" class="w-8 h-8 rounded-xl bg-surface-100 flex items-center justify-center text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-all">
              <i class="fas fa-gear text-xs"></i>
            </a>
            <button id="headerLogoutBtn" class="w-8 h-8 rounded-xl bg-surface-100 flex items-center justify-center text-surface-400 hover:text-rose-500 hover:bg-rose-50 transition-all" title="로그아웃">
              <i class="fas fa-arrow-right-from-bracket text-xs"></i>
            </button>
          </div>
        </div>

        {/* TODAY SUMMARY CARD */}
        <div class="bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-700 rounded-2xl p-5 shadow-lg shadow-brand-600/20 relative overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-10 translate-x-10"></div>
          <div class="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-8 -translate-x-8"></div>
          <div class="relative">
            <p class="text-white/60 text-[11px] font-semibold tracking-wider uppercase mb-1">오늘 결정 금액</p>
            <div class="flex items-end gap-1.5 mb-3">
              <span id="heroRevenue" class="text-3xl font-black text-white tabular-nums" style="letter-spacing: -0.02em;">0</span>
              <span class="text-sm font-bold text-white/50 mb-0.5">만원</span>
            </div>
            <div id="heroSubStats" class="flex items-center gap-3">
              <span class="text-xs text-white/40">로딩 중...</span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div class="px-4 pt-4 space-y-5">

        {/* ====== QUICK ACTIONS ====== */}
        <div class="grid grid-cols-2 gap-2.5">
          <a href="/recording" class="card-premium p-3.5 flex items-center gap-3 hover:shadow-md transition-all active:scale-[0.97] group">
            <div class="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center group-hover:bg-brand-100 transition-colors shrink-0">
              <i class="fas fa-microphone text-brand-600 text-base"></i>
            </div>
            <div class="min-w-0">
              <p class="font-bold text-sm text-surface-900">상담 녹음</p>
              <p class="text-[11px] text-surface-500">터치 한 번으로 시작</p>
            </div>
          </a>
          <a href="/patients" class="card-premium p-3.5 flex items-center gap-3 hover:shadow-md transition-all active:scale-[0.97] group">
            <div class="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors shrink-0">
              <i class="fas fa-user-plus text-emerald-600 text-base"></i>
            </div>
            <div class="min-w-0">
              <p class="font-bold text-sm text-surface-900">환자 등록</p>
              <p class="text-[11px] text-surface-500">새 환자 추가</p>
            </div>
          </a>
        </div>

        {/* ====== KPI STATS ROW ====== */}
        <div>
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-bold text-surface-900">금주 현황</h2>
            <a href="/report" class="text-xs font-semibold text-brand-600 flex items-center gap-1 hover:text-brand-700">
              상세 <i class="fas fa-chevron-right text-[8px]"></i>
            </a>
          </div>
          <div class="grid grid-cols-4 gap-2" id="kpiStatsRow">
            <div class="card-premium p-3 text-center"><div class="shimmer h-4 w-8 mx-auto rounded mb-1"></div><div class="shimmer h-3 w-10 mx-auto rounded"></div></div>
            <div class="card-premium p-3 text-center"><div class="shimmer h-4 w-8 mx-auto rounded mb-1"></div><div class="shimmer h-3 w-10 mx-auto rounded"></div></div>
            <div class="card-premium p-3 text-center"><div class="shimmer h-4 w-8 mx-auto rounded mb-1"></div><div class="shimmer h-3 w-10 mx-auto rounded"></div></div>
            <div class="card-premium p-3 text-center"><div class="shimmer h-4 w-8 mx-auto rounded mb-1"></div><div class="shimmer h-3 w-10 mx-auto rounded"></div></div>
          </div>
        </div>

        {/* ====== WEEK PROGRESS + SPARKLINES ====== */}
        <div class="grid grid-cols-2 gap-2.5">
          <div id="weekRevenueRing" class="card-premium p-4 flex flex-col items-center justify-center min-h-[160px]">
            <div class="shimmer h-24 w-24 rounded-full"></div>
          </div>
          <div id="kpiSection" class="space-y-2.5">
            <div class="card-premium p-3"><div class="shimmer h-16 rounded-lg w-full"></div></div>
            <div class="card-premium p-3"><div class="shimmer h-16 rounded-lg w-full"></div></div>
          </div>
        </div>

        {/* ====== TODAY CONTACT LIST ====== */}
        <div>
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center">
                <i class="fas fa-phone-volume text-[10px] text-rose-600"></i>
              </div>
              <h2 class="text-sm font-bold text-surface-900">오늘 연락</h2>
              <span id="contactCount" class="text-[10px] font-bold text-white bg-rose-500 px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-none">0</span>
            </div>
            <button onclick="generateTasks()" class="text-[11px] font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg hover:bg-brand-100 transition-all">
              <i class="fas fa-rotate mr-1 text-[10px]"></i>갱신
            </button>
          </div>
          <div id="contactRevenueBanner" class="hidden mb-2"></div>
          <div id="todayContactsSection" class="space-y-2">
            <div class="card-premium p-4"><div class="shimmer h-14 rounded-lg w-full"></div></div>
          </div>
        </div>

        {/* ====== MVP ====== */}
        <div id="mvpSection" class="hidden"></div>

        {/* ====== RECENT CONSULTATIONS ====== */}
        <div>
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-lg bg-sky-50 flex items-center justify-center">
                <i class="fas fa-clock text-[10px] text-sky-600"></i>
              </div>
              <h2 class="text-sm font-bold text-surface-900">오늘 상담</h2>
            </div>
            <a href="/consultations" class="text-xs font-semibold text-brand-600 flex items-center gap-1 hover:text-brand-700">
              전체 <i class="fas fa-chevron-right text-[8px]"></i>
            </a>
          </div>
          <div id="recentConsultations">
            <div class="card-premium p-5">
              <div class="text-center py-3">
                <div class="w-10 h-10 mx-auto bg-surface-100 rounded-xl flex items-center justify-center mb-2">
                  <i class="fas fa-calendar-check text-surface-300 text-sm"></i>
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
          // COMMAND CENTER v4 — clean design edition
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
                '<p class="text-surface-500 text-xs font-medium tracking-wide mb-0.5">'+em+' '+gr+', '+authData.data.name+'님</p>' +
                '<h1 class="text-lg font-extrabold text-surface-900 tracking-tight">'+authData.data.organization_name+'</h1>';

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
                '<span class="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80">' +
                  '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>결정 '+(td.paid||0)+'건</span>' +
                '<span class="inline-flex items-center gap-1.5 text-xs font-semibold text-white/60">' +
                  '<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>미결정 '+(td.undecided||0)+'건</span>' +
                '<span class="text-xs text-white/40">총 '+(td.total_consultations||0)+'건</span>';

              // === KPI STATS ROW ===
              var cr = ws.conversion_rate||0;
              var sc = ws.avg_score||0;
              var ct = ws.contact_rate||0;
              var tc = ws.total_consultations||0;
              document.getElementById('kpiStatsRow').innerHTML =
                '<div class="card-premium p-3 text-center">' +
                  '<div class="text-lg font-extrabold text-brand-600 leading-none mb-1">'+cr+'<span class="text-[10px] font-bold">%</span></div>' +
                  '<div class="text-[10px] font-medium text-surface-500">전환율</div>' +
                '</div>' +
                '<div class="card-premium p-3 text-center">' +
                  '<div class="text-lg font-extrabold text-emerald-600 leading-none mb-1">'+sc+'<span class="text-[10px] font-bold">점</span></div>' +
                  '<div class="text-[10px] font-medium text-surface-500">상담점수</div>' +
                '</div>' +
                '<div class="card-premium p-3 text-center">' +
                  '<div class="text-lg font-extrabold text-amber-600 leading-none mb-1">'+ct+'<span class="text-[10px] font-bold">%</span></div>' +
                  '<div class="text-[10px] font-medium text-surface-500">연락수행</div>' +
                '</div>' +
                '<div class="card-premium p-3 text-center">' +
                  '<div class="text-lg font-extrabold text-sky-600 leading-none mb-1">'+tc+'<span class="text-[10px] font-bold">건</span></div>' +
                  '<div class="text-[10px] font-medium text-surface-500">상담건수</div>' +
                '</div>';

              // === WEEK RING ===
              var tgt = ws.decided_target || 50000000;
              var pct = tgt > 0 ? Math.round(((ws.decided||0) / tgt) * 100) : 0;
              ring(pct, ws.decided||0, tgt);

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
                        '<div class="flex items-center gap-2"><span class="font-bold text-sm">'+(mv.patient_name||'')+'</span><span class="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold">'+(mv.treatment_type||'')+'</span></div>' +
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
                    '<div class="w-9 h-9 rounded-xl '+s.bg+' flex items-center justify-center shrink-0"><span class="text-sm font-bold '+s.tx+'">'+(c.patient_name?c.patient_name.charAt(0):'?')+'</span></div>' +
                    '<div class="flex-1 min-w-0">' +
                      '<div class="flex items-center justify-between"><span class="font-bold text-sm truncate">'+(c.patient_name||'미지정')+'</span>' +
                      '<span class="inline-flex items-center gap-1 font-semibold rounded-lg ring-1 ring-inset px-1.5 py-0.5 text-[10px] '+s.bg+' '+s.tx+' '+s.rn+'"><span class="w-1.5 h-1.5 rounded-full '+s.dt+'"></span>'+s.lb+'</span></div>' +
                      '<div class="flex items-center gap-2 mt-0.5">'+(c.treatment_type?'<span class="text-xs text-surface-500">'+c.treatment_type+'</span>':'')+(c.amount?'<span class="text-xs font-semibold text-surface-600">'+fmt(c.amount)+'만원</span>':'')+(c.feedback&&c.feedback.total_score?'<span class="text-xs font-semibold text-brand-600">'+c.feedback.total_score+'점</span>':'')+'</div>' +
                    '</div><i class="fas fa-chevron-right text-surface-300 text-xs"></i></a>';
                }).join('') + '</div>';
              } else {
                document.getElementById('recentConsultations').innerHTML =
                  '<div class="card-premium p-5"><div class="text-center py-3">' +
                  '<div class="w-10 h-10 mx-auto bg-surface-100 rounded-xl flex items-center justify-center mb-2"><i class="fas fa-calendar-check text-surface-300 text-sm"></i></div>' +
                  '<p class="text-surface-400 text-sm font-medium">오늘 상담 내역이 없습니다</p></div></div>';
              }

              // === TODAY CONTACTS ===
              renderContacts(cData);

            } catch (err) {
              console.error('Dashboard error:', err);
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
              var ci = c.patient_name.charCodeAt(0) % avCol.length;
              html += '<div class="card-premium p-3 border-l-[3px] '+u.bd+'">';
              html += '<div class="flex items-start gap-2.5">';
              html += '<a href="/patients/'+c.patient_id+'" class="w-8 h-8 rounded-lg '+avCol[ci]+' flex items-center justify-center font-bold text-xs shrink-0">'+c.patient_name.charAt(0)+'</a>';
              html += '<div class="flex-1 min-w-0">';
              html += '<div class="flex items-center gap-1.5 flex-wrap">';
              html += '<a href="/patients/'+c.patient_id+'" class="font-bold text-sm text-surface-900 hover:text-brand-600">'+c.patient_name+'</a>';
              html += '<span class="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold '+u.bg+' '+u.tx+'">';
              if(u.pu) html += '<span class="w-1 h-1 rounded-full bg-rose-500 animate-pulse"></span>';
              html += '<i class="fas '+u.ic+' text-[7px]"></i>'+u.lb+'</span></div>';
              html += '<p class="text-[11px] text-surface-600 mt-0.5 line-clamp-1">'+(c.reason||'')+'</p>';
              html += '<div class="flex flex-wrap gap-1 mt-1">';
              if(c.treatment_type) html += '<span class="text-[9px] px-1 py-0.5 rounded bg-brand-50 text-brand-600 font-medium">'+c.treatment_type+'</span>';
              if(c.amount) html += '<span class="text-[9px] px-1 py-0.5 rounded bg-emerald-50 text-emerald-600 font-medium">'+fmt(c.amount)+'만</span>';
              if(c.decision_score) html += '<span class="text-[9px] px-1 py-0.5 rounded bg-purple-50 text-purple-600 font-medium">결정도 '+c.decision_score+'</span>';
              html += '</div>';
              if(c.points && c.points.length > 0) html += '<p class="text-[10px] text-surface-500 mt-1 line-clamp-1"><i class="fas fa-lightbulb text-amber-400 mr-1 text-[8px]"></i>'+c.points[0]+'</p>';
              else if(c.recommended_script) html += '<p class="text-[10px] text-surface-500 mt-1 line-clamp-1"><i class="fas fa-sparkles text-brand-400 mr-1 text-[8px]"></i>'+c.recommended_script+'</p>';
              html += '</div>';
              if(c.patient_phone) html += '<a href="tel:'+c.patient_phone+'" class="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 hover:bg-brand-100 active:scale-90 transition-all shrink-0"><i class="fas fa-phone text-xs"></i></a>';
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
        `
      }} />
    </Layout>
  )
}
