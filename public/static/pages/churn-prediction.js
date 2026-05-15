// AI 이탈 예측 페이지 (v7.4)
// "필요한 진료를 받지 못하는 사람이 없도록" — 페이션트 퍼널 철학

(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);

  // ---- API helpers ----
  function getToken() {
    return localStorage.getItem('auth_token') || '';
  }

  async function api(path, opts = {}) {
    const token = getToken();
    const res = await fetch(path, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(opts.headers || {}),
      },
    });
    if (res.status === 401) {
      window.location.href = '/login';
      throw new Error('unauthorized');
    }
    return res.json();
  }

  function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ---- Risk level styling ----
  const RISK_STYLE = {
    critical: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-500', emoji: '🔴', label: '즉시 액션' },
    high:     { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-500', emoji: '🟠', label: '7일 내' },
    medium:   { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-500', emoji: '🟡', label: '모니터링' },
    low:      { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-500', emoji: '🟢', label: '안정' },
  };

  let currentPredictions = [];
  let currentFilter = 'all';

  // ---- Render rescue hero (살릴 수 있는 매출) ----
  function renderRescueHero(predictions) {
    const hero = $('rescueHero');
    if (!hero) return;
    const highRisk = predictions.filter(p => p.risk_level === 'critical' || p.risk_level === 'high');
    if (highRisk.length === 0) {
      hero.classList.add('hidden');
      return;
    }
    let totalRescue = 0;
    let avgProb = 0;
    let minWindow = 999;
    for (const p of highRisk) {
      const features = p.features_snapshot || p.features || {};
      totalRescue += Number(features.pending_treatment_amount) || 0;
      avgProb += p.churn_probability;
      minWindow = Math.min(minWindow, p.predicted_window_days || 999);
    }
    avgProb = Math.round(avgProb / highRisk.length);
    const rescueManwon = Math.round(totalRescue / 10000).toLocaleString('ko-KR');
    
    $('rescueAmount').textContent = rescueManwon;
    $('rescueCount').textContent = highRisk.length;
    $('rescueAvg').textContent = avgProb;
    $('rescueWindow').textContent = minWindow < 999 ? `${minWindow}일내` : '-';
    hero.classList.remove('hidden');
  }

  // ---- Render summary cards ----
  function renderSummary(summary) {
    const el = $('summaryCards');
    el.innerHTML = `
      <div class="bg-white rounded-xl p-2.5 border border-rose-100 text-center">
        <p class="text-lg font-bold text-rose-600">${summary.critical || 0}</p>
        <p class="text-[10px] text-surface-500">즉시</p>
      </div>
      <div class="bg-white rounded-xl p-2.5 border border-orange-100 text-center">
        <p class="text-lg font-bold text-orange-600">${summary.high || 0}</p>
        <p class="text-[10px] text-surface-500">7일내</p>
      </div>
      <div class="bg-white rounded-xl p-2.5 border border-amber-100 text-center">
        <p class="text-lg font-bold text-amber-600">${summary.medium || 0}</p>
        <p class="text-[10px] text-surface-500">모니터링</p>
      </div>
      <div class="bg-white rounded-xl p-2.5 border border-emerald-100 text-center">
        <p class="text-lg font-bold text-emerald-600">${summary.low || 0}</p>
        <p class="text-[10px] text-surface-500">안정</p>
      </div>
    `;
    el.classList.remove('hidden');
    el.classList.add('grid');
  }

  // ---- Render prediction list ----
  function renderList(predictions) {
    const el = $('predictionList');
    const filtered = currentFilter === 'all' 
      ? predictions 
      : predictions.filter(p => p.risk_level === currentFilter);
    
    if (filtered.length === 0) {
      el.innerHTML = '<p class="text-center text-sm text-surface-400 py-8">해당 위험도 환자가 없습니다</p>';
      el.classList.remove('hidden');
      return;
    }

    el.innerHTML = filtered.map(p => {
      const style = RISK_STYLE[p.risk_level] || RISK_STYLE.medium;
      const features = p.features_snapshot || p.features || {};
      const pendingManwon = Math.round((features.pending_treatment_amount || 0) / 10000);
      const factors = (p.key_risk_factors || []).slice(0, 3);
      
      return `
        <article class="bg-white rounded-2xl shadow-sm border ${style.border} overflow-hidden">
          <div class="${style.bg} px-4 py-2.5 flex items-center justify-between border-b ${style.border}">
            <div class="flex items-center gap-2">
              <span class="${style.badge} text-white text-[10px] font-bold px-2 py-0.5 rounded-full">${style.emoji} ${style.label}</span>
              <span class="text-xs font-semibold ${style.text}">${p.churn_probability}% 이탈확률</span>
            </div>
            <span class="text-[10px] text-surface-500">${p.predicted_window_days}일 내 예상</span>
          </div>
          <div class="p-4">
            <div class="flex items-start justify-between mb-2">
              <div>
                <h3 class="text-base font-bold text-surface-900">${escapeHtml(p.patient_name)}${features.is_vip ? ' <i class="fas fa-crown text-amber-500 text-xs ml-1"></i>' : ''}</h3>
                <p class="text-[11px] text-surface-500">${features.age ? `${features.age}세 · ` : ''}마지막 방문 ${features.days_since_last_visit || '-'}일 전</p>
              </div>
              ${pendingManwon > 0 ? `
                <div class="text-right">
                  <p class="text-[10px] text-surface-400">잔여 치료비</p>
                  <p class="text-sm font-bold text-rose-600">${pendingManwon.toLocaleString('ko-KR')}만원</p>
                </div>
              ` : ''}
            </div>
            
            ${factors.length > 0 ? `
              <div class="mt-2 mb-3">
                <p class="text-[10px] font-semibold text-surface-600 mb-1">📍 위험 요인</p>
                <div class="flex flex-wrap gap-1">
                  ${factors.map(f => `<span class="text-[10px] bg-surface-100 text-surface-700 px-2 py-0.5 rounded">${escapeHtml(f)}</span>`).join('')}
                </div>
              </div>
            ` : ''}
            
            <div class="mt-3 p-2.5 rounded-lg bg-brand-50 border border-brand-100">
              <p class="text-[10px] font-semibold text-brand-700 mb-1">💬 추천 액션</p>
              <p class="text-xs text-surface-800 mb-1.5">${escapeHtml(p.recommended_action)}</p>
              ${p.recommended_script ? `
                <p class="text-[11px] text-surface-600 italic leading-relaxed">"${escapeHtml(p.recommended_script)}"</p>
              ` : ''}
            </div>

            <div class="mt-3 flex gap-2">
              <a href="/patients/${escapeHtml(p.patient_id)}" class="flex-1 text-center text-xs font-semibold py-2 rounded-lg bg-surface-100 text-surface-700 hover:bg-surface-200">환자 보기</a>
              <button data-action="feedback-retained" data-pid="${escapeHtml(p.id)}" class="flex-1 text-xs font-semibold py-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200">✓ 유지</button>
              <button data-action="feedback-churned" data-pid="${escapeHtml(p.id)}" class="flex-1 text-xs font-semibold py-2 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200">✗ 이탈</button>
            </div>
          </div>
        </article>
      `;
    }).join('');
    el.classList.remove('hidden');
  }

  // ---- Load existing predictions ----
  async function loadExisting() {
    $('loadingState').classList.remove('hidden');
    $('loadingState').classList.add('flex');
    $('emptyState').classList.add('hidden');
    
    try {
      const res = await api('/api/retention/predictions?limit=100');
      $('loadingState').classList.add('hidden');
      
      if (!res.success || !res.data.predictions || res.data.predictions.length === 0) {
        $('emptyState').classList.remove('hidden');
        $('emptyState').classList.add('flex');
        return;
      }
      
      currentPredictions = res.data.predictions;
      renderRescueHero(currentPredictions);
      renderSummary(res.data.summary);
      $('filterTabs').classList.remove('hidden');
      $('filterTabs').classList.add('flex');
      renderList(currentPredictions);
    } catch (err) {
      console.error('Load error:', err);
      $('loadingState').classList.add('hidden');
      $('emptyState').classList.remove('hidden');
      $('emptyState').classList.add('flex');
    }
  }

  // ---- Run batch prediction ----
  async function runBatch() {
    if (!confirm('전체 환자를 대상으로 AI 이탈 예측을 실행합니다.\nOpenAI API를 사용하므로 약간의 비용이 발생할 수 있습니다.\n계속하시겠습니까?')) {
      return;
    }
    
    $('loadingState').classList.remove('hidden');
    $('loadingState').classList.add('flex');
    $('predictionList').classList.add('hidden');
    $('emptyState').classList.add('hidden');
    $('rescueHero').classList.add('hidden');
    $('summaryCards').classList.add('hidden');
    $('filterTabs').classList.add('hidden');
    
    try {
      const res = await api('/api/retention/predict-batch', {
        method: 'POST',
        body: JSON.stringify({ use_ai: true, limit: 50 }),
      });
      
      $('loadingState').classList.add('hidden');
      
      if (!res.success) {
        alert('예측 실행 실패: ' + (res.error || '알 수 없는 오류'));
        return;
      }
      
      // 예측 결과 받자마자 다시 로드 (DB에서 환자 정보 join된 상태로)
      await loadExisting();
    } catch (err) {
      console.error('Batch error:', err);
      $('loadingState').classList.add('hidden');
      alert('예측 실행 중 오류가 발생했습니다');
    }
  }

  // ---- Feedback ----
  async function sendFeedback(predId, outcome) {
    try {
      const res = await api(`/api/retention/predictions/${predId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ outcome }),
      });
      if (res.success) {
        // 해당 카드를 시각적으로 표시
        const btn = document.querySelector(`[data-pid="${predId}"]`);
        if (btn) {
          const card = btn.closest('article');
          if (card) {
            card.style.opacity = '0.5';
            const badge = document.createElement('span');
            badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 ' + 
              (outcome === 'retained' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white');
            badge.textContent = outcome === 'retained' ? '✓ 유지됨' : '✗ 이탈됨';
            const header = card.querySelector('h3');
            if (header) header.appendChild(badge);
          }
        }
      }
    } catch (err) {
      console.error('Feedback error:', err);
    }
  }

  // ---- Event handlers ----
  document.addEventListener('DOMContentLoaded', () => {
    const runBtn = $('runBatch');
    if (runBtn) runBtn.addEventListener('click', runBatch);

    // Filter tab clicks
    document.addEventListener('click', (e) => {
      const tab = e.target.closest('.filter-tab');
      if (tab) {
        currentFilter = tab.dataset.filter;
        document.querySelectorAll('.filter-tab').forEach(t => {
          if (t === tab) {
            t.className = 'filter-tab px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-900 text-white whitespace-nowrap';
          } else {
            t.className = 'filter-tab px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-surface-200 text-surface-700 whitespace-nowrap';
          }
        });
        renderList(currentPredictions);
      }

      // Feedback buttons
      const feedbackBtn = e.target.closest('[data-action^="feedback-"]');
      if (feedbackBtn) {
        const outcome = feedbackBtn.dataset.action === 'feedback-retained' ? 'retained' : 'churned';
        sendFeedback(feedbackBtn.dataset.pid, outcome);
      }
    });

    loadExisting();
  });
})();
