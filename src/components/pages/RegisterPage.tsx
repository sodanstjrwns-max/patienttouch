import { FC } from 'hono/jsx'

export const RegisterPage: FC = () => {
  return (
    <div class="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex flex-col justify-center px-6 py-12">
      <div class="mx-auto w-full max-w-sm">
        {/* Logo */}
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <i class="fas fa-hand-holding-medical text-3xl text-primary-600"></i>
          </div>
          <h1 class="text-2xl font-bold text-white">페이션트 터치</h1>
          <p class="text-primary-200 text-sm mt-1">AI 기반 상담 CRM</p>
        </div>

        {/* Register Form */}
        <div class="bg-white rounded-2xl shadow-xl p-6">
          <h2 class="text-xl font-semibold text-gray-900 text-center mb-6">회원가입</h2>
          
          <form id="registerForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">병원명</label>
              <input 
                type="text" 
                id="organizationName"
                name="organization_name"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder="OO치과의원"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">담당자 이름</label>
              <input 
                type="text" 
                id="name"
                name="name"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder="홍길동"
              />
            </div>
            
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
                minlength="6"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder="6자 이상 입력"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">연락처 (선택)</label>
              <input 
                type="tel" 
                id="phone"
                name="phone"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder="010-0000-0000"
              />
            </div>

            <div id="errorMessage" class="hidden text-red-600 text-sm text-center"></div>

            <button 
              type="submit"
              class="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition"
            >
              회원가입
            </button>
          </form>

          <div class="mt-6 text-center">
            <p class="text-gray-600 text-sm">
              이미 계정이 있으신가요?{' '}
              <a href="/login" class="text-primary-600 hover:text-primary-700 font-medium">
                로그인
              </a>
            </p>
          </div>
        </div>

        <p class="text-center text-primary-200 text-xs mt-6">
          가입 시 30일 무료 체험이 시작됩니다
        </p>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const errorEl = document.getElementById('errorMessage');
            
            const data = {
              organization_name: document.getElementById('organizationName').value,
              name: document.getElementById('name').value,
              email: document.getElementById('email').value,
              password: document.getElementById('password').value,
              phone: document.getElementById('phone').value || undefined
            };
            
            try {
              const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });
              
              const result = await res.json();
              
              if (result.success) {
                window.location.href = '/';
              } else {
                errorEl.textContent = result.error || '회원가입에 실패했습니다.';
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
