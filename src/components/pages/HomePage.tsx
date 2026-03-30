import { FC } from 'hono/jsx'
import { Layout } from '../shared/Layout'

export const HomePage: FC = () => {
  return (
    <Layout activeTab="home">
      {/* ====== CLEAN HEADER ====== */}
      <header class="px-5 pt-14 pb-4 safe-area-top">
        <div class="flex items-center justify-between mb-6">
          <div id="greetingSection">
            <p class="text-surface-500 text-xs font-medium tracking-wide mb-0.5">로딩 중...</p>
            <h1 class="text-lg font-extrabold text-surface-900 tracking-tight">페이션트 터치</h1>
          </div>
          <div class="flex items-center gap-1.5">
            <a href="/admin" class="w-8 h-8 rounded-xl bg-surface-100 flex items-center justify-center text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-all">
              <i class="fas fa-chart-line text-xs"></i>
            </a>
            <a href="/settings" class="w-8 h-8 rounded-xl bg-surface-100 flex items-center justify-center text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-all">
              <i class="fas fa-gear text-xs"></i>
            </a>
            <button id="headerLogoutBtn" class="w-8 h-8 rounded-xl bg-surface-100 flex items-center justify-center text-surface-400 hover:text-rose-500 hover:bg-rose-50 transition-all" title="로그아웃">
              <i class="fas fa-arrow-right-from-bracket text-xs"></i>
            </button>
          </div>
        </div>

        {/* TODAY SUMMARY CARD */}
        <div class="bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-700 rounded-2xl p-5 shadow-lg shadow-brand-600/20 relative overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-10 translate-x-10"></div>
          <div class="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-8 -translate-x-8"></div>
          <div class="relative">
            <p class="text-white/60 text-[11px] font-semibold tracking-wider uppercase mb-1">오늘 결정 금액</p>
            <div class="flex items-end gap-1.5 mb-3">
              <span id="heroRevenue" class="text-3xl font-black text-white tabular-nums" style="letter-spacing: -0.02em;">0</span>
              <span class="text-sm font-bold text-white/50 mb-0.5">만원</span>
            </div>
            <div id="heroSubStats" class="flex items-center gap-3">
              <span class="text-xs text-white/40">로딩 중...</span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div class="px-4 pt-4 space-y-5">

        {/* ====== ACHIEVEMENT BANNERS ====== */}
        <div id="achievementBanners" class="space-y-2"></div>

        {/* ====== STALE UNDECIDED ALERT BANNER ====== */}
        <div id="staleAlertBanner" class="hidden"></div>

        {/* ====== AI DAILY INSIGHT ====== */}
        <div id="aiInsightCard" class="hidden">
          <div class="card-premium p-4 bg-gradient-to-br from-brand-50/80 to-purple-50/60 border border-brand-200/30">
            <div class="flex items-center gap-2 mb-2.5">
              <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center shadow-sm shadow-brand-400/30">
                <i class="fas fa-brain text-[10px] text-white"></i>
              </div>
              <div>
                <h3 class="font-bold text-xs text-surface-900">AI 코칭 인사이트</h3>
                <p class="text-[9px] text-surface-400">GPT-5 &bull; Patient Funnel AI</p>
              </div>
              <button onclick="document.getElementById('aiInsightCard').classList.add('hidden')" class="ml-auto w-6 h-6 rounded-lg bg-white/50 flex items-center justify-center text-surface-400 hover:text-surface-600 transition-all">
                <i class="fas fa-xmark text-[10px]"></i>
              </button>
            </div>
            <p id="aiInsightText" class="text-sm text-surface-700 leading-relaxed"></p>
          </div>
        </div>

        {/* ====== TODAY MISSION PROGRESS ====== */}
        <div id="todayMission" class="card-premium p-4 hidden">
          <div class="shimmer h-16 rounded-lg w-full"></div>
        </div>

        {/* ====== QUICK ACTIONS (2x2) ====== */}
        <div class="grid grid-cols-4 gap-2">
          <a href="/recording" class="card-premium p-3 flex flex-col items-center gap-1.5 hover:shadow-md transition-all active:scale-[0.97] group">
            <div class="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center group-hover:bg-brand-100 transition-colors">
              <i class="fas fa-microphone text-brand-600 text-base"></i>
            </div>
            <span class="text-[10px] font-bold text-surface-700">상담 녹음</span>
          </a>
          <a href="/patients" class="card-premium p-3 flex flex-col items-center gap-1.5 hover:shadow-md transition-all active:scale-[0.97] group">
            <div class="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <i class="fas fa-user-plus text-emerald-600 text-base"></i>
            </div>
            <span class="text-[10px] font-bold text-surface-700">환자 등록</span>
          </a>
          <a href="/consultations" class="card-premium p-3 flex flex-col items-center gap-1.5 hover:shadow-md transition-all active:scale-[0.97] group">
            <div class="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center group-hover:bg-sky-100 transition-colors">
              <i class="fas fa-stethoscope text-sky-600 text-base"></i>
            </div>
            <span class="text-[10px] font-bold text-surface-700">오늘 상담</span>
          </a>
          <a href="/report" class="card-premium p-3 flex flex-col items-center gap-1.5 hover:shadow-md transition-all active:scale-[0.97] group">
            <div class="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
              <i class="fas fa-chart-pie text-purple-600 text-base"></i>
            </div>
            <span class="text-[10px] font-bold text-surface-700">리포트</span>
          </a>
        </div>

        {/* ====== KPI STATS ROW with comparison arrows ====== */}
        <div>
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-bold text-surface-900">금주 현황</h2>
            <a href="/report" class="text-xs font-semibold text-brand-600 flex items-center gap-1 hover:text-brand-700">
              상세 <i class="fas fa-chevron-right text-[8px]"></i>
            </a>
          </div>
          <div class="grid grid-cols-4 gap-2" id="kpiStatsRow">
            <div class="card-premium p-3 text-center"><div class="shimmer h-4 w-8 mx-auto rounded mb-1"></div><div class="shimmer h-3 w-10 mx-auto rounded"></div></div>
            <div class="card-premium p-3 text-center"><div class="shimmer h-4 w-8 mx-auto rounded mb-1"></div><div class="shimmer h-3 w-10 mx-auto rounded"></div></div>
            <div class="card-premium p-3 text-center"><div class="shimmer h-4 w-8 mx-auto rounded mb-1"></div><div class="shimmer h-3 w-10 mx-auto rounded"></div></div>
            <div class="card-premium p-3 text-center"><div class="shimmer h-4 w-8 mx-auto rounded mb-1"></div><div class="shimmer h-3 w-10 mx-auto rounded"></div></div>
          </div>
        </div>

        {/* ====== WEEK PROGRESS + SPARKLINES ====== */}
        <div class="grid grid-cols-2 gap-2.5">
          <div id="weekRevenueRing" class="card-premium p-4 flex flex-col items-center justify-center min-h-[160px]">
            <div class="shimmer h-24 w-24 rounded-full"></div>
          </div>
          <div id="kpiSection" class="space-y-2.5">
            <div class="card-premium p-3"><div class="shimmer h-16 rounded-lg w-full"></div></div>
            <div class="card-premium p-3"><div class="shimmer h-16 rounded-lg w-full"></div></div>
          </div>
        </div>

        {/* ====== TODAY CONTACT LIST ====== */}
        <div>
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center">
                <i class="fas fa-phone-volume text-[10px] text-rose-600"></i>
              </div>
              <h2 class="text-sm font-bold text-surface-900">오늘 연락</h2>
              <span id="contactCount" class="text-[10px] font-bold text-white bg-rose-500 px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-none">0</span>
            </div>
            <button onclick="generateTasks()" class="text-[11px] font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg hover:bg-brand-100 transition-all">
              <i class="fas fa-rotate mr-1 text-[10px]"></i>갱신
            </button>
          </div>
          <div id="contactRevenueBanner" class="hidden mb-2"></div>
          <div id="todayContactsSection" class="space-y-2">
            <div class="card-premium p-4"><div class="shimmer h-14 rounded-lg w-full"></div></div>
          </div>
        </div>

        {/* ====== MVP ====== */}
        <div id="mvpSection" class="hidden"></div>

        {/* ====== RECENT CONSULTATIONS ====== */}
        <div>
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-lg bg-sky-50 flex items-center justify-center">
                <i class="fas fa-clock text-[10px] text-sky-600"></i>
              </div>
              <h2 class="text-sm font-bold text-surface-900">오늘 상담</h2>
            </div>
            <a href="/consultations" class="text-xs font-semibold text-brand-600 flex items-center gap-1 hover:text-brand-700">
              전체 <i class="fas fa-chevron-right text-[8px]"></i>
            </a>
          </div>
          <div id="recentConsultations">
            <div class="card-premium p-5">
              <div class="text-center py-3">
                <div class="w-10 h-10 mx-auto bg-surface-100 rounded-xl flex items-center justify-center mb-2">
                  <i class="fas fa-calendar-check text-surface-300 text-sm"></i>
                </div>
                <p class="text-surface-400 text-sm font-medium">로딩 중...</p>
              </div>
            </div>
          </div>
        </div>

        <div class="h-6" />
      </div>

      {/* Contact Record Modal for Home */}
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

      <script src="/static/pages/home.js"></script>
    </Layout>
  )
}
