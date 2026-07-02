// ============================================
// Consultation List - Server-side Infinite Scroll
// ============================================

var currentFilter = 'all';
var allConsultations = [];
var searchQuery = '';
var advFilterOpen = false;
var activeAdvFilters = {};
var miniChartInstance = null;

// Infinite scroll state
var PAGE_SIZE = 30;
var currentOffset = 0;
var totalCount = 0;
var hasMore = false;
var isLoading = false;
var isLoadingMore = false;
var searchDebounceTimer = null;

// === Status Filter ===
document.querySelectorAll('.filter-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.filter-btn').forEach(function(b) {
      b.className = 'filter-btn shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all bg-surface-100 text-surface-600 hover:bg-surface-200';
    });
    this.className = 'filter-btn active shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all bg-brand-600 text-white shadow-md shadow-brand-600/20';
    currentFilter = this.dataset.status;
    resetAndLoad();
  });
});

// === Text Search (server-side) ===
document.getElementById('consultSearch').addEventListener('input', function(e) {
  searchQuery = (e.target.value || '').trim();
  clearTimeout(searchDebounceTimer);
  if (transcriptSearchMode) {
    searchDebounceTimer = setTimeout(function() { runTranscriptSearch(); }, 450);
    return;
  }
  searchDebounceTimer = setTimeout(function() {
    resetAndLoad();
  }, 300);
});

// === v8.6: Transcript Full-text Search Mode ===
var transcriptSearchMode = false;

document.getElementById('transcriptSearchToggle').addEventListener('click', function() {
  transcriptSearchMode = !transcriptSearchMode;
  this.classList.toggle('bg-indigo-600', transcriptSearchMode);
  this.classList.toggle('text-white', transcriptSearchMode);
  this.classList.toggle('bg-surface-100', !transcriptSearchMode);
  this.classList.toggle('text-surface-500', !transcriptSearchMode);
  document.getElementById('transcriptSearchHint').classList.toggle('hidden', !transcriptSearchMode);
  var input = document.getElementById('consultSearch');
  input.placeholder = transcriptSearchMode ? '원문 키워드 검색 (예: 임플란트 가격, 할부)' : '환자명, 치료유형, 상담사 검색';
  if (!transcriptSearchMode) {
    document.getElementById('transcriptSearchResults').classList.add('hidden');
    document.getElementById('consultationList').classList.remove('hidden');
    if (searchQuery) resetAndLoad();
  } else {
    input.focus();
    if (searchQuery.length >= 2) runTranscriptSearch();
  }
});

function highlightKeyword(text, keyword) {
  var escText = esc(text);
  var escKw = esc(keyword);
  if (!escKw) return escText;
  var pattern = escKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escText.replace(new RegExp('(' + pattern + ')', 'gi'), '<mark class="bg-amber-200 text-surface-900 rounded px-0.5 font-bold">$1</mark>');
}

async function runTranscriptSearch() {
  var resultsEl = document.getElementById('transcriptSearchResults');
  var listEl = document.getElementById('consultationList');
  if (searchQuery.length < 2) {
    resultsEl.classList.add('hidden');
    listEl.classList.remove('hidden');
    return;
  }
  listEl.classList.add('hidden');
  resultsEl.classList.remove('hidden');
  resultsEl.innerHTML = '<div class="text-center py-8"><i class="fas fa-circle-notch fa-spin text-indigo-400 text-xl"></i><p class="text-xs text-surface-500 mt-2">원문 검색 중...</p></div>';

  try {
    var res = await fetch('/api/consultations/search-transcripts?q=' + encodeURIComponent(searchQuery));
    var data = await res.json();
    if (!data.success) throw new Error(data.error || '검색 실패');

    var results = data.data.results || [];
    if (results.length === 0) {
      resultsEl.innerHTML = '<div class="text-center py-10"><i class="fas fa-magnifying-glass-minus text-surface-300 text-2xl"></i><p class="font-bold text-sm text-surface-700 mt-3">"' + esc(searchQuery) + '" 검색 결과 없음</p><p class="text-xs text-surface-400 mt-1">상담 원문에서 해당 키워드를 찾지 못했습니다</p></div>';
      return;
    }

    var stMap = {
      paid: { bg:'bg-emerald-50', text:'text-emerald-700', label:'결제완료' },
      undecided: { bg:'bg-amber-50', text:'text-amber-700', label:'미결정' },
      lost: { bg:'bg-rose-50', text:'text-rose-700', label:'이탈' },
      pending: { bg:'bg-surface-50', text:'text-surface-600', label:'대기중' }
    };

    var html = '<p class="text-[11px] font-bold text-surface-500 mb-2 px-1"><i class="fas fa-scroll text-indigo-500 mr-1"></i>원문 검색 결과 <span class="text-indigo-600">' + results.length + '건</span></p><div class="space-y-2">';
    results.forEach(function(r) {
      var s = stMap[r.status] || stMap.pending;
      var d = new Date(r.consultation_date);
      var dateStr = (d.getMonth()+1) + '/' + d.getDate();
      html += '<a href="/consultations/' + r.consultation_id + '" class="card-premium p-3.5 block">' +
        '<div class="flex items-center gap-2 flex-wrap mb-2">' +
          '<span class="font-bold text-sm text-surface-900">' + esc(r.patient_name || '미지정') + '</span>' +
          '<span class="text-[10px] px-1.5 py-0.5 rounded-md font-semibold ' + s.bg + ' ' + s.text + '">' + s.label + '</span>' +
          '<span class="text-[10px] text-surface-400">' + dateStr + (r.treatment_type ? ' · ' + esc(r.treatment_type) : '') + (r.user_name ? ' · ' + esc(r.user_name) : '') + '</span>' +
          '<span class="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 font-bold ml-auto">' + r.match_count + '곳 일치</span>' +
        '</div>' +
        (r.snippets || []).map(function(sn) {
          return '<p class="text-xs text-surface-600 leading-relaxed bg-surface-50 rounded-lg px-2.5 py-2 mb-1">' + highlightKeyword(sn.text, data.data.keyword) + '</p>';
        }).join('') +
      '</a>';
    });
    html += '</div>';
    resultsEl.innerHTML = html;
  } catch (err) {
    resultsEl.innerHTML = '<div class="text-center py-8"><i class="fas fa-triangle-exclamation text-amber-400 text-xl"></i><p class="text-xs text-surface-500 mt-2">' + esc(err.message || '검색에 실패했습니다') + '</p></div>';
  }
}

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
    document.querySelectorAll('.date-quick-btn').forEach(function(b) {
      b.className = 'date-quick-btn text-[9px] font-bold px-2 py-1 rounded-md bg-surface-100 text-surface-500 hover:bg-brand-50 hover:text-brand-600 transition-all';
    });
    this.className = 'date-quick-btn text-[9px] font-bold px-2 py-1 rounded-md bg-brand-600 text-white transition-all';
  });
});

// === Apply Advanced Filter (server-side) ===
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
  resetAndLoad();
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
  resetAndLoad();
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
      '<button onclick="removeAdvFilter(\'' + t.key + '\')" class="ml-0.5 text-brand-400 hover:text-brand-700"><i class="fas fa-xmark text-[8px]"></i></button>' +
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
  resetAndLoad();
};

// ============================================
// Build Server Query URL
// ============================================
function buildQueryUrl(offset) {
  var params = ['limit=' + PAGE_SIZE, 'offset=' + offset];
  
  // Status filter
  if (currentFilter && currentFilter !== 'all') {
    params.push('status=' + encodeURIComponent(currentFilter));
  }
  
  // Text search (server-side)
  if (searchQuery) {
    params.push('search=' + encodeURIComponent(searchQuery));
  }
  
  // Advanced filters
  var f = activeAdvFilters;
  if (f.dateFrom) params.push('date_from=' + encodeURIComponent(f.dateFrom));
  if (f.dateTo) params.push('date_to=' + encodeURIComponent(f.dateTo));
  if (f.amountMin) params.push('amount_min=' + f.amountMin);
  if (f.amountMax) params.push('amount_max=' + f.amountMax);
  if (f.scoreMin) params.push('score_min=' + f.scoreMin);
  if (f.scoreMax) params.push('score_max=' + f.scoreMax);
  if (f.treatType) params.push('treatment_type=' + encodeURIComponent(f.treatType));
  if (f.sort) params.push('sort=' + encodeURIComponent(f.sort));
  
  return '/api/consultations?' + params.join('&');
}

// ============================================
// Reset + Load (for filter changes)
// ============================================
function resetAndLoad() {
  currentOffset = 0;
  allConsultations = [];
  totalCount = 0;
  hasMore = false;
  // Show skeleton loading
  document.getElementById('consultationList').innerHTML = buildSkeletonHTML();
  document.getElementById('consultCount').textContent = '로딩...';
  document.getElementById('consultTotalAmount').textContent = '';
  hideLoadMoreIndicator();
  loadConsultations(false);
}

function buildSkeletonHTML() {
  var html = '<div class="space-y-2">';
  for (var i = 0; i < 5; i++) {
    html += '<div class="card-premium p-4 animate-pulse"><div class="flex items-center gap-3.5">' +
      '<div class="w-11 h-11 rounded-xl bg-surface-100"></div>' +
      '<div class="flex-1"><div class="h-4 bg-surface-100 rounded w-24 mb-2"></div><div class="h-3 bg-surface-100 rounded w-40"></div></div>' +
      '<div class="h-8 w-8 bg-surface-100 rounded"></div>' +
    '</div></div>';
  }
  html += '</div>';
  return html;
}

// ============================================
// Load Consultations (with append support)
// ============================================
async function loadConsultations(append) {
  if (isLoading) return;
  isLoading = true;
  
  if (append) {
    isLoadingMore = true;
    showLoadMoreIndicator();
  }
  
  try {
    var url = buildQueryUrl(currentOffset);
    var res = await fetch(url);
    var result = await res.json();
    
    if (!result.success) {
      if (res.status === 401) { window.location.href = '/login'; return; }
      return;
    }
    
    var newData = result.data || [];
    totalCount = result.total || 0;
    hasMore = result.has_more || false;
    
    if (append) {
      allConsultations = allConsultations.concat(newData);
    } else {
      allConsultations = newData;
    }
    
    currentOffset += newData.length;
    
    renderConsultations(allConsultations, totalCount, append);
    renderMiniChart(allConsultations);
    
    if (hasMore) {
      showScrollHint();
    } else {
      hideScrollHint();
    }
    
  } catch (err) {
    console.error('Load consultations error:', err);
    if (!append) {
      document.getElementById('consultationList').innerHTML = 
        '<div class="text-center py-10"><p class="text-surface-500 text-sm">데이터를 불러오지 못했습니다.</p>' +
        '<button onclick="resetAndLoad()" class="mt-2 text-brand-600 text-sm font-semibold">다시 시도</button></div>';
    }
  } finally {
    isLoading = false;
    isLoadingMore = false;
    hideLoadMoreIndicator();
  }
}

// ============================================
// Infinite Scroll Observer
// ============================================
var scrollSentinel = null;
var scrollObserver = null;

function setupInfiniteScroll() {
  // Create sentinel element if not exists
  if (!scrollSentinel) {
    scrollSentinel = document.createElement('div');
    scrollSentinel.id = 'scrollSentinel';
    scrollSentinel.style.height = '1px';
    scrollSentinel.style.width = '100%';
    var listContainer = document.getElementById('consultationList');
    if (listContainer && listContainer.parentNode) {
      listContainer.parentNode.insertBefore(scrollSentinel.cloneNode ? scrollSentinel : scrollSentinel, listContainer.nextSibling);
      scrollSentinel = document.getElementById('scrollSentinel') || scrollSentinel;
      // Re-insert after list container
      if (!document.getElementById('scrollSentinel')) {
        listContainer.after(scrollSentinel);
      }
    }
  }
  
  // Cleanup previous observer
  if (scrollObserver) scrollObserver.disconnect();
  
  scrollObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting && hasMore && !isLoading) {
        loadConsultations(true);
      }
    });
  }, { rootMargin: '200px' });
  
  if (scrollSentinel) {
    scrollObserver.observe(scrollSentinel);
  }
}

// Insert sentinel after consultationList
(function initSentinel() {
  var list = document.getElementById('consultationList');
  if (list) {
    var sentinel = document.createElement('div');
    sentinel.id = 'scrollSentinel';
    sentinel.style.height = '1px';
    list.after(sentinel);
    scrollSentinel = sentinel;
    
    // Load more indicator
    var indicator = document.createElement('div');
    indicator.id = 'loadMoreIndicator';
    indicator.className = 'hidden text-center py-4';
    indicator.innerHTML = '<div class="inline-flex items-center gap-2 text-sm text-surface-400">' +
      '<div class="w-4 h-4 border-2 border-brand-300 border-t-transparent rounded-full animate-spin"></div>' +
      '더 불러오는 중...</div>';
    sentinel.after(indicator);
    
    // "All loaded" hint
    var hint = document.createElement('div');
    hint.id = 'scrollHint';
    hint.className = 'hidden text-center py-3';
    hint.innerHTML = '<span class="text-[11px] text-surface-400 font-medium">↓ 스크롤하면 더 불러옵니다</span>';
    list.after(hint);
  }
})();

function showLoadMoreIndicator() {
  var el = document.getElementById('loadMoreIndicator');
  if (el) el.classList.remove('hidden');
}
function hideLoadMoreIndicator() {
  var el = document.getElementById('loadMoreIndicator');
  if (el) el.classList.add('hidden');
}
function showScrollHint() {
  var el = document.getElementById('scrollHint');
  if (el) el.classList.remove('hidden');
}
function hideScrollHint() {
  var el = document.getElementById('scrollHint');
  if (el) el.classList.add('hidden');
}

// ============================================
// Mini Chart
// ============================================
function renderMiniChart(data) {
  if (!data || data.length < 2 || !window.Chart) {
    document.getElementById('chartPanel').classList.add('hidden');
    return;
  }
  document.getElementById('chartPanel').classList.remove('hidden');
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

// ============================================
// Render Consultations
// ============================================
function renderConsultations(data, total, isAppend) {
  if (!data || data.length === 0) {
    document.getElementById('consultCount').textContent = '0건';
    document.getElementById('consultTotalAmount').textContent = '';
    document.getElementById('consultationList').innerHTML = 
      '<div class="text-center py-16 px-6 animate-fade-in">' +
        '<div class="w-20 h-20 mx-auto mb-5 rounded-2xl bg-surface-100 flex items-center justify-center"><i class="fas fa-microphone-slash text-3xl text-surface-300"></i></div>' +
        '<h3 class="text-lg font-bold text-surface-800 mb-1">상담 기록이 없습니다</h3>' +
        '<p class="text-surface-500 text-sm mb-5">' + (Object.keys(activeAdvFilters).length > 0 ? '필터 조건을 변경해보세요' : '첫 상담을 녹음해보세요') + '</p>' +
        (Object.keys(activeAdvFilters).length > 0 
          ? '<button onclick="document.getElementById(\'resetAdvFilter\').click()" class="inline-flex items-center gap-2 font-semibold text-sm text-brand-600 bg-brand-50 px-5 py-2.5 rounded-xl active:scale-95 transition-all"><i class="fas fa-rotate-right"></i>필터 초기화</button>'
          : '<a href="/recording" class="inline-flex items-center gap-2 font-semibold text-sm text-white bg-gradient-brand px-5 py-2.5 rounded-xl shadow-md shadow-brand-600/20"><i class="fas fa-microphone"></i>녹음 시작</a>') +
      '</div>';
    return;
  }

  // Stats from loaded data
  var totalAmount = data.reduce(function(sum, c){ return sum + (c.amount || 0); }, 0);
  var paidAmount = data.filter(function(c){ return c.status === 'paid'; }).reduce(function(sum, c){ return sum + (c.amount || 0); }, 0);
  var avgScore = 0;
  var scoredCount = 0;
  data.forEach(function(c) {
    if (c.feedback && c.feedback.total_score) { avgScore += c.feedback.total_score; scoredCount++; }
  });
  avgScore = scoredCount > 0 ? Math.round(avgScore / scoredCount) : 0;

  // Show loaded count vs total
  var countStr = data.length < total ? data.length + '/' + total + '건' : total + '건';
  document.getElementById('consultCount').textContent = countStr;
  document.getElementById('consultTotalAmount').textContent = 
    '결정 ' + Math.round(paidAmount / 10000).toLocaleString() + '만 / 전체 ' + Math.round(totalAmount / 10000).toLocaleString() + '만원' +
    (avgScore > 0 ? ' · 평균 ' + avgScore + '점' : '');

  // Sort
  var sortKey = (activeAdvFilters.sort || 'date_desc');
  if (sortKey.startsWith('date')) {
    renderGroupedByDate(data);
  } else {
    renderFlatList(data);
  }
  
  // Setup infinite scroll after render
  setupInfiniteScroll();
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

  var st = PT.CONSULT_STATUS; // v8.6: shared component

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
  var st = PT.CONSULT_STATUS; // v8.6: shared component
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
        (c.patient_id && esc(c.patient_name)
          ? '<span onclick="event.preventDefault();event.stopPropagation();openTranscriptViewer(\'' + c.patient_id + '\', \'' + esc(c.patient_name).replace(/'/g, "\\'") + '\')" class="font-bold text-sm truncate text-brand-700 underline decoration-dotted decoration-brand-300 underline-offset-2 active:opacity-60">' + esc(c.patient_name) + '</span>'
          : '<span class="font-bold text-sm truncate">' + (esc(c.patient_name) || '미지정') + '</span>') +
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

// ============================================
// Initial Load
// ============================================
resetAndLoad();
initPullToRefresh(function(){ resetAndLoad(); });
setupInfiniteScroll();

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
      resetAndLoad();
      showToast('상담이 등록되었습니다!', 'success');
    } else { showToast(data.error || '저장 실패','error'); }
  } catch (err) { showToast('오류가 발생했습니다.','error'); }
});
