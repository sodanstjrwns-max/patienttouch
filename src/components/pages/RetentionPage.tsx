import { FC } from 'hono/jsx'
import { Layout, Header } from '../shared/Layout'

export const RetentionPage: FC = () => {
  return (
    <Layout activeTab="retention">
      <Header title="리텐션 관리" subtitle="치료 미완료 · 리콜 · 이탈 환자" rightAction={
        <div class="flex gap-2">
          <button id="reportBtn" class="w-9 h-9 flex items-center justify-center rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all active:scale-95" onclick="switchView('report')">
            <i class="fas fa-chart-bar text-sm"></i>
          </button>
          <button id="refreshBtn" class="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-50 text-brand-600 hover:bg-brand-100 transition-all active:scale-95" onclick="updateRetentionStatus()">
            <i class="fas fa-arrows-rotate text-sm"></i>
          </button>
        </div>
      } />

      {/* View Tabs: Dashboard vs Report */}
      <div id="dashboardView">
        {/* Filter Tabs */}
        <div class="px-4 pt-3 pb-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
          <button class="filter-btn px-3.5 py-2 text-xs font-bold rounded-xl transition-all bg-brand-600 text-white shadow-sm whitespace-nowrap" data-filter="all" onclick="applyFilter('all')">
            <i class="fas fa-th-large mr-1"></i>전체
          </button>
          <button class="filter-btn px-3.5 py-2 text-xs font-bold rounded-xl transition-all bg-surface-100 text-surface-600 whitespace-nowrap" data-filter="urgent" onclick="applyFilter('urgent')">
            <i class="fas fa-exclamation-triangle mr-1"></i>미완료
          </button>
          <button class="filter-btn px-3.5 py-2 text-xs font-bold rounded-xl transition-all bg-surface-100 text-surface-600 whitespace-nowrap" data-filter="recall" onclick="applyFilter('recall')">
            <i class="fas fa-calendar-check mr-1"></i>리콜
          </button>
          <button class="filter-btn px-3.5 py-2 text-xs font-bold rounded-xl transition-all bg-surface-100 text-surface-600 whitespace-nowrap" data-filter="at_risk" onclick="applyFilter('at_risk')">
            <i class="fas fa-heart-crack mr-1"></i>이탈위험
          </button>
          <button class="filter-btn px-3.5 py-2 text-xs font-bold rounded-xl transition-all bg-surface-100 text-surface-600 whitespace-nowrap" data-filter="unconverted" onclick="applyFilter('unconverted')">
            <i class="fas fa-comment-slash mr-1"></i>미전환
          </button>
        </div>

        <div id="retentionContent" class="px-4 py-3 space-y-3 pb-32">
          {/* Skeleton */}
          <div class="grid grid-cols-2 gap-2.5 stagger-children">
            <div class="card-premium p-4"><div class="shimmer h-5 rounded-lg w-2/3 mb-2"></div><div class="shimmer h-8 rounded-lg w-1/2"></div></div>
            <div class="card-premium p-4"><div class="shimmer h-5 rounded-lg w-2/3 mb-2"></div><div class="shimmer h-8 rounded-lg w-1/2"></div></div>
            <div class="card-premium p-4"><div class="shimmer h-5 rounded-lg w-2/3 mb-2"></div><div class="shimmer h-8 rounded-lg w-1/2"></div></div>
            <div class="card-premium p-4"><div class="shimmer h-5 rounded-lg w-2/3 mb-2"></div><div class="shimmer h-8 rounded-lg w-1/2"></div></div>
          </div>
          <div class="card-premium p-5"><div class="shimmer h-6 rounded-lg w-1/2 mb-4"></div><div class="shimmer h-24 rounded-lg w-full"></div></div>
        </div>
      </div>

      {/* Report View (hidden by default) */}
      <div id="reportView" class="hidden">
        <div class="px-4 pt-3 pb-2 flex gap-1.5">
          <button class="report-period-btn px-4 py-2 text-xs font-bold rounded-xl transition-all bg-brand-600 text-white shadow-sm" data-period="week" onclick="loadReport('week')">
            <i class="fas fa-calendar-week mr-1"></i>주간
          </button>
          <button class="report-period-btn px-4 py-2 text-xs font-bold rounded-xl transition-all bg-surface-100 text-surface-600" data-period="month" onclick="loadReport('month')">
            <i class="fas fa-calendar mr-1"></i>월간
          </button>
          <button class="ml-auto px-4 py-2 text-xs font-bold rounded-xl bg-surface-100 text-surface-600" onclick="switchView('dashboard')">
            <i class="fas fa-arrow-left mr-1"></i>대시보드
          </button>
        </div>
        <div id="reportContent" class="px-4 py-3 space-y-3 pb-32">
          <div class="card-premium p-5"><div class="shimmer h-6 rounded-lg w-1/2 mb-4"></div><div class="shimmer h-32 rounded-lg w-full"></div></div>
        </div>
      </div>

      {/* Contact Result Modal */}
      <div id="contactModal" class="hidden fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
        <div class="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg p-6 animate-slide-up">
          <div class="flex justify-between items-center mb-5">
            <h3 class="text-lg font-bold text-surface-900">연락 결과 기록</h3>
            <button onclick="closeContactModal()" class="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-500 transition-all active:scale-95">
              <i class="fas fa-xmark"></i>
            </button>
          </div>
          <input type="hidden" id="modalPatientId" />
          <input type="hidden" id="modalTreatmentId" />
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">연락 방법</label>
              <div class="flex gap-2">
                <button class="contact-type-btn flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-surface-200 text-surface-600 transition-all" data-type="phone" onclick="selectContactType('phone')"><i class="fas fa-phone mr-1.5"></i>전화</button>
                <button class="contact-type-btn flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-surface-200 text-surface-600 transition-all" data-type="text" onclick="selectContactType('text')"><i class="fas fa-comment mr-1.5"></i>문자</button>
                <button class="contact-type-btn flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-surface-200 text-surface-600 transition-all" data-type="kakao" onclick="selectContactType('kakao')"><i class="fas fa-comment-dots mr-1.5"></i>카카오</button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">결과</label>
              <select id="contactResult" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all">
                <option value="connected">통화 성공</option>
                <option value="no_answer">부재중</option>
                <option value="message_sent">메시지 발송</option>
                <option value="callback_promised">콜백 약속</option>
                <option value="appointment_booked">예약 완료</option>
                <option value="refused">거절</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">메모</label>
              <textarea id="contactNotes" rows={3} class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all resize-none" placeholder="연락 내용 메모"></textarea>
            </div>
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">다음 연락 예정일</label>
              <input type="date" id="nextContactDate" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all" />
            </div>
            <button onclick="saveContact()" class="w-full bg-gradient-brand text-white font-semibold py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-brand-600/20">
              <i class="fas fa-check mr-2"></i>기록 저장
            </button>
          </div>
        </div>
      </div>

      <script src="/static/pages/retention.js"></script>
    </Layout>
  )
}
