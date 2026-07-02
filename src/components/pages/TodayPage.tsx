import { FC } from 'hono/jsx'
import { Layout } from '../shared/Layout'

export const TodayPage: FC = () => {
  return (
    <Layout activeTab="today">
      {/* ====== HEADER ====== */}
      <header class="px-5 pt-14 pb-4 safe-area-top">
        <div class="flex items-center justify-between mb-4">
          <div>
            <p id="todayDateLabel" class="text-surface-500 text-xs font-medium tracking-wide mb-0.5">로딩 중...</p>
            <h1 class="text-lg font-extrabold text-surface-900 tracking-tight">오늘의 액션</h1>
          </div>
          <button id="todayRefreshBtn" class="w-8 h-8 rounded-xl bg-surface-100 flex items-center justify-center text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-all" title="새로고침">
            <i class="fas fa-rotate text-xs"></i>
          </button>
        </div>

        {/* BRIEFING SUMMARY CARD */}
        <section id="todayBriefingCard" class="bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-700 rounded-2xl p-5 shadow-lg shadow-brand-600/20 relative overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-10 translate-x-10"></div>
          <div class="relative">
            <div class="grid grid-cols-3 gap-2 mb-3">
              <div>
                <p class="text-white/50 text-[10px] font-semibold tracking-wider uppercase mb-0.5">오늘 연락</p>
                <p class="text-2xl font-black text-white tabular-nums"><span id="tbContactCount">-</span><span class="text-xs font-bold text-white/50 ml-0.5">건</span></p>
              </div>
              <div>
                <p class="text-white/50 text-[10px] font-semibold tracking-wider uppercase mb-0.5">예상 금액</p>
                <p class="text-2xl font-black text-white tabular-nums"><span id="tbRevenue">-</span><span class="text-xs font-bold text-white/50 ml-0.5">만원</span></p>
              </div>
              <div>
                <p class="text-white/50 text-[10px] font-semibold tracking-wider uppercase mb-0.5">이월 연락</p>
                <p class="text-2xl font-black tabular-nums"><span id="tbOverdue" class="text-white">-</span><span class="text-xs font-bold text-white/50 ml-0.5">건</span></p>
              </div>
            </div>
            <div id="tbTopPriority" class="hidden bg-white/10 rounded-xl px-3 py-2.5 backdrop-blur-sm"></div>
          </div>
        </section>
      </header>

      {/* ====== MAIN CONTENT ====== */}
      <div class="px-4 space-y-5 pb-8">

        {/* OVERDUE CARRYOVER ALERT */}
        <div id="overdueAlertBanner" class="hidden"></div>

        {/* PUSH ENABLE NUDGE */}
        <div id="pushNudgeBanner" class="hidden"></div>

        {/* FULL CHECKLIST */}
        <section id="todayFullChecklist">
          <div class="card-premium overflow-hidden">
            <div class="p-4 border-b border-surface-100 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-500 flex items-center justify-center shadow-sm shadow-brand-400/20">
                  <i class="fas fa-list-check text-[10px] text-white"></i>
                </div>
                <div>
                  <h3 class="font-bold text-sm text-surface-900">전체 액션 리스트</h3>
                  <p id="tpChecklistProgress" class="text-[10px] text-surface-400">로딩 중...</p>
                </div>
              </div>
              <div id="tpProgressRing" class="w-9 h-9"></div>
            </div>
            <div id="tpChecklistItems" class="divide-y divide-surface-50">
              <div class="p-4"><div class="shimmer h-12 rounded-lg w-full"></div></div>
            </div>
          </div>
        </section>

        {/* COMPLETED TODAY */}
        <section id="tpCompletedSection" class="hidden">
          <div class="card-premium overflow-hidden opacity-80">
            <div class="p-3.5 border-b border-surface-100 flex items-center gap-2">
              <div class="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                <i class="fas fa-check-double text-[9px] text-emerald-600"></i>
              </div>
              <h3 class="font-bold text-xs text-surface-700">오늘 완료한 연락 <span id="tpCompletedCount" class="text-emerald-600"></span></h3>
            </div>
            <div id="tpCompletedItems" class="divide-y divide-surface-50"></div>
          </div>
        </section>
      </div>

      {/* CONTACT RESULT MODAL (shared markup with home) */}
      <div id="homeContactModal" class="hidden fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
        <div class="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg p-6 animate-slide-up">
          <div class="flex justify-between items-center mb-5">
            <h3 class="text-lg font-bold text-surface-900">연락 결과 기록</h3>
            <button onclick="closeHomeContactModal()" class="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-500 transition-all active:scale-95">
              <i class="fas fa-xmark"></i>
            </button>
          </div>
          <input type="hidden" id="hcPatientId" />
          <input type="hidden" id="hcTaskId" />
          <input type="hidden" id="hcSource" />
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">연락 방법</label>
              <div class="flex gap-2">
                <button class="hc-type-btn flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-brand-500 text-brand-600 bg-brand-50 transition-all" data-type="phone" onclick="selectHcType('phone')"><i class="fas fa-phone mr-1.5"></i>전화</button>
                <button class="hc-type-btn flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-surface-200 text-surface-600 transition-all" data-type="text" onclick="selectHcType('text')"><i class="fas fa-comment mr-1.5"></i>문자</button>
                <button class="hc-type-btn flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-surface-200 text-surface-600 transition-all" data-type="kakao" onclick="selectHcType('kakao')"><i class="fas fa-comment-dots mr-1.5"></i>카카오</button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">결과</label>
              <select id="hcResult" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all">
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
              <textarea id="hcNotes" rows={3} class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all resize-none" placeholder="연락 내용 메모"></textarea>
            </div>
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">다음 연락 예정일</label>
              <input type="date" id="hcNextDate" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all" />
            </div>
            <button onclick="saveHomeContact()" id="hcSaveBtn" class="w-full bg-gradient-brand text-white font-semibold py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-brand-600/20">
              <i class="fas fa-check mr-2"></i>기록 저장
            </button>
          </div>
        </div>
      </div>

      <script src="/static/push-client.js"></script>
      <script src="/static/pages/today.js"></script>
    </Layout>
  )
}
