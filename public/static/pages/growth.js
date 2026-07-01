// =========================================
// GROWTH TRACKER PAGE - Consultation Growth Visualization
// =========================================

async function loadGrowthData() {
  try {
    // Auth check using common utility
    await requireAuth();

    // Fetch growth data with graceful degradation
    var [sessionsData, trendData] = await Promise.all([
      fetch('/api/dashboard/growth-sessions?limit=30').then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; }),
      fetch('/api/dashboard/coaching-trend?weeks=12').then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; })
    ]);

    if (!sessionsData || !sessionsData.success) {
      showEmpty('성장 데이터를 불러올 수 없습니다.');
      return;
    }

    document.getElementById('growthLoading').classList.add('hidden');
    var d = sessionsData.data;
    var t = (trendData && trendData.success) ? trendData.data : null;

    if (!d.sessions || d.sessions.length === 0) {
      showEmpty('아직 분석된 상담이 없습니다. 상담을 녹음하면 성장 데이터가 쌓입니다!');
      return;
    }

    renderGrowthPage(d, t);
  } catch(e) {
    if (e === 'auth') return;
    console.error('Growth load error:', e);
    showEmpty('데이터 로드에 실패했습니다.');
  }
}

function showEmpty(msg) {
  document.getElementById('growthLoading').classList.add('hidden');
  document.getElementById('growthContent').innerHTML =
    '<div class="flex flex-col items-center justify-center py-20 gap-3">' +
      '<div class="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center"><i class="fas fa-seedling text-2xl text-surface-300"></i></div>' +
      '<p class="text-sm text-surface-500 text-center px-4">' + msg + '</p>' +
      '<a href="/recording" class="mt-2 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-semibold">상담 녹음 시작</a>' +
      '<button onclick="loadGrowthData()" class="text-xs text-surface-400 hover:text-brand-600 mt-1"><i class="fas fa-rotate mr-1"></i>다시 시도</button>' +
    '</div>';
}

function renderGrowthPage(data, trend) {
  var s = data.stats;
  var sessions = data.sessions;
  var areaTrend = data.area_trend;
  var container = document.getElementById('growthContent');

  var html = '';

  // === LEVEL HERO ===
  var score = s.latest_score || s.overall_avg || 0;
  var lv = getLevel(score);
  var exp = getExpProgress(score);
  var next = getNextLevel(score);
  var growthColor = s.total_growth > 0 ? 'emerald' : s.total_growth < 0 ? 'rose' : 'surface';
  var growthSign = s.total_growth > 0 ? '+' : '';
  var growthIcon = s.total_growth > 0 ? 'fa-arrow-trend-up' : s.total_growth < 0 ? 'fa-arrow-trend-down' : 'fa-equals';

  html += '<div class="bg-gradient-to-br ' + lv.gradient + ' rounded-3xl p-5 text-white mb-5 shadow-xl shadow-brand-500/20 relative overflow-hidden">' +
    // Subtle background pattern
    '<div class="absolute inset-0 opacity-10" style="background-image:radial-gradient(circle at 20% 50%,white 1px,transparent 1px),radial-gradient(circle at 80% 20%,white 1px,transparent 1px);background-size:60px 60px"></div>' +
    '<div class="relative">' +

    // Level badge + title
    '<div class="flex items-center gap-3 mb-5">' +
      '<div class="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center" style="font-size:32px">' + lv.emoji + '</div>' +
      '<div class="flex-1">' +
        '<div class="flex items-center gap-2 mb-0.5">' +
          '<span class="px-2 py-0.5 rounded-md bg-white/25 text-[10px] font-black tracking-wider">Lv.' + lv.level + '</span>' +
          (s.current_streak >= 2 ? '<span class="px-1.5 py-0.5 rounded-md bg-orange-400/30 text-[9px] font-bold">🔥 ' + s.current_streak + '연속</span>' : '') +
        '</div>' +
        '<h2 class="text-lg font-black">' + lv.title + '</h2>' +
        '<p class="text-[10px] text-white/60">' + s.total_sessions + '회 상담 분석 기반</p>' +
      '</div>' +
      '<div class="text-center">' +
        '<p class="text-3xl font-black leading-none">' + score + '</p>' +
        '<p class="text-[9px] text-white/60">최근 점수</p>' +
      '</div>' +
    '</div>' +

    // EXP bar
    '<div class="mb-4">' +
      '<div class="flex items-center justify-between mb-1.5">' +
        '<span class="text-[10px] font-semibold text-white/80">' +
          (next ? 'Lv.' + next.level + ' ' + next.title + '까지' : '🏆 MAX LEVEL 달성!') +
        '</span>' +
        '<span class="text-[10px] font-bold text-white/90">' +
          (next ? exp.toNext + '점 남음' : '100%') +
        '</span>' +
      '</div>' +
      '<div class="h-3 bg-white/15 rounded-full overflow-hidden">' +
        '<div class="h-full bg-white/40 rounded-full transition-all duration-1000 relative overflow-hidden" style="width:' + exp.percent + '%">' +
          '<div class="absolute inset-0" style="background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);animation:shimmer 2s infinite;background-size:200% 100%"></div>' +
        '</div>' +
      '</div>' +
      (next ? '<p class="text-[9px] text-white/50 mt-1 text-center">' + exp.percent + '% 달성 · ' + next.emoji + ' ' + next.title + '이 기다리고 있어요!</p>' : '') +
    '</div>' +

    // Stats row
    '<div class="grid grid-cols-4 gap-2">' +
      '<div class="bg-white/10 rounded-xl p-2 text-center">' +
        '<p class="text-lg font-black leading-none">' + (s.overall_avg || 0) + '</p>' +
        '<p class="text-[8px] text-white/60 mt-0.5">평균</p></div>' +
      '<div class="bg-white/10 rounded-xl p-2 text-center">' +
        '<div class="flex items-center justify-center gap-0.5">' +
          '<i class="fas ' + growthIcon + ' text-[10px]"></i>' +
          '<p class="text-lg font-black leading-none">' + growthSign + s.total_growth + '</p></div>' +
        '<p class="text-[8px] text-white/60 mt-0.5">성장</p></div>' +
      '<div class="bg-white/10 rounded-xl p-2 text-center">' +
        '<p class="text-lg font-black leading-none">' + (s.personal_best || 0) + '</p>' +
        '<p class="text-[8px] text-white/60 mt-0.5">최고</p></div>' +
      '<div class="bg-white/10 rounded-xl p-2 text-center">' +
        '<p class="text-lg font-black leading-none">' + (s.best_streak || 0) + '</p>' +
        '<p class="text-[8px] text-white/60 mt-0.5">최장연속</p></div>' +
    '</div>' +

    '</div></div>';

  // === LEVEL ROADMAP ===
  html += '<div class="card-premium p-4 mb-4">' +
    '<div class="flex items-center gap-2 mb-3">' +
      '<div class="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center"><i class="fas fa-road text-amber-500 text-[10px]"></i></div>' +
      '<h3 class="text-sm font-bold text-surface-900">레벨 로드맵</h3>' +
    '</div>' +
    '<div class="flex items-center gap-1">';
  
  LEVELS.forEach(function(l) {
    var isActive = lv.level >= l.level;
    var isCurrent = lv.level === l.level;
    html += '<div class="flex-1 text-center' + (isCurrent ? ' relative' : '') + '">' +
      (isCurrent ? '<div class="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded whitespace-nowrap">현재</div>' : '') +
      '<div class="w-full h-2 rounded-full mb-1 ' + (isActive ? 'bg-gradient-to-r ' + l.gradient : 'bg-surface-100') + '"></div>' +
      '<span style="font-size:' + (isCurrent ? '18' : '12') + 'px">' + l.emoji + '</span>' +
      '<p class="text-[8px] ' + (isActive ? 'text-surface-700 font-semibold' : 'text-surface-300') + '">' + l.min + '+</p>' +
    '</div>';
  });
  html += '</div></div>';

  // === LINE CHART: Score Trend ===
  html += '<div class="card-premium p-4 mb-4">' +
    '<div class="flex items-center gap-2 mb-3">' +
      '<div class="w-6 h-6 rounded-lg bg-brand-50 flex items-center justify-center"><i class="fas fa-chart-line text-brand-500 text-[10px]"></i></div>' +
      '<h3 class="text-sm font-bold text-surface-900">점수 흐름</h3>' +
      '<span class="ml-auto text-[10px] text-surface-400">세션별</span>' +
    '</div>' +
    '<div style="height:200px"><canvas id="scoreLineChart"></canvas></div>' +
  '</div>';

  // === RADAR CHART: Area Comparison ===
  html += '<div class="card-premium p-4 mb-4">' +
    '<div class="flex items-center gap-2 mb-3">' +
      '<div class="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center"><i class="fas fa-spider text-purple-500 text-[10px]"></i></div>' +
      '<h3 class="text-sm font-bold text-surface-900">영역별 변화</h3>' +
      '<span class="ml-auto text-[10px] text-surface-400">초기 vs 최근</span>' +
    '</div>' +
    '<div style="height:250px"><canvas id="areaRadarChart"></canvas></div>' +
  '</div>';

  // === AREA TREND CARDS ===
  html += '<div class="card-premium p-4 mb-4">' +
    '<div class="flex items-center gap-2 mb-3">' +
      '<div class="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center"><i class="fas fa-chart-bar text-emerald-500 text-[10px]"></i></div>' +
      '<h3 class="text-sm font-bold text-surface-900">영역별 성장 현황</h3>' +
    '</div>' +
    '<div class="space-y-2">';

  var areaColors = {rapport:'pink', spin:'purple', objection:'sky', pricing:'emerald', closing:'amber', structure:'orange'};
  var areaMax = {rapport:20, spin:25, objection:20, pricing:15, closing:10, structure:10};
  areaTrend.sort(function(a, b) { return b.delta - a.delta; });

  areaTrend.forEach(function(a) {
    var dColor = a.delta > 0 ? 'emerald' : a.delta < 0 ? 'rose' : 'surface';
    var dSign = a.delta > 0 ? '+' : '';
    var maxVal = areaMax[a.area] || 25;
    var pct = Math.round((a.recent_avg / maxVal) * 100);

    html += '<div class="flex items-center gap-3 py-2">' +
      '<div class="w-20 shrink-0">' +
        '<p class="text-xs font-semibold text-surface-700">' + a.label + '</p>' +
        '<p class="text-[10px] text-surface-400">' + a.early_avg + ' → ' + a.recent_avg + '</p>' +
      '</div>' +
      '<div class="flex-1 bg-surface-100 rounded-full h-2 overflow-hidden">' +
        '<div class="bg-' + (areaColors[a.area] || 'brand') + '-500 h-2 rounded-full transition-all" style="width:' + pct + '%"></div>' +
      '</div>' +
      '<span class="text-xs font-bold text-' + dColor + '-600 w-12 text-right">' + dSign + a.delta + '</span>' +
    '</div>';
  });
  html += '</div></div>';

  // === SESSION HISTORY LIST ===
  html += '<div class="card-premium p-4 mb-4">' +
    '<div class="flex items-center gap-2 mb-3">' +
      '<div class="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center"><i class="fas fa-history text-amber-500 text-[10px]"></i></div>' +
      '<h3 class="text-sm font-bold text-surface-900">상담 기록</h3>' +
      '<span class="ml-auto text-[10px] text-surface-400">' + sessions.length + '회</span>' +
    '</div>' +
    '<div class="space-y-1.5 max-h-80 overflow-y-auto">';

  sessions.slice().reverse().forEach(function(sess, i) {
    var sc = sess.total_score || 0;
    var sessLv = getLevel(sc);
    var sColor = sc >= 80 ? 'emerald' : sc >= 60 ? 'brand' : sc >= 40 ? 'amber' : 'rose';
    var dateStr = sess.consultation_date ? sess.consultation_date.split('T')[0].slice(5) : '-';
    var pbBadge = sess.is_personal_best ? '<span class="text-[8px] px-1 py-0.5 rounded bg-amber-100 text-amber-600 font-bold ml-1">🏆 PB</span>' : '';
    // Check level-up from previous session
    var prevSess = sessions.slice().reverse()[i + 1];
    var lvUpBadge = '';
    if (prevSess) {
      var prevLv = getLevel(prevSess.total_score || 0);
      if (sessLv.level > prevLv.level) lvUpBadge = '<span class="text-[8px] px-1 py-0.5 rounded bg-brand-100 text-brand-600 font-bold ml-1">⬆️ LEVEL UP</span>';
    }

    html += '<a href="/consultations/' + sess.id + '/report" class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-50 transition-colors">' +
      '<div class="w-8 text-center shrink-0">' +
        '<span style="font-size:16px">' + sessLv.emoji + '</span>' +
        '<p class="text-[9px] text-surface-500">' + dateStr + '</p>' +
      '</div>' +
      '<div class="flex-1 min-w-0">' +
        '<p class="text-xs font-medium text-surface-800 truncate">' +
          (sess.patient_name || '미지정') + (sess.treatment_type ? ' · ' + sess.treatment_type : '') +
          pbBadge + lvUpBadge +
        '</p>' +
        '<p class="text-[10px] text-surface-400 truncate">' +
          '<span class="text-' + sessLv.color + '-600 font-semibold">Lv.' + sessLv.level + '</span> · ' +
          (sess.top_strength ? '✅ ' + sess.top_strength.slice(0, 25) : '#' + sess.session_number) +
        '</p>' +
      '</div>' +
      '<div class="text-right shrink-0">' +
        '<p class="text-lg font-black text-' + sColor + '-600">' + sc + '</p>' +
        '<p class="text-[9px] text-surface-400">avg ' + (sess.running_avg || 0) + '</p>' +
      '</div>' +
    '</a>';
  });
  html += '</div></div>';

  // === v8.0: SCORE-REVENUE PROOF (placeholder, async fill) ===
  html += '<div id="scoreRevenueSection"></div>';

  container.innerHTML = html;

  // === RENDER CHARTS ===
  setTimeout(function() {
    renderScoreLineChart(sessions);
    renderAreaRadarChart(areaTrend);
    loadScoreRevenue();
  }, 100);
}

// =========================================
// v8.0: 점수-매출 상관 위젯 — "내 점수가 오르면 매출이 오른다"
// =========================================
async function loadScoreRevenue() {
  var el = document.getElementById('scoreRevenueSection');
  if (!el) return;
  try {
    var res = await fetch('/api/dashboard/score-revenue?days=90');
    if (!res.ok) return;
    var json = await res.json();
    if (!json.success || !json.data) return;
    renderScoreRevenue(el, json.data);
  } catch(e) { console.error('score-revenue error:', e); }
}

function renderScoreRevenue(el, d) {
  var buckets = d.buckets || [];
  if (buckets.length === 0) return;

  var html = '<div class="bg-white rounded-2xl border border-surface-100 p-4 mt-4">' +
    '<div class="flex items-center justify-between mb-3">' +
      '<h3 class="text-sm font-bold text-surface-800"><i class="fas fa-coins text-amber-500 mr-1.5"></i>점수가 매출이 되는 증거</h3>' +
      '<span class="text-[10px] text-surface-400">최근 90일</span>' +
    '</div>';

  // 인사이트 배너
  if (d.insight && d.insight.message) {
    var positive = d.insight.conversion_gap > 0;
    html += '<div class="rounded-xl px-3 py-2.5 mb-3 text-xs font-medium ' +
      (positive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-surface-50 text-surface-500 border border-surface-100') + '">' +
      '<i class="fas ' + (positive ? 'fa-arrow-trend-up' : 'fa-hourglass-half') + ' mr-1"></i>' +
      esc(d.insight.message) + '</div>';
  }

  // 구간별 바
  var maxConv = Math.max.apply(null, buckets.map(function(b){ return b.conversion_rate || 0; }).concat([1]));
  var colors = { '60점 미만': 'bg-red-400', '60-69점': 'bg-amber-400', '70-79점': 'bg-sky-400', '80점 이상': 'bg-emerald-500' };
  html += '<div class="space-y-2">';
  buckets.forEach(function(b) {
    var w = Math.max(4, Math.round((b.conversion_rate / maxConv) * 100));
    var amt = b.paid_amount ? (b.paid_amount >= 10000000 ? (Math.round(b.paid_amount / 1000000) / 10) + '천만' : Math.round(b.paid_amount / 10000).toLocaleString() + '만') : '0';
    html += '<div class="flex items-center gap-2">' +
      '<span class="text-[10px] font-semibold text-surface-500 w-14 shrink-0">' + esc(b.bucket) + '</span>' +
      '<div class="flex-1 h-6 bg-surface-50 rounded-lg overflow-hidden relative">' +
        '<div class="h-full rounded-lg ' + (colors[b.bucket] || 'bg-surface-300') + ' transition-all" style="width:' + w + '%"></div>' +
        '<span class="absolute inset-y-0 left-2 flex items-center text-[10px] font-bold text-surface-700">' + b.conversion_rate + '%</span>' +
      '</div>' +
      '<span class="text-[10px] text-surface-400 w-16 text-right shrink-0">' + b.paid_count + '/' + b.consultation_count + '건 · ' + amt + '</span>' +
    '</div>';
  });
  html += '</div>' +
    '<p class="text-[9px] text-surface-300 mt-2">구간별 결제 전환율 · 건수 · 결제금액</p>' +
  '</div>';

  el.innerHTML = html;
}

function renderScoreLineChart(sessions) {
  var ctx = document.getElementById('scoreLineChart');
  if (!ctx) return;

  var labels = sessions.map(function(s) { return '#' + s.session_number; });
  var scores = sessions.map(function(s) { return s.total_score || 0; });
  var avgLine = sessions.map(function(s) { return s.running_avg || 0; });

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: '점수',
          data: scores,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99,102,241,0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#6366f1',
          borderWidth: 2,
        },
        {
          label: '누적 평균',
          data: avgLine,
          borderColor: '#f59e0b',
          borderDash: [5, 5],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
          tension: 0.4,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { boxWidth: 12, font: { size: 10 }, padding: 8 }
        },
        tooltip: {
          backgroundColor: '#1e293b',
          titleFont: { size: 11 },
          bodyFont: { size: 10 },
          callbacks: {
            title: function(items) {
              var i = items[0].dataIndex;
              var s = sessions[i];
              return '세션 #' + s.session_number + (s.patient_name ? ' · ' + s.patient_name : '');
            }
          }
        }
      },
      scales: {
        y: {
          min: 0, max: 100,
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: { font: { size: 9 }, stepSize: 20 }
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 8 }, maxRotation: 0 }
        }
      }
    }
  });
}

function renderAreaRadarChart(areaTrend) {
  var ctx = document.getElementById('areaRadarChart');
  if (!ctx) return;

  var labels = areaTrend.map(function(a) { return a.label; });
  var earlyData = areaTrend.map(function(a) { return a.early_avg; });
  var recentData = areaTrend.map(function(a) { return a.recent_avg; });

  // Normalize to percentage
  var areaMax = { '라포형성':20, 'SPIN질문':25, '반론처리':20, '가격프레이밍':15, '클로징':10, '상담구조':10 };
  var earlyPct = areaTrend.map(function(a) { return Math.round((a.early_avg / (areaMax[a.label] || 20)) * 100); });
  var recentPct = areaTrend.map(function(a) { return Math.round((a.recent_avg / (areaMax[a.label] || 20)) * 100); });

  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [
        {
          label: '초기',
          data: earlyPct,
          borderColor: 'rgba(203,213,225,0.8)',
          backgroundColor: 'rgba(203,213,225,0.15)',
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#cbd5e1',
        },
        {
          label: '최근',
          data: recentPct,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99,102,241,0.15)',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#6366f1',
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { boxWidth: 12, font: { size: 10 }, padding: 8 }
        }
      },
      scales: {
        r: {
          min: 0, max: 100,
          ticks: { font: { size: 8 }, stepSize: 25, showLabelBackdrop: false },
          pointLabels: { font: { size: 10, weight: 'bold' } },
          grid: { color: 'rgba(0,0,0,0.06)' }
        }
      }
    }
  });
}

// esc() is defined globally in renderer.tsx (escapeHtml)

loadGrowthData();
