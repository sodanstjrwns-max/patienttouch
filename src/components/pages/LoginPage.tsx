import { FC } from 'hono/jsx'

export const LoginPage: FC = () => {
  return (
    <div class="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex flex-col justify-center px-6 py-12">
      <div class="mx-auto w-full max-w-sm">
        {/* Logo */}
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <i class="fas fa-hand-holding-medical text-3xl text-primary-600"></i>
          </div>
          <h1 class="text-2xl font-bold text-white">페이션트 터치</h1>
          <p class="text-primary-200 text-sm mt-1">찾는 건 기계가, 연락은 사람이</p>
        </div>

        {/* Login Form */}
        <div class="bg-white rounded-2xl shadow-xl p-6">
          <h2 class="text-xl font-semibold text-gray-900 text-center mb-6">로그인</h2>
          
          <form id="loginForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input 
                type="email" 
                id="email"
                name="email"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder="email@example.com"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <input 
                type="password" 
                id="password"
                name="password"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder="••••••••"
              />
            </div>

            <div id="errorMessage" class="hidden text-red-600 text-sm text-center"></div>

            <button 
              type="submit"
              class="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition"
            >
              로그인
            </button>
          </form>

          <div class="mt-6 text-center">
            <p class="text-gray-600 text-sm">
              계정이 없으신가요?{' '}
              <a href="/register" class="text-primary-600 hover:text-primary-700 font-medium">
                회원가입
              </a>
            </p>
          </div>

          {/* Demo Account */}
          <div class="mt-6 pt-6 border-t border-gray-200">
            <p class="text-xs text-gray-500 text-center mb-3">데모 계정으로 체험하기</p>
            <button 
              type="button"
              id="demoLoginBtn"
              class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition text-sm"
            >
              <i class="fas fa-play-circle mr-2"></i>
              데모 계정으로 로그인
            </button>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorEl = document.getElementById('errorMessage');
            
            try {
              const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
              });
              
              const data = await res.json();
              
              if (data.success) {
                window.location.href = '/';
              } else {
                errorEl.textContent = data.error || '로그인에 실패했습니다.';
                errorEl.classList.remove('hidden');
              }
            } catch (err) {
              errorEl.textContent = '서버 오류가 발생했습니다.';
              errorEl.classList.remove('hidden');
            }
          });

          document.getElementById('demoLoginBtn').addEventListener('click', async () => {
            const errorEl = document.getElementById('errorMessage');
            try {
              const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'kim@bddental.com', password: 'test1234' })
              });
              
              const data = await res.json();
              
              if (data.success) {
                window.location.href = '/';
              } else {
                errorEl.textContent = '데모 계정 로그인에 실패했습니다. 데이터베이스를 확인해주세요.';
                errorEl.classList.remove('hidden');
              }
            } catch (err) {
              errorEl.textContent = '서버 오류가 발생했습니다.';
              errorEl.classList.remove('hidden');
            }
          });
        `
      }} />
    </div>
  )
}
