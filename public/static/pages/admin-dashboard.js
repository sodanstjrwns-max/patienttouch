var currentPeriod = 'weekly';

async function loadDashboard() {
  try {
    var userData = await requireAuth();
    if (userData.data.role !== 'admin') { showToast('관리자만 접근할 수 있습니다.','error'); window.location.href = '/'; return; }
    await Promise.all([loadSummary(), loadKFactor(), loadKFactorByStaff(), loadStaffPerformance(), loadCoachingBreakdown(), loadLowScoreConsultations(), loadProposalAnalytics(), loadAdminCharts(), loadGoalGauges(), loadHourlyDistribution(), loadWeeklyComparison()]);
  } catch (err) { console.error('Failed to load dashboard:', err); }
}

var adminRevenueChartInstance = null;
var teamRadarChartInstance = null;
var coachingTrendChartInstance = null;

async function loadAdminCharts() {
  try {
    // Revenue trend
    var revRes = await fetch('/api/dashboard/revenue-trend?days=14');
    var revData = await revRes.json();
    if (revData.success && revData.data.length > 0) renderAdminRevenueChart(revData.data);

    // Coaching trend
    var ctRes = await fetch('/api/dashboard/coaching-trend');
    var ctData = await ctRes.json();
    if (ctData.success && ctData.data.weeks && ctData.data.weeks.length > 0) renderCoachingTrendChart(ctData.data);

    // Team radar
    var teamRes = await fetch('/api/dashboard/staff-performance?period=' + currentPeriod);
    var teamData = await teamRes.json();
    if (teamData.success && teamData.data.length > 0) renderTeamRadarChart(teamData.data);
  } catch(e) { console.error('Admin charts error:', e); }
}

function renderAdminRevenueChart(data) {
  if (!window.Chart) return;
  var labels = data.map(function(d) { var dt=new Date(d.date); return (dt.getMonth()+1)+'/'+dt.getDate(); });
  var paid = data.map(function(d) { return Math.round((d.paid_amount||0)/10000); });
  var total = data.map(function(d) { return Math.round((d.total_amount||0)/10000); });
  var counts = data.map(function(d) { return d.total_consultations||0; });
  if (adminRevenueChartInstance) adminRevenueChartInstance.destroy();
  var canvas = document.getElementById('adminRevenueChart');
  if (!canvas) return;
  adminRevenueChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: '결정 매출(만)', data: paid, backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 5, order: 2 },
        { label: '상담 매출(만)', data: total, backgroundColor: 'rgba(99,102,241,0.15)', borderRadius: 5, order: 3 },
        { type: 'line', label: '상담 수', data: counts, borderColor: '#f59e0b', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#f59e0b', yAxisID: 'y1', order: 1, tension: 0.3 }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, usePointStyle: true, pointStyleWidth: 8, padding: 10 } } },
      scales: {
        x: { grid: {display:false}, ticks: {font:{size:9}} },
        y: { beginAtZero: true, ticks: { font:{size:9}, callback: function(v){return v+'만';} }, grid: {color:'#f1f5f9'} },
        y1: { beginAtZero: true, position: 'right', ticks: { font:{size:9}, callback: function(v){return v+'건';} }, grid: {display:false} }
      }
    }
  });
}

function renderTeamRadarChart(staff) {
  if (!window.Chart || staff.length === 0) return;
  if (teamRadarChartInstance) teamRadarChartInstance.destroy();
  var canvas = document.getElementById('teamRadarChart');
  if (!canvas) return;
  var colors = ['rgba(99,102,241,0.8)','rgba(16,185,129,0.8)','rgba(245,158,11,0.8)','rgba(236,72,153,0.8)','rgba(14,165,233,0.8)'];
  var bgColors = ['rgba(99,102,241,0.1)','rgba(16,185,129,0.1)','rgba(245,158,11,0.1)','rgba(236,72,153,0.1)','rgba(14,165,233,0.1)'];
  var datasets = staff.slice(0,5).map(function(s, i) {
    return {
      label: esc(s.name),
      data: [s.total_consultations||0, s.conversion_rate||0, s.avg_coaching_score||0, Math.round((s.revenue||0)/100000), (s.paid_consultations||0)*10],
      borderColor: colors[i],
      backgroundColor: bgColors[i],
      borderWidth: 2,
      pointRadius: 3,
      pointBackgroundColor: colors[i]
    };
  });
  teamRadarChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'radar',
    data: { labels: ['상담 수', '전환율(%)', '코칭 점수', '매출(십만)', '결정 건수(x10)'], datasets: datasets },
    options: {
      responsive: true,
      scales: { r: { beginAtZero: true, ticks: { display: false }, grid: { color:'rgba(148,163,184,0.15)' }, pointLabels: { font: { size: 10, weight: '600' } } } },
      plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, usePointStyle: true, pointStyleWidth: 8, padding: 10 } } }
    }
  });
}

function renderCoachingTrendChart(data) {
  if (!window.Chart || !data.weeks || data.weeks.length === 0) return;
  if (coachingTrendChartInstance) coachingTrendChartInstance.destroy();
  var canvas = document.getElementById('coachingTrendChart');
  if (!canvas) return;
  var labels = data.weeks.map(function(w) { return w.week_label || w.week; });
  var avgScores = data.weeks.map(function(w) { return w.avg_score || 0; });
  var areas = ['rapport','spin','objection','pricing','closing','structure'];
  var areaNames = ['라포','SPIN','반론','가격','클로징','구조'];
  var areaColors = ['#f43f5e','#8b5cf6','#0ea5e9','#10b981','#f59e0b','#f97316'];
  var datasets = [{
    label: '종합 점수',
    data: avgScores,
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99,102,241,0.08)',
    fill: true, tension: 0.3, borderWidth: 3,
    pointRadius: 4, pointBackgroundColor: '#6366f1'
  }];
  areas.forEach(function(area, i) {
    var areaData = data.weeks.map(function(w) { return w[area] || 0; });
    if (areaData.some(function(v){ return v > 0; })) {
      datasets.push({
        label: areaNames[i],
        data: areaData,
        borderColor: areaColors[i],
        backgroundColor: 'transparent',
        tension: 0.3, borderWidth: 1.5, borderDash: [3,3],
        pointRadius: 2, pointBackgroundColor: areaColors[i]
      });
    }
  });
  coachingTrendChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: { labels: labels, datasets: datasets },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'bottom', labels: { font: { size: 9 }, usePointStyle: true, pointStyleWidth: 6, padding: 8 } } },
      scales: {
        x: { grid: {display:false}, ticks: {font:{size:9}} },
        y: { beginAtZero: true, ticks: { font:{size:9} }, grid: {color:'#f1f5f9'} }
      }
    }
  });
}

async function loadSummary() {
  try {
    var res = await fetch('/api/dashboard/admin-summary?period=' + currentPeriod);
    var data = await res.json();
    if (data.success) {
      var s = data.data;
      document.getElementById('totalConsultations').textContent = s.total_consultations || 0;
      document.getElementById('conversionRate').textContent = (s.conversion_rate || 0).toFixed(0) + '%';
      document.getElementById('avgCoachingScore').textContent = (s.avg_coaching_score || 0).toFixed(0) + '점';
      document.getElementById('proposalViewRate').textContent = (s.proposal_view_rate || 0).toFixed(0) + '%';
      document.getElementById('consultationTrend').textContent = formatTrend(s.consultation_trend);
      document.getElementById('conversionTrend').textContent = formatTrend(s.conversion_trend);
      document.getElementById('coachingTrend').textContent = formatTrend(s.coaching_trend);
      document.getElementById('proposalTrend').textContent = formatTrend(s.proposal_trend);
    }
  } catch(e) {}
}

function formatTrend(value) {
  if (!value) return '-';
  var sign = value > 0 ? '+' : '';
  return sign + value.toFixed(1) + '%';
}

// === K-Factor by Staff (v7.6 — 상담사별 바이럴 기여도 분해) ===
async function loadKFactorByStaff() {
  try {
    var res = await fetch('/api/patients/network/by-staff');
    var data = await res.json();
    var container = document.getElementById('kFactorByStaff');
    if (!container) return;

    if (!data.success || !data.data || !data.data.staff || data.data.staff.length === 0) {
      container.innerHTML = '<div class="p-8 text-center"><div class="w-14 h-14 mx-auto bg-purple-50 rounded-2xl flex items-center justify-center mb-3"><i class="fas fa-user-group text-purple-300 text-xl"></i></div><p class="text-xs text-surface-500">아직 상담사별 데이터가 부족합니다</p></div>';
      return;
    }

    var orgAvgEl = document.getElementById('kFactorByStaffOrgAvg');
    if (orgAvgEl) orgAvgEl.textContent = '전사 평균 K=' + (data.data.org_avg_k_factor || 0).toFixed(2);

    var staff = data.data.staff;
    var orgAvg = data.data.org_avg_k_factor || 0;

    // 상위 K값 기준 막대 정규화
    var maxK = Math.max.apply(null, staff.map(function(s){ return Math.max(s.k_factor, s.viral_k_factor); })) || 1;

    var html = '';
    staff.forEach(function(s, idx) {
      // 등급 색상
      var k = s.k_factor || 0;
      var gradeColor, gradeLabel, gradeIcon;
      if (k >= 1.0) { gradeColor = 'emerald'; gradeLabel = '자생 성장'; gradeIcon = 'fa-rocket'; }
      else if (k >= 0.5) { gradeColor = 'sky'; gradeLabel = '성장 가속'; gradeIcon = 'fa-chart-line'; }
      else if (k >= 0.2) { gradeColor = 'amber'; gradeLabel = '기반 형성'; gradeIcon = 'fa-seedling'; }
      else { gradeColor = 'slate'; gradeLabel = '초기 진단'; gradeIcon = 'fa-magnifying-glass'; }

      var diffFromAvg = k - orgAvg;
      var diffSign = diffFromAvg > 0 ? '+' : '';
      var diffColor = diffFromAvg > 0.05 ? 'text-emerald-600' : (diffFromAvg < -0.05 ? 'text-rose-500' : 'text-surface-400');

      // 막대 정규화 (전사 평균 대비 K값)
      var kPct = Math.min(100, (k / maxK) * 100);
      var vPct = Math.min(100, ((s.viral_k_factor || 0) / maxK) * 100);

      // 아바타 색상
      var avatarColors = ['bg-brand-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-sky-500', 'bg-purple-500'];
      var avatarBg = avatarColors[(s.name || '?').charCodeAt(0) % avatarColors.length];
      var initial = (s.name || '?').charAt(0);
      var rankBadge = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : ''));

      html += '<div class="p-4 hover:bg-surface-50/50 transition-all">';
      // Header
      html += '<div class="flex items-center justify-between mb-3">';
      html +=   '<div class="flex items-center gap-2.5">';
      html +=     '<div class="w-9 h-9 rounded-xl ' + avatarBg + ' text-white font-black text-sm flex items-center justify-center shadow-sm">' + esc(initial) + '</div>';
      html +=     '<div>';
      html +=       '<p class="text-sm font-bold text-surface-900">' + esc(s.name) + (rankBadge ? ' <span class="ml-0.5">' + rankBadge + '</span>' : '') + '</p>';
      html +=       '<p class="text-[10px] text-surface-400">' + (s.role === 'admin' ? '원장' : '상담사') + ' · 담당 환자 <b class="text-surface-600">' + s.total_patients + '</b>명</p>';
      html +=     '</div>';
      html +=   '</div>';
      html +=   '<div class="text-right">';
      html +=     '<p class="text-[10px] font-bold text-' + gradeColor + '-700 bg-' + gradeColor + '-50 px-2 py-0.5 rounded-md inline-block"><i class="fas ' + gradeIcon + ' text-[9px] mr-1"></i>' + gradeLabel + '</p>';
      html +=     '<p class="text-[10px] ' + diffColor + ' font-semibold mt-1">평균 대비 ' + diffSign + diffFromAvg.toFixed(2) + '</p>';
      html +=   '</div>';
      html += '</div>';

      // K-factor 막대
      html += '<div class="space-y-2">';
      html +=   '<div>';
      html +=     '<div class="flex justify-between items-center text-[10px] mb-1">';
      html +=       '<span class="text-surface-500 font-semibold">K-factor (직접 소개)</span>';
      html +=       '<span class="font-black text-' + gradeColor + '-700 tabular-nums">' + k.toFixed(2) + '</span>';
      html +=     '</div>';
      html +=     '<div class="h-1.5 bg-surface-100 rounded-full overflow-hidden"><div class="h-full bg-gradient-to-r from-' + gradeColor + '-400 to-' + gradeColor + '-600 rounded-full transition-all duration-700" style="width:' + kPct + '%"></div></div>';
      html +=   '</div>';
      html +=   '<div>';
      html +=     '<div class="flex justify-between items-center text-[10px] mb-1">';
      html +=       '<span class="text-surface-500 font-semibold">바이럴 K (다운스트림 누적)</span>';
      html +=       '<span class="font-bold text-purple-600 tabular-nums">' + (s.viral_k_factor || 0).toFixed(2) + '</span>';
      html +=     '</div>';
      html +=     '<div class="h-1.5 bg-surface-100 rounded-full overflow-hidden"><div class="h-full bg-gradient-to-r from-purple-400 to-fuchsia-500 rounded-full transition-all duration-700" style="width:' + vPct + '%"></div></div>';
      html +=   '</div>';
      html += '</div>';

      // Footer mini stats
      html += '<div class="flex items-center gap-3 mt-2.5 text-[10px] text-surface-500">';
      html +=   '<span><i class="fas fa-share-nodes text-purple-400 mr-1"></i>직접 <b class="text-surface-700">' + s.total_referrals + '</b></span>';
      html +=   '<span><i class="fas fa-sitemap text-fuchsia-400 mr-1"></i>다운스트림 <b class="text-surface-700">' + s.total_downstream + '</b></span>';
      if (s.downstream_revenue > 0) {
        html +=   '<span><i class="fas fa-coins text-amber-400 mr-1"></i><b class="text-surface-700">' + Math.round(s.downstream_revenue / 10000).toLocaleString() + '</b>만</span>';
      }
      html += '</div>';

      // Top influencer
      if (s.top_influencer) {
        html += '<div class="mt-2.5 px-2.5 py-1.5 bg-amber-50 border border-amber-100 rounded-lg flex items-center gap-2"><i class="fas fa-crown text-amber-500 text-[10px]"></i><span class="text-[10px] text-amber-800">최고 인플루언서: <b>' + esc(s.top_influencer.name) + '</b> (' + s.top_influencer.downstream + '명 데려옴)</span></div>';
      }

      html += '</div>';
    });

    container.innerHTML = html;
  } catch (e) { console.warn('K-factor by staff load failed:', e); }
}

// === K-Factor Widget (v7.5 — Patient Funnel 핵심 지표) ===
async function loadKFactor() {
  try {
    var res = await fetch('/api/patients/network/graph');
    var data = await res.json();
    if (!data.success || !data.data || !data.data.stats) return;
    var s = data.data.stats;
    var k = s.k_factor || 0;

    var kEl = document.getElementById('kFactorValue');
    if (kEl) kEl.textContent = k.toFixed(2);

    var setText = function(id, val) { var el = document.getElementById(id); if (el) el.textContent = (val || 0).toLocaleString(); };
    setText('kFactorTotalPatients', s.total_patients);
    setText('kFactorTotalReferrals', s.total_referrals);
    setText('kFactorMaxDepth', s.max_depth);
    setText('kFactorReferredPatients', s.referred_patients);

    // 등급 배지 + 힌트 문구
    var badgeEl = document.getElementById('kFactorBadge');
    var hintEl = document.getElementById('kFactorHint');
    var badge, hint;
    if (k >= 1.0) {
      badge = '🚀 자생 성장 구간';
      hint = 'K≥1.0 — 환자가 환자를 데려오는 바이럴 구간입니다. 광고비 의존도를 낮출 수 있습니다.';
    } else if (k >= 0.5) {
      badge = '📈 성장 가속 구간';
      hint = 'K' + k.toFixed(2) + ' — 소개 동력이 절반 이상. 0.5→1.0 구간 부스팅 전략을 적용해보세요.';
    } else if (k >= 0.2) {
      badge = '🌱 기반 형성 구간';
      hint = 'K' + k.toFixed(2) + ' — 소개망 초기 단계. 상위 인플루언서 관리를 시작할 시점입니다.';
    } else {
      badge = '🔍 초기 진단 구간';
      hint = '아직 소개 데이터가 부족합니다. 소개자 입력을 표준화하면 측정이 시작됩니다.';
    }
    if (badgeEl) badgeEl.textContent = badge;
    if (hintEl) hintEl.textContent = hint;

    // 카운트업 애니메이션 (있으면 사용)
    if (typeof animateValue === 'function' && kEl) {
      kEl.textContent = '0.00';
      var start = 0; var end = k; var dur = 1200; var startT = null;
      function step(ts) {
        if (!startT) startT = ts;
        var p = Math.min((ts - startT) / dur, 1);
        var ease = 1 - Math.pow(1 - p, 3);
        kEl.textContent = (start + (end - start) * ease).toFixed(2);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
  } catch (e) { console.warn('K-factor load failed:', e); }
}

async function loadStaffPerformance() {
  try {
    var res = await fetch('/api/dashboard/staff-performance?period=' + currentPeriod);
    var data = await res.json();
    var container = document.getElementById('staffPerformance');
    if (data.success && data.data.length > 0) {
      var colors = ['bg-brand-100 text-brand-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-sky-100 text-sky-700'];
      container.innerHTML = '<div class="divide-y divide-surface-50">' + data.data.map(function(staff) {
        var c = colors[esc(staff.name).charCodeAt(0) % colors.length];
        return '<div class="p-4 hover:bg-surface-50 transition-all">' +
          '<div class="flex items-center gap-3">' +
            '<div class="w-10 h-10 rounded-xl ' + c + ' flex items-center justify-center font-bold text-sm shrink-0">' + esc(staff.name).charAt(0) + '</div>' +
            '<div class="flex-1 min-w-0"><p class="font-bold text-sm text-surface-900">' + esc(staff.name) + '</p><p class="text-[10px] text-surface-400">' + staff.total_consultations + '건 상담</p></div>' +
            '<div class="text-right"><p class="font-black text-surface-900">' + (staff.conversion_rate || 0).toFixed(0) + '%</p><p class="text-[10px] text-surface-400">전환율</p></div>' +
            '<div class="text-right ml-3"><p class="font-black ' + ((staff.avg_coaching_score || 0) >= 80 ? 'text-emerald-600' : (staff.avg_coaching_score || 0) >= 60 ? 'text-amber-600' : 'text-rose-600') + '">' + (staff.avg_coaching_score || 0).toFixed(0) + '점</p><p class="text-[10px] text-surface-400">코칭점수</p></div>' +
          '</div>' +
          '<div class="mt-2 flex gap-1"><div class="h-1 rounded-full bg-brand-400 transition-all" style="width:' + (staff.conversion_rate || 0) + '%"></div><div class="h-1 rounded-full bg-surface-100 flex-1"></div></div>' +
        '</div>';
      }).join('') + '</div>';
    } else { container.innerHTML = '<p class="p-6 text-surface-400 text-center text-sm">데이터가 없습니다</p>'; }
  } catch(e) {}
}

async function loadCoachingBreakdown() {
  try {
    var res = await fetch('/api/dashboard/coaching-breakdown?period=' + currentPeriod);
    var data = await res.json();
    var container = document.getElementById('coachingBreakdown');
    if (data.success) {
      var areas = [
        {k:'rapport',n:'라포 형성',m:20,c:'rose'}, {k:'spin',n:'SPIN 활용',m:25,c:'purple'}, {k:'objection',n:'반론 처리',m:20,c:'sky'},
        {k:'pricing',n:'가격 프레이밍',m:15,c:'emerald'}, {k:'closing',n:'클로징',m:10,c:'amber'}, {k:'structure',n:'전체 구조',m:10,c:'orange'}
      ];
      container.innerHTML = areas.map(function(a) {
        var s = data.data[a.k] || 0;
        var pct = (s / a.m) * 100;
        return '<div class="flex items-center gap-2"><span class="text-xs text-surface-500 w-20 shrink-0">' + a.n + '</span>' +
          '<div class="flex-1 bg-surface-100 rounded-full h-2 overflow-hidden"><div class="bg-' + a.c + '-500 h-2 rounded-full transition-all" style="width:' + pct + '%"></div></div>' +
          '<span class="text-xs font-bold text-surface-700 w-14 text-right">' + s.toFixed(1) + '/' + a.m + '</span></div>';
      }).join('');
    }
  } catch(e) {}
}

async function loadLowScoreConsultations() {
  try {
    var res = await fetch('/api/dashboard/low-score-consultations?threshold=70&limit=5');
    var data = await res.json();
    var container = document.getElementById('lowScoreConsultations');
    if (data.success && data.data.length > 0) {
      container.innerHTML = data.data.map(function(c) {
        var date = new Date(c.consultation_date);
        return '<a href="/consultations/' + c.id + '/report" class="block p-4 hover:bg-surface-50 transition-all">' +
          '<div class="flex items-center justify-between">' +
            '<div class="min-w-0"><p class="font-bold text-sm text-surface-900 truncate">' + (esc(c.patient_name) || '환자 미지정') + '</p>' +
            '<p class="text-[10px] text-surface-400">' + (c.user_name || '') + ' · ' + date.toLocaleDateString('ko-KR') + '</p></div>' +
            '<div class="text-right shrink-0 ml-3"><p class="text-xl font-black text-rose-500">' + (c.coaching_score || 0) + '점</p></div>' +
          '</div>' +
          (c.improvement_needed ? '<p class="text-xs text-amber-600 mt-1.5 flex items-center gap-1"><i class="fas fa-lightbulb text-[10px]"></i>' + c.improvement_needed + '</p>' : '') +
        '</a>';
      }).join('');
    } else {
      container.innerHTML = '<div class="text-center py-6"><div class="w-12 h-12 mx-auto mb-2 rounded-xl bg-emerald-50 flex items-center justify-center"><i class="fas fa-check text-emerald-600"></i></div><p class="text-surface-400 text-sm">코칭 필요 상담이 없습니다 👍</p></div>';
    }
  } catch(e) {}
}

async function loadProposalAnalytics() {
  try {
    var res = await fetch('/api/dashboard/proposal-analytics?period=' + currentPeriod);
    var data = await res.json();
    if (data.success) {
      document.getElementById('proposalsSent').textContent = data.data.sent || 0;
      document.getElementById('proposalsViewed').textContent = data.data.viewed || 0;
      document.getElementById('proposalsConverted').textContent = data.data.converted || 0;
    }
  } catch(e) {}
}

document.getElementById('periodSelect').addEventListener('click', function() {
  var periods = { daily:'오늘', weekly:'이번 주', monthly:'이번 달' };
  var keys = Object.keys(periods);
  var currentIdx = keys.indexOf(currentPeriod);
  currentPeriod = keys[(currentIdx + 1) % keys.length];
  document.getElementById('periodSelect').innerHTML = periods[currentPeriod] + ' <i class="fas fa-chevron-down ml-1 text-[10px]"></i>';
  loadDashboard();
});

// Goal Achievement Gauges
async function loadGoalGauges() {
  try {
    var [summaryRes, goalsRes] = await Promise.all([
      fetch('/api/dashboard/admin-summary?period=' + currentPeriod),
      fetch('/api/auth/goals')
    ]);
    var summaryData = await summaryRes.json();
    var goalsData = await goalsRes.json();
    if (!summaryData.success) return;
    var s = summaryData.data;
    var goals = (goalsData.success && goalsData.data) ? goalsData.data : { conversion_rate: 60, avg_score: 80, contact_rate: 70 };
    
    function updateGauge(circleId, textId, value, goal, suffix) {
      var pct = goal > 0 ? Math.min(100, Math.round(value / goal * 100)) : 0;
      var circumference = 2 * Math.PI * 15;
      var dash = (pct / 100) * circumference;
      var el = document.getElementById(circleId);
      var txt = document.getElementById(textId);
      if (el) el.setAttribute('stroke-dasharray', dash + ' ' + circumference);
      if (txt) txt.textContent = Math.round(value) + suffix;
    }
    
    updateGauge('goalConvCircle', 'goalConvText', s.conversion_rate || 0, goals.conversion_rate || 60, '%');
    updateGauge('goalScoreCircle', 'goalScoreText', s.avg_coaching_score || 0, goals.avg_score || 80, '점');
    updateGauge('goalContactCircle', 'goalContactText', s.contact_rate || 0, goals.contact_rate || 70, '%');
  } catch(e) { console.error('Goal gauges error:', e); }
}

// Hourly Distribution Chart
var hourlyChartInstance = null;
async function loadHourlyDistribution() {
  try {
    var res = await fetch('/api/dashboard/admin-summary?period=' + currentPeriod);
    var data = await res.json();
    if (!data.success) return;
    // Generate hourly mock from total (API enhancement later)
    var hours = ['9시','10시','11시','12시','13시','14시','15시','16시','17시','18시'];
    var total = data.data.total_consultations || 0;
    // Distribute based on typical dental clinic patterns
    var distribution = [0.06,0.12,0.15,0.08,0.05,0.14,0.16,0.12,0.08,0.04];
    var hourlyData = distribution.map(function(d) { return Math.round(total * d); });
    
    var canvas = document.getElementById('hourlyDistChart');
    if (!canvas || !window.Chart) return;
    if (hourlyChartInstance) hourlyChartInstance.destroy();
    var maxVal = Math.max.apply(null, hourlyData);
    var bgColors = hourlyData.map(function(v) {
      return v === maxVal ? 'rgba(99,102,241,0.8)' : 'rgba(99,102,241,0.25)';
    });
    hourlyChartInstance = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: hours,
        datasets: [{ data: hourlyData, backgroundColor: bgColors, borderRadius: 6, barThickness: 20 }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: {display:false}, ticks: {font:{size:9}} },
          y: { beginAtZero: true, ticks: {font:{size:9}, stepSize: 1}, grid: {color:'#f1f5f9'} }
        }
      }
    });
  } catch(e) { console.error('Hourly chart error:', e); }
}

// Weekly Comparison Cards
async function loadWeeklyComparison() {
  try {
    var [thisWeekRes, lastWeekRes] = await Promise.all([
      fetch('/api/dashboard/admin-summary?period=weekly'),
      fetch('/api/dashboard/admin-summary?period=weekly')
    ]);
    var thisWeek = await thisWeekRes.json();
    if (!thisWeek.success) return;
    var tw = thisWeek.data;
    
    var items = [
      { label: '상담 수', value: tw.total_consultations || 0, icon: 'fa-comments', color: 'brand', trend: tw.consultation_trend },
      { label: '전환율', value: (tw.conversion_rate || 0).toFixed(0) + '%', icon: 'fa-chart-line', color: 'emerald', trend: tw.conversion_trend },
      { label: '코칭점수', value: (tw.avg_coaching_score || 0).toFixed(0) + '점', icon: 'fa-star', color: 'amber', trend: tw.coaching_trend },
      { label: '제안서 열람', value: (tw.proposal_view_rate || 0).toFixed(0) + '%', icon: 'fa-eye', color: 'purple', trend: tw.proposal_trend }
    ];
    
    var container = document.getElementById('weeklyComparison');
    container.innerHTML = items.map(function(item) {
      var trendHtml = '';
      if (item.trend) {
        var up = item.trend > 0;
        trendHtml = '<span class="text-[10px] font-bold ' + (up ? 'text-emerald-600' : 'text-rose-600') + '">' +
          '<i class="fas ' + (up ? 'fa-arrow-up' : 'fa-arrow-down') + ' mr-0.5"></i>' + (up ? '+' : '') + item.trend.toFixed(1) + '%</span>';
      }
      return '<div class="p-3 bg-' + item.color + '-50/50 rounded-xl">' +
        '<div class="flex items-center gap-1.5 mb-1"><i class="fas ' + item.icon + ' text-[10px] text-' + item.color + '-500"></i><span class="text-[10px] font-semibold text-surface-500">' + item.label + '</span></div>' +
        '<div class="flex items-center justify-between"><p class="text-lg font-black text-surface-900">' + item.value + '</p>' + trendHtml + '</div></div>';
    }).join('');
  } catch(e) { console.error('Weekly comparison error:', e); }
}

loadDashboard();
