import { FC } from 'hono/jsx'

export const LoginPage: FC = () => {
  return (
    <div class="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div class="absolute inset-0 bg-gradient-dark">
        {/* Mesh grid */}
        <div class="absolute inset-0 opacity-30" style="background-image: url(&quot;data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(99,102,241,0.08)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E&quot;)" />
        {/* Gradient orbs */}
        <div class="absolute top-20 -left-32 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl animate-float" />
        <div class="absolute bottom-20 -right-32 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl animate-float" style="animation-delay: -3s" />
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-3xl" />
      </div>

      <div class="relative z-10 flex flex-col justify-center min-h-screen px-6 py-12">
        <div class="mx-auto w-full max-w-sm">
          {/* Logo & Brand */}
          <div class="text-center mb-10 animate-fade-in">
            {/* Logo */}
            <div class="relative inline-flex mb-6">
              <div class="w-20 h-20 rounded-3xl bg-gradient-brand flex items-center justify-center shadow-xl shadow-brand-600/30 animate-bounce-in">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" class="text-white">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" opacity="0.9"/>
                  <path d="M8 11h8M12 8v6" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
                </svg>
              </div>
              {/* Glow ring */}
              <div class="absolute inset-0 rounded-3xl animate-glow-pulse opacity-50" />
            </div>
            
            <h1 class="text-3xl font-black text-white tracking-tight mb-2">
              Patient <span class="text-gradient">Touch</span>
            </h1>
            <p class="text-surface-400 text-sm font-medium tracking-wide">
              찾는 건 기계가, 연락은 사람이
            </p>
          </div>

          {/* Login Card */}
          <div class="glass-dark rounded-3xl p-7 shadow-2xl animate-slide-up" style="animation-delay: 0.1s">
            <div class="mb-7">
              <h2 class="text-xl font-bold text-white">로그인</h2>
              <p class="text-surface-400 text-sm mt-1">시작하려면 계정에 로그인하세요</p>
            </div>
            
            <form id="loginForm" class="space-y-5">
              {/* Email */}
              <div class="group">
                <label class="block text-xs font-semibold text-surface-400 mb-2 tracking-wide uppercase">이메일</label>
                <div class="relative">
                  <div class="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500 group-focus-within:text-brand-400 transition-colors">
                    <i class="fas fa-envelope text-sm"></i>
                  </div>
                  <input 
                    type="email" 
                    id="email"
                    name="email"
                    required
                    class="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-surface-500 outline-none transition-all duration-300 focus:border-brand-500/50 focus:bg-white/8 focus:ring-2 focus:ring-brand-500/20"
                    placeholder="email@example.com"
                    autocomplete="email"
                  />
                </div>
              </div>
              
              {/* Password */}
              <div class="group">
                <label class="block text-xs font-semibold text-surface-400 mb-2 tracking-wide uppercase">비밀번호</label>
                <div class="relative">
                  <div class="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500 group-focus-within:text-brand-400 transition-colors">
                    <i class="fas fa-lock text-sm"></i>
                  </div>
                  <input 
                    type="password" 
                    id="password"
                    name="password"
                    required
                    class="w-full pl-11 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-surface-500 outline-none transition-all duration-300 focus:border-brand-500/50 focus:bg-white/8 focus:ring-2 focus:ring-brand-500/20"
                    placeholder="비밀번호 입력"
                    autocomplete="current-password"
                  />
                  <button type="button" id="togglePw" class="absolute right-4 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors">
                    <i class="fas fa-eye text-sm"></i>
                  </button>
                </div>
              </div>

              {/* Error */}
              <div id="errorMessage" class="hidden text-rose-400 text-sm text-center py-2 px-4 bg-rose-500/10 rounded-xl border border-rose-500/20">
                <i class="fas fa-circle-exclamation mr-1.5"></i>
                <span id="errorText"></span>
              </div>

              {/* Submit */}
              <button 
                type="submit"
                id="loginBtn"
                class="w-full bg-gradient-brand text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-brand-600/30 active:scale-[0.97] btn-glow relative overflow-hidden"
              >
                <span id="loginBtnText">로그인</span>
                <span id="loginBtnLoading" class="hidden">
                  <i class="fas fa-circle-notch fa-spin mr-2"></i>로그인 중...
                </span>
              </button>
            </form>

            {/* Signup link */}
            <div class="mt-6 text-center">
              <p class="text-surface-500 text-sm">
                계정이 없으신가요?{' '}
                <a href="/register" class="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
                  무료로 시작하기
                </a>
              </p>
            </div>
          </div>

          {/* Social & Demo Section */}
          <div class="mt-6 animate-slide-up" style="animation-delay: 0.2s">
            <div class="flex items-center gap-3 mb-4">
              <div class="flex-1 h-px bg-white/10" />
              <span class="text-xs font-medium text-surface-500 uppercase tracking-wider">또는</span>
              <div class="flex-1 h-px bg-white/10" />
            </div>
            
            {/* Google Login Button */}
            <a 
              href="/api/auth/google"
              id="googleLoginBtn"
              class="w-full py-3.5 px-4 rounded-xl border border-white/10 hover:border-white/25 bg-white/5 hover:bg-white/10 text-white font-semibold transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.97] mb-3"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google로 시작하기
            </a>

            <button 
              type="button"
              id="demoLoginBtn"
              class="w-full py-3.5 px-4 rounded-xl border border-white/10 hover:border-brand-500/30 bg-white/5 hover:bg-brand-500/10 text-surface-300 hover:text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2.5 active:scale-[0.97]"
            >
              <div class="w-6 h-6 rounded-lg bg-brand-500/20 flex items-center justify-center">
                <i class="fas fa-play text-[10px] text-brand-400"></i>
              </div>
              데모 계정으로 체험하기
            </button>
            
            <p class="text-center text-xs text-surface-600 mt-3">
              서울BD치과 관리자 계정으로 모든 기능을 체험할 수 있습니다
            </p>
          </div>

          {/* Footer */}
          <div class="mt-10 text-center animate-fade-in" style="animation-delay: 0.3s">
            <p class="text-surface-600 text-xs">
              <i class="fas fa-shield-halved mr-1"></i>
              Patient Touch v2.0 &mdash; 페이션트퍼널
            </p>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
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
        `
      }} />
    </div>
  )
}
