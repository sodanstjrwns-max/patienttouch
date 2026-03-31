import { FC } from 'hono/jsx'

export const GrowthPage: FC = () => {
  return (
    <div class="min-h-screen bg-gradient-to-b from-surface-50 to-white pb-24">
      {/* Header */}
      <header class="bg-white/80 backdrop-blur-xl border-b border-surface-100 sticky top-0 z-20">
        <div class="flex items-center justify-between px-4 py-3 safe-area-top">
          <a href="/" class="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center text-surface-500 hover:bg-surface-200 transition-all">
            <i class="fas fa-chevron-left text-sm"></i>
          </a>
          <div class="text-center">
            <h1 class="text-sm font-bold text-surface-900">상담 성장 추적</h1>
            <p class="text-[10px] text-surface-400">내 상담 실력의 변화를 확인하세요</p>
          </div>
          <div class="w-9" />
        </div>
      </header>

      {/* Main Content */}
      <div id="growthContent" class="px-4 py-5 max-w-lg mx-auto">
        {/* Loading */}
        <div id="growthLoading" class="flex flex-col items-center justify-center py-20 gap-3">
          <i class="fas fa-chart-line text-3xl text-brand-400 animate-pulse"></i>
          <p class="text-sm text-surface-400">성장 데이터를 불러오는 중...</p>
        </div>
      </div>

      {/* Bottom nav */}
      <nav class="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-surface-100 safe-area-bottom z-30">
        <div class="flex items-center justify-around max-w-lg mx-auto py-2">
          <a href="/" class="flex flex-col items-center gap-0.5 px-3 py-1 text-surface-400">
            <i class="fas fa-home text-lg"></i>
            <span class="text-[9px]">홈</span>
          </a>
          <a href="/consultations" class="flex flex-col items-center gap-0.5 px-3 py-1 text-surface-400">
            <i class="fas fa-comments text-lg"></i>
            <span class="text-[9px]">상담</span>
          </a>
          <a href="/recording" class="flex flex-col items-center gap-0.5 px-3 py-1 text-surface-400">
            <div class="w-10 h-10 -mt-4 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/30 flex items-center justify-center">
              <i class="fas fa-microphone text-white text-sm"></i>
            </div>
          </a>
          <a href="/growth" class="flex flex-col items-center gap-0.5 px-3 py-1 text-brand-600">
            <i class="fas fa-chart-line text-lg"></i>
            <span class="text-[9px] font-semibold">성장</span>
          </a>
          <a href="/patients" class="flex flex-col items-center gap-0.5 px-3 py-1 text-surface-400">
            <i class="fas fa-users text-lg"></i>
            <span class="text-[9px]">환자</span>
          </a>
        </div>
      </nav>

      <script src="/static/level-system.js"></script>
      <script src="/static/pages/growth.js"></script>
    </div>
  )
}
