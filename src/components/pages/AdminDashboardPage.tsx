import { FC } from 'hono/jsx'
import { Layout, Header } from '../shared/Layout'

export const AdminDashboardPage: FC = () => {
  return (
    <Layout activeTab="report">
      <Header title="원장 대시보드" subtitle="팀 성과 종합" rightAction={
        <button id="periodSelect" class="text-xs font-semibold bg-surface-100 text-surface-600 rounded-xl px-3 py-2 transition-all active:scale-95">
          이번 주 <i class="fas fa-chevron-down ml-1 text-[10px]"></i>
        </button>
      } />
      
      <div class="px-4 py-4 space-y-3 pb-24">
        {/* Goal Achievement Gauge */}
        <div class="card-premium p-5 bg-gradient-to-br from-surface-50 to-brand-50/30">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center"><i class="fas fa-bullseye text-xs text-brand-600"></i></div>
            <h3 class="font-bold text-sm text-surface-900">이번 주 목표 달성</h3>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div class="text-center">
              <div class="relative w-16 h-16 mx-auto mb-1.5">
                <svg viewBox="0 0 36 36" class="w-full h-full rotate-[-90deg]">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#f1f5f9" stroke-width="3"/>
                  <circle id="goalConvCircle" cx="18" cy="18" r="15" fill="none" stroke="#6366f1" stroke-width="3" stroke-linecap="round" stroke-dasharray="0 94.2" class="transition-all duration-1000"/>
                </svg>
                <span id="goalConvText" class="absolute inset-0 flex items-center justify-center text-sm font-black text-brand-600">-%</span>
              </div>
              <p class="text-[10px] font-semibold text-surface-500">전환율</p>
            </div>
            <div class="text-center">
              <div class="relative w-16 h-16 mx-auto mb-1.5">
                <svg viewBox="0 0 36 36" class="w-full h-full rotate-[-90deg]">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#f1f5f9" stroke-width="3"/>
                  <circle id="goalScoreCircle" cx="18" cy="18" r="15" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-dasharray="0 94.2" class="transition-all duration-1000"/>
                </svg>
                <span id="goalScoreText" class="absolute inset-0 flex items-center justify-center text-sm font-black text-emerald-600">-점</span>
              </div>
              <p class="text-[10px] font-semibold text-surface-500">코칭점수</p>
            </div>
            <div class="text-center">
              <div class="relative w-16 h-16 mx-auto mb-1.5">
                <svg viewBox="0 0 36 36" class="w-full h-full rotate-[-90deg]">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#f1f5f9" stroke-width="3"/>
                  <circle id="goalContactCircle" cx="18" cy="18" r="15" fill="none" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" stroke-dasharray="0 94.2" class="transition-all duration-1000"/>
                </svg>
                <span id="goalContactText" class="absolute inset-0 flex items-center justify-center text-sm font-black text-amber-600">-%</span>
              </div>
              <p class="text-[10px] font-semibold text-surface-500">연락수행률</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div class="grid grid-cols-2 gap-2">
          <div class="card-premium p-4 bg-gradient-to-br from-brand-500 to-brand-700 text-white border-0 shadow-lg shadow-brand-500/20">
            <p class="text-brand-200 text-[10px] font-semibold">총 상담</p>
            <p id="totalConsultations" class="text-3xl font-black mt-1">-</p>
            <p class="text-brand-200 text-[10px] mt-1"><span id="consultationTrend">-</span> vs 지난주</p>
          </div>
          <div class="card-premium p-4 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-0 shadow-lg shadow-emerald-500/20">
            <p class="text-emerald-200 text-[10px] font-semibold">전환율</p>
            <p id="conversionRate" class="text-3xl font-black mt-1">-%</p>
            <p class="text-emerald-200 text-[10px] mt-1"><span id="conversionTrend">-</span> vs 지난주</p>
          </div>
          <div class="card-premium p-4 bg-gradient-to-br from-sky-500 to-sky-700 text-white border-0 shadow-lg shadow-sky-500/20">
            <p class="text-sky-200 text-[10px] font-semibold">평균 코칭점수</p>
            <p id="avgCoachingScore" class="text-3xl font-black mt-1">-점</p>
            <p class="text-sky-200 text-[10px] mt-1"><span id="coachingTrend">-</span> vs 지난주</p>
          </div>
          <div class="card-premium p-4 bg-gradient-to-br from-purple-500 to-purple-700 text-white border-0 shadow-lg shadow-purple-500/20">
            <p class="text-purple-200 text-[10px] font-semibold">제안서 열람율</p>
            <p id="proposalViewRate" class="text-3xl font-black mt-1">-%</p>
            <p class="text-purple-200 text-[10px] mt-1"><span id="proposalTrend">-</span> vs 지난주</p>
          </div>
        </div>

        {/* K-Factor 위젯 (v7.5 — Patient Funnel 핵심 지표) */}
        <div class="card-premium p-5 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 text-white border-0 shadow-lg shadow-purple-500/30 relative overflow-hidden">
          <div class="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div class="absolute -bottom-6 -left-6 w-24 h-24 bg-amber-300/20 rounded-full blur-xl"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                  <i class="fas fa-share-nodes text-xs text-white"></i>
                </div>
                <h3 class="font-bold text-sm text-white">소개 바이럴 지수 (K-factor)</h3>
              </div>
              <a href="/network" class="text-[10px] font-bold text-white/90 bg-white/15 backdrop-blur px-2.5 py-1 rounded-lg active:scale-95 transition">
                망 보기 <i class="fas fa-arrow-right text-[9px] ml-1"></i>
              </a>
            </div>
            <div class="grid grid-cols-2 gap-3 mt-4">
              <div>
                <p class="text-[10px] font-semibold text-white/70 mb-1">K-factor</p>
                <p id="kFactorValue" class="text-4xl font-black tabular-nums leading-none">-</p>
                <p id="kFactorBadge" class="text-[10px] font-bold mt-1.5 inline-block px-2 py-0.5 rounded-full bg-white/15 backdrop-blur">로딩…</p>
              </div>
              <div class="space-y-1.5">
                <div class="flex items-center justify-between text-[11px]">
                  <span class="text-white/70 font-semibold">총 환자</span>
                  <span id="kFactorTotalPatients" class="font-bold tabular-nums">-</span>
                </div>
                <div class="flex items-center justify-between text-[11px]">
                  <span class="text-white/70 font-semibold">총 소개</span>
                  <span id="kFactorTotalReferrals" class="font-bold tabular-nums">-</span>
                </div>
                <div class="flex items-center justify-between text-[11px]">
                  <span class="text-white/70 font-semibold">최대 깊이</span>
                  <span id="kFactorMaxDepth" class="font-bold tabular-nums">-</span>
                </div>
                <div class="flex items-center justify-between text-[11px]">
                  <span class="text-white/70 font-semibold">소개받은 환자</span>
                  <span id="kFactorReferredPatients" class="font-bold tabular-nums">-</span>
                </div>
              </div>
            </div>
            <p id="kFactorHint" class="text-[10px] text-white/70 mt-3 leading-relaxed">K&gt;1.0 시 환자가 환자를 데려오는 자생 성장 구간</p>
          </div>
        </div>

        {/* 상담사별 K-Factor 분해 (v7.6) */}
        <div class="card-premium overflow-hidden">
          <div class="p-4 border-b border-surface-100 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                <i class="fas fa-user-group text-xs text-purple-600"></i>
              </div>
              <div>
                <h3 class="font-bold text-sm text-surface-900">상담사별 바이럴 기여도</h3>
                <p class="text-[10px] text-surface-400">누가 팬을 만들고 있나?</p>
              </div>
            </div>
            <span id="kFactorByStaffOrgAvg" class="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">전사 평균 K=-</span>
          </div>
          <div id="kFactorByStaff" class="divide-y divide-surface-50">
            <div class="p-4 space-y-3">
              <div class="shimmer h-16 rounded-xl"></div>
              <div class="shimmer h-16 rounded-xl"></div>
              <div class="shimmer h-16 rounded-xl"></div>
            </div>
          </div>
        </div>

        {/* Staff Performance */}
        <div class="card-premium overflow-hidden">
          <div class="p-4 border-b border-surface-100">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center"><i class="fas fa-users text-xs text-brand-600"></i></div>
              <h3 class="font-bold text-sm text-surface-900">상담사 성과</h3>
            </div>
          </div>
          <div id="staffPerformance">
            <div class="p-4 space-y-3">
              <div class="shimmer h-16 rounded-xl"></div>
              <div class="shimmer h-16 rounded-xl"></div>
            </div>
          </div>
        </div>

        {/* Coaching Breakdown */}
        <div class="card-premium p-5">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center"><i class="fas fa-chart-radar text-xs text-purple-600"></i></div>
            <h3 class="font-bold text-sm text-surface-900">코칭 영역별 평균</h3>
          </div>
          <div id="coachingBreakdown" class="space-y-3">
            <div class="shimmer h-6 rounded-lg"></div>
            <div class="shimmer h-6 rounded-lg"></div>
            <div class="shimmer h-6 rounded-lg"></div>
          </div>
        </div>

        {/* Low Score Consultations */}
        <div class="card-premium overflow-hidden">
          <div class="p-4 border-b border-surface-100">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center"><i class="fas fa-triangle-exclamation text-xs text-amber-600"></i></div>
              <div>
                <h3 class="font-bold text-sm text-surface-900">코칭 필요 상담</h3>
                <p class="text-[10px] text-surface-400">점수 70점 미만</p>
              </div>
            </div>
          </div>
          <div id="lowScoreConsultations" class="divide-y divide-surface-50 max-h-80 overflow-y-auto">
            <div class="p-4"><div class="shimmer h-16 rounded-xl"></div></div>
          </div>
        </div>

        {/* Proposal Analytics */}
        <div class="card-premium p-5">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center"><i class="fas fa-file-invoice text-xs text-sky-600"></i></div>
            <h3 class="font-bold text-sm text-surface-900">제안서 현황</h3>
          </div>
          <div id="proposalAnalytics" class="grid grid-cols-3 gap-2">
            <div class="bg-surface-50 rounded-xl p-3.5 text-center">
              <p id="proposalsSent" class="text-2xl font-black text-surface-900">-</p>
              <p class="text-[10px] font-semibold text-surface-400 mt-0.5">발송</p>
            </div>
            <div class="bg-sky-50 rounded-xl p-3.5 text-center">
              <p id="proposalsViewed" class="text-2xl font-black text-sky-600">-</p>
              <p class="text-[10px] font-semibold text-surface-400 mt-0.5">열람</p>
            </div>
            <div class="bg-emerald-50 rounded-xl p-3.5 text-center">
              <p id="proposalsConverted" class="text-2xl font-black text-emerald-600">-</p>
              <p class="text-[10px] font-semibold text-surface-400 mt-0.5">전환</p>
            </div>
          </div>
        </div>

        {/* Revenue Trend Chart */}
        <div class="card-premium p-5">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center"><i class="fas fa-chart-line text-xs text-emerald-600"></i></div>
            <h3 class="font-bold text-sm text-surface-900">매출 트렌드</h3>
          </div>
          <canvas id="adminRevenueChart" height="180"></canvas>
        </div>

        {/* Team Performance Radar */}
        <div class="card-premium p-5">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center"><i class="fas fa-chart-radar text-xs text-violet-600"></i></div>
            <h3 class="font-bold text-sm text-surface-900">팀 역량 분석</h3>
          </div>
          <canvas id="teamRadarChart" height="220"></canvas>
        </div>

        {/* Coaching Score Trend */}
        <div class="card-premium p-5">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center"><i class="fas fa-chart-area text-xs text-amber-600"></i></div>
            <h3 class="font-bold text-sm text-surface-900">코칭 점수 추이</h3>
          </div>
          <canvas id="coachingTrendChart" height="180"></canvas>
        </div>

        {/* v8.0: Score-Revenue Correlation */}
        <div class="card-premium p-5" id="score-revenue-card">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center"><i class="fas fa-coins text-xs text-emerald-600"></i></div>
            <h3 class="font-bold text-sm text-surface-900">점수 → 매출 상관</h3>
          </div>
          <div id="scoreRevenueAdmin">
            <div class="shimmer h-32 rounded-xl"></div>
          </div>
        </div>

        {/* Hourly Distribution Chart */}
        <div class="card-premium p-5">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center"><i class="fas fa-clock text-xs text-sky-600"></i></div>
            <h3 class="font-bold text-sm text-surface-900">시간대별 상담 분포</h3>
          </div>
          <canvas id="hourlyDistChart" height="140"></canvas>
          <p class="text-[10px] text-surface-400 mt-2 text-center">상담이 집중되는 시간대를 파악하세요</p>
        </div>

        {/* Weekly Comparison Cards */}
        <div class="card-premium p-5">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center"><i class="fas fa-code-compare text-xs text-purple-600"></i></div>
            <h3 class="font-bold text-sm text-surface-900">이번 주 vs 지난 주</h3>
          </div>
          <div id="weeklyComparison" class="grid grid-cols-2 gap-2">
            <div class="shimmer h-16 rounded-xl"></div>
            <div class="shimmer h-16 rounded-xl"></div>
          </div>
        </div>
      </div>

      <script src="/static/pages/admin-dashboard.js"></script>
    </Layout>
  )
}
