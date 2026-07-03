var allPatients = [];
var currentPatientFilter = 'all';
var currentSort = 'recent';

document.getElementById('addPatientBtn').addEventListener('click', function() {
  document.getElementById('addPatientModal').classList.remove('hidden');
});

window.closeModal = function() {
  document.getElementById('addPatientModal').classList.add('hidden');
};

document.getElementById('searchInput').addEventListener('input', debounce(function(e) {
  filterAndRender();
}, 200));

document.getElementById('sortSelect').addEventListener('change', function(e) {
  currentSort = e.target.value;
  filterAndRender();
});

window.applyPatientFilter = function(filter) {
  currentPatientFilter = filter;
  document.querySelectorAll('.patient-filter-btn').forEach(function(b) {
    b.className = b.dataset.filter === filter
      ? 'patient-filter-btn shrink-0 px-3 py-1.5 text-xs font-bold rounded-xl transition-all bg-brand-600 text-white'
      : 'patient-filter-btn shrink-0 px-3 py-1.5 text-xs font-bold rounded-xl transition-all bg-surface-100 text-surface-600';
  });
  filterAndRender();
};

function filterAndRender() {
  var q = (document.getElementById('searchInput').value || '').toLowerCase();
  var filtered = allPatients.filter(function(p) {
    // Text search: name, phone, referral_source, region, tags
    var matchText = true;
    if (q) {
      var tags = [];
      try { tags = Array.isArray(p.tags) ? p.tags : JSON.parse(p.tags || '[]'); } catch(e) {}
      var tagsStr = tags.join(' ').toLowerCase();
      matchText = esc(p.name).toLowerCase().includes(q) || 
        (p.phone && p.phone.includes(q)) ||
        (p.phone_full && p.phone_full.includes(q)) ||
        (p.referral_source && p.referral_source.toLowerCase().includes(q)) ||
        (p.region && p.region.toLowerCase().includes(q)) ||
        tagsStr.includes(q) ||
        (esc(p.memo) && esc(p.memo).toLowerCase().includes(q));
    }
    // Status filter
    var matchFilter = true;
    if (currentPatientFilter !== 'all') {
      matchFilter = p.last_consultation_status === currentPatientFilter;
    }
    return matchText && matchFilter;
  });

  // Sort
  filtered.sort(function(a, b) {
    if (currentSort === 'name') return esc(a.name).localeCompare(esc(b.name), 'ko');
    if (currentSort === 'consultation') {
      var da = a.last_consultation || '';
      var db = b.last_consultation || '';
      return db.localeCompare(da);
    }
    // recent (default): by updated_at desc
    return (b.updated_at || b.created_at || '').localeCompare(a.updated_at || a.created_at || '');
  });

  document.getElementById('patientCount').textContent = filtered.length + '명';
  renderPatients(filtered);
}

document.getElementById('addPatientForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  try {
    var res = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('pName').value,
        phone: document.getElementById('pPhone').value || undefined,
        age: document.getElementById('pAge').value ? parseInt(document.getElementById('pAge').value) : undefined,
        gender: document.getElementById('pGender').value || undefined,
        referral_source: document.getElementById('pReferral').value || undefined,
        region: document.getElementById('pRegion').value || undefined,
        memo: document.getElementById('pMemo').value || undefined
      })
    });
    var data = await res.json();
    if (data.success) {
      closeModal();
      loadPatients();
      document.getElementById('addPatientForm').reset();
    } else {
      showToast(data.error || '등록 실패','error');
    }
  } catch (err) { showToast('오류가 발생했습니다.','error'); }
});

function renderPatients(patients) {
  if (!patients || patients.length === 0) {
    document.getElementById('patientList').innerHTML = '<div class="text-center py-16 px-6"><div class="w-20 h-20 mx-auto mb-5 rounded-2xl bg-surface-100 flex items-center justify-center"><i class="fas fa-user-group text-3xl text-surface-300"></i></div><h3 class="text-lg font-bold text-surface-800 mb-1">환자가 없습니다</h3><p class="text-surface-500 text-sm">첫 환자를 등록해보세요</p></div>';
    return;
  }
  var statusMap = {
    paid: { label: '결제', bg: 'bg-emerald-50 text-emerald-700' },
    undecided: { label: '미결정', bg: 'bg-amber-50 text-amber-700' },
    lost: { label: '이탈', bg: 'bg-rose-50 text-rose-700' },
    pending: { label: '대기', bg: 'bg-surface-100 text-surface-600' }
  };
  var html = patients.map(function(p) {
    var avatarCls = PT.avatarColor(p.name); // v8.6: shared
    var tags = [];
    try { tags = Array.isArray(p.tags) ? p.tags : JSON.parse(p.tags || '[]'); } catch(e){}
    var st = statusMap[p.last_consultation_status] || null;
    return '<a href="/patients/' + p.id + '" class="card-premium p-4 flex items-center gap-3.5 block">' +
      '<div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ' + avatarCls + '">' +
        '<span class="text-base font-bold">' + esc(p.name).charAt(0) + '</span>' +
      '</div>' +
      '<div class="flex-1 min-w-0">' +
        '<div class="flex items-center gap-2">' +
          (p.consultation_count > 0
            ? PT.patientNameLink(p.id, p.name, {stop:true})
            : '<span class="font-bold text-sm">' + esc(p.name) + '</span>') +
          (p.age ? '<span class="text-xs text-surface-400">' + p.age + '세</span>' : '') +
          (p.gender ? '<span class="text-xs text-surface-400">' + (p.gender === 'male' ? '남' : '여') + '</span>' : '') +
          (st ? '<span class="text-[9px] px-1.5 py-0.5 rounded-md font-semibold ' + st.bg + '">' + st.label + '</span>' : '') +
        '</div>' +
        '<div class="flex items-center gap-1.5 mt-0.5 flex-wrap">' +
          (p.phone ? '<span class="text-xs text-surface-500">' + (p.phone_display || p.phone) + '</span>' : '') +
          (p.referral_source ? '<span class="text-[10px] px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-600 font-medium">' + p.referral_source + '</span>' : '') +
          (p.region ? '<span class="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 font-medium">' + p.region + '</span>' : '') +
          (tags.length > 0 ? tags.slice(0,2).map(function(t){ return '<span class="text-[10px] px-1.5 py-0.5 rounded-md bg-brand-50 text-brand-600 font-medium">' + t + '</span>'; }).join('') : '') +
          (p.consultation_count > 0 ? '<span class="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-100 text-surface-500 font-medium">상담 ' + p.consultation_count + '회</span>' : '') +
        '</div>' +
      '</div>' +
      '<i class="fas fa-chevron-right text-surface-300 text-xs"></i>' +
    '</a>';
  }).join('');
  document.getElementById('patientList').innerHTML = '<div class="space-y-2 stagger-children">' + html + '</div>';
}

function updateStats() {
  var total = allPatients.length;
  var consulted = allPatients.filter(function(p) { return p.consultation_count > 0; }).length;
  var paid = allPatients.filter(function(p) { return p.last_consultation_status === 'paid'; }).length;
  document.getElementById('statTotal').textContent = total;
  document.getElementById('statConsulted').textContent = consulted;
  document.getElementById('statPaid').textContent = paid;
}

async function loadPatients() {
  try {
    var res = await fetch('/api/patients');
    if (res.status === 401) { window.location.href = '/login'; return; }
    var data = await res.json();
    if (data.success) {
      allPatients = data.data;
      updateStats();
      filterAndRender();
    }
  } catch (err) { console.error(err); }
}

loadPatients();
initPullToRefresh(function(){ loadPatients(); });
