import { FC } from 'hono/jsx'

export const ReferralNetworkPage: FC = () => {
  return (
    <div class="min-h-screen bg-gradient-to-b from-surface-50 to-white pb-24">
      {/* Header */}
      <header class="bg-white/80 backdrop-blur-xl border-b border-surface-100 sticky top-0 z-20">
        <div class="flex items-center justify-between px-4 py-3 safe-area-top">
          <a href="/admin" class="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center text-surface-500 hover:bg-surface-200 transition-all" aria-label="뒤로가기">
            <i class="fas fa-chevron-left text-sm"></i>
          </a>
          <div class="text-center">
            <h1 class="text-sm font-bold text-surface-900">환자 소개 네트워크</h1>
            <p class="text-[10px] text-surface-400">팬을 만들면 환자가 환자를 데려옵니다</p>
          </div>
          <button id="refreshNetwork" class="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center text-surface-500 hover:bg-surface-200 transition-all" aria-label="새로고침">
            <i class="fas fa-rotate-right text-sm"></i>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main id="networkContent" class="px-4 py-5 max-w-5xl mx-auto">
        {/* Loading state */}
        <div id="networkLoading" class="flex flex-col items-center justify-center py-20 gap-3">
          <i class="fas fa-project-diagram text-3xl text-brand-400 animate-pulse"></i>
          <p class="text-sm text-surface-400">소개 네트워크 데이터를 불러오는 중...</p>
        </div>

        {/* Stats KPI cards — populated by JS */}
        <section id="networkStats" class="hidden grid grid-cols-2 md:grid-cols-4 gap-3 mb-5"></section>

        {/* Graph + Side panel */}
        <section id="networkBody" class="hidden grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Graph canvas */}
          <article class="md:col-span-2 bg-white rounded-2xl shadow-sm border border-surface-100 overflow-hidden">
            <header class="px-4 py-3 border-b border-surface-100 flex items-center justify-between">
              <div>
                <h2 class="text-sm font-bold text-surface-900">소개 트리</h2>
                <p class="text-[11px] text-surface-400">노드 크기 = 하위 소개수 · 색상 = 유입경로</p>
              </div>
              <div class="flex items-center gap-1 text-[10px]">
                <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-500"></span>광고</span>
                <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-500"></span>소개</span>
                <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-surface-400"></span>기타</span>
              </div>
            </header>
            <div id="graphContainer" class="relative w-full" style="height: 480px;">
              <svg id="referralGraph" class="w-full h-full"></svg>
              <div id="nodeTooltip" class="hidden absolute bg-surface-900 text-white text-[11px] rounded-lg px-2 py-1 pointer-events-none shadow-lg z-10"></div>
            </div>
          </article>

          {/* Side panel */}
          <aside class="space-y-3">
            {/* Top Influencers */}
            <div class="bg-white rounded-2xl shadow-sm border border-surface-100 p-4">
              <h3 class="text-sm font-bold text-surface-900 mb-2 flex items-center gap-2">
                <i class="fas fa-crown text-amber-500"></i>
                Top 인플루언서
              </h3>
              <p class="text-[10px] text-surface-400 mb-3">소개로 가장 많은 환자를 데려온 팬</p>
              <ul id="topInfluencers" class="space-y-2"></ul>
            </div>

            {/* Source breakdown */}
            <div class="bg-white rounded-2xl shadow-sm border border-surface-100 p-4">
              <h3 class="text-sm font-bold text-surface-900 mb-2 flex items-center gap-2">
                <i class="fas fa-traffic-light text-brand-500"></i>
                유입경로 분석
              </h3>
              <ul id="sourceBreakdown" class="space-y-2"></ul>
            </div>

            {/* Selected node detail */}
            <div id="nodeDetail" class="bg-gradient-to-br from-brand-50 to-white rounded-2xl shadow-sm border border-brand-100 p-4 hidden">
              <h3 class="text-sm font-bold text-surface-900 mb-2 flex items-center gap-2">
                <i class="fas fa-user-circle text-brand-500"></i>
                <span id="selectedName">환자 선택</span>
              </h3>
              <dl id="selectedStats" class="text-xs space-y-1.5"></dl>
              <a id="selectedLink" href="#" class="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700">
                상세보기 <i class="fas fa-arrow-right text-[10px]"></i>
              </a>
            </div>
          </aside>
        </section>

        {/* Empty state */}
        <div id="networkEmpty" class="hidden flex-col items-center justify-center py-20 gap-3">
          <i class="fas fa-users-slash text-3xl text-surface-300"></i>
          <p class="text-sm text-surface-500">아직 소개 관계 데이터가 없습니다</p>
          <p class="text-xs text-surface-400">환자 상세 페이지에서 '소개자 설정'을 추가해보세요</p>
        </div>
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
          <a href="/network" class="flex flex-col items-center gap-0.5 px-3 py-1 text-brand-600">
            <i class="fas fa-project-diagram text-lg"></i>
            <span class="text-[9px] font-semibold">소개망</span>
          </a>
          <a href="/patients" class="flex flex-col items-center gap-0.5 px-3 py-1 text-surface-400">
            <i class="fas fa-users text-lg"></i>
            <span class="text-[9px]">환자</span>
          </a>
        </div>
      </nav>

      {/* D3 v7 from CDN */}
      <script src="https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js"></script>
      <script src="/static/pages/referral-network.js"></script>
    </div>
  )
}
