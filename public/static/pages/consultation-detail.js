const consultationId = window.__CONSULTATION_ID__ || (location.pathname.match(/\/consultations\/([^/]+)/) || [])[1] || '';
let currentConsultation = null;
let allPatients = [];

async function loadConsultation() {
  try {
    await requireAuth();

    const res = await fetch('/api/consultations/' + consultationId);
    if (res.status === 401) { window.location.href = '/login'; return; }
    const data = await res.json();

    if (data.success) {
      renderConsultation(data.data);
    } else {
      document.getElementById('consultationDetail').innerHTML =
        '<div class="text-center py-16 animate-fade-in">' +
          '<div class="w-20 h-20 mx-auto mb-5 rounded-2xl bg-surface-100 flex items-center justify-center"><i class="fas fa-file-circle-xmark text-3xl text-surface-300"></i></div>' +
          '<h3 class="text-lg font-bold text-surface-800 mb-1">상담 기록을 찾을 수 없습니다</h3>' +
          '<p class="text-surface-500 text-sm">삭제되었거나 접근 권한이 없습니다</p>' +
          '<a href="/consultations" class="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-all active:scale-95"><i class="fas fa-list"></i>상담 목록으로</a>' +
        '</div>';
    }
  } catch (err) {
    console.error('Failed to load consultation:', err);
    document.getElementById('consultationDetail').innerHTML =
      '<div class="text-center py-16 animate-fade-in">' +
        '<div class="w-20 h-20 mx-auto mb-5 rounded-2xl bg-surface-100 flex items-center justify-center"><i class="fas fa-triangle-exclamation text-3xl text-amber-400"></i></div>' +
        '<h3 class="text-lg font-bold text-surface-800 mb-1">데이터를 불러올 수 없습니다</h3>' +
        '<p class="text-surface-500 text-sm mb-4">네트워크 오류가 발생했습니다</p>' +
        '<button onclick="loadConsultation()" class="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-all active:scale-95"><i class="fas fa-rotate-right"></i>다시 시도</button>' +
      '</div>';
  }
}

function renderConsultation(c) {
  currentConsultation = c;
  const container = document.getElementById('consultationDetail');
  const date = new Date(c.consultation_date);
  const dateStr = date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

  const st = {
    paid: { bg:'bg-emerald-50', text:'text-emerald-700', label:'결제완료', ring:'ring-emerald-200/60', dot:'bg-emerald-500' },
    undecided: { bg:'bg-amber-50', text:'text-amber-700', label:'미결정', ring:'ring-amber-200/60', dot:'bg-amber-500' },
    lost: { bg:'bg-rose-50', text:'text-rose-700', label:'이탈', ring:'ring-rose-200/60', dot:'bg-rose-500' },
    pending: { bg:'bg-surface-50', text:'text-surface-600', label:'분석중', ring:'ring-surface-200/60', dot:'bg-surface-400' }
  }[c.status] || { bg:'bg-surface-50', text:'text-surface-600', label:c.status, ring:'ring-surface-200/60', dot:'bg-surface-400' };

  const psychology = c.patient_psychology || {};
  const emotionFlow = c.emotion_flow || {};
  const feedback = c.feedback || {};
  const keyQuotes = c.key_quotes || [];
  const isUnlinked = !c.patient_id;
  let html = '<div class="space-y-3 stagger-children">';

  // === v8.0: Analysis status banner (processing → poll / failed → reanalyze) ===
  if (c.ai_analysis_status === 'processing') {
    html += '<div class="card-premium p-4 border-l-4 border-l-brand-400 bg-gradient-to-r from-brand-50/50 to-transparent">' +
      '<div class="flex items-center gap-3">' +
        '<div class="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center shrink-0"><i class="fas fa-circle-notch fa-spin text-brand-600"></i></div>' +
        '<div class="flex-1 min-w-0">' +
          '<p class="font-bold text-surface-900 text-sm">AI 분석 진행 중</p>' +
          '<p id="analysisStepLabel" class="text-surface-500 text-xs mt-0.5">진행 상태 확인 중...</p>' +
        '</div>' +
      '</div>' +
    '</div>';
    startStatusPolling();
  } else if (c.ai_analysis_status === 'failed') {
    html += '<div class="card-premium p-4 border-l-4 border-l-rose-400 bg-gradient-to-r from-rose-50/50 to-transparent">' +
      '<div class="flex items-start gap-3">' +
        '<div class="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0"><i class="fas fa-triangle-exclamation text-rose-600"></i></div>' +
        '<div class="flex-1 min-w-0">' +
          '<p class="font-bold text-surface-900 text-sm">AI 분석 실패</p>' +
          '<p class="text-surface-500 text-xs mt-0.5">' + esc(c.analysis_error || '녹음은 안전하게 저장되어 있습니다. 다시 분석할 수 있어요.') + '</p>' +
          '<button id="reanalyzeBtn" onclick="reanalyzeConsultation()" class="mt-2.5 inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 shadow-sm">' +
            '<i class="fas fa-rotate-right text-[10px]"></i>다시 분석하기' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  // Unlinked warning
  if (isUnlinked) {
    html += '<div class="card-premium p-4 border-l-4 border-l-amber-400 bg-gradient-to-r from-amber-50/50 to-transparent">' +
      '<div class="flex items-start gap-3">' +
        '<div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0"><i class="fas fa-link-slash text-amber-600"></i></div>' +
        '<div class="flex-1 min-w-0">' +
          '<p class="font-bold text-surface-900 text-sm">환자 미연결</p>' +
          '<p class="text-surface-500 text-xs mt-0.5">빠른 녹음 모드로 생성된 상담입니다</p>' +
          '<button onclick="showLinkModal()" class="mt-2.5 inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 shadow-sm">' +
            '<i class="fas fa-link text-[10px]"></i>환자 연결' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  // Patient Info Header
  html += '<div class="card-premium p-5">' +
    '<div class="flex items-start justify-between mb-4">' +
      '<div class="flex items-center gap-3">' +
        '<div class="w-12 h-12 rounded-xl ' + (isUnlinked ? 'bg-surface-100' : 'bg-brand-50') + ' flex items-center justify-center">' +
          '<span class="text-lg font-bold ' + (isUnlinked ? 'text-surface-400' : 'text-brand-600') + '">' + (esc(c.patient_name) ? esc(c.patient_name).charAt(0) : '?') + '</span>' +
        '</div>' +
        '<div>' +
          (c.patient_id && esc(c.patient_name)
            ? PT.patientNameLink(c.patient_id, c.patient_name, {tag:'h2', cls:'text-lg font-bold text-brand-700 underline decoration-dotted decoration-brand-300 underline-offset-4 active:opacity-60'})
            : '<h2 class="text-lg font-bold text-surface-900">' + (esc(c.patient_name) || '환자 미지정') + '</h2>') +
          '<p class="text-surface-500 text-xs">' + (c.patient_age ? c.patient_age + '세 ' : '') + (c.patient_gender === 'male' ? '남성' : c.patient_gender === 'female' ? '여성' : '') + '</p>' +
        '</div>' +
      '</div>' +
      '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ring-1 ring-inset ' + st.bg + ' ' + esc(st.text) + ' ' + st.ring + '"><span class="w-1.5 h-1.5 rounded-full ' + st.dot + '"></span>' + st.label + '</span>' +
    '</div>' +
    '<div class="grid grid-cols-2 gap-2.5">' +
      '<div class="bg-surface-50 rounded-xl p-3">' +
        '<p class="text-surface-400 text-[10px] font-semibold mb-1 uppercase tracking-wider">상담일시</p>' +
        '<p class="font-semibold text-sm text-surface-800">' + dateStr + '</p>' +
        '<p class="text-surface-500 text-xs">' + timeStr + (c.duration ? ' · ' + c.duration + '분' : '') + '</p>' +
      '</div>' +
      '<div class="bg-surface-50 rounded-xl p-3">' +
        '<p class="text-surface-400 text-[10px] font-semibold mb-1 uppercase tracking-wider">진료항목</p>' +
        '<p class="font-semibold text-sm text-surface-800">' + (esc(c.treatment_type) || '-') + '</p>' +
        '<p class="text-surface-500 text-xs">' + (esc(c.treatment_area) || '') + '</p>' +
      '</div>' +
    '</div>' +
    (c.amount ? '<div class="mt-2.5 bg-gradient-to-r from-brand-50 to-brand-50/30 rounded-xl p-3 flex items-center justify-between">' +
      '<span class="text-brand-600 text-xs font-semibold">상담 금액</span>' +
      '<span class="text-xl font-black text-brand-700">' + (c.amount / 10000).toFixed(0) + '<span class="text-sm font-semibold text-brand-500 ml-0.5">만원</span></span>' +
    '</div>' : '') +
  '</div>';

  // === v8.0: Audio Playback (녹음 다시듣기 — 성장의 핵심 도구) ===
  html += '<div class="card-premium p-4" id="audioPlayerCard">' +
    '<div class="flex items-center gap-3">' +
      '<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shrink-0 shadow-sm">' +
        '<i class="fas fa-headphones text-white text-sm"></i>' +
      '</div>' +
      '<div class="flex-1 min-w-0">' +
        '<p class="font-bold text-sm text-surface-900">녹음 다시듣기</p>' +
        '<p class="text-xs text-surface-500 mt-0.5">내 상담을 직접 들으며 복기하세요</p>' +
      '</div>' +
      '<button id="loadAudioBtn" onclick="loadAudioPlayer()" class="px-3.5 py-2 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition-colors">' +
        '<i class="fas fa-play mr-1 text-[10px]"></i>재생' +
      '</button>' +
    '</div>' +
    '<div id="audioPlayerBody" class="hidden mt-3"></div>' +
  '</div>';

  // Report Link
  html += '<a href="/consultations/' + c.id + '/report" class="card-premium p-4 flex items-center gap-3 group">' +
    '<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm shadow-violet-500/20">' +
      '<i class="fas fa-chart-mixed text-white text-sm"></i>' +
    '</div>' +
    '<div class="flex-1 min-w-0">' +
      '<p class="font-bold text-sm text-surface-900">AI 상담 레포트</p>' +
      '<p class="text-xs text-surface-500 mt-0.5">치료옵션·결제안·코칭 피드백 확인</p>' +
    '</div>' +
    '<i class="fas fa-chevron-right text-surface-300 text-xs group-hover:text-brand-500 transition-colors"></i>' +
  '</a>';

  // === 터치 리포트 (환자용 상담 보고서) ===
  html += '<div class="card-premium p-4" id="touchReportCard">' +
    '<div class="flex items-center gap-3">' +
      '<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-600 flex items-center justify-center shrink-0 shadow-sm shadow-brand-500/20">' +
        '<i class="fas fa-file-medical text-white text-sm"></i>' +
      '</div>' +
      '<div class="flex-1 min-w-0">' +
        '<p class="font-bold text-sm text-surface-900">터치 리포트 <span class="text-[10px] font-bold text-brand-500 bg-brand-50 px-1.5 py-0.5 rounded-md align-middle ml-1">NEW</span></p>' +
        '<p class="text-xs text-surface-500 mt-0.5">환자에게 보낼 상담 보고서</p>' +
      '</div>' +
      '<div id="touchReportAction"><span class="text-xs text-surface-300"><i class="fas fa-spinner fa-spin"></i></span></div>' +
    '</div>' +
  '</div>';

  // Summary
  if (esc(c.summary)) {
    html += '<div class="card-premium p-5">' +
      '<div class="flex items-center gap-2 mb-3">' +
        '<div class="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center"><i class="fas fa-file-lines text-xs text-brand-600"></i></div>' +
        '<h3 class="font-bold text-sm text-surface-900">스크립트 요약</h3>' +
      '</div>' +
      '<div class="text-surface-700 text-sm leading-relaxed whitespace-pre-line">' + esc(c.summary) + '</div>' +
      (c.transcript ? '<button onclick="toggleTranscript()" class="mt-3 inline-flex items-center gap-1.5 text-brand-600 text-xs font-semibold hover:text-brand-700 transition-colors">' +
        '<i class="fas fa-scroll"></i>전체 스크립트 보기' +
      '</button>' +
      '<div id="fullTranscript" class="hidden mt-3 p-3 bg-surface-50 rounded-xl text-xs text-surface-600 max-h-60 overflow-y-auto whitespace-pre-line leading-relaxed">' + c.transcript + '</div>' : '') +
    '</div>';
  }

  // Patient Psychology
  if (psychology.fear || psychology.hesitation_reason || psychology.decision_factor || psychology.decision_maker) {
    html += '<div class="card-premium p-5">' +
      '<div class="flex items-center gap-2 mb-3">' +
        '<div class="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center"><i class="fas fa-brain text-xs text-rose-600"></i></div>' +
        '<h3 class="font-bold text-sm text-surface-900">환자 심리 분석</h3>' +
      '</div>' +
      '<div class="space-y-2.5">' +
        (psychology.fear ? '<div class="flex gap-3 items-start p-2.5 bg-rose-50/50 rounded-xl"><span class="text-base shrink-0">😰</span><div><p class="text-[10px] font-semibold text-rose-500 uppercase tracking-wider mb-0.5">두려움</p><p class="text-sm text-surface-800">' + psychology.fear + '</p></div></div>' : '') +
        (psychology.hesitation_reason ? '<div class="flex gap-3 items-start p-2.5 bg-amber-50/50 rounded-xl"><span class="text-base shrink-0">🤔</span><div><p class="text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-0.5">미결정 사유</p><p class="text-sm text-surface-800">' + psychology.hesitation_reason + '</p></div></div>' : '') +
        (psychology.decision_maker ? '<div class="flex gap-3 items-start p-2.5 bg-sky-50/50 rounded-xl"><span class="text-base shrink-0">👥</span><div><p class="text-[10px] font-semibold text-sky-500 uppercase tracking-wider mb-0.5">결정권자</p><p class="text-sm text-surface-800">' + psychology.decision_maker + '</p></div></div>' : '') +
        (psychology.decision_factor ? '<div class="flex gap-3 items-start p-2.5 bg-emerald-50/50 rounded-xl"><span class="text-base shrink-0">⭐</span><div><p class="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-0.5">결정 요인</p><p class="text-sm text-surface-800">' + psychology.decision_factor + '</p></div></div>' : '') +
        (psychology.budget ? '<div class="flex gap-3 items-start p-2.5 bg-violet-50/50 rounded-xl"><span class="text-base shrink-0">💰</span><div><p class="text-[10px] font-semibold text-violet-500 uppercase tracking-wider mb-0.5">예산</p><p class="text-sm text-surface-800">' + psychology.budget + '</p></div></div>' : '') +
        (psychology.hidden_needs ? '<div class="flex gap-3 items-start p-2.5 bg-purple-50/50 rounded-xl"><span class="text-base shrink-0">🔮</span><div><p class="text-[10px] font-semibold text-purple-500 uppercase tracking-wider mb-0.5">숨겨진 니즈</p><p class="text-sm text-surface-800">' + psychology.hidden_needs + '</p></div></div>' : '') +
        (psychology.personality_type ? '<div class="flex gap-3 items-start p-2.5 bg-indigo-50/50 rounded-xl"><span class="text-base shrink-0">🧬</span><div><p class="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider mb-0.5">환자 성향</p><p class="text-sm text-surface-800">' + psychology.personality_type + '</p></div></div>' : '') +
      '</div>' +
    '</div>';
  }

  // Emotion Flow + Chart
  if (emotionFlow.overall_tone || esc(emotionFlow.summary)) {
    var toneEmoji = { positive: '😊', neutral: '😐', negative: '😔' };
    var toneName = { positive: '긍정적', neutral: '중립', negative: '부정적' };
    var toneColor = { positive: 'emerald', neutral: 'amber', negative: 'rose' };
    var tc = toneColor[emotionFlow.overall_tone] || 'amber';
    html += '<div class="card-premium p-5">' +
      '<div class="flex items-center gap-2 mb-3">' +
        '<div class="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center"><i class="fas fa-face-smile text-xs text-purple-600"></i></div>' +
        '<h3 class="font-bold text-sm text-surface-900">감정 분석</h3>' +
      '</div>' +
      '<div class="flex items-center gap-4 p-3 bg-' + tc + '-50/50 rounded-xl mb-3">' +
        '<div class="text-4xl">' + (toneEmoji[emotionFlow.overall_tone] || '😐') + '</div>' +
        '<div class="flex-1">' +
          '<p class="font-bold text-surface-900">' + (toneName[emotionFlow.overall_tone] || '중립') + '</p>' +
          '<p class="text-xs text-surface-500">전반적 분위기</p>' +
        '</div>' +
        (c.decision_score ? '<div class="text-center"><p class="text-2xl font-black text-brand-600">' + c.decision_score + '<span class="text-xs font-semibold text-surface-400">/10</span></p><p class="text-[9px] text-surface-400">결정도</p></div>' : '') +
      '</div>';
    // Emotion flow timeline chart
    if (emotionFlow.phases && emotionFlow.phases.length > 0) {
      html += '<div class="mb-3"><p class="text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-2">감정 변화 흐름</p>' +
        '<canvas id="emotionFlowChart" height="120"></canvas></div>';
    } else {
      // Simple bar representation of decision score
      html += (c.decision_score ? '<div class="mb-3">' +
        '<div class="flex justify-between text-xs mb-1.5"><span class="font-semibold text-surface-500">결정 근접도</span><span class="font-black text-brand-600">' + c.decision_score + '/10</span></div>' +
        '<div class="w-full bg-surface-100 rounded-full h-2.5 overflow-hidden"><div class="bg-gradient-to-r from-brand-500 to-brand-400 h-2.5 rounded-full transition-all duration-1000" style="width: ' + c.decision_score * 10 + '%"></div></div>' +
      '</div>' : '');
    }
    html += (esc(emotionFlow.summary) ? '<p class="text-sm text-surface-600 leading-relaxed bg-surface-50 p-3 rounded-xl">' + esc(emotionFlow.summary) + '</p>' : '') +
    '</div>';
  }

  // Key Quotes
  if (keyQuotes.length > 0) {
    html += '<div class="card-premium p-5">' +
      '<div class="flex items-center gap-2 mb-3">' +
        '<div class="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center"><i class="fas fa-quote-left text-xs text-amber-600"></i></div>' +
        '<h3 class="font-bold text-sm text-surface-900">핵심 멘트</h3>' +
      '</div>' +
      '<div class="space-y-2">' +
        keyQuotes.map(function(q) {
          return '<div class="p-3 bg-amber-50/50 rounded-xl text-sm text-surface-800 border-l-3 border-amber-400 italic">"' + q + '"</div>';
        }).join('') +
      '</div>' +
    '</div>';
  }

  // Coaching Feedback with Radar Chart
  if (feedback.good_points || feedback.improve_points || feedback.total_score) {
    var scores = feedback.scores || {};
    html += '<div class="card-premium p-5">' +
      '<div class="flex items-center gap-2 mb-3">' +
        '<div class="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center"><i class="fas fa-lightbulb text-xs text-emerald-600"></i></div>' +
        '<h3 class="font-bold text-sm text-surface-900">AI 코칭 피드백</h3>' +
        (feedback.total_score ? '<span class="ml-auto text-xl font-black text-brand-600">' + feedback.total_score + '<span class="text-xs font-semibold text-surface-400">/100</span></span>' : '') +
      '</div>';

    // Radar Chart + Score Grid side by side
    if (feedback.total_score) {
      html += '<div class="flex gap-3 mb-4">';
      // Radar chart (left)
      html += '<div class="w-1/2"><canvas id="coachingRadarChart" height="160"></canvas></div>';
      // Score grid (right)
      html += '<div class="w-1/2 flex flex-col justify-center space-y-2">';
      var areaItems = [
        {key:'needs_identification', name:'니즈 파악', icon:'fa-magnifying-glass', max:25, color:'sky'},
        {key:'value_delivery', name:'가치 전달', icon:'fa-gem', max:25, color:'emerald'},
        {key:'objection_handling', name:'이의 처리', icon:'fa-shield', max:25, color:'amber'},
        {key:'closing', name:'클로징', icon:'fa-handshake', max:25, color:'rose'}
      ];
      areaItems.forEach(function(a) {
        var s = scores[a.key] || 0;
        var pct = Math.round(s / a.max * 100);
        html += '<div class="flex items-center gap-2">' +
          '<i class="fas ' + a.icon + ' text-[9px] text-' + a.color + '-500 w-3"></i>' +
          '<div class="flex-1">' +
            '<div class="flex justify-between mb-0.5"><span class="text-[10px] font-semibold text-surface-600">' + esc(a.name) + '</span><span class="text-[10px] font-black text-surface-800">' + s + '</span></div>' +
            '<div class="h-1.5 bg-surface-100 rounded-full overflow-hidden"><div class="h-full bg-' + a.color + '-500 rounded-full transition-all duration-1000" style="width:' + pct + '%"></div></div>' +
          '</div></div>';
      });
      html += '</div></div>';
    }

    // Score grade badge
    if (feedback.total_score) {
      var grade = feedback.total_score >= 90 ? {label:'S',color:'emerald',desc:'탁월한 상담!'} : 
                  feedback.total_score >= 80 ? {label:'A',color:'brand',desc:'훌륭한 상담'} : 
                  feedback.total_score >= 70 ? {label:'B',color:'sky',desc:'좋은 상담'} :
                  feedback.total_score >= 60 ? {label:'C',color:'amber',desc:'개선 필요'} : 
                  {label:'D',color:'rose',desc:'코칭 권장'};
      html += '<div class="flex items-center justify-center gap-3 p-3 bg-' + grade.color + '-50/50 rounded-xl mb-4 border border-' + grade.color + '-200/30">' +
        '<div class="w-10 h-10 rounded-xl bg-' + grade.color + '-100 flex items-center justify-center"><span class="text-xl font-black text-' + grade.color + '-700">' + grade.label + '</span></div>' +
        '<div><p class="text-sm font-bold text-' + grade.color + '-700">' + grade.desc + '</p><p class="text-[10px] text-surface-500">종합 ' + feedback.total_score + '점</p></div>' +
      '</div>';
    }

    if (feedback.good_points && feedback.good_points.length > 0) {
      html += '<div class="mb-3"><p class="text-xs font-semibold text-emerald-600 mb-2 flex items-center gap-1"><i class="fas fa-check-circle"></i>잘한 점</p>' +
        '<div class="space-y-1">' +
          feedback.good_points.map(function(p) { return '<div class="flex items-start gap-2 text-sm text-surface-700"><span class="text-emerald-500 mt-0.5 shrink-0">•</span>' + p + '</div>'; }).join('') +
        '</div></div>';
    }

    if (feedback.improve_points && feedback.improve_points.length > 0) {
      html += '<div><p class="text-xs font-semibold text-amber-600 mb-2 flex items-center gap-1"><i class="fas fa-arrow-trend-up"></i>개선 포인트</p>' +
        '<div class="space-y-2">' +
          feedback.improve_points.map(function(p) {
            return '<div class="bg-amber-50/50 rounded-xl p-3"><p class="text-sm text-surface-800">• ' + esc(p.issue) + '</p>' +
              (esc(p.suggestion) ? '<p class="text-xs text-brand-600 mt-1 ml-3">💡 "' + esc(p.suggestion) + '"</p>' : '') + '</div>';
          }).join('') +
        '</div></div>';
    }

    html += '</div>';
  }

  // SPIN Analysis Card (from coaching feedback scores)
  if (feedback.total_score) {
    var spinData = {
      situation: { label: '상황 질문', desc: '환자의 현재 상태 파악', score: scores.needs_identification || 0, max: 25, icon: '🔍' },
      problem: { label: '문제 인식', desc: '환자의 불편/필요 탐색', score: Math.round((scores.needs_identification || 0) * 0.6 + (scores.objection_handling || 0) * 0.4), max: 25, icon: '⚡' },
      implication: { label: '시사 제시', desc: '방치 시 결과 안내', score: scores.value_delivery || 0, max: 25, icon: '💡' },
      needPayoff: { label: '해결 가치', desc: '치료 후 기대 효과', score: scores.closing || 0, max: 25, icon: '🎯' }
    };
    html += '<div class="card-premium p-5">' +
      '<div class="flex items-center gap-2 mb-3">' +
        '<div class="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center"><i class="fas fa-chess-knight text-xs text-violet-600"></i></div>' +
        '<h3 class="font-bold text-sm text-surface-900">SPIN 상담 전략 분석</h3>' +
        '<span class="ml-auto text-[10px] font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-lg">Patient Funnel</span>' +
      '</div>';
    
    // SPIN Progress Bars
    html += '<div class="space-y-3">';
    ['situation','problem','implication','needPayoff'].forEach(function(key) {
      var sp = spinData[key];
      var pct = Math.round(sp.score / sp.max * 100);
      var barColor = pct >= 80 ? 'from-emerald-500 to-emerald-400' : pct >= 60 ? 'from-brand-500 to-brand-400' : pct >= 40 ? 'from-amber-500 to-amber-400' : 'from-rose-500 to-rose-400';
      html += '<div>' +
        '<div class="flex items-center justify-between mb-1">' +
          '<div class="flex items-center gap-1.5"><span class="text-sm">' + sp.icon + '</span><span class="text-xs font-bold text-surface-800">' + sp.label + '</span></div>' +
          '<span class="text-xs font-black text-surface-700">' + sp.score + '<span class="text-surface-400 font-semibold">/' + sp.max + '</span></span>' +
        '</div>' +
        '<div class="h-2 bg-surface-100 rounded-full overflow-hidden"><div class="h-full bg-gradient-to-r ' + barColor + ' rounded-full transition-all duration-1000" style="width:' + pct + '%"></div></div>' +
        '<p class="text-[10px] text-surface-400 mt-0.5">' + sp.desc + '</p>' +
      '</div>';
    });
    html += '</div>';

    // SPIN Strategy Tip
    var weakest = ['situation','problem','implication','needPayoff'].sort(function(a,b) { return spinData[a].score - spinData[b].score; })[0];
    var tipMap = {
      situation: '현재 환자의 생활 습관, 통증 빈도, 이전 치과 경험을 더 깊이 물어보세요.',
      problem: '환자가 겪는 불편함을 구체적으로 표현하도록 유도하세요. "어떤 점이 가장 불편하세요?"',
      implication: '치료를 미루면 어떤 결과가 생기는지 시각화하여 설명하세요.',
      needPayoff: '치료 후 달라지는 일상의 변화를 구체적으로 그려주세요.'
    };
    html += '<div class="mt-3 p-3 bg-gradient-to-r from-violet-50 to-purple-50/30 rounded-xl border border-violet-100/50">' +
      '<p class="text-[10px] font-bold text-violet-600 mb-1"><i class="fas fa-lightbulb mr-1"></i>AI 전략 코칭 — ' + spinData[weakest].label + ' 강화 필요</p>' +
      '<p class="text-xs text-surface-700 leading-relaxed">' + tipMap[weakest] + '</p>' +
    '</div></div>';
  }

  // Next Step Strategy Card (for undecided patients)
  if (c.status === 'undecided') {
    var nextSteps = [];
    if (psychology.fear) nextSteps.push({icon:'😰', text:'두려움 해소: "' + psychology.fear + '" → 성공 사례 공유 권장'});
    if (psychology.hesitation_reason) nextSteps.push({icon:'🤔', text:'미결정 사유 대응: "' + psychology.hesitation_reason + '" → 맞춤 해결책 준비'});
    if (psychology.decision_maker && psychology.decision_maker !== '본인') nextSteps.push({icon:'👥', text:'결정권자(' + psychology.decision_maker + ') 동반 내원 유도'});
    if (psychology.budget) nextSteps.push({icon:'💰', text:'예산(' + psychology.budget + ') 맞춤 분납/할인 플랜 제시'});
    if (c.decision_score && c.decision_score >= 7) nextSteps.push({icon:'🔥', text:'결정도 높음! 48시간 내 팔로업 전화 필수'});
    else if (c.decision_score) nextSteps.push({icon:'📞', text:'3일 내 안부 연락 후 상담 시 나온 관심사 언급'});
    
    if (nextSteps.length > 0) {
      html += '<div class="card-premium p-5 border-l-4 border-l-brand-400 bg-gradient-to-r from-brand-50/30 to-transparent">' +
        '<div class="flex items-center gap-2 mb-3">' +
          '<div class="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center"><i class="fas fa-route text-xs text-brand-600"></i></div>' +
          '<h3 class="font-bold text-sm text-surface-900">다음 단계 전략</h3>' +
          '<span class="ml-auto text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-lg animate-pulse">ACTION</span>' +
        '</div>' +
        '<div class="space-y-2">';
      nextSteps.forEach(function(step) {
        html += '<div class="flex items-start gap-2.5 p-2.5 bg-white/60 rounded-lg">' +
          '<span class="text-base shrink-0">' + step.icon + '</span>' +
          '<p class="text-xs text-surface-700 leading-relaxed">' + esc(step.text) + '</p>' +
        '</div>';
      });
      html += '</div></div>';
    }
  }

  // Companion Info
  if (c.companion && c.companion.present) {
    html += '<div class="card-premium p-4">' +
      '<div class="flex items-center gap-3">' +
        '<div class="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center"><span class="text-lg">👥</span></div>' +
        '<div class="flex-1">' +
          '<p class="font-bold text-sm text-surface-900">동반인 정보</p>' +
          '<p class="text-xs text-surface-500">' + (c.companion.relationship || '관계 미상') + (c.companion.reaction ? ' · 반응: ' + c.companion.reaction : '') + '</p>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  // Actions
  html += '<div class="space-y-2 pt-2">';
  if (isUnlinked) {
    html += '<button onclick="showLinkModal()" class="w-full bg-gradient-brand text-white font-semibold py-3.5 px-4 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2">' +
      '<i class="fas fa-link"></i>환자 연결하기</button>';
  } else {
    if (c.status === 'undecided' && c.patient_phone) {
      html += '<a href="tel:' + c.patient_phone + '" class="block w-full bg-gradient-brand text-white font-semibold py-3.5 px-4 rounded-xl text-center transition-all active:scale-[0.98] shadow-lg shadow-brand-600/20">' +
        '<i class="fas fa-phone mr-2"></i>환자에게 연락하기</a>';
    }
    html += '<a href="/patients/' + c.patient_id + '" class="block w-full bg-surface-100 hover:bg-surface-200 text-surface-800 font-semibold py-3.5 px-4 rounded-xl text-center transition-all active:scale-[0.98]">' +
      '<i class="fas fa-user mr-2"></i>환자 카드 보기</a>';
  }
  html += '</div></div>';

  container.innerHTML = html;

  // 터치 리포트 상태 로드 (비동기 — 카드 액션 버튼 갱신)
  loadTouchReportStatus(c);

  // Render Charts after DOM update
  setTimeout(function() {
    // Coaching Radar Chart
    var radarCanvas = document.getElementById('coachingRadarChart');
    if (radarCanvas && window.Chart && feedback.total_score) {
      var sc = feedback.scores || {};
      new Chart(radarCanvas.getContext('2d'), {
        type: 'radar',
        data: {
          labels: ['니즈 파악', '가치 전달', '이의 처리', '클로징'],
          datasets: [{
            label: '이번 상담',
            data: [sc.needs_identification||0, sc.value_delivery||0, sc.objection_handling||0, sc.closing||0],
            backgroundColor: 'rgba(99,102,241,0.15)',
            borderColor: 'rgba(99,102,241,0.8)',
            borderWidth: 2,
            pointBackgroundColor: '#6366f1',
            pointRadius: 4,
            pointHoverRadius: 6
          }, {
            label: '목표 (25)',
            data: [25, 25, 25, 25],
            backgroundColor: 'rgba(148,163,184,0.05)',
            borderColor: 'rgba(148,163,184,0.3)',
            borderWidth: 1,
            borderDash: [4,4],
            pointRadius: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          scales: { r: { beginAtZero: true, max: 25, ticks: { display: false, stepSize: 5 }, grid: { color: 'rgba(148,163,184,0.15)' }, pointLabels: { font: { size: 9, family: 'Pretendard Variable', weight: '600' }, color: '#64748b' } } },
          plugins: { legend: { display: false } }
        }
      });
    }

    // Emotion Flow Chart
    var emotionCanvas = document.getElementById('emotionFlowChart');
    if (emotionCanvas && window.Chart && emotionFlow.phases) {
      var phases = emotionFlow.phases;
      var phaseLabels = phases.map(function(p) { return p.label || p.phase || ''; });
      var phaseScores = phases.map(function(p) {
        if (p.sentiment === 'positive' || p.tone === 'positive') return 3;
        if (p.sentiment === 'neutral' || p.tone === 'neutral') return 2;
        if (p.sentiment === 'negative' || p.tone === 'negative') return 1;
        return p.score || 2;
      });
      var phaseColors = phaseScores.map(function(s) {
        return s >= 3 ? '#10b981' : s >= 2 ? '#f59e0b' : '#ef4444';
      });
      new Chart(emotionCanvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: phaseLabels,
          datasets: [{
            data: phaseScores,
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139,92,246,0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: phaseColors,
            pointBorderColor: phaseColors,
            pointRadius: 6,
            pointHoverRadius: 8,
            borderWidth: 2.5
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: {
            y: { min: 0, max: 4, ticks: { display: false }, grid: { color: 'rgba(148,163,184,0.1)' } },
            x: { grid: { display: false }, ticks: { font: { size: 9 } } }
          },
          plugins: { legend: { display: false }, tooltip: {
            callbacks: {
              label: function(ctx) {
                var s = ctx.raw;
                return s >= 3 ? '긍정' : s >= 2 ? '중립' : '부정';
              }
            }
          } }
        }
      });
    }
  }, 100);
}

async function showLinkModal() {
  if (allPatients.length === 0) {
    var res = await fetch('/api/patients?limit=100');
    var data = await res.json();
    if (data.success) allPatients = data.data;
  }
  document.getElementById('linkPatientModal').classList.remove('hidden');
  renderPatientList(allPatients);
}

function closeLinkModal() { document.getElementById('linkPatientModal').classList.add('hidden'); }

function renderPatientList(patients) {
  var container = document.getElementById('patientList');
  if (patients.length === 0) {
    container.innerHTML = '<p class="text-surface-500 text-center py-6 text-sm">검색 결과가 없습니다</p>';
    return;
  }
  container.innerHTML = patients.map(function(p, i) {
    var c = PT.avatarColor(p.name); // v8.6: shared
    return '<button class="w-full flex items-center gap-3 p-3 bg-surface-50 hover:bg-surface-100 rounded-xl transition-all text-left active:scale-[0.98]" onclick="linkPatient(\'' + p.id + '\')">' +
      '<div class="w-10 h-10 rounded-xl ' + c + ' flex items-center justify-center font-bold text-sm shrink-0">' + esc(p.name).charAt(0) + '</div>' +
      '<div class="min-w-0"><p class="font-semibold text-surface-900 text-sm">' + esc(p.name) + '</p><p class="text-surface-500 text-xs">' + (p.phone || '연락처 없음') + '</p></div>' +
    '</button>';
  }).join('');
}

async function linkPatient(patientId) {
  try {
    var res = await fetch('/api/consultations/' + consultationId + '/link-patient', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient_id: patientId })
    });
    var data = await res.json();
    if (data.success) { closeLinkModal(); loadConsultation(); }
    else { showToast(data.error || '환자 연결에 실패했습니다.','error'); }
  } catch (err) { showToast('오류가 발생했습니다.','error'); }
}

function filterPatients(query) {
  var q = query.toLowerCase();
  var filtered = allPatients.filter(function(p) { return esc(p.name).toLowerCase().includes(q) || (p.phone && p.phone.includes(q)); });
  renderPatientList(filtered);
}

function showExistingTab() {
  document.getElementById('tabExisting').className = 'flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all bg-white text-surface-900 shadow-sm';
  document.getElementById('tabNew').className = 'flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all text-surface-500 hover:text-surface-700';
  document.getElementById('existingPatientArea').classList.remove('hidden');
  document.getElementById('newPatientArea').classList.add('hidden');
}

function showNewTab() {
  document.getElementById('tabNew').className = 'flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all bg-white text-surface-900 shadow-sm';
  document.getElementById('tabExisting').className = 'flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all text-surface-500 hover:text-surface-700';
  document.getElementById('newPatientArea').classList.remove('hidden');
  document.getElementById('existingPatientArea').classList.add('hidden');
}

async function createAndLinkPatient(e) {
  e.preventDefault();
  var form = e.target;
  var formData = new FormData(form);
  try {
    var patientRes = await fetch('/api/patients', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: formData.get('name'), phone: formData.get('phone') || undefined, age: formData.get('age') ? parseInt(formData.get('age')) : undefined, gender: formData.get('gender') || undefined })
    });
    var patientData = await patientRes.json();
    if (!patientData.success) { showToast(patientData.error || '환자 등록에 실패했습니다.','error'); return false; }
    await linkPatient(patientData.data.id);
  } catch (err) { showToast('오류가 발생했습니다.','error'); }
  return false;
}

function toggleTranscript() { document.getElementById('fullTranscript').classList.toggle('hidden'); }

// =========================================
// v8.0: Analysis Status Polling
// =========================================
var _statusPollTimer = null;
function startStatusPolling() {
  if (_statusPollTimer) return;
  var attempts = 0;
  _statusPollTimer = setInterval(function () {
    attempts++;
    if (attempts > 120) { clearInterval(_statusPollTimer); _statusPollTimer = null; return; }
    fetch('/api/consultations/' + consultationId + '/analysis-status')
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success) return;
        var d = res.data;
        var label = document.getElementById('analysisStepLabel');
        if (label) label.textContent = d.step_label + ' (' + d.progress + '%)';
        if (d.status === 'completed' || d.status === 'failed') {
          clearInterval(_statusPollTimer); _statusPollTimer = null;
          loadConsultation(); // 배너/리포트 갱신
        }
      })
      .catch(function () {});
  }, 3000);
}

// =========================================
// v8.0: Re-analyze
// =========================================
async function reanalyzeConsultation() {
  var btn = document.getElementById('reanalyzeBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-circle-notch fa-spin text-[10px] mr-1"></i>분석 시작 중...'; }
  try {
    var res = await fetch('/api/consultations/' + consultationId + '/reanalyze', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    var data = await res.json();
    if (data.success) {
      showToast('재분석을 시작했습니다. 잠시 후 자동으로 갱신됩니다.', 'success');
      loadConsultation();
    } else {
      showToast(data.error || '재분석 시작에 실패했습니다.', 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-rotate-right text-[10px]"></i>다시 분석하기'; }
    }
  } catch (e) {
    showToast('네트워크 오류가 발생했습니다.', 'error');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-rotate-right text-[10px]"></i>다시 분석하기'; }
  }
}

// =========================================
// v8.0: Audio Playback (단일 파일 + 세그먼트 순차 재생)
// =========================================
var _audioSegments = null;
var _currentSegIdx = 0;

async function loadAudioPlayer() {
  var body = document.getElementById('audioPlayerBody');
  var btn = document.getElementById('loadAudioBtn');
  if (!body) return;
  if (!body.classList.contains('hidden')) { body.classList.add('hidden'); return; }
  body.classList.remove('hidden');
  body.innerHTML = '<p class="text-xs text-surface-400"><i class="fas fa-circle-notch fa-spin mr-1"></i>녹음 불러오는 중...</p>';

  try {
    var res = await fetch('/api/consultations/' + consultationId + '/audio');
    var contentType = res.headers.get('content-type') || '';

    if (contentType.indexOf('audio') !== -1) {
      // 단일 파일 스트리밍
      var blob = await res.blob();
      renderSingleAudio(body, URL.createObjectURL(blob));
    } else {
      var data = await res.json();
      if (data.success && data.data.type === 'segments' && data.data.segments.length > 0) {
        _audioSegments = data.data.segments;
        _currentSegIdx = 0;
        renderSegmentAudio(body);
      } else {
        body.innerHTML = '<p class="text-xs text-surface-400">재생 가능한 녹음이 없습니다.</p>';
      }
    }
  } catch (e) {
    body.innerHTML = '<p class="text-xs text-rose-500">오디오 로드에 실패했습니다.</p>';
  }
}

function renderSingleAudio(body, url) {
  body.innerHTML = '<audio controls preload="metadata" class="w-full" style="height:40px" src="' + url + '"></audio>' +
    '<p class="text-[10px] text-surface-400 mt-1.5"><i class="fas fa-lightbulb text-amber-400 mr-1"></i>AI가 지적한 구간을 직접 들으며 복기하면 성장 속도가 2배입니다</p>';
}

function renderSegmentAudio(body) {
  var total = _audioSegments.length;
  body.innerHTML =
    '<audio id="segAudio" controls preload="auto" class="w-full" style="height:40px"></audio>' +
    '<div class="flex items-center justify-between mt-2">' +
      '<button onclick="playSegment(_currentSegIdx-1)" class="px-2.5 py-1.5 rounded-lg bg-surface-100 text-surface-600 text-[10px] font-semibold"><i class="fas fa-backward-step mr-1"></i>이전</button>' +
      '<span id="segLabel" class="text-[11px] font-semibold text-surface-600">구간 1 / ' + total + ' (각 1분)</span>' +
      '<button onclick="playSegment(_currentSegIdx+1)" class="px-2.5 py-1.5 rounded-lg bg-surface-100 text-surface-600 text-[10px] font-semibold">다음<i class="fas fa-forward-step ml-1"></i></button>' +
    '</div>' +
    '<p class="text-[10px] text-surface-400 mt-1.5"><i class="fas fa-lightbulb text-amber-400 mr-1"></i>구간이 끝나면 자동으로 다음 구간이 재생됩니다</p>';

  var audio = document.getElementById('segAudio');
  audio.addEventListener('ended', function () {
    if (_currentSegIdx < total - 1) playSegment(_currentSegIdx + 1, true);
  });
  playSegment(0);
}

function playSegment(idx, autoplay) {
  if (!_audioSegments || idx < 0 || idx >= _audioSegments.length) return;
  _currentSegIdx = idx;
  var audio = document.getElementById('segAudio');
  var label = document.getElementById('segLabel');
  if (label) label.textContent = '구간 ' + (idx + 1) + ' / ' + _audioSegments.length + ' (각 1분)';
  audio.src = '/api/consultations/' + consultationId + '/audio?segment=' + _audioSegments[idx];
  if (autoplay) audio.play().catch(function () {});
}

// ============================================
// 터치 리포트 — 상담 상세 진입점
// ============================================
async function loadTouchReportStatus(c) {
  var el = document.getElementById('touchReportAction');
  if (!el) return;
  try {
    var res = await fetch('/api/touch-report/manage/list');
    var data = await res.json();
    var mine = (data.success ? data.data : []).filter(function (r) { return r.consultation_id === consultationId; });
    // 최신 리포트 1건
    var r = mine.length ? mine[0] : null;
    renderTouchReportAction(el, r, c);
  } catch (e) {
    el.innerHTML = '';
  }
}

function renderTouchReportAction(el, r, c) {
  var canGenerate = c && c.transcript && String(c.transcript).trim().length >= 50 && c.patient_id;
  if (!r) {
    if (!canGenerate) {
      el.innerHTML = '<span class="text-[11px] text-surface-400">' + (c && c.patient_id ? '녹취록 필요' : '환자 연결 필요') + '</span>';
      return;
    }
    el.innerHTML = '<button onclick="generateTouchReport()" class="px-3.5 py-2 rounded-lg bg-brand-50 text-brand-600 text-xs font-semibold hover:bg-brand-100 transition-colors"><i class="fas fa-wand-magic-sparkles mr-1 text-[10px]"></i>만들기</button>';
    return;
  }
  var map = {
    generating: '<span class="px-3 py-1.5 rounded-full text-[11px] font-bold bg-surface-100 text-surface-600"><i class="fas fa-spinner fa-spin mr-1"></i>생성중</span>',
    review: '<a href="/touch-reports/' + r.id + '/review" class="px-3.5 py-2 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-colors"><i class="fas fa-magnifying-glass mr-1 text-[10px]"></i>검수하기</a>',
    approved: '<a href="/touch-reports/' + r.id + '/review" class="px-3.5 py-2 rounded-lg bg-brand-50 text-brand-600 text-xs font-bold hover:bg-brand-100 transition-colors"><i class="fas fa-paper-plane mr-1 text-[10px]"></i>발송하기</a>',
    sent: '<a href="/touch-reports/' + r.id + '/review" class="px-3.5 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors"><i class="fas fa-check mr-1 text-[10px]"></i>발송완료' + (r.open_count ? ' · 열람 ' + r.open_count : '') + '</a>',
    failed: '<button onclick="generateTouchReport()" class="px-3.5 py-2 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100 transition-colors"><i class="fas fa-rotate-right mr-1 text-[10px]"></i>재시도</button>',
  };
  el.innerHTML = map[r.status] || '';
  // 생성중이면 5초 후 재확인
  if (r.status === 'generating') {
    setTimeout(function () { loadTouchReportStatus(currentConsultation); }, 5000);
  }
}

async function generateTouchReport() {
  var el = document.getElementById('touchReportAction');
  el.innerHTML = '<span class="text-xs text-surface-300"><i class="fas fa-spinner fa-spin"></i></span>';
  try {
    var res = await fetch('/api/touch-report/manage/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consultation_id: consultationId }),
    });
    var data = await res.json();
    if (!data.success) {
      if (data.code === 'CONSENT_REQUIRED') {
        showConsentModal();
        renderTouchReportAction(el, null, currentConsultation);
        return;
      }
      alert(data.error || '생성 실패');
      renderTouchReportAction(el, null, currentConsultation);
      return;
    }
    loadTouchReportStatus(currentConsultation);
  } catch (e) {
    alert('네트워크 오류');
    renderTouchReportAction(el, null, currentConsultation);
  }
}

// 동의 기록 모달 (제작서 §7: 동의 없으면 생성 차단)
function showConsentModal() {
  var existing = document.getElementById('trConsentModal');
  if (existing) existing.remove();
  var modal = document.createElement('div');
  modal.id = 'trConsentModal';
  modal.className = 'fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center';
  modal.innerHTML =
    '<div class="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg p-6 animate-slide-up">' +
      '<div class="flex justify-between items-center mb-4">' +
        '<h3 class="text-base font-bold text-surface-900"><i class="fas fa-file-signature text-brand-500 mr-2"></i>환자 동의 기록</h3>' +
        '<button onclick="document.getElementById(\'trConsentModal\').remove()" class="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-100 text-surface-500"><i class="fas fa-xmark"></i></button>' +
      '</div>' +
      '<p class="text-sm text-surface-500 mb-4 leading-relaxed">보고서 생성·발송에는 환자 동의가 필요합니다.<br/>동의서를 받았다면 아래 항목을 체크해주세요.</p>' +
      '<div class="space-y-2.5 mb-5">' +
        consentRow('recording', '상담 녹음 동의') +
        consentRow('ai_processing', 'AI 요약 처리 동의') +
        consentRow('kakao_delivery', '카카오톡 보고서 발송 동의 <span class="text-[10px] text-rose-500 font-bold">(필수)</span>') +
      '</div>' +
      '<button onclick="saveConsents()" class="w-full py-3.5 rounded-xl bg-gradient-brand text-white font-bold text-sm shadow-md shadow-brand-600/20 active:scale-[0.98] transition-all">동의 기록 저장</button>' +
    '</div>';
  modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

function consentRow(type, label) {
  return '<label class="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-50 border border-surface-200 cursor-pointer">' +
    '<input type="checkbox" class="tr-consent-cb w-5 h-5 rounded-md accent-[#7c4dff]" data-type="' + type + '" checked/>' +
    '<span class="text-sm font-semibold text-surface-800">' + label + '</span></label>';
}

async function saveConsents() {
  if (!currentConsultation || !currentConsultation.patient_id) { alert('환자가 연결되지 않았습니다'); return; }
  var consents = Array.prototype.map.call(document.querySelectorAll('.tr-consent-cb'), function (cb) {
    return { type: cb.dataset.type, granted: cb.checked };
  });
  var kakao = consents.find(function (x) { return x.type === 'kakao_delivery'; });
  try {
    var res = await fetch('/api/touch-report/manage/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient_id: currentConsultation.patient_id, consents: consents }),
    });
    var data = await res.json();
    if (!data.success) { alert(data.error || '저장 실패'); return; }
    document.getElementById('trConsentModal').remove();
    if (kakao && kakao.granted) generateTouchReport();
  } catch (e) {
    alert('네트워크 오류');
  }
}

loadConsultation();
