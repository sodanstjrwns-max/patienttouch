import { FC } from 'hono/jsx'

export const ChurnPredictionPage: FC = () => {
  return (
    <div class="min-h-screen bg-gradient-to-b from-surface-50 to-white pb-24">
      {/* Header */}
      <header class="bg-white/80 backdrop-blur-xl border-b border-surface-100 sticky top-0 z-20">
        <div class="flex items-center justify-between px-4 py-3 safe-area-top">
          <a href="/retention" class="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center text-surface-500" aria-label="뒤로가기">
            <i class="fas fa-chevron-left text-sm"></i>
          </a>
          <div class="text-center">
            <h1 class="text-sm font-bold text-surface-900">AI 이탈 예측</h1>
            <p class="text-[10px] text-surface-400">필요한 진료를 받지 못하는 환자가 없도록</p>
          </div>
          <button id="runBatch" class="px-3 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm">
            <i class="fas fa-bolt text-[10px]"></i>
            <span>예측 실행</span>
          </button>
        </div>
      </header>

      <main class="px-4 py-5 max-w-5xl mx-auto">
        {/* Loading */}
        <div id="loadingState" class="hidden flex-col items-center justify-center py-20 gap-3">
          <i class="fas fa-brain text-3xl text-brand-400 animate-pulse"></i>
          <p class="text-sm text-surface-400">AI가 환자 데이터를 분석하고 있어요...</p>
          <p class="text-[11px] text-surface-300">최대 30초 소요</p>
        </div>

        {/* Hero — 살릴 수 있는 매출 */}
        <section id="rescueHero" class="hidden mb-4">
          <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 via-orange-500 to-amber-500 p-5 text-white shadow-lg shadow-rose-500/20">
            <div class="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
            <div class="relative">
              <div class="flex items-center gap-2 mb-1">
                <i class="fas fa-shield-heart text-amber-200 text-sm"></i>
                <span class="text-[11px] font-semibold tracking-wide text-white/90">지금 액션하면 살릴 수 있는 매출</span>
              </div>
              <p class="text-xs text-white/80 mb-3">고위험군 환자의 미수납 치료비 합계</p>
              <p class="text-4xl font-extrabold leading-tight tracking-tight">
                <span id="rescueAmount">0</span><span class="text-lg font-bold ml-1">만원</span>
              </p>
              <div class="mt-3 pt-3 border-t border-white/20 grid grid-cols-3 gap-3 text-[11px]">
                <div>
                  <p class="text-white/70">고위험군</p>
                  <p class="font-bold text-base"><span id="rescueCount">0</span>명</p>
                </div>
                <div>
                  <p class="text-white/70">평균 이탈확률</p>
                  <p class="font-bold text-base"><span id="rescueAvg">0</span>%</p>
                </div>
                <div>
                  <p class="text-white/70">예상 이탈시점</p>
                  <p class="font-bold text-base"><span id="rescueWindow">-</span></p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Summary cards */}
        <section id="summaryCards" class="hidden grid grid-cols-4 gap-2 mb-4"></section>

        {/* Filter tabs */}
        <div id="filterTabs" class="hidden flex gap-1 mb-3 overflow-x-auto">
          <button data-filter="all" class="filter-tab px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-900 text-white whitespace-nowrap">전체</button>
          <button data-filter="critical" class="filter-tab px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-surface-200 text-surface-700 whitespace-nowrap">🔴 즉시</button>
          <button data-filter="high" class="filter-tab px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-surface-200 text-surface-700 whitespace-nowrap">🟠 7일내</button>
          <button data-filter="medium" class="filter-tab px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-surface-200 text-surface-700 whitespace-nowrap">🟡 모니터링</button>
        </div>

        {/* Prediction list */}
        <section id="predictionList" class="hidden space-y-2.5"></section>

        {/* Empty state */}
        <div id="emptyState" class="hidden flex-col items-center justify-center py-20 gap-3">
          <i class="fas fa-brain text-3xl text-surface-300"></i>
          <p class="text-sm text-surface-500">아직 예측 데이터가 없습니다</p>
          <p class="text-xs text-surface-400">우측 상단 "예측 실행" 버튼을 눌러 분석을 시작하세요</p>
        </div>

        {/* AI Model Info */}
        <section class="mt-6 p-3 rounded-xl bg-surface-50 border border-surface-100">
          <p class="text-[10px] text-surface-500 leading-relaxed">
            <i class="fas fa-info-circle text-surface-400 mr-1"></i>
            <strong>예측 방식:</strong> 마지막 방문 / 잔여 치료비 / 치료 완료율 / 연락 응답률을 종합 분석.
            점수 30+ 환자는 OpenAI(gpt-5-mini) 정밀 분석, 30 미만은 규칙 기반 빠른 분류.
            예측 결과에 실제 결과를 피드백하면 정확도가 개선됩니다.
          </p>
        </section>
      </main>

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
          <a href="/retention" class="flex flex-col items-center gap-0.5 px-3 py-1 text-brand-600">
            <i class="fas fa-heart-pulse text-lg"></i>
            <span class="text-[9px] font-semibold">리텐션</span>
          </a>
          <a href="/patients" class="flex flex-col items-center gap-0.5 px-3 py-1 text-surface-400">
            <i class="fas fa-users text-lg"></i>
            <span class="text-[9px]">환자</span>
          </a>
        </div>
      </nav>

      <script src="/static/pages/churn-prediction.js"></script>
    </div>
  )
}
