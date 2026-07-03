// Patient Touch — Welcome landing page (v8.7)
// 파운더 50 카운터 + 리드폼 제출

// ===== Founder 50 counter =====
(async function loadFounderCount() {
  try {
    const res = await fetch('/api/leads/founder-count');
    if (!res.ok) return;
    const json = await res.json();
    const data = json.data || json;
    const remaining = Math.max(0, data.remaining ?? 0);

    const counter = document.getElementById('founderCounter');
    if (counter) {
      if (remaining > 0) {
        counter.innerHTML = '<i class="fas fa-bolt mr-1"></i>잔여 슬롯 <strong>' + remaining + '개</strong> / 50개';
      } else {
        counter.innerHTML = '<i class="fas fa-circle-xmark mr-1"></i>파운더 50 마감 — 정가 적용';
      }
    }
    const badge = document.getElementById('founderCountBadge');
    if (badge && remaining > 0) {
      badge.textContent = '(잔여 ' + remaining + ')';
    }
  } catch (e) {
    const counter = document.getElementById('founderCounter');
    if (counter) counter.innerHTML = '잔여 슬롯 확인 불가';
  }
})();

// ===== Pricing plan buttons → prefill + scroll to form =====
document.querySelectorAll('.plan-select-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    const plan = btn.getAttribute('data-plan');
    const select = document.getElementById('planInterest');
    if (select && plan) select.value = plan;
    const section = document.getElementById('lead-section');
    if (section) section.scrollIntoView({ behavior: 'smooth' });
    setTimeout(function () {
      document.getElementById('clinicName')?.focus();
    }, 600);
  });
});

// ===== Lead form submit =====
(function () {
  const form = document.getElementById('leadForm');
  if (!form) return;

  const errorBox = document.getElementById('leadError');
  const errorText = document.getElementById('leadErrorText');
  const btn = document.getElementById('leadSubmitBtn');
  const btnText = document.getElementById('leadBtnText');
  const btnLoading = document.getElementById('leadBtnLoading');

  function showError(msg) {
    if (errorText) errorText.textContent = msg;
    errorBox?.classList.remove('hidden');
  }
  function hideError() {
    errorBox?.classList.add('hidden');
  }
  function setLoading(on) {
    if (btn) btn.disabled = on;
    btnText?.classList.toggle('hidden', on);
    btnLoading?.classList.toggle('hidden', !on);
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideError();

    const payload = {
      website: document.getElementById('leadWebsite')?.value || '',  // honeypot
      clinic_name: document.getElementById('clinicName')?.value.trim() || '',
      contact_name: document.getElementById('contactName')?.value.trim() || '',
      phone: document.getElementById('leadPhone')?.value.trim() || '',
      email: document.getElementById('leadEmail')?.value.trim() || '',
      plan_interest: document.getElementById('planInterest')?.value || 'growth',
      monthly_consultations: document.getElementById('monthlyConsultations')?.value || '',
      message: document.getElementById('leadMessage')?.value.trim() || '',
      source: 'landing'
    };

    // Client-side validation
    if (payload.clinic_name.length < 2) return showError('병원명을 2자 이상 입력해주세요.');
    if (payload.contact_name.length < 2) return showError('담당자 성함을 입력해주세요.');
    if (!/^[\d\-+() ]{9,20}$/.test(payload.phone)) return showError('연락처 형식을 확인해주세요. (예: 010-0000-0000)');
    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return showError('이메일 형식을 확인해주세요.');

    setLoading(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(function () { return {}; });

      if (res.status === 409) {
        showError(data.error || '이미 접수된 연락처입니다. 곧 연락드리겠습니다!');
        setLoading(false);
        return;
      }
      if (!res.ok) {
        showError(data.error || '전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
        setLoading(false);
        return;
      }

      // Success — swap form for success panel
      form.classList.add('hidden');
      document.getElementById('leadSuccess')?.classList.remove('hidden');
      document.getElementById('lead-section')?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      showError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      setLoading(false);
    }
  });
})();
