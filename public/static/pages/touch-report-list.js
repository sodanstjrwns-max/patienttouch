// ============================================
// 터치 리포트 — 목록 화면
// ============================================
(function () {
  let currentStatus = '';

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

  const ST = {
    generating: { label: '생성중', cls: 'bg-surface-100 text-surface-600', icon: 'fa-wand-magic-sparkles' },
    review: { label: '검수대기', cls: 'bg-amber-50 text-amber-700', icon: 'fa-magnifying-glass' },
    approved: { label: '승인됨', cls: 'bg-brand-50 text-brand-700', icon: 'fa-check' },
    sent: { label: '발송완료', cls: 'bg-emerald-50 text-emerald-700', icon: 'fa-paper-plane' },
    failed: { label: '실패', cls: 'bg-rose-50 text-rose-700', icon: 'fa-triangle-exclamation' },
  };

  async function load() {
    try {
      if (typeof requireAuth === 'function') await requireAuth();
      const url = '/api/touch-report/manage/list' + (currentStatus ? '?status=' + currentStatus : '');
      const res = await fetch(url);
      if (res.status === 401) { location.href = '/login'; return; }
      const data = await res.json();
      render(data.success ? data.data : []);
    } catch (e) {
      console.error(e);
      render([]);
    }
  }

  function render(items) {
    const list = document.getElementById('trlList');
    if (!items.length) {
      list.innerHTML =
        '<div class="text-center py-16 animate-fade-in">' +
          '<div class="w-20 h-20 mx-auto mb-5 rounded-2xl bg-surface-100 flex items-center justify-center"><i class="fas fa-file-medical text-3xl text-surface-300"></i></div>' +
          '<h3 class="text-lg font-bold text-surface-800 mb-1">보고서가 없습니다</h3>' +
          '<p class="text-surface-500 text-sm">상담 상세 화면에서 [환자 보고서 만들기]를 눌러보세요</p>' +
        '</div>';
      return;
    }
    list.innerHTML = items.map((r) => {
      const st = ST[r.status] || { label: r.status, cls: 'bg-surface-100 text-surface-600', icon: 'fa-circle' };
      const issues = (r.flag_count || 0) + (r.banned_count || 0);
      const opened = r.status === 'sent'
        ? (r.open_count > 0
            ? '<span class="text-emerald-600 font-semibold"><i class="fas fa-eye mr-0.5"></i>열람 ' + r.open_count + '회</span>'
            : '<span class="text-surface-400"><i class="fas fa-eye-slash mr-0.5"></i>미열람</span>')
        : '';
      return '<a href="/touch-reports/' + esc(r.id) + '/review" class="card-premium p-4 flex items-center gap-3 block active:scale-[0.99] transition-all">' +
        '<div class="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center shrink-0"><i class="fas fa-file-medical text-brand-500"></i></div>' +
        '<div class="flex-1 min-w-0">' +
          '<p class="font-bold text-sm text-surface-900 truncate">' + esc(r.patient_name) + '님</p>' +
          '<p class="text-xs text-surface-400 mt-0.5">' + esc((r.consultation_date || '').slice(0, 10)) +
            (issues > 0 && r.status === 'review' ? ' · <span class="text-amber-600 font-semibold">확인 ' + issues + '건</span>' : '') +
            (opened ? ' · ' + opened : '') + '</p>' +
        '</div>' +
        '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ' + st.cls + '"><i class="fas ' + st.icon + '"></i>' + st.label + '</span>' +
      '</a>';
    }).join('');
  }

  // 탭
  document.querySelectorAll('.trl-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentStatus = btn.dataset.status;
      document.querySelectorAll('.trl-tab').forEach((b) => {
        b.className = 'trl-tab flex-1 whitespace-nowrap py-2 px-3 rounded-lg font-semibold text-xs transition-all ' +
          (b === btn ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500');
      });
      document.getElementById('trlList').innerHTML = '<div class="card-premium p-5"><div class="shimmer h-5 rounded-lg w-1/2 mb-2"></div><div class="shimmer h-4 rounded-lg w-3/4"></div></div>';
      load();
    });
  });

  load();
})();
