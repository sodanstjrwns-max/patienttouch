var currentGoals = {};
var currentTab = 'overview';
var revenueChartInstance = null;
var conversionChartInstance = null;

function switchTab(tab) {
  currentTab = tab;
  ['overview','compare','schedule','chart','referral','treatment'].forEach(function(t) {
    var el = document.getElementById(t + 'Tab');
    if (el) el.classList.toggle('hidden', t !== tab);
  });
  document.querySelectorAll('.report-tab').forEach(function(b) {
    b.className = b.dataset.tab === tab
      ? 'report-tab px-3.5 py-2 text-xs font-bold rounded-xl transition-all bg-brand-600 text-white shadow-sm whitespace-nowrap'
      : 'report-tab px-3.5 py-2 text-xs font-bold rounded-xl transition-all bg-surface-100 text-surface-600 whitespace-nowrap';
  });
  var period = document.getElementById('periodSelect').value;
  if (tab === 'chart') loadChartData(period);
  if (tab === 'referral') loadReferralROI(period);
  if (tab === 'treatment') loadTreatmentAnalysis(period);
  if (tab === 'compare') loadPeriodCompare('week');
  if (tab === 'schedule') loadSmartSchedule();
}

// === Feature 7: Period Comparison ===
async function loadPeriodCompare(p) {
  document.querySelectorAll('.cmp-period-btn').forEach(function(b){
    b.className = b.dataset.p === p
      ? 'cmp-period-btn text-[10px] font-bold px-2.5 py-1 rounded-lg bg-brand-600 text-white transition-all'
      : 'cmp-period-btn text-[10px] font-bold px-2.5 py-1 rounded-lg bg-surface-100 text-surface-600 transition-all';
  });
  try {
    var res = await fetch('/api/dashboard/period-compare?period=' + p);
    var data = await res.json();
    if (!data.success) { showErrorState('compareContent','기간 비교 데이터를 불러올 수 없습니다',function(){loadPeriodCompare(p)}); return; }
    var d = data.data, cur = d.current, prev = d.previous, ch = d.changes;
    var pLabels = {week:'이번 주',month:'이번 달',quarter:'이번 분기'};
    var ppLabels = {week:'지난 주',month:'지난 달',quarter:'지난 분기'};

    var arrow = function(v) {
      if (v > 0) return '<span class="text-[10px] font-bold text-emerald-600"><i class="fas fa-caret-up text-[8px]"></i> +'+v+'%</span>';
      if (v < 0) return '<span class="text-[10px] font-bold text-rose-600"><i class="fas fa-caret-down text-[8px]"></i> '+v+'%</span>';
      return '<span class="text-[10px] font-bold text-surface-400">—</span>';
    };

    var html = '<div class="grid grid-cols-2 gap-2.5 mb-3">';
    // Revenue card
    html += '<div class="p-3.5 rounded-xl '+(ch.revenue>=0?'bg-emerald-50/70 border border-emerald-200/50':'bg-rose-50/70 border border-rose-200/50')+'">';
    html += '<p class="text-[10px] font-bold text-surface-500 mb-1">결정 금액</p>';
    html += '<div class="flex items-end gap-1"><span class="text-xl font-black '+(ch.revenue>=0?'text-emerald-700':'text-rose-700')+'">'+fmtWon(cur.revenue)+'</span><span class="text-[10px] text-surface-400 mb-0.5">만원</span></div>';
    html += '<div class="flex items-center gap-1.5 mt-1">'+arrow(ch.revenue)+'<span class="text-[10px] text-surface-400">vs '+ppLabels[p]+' '+fmtWon(prev.revenue)+'만</span></div>';
    html += '</div>';
    // Consult count
    html += '<div class="p-3.5 rounded-xl '+(ch.total>=0?'bg-sky-50/70 border border-sky-200/50':'bg-rose-50/70 border border-rose-200/50')+'">';
    html += '<p class="text-[10px] font-bold text-surface-500 mb-1">상담 건수</p>';
    html += '<div class="flex items-end gap-1"><span class="text-xl font-black '+(ch.total>=0?'text-sky-700':'text-rose-700')+'">'+cur.total+'</span><span class="text-[10px] text-surface-400 mb-0.5">건</span></div>';
    html += '<div class="flex items-center gap-1.5 mt-1">'+arrow(ch.total)+'<span class="text-[10px] text-surface-400">vs '+ppLabels[p]+' '+prev.total+'건</span></div>';
    html += '</div>';
    html += '</div>';

    // Detailed metrics
    html += '<div class="grid grid-cols-3 gap-2">';
    var metrics = [
      {label:'전환율',cur:cur.conversion+'%',prev:prev.conversion+'%',ch:ch.conversion,suffix:'%p'},
      {label:'결정건수',cur:cur.paid+'건',prev:prev.paid+'건',ch:ch.paid,suffix:'%'},
      {label:'상담점수',cur:cur.avg_score+'점',prev:prev.avg_score+'점',ch:ch.avg_score,suffix:'점'}
    ];
    metrics.forEach(function(m){
      html += '<div class="p-2.5 rounded-xl bg-surface-50 text-center">';
      html += '<p class="text-[10px] font-bold text-surface-500 mb-1">'+m.label+'</p>';
      html += '<p class="text-base font-extrabold text-surface-900">'+m.cur+'</p>';
      html += '<p class="text-[10px] text-surface-400">'+m.prev+'</p>';
      if(m.ch > 0) html += '<p class="text-[10px] font-bold text-emerald-600 mt-0.5">+'+m.ch+m.suffix+'</p>';
      else if(m.ch < 0) html += '<p class="text-[10px] font-bold text-rose-600 mt-0.5">'+m.ch+m.suffix+'</p>';
      html += '</div>';
    });
    html += '</div>';

    document.getElementById('compareContent').innerHTML = html;
  } catch(e) { showErrorState('compareContent','기간 비교 오류',function(){loadPeriodCompare(p)}); }
}

// === Feature 8: Smart Schedule ===
async function loadSmartSchedule() {
  try {
    var res = await fetch('/api/dashboard/smart-schedule');
    var data = await res.json();
    if (!data.success) { showErrorState('scheduleContent','스케줄을 불러올 수 없습니다',loadSmartSchedule); return; }

    if (data.data.length === 0) {
      document.getElementById('scheduleContent').innerHTML = '<div class="text-center py-6"><div class="w-12 h-12 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center mb-2"><i class="fas fa-circle-check text-emerald-500 text-lg"></i></div><p class="text-sm font-bold text-surface-800">미결정 환자가 없습니다</p><p class="text-xs text-surface-500">모든 환자에게 연락을 완료했어요!</p></div>';
      return;
    }

    var uCfg = {today:'border-l-rose-500',tomorrow:'border-l-amber-400'};
    var urgColors = ['bg-rose-500','bg-amber-500','bg-sky-400','bg-surface-300'];
    var html = '';
    data.data.forEach(function(s, i) {
      var urgPct = Math.min(100, s.urgency_score);
      html += '<div class="card-premium p-3 border-l-[3px] '+(uCfg[s.recommended_day]||'border-l-sky-400')+' animate-fade-in" style="animation-delay:'+(i*50)+'ms">';
      html += '<div class="flex items-start gap-2.5">';
      html += '<div class="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-100 to-purple-100 flex items-center justify-center font-bold text-xs text-brand-700 shrink-0">'+(i+1)+'</div>';
      html += '<div class="flex-1 min-w-0">';
      html += '<div class="flex items-center gap-1.5 flex-wrap">';
      html += '<a href="/patients/'+s.patient_id+'" class="font-bold text-sm text-surface-900 hover:text-brand-600">'+esc(s.patient_name)+'</a>';
      html += '<span class="text-[9px] px-1.5 py-0.5 rounded bg-brand-50 text-brand-600 font-semibold">결정도 '+s.decision_score+'</span>';
      html += '</div>';
      html += '<p class="text-[11px] text-surface-600 mt-0.5">'+(esc(s.treatment_type)||'일반')+' · '+fmtWon(s.amount)+'만원 · '+s.days_passed+'일 경과</p>';
      // Urgency bar
      html += '<div class="flex items-center gap-2 mt-1.5">';
      html += '<div class="flex-1 h-1.5 bg-surface-100 rounded-full overflow-hidden"><div class="h-full rounded-full '+(urgPct>=80?'bg-rose-500':urgPct>=60?'bg-amber-500':'bg-sky-400')+'" style="width:'+urgPct+'%"></div></div>';
      html += '<span class="text-[10px] font-bold '+(urgPct>=80?'text-rose-600':urgPct>=60?'text-amber-600':'text-sky-600')+'">'+urgPct+'</span>';
      html += '</div>';
      html += '<p class="text-[10px] text-surface-500 mt-1"><i class="fas fa-lightbulb text-amber-400 mr-1 text-[8px]"></i>'+esc(s.reason)+'</p>';
      html += '<div class="flex items-center gap-2 mt-1">';
      html += '<span class="text-[9px] px-1.5 py-0.5 rounded '+(s.recommended_day==='today'?'bg-rose-50 text-rose-600':'bg-amber-50 text-amber-600')+' font-bold">';
      html += '<i class="fas fa-clock text-[7px] mr-0.5"></i>'+(s.recommended_day==='today'?'오늘':'내일')+' '+s.recommended_time+'</span>';
      if(s.contact_count===0) html += '<span class="text-[9px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 font-bold">첫 연락</span>';
      html += '</div>';
      html += '</div>';
      // Action buttons
      html += '<div class="flex flex-col gap-1.5 shrink-0">';
      if(s.patient_phone) html += '<a href="tel:'+s.patient_phone+'" class="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 hover:bg-brand-100 active:scale-90 transition-all"><i class="fas fa-phone text-xs"></i></a>';
      html += '<a href="/patients/'+s.patient_id+'" class="w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center text-surface-500 hover:bg-surface-200 active:scale-90 transition-all"><i class="fas fa-user text-xs"></i></a>';
      html += '</div></div></div>';
    });

    document.getElementById('scheduleContent').innerHTML = html;
  } catch(e) { showErrorState('scheduleContent','스마트 스케줄 오류',loadSmartSchedule); }
}

async function loadReport(period) {
  period = period || 'week';
  try {
    await requireAuth();
    var res = await fetch('/api/dashboard/kpi?period=' + period);
    var data = await res.json();
    if (data.success) renderKPI(data.data);
  } catch (err) { console.error('Failed to load report:', err); }
}

function renderKPI(data) {
  var kpi = data.kpi;
  var goals = data.goals;
  currentGoals = goals;

  var items = [
    { name: '상담 전환율', val: kpi.conversion_rate, goal: goals.conversion_rate || 80, unit: '%', color: 'brand', sub: kpi.paid_consultations + '건 결제 / ' + kpi.total_consultations + '건 상담' },
    { name: '평균 상담점수', val: kpi.avg_score, goal: goals.avg_score || 85, unit: '점', color: 'emerald', sub: '' },
    { name: '연락 수행률', val: kpi.contact_rate, goal: goals.contact_rate || 95, unit: '%', color: 'amber', sub: kpi.completed_tasks + '건 완료 / ' + kpi.total_tasks + '건 예정' },
    { name: '재상담 성공', val: kpi.re_consultation, goal: goals.re_consultation || 3, unit: '건', color: 'purple', sub: '' }
  ];

  document.getElementById('kpiSection').innerHTML = items.map(function(item) {
    var pct = Math.min(100, (item.val / item.goal) * 100);
    var achieved = item.val >= item.goal;
    return '<div>' +
      '<div class="flex justify-between text-xs mb-1.5">' +
        '<span class="font-semibold text-surface-500">' + esc(item.name) + '</span>' +
        '<span class="font-bold ' + (achieved ? 'text-emerald-600' : 'text-surface-800') + '">' + item.val + item.unit + ' / ' + item.goal + item.unit + (achieved ? ' ✅' : '') + '</span>' +
      '</div>' +
      '<div class="w-full bg-surface-100 rounded-full h-2 overflow-hidden">' +
        '<div class="bg-' + item.color + '-500 h-2 rounded-full transition-all duration-1000" style="width:' + pct + '%"></div>' +
      '</div>' +
      (item.sub ? '<p class="text-[10px] text-surface-400 mt-1">' + item.sub + '</p>' : '') +
    '</div>';
  }).join('');

  document.getElementById('totalConsultations').textContent = kpi.total_consultations + '건';
  document.getElementById('paidConsultations').textContent = kpi.paid_consultations + '건';
  document.getElementById('totalTasks').textContent = (kpi.total_tasks || 0) + '건';
  document.getElementById('completedTasks').textContent = (kpi.completed_tasks || 0) + '건';
  document.getElementById('totalAmount').textContent = ((data.total_amount || 0) / 10000).toFixed(0) + '만원';

  document.getElementById('goalConversion').textContent = (goals.conversion_rate || 80) + '%';
  document.getElementById('goalScore').textContent = (goals.avg_score || 85) + '점';
  document.getElementById('goalContact').textContent = (goals.contact_rate || 95) + '%';
  document.getElementById('goalReConsult').textContent = (goals.re_consultation || 3) + '건';
}

// ============================================
// Chart Data
// ============================================
async function loadChartData(period) {
  var days = period === 'week' ? 7 : period === 'quarter' ? 90 : 30;
  try {
    var res = await fetch('/api/dashboard/revenue-trend?days=' + days);
    var data = await res.json();
    if (data.success) renderCharts(data.data);
  } catch (err) { console.error('Chart load error:', err); }
}

function renderCharts(data) {
  if (!window.Chart || !data || data.length === 0) return;

  var labels = data.map(function(d) { 
    var dt = new Date(d.date); 
    return (dt.getMonth()+1)+'/'+dt.getDate(); 
  });
  var paidAmts = data.map(function(d) { return Math.round((d.paid_amount || 0) / 10000); });
  var totalAmts = data.map(function(d) { return Math.round((d.total_amount || 0) / 10000); });
  var convRates = data.map(function(d) { return d.conversion_rate || 0; });
  var consultCounts = data.map(function(d) { return d.total_consultations || 0; });

  // Revenue Chart
  if (revenueChartInstance) revenueChartInstance.destroy();
  var ctx1 = document.getElementById('revenueChart');
  if (ctx1) {
    revenueChartInstance = new Chart(ctx1.getContext('2d'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: '결정 매출 (만원)', data: paidAmts, backgroundColor: 'rgba(99,102,241,0.8)', borderRadius: 6, order: 1 },
          { label: '상담 매출 (만원)', data: totalAmts, backgroundColor: 'rgba(99,102,241,0.15)', borderRadius: 6, order: 2 }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true, position: 'bottom', labels: { font: { size: 10, family: 'Pretendard Variable' }, usePointStyle: true, pointStyleWidth: 8, padding: 12 } } },
        scales: { x: { grid: { display: false }, ticks: { font: { size: 9 } } }, y: { beginAtZero: true, ticks: { font: { size: 9 }, callback: function(v) { return v + '만'; } }, grid: { color: '#f1f5f9' } } }
      }
    });
  }

  // Conversion Chart
  if (conversionChartInstance) conversionChartInstance.destroy();
  var ctx2 = document.getElementById('conversionChart');
  if (ctx2) {
    conversionChartInstance = new Chart(ctx2.getContext('2d'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          { label: '전환율 (%)', data: convRates, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', fill: true, tension: 0.3, pointRadius: 3, pointBackgroundColor: '#10b981', borderWidth: 2, yAxisID: 'y' },
          { label: '상담 건수', data: consultCounts, borderColor: '#6366f1', backgroundColor: 'transparent', tension: 0.3, pointRadius: 3, pointBackgroundColor: '#6366f1', borderWidth: 2, borderDash: [4,4], yAxisID: 'y1' }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: true, position: 'bottom', labels: { font: { size: 10, family: 'Pretendard Variable' }, usePointStyle: true, pointStyleWidth: 8, padding: 12 } } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 9 } } },
          y: { beginAtZero: true, max: 100, position: 'left', ticks: { font: { size: 9 }, callback: function(v) { return v + '%'; } }, grid: { color: '#f1f5f9' } },
          y1: { beginAtZero: true, position: 'right', ticks: { font: { size: 9 }, callback: function(v) { return v + '건'; } }, grid: { display: false } }
        }
      }
    });
  }
}

// ============================================
// Referral ROI
// ============================================
async function loadReferralROI(period) {
  try {
    var res = await fetch('/api/dashboard/referral-roi?period=' + period);
    var data = await res.json();
    if (data.success) renderReferralROI(data.data);
  } catch (err) { console.error('Referral ROI error:', err); }
}

function renderReferralROI(data) {
  if (!data || data.length === 0) {
    document.getElementById('referralContent').innerHTML = '<div class="card-premium p-8 text-center"><i class="fas fa-chart-bar text-3xl text-surface-300 mb-3"></i><p class="text-surface-500 text-sm">데이터가 아직 없습니다</p></div>';
    return;
  }

  var refLabels = { '온라인광고': '🔍 온라인광고', '네이버검색': '🟢 네이버', '인스타그램': '📸 인스타', '유튜브': '🎬 유튜브', '지인소개': '👥 지인소개', '간판': '🏠 간판/도보', '블로그': '📝 블로그', '카페/커뮤니티': '💬 커뮤니티', '재내원': '🔄 재내원', '기타': '📌 기타', '미분류': '❓ 미분류' };

  var html = '';
  // Top summary chart
  html += '<div class="card-premium p-5 mb-3">';
  html += '<div class="flex items-center gap-2 mb-4"><div class="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center"><i class="fas fa-route text-xs text-brand-600"></i></div><h2 class="font-bold text-sm text-surface-900">내원경로별 전환율</h2></div>';
  html += '<canvas id="referralChart" height="200"></canvas>';
  html += '</div>';

  // Detail cards
  html += '<div class="space-y-2">';
  data.forEach(function(r) {
    var label = refLabels[r.referral_source] || r.referral_source;
    var cvColor = r.conversion_rate >= 70 ? 'text-emerald-600' : r.conversion_rate >= 40 ? 'text-amber-600' : 'text-rose-600';
    html += '<div class="card-premium p-4">';
    html += '<div class="flex items-center justify-between mb-2">';
    html += '<span class="font-bold text-sm text-surface-900">' + label + '</span>';
    html += '<span class="text-xl font-black ' + cvColor + '">' + r.conversion_rate + '<span class="text-xs">%</span></span>';
    html += '</div>';
    html += '<div class="grid grid-cols-4 gap-2 text-center">';
    html += '<div><p class="text-sm font-bold text-surface-800">' + r.total_consultations + '</p><p class="text-[9px] text-surface-400">상담</p></div>';
    html += '<div><p class="text-sm font-bold text-emerald-600">' + r.paid_consultations + '</p><p class="text-[9px] text-surface-400">결제</p></div>';
    html += '<div><p class="text-sm font-bold text-brand-600">' + Math.round(r.paid_amount / 10000) + '만</p><p class="text-[9px] text-surface-400">매출</p></div>';
    html += '<div><p class="text-sm font-bold text-purple-600">' + r.avg_score + '점</p><p class="text-[9px] text-surface-400">점수</p></div>';
    html += '</div>';
    // Progress bar
    html += '<div class="mt-2 flex items-center gap-2">';
    html += '<div class="flex-1 h-1.5 bg-surface-100 rounded-full overflow-hidden">';
    var paidW = r.total_consultations > 0 ? Math.round(r.paid_consultations / r.total_consultations * 100) : 0;
    var undW = r.total_consultations > 0 ? Math.round(r.undecided_consultations / r.total_consultations * 100) : 0;
    html += '<div class="h-full flex"><div class="bg-emerald-500 rounded-l-full" style="width:' + paidW + '%"></div><div class="bg-amber-400" style="width:' + undW + '%"></div><div class="bg-rose-400 rounded-r-full flex-1"></div></div>';
    html += '</div>';
    html += '<span class="text-[9px] text-surface-400 shrink-0">' + r.unique_patients + '명</span>';
    html += '</div>';
    html += '</div>';
  });
  html += '</div>';

  document.getElementById('referralContent').innerHTML = html;

  // Render chart
  setTimeout(function() {
    var canvas = document.getElementById('referralChart');
    if (!canvas || !window.Chart) return;
    var labels = data.map(function(r) { return r.referral_source; });
    var rates = data.map(function(r) { return r.conversion_rate; });
    var amounts = data.map(function(r) { return Math.round(r.paid_amount / 10000); });
    new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: '전환율(%)', data: rates, backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 4, yAxisID: 'y' },
          { label: '매출(만원)', data: amounts, backgroundColor: 'rgba(99,102,241,0.3)', borderRadius: 4, yAxisID: 'y1' }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, usePointStyle: true, pointStyleWidth: 8, padding: 10 } } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 9 }, maxRotation: 45 } },
          y: { beginAtZero: true, max: 100, position: 'left', ticks: { font: { size: 9 }, callback: function(v){return v+'%';} }, grid: { color: '#f1f5f9' } },
          y1: { beginAtZero: true, position: 'right', ticks: { font: { size: 9 }, callback: function(v){return v+'만';} }, grid: { display: false } }
        }
      }
    });
  }, 50);
}

// ============================================
// Treatment Analysis
// ============================================
async function loadTreatmentAnalysis(period) {
  try {
    var res = await fetch('/api/dashboard/treatment-analysis?period=' + period);
    var data = await res.json();
    if (data.success) renderTreatmentAnalysis(data.data);
  } catch (err) { console.error('Treatment analysis error:', err); }
}

function renderTreatmentAnalysis(data) {
  if (!data || data.length === 0) {
    document.getElementById('treatmentContent').innerHTML = '<div class="card-premium p-8 text-center"><i class="fas fa-tooth text-3xl text-surface-300 mb-3"></i><p class="text-surface-500 text-sm">데이터가 아직 없습니다</p></div>';
    return;
  }

  var html = '';
  // Chart
  html += '<div class="card-premium p-5 mb-3">';
  html += '<div class="flex items-center gap-2 mb-4"><div class="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center"><i class="fas fa-tooth text-xs text-emerald-600"></i></div><h2 class="font-bold text-sm text-surface-900">치료항목별 전환율</h2></div>';
  html += '<canvas id="treatmentChart" height="200"></canvas>';
  html += '</div>';

  // Ranking
  html += '<div class="card-premium p-5 mb-3">';
  html += '<div class="flex items-center gap-2 mb-4"><div class="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center"><i class="fas fa-ranking-star text-xs text-amber-600"></i></div><h2 class="font-bold text-sm text-surface-900">매출 기여도 순위</h2></div>';
  var totalPaid = data.reduce(function(s, d) { return s + (d.paid_amount || 0); }, 0);
  html += '<div class="space-y-2">';
  data.forEach(function(t, i) {
    var contribution = totalPaid > 0 ? Math.round(t.paid_amount / totalPaid * 100) : 0;
    var medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i+1)+'';
    var cvColor = t.conversion_rate >= 70 ? 'text-emerald-600 bg-emerald-50' : t.conversion_rate >= 40 ? 'text-amber-600 bg-amber-50' : 'text-rose-600 bg-rose-50';
    html += '<div class="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">';
    html += '<span class="text-base w-6 text-center shrink-0">' + medal + '</span>';
    html += '<div class="flex-1 min-w-0">';
    html += '<div class="flex items-center gap-2 mb-1"><span class="font-bold text-sm">' + esc(t.treatment_type) + '</span><span class="text-[10px] px-1.5 py-0.5 rounded-md font-bold ' + cvColor + '">전환 ' + t.conversion_rate + '%</span></div>';
    html += '<div class="h-1.5 bg-surface-200 rounded-full overflow-hidden"><div class="h-full bg-brand-500 rounded-full" style="width:' + contribution + '%"></div></div>';
    html += '</div>';
    html += '<div class="text-right shrink-0">';
    html += '<p class="text-sm font-black text-brand-600">' + Math.round(t.paid_amount / 10000) + '만</p>';
    html += '<p class="text-[9px] text-surface-400">' + t.total_consultations + '건 / ' + contribution + '%</p>';
    html += '</div>';
    html += '</div>';
  });
  html += '</div></div>';

  // Detail stats
  html += '<div class="space-y-2">';
  data.forEach(function(t) {
    html += '<div class="card-premium p-4">';
    html += '<div class="flex items-center justify-between mb-2"><span class="font-bold text-sm">' + esc(t.treatment_type) + '</span><span class="text-[10px] font-semibold px-2 py-1 rounded-lg bg-brand-50 text-brand-600">평균 ' + Math.round(t.avg_amount / 10000) + '만원</span></div>';
    html += '<div class="grid grid-cols-4 gap-2 text-center">';
    html += '<div><p class="text-sm font-bold text-surface-800">' + t.total_consultations + '</p><p class="text-[9px] text-surface-400">전체</p></div>';
    html += '<div><p class="text-sm font-bold text-emerald-600">' + t.paid_consultations + '</p><p class="text-[9px] text-surface-400">결제</p></div>';
    html += '<div><p class="text-sm font-bold text-amber-600">' + t.undecided_consultations + '</p><p class="text-[9px] text-surface-400">미결정</p></div>';
    html += '<div><p class="text-sm font-bold text-rose-600">' + t.lost_consultations + '</p><p class="text-[9px] text-surface-400">이탈</p></div>';
    html += '</div>';
    html += '</div>';
  });
  html += '</div>';

  document.getElementById('treatmentContent').innerHTML = html;

  // Render chart
  setTimeout(function() {
    var canvas = document.getElementById('treatmentChart');
    if (!canvas || !window.Chart) return;
    var labels = data.map(function(t) { return esc(t.treatment_type); });
    var rates = data.map(function(t) { return t.conversion_rate; });
    var paid = data.map(function(t) { return t.paid_consultations; });
    var undecided = data.map(function(t) { return t.undecided_consultations; });
    var lost = data.map(function(t) { return t.lost_consultations; });
    new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: '결제', data: paid, backgroundColor: '#10b981', borderRadius: 4 },
          { label: '미결정', data: undecided, backgroundColor: '#f59e0b', borderRadius: 4 },
          { label: '이탈', data: lost, backgroundColor: '#f43f5e', borderRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, usePointStyle: true, pointStyleWidth: 8, padding: 10 } } },
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { font: { size: 9 }, maxRotation: 45 } },
          y: { stacked: true, beginAtZero: true, ticks: { font: { size: 9 }, stepSize: 1, callback: function(v){return v+'건';} }, grid: { color: '#f1f5f9' } }
        }
      }
    });
  }, 50);
}

// ============================================
// Events & Init
// ============================================
document.getElementById('periodSelect').addEventListener('change', function(e) {
  var period = e.target.value;
  loadReport(period);
  if (currentTab === 'chart') loadChartData(period);
  if (currentTab === 'referral') loadReferralROI(period);
  if (currentTab === 'treatment') loadTreatmentAnalysis(period);
});

document.getElementById('editGoalsBtn').addEventListener('click', function() {
  var form = document.getElementById('goalsForm');
  form.conversion_rate.value = currentGoals.conversion_rate || 80;
  form.avg_score.value = currentGoals.avg_score || 85;
  form.contact_rate.value = currentGoals.contact_rate || 95;
  form.re_consultation.value = currentGoals.re_consultation || 3;
  document.getElementById('goalsModal').classList.remove('hidden');
});

function closeGoalsModal() { document.getElementById('goalsModal').classList.add('hidden'); }
document.getElementById('goalsModal').addEventListener('click', function(e) { if (e.target.id === 'goalsModal') closeGoalsModal(); });

document.getElementById('goalsForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  var formData = new FormData(e.target);
  var goals = {
    conversion_rate: parseInt(formData.get('conversion_rate')) || 80,
    avg_score: parseInt(formData.get('avg_score')) || 85,
    contact_rate: parseInt(formData.get('contact_rate')) || 95,
    re_consultation: parseInt(formData.get('re_consultation')) || 3
  };
  try {
    var res = await fetch('/api/auth/goals', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(goals) });
    var data = await res.json();
    if (data.success) { closeGoalsModal(); loadReport(document.getElementById('periodSelect').value); }
    else { showToast(data.error || '목표 저장에 실패했습니다.','error'); }
  } catch (err) { showToast('오류가 발생했습니다.','error'); }
});

loadReport();
initPullToRefresh(function(){ loadReport(); });
