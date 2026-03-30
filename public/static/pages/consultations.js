var currentFilter = 'all';
var allConsultations = [];
var searchQuery = '';
var advFilterOpen = false;
var activeAdvFilters = {};
var miniChartInstance = null;

// === Status Filter ===
document.querySelectorAll('.filter-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.filter-btn').forEach(function(b) {
      b.className = 'filter-btn shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all bg-surface-100 text-surface-600 hover:bg-surface-200';
    });
    this.className = 'filter-btn active shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all bg-brand-600 text-white shadow-md shadow-brand-600/20';
    currentFilter = this.dataset.status;
    filterAndRender();
  });
});

// === Text Search ===
document.getElementById('consultSearch').addEventListener('input', debounce(function(e) {
  searchQuery = (e.target.value || '').toLowerCase();
  filterAndRender();
}, 200));

// === Advanced Filter Toggle ===
document.getElementById('advFilterToggle').addEventListener('click', function() {
  advFilterOpen = !advFilterOpen;
  document.getElementById('advFilterPanel').classList.toggle('hidden', !advFilterOpen);
  this.classList.toggle('bg-brand-600', advFilterOpen);
  this.classList.toggle('text-white', advFilterOpen);
  this.classList.toggle('bg-surface-100', !advFilterOpen);
  this.classList.toggle('text-surface-500', !advFilterOpen);
});

// === Date Quick Select ===
document.querySelectorAll('.date-quick-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var range = this.dataset.range;
    var now = new Date();
    var fromDate = new Date();
    if (range === 'today') { /* same day */ }
    else if (range === 'week') { fromDate.setDate(now.getDate() - now.getDay()); }
    else if (range === 'month') { fromDate.setDate(1); }
    else if (range === '3months') { fromDate.setMonth(now.getMonth() - 3); }
    var fmt = function(d) { return d.toISOString().split('T')[0]; };
    document.getElementById('filterDateFrom').value = fmt(fromDate);
    document.getElementById('filterDateTo').value = fmt(now);
    // Highlight active
    document.querySelectorAll('.date-quick-btn').forEach(function(b) {
      b.className = 'date-quick-btn text-[9px] font-bold px-2 py-1 rounded-md bg-surface-100 text-surface-500 hover:bg-brand-50 hover:text-brand-600 transition-all';
    });
    this.className = 'date-quick-btn text-[9px] font-bold px-2 py-1 rounded-md bg-brand-600 text-white transition-all';
  });
});

// === Apply Advanced Filter ===
document.getElementById('applyAdvFilter').addEventListener('click', function() {
  activeAdvFilters = {
    dateFrom: document.getElementById('filterDateFrom').value || null,
    dateTo: document.getElementById('filterDateTo').value || null,
    amountMin: document.getElementById('filterAmountMin').value ? parseInt(document.getElementById('filterAmountMin').value) * 10000 : null,
    amountMax: document.getElementById('filterAmountMax').value ? parseInt(document.getElementById('filterAmountMax').value) * 10000 : null,
    scoreMin: document.getElementById('filterScoreMin').value ? parseInt(document.getElementById('filterScoreMin').value) : null,
    scoreMax: document.getElementById('filterScoreMax').value ? parseInt(document.getElementById('filterScoreMax').value) : null,
    treatType: document.getElementById('filterTreatType').value || null,
    sort: document.getElementById('filterSort').value || 'date_desc'
  };
  renderActiveFilters();
  filterAndRender();
  showToast('필터가 적용되었습니다', 'success');
});

// === Reset Advanced Filter ===
document.getElementById('resetAdvFilter').addEventListener('click', function() {
  document.getElementById('filterDateFrom').value = '';
  document.getElementById('filterDateTo').value = '';
  document.getElementById('filterAmountMin').value = '';
  document.getElementById('filterAmountMax').value = '';
  document.getElementById('filterScoreMin').value = '';
  document.getElementById('filterScoreMax').value = '';
  document.getElementById('filterTreatType').value = '';
  document.getElementById('filterSort').value = 'date_desc';
  activeAdvFilters = {};
  document.querySelectorAll('.date-quick-btn').forEach(function(b) {
    b.className = 'date-quick-btn text-[9px] font-bold px-2 py-1 rounded-md bg-surface-100 text-surface-500 hover:bg-brand-50 hover:text-brand-600 transition-all';
  });
  document.getElementById('activeFilters').classList.add('hidden');
  filterAndRender();
  showToast('필터가 초기화되었습니다', 'info');
});

// === Render Active Filter Tags ===
function renderActiveFilters() {
  var tags = [];
  var f = activeAdvFilters;
  if (f.dateFrom || f.dateTo) tags.push({label: (f.dateFrom||'')+'~'+(f.dateTo||''), key:'date'});
  if (f.amountMin !== null || f.amountMax !== null) tags.push({label: (f.amountMin ? Math.round(f.amountMin/10000)+'만' : '0')+'~'+(f.amountMax ? Math.round(f.amountMax/10000)+'만' : '∞'), key:'amount'});
  if (f.scoreMin !== null || f.scoreMax !== null) tags.push({label: '점수 '+(f.scoreMin||0)+'~'+(f.scoreMax||100), key:'score'});
  if (f.treatType) tags.push({label: f.treatType, key:'treat'});
  if (f.sort && f.sort !== 'date_desc') {
    var sortLabels = {date_asc:'오래된순',amount_desc:'금액↑',amount_asc:'금액↓',score_desc:'점수↑',score_asc:'점수↓',decision_desc:'결정도↑'};
    tags.push({label: sortLabels[f.sort]||f.sort, key:'sort'});
  }
  var container = document.getElementById('activeFilterTags');
  if (tags.length === 0) { document.getElementById('activeFilters').classList.add('hidden'); return; }
  document.getElementById('activeFilters').classList.remove('hidden');
  container.innerHTML = tags.map(function(t) {
    return '<span class="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 text-brand-700 rounded-lg text-[10px] font-semibold border border-brand-200/50">' +
      '<i class="fas fa-filter text-[8px]"></i>' + t.label +
      '<button onclick="removeAdvFilter(\\'' + t.key + '\\')" class="ml-0.5 text-brand-400 hover:text-brand-700"><i class="fas fa-xmark text-[8px]"></i></button>' +
    '</span>';
  }).join('');
}

window.removeAdvFilter = function(key) {
  if (key === 'date') { activeAdvFilters.dateFrom = null; activeAdvFilters.dateTo = null; document.getElementById('filterDateFrom').value=''; document.getElementById('filterDateTo').value=''; }
  if (key === 'amount') { activeAdvFilters.amountMin = null; activeAdvFilters.amountMax = null; document.getElementById('filterAmountMin').value=''; document.getElementById('filterAmountMax').value=''; }
  if (key === 'score') { activeAdvFilters.scoreMin = null; activeAdvFilters.scoreMax = null; document.getElementById('filterScoreMin').value=''; document.getElementById('filterScoreMax').value=''; }
  if (key === 'treat') { activeAdvFilters.treatType = null; document.getElementById('filterTreatType').value=''; }
  if (key === 'sort') { activeAdvFilters.sort = 'date_desc'; document.getElementById('filterSort').value='date_desc'; }
  renderActiveFilters();
  filterAndRender();
};

// === Core Filter + Render ===
function filterAndRender() {
  var filtered = allConsultations.filter(function(c) {
    // Status filter
    if (currentFilter !== 'all' && c.status !== currentFilter) return false;
    // Text search
    if (searchQuery) {
      var match = (esc(c.patient_name) && esc(c.patient_name).toLowerCase().includes(searchQuery)) ||
        (esc(c.treatment_type) && esc(c.treatment_type).toLowerCase().includes(searchQuery)) ||
        (c.user_name && c.user_name.toLowerCase().includes(searchQuery));
      if (!match) return false;
    }
    // Advanced filters
    var f = activeAdvFilters;
    if (f.dateFrom) {
      var cDate = (c.consultation_date || '').split('T')[0];
      if (cDate < f.dateFrom) return false;
    }
    if (f.dateTo) {
      var cDate2 = (c.consultation_date || '').split('T')[0];
      if (cDate2 > f.dateTo) return false;
    }
    if (f.amountMin !== null && (c.amount || 0) < f.amountMin) return false;
    if (f.amountMax !== null && (c.amount || 0) > f.amountMax) return false;
    if (f.scoreMin !== null) {
      var score = (c.feedback && c.feedback.total_score) ? c.feedback.total_score : 0;
      if (score < f.scoreMin) return false;
    }
    if (f.scoreMax !== null) {
      var score2 = (c.feedback && c.feedback.total_score) ? c.feedback.total_score : 0;
      if (score2 > f.scoreMax) return false;
    }
    if (f.treatType && esc(c.treatment_type) !== f.treatType) return false;
    return true;
  });

  // Sort
  var sortKey = (activeAdvFilters.sort || 'date_desc');
  filtered.sort(function(a, b) {
    if (sortKey === 'date_desc') return (b.consultation_date||'').localeCompare(a.consultation_date||'');
    if (sortKey === 'date_asc') return (a.consultation_date||'').localeCompare(b.consultation_date||'');
    if (sortKey === 'amount_desc') return (b.amount||0) - (a.amount||0);
    if (sortKey === 'amount_asc') return (a.amount||0) - (b.amount||0);
    if (sortKey === 'score_desc') return ((b.feedback&&b.feedback.total_score)||0) - ((a.feedback&&a.feedback.total_score)||0);
    if (sortKey === 'score_asc') return ((a.feedback&&a.feedback.total_score)||0) - ((b.feedback&&b.feedback.total_score)||0);
    if (sortKey === 'decision_desc') return (b.decision_score||0) - (a.decision_score||0);
    return 0;
  });

  renderConsultations(filtered);
  renderMiniChart(filtered);
}

// === Mini Chart ===
function renderMiniChart(data) {
  if (!data || data.length < 2 || !window.Chart) {
    document.getElementById('chartPanel').classList.add('hidden');
    return;
  }
  document.getElementById('chartPanel').classList.remove('hidden');
  // Aggregate by date
  var byDate = {};
  data.forEach(function(c) {
    var dk = (c.consultation_date||'').split('T')[0];
    if (!byDate[dk]) byDate[dk] = {count:0, amount:0, paid:0};
    byDate[dk].count++;
    byDate[dk].amount += (c.amount||0);
    if (c.status === 'paid') byDate[dk].paid += (c.amount||0);
  });
  var dates = Object.keys(byDate).sort();
  var last10 = dates.slice(-10);
  var labels = last10.map(function(d) { var dt=new Date(d); return (dt.getMonth()+1)+'/'+dt.getDate(); });
  var amounts = last10.map(function(d) { return Math.round(byDate[d].amount/10000); });
  var paidAmounts = last10.map(function(d) { return Math.round(byDate[d].paid/10000); });

  if (miniChartInstance) miniChartInstance.destroy();
  var canvas = document.getElementById('miniChart');
  if (!canvas) return;
  miniChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: '결정', data: paidAmounts, backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 4, barPercentage: 0.6 },
        { label: '전체', data: amounts, backgroundColor: 'rgba(99,102,241,0.2)', borderRadius: 4, barPercentage: 0.6 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: {display:false}, ticks: {font:{size:8}} },
        y: { display:false, beginAtZero:true }
      }
    }
  });
}

function renderConsultations(data) {
  if (!data || data.length === 0) {
    document.getElementById('consultCount').textContent = '0건';
    document.getElementById('consultTotalAmount').textContent = '';
    document.getElementById('consultationList').innerHTML = 
      '<div class="text-center py-16 px-6 animate-fade-in">' +
        '<div class="w-20 h-20 mx-auto mb-5 rounded-2xl bg-surface-100 flex items-center justify-center"><i class="fas fa-microphone-slash text-3xl text-surface-300"></i></div>' +
        '<h3 class="text-lg font-bold text-surface-800 mb-1">상담 기록이 없습니다</h3>' +
        '<p class="text-surface-500 text-sm mb-5">' + (Object.keys(activeAdvFilters).length > 0 ? '필터 조건을 변경해보세요' : '첫 상담을 녹음해보세요') + '</p>' +
        (Object.keys(activeAdvFilters).length > 0 
          ? '<button onclick="document.getElementById(\\'resetAdvFilter\\').click()" class="inline-flex items-center gap-2 font-semibold text-sm text-brand-600 bg-brand-50 px-5 py-2.5 rounded-xl active:scale-95 transition-all"><i class="fas fa-rotate-right"></i>필터 초기화</button>'
          : '<a href="/recording" class="inline-flex items-center gap-2 font-semibold text-sm text-white bg-gradient-brand px-5 py-2.5 rounded-xl shadow-md shadow-brand-600/20"><i class="fas fa-microphone"></i>녹음 시작</a>') +
      '</div>';
    return;
  }

  // Calculate stats
  var totalAmount = data.reduce(function(sum, c){ return sum + (c.amount || 0); }, 0);
  var paidAmount = data.filter(function(c){ return c.status === 'paid'; }).reduce(function(sum, c){ return sum + (c.amount || 0); }, 0);
  var avgScore = 0;
  var scoredCount = 0;
  data.forEach(function(c) {
    if (c.feedback && c.feedback.total_score) { avgScore += c.feedback.total_score; scoredCount++; }
  });
  avgScore = scoredCount > 0 ? Math.round(avgScore / scoredCount) : 0;

  document.getElementById('consultCount').textContent = data.length + '건';
  document.getElementById('consultTotalAmount').textContent = 
    '결정 ' + Math.round(paidAmount / 10000).toLocaleString() + '만 / 전체 ' + Math.round(totalAmount / 10000).toLocaleString() + '만원' +
    (avgScore > 0 ? ' · 평균 ' + avgScore + '점' : '');

  // Group by date (if sorted by date)
  var sortKey = (activeAdvFilters.sort || 'date_desc');
  if (sortKey.startsWith('date')) {
    renderGroupedByDate(data);
  } else {
    renderFlatList(data);
  }
}

function renderGroupedByDate(data) {
  var groups = {};
  data.forEach(function(c) {
    var dateKey = c.consultation_date ? c.consultation_date.split('T')[0] : 'unknown';
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(c);
  });
  var dateKeys = Object.keys(groups).sort(function(a, b) {
    return (activeAdvFilters.sort === 'date_asc') ? a.localeCompare(b) : b.localeCompare(a);
  });

  var st = {
    paid: { bg:'bg-emerald-50', text:'text-emerald-700', label:'결제완료', dot:'bg-emerald-500', border:'border-l-emerald-400' },
    undecided: { bg:'bg-amber-50', text:'text-amber-700', label:'미결정', dot:'bg-amber-500', border:'border-l-amber-400' },
    lost: { bg:'bg-rose-50', text:'text-rose-700', label:'이탈', dot:'bg-rose-500', border:'border-l-rose-400' },
    pending: { bg:'bg-surface-50', text:'text-surface-600', label:'대기중', dot:'bg-surface-400', border:'border-l-surface-300' }
  };

  var today = new Date().toISOString().split('T')[0];
  var yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  var html = '<div class="space-y-4">';
  dateKeys.forEach(function(dk) {
    var items = groups[dk];
    var dayAmount = items.reduce(function(s, c){ return s + (c.amount || 0); }, 0);
    var dayPaid = items.filter(function(c){ return c.status === 'paid'; }).length;
    
    var dateLabel = dk;
    if (dk === today) dateLabel = '오늘';
    else if (dk === yesterday) dateLabel = '어제';
    else {
      var d = new Date(dk);
      var dayNames = ['일','월','화','수','목','금','토'];
      dateLabel = (d.getMonth()+1) + '/' + d.getDate() + ' (' + dayNames[d.getDay()] + ')';
    }

    html += '<div>';
    html += '<div class="flex items-center justify-between mb-2 px-1">';
    html += '<div class="flex items-center gap-2"><span class="text-xs font-bold text-surface-900">' + dateLabel + '</span><span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-surface-100 text-surface-500">' + items.length + '건</span></div>';
    if (dayAmount > 0) html += '<span class="text-[10px] font-bold text-brand-600">' + Math.round(dayAmount / 10000).toLocaleString() + '만원' + (dayPaid > 0 ? ' (결정 ' + dayPaid + '건)' : '') + '</span>';
    html += '</div>';
    html += '<div class="space-y-2">';
    
    items.forEach(function(c) { html += renderConsultCard(c, st); });
    
    html += '</div></div>';
  });
  html += '</div>';
  
  document.getElementById('consultationList').innerHTML = html;
}

function renderFlatList(data) {
  var st = {
    paid: { bg:'bg-emerald-50', text:'text-emerald-700', label:'결제완료', dot:'bg-emerald-500', border:'border-l-emerald-400' },
    undecided: { bg:'bg-amber-50', text:'text-amber-700', label:'미결정', dot:'bg-amber-500', border:'border-l-amber-400' },
    lost: { bg:'bg-rose-50', text:'text-rose-700', label:'이탈', dot:'bg-rose-500', border:'border-l-rose-400' },
    pending: { bg:'bg-surface-50', text:'text-surface-600', label:'대기중', dot:'bg-surface-400', border:'border-l-surface-300' }
  };
  var html = '<div class="space-y-2">';
  data.forEach(function(c) { html += renderConsultCard(c, st); });
  html += '</div>';
  document.getElementById('consultationList').innerHTML = html;
}

function renderConsultCard(c, st) {
  var s = st[c.status] || st.pending;
  var date = new Date(c.consultation_date);
  var dateStr = (date.getMonth()+1)+'/'+date.getDate();
  var timeStr = String(date.getHours()).padStart(2,'0') + ':' + String(date.getMinutes()).padStart(2,'0');
  var score = c.feedback && c.feedback.total_score ? c.feedback.total_score : null;
  
  return '<a href="/consultations/' + c.id + '" class="card-premium p-4 flex items-center gap-3.5 block border-l-4 ' + s.border + '">' +
    '<div class="w-11 h-11 rounded-xl ' + s.bg + ' flex items-center justify-center shrink-0">' +
      '<span class="text-base font-bold ' + esc(s.text) + '">' + (esc(c.patient_name) ? esc(c.patient_name).charAt(0) : '?') + '</span>' +
    '</div>' +
    '<div class="flex-1 min-w-0">' +
      '<div class="flex items-center gap-2">' +
        '<span class="font-bold text-sm truncate">' + (esc(c.patient_name) || '미지정') + '</span>' +
        '<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ring-1 ring-inset ' + s.bg + ' ' + esc(s.text) + ' ring-current/20"><span class="w-1 h-1 rounded-full ' + s.dot + '"></span>' + s.label + '</span>' +
      '</div>' +
      '<div class="flex items-center gap-1.5 mt-0.5 text-xs text-surface-500">' +
        '<span>' + dateStr + ' ' + timeStr + '</span>' +
        (esc(c.treatment_type) ? '<span class="text-surface-300">|</span><span>' + esc(c.treatment_type) + '</span>' : '') +
        (c.amount ? '<span class="text-surface-300">|</span><span class="font-semibold text-surface-600">' + (c.amount / 10000).toFixed(0) + '만</span>' : '') +
        (c.user_name ? '<span class="text-surface-300">|</span><span class="text-surface-400">' + c.user_name + '</span>' : '') +
        (c.decision_score ? '<span class="text-surface-300">|</span><span class="text-brand-600 font-semibold">결정도 ' + c.decision_score + '</span>' : '') +
      '</div>' +
    '</div>' +
    '<div class="text-right shrink-0">' +
      (score ? '<div class="text-lg font-black ' + (score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-rose-600') + '">' + score + '</div><div class="text-[10px] text-surface-400">점</div>' : '<i class="fas fa-chevron-right text-surface-300 text-xs"></i>') +
    '</div>' +
  '</a>';
}

async function loadConsultations() {
  try {
    var url = '/api/consultations?limit=200';
    var res = await fetch(url);
    var data = await res.json();
    
    if (!data.success) {
      if (res.status === 401) { window.location.href = '/login'; return; }
      return;
    }
    
    allConsultations = data.data || [];
    filterAndRender();
  } catch (err) {
    console.error('Load consultations error:', err);
  }
}

loadConsultations();
initPullToRefresh(function(){ loadConsultations(); });

// ============================================
// Manual Consultation Entry
// ============================================
document.getElementById('addManualBtn').addEventListener('click', async function() {
  try {
    var res = await fetch('/api/patients?limit=200');
    var data = await res.json();
    if (data.success) {
      var sel = document.getElementById('mPatient');
      sel.innerHTML = '<option value="">환자를 선택하세요</option>';
      data.data.forEach(function(p) {
        sel.innerHTML += '<option value="' + p.id + '">' + esc(p.name) + (p.phone_display ? ' (' + p.phone_display + ')' : p.phone ? ' (' + p.phone + ')' : '') + '</option>';
      });
    }
  } catch(e) {}
  var now = new Date();
  var local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  document.getElementById('mDate').value = local.toISOString().slice(0, 16);
  document.getElementById('manualModal').classList.remove('hidden');
});

window.closeManualModal = function() {
  document.getElementById('manualModal').classList.add('hidden');
};

document.getElementById('manualForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  var patientId = document.getElementById('mPatient').value;
  if (!patientId) { showToast('환자를 선택해주세요.','warning'); return; }
  try {
    var res = await fetch('/api/consultations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: patientId,
        treatment_type: document.getElementById('mTreatType').value || null,
        amount: document.getElementById('mAmount').value ? parseInt(document.getElementById('mAmount').value) : null,
        status: document.getElementById('mStatus').value || 'undecided',
        consultation_date: document.getElementById('mDate').value ? new Date(document.getElementById('mDate').value).toISOString() : new Date().toISOString()
      })
    });
    var data = await res.json();
    if (data.success) {
      var summary = document.getElementById('mSummary').value;
      if (summary && data.data.id) {
        await fetch('/api/consultations/' + data.data.id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ summary: summary })
        });
      }
      closeManualModal();
      document.getElementById('manualForm').reset();
      loadConsultations();
      showToast('상담이 등록되었습니다!', 'success');
    } else { showToast(data.error || '저장 실패','error'); }
  } catch (err) { showToast('오류가 발생했습니다.','error'); }
});
