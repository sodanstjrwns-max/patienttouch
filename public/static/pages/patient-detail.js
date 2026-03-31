var patientId = '${id}';
var currentTab = 'info';
var retentionData = null;
var retContactType = 'phone';
var currentPatient = null;

var statusMap = {
  unscheduled_urgent: { label: '미예약 긴급', icon: 'fa-exclamation-triangle', bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200', color: 'rose' },
  unscheduled_warning: { label: '미예약 주의', icon: 'fa-clock', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', color: 'amber' },
  recall_6m: { label: '6개월 리콜', icon: 'fa-calendar-check', bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-200', color: 'sky' },
  recall_12m: { label: '12개월 리콜', icon: 'fa-calendar-days', bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-200', color: 'sky' },
  at_risk: { label: '이탈 위험', icon: 'fa-heart-crack', bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200', color: 'red' },
  consulted_unconverted: { label: '상담 미전환', icon: 'fa-comment-slash', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', color: 'amber' },
  in_treatment: { label: '치료중', icon: 'fa-stethoscope', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', color: 'emerald' },
  active: { label: '정상', icon: 'fa-check', bg: 'bg-surface-50', text: 'text-surface-600', ring: 'ring-surface-200', color: 'surface' },
  completed: { label: '완료', icon: 'fa-check-double', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', color: 'emerald' }
};

var treatTypeMap = {
  implant: '임플란트', ortho: '교정', prosthetic: '보철', endo: '신경치료',
  extraction: '발치', scaling: '스케일링', whitening: '미백', laminate: '라미네이트', general: '일반'
};

var treatStatusMap = {
  consulted: { label: '상담완료', bg: 'bg-surface-100', text: 'text-surface-600' },
  scheduled: { label: '예약됨', bg: 'bg-sky-50', text: 'text-sky-700' },
  in_progress: { label: '진행중', bg: 'bg-brand-50', text: 'text-brand-700' },
  completed: { label: '완료', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  abandoned: { label: '중단', bg: 'bg-rose-50', text: 'text-rose-700' }
};

function switchTab(tab) {
  currentTab = tab;
  ['Info','Timeline','Retention'].forEach(function(t){
    var el = document.getElementById('tab'+t);
    if(el) el.className = tab === t.toLowerCase()
      ? 'flex-1 py-2.5 text-sm font-bold rounded-xl transition-all bg-brand-600 text-white shadow-md'
      : 'flex-1 py-2.5 text-sm font-bold rounded-xl transition-all bg-surface-100 text-surface-600';
  });
  document.getElementById('patientDetail').classList.toggle('hidden', tab !== 'info');
  document.getElementById('retentionDetail').classList.toggle('hidden', tab !== 'retention');
  document.getElementById('timelineDetail').classList.toggle('hidden', tab !== 'timeline');
  if (tab === 'retention' && !retentionData) loadRetention();
  if (tab === 'timeline') loadTimeline();
}

var timelineLoaded = false;
async function loadTimeline() {
  if (timelineLoaded) return;
  try {
    var [retRes, cmpRes] = await Promise.all([
      fetch('/api/retention/patients/' + patientId),
      fetch('/api/dashboard/consultation-compare/' + patientId)
    ]);
    var retData = await retRes.json();
    var cmpData = await cmpRes.json();

    // Render timeline
    var timeline = (retData.success && retData.data.timeline) ? retData.data.timeline : [];
    document.getElementById('timelineCount').textContent = timeline.length + '건';

    var evIcons = {consultation:'fa-stethoscope',treatment:'fa-tooth',contact:'fa-phone'};
    var evColors = {consultation:'bg-brand-100 text-brand-600',treatment:'bg-emerald-100 text-emerald-700',contact:'bg-sky-100 text-sky-600'};
    var evLabels = {consultation:'상담',treatment:'치료',contact:'연락'};
    var stBadge = {paid:'bg-emerald-50 text-emerald-700',undecided:'bg-amber-50 text-amber-700',lost:'bg-rose-50 text-rose-700',completed:'bg-emerald-50 text-emerald-700',in_progress:'bg-sky-50 text-sky-700',scheduled:'bg-purple-50 text-purple-700',connected:'bg-emerald-50 text-emerald-700',no_answer:'bg-rose-50 text-rose-700',appointment_booked:'bg-brand-50 text-brand-700'};
    
    if (timeline.length === 0) {
      document.getElementById('timelineContent').innerHTML = '<div class="text-center py-8"><i class="fas fa-timeline text-surface-300 text-2xl mb-2"></i><p class="text-sm text-surface-500">아직 이벤트가 없습니다</p></div>';
    } else {
      var html = '';
      timeline.forEach(function(ev, i) {
        var et = ev.event_type || 'consultation';
        html += '<div class="timeline-item flex gap-3 pb-4 relative">';
        html += '<div class="timeline-dot flex flex-col items-center shrink-0">';
        html += '<div class="w-8 h-8 rounded-lg '+(evColors[et]||'bg-surface-100 text-surface-600')+' flex items-center justify-center"><i class="fas '+(evIcons[et]||'fa-circle')+' text-xs"></i></div>';
        if (i < timeline.length - 1) html += '<div class="w-0.5 flex-1 bg-surface-200 mt-1 min-h-[16px]"></div>';
        html += '</div>';
        html += '<div class="flex-1 min-w-0 pb-1">';
        html += '<div class="flex items-center justify-between"><span class="text-xs font-bold text-surface-900">'+(evLabels[et]||et)+'</span><span class="text-[10px] text-surface-400">'+fmtDate(ev.date)+'</span></div>';
        
        if (et === 'consultation') {
          html += '<p class="text-[11px] text-surface-600 mt-0.5">'+(esc(ev.treatment_type)||'일반')+'</p>';
          if(ev.amount) html += '<span class="text-[10px] font-semibold text-emerald-600">'+fmtWon(ev.amount)+'만원</span> ';
          if(ev.status) html += '<span class="text-[10px] px-1.5 py-0.5 rounded '+(stBadge[ev.status]||'bg-surface-100 text-surface-600')+' font-semibold">'+(ev.status==='paid'?'결정':ev.status==='undecided'?'미결정':ev.status)+'</span>';
        } else if (et === 'treatment') {
          html += '<p class="text-[11px] text-surface-600 mt-0.5">'+(esc(ev.treatment_name)||esc(ev.treatment_type)||'치료')+'</p>';
          if(ev.status) html += '<span class="text-[10px] px-1.5 py-0.5 rounded '+(stBadge[ev.status]||'bg-surface-100 text-surface-600')+' font-semibold">'+(ev.status==='completed'?'완료':ev.status==='in_progress'?'진행중':ev.status)+'</span>';
        } else if (et === 'contact') {
          html += '<p class="text-[11px] text-surface-600 mt-0.5">'+(ev.contact_type==='phone'?'전화':ev.contact_type==='text'?'문자':'카카오')+' - '+(ev.result==='connected'?'통화성공':ev.result==='no_answer'?'부재중':ev.result==='appointment_booked'?'예약완료':ev.result||'')+'</p>';
          if(esc(ev.notes)) html += '<p class="text-[10px] text-surface-500 mt-0.5 line-clamp-1">'+esc(ev.notes)+'</p>';
          if(esc(ev.staff_name)) html += '<span class="text-[10px] text-surface-400">'+esc(ev.staff_name)+'</span>';
        }
        html += '</div></div>';
      });
      document.getElementById('timelineContent').innerHTML = html;
    }

    // Render comparison (Feature 9)
    if (cmpData.success && cmpData.data.comparison) {
      var cmp = cmpData.data.comparison;
      var sec = document.getElementById('comparisonSection');
      sec.classList.remove('hidden');
      var f = cmp.first, l = cmp.last, imp = cmp.improvements;
      
      var cHtml = '<div class="grid grid-cols-2 gap-3">';
      // First consult
      cHtml += '<div class="p-3 rounded-xl bg-surface-50 border border-surface-200">';
      cHtml += '<p class="text-[10px] font-bold text-surface-500 mb-2">1차 상담</p>';
      cHtml += '<p class="text-xs text-surface-400">'+fmtDate(f.date)+'</p>';
      cHtml += '<p class="text-sm font-bold mt-1">'+(esc(f.treatment_type)||'-')+'</p>';
      if(f.amount) cHtml += '<p class="text-xs font-semibold text-emerald-600">'+fmtWon(f.amount)+'만원</p>';
      cHtml += '<div class="flex gap-1.5 mt-2">';
      cHtml += '<span class="text-[10px] px-1.5 py-0.5 rounded bg-brand-50 text-brand-600 font-semibold">결정도 '+(f.decision_score||0)+'</span>';
      if(f.total_score) cHtml += '<span class="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 font-semibold">'+f.total_score+'점</span>';
      cHtml += '</div></div>';
      
      // Last consult
      cHtml += '<div class="p-3 rounded-xl bg-brand-50/50 border border-brand-200/50">';
      cHtml += '<p class="text-[10px] font-bold text-brand-600 mb-2">최근 상담</p>';
      cHtml += '<p class="text-xs text-surface-400">'+fmtDate(l.date)+'</p>';
      cHtml += '<p class="text-sm font-bold mt-1">'+(esc(l.treatment_type)||'-')+'</p>';
      if(l.amount) cHtml += '<p class="text-xs font-semibold text-emerald-600">'+fmtWon(l.amount)+'만원</p>';
      cHtml += '<div class="flex gap-1.5 mt-2">';
      cHtml += '<span class="text-[10px] px-1.5 py-0.5 rounded bg-brand-50 text-brand-600 font-semibold">결정도 '+(l.decision_score||0)+'</span>';
      if(l.total_score) cHtml += '<span class="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 font-semibold">'+l.total_score+'점</span>';
      cHtml += '</div></div>';
      cHtml += '</div>';

      // Improvements summary
      cHtml += '<div class="mt-3 p-3 rounded-xl '+(imp.decision_score>0?'bg-emerald-50':'bg-amber-50')+'">';
      cHtml += '<p class="text-xs font-bold '+(imp.decision_score>0?'text-emerald-700':'text-amber-700')+'">';
      cHtml += '<i class="fas '+(imp.decision_score>0?'fa-arrow-trend-up':'fa-minus')+' mr-1"></i>';
      cHtml += '총 '+cmp.total_consultations+'회 상담 | 결정도 '+(imp.decision_score>0?'+':'')+imp.decision_score;
      if(imp.total_score) cHtml += ' | 점수 '+(imp.total_score>0?'+':'')+imp.total_score;
      cHtml += '</p></div>';

      document.getElementById('comparisonContent').innerHTML = cHtml;
    }

    timelineLoaded = true;

    // Render consultation chart + summary stats
    setTimeout(function() {
      var consultItems = timeline.filter(function(e) { return e.event_type === 'consultation'; });
      if (consultItems.length >= 1) {
        // Summary stats
        document.getElementById('timelineSummary').classList.remove('hidden');
        var totalAmt = consultItems.reduce(function(s,c){ return s + (c.amount||0); }, 0);
        var scores = consultItems.filter(function(c){ return c.decision_score; }).map(function(c){ return c.decision_score; });
        var avgSc = scores.length > 0 ? Math.round(scores.reduce(function(a,b){return a+b;},0)/scores.length) : 0;
        document.getElementById('tlTotalConsult').textContent = consultItems.length + '회';
        document.getElementById('tlTotalAmount').textContent = fmtWon(totalAmt) + '만';
        document.getElementById('tlAvgScore').textContent = avgSc > 0 ? avgSc + '/10' : '-';
      }

      if (consultItems.length >= 2 && window.Chart) {
        document.getElementById('consultChartSection').classList.remove('hidden');
        var cLabels = consultItems.map(function(c) { return fmtDate(c.date); }).reverse();
        var cAmounts = consultItems.map(function(c) { return Math.round((c.amount||0)/10000); }).reverse();
        var cScores = consultItems.map(function(c) { return (c.decision_score||0); }).reverse();
        var stColors = consultItems.map(function(c) { return c.status==='paid'?'#10b981':c.status==='undecided'?'#f59e0b':'#ef4444'; }).reverse();
        new Chart(document.getElementById('patientConsultChart').getContext('2d'), {
          type: 'bar',
          data: {
            labels: cLabels,
            datasets: [
              { label: '금액(만)', data: cAmounts, backgroundColor: stColors, borderRadius: 4, order: 2 },
              { type: 'line', label: '결정도', data: cScores, borderColor: '#6366f1', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 4, pointBackgroundColor: '#6366f1', tension: 0.3, yAxisID: 'y1', order: 1 }
            ]
          },
          options: {
            responsive: true,
            plugins: { legend: { display: true, position: 'bottom', labels: { font: {size:9}, usePointStyle: true, pointStyleWidth: 6, padding: 8 } } },
            scales: {
              x: { grid: {display:false}, ticks: {font:{size:9}} },
              y: { beginAtZero: true, ticks: {font:{size:9}, callback: function(v){return v+'만';}}, grid: {color:'#f1f5f9'} },
              y1: { beginAtZero: true, max: 10, position: 'right', ticks: {font:{size:9}}, grid: {display:false} }
            }
          }
        });
      }
    }, 100);
  } catch (err) {
    console.error('Timeline error:', err);
    showErrorState('timelineContent', '타임라인을 불러올 수 없습니다', loadTimeline);
  }
}

async function loadPatient() {
  try {
    var authRes = await fetch('/api/auth/me');
    if (!authRes.ok) { window.location.href = '/login'; return; }

    var res = await fetch('/api/patients/' + patientId);
    if (res.status === 401) { window.location.href = '/login'; return; }
    var data = await res.json();

    if (data.success) { currentPatient = data.data; renderPatient(data.data); }
    else {
      document.getElementById('patientDetail').innerHTML =
        '<div class="text-center py-16 animate-fade-in">' +
          '<div class="w-20 h-20 mx-auto mb-5 rounded-2xl bg-surface-100 flex items-center justify-center"><i class="fas fa-user-slash text-3xl text-surface-300"></i></div>' +
          '<h3 class="text-lg font-bold text-surface-800 mb-1">환자 정보를 찾을 수 없습니다</h3>' +
          '<a href="/patients" class="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-all active:scale-95"><i class="fas fa-list"></i>환자 목록으로</a>' +
        '</div>';
    }
  } catch (err) {
    console.error('Failed to load patient:', err);
    document.getElementById('patientDetail').innerHTML =
      '<div class="text-center py-16 animate-fade-in">' +
        '<div class="w-20 h-20 mx-auto mb-5 rounded-2xl bg-surface-100 flex items-center justify-center"><i class="fas fa-triangle-exclamation text-3xl text-amber-400"></i></div>' +
        '<h3 class="text-lg font-bold text-surface-800 mb-1">데이터를 불러올 수 없습니다</h3>' +
        '<button onclick="loadPatient()" class="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-all active:scale-95"><i class="fas fa-rotate-right"></i>다시 시도</button>' +
      '</div>';
  }
}

function sec(title, icon, iconBg) {
  return '<div class="flex items-center gap-2 mb-3">' +
    '<div class="w-7 h-7 rounded-lg ' + iconBg + ' flex items-center justify-center"><i class="' + icon + ' text-xs"></i></div>' +
    '<h3 class="font-bold text-sm text-surface-900">' + title + '</h3></div>';
}

function renderPatient(p) {
  var container = document.getElementById('patientDetail');
  var consultations = p.consultations || [];
  var contactLogs = p.contact_logs || [];
  var pendingTasks = p.pending_tasks || [];
  var tags = p.tags || [];

  var st = {
    paid: { bg:'bg-emerald-50', text:'text-emerald-700', label:'결제완료', dot:'bg-emerald-500' },
    undecided: { bg:'bg-amber-50', text:'text-amber-700', label:'미결정', dot:'bg-amber-500' },
    lost: { bg:'bg-rose-50', text:'text-rose-700', label:'이탈', dot:'bg-rose-500' },
    pending: { bg:'bg-surface-50', text:'text-surface-600', label:'대기중', dot:'bg-surface-400' }
  };

  var colors = ['bg-brand-100 text-brand-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-sky-100 text-sky-700', 'bg-purple-100 text-purple-700'];
  var avatarColor = colors[esc(p.name).charCodeAt(0) % colors.length];

  var html = '<div class="space-y-3 stagger-children">';

  // Patient Info Card
  html += '<div class="card-premium p-5">' +
    '<div class="flex items-start gap-4">' +
      '<div class="w-16 h-16 rounded-2xl ' + avatarColor + ' flex items-center justify-center font-black text-2xl shrink-0">' + esc(p.name).charAt(0) + '</div>' +
      '<div class="flex-1 min-w-0">' +
        '<div class="flex items-center gap-2 mb-0.5">' +
          '<h2 class="text-xl font-bold text-surface-900">' + esc(p.name) + '</h2>' +
          (p.age ? '<span class="text-surface-400 text-sm">' + p.age + '세 ' + (p.gender === 'male' ? '남' : p.gender === 'female' ? '여' : '') + '</span>' : '') +
        '</div>' +
        (p.phone ? '<a href="tel:' + (p.phone_full||p.phone) + '" class="inline-flex items-center gap-1.5 text-brand-600 font-semibold text-sm hover:text-brand-700 transition-colors"><i class="fas fa-phone text-xs"></i>' + (p.phone_display||p.phone) + '</a>' : '') +
        '<div class="flex flex-wrap gap-1 mt-2">' +
          (p.referral_source ? '<span class="px-2 py-0.5 bg-sky-50 text-sky-700 rounded-lg text-[10px] font-semibold"><i class="fas fa-route mr-0.5"></i>' + p.referral_source + '</span>' : '') +
          (p.region ? '<span class="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-semibold"><i class="fas fa-map-marker-alt mr-0.5"></i>' + p.region + '</span>' : '') +
          tags.map(function(t) { return '<span class="px-2 py-0.5 bg-surface-100 text-surface-600 rounded-lg text-[10px] font-semibold">' + t + '</span>'; }).join('') +
        '</div>' +
      '</div>' +
    '</div>' +
    (esc(p.memo) ? '<div class="mt-3"><p class="text-sm text-surface-600 bg-surface-50 p-3 rounded-xl leading-relaxed">' + esc(p.memo) + '</p>' +
      '<button onclick="toggleMemoHistory()" class="mt-1.5 text-[10px] text-surface-400 hover:text-brand-600 font-semibold transition-colors"><i class="fas fa-clock-rotate-left mr-0.5"></i>변경 이력 보기</button>' +
      '<div id="memoHistoryContainer" class="hidden mt-2"></div></div>' : '') +
  '</div>';

  // Patient Value Summary (LTV)
  var totalPaid = consultations.reduce(function(s,c){ return s + (c.status === 'paid' ? (c.amount || 0) : 0); }, 0);
  var totalConsultAmt = consultations.reduce(function(s,c){ return s + (c.amount || 0); }, 0);
  var paidCount = consultations.filter(function(c){ return c.status === 'paid'; }).length;
  var convRate = consultations.length > 0 ? Math.round(paidCount / consultations.length * 100) : 0;
  var avgDecision = consultations.filter(function(c){ return c.decision_score; }).reduce(function(s,c,_,a){ return s + c.decision_score / a.length; }, 0);
  
  html += '<div class="grid grid-cols-4 gap-1.5">' +
    '<div class="card-premium p-2.5 text-center"><p class="text-base font-black text-brand-600">' + consultations.length + '</p><p class="text-[8px] font-bold text-surface-400">총 상담</p></div>' +
    '<div class="card-premium p-2.5 text-center"><p class="text-base font-black text-emerald-600">' + convRate + '%</p><p class="text-[8px] font-bold text-surface-400">전환율</p></div>' +
    '<div class="card-premium p-2.5 text-center"><p class="text-base font-black text-purple-600">' + (totalPaid > 0 ? Math.round(totalPaid/10000) + '만' : '-') + '</p><p class="text-[8px] font-bold text-surface-400">총 수납</p></div>' +
    '<div class="card-premium p-2.5 text-center"><p class="text-base font-black text-amber-600">' + (avgDecision > 0 ? avgDecision.toFixed(1) : '-') + '</p><p class="text-[8px] font-bold text-surface-400">평균 결정도</p></div>' +
  '</div>';

  // Patient Value Grade Card
  var pvGrade = totalPaid >= 10000000 ? {label:'VIP', color:'amber', icon:'fa-crown', desc:'1천만원 이상 수납'} :
                totalPaid >= 5000000 ? {label:'Gold', color:'emerald', icon:'fa-gem', desc:'5백만원 이상 수납'} :
                totalPaid >= 1000000 ? {label:'Silver', color:'sky', icon:'fa-medal', desc:'1백만원 이상 수납'} :
                {label:'New', color:'surface', icon:'fa-seedling', desc:'신규/육성 환자'};
  
  if (totalPaid > 0 || consultations.length >= 2) {
    html += '<div class="card-premium p-3 flex items-center gap-3 bg-gradient-to-r from-' + pvGrade.color + '-50/50 to-transparent border-l-4 border-l-' + pvGrade.color + '-400">' +
      '<div class="w-10 h-10 rounded-xl bg-' + pvGrade.color + '-100 flex items-center justify-center"><i class="fas ' + pvGrade.icon + ' text-' + pvGrade.color + '-600"></i></div>' +
      '<div class="flex-1"><p class="font-bold text-sm text-' + pvGrade.color + '-700">' + pvGrade.label + ' 등급</p><p class="text-[10px] text-surface-500">' + pvGrade.desc + '</p></div>' +
      (totalConsultAmt > totalPaid && totalConsultAmt > 0 ? '<div class="text-right"><p class="text-xs font-bold text-amber-600">잠재 매출</p><p class="text-sm font-black text-amber-700">' + Math.round((totalConsultAmt-totalPaid)/10000) + '만원</p></div>' : '') +
    '</div>';
  }

  // Quick Actions
  html += '<div class="grid grid-cols-2 gap-2">' +
    '<a href="tel:' + (p.phone_full||p.phone||'') + '" class="card-premium p-3.5 flex items-center justify-center gap-2 font-semibold text-sm ' + (!p.phone ? 'opacity-40 pointer-events-none' : 'active:scale-[0.98]') + '">' +
      '<div class="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center"><i class="fas fa-phone text-brand-600 text-xs"></i></div>' +
      '<span class="text-surface-800">전화</span>' +
    '</a>' +
    '<a href="/recording/' + p.id + '" class="card-premium p-3.5 flex items-center justify-center gap-2 font-semibold text-sm active:scale-[0.98]">' +
      '<div class="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center"><i class="fas fa-microphone text-rose-600 text-xs"></i></div>' +
      '<span class="text-surface-800">상담 녹음</span>' +
    '</a>' +
  '</div>';

  // AI 추천 넥스트 액션 카드
  var latestConsult = consultations.length > 0 ? consultations[0] : null;
  if (latestConsult) {
    var lPsy = latestConsult.patient_psychology || {};
    var lFb = latestConsult.feedback || {};
    var lScore = latestConsult.decision_score || 0;
    var aiActions = [];
    
    // 상담이력 기반 AI 분석 요약
    var consultSummary = '';
    if (consultations.length >= 2) {
      var scores = consultations.filter(function(c){return c.decision_score;}).map(function(c){return c.decision_score;});
      if (scores.length >= 2) {
        var trend = scores[0] - scores[scores.length-1];
        if (trend > 0) consultSummary = '결정도가 ' + Math.abs(trend).toFixed(1) + '점 상승 추세입니다. 긍정 신호!';
        else if (trend < 0) consultSummary = '결정도가 ' + Math.abs(trend).toFixed(1) + '점 하락 추세. 접근 방식을 바꿔보세요.';
      }
    }
    
    // 미결정 환자 전략
    if (latestConsult.status === 'undecided') {
      if (lScore >= 7) aiActions.push({icon:'🔥', text:'결정도 높음(' + lScore + '/10)! 24시간 내 팔로업 필수', priority: 'critical'});
      else if (lScore >= 4) aiActions.push({icon:'📞', text:'3일 내 안부 연락 + 상담시 관심사 언급', priority: 'high'});
      else aiActions.push({icon:'💡', text:'가치 재설명 필요. 성공사례 준비 후 재연락', priority: 'medium'});
      
      if (lPsy.fear) aiActions.push({icon:'😰', text:'두려움("' + lPsy.fear + '") 해소할 성공사례 공유'});
      if (lPsy.hidden_needs) aiActions.push({icon:'🔮', text:'숨겨진 니즈: ' + lPsy.hidden_needs});
      if (lPsy.personality_type) aiActions.push({icon:'🧬', text:'환자 성향(' + lPsy.personality_type + ')에 맞춘 어프로치'});
      if (lPsy.decision_maker && lPsy.decision_maker !== '본인') aiActions.push({icon:'👥', text:lPsy.decision_maker + ' 동반 내원 유도'});
    }
    
    // 결제 완료 환자 - 크로스셀
    if (latestConsult.status === 'paid') {
      aiActions.push({icon:'🎉', text:'결정 완료! 정기검진 리마인더 설정 권장'});
      if (totalPaid > 0) aiActions.push({icon:'💎', text:'신뢰 형성됨. 추가 치료 니즈 탐색 기회'});
    }
    
    // 코칭 점수 기반
    if (lFb.total_score && lFb.total_score < 60) {
      aiActions.push({icon:'📈', text:'상담 점수 ' + lFb.total_score + '점. AI 레포트에서 개선점 확인하세요'});
    }
    
    if (aiActions.length > 0) {
      html += '<div class="card-premium p-5 bg-gradient-to-br from-brand-50/60 to-purple-50/40 border border-brand-200/30">' +
        '<div class="flex items-center gap-2 mb-3">' +
          '<div class="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center shadow-sm shadow-brand-400/30">' +
            '<i class="fas fa-wand-magic-sparkles text-[10px] text-white"></i>' +
          '</div>' +
          '<div><h3 class="font-bold text-sm text-surface-900">AI 추천 넥스트 액션</h3>' +
          '<p class="text-[9px] text-surface-400">GPT-5 · Patient Funnel AI 분석</p></div>' +
        '</div>';
      
      if (consultSummary) {
        html += '<div class="p-2.5 mb-2.5 bg-white/60 rounded-xl border border-brand-100/50">' +
          '<p class="text-[10px] font-bold text-brand-600 mb-0.5"><i class="fas fa-chart-line mr-1"></i>상담이력 요약</p>' +
          '<p class="text-xs text-surface-700">' + consultSummary + '</p></div>';
      }
      
      html += '<div class="space-y-1.5">';
      aiActions.forEach(function(a) {
        var borderColor = a.priority === 'critical' ? 'border-l-rose-500' : a.priority === 'high' ? 'border-l-amber-500' : 'border-l-brand-300';
        html += '<div class="flex items-start gap-2 p-2 bg-white/60 rounded-lg border-l-[3px] ' + borderColor + '">' +
          '<span class="text-sm shrink-0">' + a.icon + '</span>' +
          '<p class="text-xs text-surface-700 leading-relaxed">' + esc(a.text) + '</p>' +
        '</div>';
      });
      html += '</div></div>';
    }
  }

  // Pending Tasks
  if (pendingTasks.length > 0) {
    html += '<div class="card-premium p-5 border-l-4 border-l-amber-400">' +
      sec('예정된 연락', 'fas fa-bell text-amber-600', 'bg-amber-50') +
      '<div class="space-y-2">';
    pendingTasks.forEach(function(t) {
      var date = new Date(t.recommended_date);
      var dateStr = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
      var typeEmoji = t.task_type === 'closing' ? '🔥' : '💙';
      html += '<div class="bg-white p-3 rounded-xl border border-surface-100">' +
        '<div class="flex justify-between items-start">' +
          '<span class="font-semibold text-sm">' + typeEmoji + ' ' + (t.task_type === 'closing' ? '클로징' : '안부') + ' 연락</span>' +
          '<span class="text-[10px] font-semibold text-surface-400 bg-surface-50 px-2 py-0.5 rounded-md">' + dateStr + '</span>' +
        '</div>' +
        (esc(t.points) && esc(t.points).length > 0 ? '<p class="text-xs text-surface-600 mt-1.5">' + esc(t.points)[0] + '</p>' : '') +
      '</div>';
    });
    html += '</div></div>';
  }

  // Consultation History
  html += '<div class="card-premium p-5">' +
    sec('상담 히스토리', 'fas fa-clock-rotate-left text-brand-600', 'bg-brand-50');
  if (consultations.length > 0) {
    html += '<div class="space-y-2">';
    consultations.forEach(function(c) {
      var date = new Date(c.consultation_date);
      var dateStr = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
      var score = c.feedback && c.feedback.total_score ? c.feedback.total_score : null;
      var s = st[c.status] || st.pending;
      html += '<a href="/consultations/' + c.id + '" class="block p-3 bg-surface-50 rounded-xl hover:bg-surface-100 transition-all active:scale-[0.99]">' +
        '<div class="flex justify-between items-start">' +
          '<div><span class="font-bold text-sm text-surface-900">' + (esc(c.treatment_type) || '상담') + '</span>' +
          (c.amount ? '<span class="text-surface-400 text-xs ml-2">' + (c.amount / 10000).toFixed(0) + '만원</span>' : '') + '</div>' +
          '<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ' + s.bg + ' ' + esc(s.text) + '"><span class="w-1 h-1 rounded-full ' + s.dot + '"></span>' + s.label + '</span>' +
        '</div>' +
        '<div class="flex items-center gap-2 mt-1 text-xs text-surface-500">' +
          '<span>' + dateStr + '</span>' +
          (c.duration ? '<span class="text-surface-300">·</span><span>' + c.duration + '분</span>' : '') +
          (c.decision_score ? '<span class="text-surface-300">·</span><span>결정도 ' + c.decision_score + '/10</span>' : '') +
        '</div>' +
        (score ? '<div class="mt-2 flex items-center gap-2"><div class="flex-1 bg-surface-200 rounded-full h-1 overflow-hidden"><div class="bg-gradient-to-r from-brand-500 to-brand-400 h-1 rounded-full" style="width:' + score + '%"></div></div><span class="text-[10px] font-bold ' + (score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-rose-600') + '">' + score + '점</span></div>' : '') +
      '</a>';
    });
    html += '</div>';
  } else {
    html += '<div class="text-center py-6"><p class="text-surface-400 text-sm">상담 기록이 없습니다</p></div>';
  }
  html += '</div>';

  // Contact History
  html += '<div class="card-premium p-5">' +
    sec('연락 히스토리', 'fas fa-phone-volume text-sky-600', 'bg-sky-50');
  if (contactLogs.length > 0) {
    html += '<div class="space-y-2">';
    contactLogs.forEach(function(l) {
      var date = new Date(l.created_at);
      var dateStr = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
      var timeStr = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      var typeIcon = l.contact_type === 'call' ? 'fa-phone' : l.contact_type === 'kakao' ? 'fa-comment' : 'fa-envelope';
      var typeName = l.contact_type === 'call' ? '전화' : l.contact_type === 'kakao' ? '카톡' : '문자';
      var resultText = { success: '연결', no_answer: '부재중', busy: '통화중' };
      var outcomeText = { booked: '예약완료', callback: '재연락', hold: '보류', rejected: '거절' };
      html += '<div class="flex items-start gap-3 p-2.5">' +
        '<div class="w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center shrink-0"><i class="fas ' + typeIcon + ' text-surface-500 text-xs"></i></div>' +
        '<div class="flex-1 min-w-0">' +
          '<div class="flex justify-between items-start">' +
            '<span class="font-semibold text-sm text-surface-800">' + typeName + (l.contact_result ? ' · ' + (resultText[l.contact_result] || '') : '') + '</span>' +
            '<span class="text-[10px] text-surface-400">' + dateStr + ' ' + timeStr + '</span>' +
          '</div>' +
          (l.outcome ? '<span class="inline-flex items-center text-[10px] font-semibold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded mt-0.5">' + (outcomeText[l.outcome] || '') + '</span>' : '') +
          (esc(l.content) ? '<p class="text-xs text-surface-500 mt-1 line-clamp-1">' + esc(l.content) + '</p>' : '') +
        '</div></div>';
    });
    html += '</div>';
  } else {
    html += '<div class="text-center py-6"><p class="text-surface-400 text-sm">연락 기록이 없습니다</p></div>';
  }
  html += '</div></div>';

  container.innerHTML = html;
}

// ============================================
// 리텐션 탭 로직
// ============================================
async function loadRetention() {
  try {
    var res = await fetch('/api/retention/patients/' + patientId);
    var data = await res.json();
    if (data.success) { retentionData = data.data; renderRetention(data.data); }
    else { renderRetentionEmpty(); }
  } catch (err) { console.error('Retention load err:', err); renderRetentionEmpty(); }
}

function renderRetentionEmpty() {
  document.getElementById('retentionDetail').innerHTML =
    '<div class="text-center py-12"><div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-100 flex items-center justify-center"><i class="fas fa-heart-pulse text-2xl text-surface-300"></i></div>' +
    '<p class="text-surface-500 text-sm mb-3">리텐션 데이터가 없습니다</p>' +
    '<button onclick="openTreatmentModal()" class="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-all active:scale-95"><i class="fas fa-plus"></i>치료 등록하기</button></div>';
}

function renderRetention(d) {
  var container = document.getElementById('retentionDetail');
  var rs = d.retention_status;
  var treatments = d.treatments || [];
  var contacts = d.retention_contacts || [];
  var timeline = d.timeline || [];
  var html = '<div class="space-y-3 stagger-children">';

  // 리텐션 상태 카드
  if (rs) {
    var st = statusMap[rs.status] || statusMap.active;
    var riskColor = rs.risk_score >= 80 ? 'text-rose-600' : rs.risk_score >= 50 ? 'text-amber-600' : rs.risk_score >= 30 ? 'text-sky-600' : 'text-emerald-600';
    var riskBg = rs.risk_score >= 80 ? 'from-rose-500' : rs.risk_score >= 50 ? 'from-amber-500' : rs.risk_score >= 30 ? 'from-sky-500' : 'from-emerald-500';

    html += '<div class="card-premium p-5 border-l-4 border-l-' + st.color + '-400">' +
      '<div class="flex items-center justify-between mb-4">' +
        '<div class="flex items-center gap-2"><div class="w-8 h-8 rounded-lg ' + st.bg + ' flex items-center justify-center"><i class="fas ' + st.icon + ' text-xs ' + esc(st.text) + '"></i></div>' +
        '<div><span class="font-bold text-sm ' + esc(st.text) + '">' + st.label + '</span><p class="text-[10px] text-surface-500">마지막 내원 ' + rs.days_since_visit + '일 전</p></div></div>' +
        '<div class="text-center"><p class="text-3xl font-black ' + riskColor + '">' + rs.risk_score + '</p><p class="text-[9px] font-semibold text-surface-400">이탈위험도</p></div>' +
      '</div>' +
      '<div class="h-2 bg-surface-100 rounded-full overflow-hidden"><div class="h-full bg-gradient-to-r ' + riskBg + ' to-surface-200 rounded-full transition-all duration-1000" style="width:' + rs.risk_score + '%"></div></div>' +
      '<div class="flex justify-between mt-2 text-[10px] text-surface-400"><span>안전</span><span>주의</span><span>위험</span></div>' +
    '</div>';

    // AI 추천 멘트
    if (rs.recommended_contact_script) {
      html += '<div class="card-premium p-4 bg-gradient-to-br from-brand-50/50 to-purple-50/30 border border-brand-100/50">' +
        '<div class="flex items-center gap-2 mb-2"><i class="fas fa-sparkles text-brand-500 text-sm"></i><span class="font-bold text-xs text-brand-700">AI 추천 멘트</span></div>' +
        '<p class="text-sm text-surface-700 leading-relaxed">' + rs.recommended_contact_script + '</p>' +
        '<button onclick="openRetContactModal(\\'\\')" class="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 transition-all active:scale-95"><i class="fas fa-phone"></i>연락 기록하기</button>' +
      '</div>';
    }
  }

  // 잔여 치료비 요약
  // 잔여 치료비 요약 + Payment Progress
  var totalTreatAmt = treatments.reduce(function(s,t){ return s + (t.total_amount||0); }, 0);
  var totalPaidAmt = treatments.reduce(function(s,t){ return s + (t.paid_amount||0); }, 0);
  var paymentRate = totalTreatAmt > 0 ? Math.round(totalPaidAmt / totalTreatAmt * 100) : 0;
  var completedTreats = treatments.filter(function(t){ return t.status === 'completed'; }).length;
  var treatProgressRate = treatments.length > 0 ? Math.round(completedTreats / treatments.length * 100) : 0;
  
  html += '<div class="card-premium p-5">' +
    '<div class="flex items-center justify-between mb-3">' +
      sec('잔여 치료비', 'fas fa-coins text-amber-600', 'bg-amber-50') +
    '</div>' +
    '<p class="text-3xl font-black text-surface-900">' + Math.round((d.remaining_treatment_value || 0) / 10000) + '<span class="text-sm font-semibold text-surface-400 ml-1">만원</span></p>';

  // Payment Progress Bar
  if (totalTreatAmt > 0) {
    html += '<div class="mt-3 space-y-2">' +
      '<div><div class="flex justify-between text-[10px] mb-1"><span class="font-semibold text-surface-500">수납율</span><span class="font-black text-emerald-600">' + paymentRate + '%</span></div>' +
      '<div class="h-2 bg-surface-100 rounded-full overflow-hidden"><div class="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000" style="width:' + paymentRate + '%"></div></div></div>' +
      '<div><div class="flex justify-between text-[10px] mb-1"><span class="font-semibold text-surface-500">치료 진행율</span><span class="font-black text-brand-600">' + treatProgressRate + '% (' + completedTreats + '/' + treatments.length + ')</span></div>' +
      '<div class="h-2 bg-surface-100 rounded-full overflow-hidden"><div class="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-1000" style="width:' + treatProgressRate + '%"></div></div></div>' +
      '<div class="grid grid-cols-3 gap-2 mt-2">' +
        '<div class="text-center p-2 bg-surface-50 rounded-lg"><p class="text-xs font-black text-surface-800">' + Math.round(totalTreatAmt/10000) + '만</p><p class="text-[8px] text-surface-400">총 치료비</p></div>' +
        '<div class="text-center p-2 bg-emerald-50 rounded-lg"><p class="text-xs font-black text-emerald-600">' + Math.round(totalPaidAmt/10000) + '만</p><p class="text-[8px] text-surface-400">수납 완료</p></div>' +
        '<div class="text-center p-2 bg-rose-50 rounded-lg"><p class="text-xs font-black text-rose-600">' + Math.round((d.remaining_treatment_value||0)/10000) + '만</p><p class="text-[8px] text-surface-400">미수납</p></div>' +
      '</div></div>';
  }

  if (d.next_recall_date) {
    html += '<p class="text-xs text-sky-600 mt-2"><i class="fas fa-calendar-check mr-1"></i>다음 리콜 예정: ' + d.next_recall_date + '</p>';
  }
  html += '</div>';

  // 치료 목록
  html += '<div class="card-premium p-5">' +
    '<div class="flex items-center justify-between mb-3">' +
      '<div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center"><i class="fas fa-tooth text-xs text-brand-600"></i></div>' +
      '<h3 class="font-bold text-sm text-surface-900">치료 내역</h3></div>' +
      '<button onclick="openTreatmentModal()" class="text-xs font-semibold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-all active:scale-95"><i class="fas fa-plus mr-1"></i>추가</button>' +
    '</div>';
  if (treatments.length > 0) {
    html += '<div class="space-y-2">';
    treatments.forEach(function(t) {
      var ts = treatStatusMap[t.status] || treatStatusMap.consulted;
      var typeName = treatTypeMap[esc(t.treatment_type)] || esc(t.treatment_type);
      var remaining = (t.total_amount || 0) - (t.paid_amount || 0);
      html += '<div class="p-3 bg-surface-50 rounded-xl">' +
        '<div class="flex justify-between items-start">' +
          '<div><span class="font-bold text-sm text-surface-900">' + typeName + '</span>' +
          (esc(t.treatment_name) ? '<span class="text-surface-400 text-xs ml-1.5">' + esc(t.treatment_name) + '</span>' : '') + '</div>' +
          '<span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold ' + ts.bg + ' ' + esc(ts.text) + '">' + ts.label + '</span>' +
        '</div>' +
        '<div class="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-surface-500">' +
          (t.total_amount ? '<span><i class="fas fa-won-sign mr-0.5"></i>총 ' + (t.total_amount/10000).toFixed(0) + '만</span>' : '') +
          (t.paid_amount ? '<span class="text-emerald-600">수납 ' + (t.paid_amount/10000).toFixed(0) + '만</span>' : '') +
          (remaining > 0 ? '<span class="text-rose-600 font-semibold">잔여 ' + (remaining/10000).toFixed(0) + '만</span>' : '') +
          (t.next_appointment ? '<span><i class="fas fa-calendar mr-0.5"></i>' + t.next_appointment + '</span>' : '') +
        '</div>' +
        (esc(t.notes) ? '<p class="text-xs text-surface-500 mt-1.5 line-clamp-1">' + esc(t.notes) + '</p>' : '') +
      '</div>';
    });
    html += '</div>';
  } else {
    html += '<div class="text-center py-6"><p class="text-surface-400 text-sm">등록된 치료가 없습니다</p></div>';
  }
  html += '</div>';

  // 타임라인
  if (timeline.length > 0) {
    html += '<div class="card-premium p-5">' +
      sec('활동 타임라인', 'fas fa-timeline text-purple-600', 'bg-purple-50') +
      '<div class="relative pl-6 space-y-3">';
    timeline.slice(0, 15).forEach(function(e, i) {
      var date = e.date ? new Date(e.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '';
      var iconMap = { consultation: 'fa-stethoscope text-brand-600', treatment: 'fa-tooth text-emerald-600', contact: 'fa-phone text-sky-600' };
      var bgMap = { consultation: 'bg-brand-50', treatment: 'bg-emerald-50', contact: 'bg-sky-50' };
      var icon = iconMap[e.event_type] || 'fa-circle text-surface-400';
      var bg = bgMap[e.event_type] || 'bg-surface-50';
      var desc = '';
      if (e.event_type === 'consultation') desc = (esc(e.treatment_type) || '상담') + (e.amount ? ' · ' + (e.amount/10000).toFixed(0) + '만원' : '');
      else if (e.event_type === 'treatment') desc = (treatTypeMap[esc(e.treatment_type)] || '') + (esc(e.treatment_name) ? ' ' + esc(e.treatment_name) : '');
      else if (e.event_type === 'contact') desc = (e.contact_type === 'phone' ? '전화' : e.contact_type === 'text' ? '문자' : '카카오') + (e.result ? ' · ' + e.result : '');

      html += '<div class="relative">' +
        '<div class="absolute -left-6 top-0.5 w-4 h-4 rounded-full ' + bg + ' flex items-center justify-center ring-2 ring-white"><i class="fas ' + icon + '" style="font-size:7px"></i></div>' +
        (i < timeline.length - 1 ? '<div class="absolute -left-[17px] top-4 w-0.5 h-full bg-surface-200"></div>' : '') +
        '<div class="ml-1"><span class="text-[10px] text-surface-400 font-semibold">' + date + '</span>' +
        '<p class="text-xs text-surface-700 font-medium">' + desc + '</p></div></div>';
    });
    html += '</div></div>';
  }

  // 리텐션 연락 기록
  if (contacts.length > 0) {
    html += '<div class="card-premium p-5">' +
      sec('리텐션 연락 기록', 'fas fa-phone-volume text-emerald-600', 'bg-emerald-50') +
      '<div class="space-y-2">';
    contacts.forEach(function(rc) {
      var date = rc.contacted_at ? new Date(rc.contacted_at).toLocaleDateString('ko-KR', { month:'short', day:'numeric' }) : '';
      var resMap = { connected: '통화 성공', no_answer: '부재중', message_sent: '메시지 발송', callback_promised: '콜백 약속', appointment_booked: '예약 완료', refused: '거절' };
      var resColor = rc.result === 'appointment_booked' ? 'text-emerald-700 bg-emerald-50' : rc.result === 'refused' ? 'text-rose-700 bg-rose-50' : 'text-surface-700 bg-surface-50';
      html += '<div class="p-3 bg-surface-50 rounded-xl">' +
        '<div class="flex justify-between items-start">' +
          '<div class="flex items-center gap-2">' +
            '<span class="text-sm font-semibold">' + (rc.contact_type === 'phone' ? '📞' : rc.contact_type === 'text' ? '💬' : '💛') + '</span>' +
            '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ' + resColor + '">' + (resMap[rc.result] || rc.result) + '</span>' +
          '</div>' +
          '<span class="text-[10px] text-surface-400">' + date + (esc(rc.staff_name) ? ' · ' + esc(rc.staff_name) : '') + '</span>' +
        '</div>' +
        (esc(rc.notes) ? '<p class="text-xs text-surface-500 mt-1.5">' + esc(rc.notes) + '</p>' : '') +
      '</div>';
    });
    html += '</div></div>';
  }

  html += '</div>';
  container.innerHTML = html;
}

// ============================================
// 치료 등록 모달
// ============================================
function openTreatmentModal() { document.getElementById('treatmentModal').classList.remove('hidden'); }
function closeTreatmentModal() { document.getElementById('treatmentModal').classList.add('hidden'); }

async function saveTreatment() {
  try {
    var res = await fetch('/api/retention/treatments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: patientId,
        treatment_type: document.getElementById('treatType').value,
        treatment_name: document.getElementById('treatName').value || null,
        status: document.getElementById('treatStatus').value,
        total_amount: parseInt(document.getElementById('treatTotalAmount').value) || 0,
        paid_amount: parseInt(document.getElementById('treatPaidAmount').value) || 0,
        started_at: document.getElementById('treatStartDate').value || null,
        next_appointment: document.getElementById('treatNextAppt').value || null,
        notes: document.getElementById('treatNotes').value || null
      })
    });
    var data = await res.json();
    if (data.success) {
      closeTreatmentModal();
      retentionData = null;
      loadRetention();
    } else { showToast(data.error || '저장에 실패했습니다.','error'); }
  } catch (err) { showToast('오류가 발생했습니다.','error'); }
}

// ============================================
// 연락 기록 모달
// ============================================
function openRetContactModal(treatId) {
  document.getElementById('retModalTreatId').value = treatId || '';
  document.getElementById('retContactModal').classList.remove('hidden');
}
function closeRetContactModal() { document.getElementById('retContactModal').classList.add('hidden'); }

function selectRetContactType(type) {
  retContactType = type;
  document.querySelectorAll('.ret-ct-btn').forEach(function(b) {
    b.className = b.dataset.type === type
      ? 'ret-ct-btn flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-brand-500 text-brand-600 bg-brand-50 transition-all'
      : 'ret-ct-btn flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-surface-200 text-surface-600 transition-all';
  });
}

async function saveRetContact() {
  try {
    var res = await fetch('/api/retention/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: patientId,
        treatment_id: document.getElementById('retModalTreatId').value || null,
        contact_type: retContactType,
        result: document.getElementById('retContactResult').value,
        notes: document.getElementById('retContactNotes').value || null,
        next_contact_date: document.getElementById('retNextContact').value || null
      })
    });
    var data = await res.json();
    if (data.success) {
      closeRetContactModal();
      retentionData = null;
      loadRetention();
    } else { showToast(data.error || '저장에 실패했습니다.','error'); }
  } catch (err) { showToast('오류가 발생했습니다.','error'); }
}

// ============================================
// 환자 정보 수정
// ============================================
function openEditModal() {
  if (!currentPatient) return;
  var p = currentPatient;
  document.getElementById('editName').value = esc(p.name) || '';
  document.getElementById('editAge').value = p.age || '';
  document.getElementById('editGender').value = p.gender || '';
  document.getElementById('editPhone').value = p.phone_full || p.phone || '';
  document.getElementById('editReferral').value = p.referral_source || '';
  document.getElementById('editRegion').value = p.region || '';
  document.getElementById('editTags').value = (p.tags || []).join(', ');
  document.getElementById('editMemo').value = esc(p.memo) || '';
  document.getElementById('editPatientModal').classList.remove('hidden');
}
function closeEditModal() { document.getElementById('editPatientModal').classList.add('hidden'); }

async function savePatientEdit() {
  var btn = document.getElementById('saveEditBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>저장 중...';
  try {
    var tagsStr = document.getElementById('editTags').value;
    var tags = tagsStr ? tagsStr.split(',').map(function(t) { return t.trim(); }).filter(Boolean) : [];
    var res = await fetch('/api/patients/' + patientId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('editName').value,
        age: parseInt(document.getElementById('editAge').value) || null,
        gender: document.getElementById('editGender').value || null,
        phone: document.getElementById('editPhone').value || null,
        referral_source: document.getElementById('editReferral').value || null,
        region: document.getElementById('editRegion').value || null,
        tags: tags,
        memo: document.getElementById('editMemo').value || null
      })
    });
    var data = await res.json();
    if (data.success) {
      closeEditModal();
      loadPatient();
    } else { showToast(data.error || '저장에 실패했습니다.','error'); }
  } catch (err) { showToast('오류가 발생했습니다.','error'); }
  finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check mr-2"></i>저장'; }
}

document.getElementById('editBtn').addEventListener('click', openEditModal);

// ============================================
// 메모 히스토리
// ============================================
var memoHistoryLoaded = false;
window.toggleMemoHistory = function() {
  var container = document.getElementById('memoHistoryContainer');
  if (!container) return;
  if (!container.classList.contains('hidden')) {
    container.classList.add('hidden');
    return;
  }
  container.classList.remove('hidden');
  if (memoHistoryLoaded) return;
  loadMemoHistory();
};

async function loadMemoHistory() {
  var container = document.getElementById('memoHistoryContainer');
  if (!container) return;
  container.innerHTML = '<div class="flex items-center gap-2 py-2"><div class="w-3 h-3 border-2 border-brand-300 border-t-transparent rounded-full animate-spin"></div><span class="text-xs text-surface-400">이력 로딩중...</span></div>';
  try {
    var res = await fetch('/api/patients/' + patientId + '/memo-history');
    var data = await res.json();
    memoHistoryLoaded = true;
    if (!data.success || !data.data || data.data.length === 0) {
      container.innerHTML = '<p class="text-[11px] text-surface-400 py-2 px-1"><i class="fas fa-info-circle mr-1"></i>변경 이력이 없습니다</p>';
      return;
    }
    var html = '<div class="space-y-1.5 max-h-48 overflow-y-auto">';
    data.data.forEach(function(h) {
      var dt = new Date(h.changed_at);
      var dateStr = (dt.getMonth()+1) + '/' + dt.getDate() + ' ' + String(dt.getHours()).padStart(2,'0') + ':' + String(dt.getMinutes()).padStart(2,'0');
      html += '<div class="flex gap-2 py-1.5 px-2 bg-surface-50/50 rounded-lg text-[10px]">';
      html += '<div class="shrink-0 pt-0.5"><div class="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1"></div></div>';
      html += '<div class="flex-1 min-w-0">';
      html += '<div class="flex items-center gap-1.5"><span class="font-bold text-surface-700">' + esc(h.user_name || '?') + '</span><span class="text-surface-400">' + dateStr + '</span></div>';
      if (h.old_memo) html += '<p class="text-surface-400 line-through truncate">' + esc(h.old_memo) + '</p>';
      html += '<p class="text-surface-700">' + esc(h.new_memo || '(메모 삭제)') + '</p>';
      html += '</div></div>';
    });
    html += '</div>';
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = '<p class="text-[11px] text-rose-500 py-2">이력 로딩 실패</p>';
  }
}

// ============================================
// 연락 타임라인 강화 (통합 타임라인)
// ============================================
var contactTimelineLoaded = false;
var contactTimelineFilter = 'all';

// Override existing loadTimeline to add enhanced contact timeline
var _origLoadTimeline = loadTimeline;
loadTimeline = async function() {
  await _origLoadTimeline();
  if (!contactTimelineLoaded) {
    contactTimelineLoaded = true;
    await loadContactTimeline();
  }
};

async function loadContactTimeline() {
  try {
    var res = await fetch('/api/patients/' + patientId + '/contact-timeline');
    var data = await res.json();
    if (!data.success) return;
    
    var d = data.data;
    var allEvents = [];
    
    // Merge all events into one timeline
    (d.consultations || []).forEach(function(c) {
      allEvents.push({
        type: 'consultation', date: c.consultation_date,
        title: (esc(c.treatment_type) || '일반') + ' 상담',
        subtitle: c.consultant_name ? c.consultant_name + ' 실장' : '',
        amount: c.amount, status: c.status, score: c.consult_score || c.decision_score,
        id: c.id
      });
    });
    
    (d.contact_logs || []).forEach(function(cl) {
      allEvents.push({
        type: 'contact', date: cl.contacted_at,
        title: (cl.method === 'phone' ? '전화' : cl.method === 'text' ? '문자' : '카카오') + ' 연락',
        subtitle: cl.user_name || '', result: cl.result, notes: cl.notes
      });
    });
    
    (d.treatments || []).forEach(function(t) {
      allEvents.push({
        type: 'treatment', date: t.start_date || t.created_at,
        title: (treatTypeMap[t.treatment_type] || t.treatment_type || '치료'),
        subtitle: t.treatment_name || '',
        status: t.status, amount: t.total_amount, paid: t.paid_amount
      });
    });
    
    (d.retention_contacts || []).forEach(function(rc) {
      allEvents.push({
        type: 'retention_contact', date: rc.contact_date,
        title: '리텐션 연락 (' + (rc.contact_type === 'phone' ? '전화' : rc.contact_type === 'text' ? '문자' : '카카오') + ')',
        subtitle: rc.staff_name || '', result: rc.result, notes: rc.notes, treatment: rc.treatment_type
      });
    });
    
    allEvents.sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });
    
    // If there are enhanced timeline events, add filter UI and render
    if (allEvents.length > 0) {
      renderContactTimelineFilter(allEvents);
    }
    
    window._contactTimelineEvents = allEvents;
  } catch (err) {
    console.error('Contact timeline error:', err);
  }
}

function renderContactTimelineFilter(events) {
  var section = document.getElementById('timelineDetail');
  if (!section) return;
  
  // Count by type
  var counts = {all: events.length, consultation: 0, contact: 0, treatment: 0, retention_contact: 0};
  events.forEach(function(e) { if (counts[e.type] !== undefined) counts[e.type]++; });
  
  // Insert filter tabs before the main timeline card
  var filterEl = document.getElementById('timelineFilterBar');
  if (!filterEl) {
    var filterDiv = document.createElement('div');
    filterDiv.id = 'timelineFilterBar';
    filterDiv.className = 'mb-3';
    var firstCard = section.querySelector('.card-premium');
    if (firstCard) section.insertBefore(filterDiv, firstCard);
    else section.appendChild(filterDiv);
    filterEl = filterDiv;
  }
  
  var filterHTML = '<div class="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">';
  var filters = [
    {key: 'all', label: '전체', icon: 'fa-layer-group', count: counts.all},
    {key: 'consultation', label: '상담', icon: 'fa-stethoscope', count: counts.consultation},
    {key: 'contact', label: '연락', icon: 'fa-phone', count: counts.contact + counts.retention_contact},
    {key: 'treatment', label: '치료', icon: 'fa-tooth', count: counts.treatment}
  ];
  filters.forEach(function(f) {
    var active = contactTimelineFilter === f.key;
    filterHTML += '<button onclick="filterContactTimeline(\'' + f.key + '\')" class="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ' +
      (active ? 'bg-brand-600 text-white shadow-sm' : 'bg-surface-100 text-surface-500 hover:bg-surface-200') + '">' +
      '<i class="fas ' + f.icon + ' text-[8px]"></i>' + f.label + 
      '<span class="' + (active ? 'bg-white/20' : 'bg-surface-200') + ' px-1 py-0.5 rounded text-[8px]">' + f.count + '</span></button>';
  });
  filterHTML += '</div>';
  filterEl.innerHTML = filterHTML;
}

window.filterContactTimeline = function(type) {
  contactTimelineFilter = type;
  var events = window._contactTimelineEvents || [];
  renderContactTimelineFilter(events);
  
  // Filter and re-render
  var filtered = type === 'all' ? events : events.filter(function(e) {
    if (type === 'contact') return e.type === 'contact' || e.type === 'retention_contact';
    return e.type === type;
  });
  
  renderFilteredTimeline(filtered);
};

function renderFilteredTimeline(events) {
  var content = document.getElementById('timelineContent');
  if (!content) return;
  
  if (events.length === 0) {
    content.innerHTML = '<div class="text-center py-6"><i class="fas fa-filter-circle-xmark text-surface-300 text-xl mb-2"></i><p class="text-xs text-surface-500">해당 유형의 이벤트가 없습니다</p></div>';
    document.getElementById('timelineCount').textContent = '0건';
    return;
  }
  
  document.getElementById('timelineCount').textContent = events.length + '건';
  
  var icons = {consultation:'fa-stethoscope', contact:'fa-phone', treatment:'fa-tooth', retention_contact:'fa-heart-pulse'};
  var colors = {consultation:'bg-brand-100 text-brand-600', contact:'bg-sky-100 text-sky-600', treatment:'bg-emerald-100 text-emerald-700', retention_contact:'bg-purple-100 text-purple-600'};
  var stBadge = {paid:'bg-emerald-50 text-emerald-700',undecided:'bg-amber-50 text-amber-700',lost:'bg-rose-50 text-rose-700',
    completed:'bg-emerald-50 text-emerald-700',in_progress:'bg-sky-50 text-sky-700',scheduled:'bg-purple-50 text-purple-700',
    connected:'bg-emerald-50 text-emerald-700',no_answer:'bg-rose-50 text-rose-700',appointment_booked:'bg-brand-50 text-brand-700',
    message_sent:'bg-sky-50 text-sky-600',callback_promised:'bg-amber-50 text-amber-700',refused:'bg-rose-50 text-rose-700'};
  var resultLabels = {connected:'통화성공',no_answer:'부재중',message_sent:'메시지발송',callback_promised:'콜백약속',appointment_booked:'예약완료',refused:'거절'};
  var statusLabels = {paid:'결정',undecided:'미결정',lost:'이탈',completed:'완료',in_progress:'진행중',scheduled:'예약됨',consulted:'상담완료'};
  
  var html = '';
  events.forEach(function(ev, i) {
    html += '<div class="timeline-item flex gap-3 pb-4 relative">';
    html += '<div class="timeline-dot flex flex-col items-center shrink-0">';
    html += '<div class="w-8 h-8 rounded-lg ' + (colors[ev.type]||'bg-surface-100 text-surface-600') + ' flex items-center justify-center"><i class="fas ' + (icons[ev.type]||'fa-circle') + ' text-xs"></i></div>';
    if (i < events.length - 1) html += '<div class="w-0.5 flex-1 bg-surface-200 mt-1 min-h-[16px]"></div>';
    html += '</div>';
    html += '<div class="flex-1 min-w-0 pb-1">';
    html += '<div class="flex items-center justify-between"><span class="text-xs font-bold text-surface-900">' + esc(ev.title) + '</span><span class="text-[10px] text-surface-400">' + fmtDate(ev.date) + '</span></div>';
    
    if (ev.subtitle) html += '<p class="text-[10px] text-surface-500">' + esc(ev.subtitle) + '</p>';
    
    var badges = '';
    if (ev.amount) badges += '<span class="text-[10px] font-semibold text-emerald-600 mr-1">' + fmtWon(ev.amount) + '만원</span>';
    if (ev.status) badges += '<span class="text-[10px] px-1.5 py-0.5 rounded ' + (stBadge[ev.status]||'bg-surface-100 text-surface-600') + ' font-semibold">' + (statusLabels[ev.status]||ev.status) + '</span> ';
    if (ev.result) badges += '<span class="text-[10px] px-1.5 py-0.5 rounded ' + (stBadge[ev.result]||'bg-surface-100 text-surface-600') + ' font-semibold">' + (resultLabels[ev.result]||ev.result) + '</span> ';
    if (ev.score) badges += '<span class="text-[10px] font-bold ' + (ev.score >= 80 ? 'text-emerald-600' : ev.score >= 60 ? 'text-amber-600' : 'text-rose-600') + '">' + ev.score + '점</span>';
    if (badges) html += '<div class="flex flex-wrap items-center gap-1 mt-0.5">' + badges + '</div>';
    
    if (ev.notes) html += '<p class="text-[10px] text-surface-500 mt-0.5 line-clamp-2">' + esc(ev.notes) + '</p>';
    
    // Clickable for consultations
    if (ev.type === 'consultation' && ev.id) {
      html += '<a href="/consultations/' + ev.id + '" class="inline-flex items-center gap-1 mt-1 text-[10px] text-brand-600 font-semibold hover:text-brand-700"><i class="fas fa-arrow-right text-[8px]"></i>상세 보기</a>';
    }
    
    html += '</div></div>';
  });
  content.innerHTML = html;
}

loadPatient();
