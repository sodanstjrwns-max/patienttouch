document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('regError');
  const btnText = document.getElementById('regBtnText');
  const btnLoading = document.getElementById('regBtnLoading');
  const btn = document.getElementById('regBtn');
  
  errorEl.classList.add('hidden');
  btnText.classList.add('hidden');
  btnLoading.classList.remove('hidden');
  btn.disabled = true;
  
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_name: document.getElementById('orgName').value,
        name: document.getElementById('regName').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        phone: document.getElementById('regPhone').value || undefined
      })
    });
    const data = await res.json();
    
    if (data.success) {
      btn.innerHTML = '<i class="fas fa-check mr-2"></i>가입 완료!';
      btn.classList.remove('bg-gradient-brand');
      btn.classList.add('bg-emerald-600');
      setTimeout(() => { window.location.href = '/'; }, 600);
    } else {
      errorEl.textContent = data.error || '회원가입에 실패했습니다.';
      errorEl.classList.remove('hidden');
      btnText.classList.remove('hidden');
      btnLoading.classList.add('hidden');
      btn.disabled = false;
    }
  } catch (err) {
    errorEl.textContent = '서버 오류가 발생했습니다.';
    errorEl.classList.remove('hidden');
    btnText.classList.remove('hidden');
    btnLoading.classList.add('hidden');
    btn.disabled = false;
  }
});
