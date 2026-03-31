// =========================================
// GROWTH TRACKER PAGE - Consultation Growth Visualization
// =========================================

async function loadGrowthData() {
  try {
    // Auth check
    var authRes = await fetch('/api/auth/me');
    var authData = await authRes.json();
    if (!authData.success) { window.location.href = '/login'; return; }

    // Fetch growth data
    var [sessionsRes, trendRes] = await Promise.all([
      fetch('/api/dashboard/growth-sessions?limit=30'),
      fetch('/api/dashboard/coaching-trend?weeks=12')
    ]);
    var sessionsData = await sessionsRes.json();
    var trendData = await trendRes.json();

    if (!sessionsData.success) {
      showEmpty('성장 데이터를 불러올 수 없습니다.');
      return;
    }

    document.getElementById('growthLoading').classList.add('hidden');
    var d = sessionsData.data;
    var t = trendData.success ? trendData.data : null;

    if (!d.sessions || d.sessions.length === 0) {
      showEmpty('아직 분석된 상담이 없습니다. 상담을 녹음하면 성장 데이터가 쌓입니다!');
      return;
    }

    renderGrowthPage(d, t);
  } catch(e) {
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
    '</div>';
}

function renderGrowthPage(data, trend) {
  var s = data.stats;
  var sessions = data.sessions;
  var areaTrend = data.area_trend;
  var container = document.getElementById('growthContent');

  var html = '';

  // === HERO STATS ===
  var growthColor = s.total_growth > 0 ? 'emerald' : s.total_growth < 0 ? 'rose' : 'surface';
  var growthSign = s.total_growth > 0 ? '+' : '';
  var growthIcon = s.total_growth > 0 ? 'fa-arrow-trend-up' : s.total_growth < 0 ? 'fa-arrow-trend-down' : 'fa-equals';

  html += '<div class="bg-gradient-to-br from-brand-500 to-purple-600 rounded-3xl p-5 text-white mb-5 shadow-xl shadow-brand-500/20">' +
    '<div class="flex items-center gap-2 mb-4">' +
      '<div class="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center"><i class="fas fa-chart-line text-sm"></i></div>' +
      '<div><h2 class="text-sm font-bold">나의 상담 성장</h2>' +
        '<p class="text-[10px] text-white/60">' + s.total_sessions + '회 상담 분석 기반</p></div>' +
    '</div>' +

    '<div class="grid grid-cols-3 gap-3 mb-4">' +
      '<div class="text-center">' +
        '<p class="text-3xl font-black">' + (s.latest_score || 0) + '</p>' +
        '<p class="text-[10px] text-white/60 mt-0.5">최근 점수</p></div>' +
      '<div class="text-center">' +
        '<p class="text-3xl font-black">' + (s.overall_avg || 0) + '</p>' +
        '<p class="text-[10px] text-white/60 mt-0.5">전체 평균</p></div>' +
      '<div class="text-center">' +
        '<div class="flex items-center justify-center gap-1">' +
          '<i class="fas ' + growthIcon + ' text-sm"></i>' +
          '<p class="text-3xl font-black">' + growthSign + s.total_growth + '</p></div>' +
        '<p class="text-[10px] text-white/60 mt-0.5">총 성장</p></div>' +
    '</div>' +

    '<div class="flex gap-2">' +
      '<div class="flex-1 bg-white/10 rounded-xl p-2.5 text-center">' +
        '<p class="text-lg font-black">' + (s.personal_best || 0) + '<span class="text-xs text-white/60">점</span></p>' +
        '<p class="text-[9px] text-white/60">최고 기록</p></div>' +
      '<div class="flex-1 bg-white/10 rounded-xl p-2.5 text-center">' +
        '<p class="text-lg font-black">' + (s.best_streak || 0) + '<span class="text-xs text-white/60">회</span></p>' +
        '<p class="text-[9px] text-white/60">최장 연속 향상</p></div>' +
      '<div class="flex-1 bg-white/10 rounded-xl p-2.5 text-center">' +
        '<p class="text-lg font-black">' + (s.current_streak || 0) + '<span class="text-xs text-white/60">회</span></p>' +
        '<p class="text-[9px] text-white/60">현재 연속</p></div>' +
    '</div>' +
  '</div>';

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
    var sColor = sc >= 80 ? 'emerald' : sc >= 60 ? 'brand' : sc >= 40 ? 'amber' : 'rose';
    var dateStr = sess.consultation_date ? sess.consultation_date.split('T')[0].slice(5) : '-';
    var pbBadge = sess.is_personal_best ? '<span class="text-[8px] px-1 py-0.5 rounded bg-amber-100 text-amber-600 font-bold ml-1">🏆 PB</span>' : '';
    var gradeBadge = sess.grade ? '<span class="text-[9px] font-bold text-' + sColor + '-600 ml-1">' + sess.grade + '</span>' : '';

    html += '<a href="/consultations/' + sess.id + '/report" class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-50 transition-colors">' +
      '<div class="w-8 text-center shrink-0">' +
        '<p class="text-[10px] text-surface-400">#' + sess.session_number + '</p>' +
        '<p class="text-[9px] text-surface-500">' + dateStr + '</p>' +
      '</div>' +
      '<div class="flex-1 min-w-0">' +
        '<p class="text-xs font-medium text-surface-800 truncate">' +
          (sess.patient_name || '미지정') + (sess.treatment_type ? ' · ' + sess.treatment_type : '') +
          pbBadge + gradeBadge +
        '</p>' +
        '<p class="text-[10px] text-surface-400 truncate">' +
          (sess.top_strength ? '✅ ' + sess.top_strength.slice(0, 30) : '') +
        '</p>' +
      '</div>' +
      '<div class="text-right shrink-0">' +
        '<p class="text-lg font-black text-' + sColor + '-600">' + sc + '</p>' +
        '<p class="text-[9px] text-surface-400">avg ' + (sess.running_avg || 0) + '</p>' +
      '</div>' +
    '</a>';
  });
  html += '</div></div>';

  container.innerHTML = html;

  // === RENDER CHARTS ===
  setTimeout(function() {
    renderScoreLineChart(sessions);
    renderAreaRadarChart(areaTrend);
  }, 100);
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

function esc(s) { if (!s) return ''; var d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }

loadGrowthData();
