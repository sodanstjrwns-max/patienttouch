import { FC } from 'hono/jsx'
import { Layout, Header } from '../shared/Layout'

export const ChurnRetrainingPage: FC = () => {
  return (
    <Layout activeTab="report">
      <Header
        title="모델 재학습 대시보드"
        subtitle="이탈 예측 정확도 모니터링"
        rightAction={
          <a href="/retention/churn" class="text-xs font-semibold bg-surface-100 text-surface-600 rounded-xl px-3 py-2 transition-all active:scale-95">
            <i class="fas fa-arrow-left mr-1"></i>예측 화면
          </a>
        }
      />

      <div class="px-4 py-4 space-y-3 pb-24">
        {/* Hero: 재학습 권장 카드 */}
        <div id="retrainingHero" class="card-premium p-5 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 text-white border-0 shadow-lg shadow-purple-500/30 relative overflow-hidden">
          <div class="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div class="relative z-10">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-7 h-7 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                <i class="fas fa-brain text-xs text-white"></i>
              </div>
              <h3 class="font-bold text-sm text-white">모델 재학습 진단</h3>
            </div>
            <p id="retrainingStatus" class="text-2xl font-black mt-1 leading-tight">분석 중…</p>
            <p id="retrainingReason" class="text-[11px] text-white/85 mt-2 leading-relaxed">피드백 데이터를 분석하고 있습니다</p>
            <div id="retrainingActions" class="mt-3 space-y-1.5"></div>
          </div>
        </div>

        {/* 핵심 지표 4-grid */}
        <div class="grid grid-cols-2 gap-2">
          <div class="card-premium p-4">
            <p class="text-[10px] text-surface-400 font-semibold">총 예측</p>
            <p id="totalPredictions" class="text-2xl font-black text-surface-900 mt-1">-</p>
            <p class="text-[10px] text-surface-400 mt-0.5">누적 건수</p>
          </div>
          <div class="card-premium p-4">
            <p class="text-[10px] text-surface-400 font-semibold">피드백 누적</p>
            <p id="totalFeedback" class="text-2xl font-black text-brand-600 mt-1">-</p>
            <p class="text-[10px] text-surface-400 mt-0.5"><span id="feedbackRate">-</span>% 응답률</p>
          </div>
          <div class="card-premium p-4 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-0 shadow-md shadow-emerald-500/20">
            <p class="text-emerald-100 text-[10px] font-semibold">AI 정확도</p>
            <p id="aiAccuracy" class="text-2xl font-black mt-1">-%</p>
            <p class="text-emerald-200 text-[10px] mt-0.5">F1 <span id="f1Score">-</span></p>
          </div>
          <div class="card-premium p-4 bg-gradient-to-br from-sky-500 to-sky-700 text-white border-0 shadow-md shadow-sky-500/20">
            <p class="text-sky-100 text-[10px] font-semibold">vs 규칙 기반</p>
            <p id="ruleAccuracy" class="text-2xl font-black mt-1">-%</p>
            <p class="text-sky-200 text-[10px] mt-0.5">AI <span id="aiVsRule">-</span></p>
          </div>
        </div>

        {/* 혼동 행렬 (Confusion Matrix) */}
        <div class="card-premium p-5">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
              <i class="fas fa-table-cells text-xs text-purple-600"></i>
            </div>
            <div>
              <h3 class="font-bold text-sm text-surface-900">혼동 행렬 (Confusion Matrix)</h3>
              <p class="text-[10px] text-surface-400">예측 vs 실제 결과 매핑</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 text-center">
              <p class="text-[10px] text-emerald-700 font-bold">✅ 정확하게 이탈 예측</p>
              <p id="cmTP" class="text-2xl font-black text-emerald-700 mt-1 tabular-nums">-</p>
              <p class="text-[9px] text-emerald-600 mt-0.5">True Positive</p>
            </div>
            <div class="bg-rose-50 border border-rose-100 rounded-xl p-3.5 text-center">
              <p class="text-[10px] text-rose-700 font-bold">⚠️ 과잉 경보</p>
              <p id="cmFP" class="text-2xl font-black text-rose-700 mt-1 tabular-nums">-</p>
              <p class="text-[9px] text-rose-600 mt-0.5">False Positive</p>
            </div>
            <div class="bg-rose-100 border border-rose-200 rounded-xl p-3.5 text-center">
              <p class="text-[10px] text-rose-800 font-bold">🚨 놓친 이탈</p>
              <p id="cmFN" class="text-2xl font-black text-rose-800 mt-1 tabular-nums">-</p>
              <p class="text-[9px] text-rose-700 mt-0.5">False Negative</p>
            </div>
            <div class="bg-emerald-100 border border-emerald-200 rounded-xl p-3.5 text-center">
              <p class="text-[10px] text-emerald-800 font-bold">✅ 정확하게 유지 예측</p>
              <p id="cmTN" class="text-2xl font-black text-emerald-800 mt-1 tabular-nums">-</p>
              <p class="text-[9px] text-emerald-700 mt-0.5">True Negative</p>
            </div>
          </div>
          <div class="mt-3 grid grid-cols-2 gap-2 text-center">
            <div class="bg-surface-50 rounded-lg p-2">
              <p class="text-[10px] text-surface-500 font-semibold">정밀도 (Precision)</p>
              <p id="precisionScore" class="text-base font-black text-surface-900 mt-0.5">-%</p>
            </div>
            <div class="bg-surface-50 rounded-lg p-2">
              <p class="text-[10px] text-surface-500 font-semibold">재현율 (Recall)</p>
              <p id="recallScore" class="text-base font-black text-surface-900 mt-0.5">-%</p>
            </div>
          </div>
        </div>

        {/* 주별 정확도 추이 차트 */}
        <div class="card-premium p-5">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
              <i class="fas fa-chart-line text-xs text-amber-600"></i>
            </div>
            <div>
              <h3 class="font-bold text-sm text-surface-900">주별 정확도 추이</h3>
              <p class="text-[10px] text-surface-400">최근 12주 피드백 기반</p>
            </div>
          </div>
          <canvas id="weeklyTrendChart" height="180"></canvas>
        </div>

        {/* 위험 등급별 적중률 */}
        <div class="card-premium overflow-hidden">
          <div class="p-4 border-b border-surface-100">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
                <i class="fas fa-layer-group text-xs text-rose-600"></i>
              </div>
              <div>
                <h3 class="font-bold text-sm text-surface-900">위험 등급별 적중률</h3>
                <p class="text-[10px] text-surface-400">어떤 등급의 예측이 가장 정확한가</p>
              </div>
            </div>
          </div>
          <div id="riskBreakdown" class="divide-y divide-surface-50">
            <div class="p-4 space-y-2">
              <div class="shimmer h-12 rounded-xl"></div>
              <div class="shimmer h-12 rounded-xl"></div>
            </div>
          </div>
        </div>

        {/* 최근 피드백 (오답 우선) */}
        <div class="card-premium overflow-hidden">
          <div class="p-4 border-b border-surface-100">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                <i class="fas fa-list-check text-xs text-violet-600"></i>
              </div>
              <div>
                <h3 class="font-bold text-sm text-surface-900">최근 피드백 (학습 자료)</h3>
                <p class="text-[10px] text-surface-400">오답 케이스를 검토하여 모델을 개선하세요</p>
              </div>
            </div>
          </div>
          <div id="recentFeedback" class="divide-y divide-surface-50 max-h-96 overflow-y-auto">
            <div class="p-4 space-y-2">
              <div class="shimmer h-12 rounded-xl"></div>
              <div class="shimmer h-12 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>

      <script src="/static/pages/churn-retraining.js"></script>
    </Layout>
  )
}
