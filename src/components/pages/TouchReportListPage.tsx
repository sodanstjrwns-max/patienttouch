import { FC } from 'hono/jsx'
import { Layout, Header } from '../shared/Layout'

// ============================================
// 터치 리포트 — 검수대기/발송 목록 (/touch-reports)
// ============================================

export const TouchReportListPage: FC = () => {
  return (
    <Layout activeTab="consultations">
      <Header title="터치 리포트" subtitle="환자용 상담 보고서" showBack backUrl="/" />

      <div class="px-4 py-4 pb-32">
        {/* 상태 필터 탭 */}
        <div id="trlTabs" class="flex gap-2 mb-4 p-1 bg-surface-100 rounded-xl overflow-x-auto">
          <button data-status="" class="trl-tab flex-1 whitespace-nowrap py-2 px-3 rounded-lg font-semibold text-xs transition-all bg-white text-surface-900 shadow-sm">전체</button>
          <button data-status="review" class="trl-tab flex-1 whitespace-nowrap py-2 px-3 rounded-lg font-semibold text-xs transition-all text-surface-500">검수대기</button>
          <button data-status="approved" class="trl-tab flex-1 whitespace-nowrap py-2 px-3 rounded-lg font-semibold text-xs transition-all text-surface-500">승인됨</button>
          <button data-status="sent" class="trl-tab flex-1 whitespace-nowrap py-2 px-3 rounded-lg font-semibold text-xs transition-all text-surface-500">발송완료</button>
        </div>

        <div id="trlList" class="space-y-3">
          <div class="card-premium p-5"><div class="shimmer h-5 rounded-lg w-1/2 mb-2"></div><div class="shimmer h-4 rounded-lg w-3/4"></div></div>
          <div class="card-premium p-5"><div class="shimmer h-5 rounded-lg w-2/5 mb-2"></div><div class="shimmer h-4 rounded-lg w-2/3"></div></div>
        </div>
      </div>

      <script src="/static/pages/touch-report-list.js"></script>
    </Layout>
  )
}
