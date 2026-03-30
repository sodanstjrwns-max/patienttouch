// Check for Google OAuth error in URL
(function() {
  const params = new URLSearchParams(window.location.search);
  const err = params.get('error');
  if (err) {
    const errorEl = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const messages = {
      'google_denied': 'Google 로그인이 취소되었습니다.',
      'google_token_failed': 'Google 인증에 실패했습니다. 다시 시도해주세요.',
      'google_no_email': 'Google 계정에서 이메일을 가져올 수 없습니다.',
      'google_failed': 'Google 로그인 중 오류가 발생했습니다.',
    };
    if (errorEl && errorText) {
      errorText.textContent = messages[err] || '로그인에 실패했습니다.';
      errorEl.classList.remove('hidden');
    }
    // Clean URL
    window.history.replaceState({}, '', '/login');
  }
})();

// Toggle password visibility
document.getElementById('togglePw')?.addEventListener('click', function() {
  const pw = document.getElementById('password');
  const icon = this.querySelector('i');
  if (pw.type === 'password') {
    pw.type = 'text';
    icon.className = 'fas fa-eye-slash text-sm';
  } else {
    pw.type = 'password';
    icon.className = 'fas fa-eye text-sm';
  }
});

// Login form
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('errorMessage');
  const errorText = document.getElementById('errorText');
  const btn = document.getElementById('loginBtn');
  const btnText = document.getElementById('loginBtnText');
  const btnLoading = document.getElementById('loginBtnLoading');
  
  errorEl.classList.add('hidden');
  btnText.classList.add('hidden');
  btnLoading.classList.remove('hidden');
  btn.disabled = true;
  
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    
    if (data.success) {
      btn.innerHTML = '<i class="fas fa-check mr-2"></i>성공!';
      btn.classList.remove('bg-gradient-brand');
      btn.classList.add('bg-emerald-600');
      setTimeout(() => { window.location.href = '/'; }, 500);
    } else {
      errorText.textContent = data.error || '로그인에 실패했습니다.';
      errorEl.classList.remove('hidden');
      btnText.classList.remove('hidden');
      btnLoading.classList.add('hidden');
      btn.disabled = false;
    }
  } catch (err) {
    errorText.textContent = '서버 오류가 발생했습니다.';
    errorEl.classList.remove('hidden');
    btnText.classList.remove('hidden');
    btnLoading.classList.add('hidden');
    btn.disabled = false;
  }
});

// Demo login
document.getElementById('demoLoginBtn').addEventListener('click', async () => {
  const btn = document.getElementById('demoLoginBtn');
  btn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i>접속 중...';
  btn.disabled = true;
  
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'kim@bddental.com', password: 'test1234' })
    });
    const data = await res.json();
    
    if (data.success) {
      btn.innerHTML = '<i class="fas fa-check mr-2 text-emerald-400"></i>접속 완료!';
      setTimeout(() => { window.location.href = '/'; }, 500);
    } else {
      btn.innerHTML = '<i class="fas fa-exclamation-triangle mr-2 text-amber-400"></i>데모 계정 오류';
      setTimeout(() => {
        btn.innerHTML = '<div class="w-6 h-6 rounded-lg bg-brand-500/20 flex items-center justify-center"><i class="fas fa-play text-[10px] text-brand-400"></i></div>데모 계정으로 체험하기';
        btn.disabled = false;
      }, 2000);
    }
  } catch (err) {
    btn.innerHTML = '<i class="fas fa-exclamation-triangle mr-2 text-amber-400"></i>서버 오류';
    setTimeout(() => {
      btn.innerHTML = '<div class="w-6 h-6 rounded-lg bg-brand-500/20 flex items-center justify-center"><i class="fas fa-play text-[10px] text-brand-400"></i></div>데모 계정으로 체험하기';
      btn.disabled = false;
    }, 2000);
  }
});
