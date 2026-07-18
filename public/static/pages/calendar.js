// =========================================
// CALENDAR PAGE — 상담/연락/예약/리콜 통합 일정 캘린더
// =========================================

var calState = {
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1, // 1-12
  days: {},          // { 'YYYY-MM-DD': {consultations, tasks, appointments, retention_contacts, ...} }
  selectedDate: null,
  filter: 'all',     // all | consultations | tasks | appointments | retention_contacts
  myOnly: false
};

function calFmtWon(n) {
  if (!n) return '0원';
  if (n >= 100000000) return (n / 100000000).toFixed(1).replace(/\.0$/, '') + '억';
  if (n >= 10000) return Math.round(n / 10000).toLocaleString() + '만';
  return n.toLocaleString() + '원';
}

function calDateStr(y, m, d) {
  return y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
}

async function initCalendar() {
  var authData = await requireAuth();
  if (!authData) return;

  // Navigation
  document.getElementById('prevMonthBtn').addEventListener('click', function () { calMoveMonth(-1); });
  document.getElementById('nextMonthBtn').addEventListener('click', function () { calMoveMonth(1); });
  document.getElementById('todayBtn').addEventListener('click', function () {
    var now = new Date();
    calState.year = now.getFullYear();
    calState.month = now.getMonth() + 1;
    calState.selectedDate = calDateStr(calState.year, calState.month, now.getDate());
    loadMonth().then(function () { loadDayDetail(calState.selectedDate); });
  });

  // Filters
  document.querySelectorAll('.cal-filter-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.cal-filter-btn').forEach(function (b) {
        b.classList.remove('active', 'bg-surface-800', 'text-white');
        b.classList.add('bg-surface-100', 'text-surface-600');
      });
      btn.classList.add('active', 'bg-surface-800', 'text-white');
      btn.classList.remove('bg-surface-100', 'text-surface-600');
      calState.filter = btn.dataset.type;
      renderCalendarGrid();
      if (calState.selectedDate) loadDayDetail(calState.selectedDate);
    });
  });

  // My only toggle
  document.getElementById('myOnlyToggle').addEventListener('change', function (e) {
    calState.myOnly = e.target.checked;
    loadMonth().then(function () {
      if (calState.selectedDate) loadDayDetail(calState.selectedDate);
    });
  });

  // 오늘 자동 선택
  var now = new Date();
  if (calState.year === now.getFullYear() && calState.month === now.getMonth() + 1) {
    calState.selectedDate = calDateStr(calState.year, calState.month, now.getDate());
  }

  await loadMonth();
  if (calState.selectedDate) loadDayDetail(calState.selectedDate);
}

function calMoveMonth(delta) {
  calState.month += delta;
  if (calState.month < 1) { calState.month = 12; calState.year--; }
  if (calState.month > 12) { calState.month = 1; calState.year++; }
  calState.selectedDate = null;
  loadMonth();
  document.getElementById('dayDetailTitle').textContent = '날짜를 선택하세요';
  document.getElementById('dayDetailCount').textContent = '';
  document.getElementById('dayDetailList').innerHTML =
    '<div class="card-premium p-5 text-center"><i class="fas fa-hand-pointer text-surface-300 text-2xl mb-2"></i><p class="text-xs text-surface-400 font-semibold">달력에서 날짜를 탭하면 그 날의 일정이 표시됩니다</p></div>';
}

async function loadMonth() {
  document.getElementById('monthTitle').textContent = calState.year + '년 ' + calState.month + '월';
  try {
    var data = await safeFetch('/api/calendar/month?year=' + calState.year + '&month=' + calState.month + '&my_only=' + calState.myOnly);
    if (!data || data.error) { showToast((data && data.error) || '캘린더를 불러오지 못했습니다', 'error'); return; }
    calState.days = data.days || {};

    // Summary
    var s = data.summary || {};
    document.getElementById('sumConsult').textContent = s.consultations || 0;
    document.getElementById('sumTasks').textContent = s.tasks || 0;
    document.getElementById('sumAppts').textContent = (s.appointments || 0) + (s.retention_contacts || 0);
    document.getElementById('sumPaidAmount').textContent = calFmtWon(s.paid_amount || 0);

    renderCalendarGrid();
  } catch (e) {
    console.error('Calendar load error:', e);
    showToast('캘린더를 불러오지 못했습니다', 'error');
  }
}

function calDayCount(info) {
  if (!info) return 0;
  if (calState.filter === 'all') return info.total || 0;
  return info[calState.filter] || 0;
}

function renderCalendarGrid() {
  var grid = document.getElementById('calendarGrid');
  var y = calState.year, m = calState.month;
  var firstDow = new Date(y, m - 1, 1).getDay(); // 0=일
  var daysInMonth = new Date(y, m, 0).getDate();
  var todayStr = calDateStr(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());

  var html = '';
  // 앞 공백
  for (var i = 0; i < firstDow; i++) html += '<div></div>';

  for (var d = 1; d <= daysInMonth; d++) {
    var ds = calDateStr(y, m, d);
    var info = calState.days[ds];
    var cnt = calDayCount(info);
    var isToday = ds === todayStr;
    var isSelected = ds === calState.selectedDate;
    var dow = (firstDow + d - 1) % 7;

    var dayColor = dow === 0 ? 'text-rose-400' : (dow === 6 ? 'text-sky-500' : 'text-surface-700');
    if (isToday) dayColor = 'text-white';

    var cellCls = 'relative flex flex-col items-center justify-start pt-1.5 pb-1 rounded-xl cursor-pointer transition-all min-h-[52px] active:scale-95 ';
    if (isSelected) cellCls += 'ring-2 ring-brand-500 bg-brand-50 ';
    else cellCls += 'hover:bg-surface-50 ';

    var numCls = 'text-[12px] font-bold w-6 h-6 flex items-center justify-center rounded-full ' + dayColor;
    if (isToday) numCls += ' bg-brand-600 shadow-md shadow-brand-600/30';

    // 도트 (유형별 색)
    var dots = '';
    if (info) {
      var dotDefs = [
        ['consultations', 'bg-brand-500'],
        ['tasks', 'bg-amber-500'],
        ['appointments', 'bg-emerald-500'],
        ['retention_contacts', 'bg-rose-500']
      ];
      var shown = 0;
      for (var k = 0; k < dotDefs.length; k++) {
        var key = dotDefs[k][0], cls = dotDefs[k][1];
        if ((calState.filter === 'all' || calState.filter === key) && info[key] > 0 && shown < 4) {
          dots += '<span class="w-1.5 h-1.5 rounded-full ' + cls + '"></span>';
          shown++;
        }
      }
    }

    var badge = '';
    if (cnt > 0) {
      badge = '<span class="text-[8px] font-extrabold text-surface-400 leading-none mt-0.5">' + cnt + '</span>';
    }

    html += '<div class="' + cellCls + '" data-date="' + ds + '" onclick="selectCalDay(\'' + ds + '\')">' +
      '<span class="' + numCls + '">' + d + '</span>' +
      '<div class="flex gap-0.5 mt-1 h-1.5">' + dots + '</div>' +
      badge +
      '</div>';
  }

  grid.innerHTML = html;
}

function selectCalDay(ds) {
  calState.selectedDate = ds;
  renderCalendarGrid();
  loadDayDetail(ds);
}

async function loadDayDetail(ds) {
  var list = document.getElementById('dayDetailList');
  var parts = ds.split('-');
  var dObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  var dows = ['일', '월', '화', '수', '목', '금', '토'];
  document.getElementById('dayDetailTitle').textContent =
    parseInt(parts[1]) + '월 ' + parseInt(parts[2]) + '일 (' + dows[dObj.getDay()] + ') 일정';
  list.innerHTML = '<div class="card-premium p-4"><div class="shimmer h-4 rounded-lg w-2/3 mb-2"></div><div class="shimmer h-3 rounded-lg w-1/2"></div></div>';

  try {
    var data = await safeFetch('/api/calendar/day?date=' + ds + '&my_only=' + calState.myOnly);
    if (!data || data.error) { list.innerHTML = '<div class="card-premium p-4 text-center text-xs text-surface-400">' + esc((data && data.error) || '일정을 불러오지 못했습니다') + '</div>'; return; }
    renderDayDetail(data);
  } catch (e) {
    console.error('Day detail error:', e);
    list.innerHTML = '<div class="card-premium p-4 text-center text-xs text-surface-400">일정을 불러오지 못했습니다 <button onclick="loadDayDetail(\'' + ds + '\')" class="underline font-bold text-brand-600 ml-1">다시 시도</button></div>';
  }
}

var CAL_STATUS_LABEL = {
  pending: ['대기중', 'bg-surface-100 text-surface-500'],
  undecided: ['미결정', 'bg-amber-50 text-amber-600'],
  paid: ['결제완료', 'bg-emerald-50 text-emerald-600'],
  lost: ['이탈', 'bg-rose-50 text-rose-500'],
  completed: ['완료', 'bg-emerald-50 text-emerald-600'],
  skipped: ['건너뜀', 'bg-surface-100 text-surface-400'],
  consulted: ['상담됨', 'bg-surface-100 text-surface-500'],
  scheduled: ['예약됨', 'bg-sky-50 text-sky-600'],
  in_progress: ['치료중', 'bg-brand-50 text-brand-600']
};

// 빠른 녹음 임시 환자명(녹음_MMDD_HHMM) → "미지정 환자" 표시
function calPatientLabel(name) {
  if (/^\ub179\uc74c_\d{4}_\d{4}$/.test(name || '')) {
    return { name: '미지정 환자', unlinked: true };
  }
  return { name: name || '환자', unlinked: false };
}

function calUnlinkedBadge() {
  return '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600"><i class="fas fa-link-slash mr-0.5"></i>연결 필요</span>';
}

function calStatusBadge(status) {
  var s = CAL_STATUS_LABEL[status] || [status || '-', 'bg-surface-100 text-surface-500'];
  return '<span class="text-[9px] font-bold px-2 py-0.5 rounded-md ' + s[1] + '">' + esc(s[0]) + '</span>';
}

function renderDayDetail(data) {
  var list = document.getElementById('dayDetailList');
  var f = calState.filter;
  var html = '';
  var total = 0;

  // 1) 상담
  if ((f === 'all' || f === 'consultations') && data.consultations.length) {
    total += data.consultations.length;
    html += '<p class="text-[10px] font-extrabold text-brand-600 uppercase tracking-wider px-1 pt-1"><span class="inline-block w-2 h-2 rounded-full bg-brand-500 mr-1"></span>상담 기록 (' + data.consultations.length + ')</p>';
    data.consultations.forEach(function (c) {
      var time = (c.consultation_date || '').slice(11, 16);
      var pl = calPatientLabel(c.patient_name);
      html += '<a href="/consultations/' + c.id + '" class="card-premium p-3.5 flex items-center gap-3 hover:shadow-md transition-all active:scale-[0.98] block">' +
        '<div class="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center shrink-0"><i class="fas fa-comments text-brand-600 text-sm"></i></div>' +
        '<div class="flex-1 min-w-0">' +
        '<div class="flex items-center gap-1.5"><p class="text-sm font-bold ' + (pl.unlinked ? 'text-surface-500' : 'text-surface-900') + ' truncate">' + esc(pl.name) + '</p>' + (pl.unlinked ? calUnlinkedBadge() : '') + calStatusBadge(c.status) + '</div>' +
        '<p class="text-[11px] text-surface-400 truncate">' + (time ? time + ' · ' : '') + esc(c.treatment_type || '일반') + (c.amount ? ' · ' + calFmtWon(c.amount) : '') + ' · ' + esc(c.user_name || '') + '</p>' +
        '</div><i class="fas fa-chevron-right text-surface-300 text-xs"></i></a>';
    });
  }

  // 2) 연락 태스크
  if ((f === 'all' || f === 'tasks') && data.tasks.length) {
    total += data.tasks.length;
    html += '<p class="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider px-1 pt-2"><span class="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1"></span>연락 태스크 (' + data.tasks.length + ')</p>';
    data.tasks.forEach(function (t) {
      var typeLabel = t.task_type === 'closing' ? '클로징' : '프로액티브';
      var phone = t.patient_phone ? '<a href="tel:' + esc(t.patient_phone) + '" onclick="event.stopPropagation()" class="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0"><i class="fas fa-phone text-emerald-600 text-xs"></i></a>' : '';
      var tpl = calPatientLabel(t.patient_name);
      html += '<div class="card-premium p-3.5 flex items-center gap-3">' +
        '<div class="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center shrink-0"><i class="fas fa-phone-volume text-amber-500 text-sm"></i></div>' +
        '<div class="flex-1 min-w-0">' +
        '<div class="flex items-center gap-1.5"><p class="text-sm font-bold ' + (tpl.unlinked ? 'text-surface-500' : 'text-surface-900') + ' truncate">' + esc(tpl.name) + '</p>' + (tpl.unlinked ? calUnlinkedBadge() : '') + calStatusBadge(t.status) + '</div>' +
        '<p class="text-[11px] text-surface-400 truncate">' + typeLabel + (t.treatment_type ? ' · ' + esc(t.treatment_type) : '') + (t.amount ? ' · ' + calFmtWon(t.amount) : '') + '</p>' +
        '</div>' + phone + '</div>';
    });
  }

  // 3) 치료 예약
  if ((f === 'all' || f === 'appointments') && data.appointments.length) {
    total += data.appointments.length;
    html += '<p class="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider px-1 pt-2"><span class="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1"></span>치료 예약 (' + data.appointments.length + ')</p>';
    data.appointments.forEach(function (a) {
      var time = (a.next_appointment || '').slice(11, 16);
      html += '<a href="/patients/' + a.patient_id + '" class="card-premium p-3.5 flex items-center gap-3 hover:shadow-md transition-all active:scale-[0.98] block">' +
        '<div class="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0"><i class="fas fa-tooth text-emerald-600 text-sm"></i></div>' +
        '<div class="flex-1 min-w-0">' +
        '<div class="flex items-center gap-1.5"><p class="text-sm font-bold text-surface-900 truncate">' + esc(a.patient_name || '환자') + '</p>' + calStatusBadge(a.status) + '</div>' +
        '<p class="text-[11px] text-surface-400 truncate">' + (time ? time + ' · ' : '') + esc(a.treatment_name || a.treatment_type || '치료') + (a.remaining_amount > 0 ? ' · 잔여 ' + calFmtWon(a.remaining_amount) : '') + '</p>' +
        '</div><i class="fas fa-chevron-right text-surface-300 text-xs"></i></a>';
    });
  }

  // 4) 리콜 (리텐션 다음 연락)
  if ((f === 'all' || f === 'retention_contacts') && data.retention_contacts.length) {
    total += data.retention_contacts.length;
    html += '<p class="text-[10px] font-extrabold text-rose-500 uppercase tracking-wider px-1 pt-2"><span class="inline-block w-2 h-2 rounded-full bg-rose-500 mr-1"></span>리콜 예정 (' + data.retention_contacts.length + ')</p>';
    data.retention_contacts.forEach(function (r) {
      var typeIcon = r.contact_type === 'phone' ? 'fa-phone' : (r.contact_type === 'kakao' ? 'fa-comment' : 'fa-message');
      var phone = r.patient_phone ? '<a href="tel:' + esc(r.patient_phone) + '" onclick="event.stopPropagation()" class="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0"><i class="fas fa-phone text-emerald-600 text-xs"></i></a>' : '';
      html += '<div class="card-premium p-3.5 flex items-center gap-3">' +
        '<div class="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center shrink-0"><i class="fas ' + typeIcon + ' text-rose-500 text-sm"></i></div>' +
        '<div class="flex-1 min-w-0">' +
        '<p class="text-sm font-bold text-surface-900 truncate">' + esc(r.patient_name || '환자') + '</p>' +
        '<p class="text-[11px] text-surface-400 truncate">' + esc(r.notes || '리콜 연락 예정') + (r.staff_name ? ' · ' + esc(r.staff_name) : '') + '</p>' +
        '</div>' + phone + '</div>';
    });
  }

  document.getElementById('dayDetailCount').textContent = total > 0 ? '총 ' + total + '건' : '';

  if (!html) {
    html = '<div class="card-premium p-6 text-center">' +
      '<i class="fas fa-mug-hot text-surface-300 text-2xl mb-2"></i>' +
      '<p class="text-xs text-surface-400 font-semibold">이 날은 일정이 없습니다</p></div>';
  }

  list.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', initCalendar);
