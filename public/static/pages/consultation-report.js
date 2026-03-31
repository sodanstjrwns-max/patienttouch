const consultationId = '${id}';
let reportData = null;
let proposalData = null;

async function loadReport() {
  try {
    const authRes = await fetch('/api/auth/me');
    if (!authRes.ok) { window.location.href = '/login'; return; }
    const reportRes = await fetch('/api/reports/' + consultationId);
    if (reportRes.status === 401) { window.location.href = '/login'; return; }
    const reportJson = await reportRes.json();
    if (reportJson.success) { reportData = reportJson.data; renderReport(reportData); }
    else { showGeneratePrompt(); }
  } catch (err) { console.error('Failed to load report:', err); showError(); }
}

function showGeneratePrompt() {
  document.getElementById('reportContent').innerHTML =
    '<div class="text-center py-16 animate-fade-in">' +
      '<div class="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-brand-100 to-purple-100 flex items-center justify-center">' +
        '<i class="fas fa-wand-magic-sparkles text-4xl text-gradient"></i>' +
      '</div>' +
      '<h3 class="text-xl font-bold text-surface-900 mb-2">AI 레포트 생성</h3>' +
      '<p class="text-surface-500 text-sm mb-8 leading-relaxed">녹음된 상담을 AI가 분석하여<br/>상세 레포트를 생성합니다</p>' +
      '<button onclick="generateReport()" class="inline-flex items-center gap-2 bg-gradient-brand text-white font-semibold py-3.5 px-8 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-brand-600/30">' +
        '<i class="fas fa-sparkles"></i>레포트 생성하기' +
      '</button>' +
    '</div>';
}

async function generateReport() {
  var steps = [
    { icon: 'fa-microphone', text: '음성 인식 (STT)...' },
    { icon: 'fa-users', text: '화자 분리 중...' },
    { icon: 'fa-search', text: '핵심 정보 추출 (NER)...' },
    { icon: 'fa-comments', text: 'SPIN 화법 분석...' },
    { icon: 'fa-file-lines', text: 'AI 리포트 생성 중...' }
  ];
  var stepIdx = 0;
  document.getElementById('reportContent').innerHTML =
    '<div class="text-center py-16 animate-fade-in">' +
      '<div class="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-brand-100 to-purple-100 flex items-center justify-center animate-pulse-soft">' +
        '<i class="fas fa-brain text-4xl text-brand-600"></i>' +
      '</div>' +
      '<h3 class="text-xl font-bold text-surface-900 mb-2">GPT-5 심층 분석 중...</h3>' +
      '<p class="text-surface-500 text-sm leading-relaxed">5단계 AI 파이프라인을 실행하고 있습니다<br/>약 1~3분 소요됩니다</p>' +
      '<div class="w-64 mx-auto mt-6 bg-surface-100 rounded-full h-2 overflow-hidden">' +
        '<div id="progressBar" class="bg-gradient-brand h-full rounded-full transition-all duration-1000" style="width:5%"></div>' +
      '</div>' +
      '<p id="analysisStep" class="text-xs text-surface-400 mt-3"><i class="fas fa-microphone mr-1"></i>음성 인식 준비 중...</p>' +
      '<p class="text-[10px] text-surface-300 mt-1" id="elapsedTime">0초 경과</p>' +
    '</div>';

  var startTime = Date.now();
  var stepTimer = setInterval(function() {
    var elapsed = Math.floor((Date.now() - startTime) / 1000);
    var el = document.getElementById('elapsedTime');
    if (el) el.textContent = elapsed + '초 경과';
    // Cycle through steps to show progress
    if (elapsed > 5 && stepIdx < 1) stepIdx = 1;
    if (elapsed > 15 && stepIdx < 2) stepIdx = 2;
    if (elapsed > 25 && stepIdx < 3) stepIdx = 3;
    if (elapsed > 40 && stepIdx < 4) stepIdx = 4;
    var pBar = document.getElementById('progressBar');
    var sEl = document.getElementById('analysisStep');
    if (pBar) pBar.style.width = Math.min(5 + stepIdx * 20, 95) + '%';
    if (sEl && steps[stepIdx]) sEl.innerHTML = '<i class="fas ' + steps[stepIdx].icon + ' mr-1"></i>' + steps[stepIdx].text;
  }, 1000);

  try {
    // Step 1: Trigger generation (returns immediately)
    const triggerRes = await fetch('/api/reports/' + consultationId + '/generate', { method: 'POST' });
    if (triggerRes.status === 401) { clearInterval(stepTimer); window.location.href = '/login'; return; }
    const triggerData = await triggerRes.json();
    if (!triggerData.success) { clearInterval(stepTimer); showError(triggerData.error); return; }

    // Step 2: Poll for completion
    var maxPolls = 90; // 90 * 3s = 270s max
    var pollCount = 0;
    while (pollCount < maxPolls) {
      await new Promise(function(r) { setTimeout(r, 3000); });
      pollCount++;
      try {
        const statusRes = await fetch('/api/reports/' + consultationId + '/status');
        if (statusRes.status === 401) { clearInterval(stepTimer); window.location.href = '/login'; return; }
        const statusData = await statusRes.json();
        if (!statusData.success) continue;
        if (statusData.data.status === 'completed') {
          clearInterval(stepTimer);
          var pBar = document.getElementById('progressBar');
          if (pBar) pBar.style.width = '100%';
          reportData = statusData.data.report;
          setTimeout(function() { renderReport({ ...statusData.data.report, id: statusData.data.report_id }); }, 500);
          return;
        }
        if (statusData.data.status === 'failed') {
          clearInterval(stepTimer);
          showError('AI 분석에 실패했습니다. 다시 시도해주세요.');
          return;
        }
      } catch(pollErr) { /* network hiccup, keep polling */ }
    }
    clearInterval(stepTimer);
    showError('분석 시간이 초과되었습니다 (270초). 잠시 후 다시 시도해주세요.');
  } catch (err) {
    clearInterval(stepTimer);
    showError('네트워크 오류: ' + (esc(err.message) || '연결에 실패했습니다.'));
  }
}

function showError(message) {
  message = message || '오류가 발생했습니다.';
  document.getElementById('reportContent').innerHTML =
    '<div class="text-center py-16 animate-fade-in">' +
      '<div class="w-20 h-20 mx-auto mb-5 rounded-2xl bg-rose-50 flex items-center justify-center"><i class="fas fa-triangle-exclamation text-3xl text-rose-400"></i></div>' +
      '<h3 class="text-lg font-bold text-surface-900 mb-2">레포트 생성에 실패했습니다.</h3>' +
      '<p class="text-surface-500 text-sm mb-6 px-8">' + message + '</p>' +
      '<div class="flex flex-col gap-3 items-center">' +
        '<button onclick="generateReport()" class="inline-flex items-center gap-2 bg-gradient-brand text-white font-semibold py-3 px-8 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-brand-600/30"><i class="fas fa-arrows-rotate"></i>다시 시도</button>' +
        '<button onclick="window.location.href=\'/consultations\'" class="text-surface-400 text-sm hover:text-surface-600 transition-colors">상담 목록으로</button>' +
      '</div>' +
    '</div>';
}

function sec(title, icon, iconBg) {
  return '<div class="flex items-center gap-2 mb-3">' +
    '<div class="w-7 h-7 rounded-lg ' + iconBg + ' flex items-center justify-center"><i class="' + icon + ' text-xs"></i></div>' +
    '<h3 class="font-bold text-sm text-surface-900">' + title + '</h3></div>';
}

function gradeStyle(grade) {
  var m = { S:'bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-900', A:'bg-emerald-100 text-emerald-700', B:'bg-sky-100 text-sky-700', C:'bg-amber-100 text-amber-700', D:'bg-rose-100 text-rose-700' };
  return m[grade] || m['C'];
}

function renderReport(report) {
  var container = document.getElementById('reportContent');
  document.getElementById('bottomActions').classList.remove('hidden');

  var sentimentEmoji = { very_positive: '😊', positive: '🙂', neutral: '😐', negative: '😟', very_negative: '😔' };
  var sentimentText = { very_positive: '매우 긍정적', positive: '긍정적', neutral: '중립', negative: '부정적', very_negative: '매우 부정적' };

  var html = '<div class="space-y-3 stagger-children">';

  // Summary
  html += '<div class="card-premium p-5">' +
    sec('상담 요약', 'fas fa-file-lines text-brand-600', 'bg-brand-50') +
    '<div class="text-surface-700 text-sm leading-relaxed whitespace-pre-line">' + (esc(report.consultation_summary) || '') + '</div></div>';

  // Treatment Options
  if (report.treatment_options && report.treatment_options.length > 0) {
    html += '<div class="card-premium p-5">' +
      sec('치료 옵션', 'fas fa-tooth text-emerald-600', 'bg-emerald-50') +
      '<div class="space-y-2.5">';
    report.treatment_options.forEach(function(opt) {
      var isRec = opt.recommendation_level === 'high';
      html += '<div class="p-3.5 rounded-xl border-2 transition-all ' + (isRec ? 'border-brand-300 bg-brand-50/50 shadow-sm shadow-brand-200/30' : 'border-surface-200 bg-surface-50/50') + '">' +
        '<div class="flex justify-between items-start mb-2">' +
          '<div class="flex items-center gap-2"><span class="font-bold text-sm ' + (isRec ? 'text-brand-700' : 'text-surface-900') + '">' + esc(opt.name) + '</span>' +
          (isRec ? '<span class="text-[10px] font-bold bg-brand-600 text-white px-2 py-0.5 rounded-md">추천</span>' : '') + '</div>' +
          '<span class="text-lg font-black text-surface-900">' + (opt.price > 0 ? (opt.price / 10000).toFixed(0) + '<span class="text-xs font-semibold text-surface-400">만</span>' : '<span class="text-xs font-semibold text-surface-400">미정</span>') + '</span>' +
        '</div>' +
        (opt.duration ? '<p class="text-xs text-surface-500 mb-2 flex items-center gap-1"><i class="fas fa-clock text-[10px]"></i>' + opt.duration + '</p>' : '') +
        '<div class="space-y-1">' +
          (opt.pros ? opt.pros.map(function(p) { return '<div class="text-xs text-emerald-700 flex items-center gap-1.5"><i class="fas fa-check text-[9px]"></i>' + p + '</div>'; }).join('') : '') +
          (opt.cons ? opt.cons.map(function(c) { return '<div class="text-xs text-rose-600 flex items-center gap-1.5"><i class="fas fa-xmark text-[9px]"></i>' + c + '</div>'; }).join('') : '') +
        '</div></div>';
    });
    html += '</div></div>';

    // Payment Options
    if (report.payment_options && report.payment_options.installment_options && report.payment_options.installment_options.length > 0) {
      html += '<div class="card-premium p-5 bg-gradient-to-br from-sky-50/50 to-brand-50/30">' +
        sec('결제 옵션', 'fas fa-credit-card text-sky-600', 'bg-sky-50') +
        '<div class="grid grid-cols-3 gap-2">';
      report.payment_options.installment_options.forEach(function(inst) {
        html += '<div class="bg-white rounded-xl p-3 text-center border border-surface-100 shadow-sm">' +
          '<p class="text-[10px] text-surface-400 font-semibold">' + inst.months + '개월</p>' +
          '<p class="text-lg font-black text-brand-600">' + Math.round(inst.monthly_amount / 10000) + '<span class="text-xs font-semibold text-surface-400">만</span></p>' +
          '<p class="text-[10px] text-surface-400">/월</p></div>';
      });
      html += '</div></div>';
    }
  }

  // Patient Concerns
  if (report.patient_concerns && report.patient_concerns.length > 0) {
    html += '<div class="card-premium p-5">' +
      sec('환자 우려사항', 'fas fa-heart text-rose-600', 'bg-rose-50') +
      '<div class="space-y-2">';
    report.patient_concerns.forEach(function(concern) {
      html += '<div class="flex items-start gap-2.5 p-3 rounded-xl ' + (concern.addressed ? 'bg-emerald-50/50' : 'bg-amber-50/50') + '">' +
        '<div class="w-6 h-6 rounded-lg shrink-0 mt-0.5 flex items-center justify-center ' + (concern.addressed ? 'bg-emerald-100' : 'bg-amber-100') + '">' +
          '<i class="fas ' + (concern.addressed ? 'fa-check text-emerald-600' : 'fa-exclamation text-amber-600') + ' text-[10px]"></i></div>' +
        '<div><p class="text-sm text-surface-800 font-medium">' + esc(concern.concern) + '</p>' +
        (concern.resolution ? '<p class="text-xs text-surface-500 mt-1">→ ' + concern.resolution + '</p>' : '') +
        '</div></div>';
    });
    html += '</div></div>';
  }

  // Emotion & Decision
  html += '<div class="card-premium p-5">' +
    sec('감정선 분석', 'fas fa-chart-line text-purple-600', 'bg-purple-50') +
    '<div class="flex items-center gap-4 p-3 bg-surface-50 rounded-xl mb-3">' +
      '<div class="text-4xl">' + (sentimentEmoji[report.overall_sentiment] || '😐') + '</div>' +
      '<div><p class="font-bold text-surface-900">' + (sentimentText[report.overall_sentiment] || '중립') + '</p>' +
      '<p class="text-xs text-surface-500">' + (report.emotion_summary || '') + '</p></div>' +
    '</div>' +
    '<div class="flex items-center gap-3 mb-2">' +
      '<span class="text-xs font-semibold text-surface-500">결정 근접도</span>' +
      '<div class="flex-1 bg-surface-100 rounded-full h-2 overflow-hidden"><div class="bg-gradient-to-r from-brand-500 to-brand-400 h-2 rounded-full" style="width:' + ((report.decision_score || 5) * 10) + '%"></div></div>' +
      '<span class="font-black text-brand-600 text-sm">' + (report.decision_score || 5) + '/10</span>' +
    '</div>' +
    (report.decision_prediction ? '<p class="text-sm text-surface-600 bg-surface-50 p-3 rounded-xl">' + report.decision_prediction + '</p>' : '');

  // Emotion Timeline
  if (report.emotion_timeline && report.emotion_timeline.length > 0) {
    html += '<div class="mt-4"><p class="text-[10px] font-semibold text-surface-400 uppercase tracking-wider mb-2">감정 변화</p>' +
      '<div class="flex items-end gap-0.5 h-12">';
    var maxP = Math.min(report.emotion_timeline.length, 20);
    var step = Math.ceil(report.emotion_timeline.length / maxP);
    for (var i = 0; i < report.emotion_timeline.length; i += step) {
      var point = report.emotion_timeline[i];
      var height = ((point.score + 1) / 2) * 100;
      var color = point.score > 0.3 ? 'bg-emerald-400' : point.score < -0.3 ? 'bg-rose-400' : 'bg-amber-400';
      html += '<div class="flex-1 ' + color + ' rounded-t-sm transition-all" style="height:' + Math.max(10, height) + '%" title="' + (esc(point.note) || '') + '"></div>';
    }
    html += '</div></div>';
  }
  html += '</div>';

  // Coaching Feedback
  if (report.coaching_feedback) {
    var cf = report.coaching_feedback;
    // Extract grade from patient_code_evaluation (e.g., "등급: D" or "종합 등급: D")
    var extractedGrade = '';
    if (cf.patient_code_evaluation) {
      var gradeMatch = cf.patient_code_evaluation.match(/등급[：:]\\s*([SABCD])/i);
      if (gradeMatch) extractedGrade = gradeMatch[1].toUpperCase();
    }
    var displayGrade = cf.grade || extractedGrade || '';
    var cfScore = cf.total_score || 0;
    var cfLv = typeof getLevel === 'function' ? getLevel(cfScore) : null;
    html += '<div class="card-premium p-5 bg-gradient-to-br from-purple-50/50 to-pink-50/30">' +
      // Level hero banner
      (cfLv ? '<div class="flex items-center gap-3 mb-4 p-3 bg-gradient-to-r ' + cfLv.gradient + ' rounded-2xl text-white">' +
        '<span style="font-size:28px">' + cfLv.emoji + '</span>' +
        '<div class="flex-1">' +
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-black bg-white/25 px-1.5 py-0.5 rounded">Lv.' + cfLv.level + '</span>' +
            '<span class="text-sm font-bold">' + cfLv.title + '</span>' +
          '</div>' +
          (typeof expBar === 'function' ? '<div class="mt-1.5">' + expBar(cfScore, false).replace(/text-surface/g, 'text-white/60').replace(/bg-surface-100/g, 'bg-white/15') + '</div>' : '') +
        '</div>' +
        '<div class="text-right"><p class="text-2xl font-black">' + cfScore + '</p><p class="text-[9px] text-white/60">점</p></div>' +
      '</div>' : '') +
      '<div class="flex items-center gap-2 mb-4">' +
        '<div class="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center"><i class="fas fa-graduation-cap text-xs text-purple-600"></i></div>' +
        '<h3 class="font-bold text-sm text-surface-900">코칭 피드백</h3>' +
        (displayGrade ? '<span class="ml-1 text-xs font-black px-2 py-0.5 rounded-lg ' + gradeStyle(displayGrade) + '">' + displayGrade + '</span>' : '') +
        (!cfLv ? '<span class="ml-auto text-2xl font-black text-purple-600">' + cfScore + '<span class="text-xs font-semibold text-surface-400">점</span></span>' : '<span class="ml-auto"></span>') +
      '</div>';
    // 한줄 코칭
    if (cf.one_line_coaching) {
      html += '<div class="mb-4 p-3 bg-gradient-to-r from-brand-50 to-purple-50 rounded-xl border border-brand-200/50">' +
        '<div class="flex items-center gap-2"><i class="fas fa-bullseye text-brand-500 text-xs"></i><span class="text-[10px] font-bold text-brand-600 uppercase tracking-wider">핵심 코칭</span></div>' +
        '<p class="text-sm font-semibold text-brand-800 mt-1.5">"' + cf.one_line_coaching + '"</p></div>';
    }
    if (cf.scores) {
      var areas = [
        {k:'rapport',n:'라포',m:20,c:'pink'}, {k:'spin',n:'SPIN',m:25,c:'purple'}, {k:'objection_handling',n:'반론처리',m:20,c:'sky'},
        {k:'pricing_framing',n:'가격프레이밍',m:15,c:'emerald'}, {k:'closing',n:'클로징',m:10,c:'amber'}, {k:'structure',n:'구조',m:10,c:'orange'}
      ];
      html += '<div class="space-y-2 mb-4">';
      areas.forEach(function(a) {
        var s = cf.scores[a.k] || 0;
        var pct = (s / a.m) * 100;
        html += '<div class="flex items-center gap-2"><span class="text-[11px] text-surface-500 w-16 shrink-0">' + a.n + '</span>' +
          '<div class="flex-1 bg-surface-100 rounded-full h-1.5 overflow-hidden"><div class="bg-' + a.c + '-500 h-1.5 rounded-full transition-all" style="width:' + pct + '%"></div></div>' +
          '<span class="text-xs font-bold text-surface-700 w-12 text-right">' + s + '/' + a.m + '</span></div>';
      });
      html += '</div>';
    }
    if (cf.strengths && cf.strengths.length > 0) {
      html += '<div class="mb-3"><p class="text-xs font-semibold text-emerald-600 mb-2 flex items-center gap-1"><i class="fas fa-muscle"></i>강점</p>' +
        '<div class="space-y-1">' + cf.strengths.map(function(s) { return '<p class="text-sm text-surface-700">• ' + s + '</p>'; }).join('') + '</div></div>';
    }
    if (cf.improvements && cf.improvements.length > 0) {
      html += '<div><p class="text-xs font-semibold text-amber-600 mb-2 flex items-center gap-1"><i class="fas fa-arrow-trend-up"></i>개선 포인트</p>' +
        '<div class="space-y-2">' + cf.improvements.map(function(imp) {
          return '<div class="bg-white rounded-xl p-3 text-sm border border-surface-100"><p class="text-surface-800 font-medium">• ' + esc(imp.issue) + '</p>' +
            '<p class="text-brand-600 mt-1 text-xs">💡 ' + esc(imp.suggestion) + '</p>' +
            (imp.example ? '<p class="text-surface-400 italic text-xs mt-1">"' + imp.example + '"</p>' : '') + '</div>';
        }).join('') + '</div></div>';
    }
    if (cf.patient_code_evaluation) {
      html += '<div class="mt-3 p-3 bg-white rounded-xl border border-surface-100"><p class="text-[10px] font-semibold text-surface-400 uppercase tracking-wider mb-1">Patient Code 평가</p>' +
        '<p class="text-sm text-surface-700">' + cf.patient_code_evaluation + '</p></div>';
    }
    html += '</div>';
  }

  // ===== GROWTH COMPARISON (피드백 학습 루프) =====
  if (report.growth_comparison && report.growth_comparison.previous_avg_score > 0) {
    var gc = report.growth_comparison;
    var deltaSign = gc.score_delta > 0 ? '+' : '';
    var deltaColor = gc.score_delta > 0 ? 'emerald' : gc.score_delta < 0 ? 'rose' : 'surface';
    var deltaIcon = gc.score_delta > 0 ? 'fa-arrow-trend-up' : gc.score_delta < 0 ? 'fa-arrow-trend-down' : 'fa-equals';
    
    html += '<div class="card-premium p-5 bg-gradient-to-br from-brand-50/50 to-emerald-50/30 border-2 border-brand-200/50">' +
      '<div class="flex items-center gap-2 mb-4">' +
        '<div class="w-7 h-7 rounded-lg bg-brand-100 flex items-center justify-center"><i class="fas fa-chart-line text-xs text-brand-600"></i></div>' +
        '<h3 class="font-bold text-sm text-surface-900">성장 비교 분석</h3>' +
        '<span class="ml-auto px-2.5 py-1 rounded-lg bg-' + deltaColor + '-100 text-' + deltaColor + '-700 text-xs font-black flex items-center gap-1">' +
          '<i class="fas ' + deltaIcon + ' text-[10px]"></i>' + deltaSign + gc.score_delta.toFixed(1) + '점' +
        '</span>' +
      '</div>';
    
    // Score comparison bar
    html += '<div class="flex items-center gap-3 mb-4 p-3 bg-white rounded-xl">' +
      '<div class="text-center flex-1">' +
        '<p class="text-[10px] text-surface-400 mb-1">이전 평균</p>' +
        '<p class="text-2xl font-black text-surface-400">' + gc.previous_avg_score.toFixed(1) + '</p>' +
      '</div>' +
      '<div class="w-8 h-8 rounded-full bg-' + deltaColor + '-100 flex items-center justify-center">' +
        '<i class="fas fa-arrow-right text-' + deltaColor + '-500 text-xs"></i>' +
      '</div>' +
      '<div class="text-center flex-1">' +
        '<p class="text-[10px] text-surface-400 mb-1">이번 점수</p>' +
        '<p class="text-2xl font-black text-brand-600">' + gc.current_score + '</p>' +
      '</div>' +
    '</div>';

    // Improved areas
    if (gc.improved_areas && gc.improved_areas.length > 0) {
      html += '<div class="mb-3"><p class="text-xs font-semibold text-emerald-600 mb-2 flex items-center gap-1"><i class="fas fa-check-circle"></i>개선된 영역</p>' +
        '<div class="space-y-1.5">';
      gc.improved_areas.forEach(function(a) {
        var adSign = a.delta > 0 ? '+' : '';
        html += '<div class="flex items-center gap-2 p-2 bg-emerald-50/50 rounded-lg">' +
          '<span class="text-[11px] text-surface-600 w-20 shrink-0 font-medium">' + esc(a.area) + '</span>' +
          '<span class="text-[10px] text-surface-400">' + a.previous.toFixed(1) + ' → <span class="font-bold text-emerald-600">' + a.current.toFixed(1) + '</span></span>' +
          '<span class="ml-auto text-[10px] font-bold text-emerald-600">' + adSign + a.delta.toFixed(1) + '</span>' +
        '</div>';
      });
      html += '</div></div>';
    }

    // Still needs work
    if (gc.still_needs_work && gc.still_needs_work.length > 0) {
      html += '<div class="mb-3"><p class="text-xs font-semibold text-amber-600 mb-2 flex items-center gap-1"><i class="fas fa-bullseye"></i>계속 집중할 영역</p>' +
        '<div class="space-y-2">';
      gc.still_needs_work.forEach(function(w) {
        html += '<div class="bg-white rounded-xl p-3 text-sm border border-amber-100">' +
          '<p class="font-medium text-surface-800"><span class="text-amber-500 mr-1">▸</span>' + esc(w.area) + '</p>' +
          '<p class="text-xs text-surface-500 mt-1">이전: ' + esc(w.previous_issue) + '</p>' +
          '<p class="text-xs text-surface-600 mt-0.5">현재: ' + esc(w.current_status) + '</p>' +
          '<p class="text-xs text-brand-600 mt-1 font-medium">💡 ' + esc(w.suggestion) + '</p>' +
        '</div>';
      });
      html += '</div></div>';
    }

    // Overall growth comment
    if (gc.overall_growth_comment) {
      html += '<div class="p-3 bg-gradient-to-r from-brand-50 to-emerald-50 rounded-xl border border-brand-200/50">' +
        '<div class="flex items-center gap-2 mb-1"><i class="fas fa-seedling text-brand-500 text-xs"></i><span class="text-[10px] font-bold text-brand-600 uppercase tracking-wider">성장 코멘트</span></div>' +
        '<p class="text-sm text-surface-700 leading-relaxed">' + esc(gc.overall_growth_comment) + '</p>' +
        (gc.streak_info ? '<p class="text-xs text-emerald-600 font-semibold mt-1.5">🔥 ' + esc(gc.streak_info) + '</p>' : '') +
      '</div>';
    }

    html += '</div>';
  }

  // Decision Factors (object, not array)
  if (report.decision_factors && typeof report.decision_factors === 'object') {
    var df = report.decision_factors;
    var dfItems = [];
    if (df.main_concern) dfItems.push({icon:'fa-triangle-exclamation', color:'rose', label:'핵심 장벽', val: df.main_concern});
    if (df.decision_maker) dfItems.push({icon:'fa-user-check', color:'brand', label:'결정권자', val: df.decision_maker});
    if (df.budget_range) dfItems.push({icon:'fa-wallet', color:'emerald', label:'예산 범위', val: df.budget_range});
    if (df.timeline) dfItems.push({icon:'fa-clock', color:'amber', label:'결정 시기', val: df.timeline});
    if (dfItems.length > 0) {
      html += '<div class="card-premium p-5">' +
        sec('결정 요인 분석', 'fas fa-scale-balanced text-indigo-600', 'bg-indigo-50') +
        '<div class="space-y-2">';
      dfItems.forEach(function(item) {
        html += '<div class="p-3 rounded-xl bg-' + item.color + '-50/50 border border-' + item.color + '-200/30">' +
          '<div class="flex items-center gap-1.5 mb-1"><i class="fas ' + item.icon + ' text-' + item.color + '-500 text-[10px]"></i>' +
          '<span class="text-[10px] font-bold text-' + item.color + '-600 uppercase tracking-wider">' + item.label + '</span></div>' +
          '<p class="text-sm text-surface-700">' + item.val + '</p></div>';
      });
      html += '</div></div>';
    }
  }

  // Next Actions
  if (report.next_actions && report.next_actions.length > 0) {
    html += '<div class="card-premium p-5">' +
      sec('다음 액션', 'fas fa-list-check text-amber-600', 'bg-amber-50') +
      '<div class="space-y-2">';
    report.next_actions.forEach(function(action) {
      var pc = action.priority === 'high' ? 'border-l-rose-500 bg-rose-50/30' : action.priority === 'medium' ? 'border-l-amber-500 bg-amber-50/30' : 'border-l-surface-300 bg-surface-50/30';
      html += '<div class="flex items-center gap-3 p-3 rounded-xl border-l-3 ' + pc + '">' +
        '<div class="flex-1"><p class="text-sm text-surface-800 font-medium">' + esc(action.action) + '</p>' +
        (action.due_date ? '<p class="text-xs text-surface-500 mt-0.5"><i class="fas fa-calendar text-[10px] mr-1"></i>' + action.due_date + '까지</p>' : '') +
        '</div></div>';
    });
    html += '</div></div>';
  }

  // Followup
  if (report.recommended_followup_date || esc(report.followup_message)) {
    html += '<div class="card-premium p-5 bg-gradient-to-br from-sky-50/50 to-brand-50/30">' +
      sec('추천 팔로업', 'fas fa-phone text-sky-600', 'bg-sky-50') +
      (report.recommended_followup_date ? '<div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-100 text-sky-700 text-xs font-semibold mb-2"><i class="fas fa-calendar"></i>' + report.recommended_followup_date + '</div>' : '') +
      (esc(report.followup_message) ? '<p class="text-sm text-surface-700 bg-white p-3 rounded-xl border border-surface-100 italic">"' + esc(report.followup_message) + '"</p>' : '') +
    '</div>';
  }

  html += '</div>';

  // AI Model Badge (dynamic)
  var modelName = report.generation_model || 'GPT-5';
  var genTime = report.created_at ? new Date(report.created_at).toLocaleString('ko-KR', {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '';
  html += '<div class="flex items-center justify-center gap-2 py-4">' +
    '<div class="flex items-center gap-1.5 px-3 py-1.5 bg-surface-50 rounded-full border border-surface-200">' +
      '<div class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>' +
      '<span class="text-[10px] font-semibold text-surface-500">Powered by ' + modelName + ' &bull; Patient Funnel AI</span>' +
      (genTime ? '<span class="text-[9px] text-surface-400">&bull; ' + genTime + '</span>' : '') +
    '</div>' +
  '</div>';

  container.innerHTML = html;
}

// Create Proposal
document.getElementById('createProposalBtn').addEventListener('click', async function() {
  var btn = document.getElementById('createProposalBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner-third fa-spin"></i>생성 중...';
  try {
    var res = await fetch('/api/reports/' + consultationId + '/proposal', { method: 'POST' });
    var data = await res.json();
    if (data.success) {
      proposalData = data.data;
      document.getElementById('proposalUrl').value = window.location.origin + data.data.public_url;
      document.getElementById('proposalModal').classList.remove('hidden');
    } else { showToast(data.error || '제안서 생성에 실패했습니다.','error'); }
  } catch (err) { showToast('오류가 발생했습니다.','error'); }
  finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-file-invoice"></i>제안서 생성'; }
});

document.getElementById('regenerateBtn').addEventListener('click', async function() {
  if (!confirm('레포트를 다시 생성하시겠습니까?')) return;
  await generateReport();
});

function copyProposalUrl() {
  var input = document.getElementById('proposalUrl');
  input.select();
  navigator.clipboard.writeText(input.value).then(function() { showToast('링크가 복사되었습니다!','success'); });
}

function sendViaKakao() {
  if (proposalData) {
    var url = window.location.origin + proposalData.public_url;
    window.open('https://sharer.kakao.com/talk/friends/picker/link?url=' + encodeURIComponent(url), '_blank', 'width=500,height=600');
  }
}

function closeProposalModal() { document.getElementById('proposalModal').classList.add('hidden'); }

loadReport();
