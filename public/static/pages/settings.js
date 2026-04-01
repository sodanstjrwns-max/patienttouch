async function loadSettings() {
  try {
    var data = await requireAuth();
    if (data.success) {
      var user = data.data;
      var settings = user.settings || {};
      var colors = ['bg-brand-100 text-brand-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-sky-100 text-sky-700', 'bg-purple-100 text-purple-700'];
      var avatarColor = colors[esc(user.name).charCodeAt(0) % colors.length];
      document.getElementById('profileSection').innerHTML =
        '<div class="w-16 h-16 rounded-2xl ' + avatarColor + ' flex items-center justify-center font-black text-2xl shrink-0">' + esc(user.name).charAt(0) + '</div>' +
        '<div><p class="font-bold text-surface-900">' + esc(user.name) + '</p>' +
        '<p class="text-surface-500 text-sm">' + esc(user.email) + '</p>' +
        '<p class="text-brand-600 text-xs font-semibold mt-0.5">' + esc(user.organization_name) + '</p></div>';

      document.getElementById('notificationEnabled').checked = settings.notification_enabled !== false;
      document.getElementById('notificationTime').value = settings.notification_time || '08:30';
      document.getElementById('weekendNotification').checked = settings.weekend_notification === true;

      var planNames = { basic:'Basic', standard:'Standard', premium:'Premium', enterprise:'Enterprise', trial:'Trial' };
      var statusNames = { active:'활성', expired:'만료', trial:'무료체험' };
      document.getElementById('planInfo').innerHTML =
        '<span class="text-surface-500 text-sm">현재 플랜</span>' +
        '<span class="font-bold text-brand-600 text-sm">' + (planNames[user.plan_type] || user.plan_type) + '</span>';
      document.getElementById('subInfo').innerHTML =
        '<span class="text-surface-500 text-sm">구독 상태</span>' +
        '<span class="inline-flex items-center gap-1.5 font-bold text-sm ' +
        (user.subscription_status === 'active' ? 'text-emerald-600' : user.subscription_status === 'trial' ? 'text-amber-600' : 'text-rose-600') + '">' +
        '<span class="w-1.5 h-1.5 rounded-full ' +
        (user.subscription_status === 'active' ? 'bg-emerald-500' : user.subscription_status === 'trial' ? 'bg-amber-500' : 'bg-rose-500') + '"></span>' +
        (statusNames[user.subscription_status] || user.subscription_status) + '</span>';
    }
  } catch (err) { console.error('Failed to load settings:', err); }
}

document.getElementById('saveSettingsBtn').addEventListener('click', async function() {
  var settings = {
    notification_enabled: document.getElementById('notificationEnabled').checked,
    notification_time: document.getElementById('notificationTime').value,
    weekend_notification: document.getElementById('weekendNotification').checked
  };
  try {
    var res = await fetch('/api/auth/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
    var data = await res.json();
    if (data.success) showToast('설정이 저장되었습니다.','success');
    else showToast(data.error || '설정 저장에 실패했습니다.','error');
  } catch (err) { showToast('오류가 발생했습니다.','error'); }
});

document.getElementById('logoutBtn').addEventListener('click', async function() {
  if (!confirm('로그아웃 하시겠습니까?')) return;
  try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (e) {}
  window.location.href = '/login';
});

// === Feature 10: Team Management ===
async function loadTeam() {
  try {
    var res = await fetch('/api/auth/team');
    var data = await res.json();
    if (!data.success) return;

    var roles = {admin:'관리자',staff:'상담사'};
    var roleColors = {admin:'bg-brand-50 text-brand-700',staff:'bg-surface-100 text-surface-600'};
    var colors = ['bg-brand-100 text-brand-700','bg-emerald-100 text-emerald-700','bg-amber-100 text-amber-700','bg-rose-100 text-rose-700','bg-sky-100 text-sky-700'];
    
    var html = '';
    data.data.forEach(function(m) {
      var ac = colors[esc(m.name).charCodeAt(0) % colors.length];
      html += '<div class="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">';
      html += '<div class="w-9 h-9 rounded-lg '+ac+' flex items-center justify-center font-bold text-xs shrink-0">'+esc(m.name).charAt(0)+'</div>';
      html += '<div class="flex-1 min-w-0">';
      html += '<div class="flex items-center gap-1.5"><span class="text-sm font-bold truncate">'+esc(m.name)+'</span>';
      html += '<span class="text-[10px] px-1.5 py-0.5 rounded '+(roleColors[m.role]||roleColors.staff)+' font-semibold">'+(roles[m.role]||m.role)+'</span></div>';
      html += '<p class="text-[11px] text-surface-500 truncate">'+esc(m.email)+'</p>';
      html += '</div>';
      html += '<div class="text-right shrink-0">';
      if(m.monthly_consultations) html += '<p class="text-xs font-bold text-surface-700">'+m.monthly_consultations+'건</p>';
      if(m.monthly_revenue) html += '<p class="text-[10px] text-emerald-600 font-semibold">'+fmtWon(m.monthly_revenue)+'만</p>';
      html += '</div></div>';
    });
    document.getElementById('teamList').innerHTML = html || '<p class="text-xs text-surface-500 text-center py-3">팀원이 없습니다</p>';
  } catch(e) { console.error('Team load error:', e); }
}

document.getElementById('addMemberBtn').addEventListener('click', function() {
  var name = prompt('팀원 이름:');
  if(!name) return;
  var email = prompt('이메일:');
  if(!email) return;
  var password = prompt('비밀번호:');
  if(!password) return;
  var role = confirm('관리자 권한을 부여하시겠습니까?\\n(확인=관리자, 취소=상담사)') ? 'admin' : 'staff';

  fetch('/api/auth/team', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({name:name, email:email, password:password, role:role})
  }).then(function(r){ return r.json(); }).then(function(d) {
    if(d.success) { showToast(name+'님을 추가했습니다!','success'); loadTeam(); }
    else showToast(d.error||'추가에 실패했습니다','error');
  }).catch(function(){ showToast('오류가 발생했습니다','error'); });
});

// === Feature 11: Data Export ===
function exportData(type) {
  showToast('다운로드 준비 중...','info');
  var url = '/api/dashboard/export?type='+type+'&period=30';
  window.open(url, '_blank');
}

// === Feature 12: Duplicate Check ===
async function checkDuplicates() {
  document.getElementById('duplicatesList').innerHTML = '<div class="shimmer h-12 rounded-lg w-full"></div>';
  try {
    var res = await fetch('/api/patients/duplicates/check');
    var data = await res.json();
    if (!data.success) { showToast('중복 검사에 실패했습니다','error'); return; }

    if (data.data.length === 0) {
      document.getElementById('duplicatesList').innerHTML = '<div class="text-center py-4"><div class="w-10 h-10 mx-auto bg-emerald-50 rounded-xl flex items-center justify-center mb-2"><i class="fas fa-circle-check text-emerald-500"></i></div><p class="text-xs font-semibold text-emerald-700">중복 환자가 없습니다!</p></div>';
      return;
    }

    var html = '';
    data.data.forEach(function(d) {
      html += '<div class="p-3 bg-amber-50/50 border border-amber-200/50 rounded-xl">';
      html += '<div class="flex items-center justify-between mb-2">';
      html += '<div class="flex items-center gap-2"><i class="fas fa-phone text-amber-500 text-xs"></i><span class="text-sm font-bold text-surface-900">'+(d.phone||'번호없음')+'</span>';
      html += '<span class="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">'+d.count+'명</span></div>';
      html += '<button onclick="mergeDuplicates(\'' + d.patient_ids[0] + '\', ' + JSON.stringify(d.patient_ids.slice(1)) + ')" class="text-[10px] font-semibold text-brand-600 bg-brand-50 px-2 py-1 rounded-lg hover:bg-brand-100 transition-all"><i class="fas fa-merge mr-1"></i>병합</button>';
      html += '</div>';
      html += '<div class="flex flex-wrap gap-1">';
      d.patient_names.forEach(function(n,i) {
        html += '<span class="text-[11px] px-1.5 py-0.5 rounded bg-white border border-surface-200 '+(i===0?'font-bold text-brand-700 border-brand-200':'text-surface-600')+'">'+(i===0?'<i class="fas fa-star text-[8px] text-brand-500 mr-0.5"></i>':'')+n+'</span>';
      });
      html += '</div></div>';
    });

    document.getElementById('duplicatesList').innerHTML = html;
    showToast(data.data.length+'건의 중복이 발견되었습니다','warning');
  } catch(e) { showToast('중복 검사 중 오류가 발생했습니다','error'); }
}

async function mergeDuplicates(keepId, mergeIds) {
  if (!confirm('첫 번째 환자를 유지하고 나머지를 병합합니다.\\n이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?')) return;
  try {
    var res = await fetch('/api/patients/duplicates/merge', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({keep_id:keepId, merge_ids:mergeIds})
    });
    var data = await res.json();
    if(data.success) { showToast('환자 병합이 완료되었습니다!','success'); checkDuplicates(); }
    else showToast(data.error||'병합에 실패했습니다','error');
  } catch(e) { showToast('오류가 발생했습니다','error'); }
}

loadSettings();
loadTeam();
