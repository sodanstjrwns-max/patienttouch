import { FC } from 'hono/jsx'

export const RegisterPage: FC = () => {
  return (
    <div class="min-h-screen relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-dark">
        <div class="absolute top-20 -right-32 w-80 h-80 bg-brand-600/15 rounded-full blur-3xl animate-float" />
        <div class="absolute bottom-40 -left-20 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl animate-float" style="animation-delay: -2s" />
      </div>

      <div class="relative z-10 flex flex-col justify-center min-h-screen px-6 py-8">
        <div class="mx-auto w-full max-w-sm">
          <div class="text-center mb-8 animate-fade-in">
            <a href="/login" class="inline-flex items-center gap-2 text-surface-400 hover:text-white text-sm font-medium mb-6 transition-colors">
              <i class="fas fa-chevron-left text-xs"></i>로그인으로 돌아가기
            </a>
            <h1 class="text-2xl font-black text-white tracking-tight">무료로 시작하기</h1>
            <p class="text-surface-400 text-sm mt-2">30일 무료 체험 &bull; 신용카드 불필요</p>
          </div>

          <div class="glass-dark rounded-3xl p-7 shadow-2xl animate-slide-up">
            <form id="registerForm" class="space-y-4">
              <div class="group">
                <label class="block text-xs font-semibold text-surface-400 mb-2 uppercase tracking-wide">병원명</label>
                <div class="relative">
                  <div class="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500"><i class="fas fa-hospital text-sm"></i></div>
                  <input type="text" id="orgName" required class="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-surface-500 outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all" placeholder="서울비디치과" />
                </div>
              </div>
              <div class="group">
                <label class="block text-xs font-semibold text-surface-400 mb-2 uppercase tracking-wide">이름</label>
                <div class="relative">
                  <div class="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500"><i class="fas fa-user text-sm"></i></div>
                  <input type="text" id="regName" required class="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-surface-500 outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all" placeholder="홍길동" />
                </div>
              </div>
              <div class="group">
                <label class="block text-xs font-semibold text-surface-400 mb-2 uppercase tracking-wide">이메일</label>
                <div class="relative">
                  <div class="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500"><i class="fas fa-envelope text-sm"></i></div>
                  <input type="email" id="regEmail" required class="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-surface-500 outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all" placeholder="email@clinic.com" />
                </div>
              </div>
              <div class="group">
                <label class="block text-xs font-semibold text-surface-400 mb-2 uppercase tracking-wide">비밀번호</label>
                <div class="relative">
                  <div class="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500"><i class="fas fa-lock text-sm"></i></div>
                  <input type="password" id="regPassword" required minlength="6" class="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-surface-500 outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all" placeholder="6자리 이상" />
                </div>
              </div>
              <div class="group">
                <label class="block text-xs font-semibold text-surface-400 mb-2 uppercase tracking-wide">연락처 <span class="text-surface-600">(선택)</span></label>
                <div class="relative">
                  <div class="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500"><i class="fas fa-phone text-sm"></i></div>
                  <input type="tel" id="regPhone" class="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-surface-500 outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all" placeholder="010-0000-0000" />
                </div>
              </div>

              <div id="regError" class="hidden text-rose-400 text-sm text-center py-2 px-4 bg-rose-500/10 rounded-xl border border-rose-500/20"></div>

              <button type="submit" id="regBtn" class="w-full bg-gradient-brand text-white font-bold py-3.5 px-4 rounded-xl transition-all hover:shadow-lg hover:shadow-brand-600/30 active:scale-[0.97] btn-glow mt-2">
                <span id="regBtnText">30일 무료 시작</span>
                <span id="regBtnLoading" class="hidden"><i class="fas fa-circle-notch fa-spin mr-2"></i>생성 중...</span>
              </button>
            </form>

            <p class="text-xs text-surface-500 text-center mt-4 leading-relaxed">
              가입 시 <span class="text-surface-400">이용약관</span> 및 <span class="text-surface-400">개인정보 처리방침</span>에 동의합니다
            </p>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
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
        `
      }} />
    </div>
  )
}
