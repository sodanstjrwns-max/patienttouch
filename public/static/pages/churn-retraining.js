// v7.6: AI 이탈 예측 모델 재학습 대시보드
var weeklyTrendChartInstance = null;

async function loadRetrainingDashboard() {
  try {
    await requireAuth();
    await Promise.all([loadRetrainingStats(), loadRecentFeedback()]);
  } catch (err) {
    console.error('Failed to load retraining dashboard:', err);
  }
}

async function loadRetrainingStats() {
  try {
    var res = await fetch('/api/retention/predictions/retraining-stats');
    var data = await res.json();
    if (!data.success) {
      showToast('통계 데이터를 불러올 수 없습니다', 'error');
      return;
    }
    var d = data.data;
    renderHero(d.retraining);
    renderOverview(d.overview);
    renderAIMetrics(d.ai_metrics, d.rule_based_metrics, d.ai_vs_rule_delta);
    renderRiskBreakdown(d.risk_breakdown);
    renderWeeklyTrend(d.weekly_trend);
  } catch (e) {
    console.warn('Retraining stats load failed:', e);
  }
}

function renderHero(r) {
  if (!r) return;
  var statusEl = document.getElementById('retrainingStatus');
  var reasonEl = document.getElementById('retrainingReason');
  var actionsEl = document.getElementById('retrainingActions');
  var heroEl = document.getElementById('retrainingHero');

  var labels = {
    'not_ready':    { icon: '🔍', text: '데이터 수집 중', gradient: 'from-slate-500 via-slate-600 to-slate-700' },
    'optional':     { icon: '✅', text: '모델 안정적', gradient: 'from-emerald-500 via-emerald-600 to-teal-600' },
    'recommended':  { icon: '📈', text: '재학습 권장', gradient: 'from-indigo-500 via-purple-600 to-pink-500' },
    'urgent':       { icon: '🚨', text: '즉시 재학습 필요', gradient: 'from-rose-500 via-red-600 to-orange-500' },
  };
  var info = labels[r.recommendation] || labels['not_ready'];

  if (statusEl) statusEl.innerHTML = info.icon + ' ' + info.text;
  if (reasonEl) reasonEl.textContent = r.reason || '';

  if (heroEl) {
    // 그라데이션 클래스 교체
    heroEl.className = 'card-premium p-5 bg-gradient-to-br ' + info.gradient + ' text-white border-0 shadow-lg shadow-purple-500/30 relative overflow-hidden';
  }

  if (actionsEl && r.actions && r.actions.length > 0) {
    actionsEl.innerHTML = r.actions.map(function(a) {
      return '<div class="flex items-start gap-2 text-[11px] text-white/90"><i class="fas fa-chevron-right text-[8px] mt-1 text-white/60"></i><span>' + esc(a) + '</span></div>';
    }).join('');
  }

  if (r.next_threshold) {
    actionsEl.innerHTML += '<div class="mt-2.5 px-2.5 py-1.5 bg-white/15 backdrop-blur rounded-lg text-[10px] text-white/95"><i class="fas fa-flag-checkered mr-1"></i>다음 임계점: <b>' + r.next_threshold + '건</b> 피드백 누적 시 재평가</div>';
  }
}

function renderOverview(o) {
  if (!o) return;
  var setText = function(id, val) { var el = document.getElementById(id); if (el) el.textContent = (val !== null && val !== undefined ? val : 0).toLocaleString(); };
  setText('totalPredictions', o.total_predictions);
  setText('totalFeedback', o.total_feedback);
  var fbRateEl = document.getElementById('feedbackRate');
  if (fbRateEl) fbRateEl.textContent = (o.feedback_rate || 0).toFixed(1);
}

function renderAIMetrics(ai, rule, delta) {
  if (!ai) return;
  var setText = function(id, val, suffix) {
    var el = document.getElementById(id);
    if (el) el.textContent = (val !== null && val !== undefined ? val : 0) + (suffix || '');
  };
  setText('aiAccuracy', ai.accuracy, '%');
  setText('f1Score', ai.f1_score || 0);
  setText('ruleAccuracy', (rule && rule.accuracy) || 0, '%');
  setText('precisionScore', ai.precision || 0, '%');
  setText('recallScore', ai.recall || 0, '%');

  var deltaEl = document.getElementById('aiVsRule');
  if (deltaEl) {
    var d = delta || 0;
    var sign = d > 0 ? '+' : '';
    deltaEl.textContent = sign + d.toFixed(1) + 'p';
  }

  // Confusion matrix
  var cm = ai.confusion_matrix || {};
  document.getElementById('cmTP').textContent = (cm.true_positive || 0).toLocaleString();
  document.getElementById('cmFP').textContent = (cm.false_positive || 0).toLocaleString();
  document.getElementById('cmFN').textContent = (cm.false_negative || 0).toLocaleString();
  document.getElementById('cmTN').textContent = (cm.true_negative || 0).toLocaleString();
}

function renderRiskBreakdown(breakdown) {
  if (!breakdown) return;
  var container = document.getElementById('riskBreakdown');
  if (!container) return;

  var styles = {
    'critical': { color: 'rose', label: '🚨 Critical', desc: '85점 이상' },
    'high':     { color: 'amber', label: '⚠️ High', desc: '70-84점' },
    'medium':   { color: 'sky',   label: '🔵 Medium', desc: '55-69점' },
    'low':      { color: 'emerald', label: '🟢 Low', desc: '0-54점' },
  };

  container.innerHTML = breakdown.map(function(b) {
    var s = styles[b.risk_level] || styles['low'];
    var acc = b.accuracy;
    var accDisplay = acc === null ? '<span class="text-surface-400">데이터 부족</span>' : '<b class="text-' + s.color + '-700">' + acc + '%</b>';
    var feedbackRate = b.total_predictions > 0
      ? Math.round((b.feedback_count / b.total_predictions) * 1000) / 10
      : 0;
    return '<div class="p-4 hover:bg-surface-50/50 transition-all">' +
      '<div class="flex items-center justify-between mb-2">' +
        '<div>' +
          '<p class="text-sm font-bold text-' + s.color + '-700">' + s.label + '</p>' +
          '<p class="text-[10px] text-surface-400">' + s.desc + ' · 예측 ' + b.total_predictions + '건 / 피드백 ' + b.feedback_count + '건 (' + feedbackRate + '%)</p>' +
        '</div>' +
        '<div class="text-right">' +
          '<p class="text-[10px] text-surface-400">적중률</p>' +
          '<p class="text-base font-black">' + accDisplay + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="flex items-center gap-2 text-[10px] text-surface-500">' +
        '<span><i class="fas fa-arrow-right-from-bracket text-rose-400 mr-1"></i>실제 이탈 <b>' + b.actual_churned + '</b></span>' +
        '<span><i class="fas fa-heart text-emerald-400 mr-1"></i>실제 유지 <b>' + b.actual_retained + '</b></span>' +
      '</div>' +
    '</div>';
  }).join('');
}

function renderWeeklyTrend(trend) {
  var canvas = document.getElementById('weeklyTrendChart');
  if (!canvas || !window.Chart) return;

  if (!trend || trend.length === 0) {
    var parent = canvas.parentElement;
    if (parent) {
      canvas.style.display = 'none';
      var emptyEl = parent.querySelector('.empty-trend');
      if (!emptyEl) {
        var d = document.createElement('div');
        d.className = 'empty-trend text-center py-8 text-surface-400 text-xs';
        d.innerHTML = '<i class="fas fa-chart-line text-3xl text-surface-200 mb-2"></i><p>아직 주별 데이터가 부족합니다</p>';
        parent.appendChild(d);
      }
    }
    return;
  }

  if (weeklyTrendChartInstance) weeklyTrendChartInstance.destroy();

  weeklyTrendChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: trend.map(function(t) { return t.week; }),
      datasets: [
        {
          label: '정확도 (%)',
          data: trend.map(function(t) { return t.accuracy; }),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y',
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: '피드백 건수',
          data: trend.map(function(t) { return t.feedback_count; }),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.05)',
          fill: false,
          tension: 0.3,
          yAxisID: 'y1',
          borderDash: [4, 4],
          borderWidth: 2,
          pointRadius: 3,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } }
      },
      scales: {
        y: {
          beginAtZero: true, max: 100, position: 'left',
          title: { display: true, text: '정확도 (%)', font: { size: 10 } }
        },
        y1: {
          beginAtZero: true, position: 'right', grid: { drawOnChartArea: false },
          title: { display: true, text: '피드백 건수', font: { size: 10 } }
        }
      }
    }
  });
}

async function loadRecentFeedback() {
  try {
    var res = await fetch('/api/retention/predictions/recent-feedback?limit=20');
    var data = await res.json();
    var container = document.getElementById('recentFeedback');
    if (!container) return;

    if (!data.success || !data.data || data.data.length === 0) {
      container.innerHTML = '<div class="p-8 text-center"><div class="w-14 h-14 mx-auto bg-violet-50 rounded-2xl flex items-center justify-center mb-3"><i class="fas fa-list-check text-violet-300 text-xl"></i></div><p class="text-xs text-surface-500">아직 피드백 데이터가 없습니다</p><p class="text-[10px] text-surface-400 mt-1"><a href="/retention/churn" class="text-brand-600 font-semibold">예측 화면</a>에서 실제 결과를 기록해주세요</p></div>';
      return;
    }

    // 오답을 먼저, 정답을 나중에
    var sorted = data.data.slice().sort(function(a, b) {
      if (a.is_correct !== b.is_correct) return a.is_correct ? 1 : -1;
      return 0;
    });

    var caseLabels = {
      'true_positive':  { icon: '✅', color: 'emerald', label: '정확하게 이탈 예측' },
      'true_negative':  { icon: '✅', color: 'emerald', label: '정확하게 유지 예측' },
      'false_positive': { icon: '⚠️', color: 'rose',    label: '과잉 경보 (놓치지 마세요)' },
      'false_negative': { icon: '🚨', color: 'red',     label: '놓친 이탈 (학습 자료)' },
    };

    container.innerHTML = sorted.map(function(r) {
      var cl = caseLabels[r.case_type] || caseLabels['true_positive'];
      var riskColor = {
        'critical': 'rose',
        'high': 'amber',
        'medium': 'sky',
        'low': 'emerald'
      }[r.risk_level] || 'slate';

      return '<div class="p-3.5 hover:bg-surface-50/50 transition-all">' +
        '<div class="flex items-center justify-between mb-1.5">' +
          '<div class="flex items-center gap-2">' +
            '<span class="text-base">' + cl.icon + '</span>' +
            '<div>' +
              '<p class="text-sm font-bold text-surface-900">' + esc(r.patient_name || '환자') + '</p>' +
              '<p class="text-[10px] text-' + cl.color + '-600 font-semibold">' + cl.label + '</p>' +
            '</div>' +
          '</div>' +
          '<span class="text-[10px] font-bold text-' + riskColor + '-700 bg-' + riskColor + '-50 px-2 py-0.5 rounded-md">' + r.risk_level.toUpperCase() + ' ' + r.churn_probability + '점</span>' +
        '</div>' +
        '<div class="flex items-center justify-between text-[10px] text-surface-500">' +
          '<span><i class="fas fa-' + (r.actual_outcome === 'churned' ? 'arrow-right-from-bracket text-rose-400' : 'heart text-emerald-400') + ' mr-1"></i>실제: ' + (r.actual_outcome === 'churned' ? '이탈' : '유지') + '</span>' +
          '<span>' + fmtDate(r.feedback_at) + '</span>' +
        '</div>' +
        (r.feedback_note ? '<p class="mt-1.5 text-[10px] text-surface-600 bg-surface-50 px-2 py-1 rounded">' + esc(r.feedback_note) + '</p>' : '') +
      '</div>';
    }).join('');
  } catch (e) {
    console.warn('Recent feedback load failed:', e);
  }
}

document.addEventListener('DOMContentLoaded', loadRetrainingDashboard);
