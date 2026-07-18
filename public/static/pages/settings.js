async function loadSettings() {
  try {
    var data = await requireAuth();
    if (data.success) {
      var user = data.data;
      window._ptMe = user; // v9.2: 팀 관리에서 본인/관리자 판별용
      var settings = user.settings || {};
      var avatarColor = PT.avatarColor(user.name); // v8.6: shared
      document.getElementById('profileSection').innerHTML =
        '<div class="w-16 h-16 rounded-2xl ' + avatarColor + ' flex items-center justify-center font-black text-2xl shrink-0">' + esc(user.name).charAt(0) + '</div>' +
        '<div><p class="font-bold text-surface-900">' + esc(user.name) + '</p>' +
        '<p class="text-surface-500 text-sm">' + esc(user.email) + '</p>' +
        '<p class="text-brand-600 text-xs font-semibold mt-0.5">' + esc(user.organization_name) + '</p></div>';

      // 데이터 내보내기는 관리자 전용 (API도 403 차단, UI도 숨김)
      if (user.role === 'admin' || user.role === 'owner') {
        var exportSec = document.getElementById('exportSection');
        if (exportSec) exportSec.classList.remove('hidden');
        var privacySec = document.getElementById('privacySection');
        if (privacySec) { privacySec.classList.remove('hidden'); loadPrivacyPolicy(); }
        // v9.2: 도입 문의(리드)는 플랫폼 운영 조직(서울BD치과)의 관리자에게만 노출
        if (user.organization_id === 'org_bd_dental') {
          var leadsSec = document.getElementById('leadsSection');
          if (leadsSec) { leadsSec.classList.remove('hidden'); loadLeads(); }
        }
      }

      document.getElementById('notificationEnabled').checked = settings.notification_enabled !== false;
      document.getElementById('notificationTime').value = settings.notification_time || '09:00';
      document.getElementById('weekendNotification').checked = settings.weekend_notification === true;

      // v8.4: 실제 푸시 구독 상태 반영
      initPushToggle();

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

// =========================================
// v8.4: 푸시 구독 토글 + 테스트 발송
// =========================================
async function initPushToggle() {
  var toggle = document.getElementById('notificationEnabled');
  var statusEl = document.getElementById('pushStatusLine');

  if (typeof ptPush === 'undefined' || !ptPush.isSupported()) {
    toggle.checked = false;
    toggle.disabled = true;
    if (statusEl) statusEl.innerHTML = '<i class="fas fa-circle-info mr-1"></i>이 브라우저는 푸시 알림을 지원하지 않아요 (iOS는 홈 화면에 추가 후 사용 가능)';
    return;
  }

  var state = await ptPush.getState();
  toggle.checked = (state === 'subscribed');
  updatePushStatusLine(state);

  toggle.addEventListener('change', async function() {
    toggle.disabled = true;
    try {
      if (toggle.checked) {
        await ptPush.enable();
        showToast('아침 브리핑 알림이 켜졌습니다! ☀️', 'success');
        updatePushStatusLine('subscribed');
        var testBtn = document.getElementById('pushTestBtn');
        if (testBtn) testBtn.classList.remove('hidden');
      } else {
        await ptPush.disable();
        showToast('푸시 알림이 꺼졌습니다.', 'info');
        updatePushStatusLine('unsubscribed');
      }
    } catch (e) {
      toggle.checked = !toggle.checked;
      showToast(e.message || '알림 설정에 실패했습니다.', 'error');
    } finally {
      toggle.disabled = false;
    }
  });

  var testBtn = document.getElementById('pushTestBtn');
  if (testBtn) {
    if (state === 'subscribed') testBtn.classList.remove('hidden');
    testBtn.addEventListener('click', async function() {
      testBtn.disabled = true;
      testBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>발송 중...';
      try {
        var r = await ptPush.test();
        showToast('테스트 알림 발송! (' + r.sent + '/' + r.devices + ' 기기)', 'success');
      } catch (e) {
        showToast(e.message || '테스트 발송 실패', 'error');
      } finally {
        testBtn.disabled = false;
        testBtn.innerHTML = '<i class="fas fa-paper-plane mr-1"></i>테스트 발송';
      }
    });
  }
}

function updatePushStatusLine(state) {
  var el = document.getElementById('pushStatusLine');
  if (!el) return;
  if (state === 'subscribed') el.innerHTML = '<i class="fas fa-circle-check text-emerald-500 mr-1"></i>이 기기에서 알림 수신 중';
  else if (state === 'denied') el.innerHTML = '<i class="fas fa-circle-xmark text-rose-500 mr-1"></i>브라우저에서 알림이 차단됨 — 주소창 옆 설정에서 허용해주세요';
  else el.innerHTML = '';
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

// === Feature 10: Team Management (v9.2: 상담사 여러 명 관리 강화) ===
var _teamMembers = [];
async function loadTeam() {
  try {
    var res = await fetch('/api/auth/team');
    var data = await res.json();
    if (!data.success) return;
    _teamMembers = data.data;

    var me = window._ptMe || {};
    var isAdmin = me.role === 'admin' || me.role === 'owner';
    var roles = {admin:'관리자',staff:'상담사'};
    var roleColors = {admin:'bg-brand-50 text-brand-700',staff:'bg-surface-100 text-surface-600'};

    var html = '';
    data.data.forEach(function(m) {
      var ac = PT.avatarColor(m.name); // v8.6: shared
      html += '<div class="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">';
      html += '<div class="w-9 h-9 rounded-lg '+ac+' flex items-center justify-center font-bold text-xs shrink-0">'+esc(m.name).charAt(0)+'</div>';
      html += '<div class="flex-1 min-w-0">';
      html += '<div class="flex items-center gap-1.5"><span class="text-sm font-bold truncate">'+esc(m.name)+'</span>';
      html += '<span class="text-[10px] px-1.5 py-0.5 rounded '+(roleColors[m.role]||roleColors.staff)+' font-semibold">'+(roles[m.role]||m.role)+'</span>';
      if(m.id === me.id) html += '<span class="text-[10px] text-surface-400">(나)</span>';
      html += '</div>';
      html += '<p class="text-[11px] text-surface-500 truncate">'+esc(m.email)+'</p>';
      html += '</div>';
      html += '<div class="text-right shrink-0">';
      if(m.monthly_consultations) html += '<p class="text-xs font-bold text-surface-700">'+m.monthly_consultations+'건</p>';
      if(m.monthly_revenue) html += '<p class="text-[10px] text-emerald-600 font-semibold">'+fmtWon(m.monthly_revenue)+'만</p>';
      html += '</div>';
      if(isAdmin && m.id !== me.id) {
        html += '<button class="team-manage-btn w-8 h-8 rounded-lg bg-white border border-surface-200 flex items-center justify-center shrink-0 hover:bg-surface-100" data-member-id="'+esc(m.id)+'" aria-label="팀원 관리"><i class="fas fa-ellipsis-vertical text-xs text-surface-500 pointer-events-none"></i></button>';
      }
      html += '</div>';
    });
    document.getElementById('teamList').innerHTML = html || '<p class="text-xs text-surface-500 text-center py-3">팀원이 없습니다</p>';

    // 관리 버튼 바인딩
    document.querySelectorAll('.team-manage-btn').forEach(function(btn) {
      btn.addEventListener('click', function() { openMemberManageSheet(btn.getAttribute('data-member-id')); });
    });
  } catch(e) { console.error('Team load error:', e); }
}

// v9.2: 팀원 관리 시트 (역할 변경 / 삭제)
function openMemberManageSheet(memberId) {
  var m = _teamMembers.find(function(x){ return x.id === memberId; });
  if (!m) return;
  var isStaff = m.role !== 'admin';
  var html =
    '<div class="flex items-center gap-3 mb-5">' +
      '<div class="w-11 h-11 rounded-xl '+PT.avatarColor(m.name)+' flex items-center justify-center font-bold">'+esc(m.name).charAt(0)+'</div>' +
      '<div><p class="font-bold text-surface-900">'+esc(m.name)+'</p><p class="text-xs text-surface-500">'+esc(m.email)+' · '+(m.role==='admin'?'관리자':'상담사')+'</p></div>' +
    '</div>' +
    '<div class="space-y-2">' +
      '<button id="memberRoleBtn" class="w-full py-3 rounded-xl bg-brand-50 text-brand-700 font-semibold text-sm"><i class="fas fa-user-gear mr-1.5"></i>'+(isStaff?'관리자로 승격':'상담사로 변경')+'</button>' +
      '<button id="memberDeleteBtn" class="w-full py-3 rounded-xl bg-rose-50 text-rose-600 font-semibold text-sm"><i class="fas fa-user-minus mr-1.5"></i>팀에서 제외</button>' +
      '<button id="memberCancelBtn" class="w-full py-3 rounded-xl bg-surface-100 text-surface-600 font-semibold text-sm">닫기</button>' +
    '</div>';
  PT.openSheet('memberManageSheet', html);

  document.getElementById('memberCancelBtn').addEventListener('click', function(){ PT.closeSheet('memberManageSheet'); });

  document.getElementById('memberRoleBtn').addEventListener('click', function() {
    var newRole = isStaff ? 'admin' : 'staff';
    fetch('/api/auth/team/'+encodeURIComponent(m.id), {
      method:'PUT', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({role:newRole})
    }).then(function(r){ return r.json(); }).then(function(d) {
      if(d.success) { showToast(m.name+'님을 '+(newRole==='admin'?'관리자':'상담사')+'로 변경했습니다','success'); PT.closeSheet('memberManageSheet'); loadTeam(); }
      else showToast(d.error||'변경에 실패했습니다','error');
    }).catch(function(){ showToast('오류가 발생했습니다','error'); });
  });

  document.getElementById('memberDeleteBtn').addEventListener('click', function() {
    if(!confirm(m.name+'님을 팀에서 제외하시겠습니까?\n계정이 삭제되며 로그인할 수 없게 됩니다.\n(해당 직원이 기록한 상담/환자 데이터는 보존됩니다)')) return;
    fetch('/api/auth/team/'+encodeURIComponent(m.id), { method:'DELETE' })
      .then(function(r){ return r.json(); }).then(function(d) {
        if(d.success) { showToast(m.name+'님을 팀에서 제외했습니다','success'); PT.closeSheet('memberManageSheet'); loadTeam(); }
        else showToast(d.error||'삭제에 실패했습니다','error');
      }).catch(function(){ showToast('오류가 발생했습니다','error'); });
  });
}

// v9.2: prompt 3연타 → 제대로 된 바텀시트 폼
document.getElementById('addMemberBtn').addEventListener('click', function() {
  var me = window._ptMe || {};
  if (me.role !== 'admin' && me.role !== 'owner') { showToast('관리자만 팀원을 추가할 수 있습니다','error'); return; }
  var html =
    '<h3 class="font-bold text-surface-900 mb-1">팀원 추가</h3>' +
    '<p class="text-xs text-surface-500 mb-4">상담사 계정을 만들면 같은 병원 데이터를 함께 사용합니다</p>' +
    '<div class="space-y-3">' +
      '<div><label class="text-xs font-semibold text-surface-600 block mb-1">이름 *</label><input id="nmName" type="text" class="w-full px-3 py-2.5 rounded-xl border border-surface-200 text-sm" placeholder="김유진" autocomplete="off" /></div>' +
      '<div><label class="text-xs font-semibold text-surface-600 block mb-1">이메일(로그인 ID) *</label><input id="nmEmail" type="email" class="w-full px-3 py-2.5 rounded-xl border border-surface-200 text-sm" placeholder="yujin@clinic.kr" autocomplete="off" /></div>' +
      '<div><label class="text-xs font-semibold text-surface-600 block mb-1">비밀번호 * <span class="font-normal text-surface-400">(8자 이상)</span></label><input id="nmPassword" type="password" class="w-full px-3 py-2.5 rounded-xl border border-surface-200 text-sm" placeholder="••••••••" autocomplete="new-password" /></div>' +
      '<div><label class="text-xs font-semibold text-surface-600 block mb-1">연락처</label><input id="nmPhone" type="tel" class="w-full px-3 py-2.5 rounded-xl border border-surface-200 text-sm" placeholder="010-0000-0000" autocomplete="off" /></div>' +
      '<div><label class="text-xs font-semibold text-surface-600 block mb-1">역할</label>' +
        '<div class="grid grid-cols-2 gap-2">' +
          '<button type="button" class="nm-role-btn py-2.5 rounded-xl border-2 border-brand-500 bg-brand-50 text-brand-700 text-sm font-semibold" data-role="staff"><i class="fas fa-headset mr-1"></i>상담사</button>' +
          '<button type="button" class="nm-role-btn py-2.5 rounded-xl border-2 border-surface-200 text-surface-500 text-sm font-semibold" data-role="admin"><i class="fas fa-user-shield mr-1"></i>관리자</button>' +
        '</div>' +
        '<p class="text-[11px] text-surface-400 mt-1.5">상담사: 상담/환자 관리 · 관리자: + 팀원관리·매출전체·데이터내보내기</p>' +
      '</div>' +
      '<button id="nmSubmit" class="w-full py-3 rounded-xl bg-brand-600 text-white font-bold text-sm mt-1"><i class="fas fa-user-plus mr-1.5"></i>팀원 추가</button>' +
    '</div>';
  PT.openSheet('addMemberSheet', html);

  var selectedRole = 'staff';
  document.querySelectorAll('.nm-role-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      selectedRole = btn.getAttribute('data-role');
      document.querySelectorAll('.nm-role-btn').forEach(function(b) {
        var on = b === btn;
        b.className = 'nm-role-btn py-2.5 rounded-xl border-2 text-sm font-semibold ' + (on ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-200 text-surface-500');
      });
    });
  });

  document.getElementById('nmSubmit').addEventListener('click', function() {
    var name = document.getElementById('nmName').value.trim();
    var email = document.getElementById('nmEmail').value.trim();
    var password = document.getElementById('nmPassword').value;
    var phone = document.getElementById('nmPhone').value.trim();
    if(!name) { showToast('이름을 입력해주세요','error'); return; }
    if(!email || email.indexOf('@') < 1) { showToast('올바른 이메일을 입력해주세요','error'); return; }
    if(!password || password.length < 8) { showToast('비밀번호는 8자 이상이어야 합니다','error'); return; }
    var btn = document.getElementById('nmSubmit');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1.5"></i>추가 중...';
    fetch('/api/auth/team', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({name:name, email:email, password:password, role:selectedRole, phone:phone||null})
    }).then(function(r){ return r.json(); }).then(function(d) {
      if(d.success) { showToast(name+'님을 추가했습니다! 이제 '+email+'로 로그인할 수 있어요','success'); PT.closeSheet('addMemberSheet'); loadTeam(); }
      else { showToast(d.error||'추가에 실패했습니다','error'); btn.disabled = false; btn.innerHTML = '<i class="fas fa-user-plus mr-1.5"></i>팀원 추가'; }
    }).catch(function(){ showToast('오류가 발생했습니다','error'); btn.disabled = false; btn.innerHTML = '<i class="fas fa-user-plus mr-1.5"></i>팀원 추가'; });
  });
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

// === v8.6: Privacy & Compliance (admin only) ===
async function loadPrivacyPolicy() {
  try {
    var res = await fetch('/api/privacy/policy');
    var data = await res.json();
    if (!data.success) return;
    var p = data.data;
    var noticeEl = document.getElementById('consentNoticeText');
    var monthsEl = document.getElementById('retentionMonths');
    if (noticeEl) noticeEl.value = p.consent_notice_text || '';
    if (monthsEl) monthsEl.value = String(p.transcript_retention_months || 0);
    var pendingEl = document.getElementById('purgePendingLine');
    if (pendingEl) {
      if (p.transcript_retention_months > 0 && p.pending_purge_count > 0) {
        pendingEl.innerHTML = '<i class="fas fa-triangle-exclamation mr-1"></i>보존 기간이 지난 상담 원문 <b>' + p.pending_purge_count + '건</b>이 파기 대상입니다. "지금 파기 실행"으로 즉시 처리할 수 있어요.';
        pendingEl.classList.remove('hidden');
      } else {
        pendingEl.classList.add('hidden');
      }
    }
  } catch (e) { console.error('Privacy policy load error:', e); }
}

var savePrivacyBtn = document.getElementById('savePrivacyBtn');
if (savePrivacyBtn) savePrivacyBtn.addEventListener('click', async function() {
  savePrivacyBtn.disabled = true;
  try {
    var res = await fetch('/api/privacy/policy', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript_retention_months: parseInt(document.getElementById('retentionMonths').value, 10),
        consent_notice_text: document.getElementById('consentNoticeText').value.trim()
      })
    });
    var data = await res.json();
    if (data.success) { showToast('개인정보 정책이 저장되었습니다.', 'success'); loadPrivacyPolicy(); }
    else showToast(data.error || '저장에 실패했습니다.', 'error');
  } catch (e) { showToast('오류가 발생했습니다.', 'error'); }
  finally { savePrivacyBtn.disabled = false; }
});

var purgeNowBtn = document.getElementById('purgeNowBtn');
if (purgeNowBtn) purgeNowBtn.addEventListener('click', async function() {
  var months = parseInt(document.getElementById('retentionMonths').value, 10);
  if (!months || months <= 0) { showToast('보존 기간을 먼저 설정하고 저장해주세요. (무기한은 파기 대상 없음)', 'warning'); return; }
  if (!confirm('보존 기간(' + months + '개월)이 지난 상담의 원문·녹음 파일을 파기합니다.\n\n⚠️ 이 작업은 되돌릴 수 없습니다.\n(AI 요약·금액 등 통계 데이터는 유지됩니다)\n\n계속하시겠습니까?')) return;
  purgeNowBtn.disabled = true;
  purgeNowBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1.5"></i>파기 중...';
  try {
    var res = await fetch('/api/privacy/purge', { method: 'POST' });
    var data = await res.json();
    if (data.success) { showToast('원문 ' + (data.data.purged_count || 0) + '건이 파기되었습니다.', 'success'); loadPrivacyPolicy(); }
    else showToast(data.error || '파기에 실패했습니다.', 'error');
  } catch (e) { showToast('오류가 발생했습니다.', 'error'); }
  finally { purgeNowBtn.disabled = false; purgeNowBtn.innerHTML = '<i class="fas fa-eraser mr-1.5"></i>지금 파기 실행'; }
});

var loadAuditBtn = document.getElementById('loadAuditBtn');
if (loadAuditBtn) loadAuditBtn.addEventListener('click', async function() {
  var listEl = document.getElementById('auditLogList');
  listEl.innerHTML = '<div class="shimmer h-10 rounded-lg w-full"></div>';
  try {
    var res = await fetch('/api/privacy/audit-logs?limit=50');
    var data = await res.json();
    if (!data.success) { listEl.innerHTML = '<p class="text-xs text-surface-500 text-center py-2">조회에 실패했습니다</p>'; return; }
    if (!data.data.length) { listEl.innerHTML = '<p class="text-xs text-surface-500 text-center py-2">기록이 없습니다</p>'; return; }
    var actionMap = {
      transcript_view: { label: '원문 열람', icon: 'fa-eye', color: 'text-sky-600 bg-sky-50' },
      transcript_search: { label: '원문 검색', icon: 'fa-magnifying-glass', color: 'text-indigo-600 bg-indigo-50' },
      patient_erase: { label: '환자 삭제', icon: 'fa-user-xmark', color: 'text-rose-600 bg-rose-50' },
      retention_purge: { label: '보존기간 파기', icon: 'fa-eraser', color: 'text-amber-600 bg-amber-50' },
      consent_recorded: { label: '녹음 동의', icon: 'fa-file-signature', color: 'text-emerald-600 bg-emerald-50' },
      audio_play: { label: '녹음 재생', icon: 'fa-play', color: 'text-purple-600 bg-purple-50' }
    };
    var html = '';
    data.data.forEach(function(log) {
      var a = actionMap[log.action] || { label: log.action, icon: 'fa-circle-info', color: 'text-surface-600 bg-surface-100' };
      var detail = '';
      try {
        var d = JSON.parse(log.details || '{}');
        if (d.keyword) detail = '"' + esc(d.keyword) + '"';
        else if (d.patient_name) detail = esc(d.patient_name);
        else if (d.purged_count !== undefined) detail = d.purged_count + '건';
      } catch (e) {}
      var t = (log.created_at || '').replace('T', ' ').slice(5, 16);
      html += '<div class="flex items-center gap-2 p-2 bg-surface-50 rounded-lg text-[11px]">';
      html += '<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-semibold ' + a.color + ' shrink-0"><i class="fas ' + a.icon + ' text-[9px]"></i>' + a.label + '</span>';
      html += '<span class="text-surface-700 font-medium truncate flex-1">' + esc(log.user_name || '-') + (detail ? ' · ' + detail : '') + '</span>';
      html += '<span class="text-surface-400 shrink-0">' + t + '</span>';
      html += '</div>';
    });
    listEl.innerHTML = html;
  } catch (e) { listEl.innerHTML = '<p class="text-xs text-surface-500 text-center py-2">오류가 발생했습니다</p>'; }
});

// ============================================
// v8.7.1: 도입 문의(리드) 관리 (admin 전용)
// ============================================
var LEAD_STATUS = {
  'new':       { label: '신규',   cls: 'bg-rose-50 text-rose-600' },
  'contacted': { label: '연락함', cls: 'bg-sky-50 text-sky-600' },
  'demo':      { label: '데모',   cls: 'bg-indigo-50 text-indigo-600' },
  'won':       { label: '계약',   cls: 'bg-emerald-50 text-emerald-600' },
  'lost':      { label: '이탈',   cls: 'bg-surface-100 text-surface-500' }
};
var PLAN_LABEL = { starter: 'Starter', growth: 'Growth', enterprise: 'Enterprise' };

async function loadLeads() {
  var listEl = document.getElementById('leadsList');
  if (!listEl) return;
  var status = document.getElementById('leadsStatusFilter') ? document.getElementById('leadsStatusFilter').value : '';
  listEl.innerHTML = '<div class="shimmer h-12 rounded-lg w-full"></div>';
  try {
    var res = await fetch('/api/leads?limit=30' + (status ? '&status=' + status : ''));
    if (!res.ok) { listEl.innerHTML = '<p class="text-xs text-surface-400 text-center py-3">조회 권한이 없습니다</p>'; return; }
    var data = await res.json();
    var rows = data.data || [];

    // 신규 배지
    try {
      var newRes = await fetch('/api/leads?status=new&limit=100');
      var newData = await newRes.json();
      var badge = document.getElementById('leadsNewBadge');
      var newCount = (newData.data || []).length;
      if (badge) {
        if (newCount > 0) { badge.textContent = newCount; badge.classList.remove('hidden'); }
        else badge.classList.add('hidden');
      }
    } catch (e) {}

    if (rows.length === 0) { listEl.innerHTML = '<p class="text-xs text-surface-400 text-center py-3">해당 상태의 문의가 없습니다</p>'; return; }

    var html = '';
    rows.forEach(function (l) {
      var st = LEAD_STATUS[l.status] || LEAD_STATUS['new'];
      var t = (l.created_at || '').slice(5, 16);
      var src = (l.source || '').split('|')[0];
      html += '<div class="p-3 bg-surface-50 rounded-xl">' +
        '<div class="flex items-center justify-between gap-2 mb-1.5">' +
          '<div class="flex items-center gap-2 min-w-0">' +
            '<span class="font-bold text-xs text-surface-900 truncate">' + esc(l.clinic_name) + '</span>' +
            '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded ' + st.cls + ' shrink-0">' + st.label + '</span>' +
            '<span class="text-[10px] font-semibold text-brand-600 shrink-0">' + (PLAN_LABEL[l.plan_interest] || '') + '</span>' +
          '</div>' +
          '<span class="text-[10px] text-surface-400 shrink-0">' + t + '</span>' +
        '</div>' +
        '<div class="flex items-center justify-between gap-2">' +
          '<p class="text-[11px] text-surface-600 truncate">' + esc(l.contact_name) + ' · <a href="tel:' + esc(l.phone) + '" class="text-brand-600 font-semibold">' + esc(l.phone) + '</a>' + (l.monthly_consultations ? ' · 월 ' + esc(l.monthly_consultations) + '건' : '') + '</p>' +
          '<select data-lead-id="' + l.id + '" class="lead-status-select text-[10px] font-semibold px-1.5 py-1 bg-white border border-surface-200 rounded-lg outline-none shrink-0">' +
            Object.keys(LEAD_STATUS).map(function (k) { return '<option value="' + k + '"' + (k === l.status ? ' selected' : '') + '>' + LEAD_STATUS[k].label + '</option>'; }).join('') +
          '</select>' +
        '</div>' +
        (l.message ? '<p class="text-[11px] text-surface-500 mt-1.5 line-clamp-2">' + esc(l.message) + '</p>' : '') +
      '</div>';
    });
    listEl.innerHTML = html;

    listEl.querySelectorAll('.lead-status-select').forEach(function (sel) {
      sel.addEventListener('change', async function () {
        var id = sel.getAttribute('data-lead-id');
        try {
          var r = await fetch('/api/leads/' + id + '/status', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: sel.value })
          });
          if (r.ok) { showToast('상태가 변경되었습니다', 'success'); loadLeads(); }
          else showToast('변경 실패', 'error');
        } catch (e) { showToast('네트워크 오류', 'error'); }
      });
    });
  } catch (e) {
    listEl.innerHTML = '<p class="text-xs text-surface-400 text-center py-3">조회 중 오류가 발생했습니다</p>';
  }
}

document.getElementById('loadLeadsBtn') && document.getElementById('loadLeadsBtn').addEventListener('click', loadLeads);
document.getElementById('leadsStatusFilter') && document.getElementById('leadsStatusFilter').addEventListener('change', loadLeads);

loadSettings();
loadTeam();
