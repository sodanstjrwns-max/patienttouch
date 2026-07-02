// =========================================
// TODAY ACTION PAGE — v8.3
// 오늘의 액션 전용 페이지: 브리핑 요약 + 전체 체크리스트 + 이월 알림 + 완료 이력
// =========================================

function fmt(n) {
  if (!n && n !== 0) return '0';
  return Math.round(n / 10000).toLocaleString();
}

var tpAllItems = [];

async function loadTodayPage() {
  try {
    var authData = await requireAuth();
    if (!authData) return;

    // Date label
    var now = new Date();
    var days = ['일','월','화','수','목','금','토'];
    document.getElementById('todayDateLabel').textContent =
      (now.getMonth()+1) + '월 ' + now.getDate() + '일 (' + days[now.getDay()] + ') · ' + esc(authData.data.name) + '님';

    // Auto-generate daily tasks silently, then load all data
    await fetch('/api/tasks/auto-daily', { method: 'POST' }).catch(function(){ return null; });

    var [cRes, rRes, doneRes] = await Promise.all([
      safeFetch('/api/dashboard/today-contacts').then(function(r){ return r.json(); }).catch(function(){ return null; }),
      safeFetch('/api/retention/dashboard?filter=urgent').then(function(r){ return r.json(); }).catch(function(){ return null; }),
      safeFetch('/api/tasks?status=completed&limit=30').then(function(r){ return r.json(); }).catch(function(){ return null; })
    ]);

    renderBriefingSummary(cRes);
    renderOverdueAlert(cRes);
    buildChecklist(cRes, rRes);
    renderCompletedToday(doneRes);
    renderPushNudge();
  } catch(e) {
    console.error('Today page error:', e);
  }
}

// === PUSH ENABLE NUDGE (v8.4) ===
async function renderPushNudge() {
  try {
    if (typeof ptPush === 'undefined' || !ptPush.isSupported()) return;
    if (localStorage.getItem('pt_push_nudge_dismissed')) return;
    var state = await ptPush.getState();
    if (state !== 'unsubscribed') return; // 이미 구독했거나 차단됨

    var el = document.getElementById('pushNudgeBanner');
    el.classList.remove('hidden');
    el.innerHTML =
      '<div class="card-premium p-3.5 border-2 border-brand-200/60 bg-gradient-to-r from-brand-50 to-indigo-50 flex items-center gap-3">' +
        '<div class="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center shrink-0"><span class="text-base">🔔</span></div>' +
        '<div class="flex-1 min-w-0">' +
          '<p class="text-xs font-bold text-surface-900">매일 아침 브리핑을 알림으로 받아보세요</p>' +
          '<p class="text-[10px] text-surface-500">앱을 열지 않아도 "오늘 연락 N건" 알림이 도착해요</p>' +
        '</div>' +
        '<div class="flex gap-1.5 shrink-0">' +
          '<button onclick="enablePushFromNudge(this)" class="text-[11px] font-bold text-white bg-gradient-brand px-3 py-2 rounded-lg shadow-sm active:scale-95 transition-all">켜기</button>' +
          '<button onclick="dismissPushNudge()" class="w-8 h-8 rounded-lg text-surface-400 hover:bg-surface-100 flex items-center justify-center transition-all"><i class="fas fa-xmark text-xs"></i></button>' +
        '</div>' +
      '</div>';
  } catch(e) { /* non-critical */ }
}

async function enablePushFromNudge(btn) {
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  try {
    await ptPush.enable();
    showToast('아침 브리핑 알림이 켜졌습니다! ☀️', 'success');
    document.getElementById('pushNudgeBanner').classList.add('hidden');
    localStorage.setItem('pt_push_nudge_dismissed', '1');
  } catch(e) {
    showToast(e.message || '알림 설정에 실패했습니다.', 'error');
    btn.disabled = false;
    btn.textContent = '켜기';
  }
}

function dismissPushNudge() {
  document.getElementById('pushNudgeBanner').classList.add('hidden');
  localStorage.setItem('pt_push_nudge_dismissed', '1');
}

// === BRIEFING SUMMARY CARD ===
function renderBriefingSummary(cData) {
  var d = (cData && cData.success && cData.data) ? cData.data : { contacts: [], total: 0, overdue_count: 0, expected_revenue: 0 };
  var cs = d.contacts || [];

  document.getElementById('tbContactCount').textContent = d.total || cs.length || 0;
  document.getElementById('tbRevenue').textContent = fmt(d.expected_revenue || 0);
  var ovEl = document.getElementById('tbOverdue');
  var ovCount = d.overdue_count || 0;
  ovEl.textContent = ovCount;
  if (ovCount > 0) { ovEl.classList.remove('text-white'); ovEl.classList.add('text-amber-300'); }

  // Top priority patient
  var topEl = document.getElementById('tbTopPriority');
  if (cs.length > 0) {
    var top = cs[0];
    var ovBadge = (top.days_overdue >= 1) ? '<span class="text-[9px] font-bold text-amber-300 ml-1">⏰ ' + top.days_overdue + '일 지연</span>' : '';
    topEl.classList.remove('hidden');
    topEl.innerHTML =
      '<div class="flex items-center gap-2.5">' +
        '<div class="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0"><i class="fas fa-crosshairs text-white text-xs"></i></div>' +
        '<div class="flex-1 min-w-0">' +
          '<p class="text-[10px] text-white/50 font-semibold tracking-wider uppercase">최우선 연락</p>' +
          '<p class="text-sm font-bold text-white truncate">' + esc(top.patient_name) + '님' +
            (top.treatment_type ? ' · ' + esc(top.treatment_type) : '') +
            (top.amount ? ' · ' + fmt(top.amount) + '만원' : '') + ovBadge + '</p>' +
          '<p class="text-[10px] text-white/60 truncate">' + esc(top.reason || '') + '</p>' +
        '</div>' +
        (top.patient_phone_full ? '<a href="tel:' + top.patient_phone_full + '" class="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 active:scale-90 transition-all shrink-0"><i class="fas fa-phone text-sm"></i></a>' : '') +
      '</div>';
  }
}

// === OVERDUE CARRYOVER ALERT ===
function renderOverdueAlert(cData) {
  if (!cData || !cData.success || !cData.data) return;
  var overdue = (cData.data.contacts || []).filter(function(c){ return (c.days_overdue || 0) >= 1; });
  if (overdue.length === 0) return;

  var maxDays = Math.max.apply(null, overdue.map(function(c){ return c.days_overdue || 0; }));
  var names = overdue.slice(0, 3).map(function(c){ return esc(c.patient_name); }).join(', ');
  var more = overdue.length > 3 ? ' 외 ' + (overdue.length - 3) + '명' : '';

  var el = document.getElementById('overdueAlertBanner');
  el.classList.remove('hidden');
  el.innerHTML =
    '<div class="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-3.5 flex items-center gap-3 shadow-md shadow-amber-500/20 animate-slide-up">' +
      '<div class="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0"><span class="text-base">⏰</span></div>' +
      '<div class="flex-1 min-w-0">' +
        '<p class="text-white font-bold text-xs">어제 못 한 연락 ' + overdue.length + '건이 이월됐어요 (최대 ' + maxDays + '일 지연)</p>' +
        '<p class="text-white/70 text-[11px] truncate">' + names + more + ' — 오늘 최우선으로 처리하세요</p>' +
      '</div>' +
    '</div>';
}

// === FULL CHECKLIST (contacts + retention + mission) ===
function buildChecklist(cData, rData) {
  var items = [];

  if (cData && cData.success && cData.data && cData.data.contacts) {
    cData.data.contacts.forEach(function(c) {
      items.push({
        type: 'contact',
        id: 'contact_' + c.patient_id + '_' + (c.task_id||''),
        done: false,
        urgency: c.urgency || 'medium',
        days_overdue: c.days_overdue || 0,
        origin: c.origin || '',
        ai_reason: c.ai_reason || '',
        icon: 'fa-phone',
        title: esc(c.patient_name) + ' 연락',
        subtitle: esc(c.reason) || esc(c.treatment_type) || '미결정 환자',
        message: c.recommended_message || (c.points && c.points[0]) || c.recommended_script || '',
        amount: c.amount || c.remaining_value || 0,
        patient_id: c.patient_id,
        task_id: c.task_id || '',
        source: c.source || 'task',
        phone: c.patient_phone_full || ''
      });
    });
  }

  if (rData && rData.success && rData.data && rData.data.patients) {
    var seen = new Set(items.map(function(i){ return i.patient_id; }));
    rData.data.patients.slice(0, 8).forEach(function(p) {
      if (seen.has(p.patient_id)) return;
      var sLabel = p.status === 'unscheduled_urgent' ? '예약 미완 (긴급)' :
                   p.status === 'unscheduled_warning' ? '예약 미완' :
                   p.status === 'at_risk' ? '이탈 위험' :
                   p.status === 'consulted_unconverted' ? '상담 후 미전환' :
                   p.status === 'recall_6m' ? '6개월 리콜' :
                   p.status === 'recall_12m' ? '12개월 리콜' : '리텐션 대상';
      items.push({
        type: 'retention',
        id: 'ret_' + p.patient_id,
        done: false,
        urgency: p.risk_score >= 70 ? 'critical' : p.risk_score >= 40 ? 'high' : 'medium',
        days_overdue: 0,
        icon: 'fa-heart-pulse',
        title: esc(p.patient_name) + ' 관리',
        subtitle: sLabel + (p.days_since_visit > 0 ? ' · ' + p.days_since_visit + '일 경과' : ''),
        message: p.recommended_contact_script || '',
        amount: p.remaining_treatment_value || 0,
        patient_id: p.patient_id,
        task_id: '',
        source: 'retention',
        phone: p.patient_phone_full || p.patient_phone || ''
      });
    });
  }

  // Sort: overdue first → urgency → overdue days desc
  var urgOrder = {critical:0, high:1, medium:2};
  items.sort(function(a,b) {
    var aO = a.days_overdue >= 1 ? 1 : 0, bO = b.days_overdue >= 1 ? 1 : 0;
    if (aO !== bO) return bO - aO;
    var u = (urgOrder[a.urgency]||2) - (urgOrder[b.urgency]||2);
    if (u !== 0) return u;
    return b.days_overdue - a.days_overdue;
  });

  tpAllItems = items;
  renderTpChecklist();
}

function renderTpChecklist() {
  var items = tpAllItems;
  var listEl = document.getElementById('tpChecklistItems');
  var progEl = document.getElementById('tpChecklistProgress');
  var ringEl = document.getElementById('tpProgressRing');

  var doneCount = items.filter(function(i){ return i.done; }).length;
  var total = items.length;
  var pct = total > 0 ? Math.round((doneCount/total)*100) : 100;
  progEl.textContent = doneCount + '/' + total + ' 완료';

  // Progress ring
  var sz=36, sw=4, r=(sz-sw)/2, circ=2*Math.PI*r;
  var off = circ - (pct/100)*circ;
  var col = pct >= 100 ? '#10b981' : pct >= 50 ? '#6366f1' : '#f59e0b';
  ringEl.innerHTML =
    '<svg width="'+sz+'" height="'+sz+'" class="transform -rotate-90">' +
      '<circle cx="'+sz/2+'" cy="'+sz/2+'" r="'+r+'" fill="none" stroke="#f1f5f9" stroke-width="'+sw+'"/>' +
      '<circle cx="'+sz/2+'" cy="'+sz/2+'" r="'+r+'" fill="none" stroke="'+col+'" stroke-width="'+sw+'" stroke-linecap="round" stroke-dasharray="'+circ+'" stroke-dashoffset="'+off+'" style="transition:stroke-dashoffset .8s ease"/>' +
    '</svg>';

  if (total === 0) {
    listEl.innerHTML =
      '<div class="p-8 text-center">' +
        '<div class="w-14 h-14 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center mb-3"><span class="text-2xl">🎉</span></div>' +
        '<p class="font-bold text-sm text-surface-800 mb-1">오늘 할 일 완료!</p>' +
        '<p class="text-xs text-surface-500">모든 액션을 처리했어요. 수고하셨습니다!</p>' +
      '</div>';
    return;
  }

  var uCfg = {
    critical:{bd:'border-l-rose-500',bg:'bg-rose-50',tx:'text-rose-700',lb:'긴급'},
    high:{bd:'border-l-amber-500',bg:'bg-amber-50',tx:'text-amber-700',lb:'높음'},
    medium:{bd:'border-l-sky-400',bg:'bg-sky-50',tx:'text-sky-700',lb:'보통'}
  };

  var html = '';
  items.forEach(function(it, idx) {
    var u = uCfg[it.urgency] || uCfg.medium;
    html += '<div class="p-3 border-l-[3px] '+u.bd+' '+(it.done?'opacity-40':'')+'">';
    html += '<div class="flex items-start gap-2.5">';
    html += '<div class="w-8 h-8 rounded-lg '+u.bg+' flex items-center justify-center shrink-0"><i class="fas '+it.icon+' '+u.tx+' text-xs"></i></div>';
    html += '<div class="flex-1 min-w-0">';
    html += '<div class="flex items-center gap-1.5 flex-wrap">';
    html += '<a href="/patients/'+it.patient_id+'" class="font-bold text-sm text-surface-900 hover:text-brand-600'+(it.done?' line-through':'')+'">'+it.title+'</a>';
    html += '<span class="text-[9px] px-1 py-0.5 rounded font-bold '+u.bg+' '+u.tx+'">'+u.lb+'</span>';
    if (it.days_overdue >= 1) html += '<span class="text-[9px] px-1 py-0.5 rounded font-bold bg-orange-100 text-orange-700">⏰ '+it.days_overdue+'일 지연</span>';
    if (it.origin === 'ai_analysis') html += '<span class="text-[9px] px-1 py-0.5 rounded font-bold bg-purple-50 text-purple-700"><i class="fas fa-robot text-[7px] mr-0.5"></i>AI 추천</span>';
    html += '</div>';
    html += '<p class="text-[11px] text-surface-600 mt-0.5">'+it.subtitle+'</p>';
    if (it.amount > 0) html += '<span class="inline-block text-[9px] px-1 py-0.5 rounded bg-emerald-50 text-emerald-600 font-medium mt-1">'+fmt(it.amount)+'만원</span>';
    if (it.ai_reason) html += '<p class="text-[10px] text-purple-600 mt-1 line-clamp-1"><i class="fas fa-wand-magic-sparkles mr-1 text-[8px]"></i>'+esc(it.ai_reason)+'</p>';
    if (it.message) html += '<p class="text-[10px] text-surface-500 mt-1 line-clamp-2 bg-surface-50 rounded-lg px-2 py-1.5"><i class="fas fa-comment-dots text-brand-400 mr-1 text-[8px]"></i>'+esc(it.message)+'</p>';
    html += '</div>';
    html += '<div class="flex flex-col gap-1.5 shrink-0">';
    if (it.phone) html += '<a href="tel:'+it.phone+'" class="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 hover:bg-brand-100 active:scale-90 transition-all"><i class="fas fa-phone text-xs"></i></a>';
    if (!it.done) html += '<button onclick="openHomeContactModal(\''+it.patient_id+'\', \''+it.task_id+'\', \''+it.source+'\')" class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 active:scale-90 transition-all"><i class="fas fa-check text-xs"></i></button>';
    html += '</div>';
    html += '</div></div>';
  });

  listEl.innerHTML = html;
}

// === COMPLETED TODAY ===
function renderCompletedToday(doneRes) {
  if (!doneRes || !doneRes.success || !doneRes.data) return;
  var todayStr = new Date().toISOString().split('T')[0];
  var doneToday = doneRes.data.filter(function(t) {
    return t.completed_at && t.completed_at.indexOf(todayStr) === 0;
  });
  if (doneToday.length === 0) return;

  var resultLabels = { booked: '예약 완료', callback: '콜백 약속', hold: '보류', rejected: '거절', no_answer: '부재중' };
  var resultColors = { booked: 'bg-emerald-50 text-emerald-700', callback: 'bg-sky-50 text-sky-700', hold: 'bg-amber-50 text-amber-700', rejected: 'bg-rose-50 text-rose-700', no_answer: 'bg-surface-100 text-surface-600' };

  document.getElementById('tpCompletedSection').classList.remove('hidden');
  document.getElementById('tpCompletedCount').textContent = doneToday.length + '건';

  var html = '';
  doneToday.forEach(function(t) {
    var rl = resultLabels[t.result] || '완료';
    var rc = resultColors[t.result] || 'bg-surface-100 text-surface-600';
    html += '<div class="p-3 flex items-center gap-2.5">' +
      '<div class="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0"><i class="fas fa-check text-emerald-500 text-[10px]"></i></div>' +
      '<div class="flex-1 min-w-0">' +
        '<p class="text-xs font-semibold text-surface-700">'+esc(t.patient_name)+'</p>' +
        (t.result_note ? '<p class="text-[10px] text-surface-400 truncate">'+esc(t.result_note)+'</p>' : '') +
      '</div>' +
      '<span class="text-[9px] px-1.5 py-0.5 rounded font-bold '+rc+'">'+rl+'</span>' +
    '</div>';
  });
  document.getElementById('tpCompletedItems').innerHTML = html;
}

// === CONTACT MODAL (same behavior as home) ===
var hcContactType = 'phone';
function openHomeContactModal(patientId, taskId, source) {
  document.getElementById('hcPatientId').value = patientId || '';
  document.getElementById('hcTaskId').value = taskId || '';
  document.getElementById('hcSource').value = source || 'task';
  document.getElementById('hcResult').value = 'connected';
  document.getElementById('hcNotes').value = '';
  document.getElementById('hcNextDate').value = '';
  hcContactType = 'phone';
  document.querySelectorAll('.hc-type-btn').forEach(function(b) {
    b.className = b.dataset.type === 'phone'
      ? 'hc-type-btn flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-brand-500 text-brand-600 bg-brand-50 transition-all'
      : 'hc-type-btn flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-surface-200 text-surface-600 transition-all';
  });
  document.getElementById('homeContactModal').classList.remove('hidden');
}
function closeHomeContactModal() { document.getElementById('homeContactModal').classList.add('hidden'); }
function selectHcType(type) {
  hcContactType = type;
  document.querySelectorAll('.hc-type-btn').forEach(function(b) {
    b.className = b.dataset.type === type
      ? 'hc-type-btn flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-brand-500 text-brand-600 bg-brand-50 transition-all'
      : 'hc-type-btn flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-surface-200 text-surface-600 transition-all';
  });
}
async function saveHomeContact() {
  var btn = document.getElementById('hcSaveBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>저장 중...';
  try {
    var patientId = document.getElementById('hcPatientId').value;
    var taskId = document.getElementById('hcTaskId').value;
    var source = document.getElementById('hcSource').value;
    var result = document.getElementById('hcResult').value;
    var notes = document.getElementById('hcNotes').value;
    var nextDate = document.getElementById('hcNextDate').value;

    var res = await fetch('/api/retention/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: patientId,
        contact_type: hcContactType === 'text' ? 'text' : hcContactType,
        result: result,
        notes: notes,
        next_contact_date: nextDate || null
      })
    });
    var data = await res.json();

    if (taskId && source === 'task') {
      var outcomeMap = {
        'appointment_booked': 'booked',
        'callback_promised': 'callback',
        'refused': 'rejected',
        'no_answer': 'no_answer',
        'connected': 'hold',
        'message_sent': 'hold'
      };
      var taskOutcome = outcomeMap[result] || 'hold';
      await fetch('/api/tasks/' + taskId + '/complete', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_type: hcContactType,
          contact_result: result,
          outcome: taskOutcome,
          content: notes
        })
      });
    }

    if (data.success) {
      closeHomeContactModal();
      showToast('연락 기록이 저장되었습니다!', 'success');
      loadTodayPage(); // full reload of page data
    } else {
      showToast(data.error || '저장에 실패했습니다.', 'error');
    }
  } catch(e) {
    showToast('오류가 발생했습니다.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check mr-2"></i>기록 저장';
  }
}

document.getElementById('todayRefreshBtn').addEventListener('click', function() {
  var icon = this.querySelector('i');
  icon.classList.add('fa-spin');
  loadTodayPage().finally(function(){ setTimeout(function(){ icon.classList.remove('fa-spin'); }, 500); });
});

initPullToRefresh(function(){ loadTodayPage(); });
loadTodayPage();
