import { FC } from 'hono/jsx'
import { Layout, Header } from '../shared/Layout'

export const ReportPage: FC = () => {
  return (
    <Layout activeTab="report">
      <Header title="리포트" subtitle="성과 분석" rightAction={
        <select id="periodSelect" class="text-xs font-semibold bg-surface-100 text-surface-600 border-0 rounded-xl px-3 py-2 outline-none cursor-pointer">
          <option value="week">이번 주</option>
          <option value="month">이번 달</option>
          <option value="quarter">분기</option>
        </select>
      } />

      {/* View Tabs */}
      <div class="px-4 pt-3 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
        <button class="report-tab px-3.5 py-2 text-xs font-bold rounded-xl transition-all bg-brand-600 text-white shadow-sm whitespace-nowrap" data-tab="overview" onclick="switchTab('overview')">
          <i class="fas fa-bullseye mr-1"></i>목표
        </button>
        <button class="report-tab px-3.5 py-2 text-xs font-bold rounded-xl transition-all bg-surface-100 text-surface-600 whitespace-nowrap" data-tab="compare" onclick="switchTab('compare')">
          <i class="fas fa-code-compare mr-1"></i>기간비교
        </button>
        <button class="report-tab px-3.5 py-2 text-xs font-bold rounded-xl transition-all bg-surface-100 text-surface-600 whitespace-nowrap" data-tab="schedule" onclick="switchTab('schedule')">
          <i class="fas fa-calendar-clock mr-1"></i>스마트연락
        </button>
        <button class="report-tab px-3.5 py-2 text-xs font-bold rounded-xl transition-all bg-surface-100 text-surface-600 whitespace-nowrap" data-tab="chart" onclick="switchTab('chart')">
          <i class="fas fa-chart-line mr-1"></i>매출 추이
        </button>
        <button class="report-tab px-3.5 py-2 text-xs font-bold rounded-xl transition-all bg-surface-100 text-surface-600 whitespace-nowrap" data-tab="referral" onclick="switchTab('referral')">
          <i class="fas fa-route mr-1"></i>경로 ROI
        </button>
        <button class="report-tab px-3.5 py-2 text-xs font-bold rounded-xl transition-all bg-surface-100 text-surface-600 whitespace-nowrap" data-tab="treatment" onclick="switchTab('treatment')">
          <i class="fas fa-tooth mr-1"></i>치료항목
        </button>
      </div>
      
      <div class="px-4 py-4 space-y-3 pb-24">
        {/* Feature 7: Period Comparison Tab */}
        <div id="compareTab" class="hidden">
          <div class="card-premium p-5 mb-3">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center"><i class="fas fa-code-compare text-xs text-purple-600"></i></div>
                <h2 class="font-bold text-sm text-surface-900">기간 비교</h2>
              </div>
              <div class="flex gap-1">
                <button onclick="loadPeriodCompare('week')" class="cmp-period-btn text-[10px] font-bold px-2.5 py-1 rounded-lg bg-brand-600 text-white transition-all" data-p="week">주간</button>
                <button onclick="loadPeriodCompare('month')" class="cmp-period-btn text-[10px] font-bold px-2.5 py-1 rounded-lg bg-surface-100 text-surface-600 transition-all" data-p="month">월간</button>
                <button onclick="loadPeriodCompare('quarter')" class="cmp-period-btn text-[10px] font-bold px-2.5 py-1 rounded-lg bg-surface-100 text-surface-600 transition-all" data-p="quarter">분기</button>
              </div>
            </div>
            <div id="compareContent" class="space-y-3">
              <div class="shimmer h-24 rounded-xl"></div>
              <div class="shimmer h-20 rounded-xl"></div>
            </div>
          </div>
        </div>

        {/* Feature 8: Smart Schedule Tab */}
        <div id="scheduleTab" class="hidden">
          <div class="card-premium p-5 mb-3">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center"><i class="fas fa-calendar-clock text-xs text-emerald-600"></i></div>
              <h2 class="font-bold text-sm text-surface-900">AI 추천 연락 스케줄</h2>
            </div>
            <p class="text-xs text-surface-500 mb-4">결정도, 경과일수, 금액을 기반으로 최적 연락 시점을 추천합니다</p>
            <div id="scheduleContent" class="space-y-2">
              <div class="shimmer h-16 rounded-xl"></div>
              <div class="shimmer h-16 rounded-xl"></div>
              <div class="shimmer h-16 rounded-xl"></div>
            </div>
          </div>
        </div>

        {/* Overview Tab */}
        <div id="overviewTab">
          {/* KPI Overview */}
          <div class="card-premium p-5 mb-3">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center"><i class="fas fa-bullseye text-xs text-brand-600"></i></div>
              <h2 class="font-bold text-sm text-surface-900">목표 달성 현황</h2>
            </div>
            <div id="kpiSection" class="space-y-4">
              <div class="space-y-4">
                <div class="shimmer h-12 rounded-xl"></div>
                <div class="shimmer h-12 rounded-xl"></div>
                <div class="shimmer h-12 rounded-xl"></div>
                <div class="shimmer h-12 rounded-xl"></div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div class="grid grid-cols-2 gap-2 mb-3">
            <div class="card-premium p-4">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-8 h-8 rounded-lg bg-surface-50 flex items-center justify-center"><i class="fas fa-comments text-surface-400 text-xs"></i></div>
              </div>
              <p id="totalConsultations" class="text-2xl font-black text-surface-900">-</p>
              <p class="text-[10px] font-semibold text-surface-400 mt-0.5">총 상담</p>
            </div>
            <div class="card-premium p-4">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center"><i class="fas fa-check-circle text-emerald-500 text-xs"></i></div>
              </div>
              <p id="paidConsultations" class="text-2xl font-black text-emerald-600">-</p>
              <p class="text-[10px] font-semibold text-surface-400 mt-0.5">결제 완료</p>
            </div>
            <div class="card-premium p-4">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center"><i class="fas fa-phone text-sky-500 text-xs"></i></div>
              </div>
              <p id="totalTasks" class="text-2xl font-black text-surface-900">-</p>
              <p class="text-[10px] font-semibold text-surface-400 mt-0.5">총 연락</p>
            </div>
            <div class="card-premium p-4">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center"><i class="fas fa-circle-check text-brand-500 text-xs"></i></div>
              </div>
              <p id="completedTasks" class="text-2xl font-black text-brand-600">-</p>
              <p class="text-[10px] font-semibold text-surface-400 mt-0.5">연락 완료</p>
            </div>
          </div>

          {/* Total Amount */}
          <div class="card-premium p-5 bg-gradient-to-r from-brand-50/50 to-purple-50/30 mb-3">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-[10px] font-semibold text-surface-400 uppercase tracking-wider">총 상담 금액</p>
                <p id="totalAmount" class="text-3xl font-black text-brand-700 mt-1">-</p>
              </div>
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
                <i class="fas fa-won-sign text-white text-xl"></i>
              </div>
            </div>
          </div>

          {/* Goal Settings */}
          <div class="card-premium p-5">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center"><i class="fas fa-sliders text-xs text-amber-600"></i></div>
                <h2 class="font-bold text-sm text-surface-900">목표 설정</h2>
              </div>
              <button id="editGoalsBtn" class="text-brand-600 text-xs font-semibold flex items-center gap-1 hover:text-brand-700 transition-colors">
                <i class="fas fa-pen text-[10px]"></i>수정
              </button>
            </div>
            <div id="goalsDisplay" class="space-y-3 text-sm">
              <div class="flex justify-between items-center p-2 bg-surface-50 rounded-lg"><span class="text-surface-500 text-xs">상담 전환율</span><span id="goalConversion" class="font-bold text-surface-800">-</span></div>
              <div class="flex justify-between items-center p-2 bg-surface-50 rounded-lg"><span class="text-surface-500 text-xs">평균 상담점수</span><span id="goalScore" class="font-bold text-surface-800">-</span></div>
              <div class="flex justify-between items-center p-2 bg-surface-50 rounded-lg"><span class="text-surface-500 text-xs">연락 수행률</span><span id="goalContact" class="font-bold text-surface-800">-</span></div>
              <div class="flex justify-between items-center p-2 bg-surface-50 rounded-lg"><span class="text-surface-500 text-xs">재상담 성공</span><span id="goalReConsult" class="font-bold text-surface-800">-</span></div>
            </div>
          </div>
        </div>

        {/* Chart Tab */}
        <div id="chartTab" class="hidden">
          <div class="card-premium p-5 mb-3">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center"><i class="fas fa-chart-line text-xs text-brand-600"></i></div>
              <h2 class="font-bold text-sm text-surface-900">매출 추이</h2>
            </div>
            <canvas id="revenueChart" height="220"></canvas>
          </div>
          <div class="card-premium p-5">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center"><i class="fas fa-percent text-xs text-emerald-600"></i></div>
              <h2 class="font-bold text-sm text-surface-900">전환율 추이</h2>
            </div>
            <canvas id="conversionChart" height="200"></canvas>
          </div>
        </div>

        {/* Referral ROI Tab */}
        <div id="referralTab" class="hidden">
          <div id="referralContent">
            <div class="card-premium p-5"><div class="shimmer h-40 rounded-lg w-full"></div></div>
          </div>
        </div>

        {/* Treatment Tab */}
        <div id="treatmentTab" class="hidden">
          <div id="treatmentContent">
            <div class="card-premium p-5"><div class="shimmer h-40 rounded-lg w-full"></div></div>
          </div>
        </div>
      </div>

      {/* Goals Edit Modal */}
      <div id="goalsModal" class="hidden fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
        <div class="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg p-6 animate-slide-up">
          <div class="flex justify-between items-center mb-5">
            <h3 class="text-lg font-bold text-surface-900">목표 설정</h3>
            <button onclick="closeGoalsModal()" class="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-500 transition-all active:scale-95">
              <i class="fas fa-xmark"></i>
            </button>
          </div>
          <form id="goalsForm" class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">상담 전환율 목표 (%)</label>
              <input type="number" name="conversion_rate" min="0" max="100" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 outline-none text-sm transition-all" placeholder="80" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">평균 상담점수 목표 (점)</label>
              <input type="number" name="avg_score" min="0" max="100" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 outline-none text-sm transition-all" placeholder="85" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">연락 수행률 목표 (%)</label>
              <input type="number" name="contact_rate" min="0" max="100" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 outline-none text-sm transition-all" placeholder="95" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">재상담 성공 목표 (건)</label>
              <input type="number" name="re_consultation" min="0" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 outline-none text-sm transition-all" placeholder="3" />
            </div>
            <button type="submit" class="w-full bg-gradient-brand text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98] shadow-md shadow-brand-600/20">
              저장하기
            </button>
          </form>
        </div>
      </div>

      <script src="/static/pages/report.js"></script>
    </Layout>
  )
}
