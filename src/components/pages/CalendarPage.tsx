import { FC } from 'hono/jsx'
import { Layout, Header } from '../shared/Layout'

export const CalendarPage: FC = () => {
  return (
    <Layout activeTab="consultations">
      <Header
        title="일정 캘린더"
        subtitle="상담 · 연락 · 예약 · 리콜 한눈에"
        rightAction={
          <button id="todayBtn" class="px-3 py-2 bg-brand-50 text-brand-600 text-xs font-bold rounded-xl hover:bg-brand-100 transition-all active:scale-95">
            <i class="fas fa-calendar-day mr-1"></i>오늘
          </button>
        }
      />

      {/* Month Navigation */}
      <section id="calendar-nav" class="px-4 pt-3 pb-1">
        <div class="card-premium p-3 flex items-center justify-between">
          <button id="prevMonthBtn" class="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center text-surface-500 hover:bg-brand-50 hover:text-brand-600 transition-all active:scale-95">
            <i class="fas fa-chevron-left text-sm"></i>
          </button>
          <h2 id="monthTitle" class="text-base font-bold text-surface-900">2026년 7월</h2>
          <button id="nextMonthBtn" class="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center text-surface-500 hover:bg-brand-50 hover:text-brand-600 transition-all active:scale-95">
            <i class="fas fa-chevron-right text-sm"></i>
          </button>
        </div>
      </section>

      {/* Filters */}
      <section id="calendar-filters" class="px-4 py-2">
        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button class="cal-filter-btn active shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all bg-surface-800 text-white" data-type="all">전체</button>
          <button class="cal-filter-btn shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all bg-surface-100 text-surface-600" data-type="consultations">
            <span class="inline-block w-2 h-2 rounded-full bg-brand-500 mr-1"></span>상담
          </button>
          <button class="cal-filter-btn shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all bg-surface-100 text-surface-600" data-type="tasks">
            <span class="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1"></span>연락
          </button>
          <button class="cal-filter-btn shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all bg-surface-100 text-surface-600" data-type="appointments">
            <span class="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1"></span>예약
          </button>
          <button class="cal-filter-btn shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all bg-surface-100 text-surface-600" data-type="retention_contacts">
            <span class="inline-block w-2 h-2 rounded-full bg-rose-500 mr-1"></span>리콜
          </button>
          <label class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-100 cursor-pointer">
            <input type="checkbox" id="myOnlyToggle" class="w-3.5 h-3.5 accent-brand-600" />
            <span class="text-[11px] font-bold text-surface-600">내 것만</span>
          </label>
        </div>
      </section>

      {/* Month Summary */}
      <section id="monthSummary" class="px-4 pb-2">
        <div class="grid grid-cols-4 gap-2">
          <div class="card-premium p-2.5 text-center">
            <p id="sumConsult" class="text-lg font-extrabold text-brand-600">-</p>
            <p class="text-[9px] font-bold text-surface-400 uppercase tracking-wider">상담</p>
          </div>
          <div class="card-premium p-2.5 text-center">
            <p id="sumTasks" class="text-lg font-extrabold text-amber-500">-</p>
            <p class="text-[9px] font-bold text-surface-400 uppercase tracking-wider">연락</p>
          </div>
          <div class="card-premium p-2.5 text-center">
            <p id="sumAppts" class="text-lg font-extrabold text-emerald-500">-</p>
            <p class="text-[9px] font-bold text-surface-400 uppercase tracking-wider">예약</p>
          </div>
          <div class="card-premium p-2.5 text-center">
            <p id="sumPaidAmount" class="text-sm font-extrabold text-surface-900 pt-1">-</p>
            <p class="text-[9px] font-bold text-surface-400 uppercase tracking-wider">결제액</p>
          </div>
        </div>
      </section>

      {/* Calendar Grid */}
      <section id="calendar-grid-section" class="px-4 pb-2">
        <div class="card-premium p-3">
          <div class="grid grid-cols-7 mb-1">
            <div class="text-center text-[10px] font-bold text-rose-400 py-1">일</div>
            <div class="text-center text-[10px] font-bold text-surface-400 py-1">월</div>
            <div class="text-center text-[10px] font-bold text-surface-400 py-1">화</div>
            <div class="text-center text-[10px] font-bold text-surface-400 py-1">수</div>
            <div class="text-center text-[10px] font-bold text-surface-400 py-1">목</div>
            <div class="text-center text-[10px] font-bold text-surface-400 py-1">금</div>
            <div class="text-center text-[10px] font-bold text-sky-400 py-1">토</div>
          </div>
          <div id="calendarGrid" class="grid grid-cols-7 gap-1">
            {/* Populated by calendar.js */}
            <div class="col-span-7 py-10 text-center">
              <div class="shimmer h-4 rounded-lg w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Selected Day Detail */}
      <section id="dayDetailSection" class="px-4 pb-6">
        <div class="flex items-center justify-between mb-2 px-1">
          <h3 id="dayDetailTitle" class="text-sm font-bold text-surface-900">날짜를 선택하세요</h3>
          <span id="dayDetailCount" class="text-[10px] font-bold text-surface-400"></span>
        </div>
        <div id="dayDetailList" class="space-y-2">
          <div class="card-premium p-5 text-center">
            <i class="fas fa-hand-pointer text-surface-300 text-2xl mb-2"></i>
            <p class="text-xs text-surface-400 font-semibold">달력에서 날짜를 탭하면 그 날의 일정이 표시됩니다</p>
          </div>
        </div>
      </section>

      <script src="/static/pages/calendar.js"></script>
    </Layout>
  )
}
