// ============================================
// 터치 리포트 — 실장 검수 화면
// 규칙: 확인필요 배지 or 금칙어가 남으면 발송 승인 불가
// ============================================
(function () {
  const reportId = window.__REPORT_ID__ || '';
  let report = null;      // 서버 응답 data
  let editCtx = null;     // { path, label, flag }
  let pollTimer = null;

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

  // ---------- 데이터 로드 ----------
  async function load() {
    try {
      if (typeof requireAuth === 'function') await requireAuth();
      const res = await fetch('/api/touch-report/manage/' + reportId);
      if (res.status === 401) { location.href = '/login'; return; }
      const data = await res.json();
      if (!data.success) { renderError(data.error || '보고서를 불러올 수 없습니다'); return; }
      report = data.data;

      if (report.status === 'generating') {
        renderGenerating();
        pollTimer = setTimeout(load, 3000);
        return;
      }
      if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
      render();
    } catch (e) {
      console.error(e);
      renderError('네트워크 오류가 발생했습니다');
    }
  }

  function renderError(msg) {
    $('trvSkeleton').classList.add('hidden');
    $('trvContainer').insertAdjacentHTML('beforeend',
      '<div class="text-center py-16"><div class="text-5xl mb-4">⚠️</div><h3 class="text-lg font-bold text-surface-800 mb-1">불러오기 실패</h3><p class="text-surface-500 text-sm">' + esc(msg) + '</p></div>');
  }

  function renderGenerating() {
    $('trvSkeleton').classList.add('hidden');
    $('trvStatus').classList.remove('hidden');
    $('trvStatus').innerHTML =
      '<div class="card-premium p-6 text-center">' +
        '<div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-brand-50 flex items-center justify-center"><i class="fas fa-wand-magic-sparkles text-brand-500 text-xl animate-pulse"></i></div>' +
        '<h3 class="font-bold text-surface-900 mb-1">AI가 보고서를 만들고 있어요</h3>' +
        '<p class="text-sm text-surface-500">녹취 근거 대조와 숫자 검증까지 진행합니다. 잠시만요...</p>' +
      '</div>';
  }

  // ---------- 메인 렌더 ----------
  function render() {
    $('trvSkeleton').classList.add('hidden');
    const c = report.content;
    const flags = report.flags || [];
    const banned = report.banned_hits || [];

    // 상태 헤더
    const stMap = {
      review: { label: '검수 대기', cls: 'bg-amber-50 text-amber-700 ring-amber-200/60', icon: 'fa-magnifying-glass' },
      approved: { label: '발송 승인됨', cls: 'bg-brand-50 text-brand-700 ring-brand-200/60', icon: 'fa-check' },
      sent: { label: '발송 완료', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60', icon: 'fa-paper-plane' },
      failed: { label: '생성 실패', cls: 'bg-rose-50 text-rose-700 ring-rose-200/60', icon: 'fa-triangle-exclamation' },
    };
    const st = stMap[report.status] || { label: report.status, cls: 'bg-surface-50 text-surface-600 ring-surface-200/60', icon: 'fa-circle' };
    $('trvStatus').classList.remove('hidden');
    $('trvStatus').innerHTML =
      '<div class="card-premium p-4 flex items-center justify-between gap-3">' +
        '<div class="min-w-0">' +
          '<p class="font-bold text-surface-900 truncate">' + esc(report.patient_name) + '님 상담 보고서</p>' +
          '<p class="text-xs text-surface-400 mt-0.5">' + esc((report.consultation_date || '').slice(0, 10)) + (report.open_count ? ' · 열람 ' + report.open_count + '회' : '') + '</p>' +
        '</div>' +
        '<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ring-1 ' + st.cls + '"><i class="fas ' + st.icon + '"></i>' + st.label + '</span>' +
      '</div>';

    if (report.status === 'failed') {
      $('trvPreview').classList.remove('hidden');
      $('trvPreview').innerHTML = '<div class="card-premium p-5 text-sm text-rose-600">' + esc(report.error_message || '생성에 실패했습니다. 상담 상세에서 다시 시도해주세요.') + '</div>';
      return;
    }
    if (!c) { renderError('보고서 콘텐츠가 없습니다'); return; }

    // 배지 요약 (제작서 §3.3: 배지 항목만 확인하면 끝나는 구조)
    const sum = $('trvFlagSummary');
    sum.classList.remove('hidden');
    if (flags.length === 0 && banned.length === 0) {
      sum.innerHTML =
        '<div class="card-premium p-4 flex items-center gap-3 bg-emerald-50/50 border-emerald-100">' +
          '<div class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0"><i class="fas fa-shield-check text-emerald-600"></i></div>' +
          '<div><p class="font-bold text-sm text-emerald-800">확인 필요 항목 없음</p><p class="text-xs text-emerald-600">숫자 검증과 금칙어 검사를 통과했습니다</p></div>' +
        '</div>';
    } else {
      let html = '<div class="card-premium p-4 space-y-2.5">';
      if (flags.length > 0) {
        html += '<p class="font-bold text-sm text-surface-900"><i class="fas fa-triangle-exclamation text-amber-500 mr-1.5"></i>확인 필요 ' + flags.length + '건 <span class="text-xs font-normal text-surface-400">— 항목을 눌러 근거 확인 후 수정/확인</span></p>';
        flags.forEach((f) => {
          html += '<button onclick="window.trvOpenEdit(' + esc(JSON.stringify(f.path)).replace(/"/g, '&quot;') + ')" class="w-full text-left px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 active:scale-[0.99] transition-all">' +
            '<p class="text-xs font-bold text-amber-800">' + esc(f.label) + ' · <span class="font-mono">' + esc(f.value) + '</span></p>' +
            '<p class="text-[11px] text-amber-600 mt-0.5">' + esc(f.reason) + '</p></button>';
        });
      }
      if (banned.length > 0) {
        html += '<p class="font-bold text-sm text-surface-900 pt-1"><i class="fas fa-ban text-rose-500 mr-1.5"></i>금칙어 ' + banned.length + '건 <span class="text-xs font-normal text-surface-400">— 의료광고법 위반 소지</span></p>';
        banned.forEach((b) => {
          html += '<button onclick="window.trvOpenEdit(' + esc(JSON.stringify(b.path)).replace(/"/g, '&quot;') + ')" class="w-full text-left px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 active:scale-[0.99] transition-all">' +
            '<p class="text-xs font-bold text-rose-800">"' + esc(b.word) + '" 검출</p>' +
            '<p class="text-[11px] text-rose-600 mt-0.5">제안: ' + esc(b.suggestion) + '</p></button>';
        });
      }
      html += '</div>';
      sum.innerHTML = html;
    }

    renderPreview(c, flags, banned);
    renderActionBar(flags, banned);
  }

  // path에 걸린 flag/banned 찾기
  const flagAt = (path) => (report.flags || []).find((f) => f.path === path);
  const bannedAt = (path) => (report.banned_hits || []).filter((b) => b.path === path);

  function badgeHtml(path) {
    const f = flagAt(path);
    const b = bannedAt(path);
    let out = '';
    if (f) out += '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 ml-1.5 align-middle"><i class="fas fa-triangle-exclamation"></i>확인 필요</span>';
    if (b.length) out += '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 ml-1.5 align-middle"><i class="fas fa-ban"></i>금칙어</span>';
    return out;
  }

  // 수정 가능한 텍스트 블록
  function editable(path, label, text, evidenceQuote) {
    return '<div class="group relative rounded-xl px-3 py-2 -mx-1 hover:bg-surface-50 transition-colors">' +
      '<p class="text-sm text-surface-700 leading-relaxed">' + esc(text) + badgeHtml(path) + '</p>' +
      '<div class="flex gap-1.5 mt-1.5">' +
        (evidenceQuote ? '<button onclick="window.trvShowEvidence(' + esc(JSON.stringify(path)).replace(/"/g, '&quot;') + ')" class="text-[11px] font-semibold text-brand-500 px-2 py-1 rounded-lg bg-brand-50 active:scale-95 transition-all"><i class="fas fa-quote-left mr-1"></i>근거</button>' : '') +
        '<button onclick="window.trvOpenEdit(' + esc(JSON.stringify(path)).replace(/"/g, '&quot;') + ')" class="text-[11px] font-semibold text-surface-400 px-2 py-1 rounded-lg bg-surface-100 active:scale-95 transition-all"><i class="fas fa-pen mr-1"></i>수정</button>' +
      '</div></div>';
  }

  function section(title, icon, bodyHtml) {
    return '<div class="card-premium p-5"><h3 class="font-bold text-surface-900 text-sm mb-3"><i class="fas ' + icon + ' text-brand-500 mr-2"></i>' + title + '</h3>' + bodyHtml + '</div>';
  }

  function renderPreview(c, flags, banned) {
    const pv = $('trvPreview');
    pv.classList.remove('hidden');
    let html = '';

    // 오늘의 요약
    if (c.summary && c.summary.length) {
      html += section('오늘의 요약', 'fa-star',
        c.summary.map((s, i) => editable('summary[' + i + ']', '요약 ' + (i + 1), s, (c.summary_evidence || [])[i])).join(''));
    }

    // 구강 상태
    if (c.oral_status && c.oral_status.description) {
      let body = editable('oral_status.description', '구강 상태', c.oral_status.description, c.oral_status.evidence_quote);
      if (c.oral_status.mentioned_teeth && c.oral_status.mentioned_teeth.length) {
        body += '<p class="text-xs text-surface-400 mt-2 px-3"><i class="fas fa-tooth mr-1"></i>언급된 치아(FDI): <span class="font-mono font-bold text-surface-600">' + c.oral_status.mentioned_teeth.map(esc).join(', ') + '</span></p>';
      }
      html += section('현재 구강 상태', 'fa-tooth', body);
    }

    // 치료 옵션 (핵심 섹션)
    if (c.treatment_options && c.treatment_options.length) {
      let body = '';
      c.treatment_options.forEach((opt, i) => {
        const base = 'treatment_options[' + i + ']';
        body += '<div class="rounded-2xl border border-surface-200 p-4 mb-3 last:mb-0">' +
          '<div class="flex items-center justify-between mb-2">' +
            '<p class="font-bold text-surface-900 text-sm">' + esc(opt.name) + badgeHtml(base + '.name') + '</p>' +
            (opt.evidence_quote ? '<button onclick="window.trvShowEvidence(' + esc(JSON.stringify(base + '.evidence_quote')).replace(/"/g, '&quot;') + ')" class="text-[11px] font-semibold text-brand-500 px-2 py-1 rounded-lg bg-brand-50 shrink-0"><i class="fas fa-quote-left mr-1"></i>근거</button>' : '') +
          '</div>' +
          '<div class="grid grid-cols-3 gap-2 mb-2">' +
            kvCell(base + '.duration', '기간', opt.duration) +
            kvCell(base + '.visit_count', '내원', opt.visit_count) +
            kvCell(base + '.cost', '비용', opt.cost) +
          '</div>' +
          (opt.pros && opt.pros.length ? '<p class="text-[11px] font-bold text-surface-400 mt-2 mb-1">장점</p>' + opt.pros.map((p, j) => editable(base + '.pros[' + j + ']', '장점', p, '')).join('') : '') +
          (opt.considerations && opt.considerations.length ? '<p class="text-[11px] font-bold text-surface-400 mt-2 mb-1">고려사항</p>' + opt.considerations.map((p, j) => editable(base + '.considerations[' + j + ']', '고려사항', p, '')).join('') : '') +
        '</div>';
      });
      html += section('제안된 치료 옵션', 'fa-clipboard-list', body);
    }

    // QnA
    if (c.qna && c.qna.length) {
      let body = '';
      c.qna.forEach((q, i) => {
        body += '<div class="mb-3 last:mb-0">' +
          '<p class="text-sm font-bold text-surface-800 px-3">Q. ' + esc(q.question) + '</p>' +
          editable('qna[' + i + '].answer', '답변', q.answer, q.evidence_quote) +
        '</div>';
      });
      html += section('상담 중 질문과 답변', 'fa-comments', body);
    }

    // 다음 단계
    if (c.next_steps && c.next_steps.guidance) {
      let body = editable('next_steps.guidance', '다음 단계', c.next_steps.guidance, c.next_steps.evidence_quote);
      if (c.next_steps.preparation && c.next_steps.preparation.length) {
        body += c.next_steps.preparation.map((p, j) => editable('next_steps.preparation[' + j + ']', '준비사항', p, '')).join('');
      }
      html += section('다음 단계', 'fa-route', body);
    }

    // 환자 화면 미리보기 링크
    if (report.status === 'sent') {
      const url = location.origin + '/r/' + reportId;
      html += '<div class="card-premium p-4 flex items-center justify-between gap-3">' +
        '<div class="min-w-0"><p class="font-bold text-sm text-surface-900">환자 페이지 링크</p><p class="text-xs text-surface-400 truncate">' + esc(url) + '</p></div>' +
        '<button onclick="navigator.clipboard.writeText(' + esc(JSON.stringify(url)).replace(/"/g, '&quot;') + ').then(()=>window.showToast&&showToast(\'복사됨\'))" class="px-3 py-2 rounded-xl bg-surface-100 text-surface-600 text-xs font-bold shrink-0 active:scale-95 transition-all"><i class="fas fa-copy mr-1"></i>복사</button>' +
      '</div>';
    }

    pv.innerHTML = html;
  }

  function kvCell(path, label, value) {
    const f = flagAt(path);
    return '<button onclick="window.trvOpenEdit(' + esc(JSON.stringify(path)).replace(/"/g, '&quot;') + ')" class="text-left rounded-xl px-2.5 py-2 ' + (f ? 'bg-amber-50 border border-amber-200' : 'bg-surface-50 border border-surface-100') + ' active:scale-[0.98] transition-all">' +
      '<p class="text-[10px] text-surface-400 font-semibold">' + label + (f ? ' <i class="fas fa-triangle-exclamation text-amber-500"></i>' : '') + '</p>' +
      '<p class="text-xs font-bold text-surface-800 mt-0.5 break-all">' + esc(value || '—') + '</p></button>';
  }

  // ---------- 하단 액션 바 ----------
  function renderActionBar(flags, banned) {
    const bar = $('trvActionBar');
    const info = $('trvActionInfo');
    const approveBtn = $('trvApproveBtn');
    const sendBtn = $('trvSendBtn');
    bar.classList.remove('hidden');
    approveBtn.classList.add('hidden');
    sendBtn.classList.add('hidden');

    if (report.status === 'review') {
      approveBtn.classList.remove('hidden');
      const blocked = flags.length > 0 || banned.length > 0;
      approveBtn.disabled = blocked;
      info.innerHTML = blocked
        ? '<span class="text-amber-600 font-semibold"><i class="fas fa-lock mr-1"></i>확인 필요 ' + flags.length + '건 · 금칙어 ' + banned.length + '건</span><br/>모두 해소해야 승인할 수 있습니다'
        : '검수 완료. 승인 후 발송할 수 있습니다';
    } else if (report.status === 'approved') {
      sendBtn.classList.remove('hidden');
      info.innerHTML = '승인 완료. 발송 버튼을 누르면 환자에게 전달됩니다.<br/><span class="text-surface-400">자동 발송은 없습니다 — 지금이 마지막 확인입니다</span>';
    } else if (report.status === 'sent') {
      info.innerHTML = '<span class="text-emerald-600 font-semibold"><i class="fas fa-check-circle mr-1"></i>발송 완료</span>' + (report.sent_at ? ' · ' + esc(String(report.sent_at).slice(0, 16).replace('T', ' ')) : '');
    }
  }

  // ---------- 근거 패널 ----------
  window.trvShowEvidence = function (path) {
    const quote = getEvidenceForPath(path);
    const body = $('trvEvidenceBody');
    if (quote) {
      body.innerHTML =
        '<div class="rounded-2xl bg-surface-50 border border-surface-200 p-4 mb-3"><p class="text-sm text-surface-700 leading-relaxed">"' + esc(quote) + '"</p></div>' +
        renderTranscriptContext(quote);
    } else {
      body.innerHTML = '<p class="text-sm text-surface-400 text-center py-6">이 항목에 연결된 근거 인용이 없습니다.<br/>녹취 원문을 직접 확인해주세요.</p>' + renderTranscriptContext('');
    }
    $('trvEvidenceModal').classList.remove('hidden');
  };
  window.trvCloseEvidence = function () { $('trvEvidenceModal').classList.add('hidden'); };

  function getEvidenceForPath(path) {
    const c = report.content;
    try {
      const m = path.match(/^summary\[(\d+)\]/);
      if (m) return (c.summary_evidence || [])[+m[1]] || '';
      if (path.startsWith('oral_status')) return c.oral_status && c.oral_status.evidence_quote;
      const t = path.match(/^treatment_options\[(\d+)\]/);
      if (t) return c.treatment_options[+t[1]] && c.treatment_options[+t[1]].evidence_quote;
      const q = path.match(/^qna\[(\d+)\]/);
      if (q) return c.qna[+q[1]] && c.qna[+q[1]].evidence_quote;
      if (path.startsWith('next_steps')) return c.next_steps && c.next_steps.evidence_quote;
    } catch (e) {}
    return '';
  }

  // 녹취 원문에서 인용 주변 맥락 표시
  function renderTranscriptContext(quote) {
    const tr = report.transcript || '';
    if (!tr) return '';
    let html = '<p class="text-xs font-bold text-surface-400 mb-2 mt-1">녹취 원문 맥락</p>';
    let idx = -1;
    if (quote) {
      // 완전일치 → 앞 20자 부분일치 순으로 탐색
      idx = tr.indexOf(quote);
      if (idx < 0 && quote.length > 20) idx = tr.indexOf(quote.slice(0, 20));
    }
    if (idx >= 0) {
      const start = Math.max(0, idx - 150);
      const end = Math.min(tr.length, idx + quote.length + 150);
      html += '<div class="rounded-2xl bg-white border border-surface-200 p-4 max-h-48 overflow-y-auto"><p class="text-xs text-surface-500 leading-relaxed">' +
        (start > 0 ? '...' : '') + esc(tr.slice(start, idx)) +
        '<mark class="bg-brand-100 text-brand-800 rounded px-0.5">' + esc(tr.slice(idx, idx + (quote ? quote.length : 0))) + '</mark>' +
        esc(tr.slice(idx + (quote ? quote.length : 0), end)) + (end < tr.length ? '...' : '') + '</p></div>';
    } else {
      html += '<div class="rounded-2xl bg-white border border-surface-200 p-4 max-h-48 overflow-y-auto"><p class="text-xs text-surface-500 leading-relaxed">' + esc(tr.slice(0, 600)) + (tr.length > 600 ? '...' : '') + '</p></div>' +
        (quote ? '<p class="text-[11px] text-amber-600 mt-2"><i class="fas fa-triangle-exclamation mr-1"></i>인용 문구를 녹취에서 정확히 찾지 못했습니다. 원문을 직접 확인해주세요.</p>' : '');
    }
    return html;
  }

  // ---------- 인라인 수정 ----------
  window.trvOpenEdit = function (path) {
    const f = flagAt(path);
    const b = bannedAt(path);
    let current = '';
    try {
      const tokens = path.replace(/\[(\d+)\]/g, '.$1').split('.');
      let node = report.content;
      for (const t of tokens) node = node[t];
      current = node == null ? '' : String(node);
    } catch (e) {}

    editCtx = { path, flag: f };
    $('trvEditTitle').textContent = f ? f.label + ' 확인' : '내용 수정';
    $('trvEditInput').value = current;

    const fi = $('trvEditFlagInfo');
    if (f || b.length) {
      let html = '';
      if (f) html += '<div class="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 mb-2"><p class="text-xs font-bold text-amber-800">확인 필요: ' + esc(f.reason) + '</p>' + (f.quote ? '<p class="text-[11px] text-amber-600 mt-1">근거: "' + esc(f.quote) + '"</p>' : '') + '</div>';
      b.forEach((bb) => {
        html += '<div class="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2.5 mb-2"><p class="text-xs font-bold text-rose-800">금칙어 "' + esc(bb.word) + '" → 제안: ' + esc(bb.suggestion) + '</p></div>';
      });
      fi.innerHTML = html;
      fi.classList.remove('hidden');
    } else fi.classList.add('hidden');

    $('trvEditResolveBtn').classList.toggle('hidden', !f);
    $('trvEditModal').classList.remove('hidden');
    // 근거 패널 열려있으면 닫기
    $('trvEvidenceModal').classList.add('hidden');
  };
  window.trvCloseEdit = function () { $('trvEditModal').classList.add('hidden'); editCtx = null; };

  $('trvEditSaveBtn').addEventListener('click', async () => {
    if (!editCtx) return;
    const value = $('trvEditInput').value.trim();
    if (!value) { alert('내용을 입력해주세요'); return; }
    const btn = $('trvEditSaveBtn');
    btn.disabled = true;
    try {
      const res = await fetch('/api/touch-report/manage/' + reportId + '/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: editCtx.path, value, resolve_flag: !!editCtx.flag }),
      });
      const data = await res.json();
      if (!data.success) { alert(data.error || '저장 실패'); return; }
      window.trvCloseEdit();
      await load();
    } finally { btn.disabled = false; }
  });

  $('trvEditResolveBtn').addEventListener('click', async () => {
    if (!editCtx || !editCtx.flag) return;
    const btn = $('trvEditResolveBtn');
    btn.disabled = true;
    try {
      const res = await fetch('/api/touch-report/manage/' + reportId + '/resolve-flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: editCtx.path }),
      });
      const data = await res.json();
      if (!data.success) { alert(data.error || '처리 실패'); return; }
      window.trvCloseEdit();
      await load();
    } finally { btn.disabled = false; }
  });

  // ---------- 승인 ----------
  $('trvApproveBtn').addEventListener('click', async () => {
    if (!confirm('보고서를 발송 승인하시겠습니까?\n승인 후에도 발송 버튼을 눌러야 실제 발송됩니다.')) return;
    const btn = $('trvApproveBtn');
    btn.disabled = true;
    try {
      const res = await fetch('/api/touch-report/manage/' + reportId + '/approve', { method: 'POST' });
      const data = await res.json();
      if (!data.success) { alert(data.error || '승인 실패'); await load(); return; }
      await load();
    } finally { btn.disabled = false; }
  });

  // ---------- 발송 ----------
  $('trvSendBtn').addEventListener('click', () => {
    $('trvSendResult').classList.add('hidden');
    $('trvSendConfirmBtn').classList.remove('hidden');
    $('trvSendAuthArea').classList.remove('hidden');
    $('trvSendModal').classList.remove('hidden');
  });
  window.trvCloseSend = function () { $('trvSendModal').classList.add('hidden'); };

  $('trvSendConfirmBtn').addEventListener('click', async () => {
    const btn = $('trvSendConfirmBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1.5"></i>발송 중...';
    try {
      const authHint = $('trvSendAuthInput').value.trim();
      const res = await fetch('/api/touch-report/manage/' + reportId + '/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auth_hint: authHint || null }),
      });
      const data = await res.json();
      if (!data.success) { alert(data.error || '발송 실패'); return; }
      const d = data.data;
      $('trvSendConfirmBtn').classList.add('hidden');
      $('trvSendAuthArea').classList.add('hidden');
      const result = $('trvSendResult');
      result.classList.remove('hidden');
      result.innerHTML =
        '<div class="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center mb-3">' +
          '<i class="fas fa-check-circle text-emerald-500 text-2xl mb-2"></i>' +
          '<p class="font-bold text-sm text-emerald-800">' + esc(d.detail) + '</p>' +
        '</div>' +
        '<div class="flex gap-2">' +
          '<input readonly value="' + esc(d.report_url) + '" class="flex-1 px-3 py-2.5 rounded-xl bg-surface-50 border border-surface-200 text-xs text-surface-600 font-mono" onclick="this.select()"/>' +
          '<button onclick="navigator.clipboard.writeText(' + esc(JSON.stringify(d.report_url)).replace(/"/g, '&quot;') + ').then(()=>{this.innerHTML=\'<i class=&quot;fas fa-check&quot;></i>\'})" class="px-4 py-2.5 rounded-xl bg-gradient-brand text-white text-xs font-bold shrink-0"><i class="fas fa-copy"></i></button>' +
        '</div>';
      await load();
    } finally {
      btn.disabled = false;
      btn.innerHTML = '발송 확정';
    }
  });

  load();
})();
