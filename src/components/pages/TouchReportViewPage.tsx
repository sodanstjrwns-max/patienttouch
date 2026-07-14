import { FC } from 'hono/jsx'

// ============================================
// 터치 리포트 — 환자용 보고서 페이지 (/r/:token)
// 독자: 환자 본인 + 가족. 카톡 인앱 브라우저 기준.
// 다크 커버 + 밝은 본문. 정적 렌더 + 최소 JS.
// ============================================

export const TouchReportViewPage: FC<{ token: string }> = ({ token }) => {
  return (
    <div id="tr-root" data-token={token} class="min-h-screen bg-white" style="font-size:16px;">
      {/* 로딩 */}
      <div id="tr-loading" class="min-h-screen flex flex-col items-center justify-center bg-gradient-dark px-8">
        <div class="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-5 animate-pulse">
          <i class="fas fa-file-medical text-white/70 text-xl"></i>
        </div>
        <p class="text-white/60 text-sm">보고서를 불러오는 중...</p>
      </div>

      {/* 간단 인증 게이트 */}
      <div id="tr-auth" class="hidden min-h-screen flex-col items-center justify-center bg-gradient-dark px-8">
        <div class="w-full max-w-sm text-center">
          <div class="w-16 h-16 mx-auto rounded-2xl bg-white/10 flex items-center justify-center mb-6">
            <i class="fas fa-lock text-white/80 text-xl"></i>
          </div>
          <h1 id="tr-auth-clinic" class="text-white text-lg font-bold mb-2">상담 보고서</h1>
          <p class="text-white/50 text-sm mb-8 leading-relaxed">본인 확인을 위해<br />생년월일 뒤 4자리를 입력해주세요</p>
          <input id="tr-auth-input" type="tel" maxlength={4} inputmode="numeric" placeholder="예: 0815"
            class="w-full text-center text-2xl tracking-[0.5em] font-bold py-4 rounded-2xl bg-white/10 border border-white/15 text-white placeholder-white/25 outline-none focus:border-white/40" />
          <p id="tr-auth-error" class="hidden text-rose-300 text-xs mt-3"></p>
          <button id="tr-auth-btn" class="w-full mt-6 py-4 rounded-2xl bg-white text-surface-900 font-bold text-base active:scale-[0.98] transition-transform">확인</button>
        </div>
      </div>

      {/* 본문 (JS 렌더) */}
      <div id="tr-report" class="hidden"></div>

      {/* 오류 */}
      <div id="tr-error" class="hidden min-h-screen flex-col items-center justify-center px-8 text-center">
        <div class="text-5xl mb-4">📄</div>
        <h1 class="text-lg font-bold text-surface-800 mb-2">보고서를 열 수 없습니다</h1>
        <p id="tr-error-msg" class="text-surface-500 text-sm leading-relaxed">잠시 후 다시 시도하시거나 병원에 문의해주세요.</p>
      </div>

      <script src="/static/pages/touch-report-view.js" defer></script>
    </div>
  )
}
