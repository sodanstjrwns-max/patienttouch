import { FC } from 'hono/jsx'
import { Layout, Header, Card, Badge, Button, SectionTitle } from '../shared/Layout'

export const ConsultationsPage: FC = () => {
  return (
    <Layout activeTab="consultations">
      <Header 
        title="상담 관리" 
        subtitle="AI 분석 기반 상담 기록"
        rightAction={
          <div class="flex items-center gap-2">
            <button id="addManualBtn" class="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-500/20 active:scale-95 transition-transform" title="수동 기록">
              <i class="fas fa-pen-to-square text-sm"></i>
            </button>
            <a href="/recording" class="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center text-white shadow-md shadow-brand-600/20 active:scale-95 transition-transform">
              <i class="fas fa-microphone text-sm"></i>
            </a>
          </div>
        }
      />

      {/* Search + Advanced Toggle */}
      <div class="px-4 pt-3 pb-1">
        <div class="relative">
          <i class="fas fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 text-sm"></i>
          <input id="consultSearch" type="text" placeholder="환자명, 치료유형, 상담사 검색" class="w-full pl-11 pr-32 py-2.5 bg-white border border-surface-200 rounded-xl text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder-surface-400" />
          <button id="transcriptSearchToggle" class="absolute right-16 top-1/2 -translate-y-1/2 px-2.5 py-1.5 text-[10px] font-bold bg-surface-100 text-surface-500 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-95" title="상담 원문에서 키워드 검색">
            <i class="fas fa-scroll mr-1"></i>원문
          </button>
          <button id="advFilterToggle" class="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 text-[10px] font-bold bg-surface-100 text-surface-500 rounded-lg hover:bg-brand-50 hover:text-brand-600 transition-all active:scale-95">
            <i class="fas fa-sliders mr-1"></i>필터
          </button>
        </div>
        <div id="transcriptSearchHint" class="hidden mt-1.5 px-1">
          <p class="text-[10px] text-indigo-600 font-semibold"><i class="fas fa-wand-magic-sparkles mr-1"></i>원문 검색 모드 — 상담 스크립트 전문에서 키워드를 찾습니다 (예: "임플란트 가격")</p>
        </div>
      </div>

      {/* Transcript Search Results */}
      <div id="transcriptSearchResults" class="hidden px-4 pb-2"></div>

      {/* Advanced Filter Panel (hidden by default) */}
      <div id="advFilterPanel" class="hidden px-4 pb-2 animate-slide-down">
        <div class="card-premium p-4 space-y-3 border-brand-200/50 bg-brand-50/20">
          {/* Date Range */}
          <div>
            <label class="block text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1.5">상담 기간</label>
            <div class="grid grid-cols-2 gap-2">
              <input type="date" id="filterDateFrom" class="px-3 py-2 bg-white border border-surface-200 rounded-lg text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all" />
              <input type="date" id="filterDateTo" class="px-3 py-2 bg-white border border-surface-200 rounded-lg text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all" />
            </div>
            <div class="flex gap-1.5 mt-1.5">
              <button class="date-quick-btn text-[9px] font-bold px-2 py-1 rounded-md bg-surface-100 text-surface-500 hover:bg-brand-50 hover:text-brand-600 transition-all" data-range="today">오늘</button>
              <button class="date-quick-btn text-[9px] font-bold px-2 py-1 rounded-md bg-surface-100 text-surface-500 hover:bg-brand-50 hover:text-brand-600 transition-all" data-range="week">이번 주</button>
              <button class="date-quick-btn text-[9px] font-bold px-2 py-1 rounded-md bg-surface-100 text-surface-500 hover:bg-brand-50 hover:text-brand-600 transition-all" data-range="month">이번 달</button>
              <button class="date-quick-btn text-[9px] font-bold px-2 py-1 rounded-md bg-surface-100 text-surface-500 hover:bg-brand-50 hover:text-brand-600 transition-all" data-range="3months">최근 3개월</button>
            </div>
          </div>
          {/* Amount Range + Score */}
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1.5">금액 범위 (만원)</label>
              <div class="flex items-center gap-1.5">
                <input type="number" id="filterAmountMin" placeholder="0" class="w-full px-2.5 py-2 bg-white border border-surface-200 rounded-lg text-xs outline-none focus:border-brand-500 transition-all" />
                <span class="text-surface-300 text-xs">~</span>
                <input type="number" id="filterAmountMax" placeholder="∞" class="w-full px-2.5 py-2 bg-white border border-surface-200 rounded-lg text-xs outline-none focus:border-brand-500 transition-all" />
              </div>
            </div>
            <div>
              <label class="block text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1.5">코칭 점수</label>
              <div class="flex items-center gap-1.5">
                <input type="number" id="filterScoreMin" placeholder="0" min="0" max="100" class="w-full px-2.5 py-2 bg-white border border-surface-200 rounded-lg text-xs outline-none focus:border-brand-500 transition-all" />
                <span class="text-surface-300 text-xs">~</span>
                <input type="number" id="filterScoreMax" placeholder="100" min="0" max="100" class="w-full px-2.5 py-2 bg-white border border-surface-200 rounded-lg text-xs outline-none focus:border-brand-500 transition-all" />
              </div>
            </div>
          </div>
          {/* Treatment Type + Sort */}
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1.5">치료 유형</label>
              <select id="filterTreatType" class="w-full px-2.5 py-2 bg-white border border-surface-200 rounded-lg text-xs outline-none focus:border-brand-500 transition-all">
                <option value="">전체</option>
                <option value="임플란트">임플란트</option>
                <option value="교정">교정</option>
                <option value="보철">보철</option>
                <option value="심미">심미</option>
                <option value="신경치료">신경치료</option>
                <option value="발치">발치</option>
                <option value="스케일링">스케일링</option>
                <option value="미백">미백</option>
                <option value="라미네이트">라미네이트</option>
                <option value="일반">일반</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1.5">정렬</label>
              <select id="filterSort" class="w-full px-2.5 py-2 bg-white border border-surface-200 rounded-lg text-xs outline-none focus:border-brand-500 transition-all">
                <option value="date_desc">최신순</option>
                <option value="date_asc">오래된순</option>
                <option value="amount_desc">금액 높은순</option>
                <option value="amount_asc">금액 낮은순</option>
                <option value="score_desc">코칭점수 높은순</option>
                <option value="score_asc">코칭점수 낮은순</option>
                <option value="decision_desc">결정도 높은순</option>
              </select>
            </div>
          </div>
          {/* Action Buttons */}
          <div class="flex gap-2 pt-1">
            <button id="applyAdvFilter" class="flex-1 py-2.5 bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-600/20 active:scale-[0.97] transition-all">
              <i class="fas fa-search mr-1"></i>필터 적용
            </button>
            <button id="resetAdvFilter" class="px-4 py-2.5 bg-surface-100 text-surface-600 text-xs font-bold rounded-xl hover:bg-surface-200 transition-all active:scale-[0.97]">
              <i class="fas fa-rotate-right mr-1"></i>초기화
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      <div id="activeFilters" class="hidden px-4 pb-1">
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar" id="activeFilterTags"></div>
      </div>

      {/* Summary Stats */}
      <div id="consultStats" class="px-4 pt-2 pb-1">
        <div class="flex items-center gap-3">
          <span id="consultCount" class="text-xs font-semibold text-surface-500"></span>
          <span id="consultTotalAmount" class="text-xs font-bold text-brand-600"></span>
        </div>
      </div>

      {/* Status Filters */}
      <div class="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button class="filter-btn active shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all bg-brand-600 text-white shadow-md shadow-brand-600/20" data-status="all">전체</button>
        <button class="filter-btn shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all bg-surface-100 text-surface-600 hover:bg-surface-200" data-status="pending">대기중</button>
        <button class="filter-btn shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all bg-surface-100 text-surface-600 hover:bg-surface-200" data-status="undecided">미결정</button>
        <button class="filter-btn shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all bg-surface-100 text-surface-600 hover:bg-surface-200" data-status="paid">결제완료</button>
        <button class="filter-btn shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all bg-surface-100 text-surface-600 hover:bg-surface-200" data-status="lost">이탈</button>
      </div>

      {/* Chart Panel (mini) */}
      <div id="chartPanel" class="px-4 py-1 hidden">
        <div class="card-premium p-3">
          <canvas id="miniChart" height="100"></canvas>
        </div>
      </div>

      <div class="px-4 pb-6">
        <div id="consultationList" class="space-y-2">
          <div class="space-y-2">
            <div class="card-premium p-5"><div class="shimmer h-4 rounded-lg w-2/3 mb-3"></div><div class="shimmer h-3 rounded-lg w-full mb-2"></div><div class="shimmer h-3 rounded-lg w-4/5"></div></div>
            <div class="card-premium p-5"><div class="shimmer h-4 rounded-lg w-2/3 mb-3"></div><div class="shimmer h-3 rounded-lg w-full mb-2"></div><div class="shimmer h-3 rounded-lg w-4/5"></div></div>
          </div>
        </div>
      </div>

      {/* Manual Consultation Modal */}
      <div id="manualModal" class="hidden fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
        <div class="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-5">
            <h3 class="text-lg font-bold text-surface-900">수동 상담 기록</h3>
            <button onclick="closeManualModal()" class="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-500 transition-all active:scale-95">
              <i class="fas fa-xmark"></i>
            </button>
          </div>
          <form id="manualForm" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-surface-600 mb-1.5">환자 선택 *</label>
              <select id="mPatient" required class="w-full px-4 py-3 border border-surface-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all bg-white text-sm">
                <option value="">환자를 선택하세요</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-surface-600 mb-1.5">치료 유형</label>
                <select id="mTreatType" class="w-full px-4 py-3 border border-surface-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all bg-white text-sm">
                  <option value="">선택</option>
                  <option value="임플란트">임플란트</option>
                  <option value="교정">교정</option>
                  <option value="보철">보철</option>
                  <option value="심미">심미</option>
                  <option value="신경치료">신경치료</option>
                  <option value="발치">발치</option>
                  <option value="스케일링">스케일링</option>
                  <option value="미백">미백</option>
                  <option value="라미네이트">라미네이트</option>
                  <option value="일반">일반</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-surface-600 mb-1.5">상담 금액 (원)</label>
                <input type="number" id="mAmount" class="w-full px-4 py-3 border border-surface-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all text-sm" placeholder="5000000" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-surface-600 mb-1.5">상태</label>
                <select id="mStatus" class="w-full px-4 py-3 border border-surface-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all bg-white text-sm">
                  <option value="undecided">미결정</option>
                  <option value="paid">결제완료</option>
                  <option value="lost">이탈</option>
                  <option value="pending">대기</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-surface-600 mb-1.5">상담일시</label>
                <input type="datetime-local" id="mDate" class="w-full px-4 py-3 border border-surface-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all text-sm" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-surface-600 mb-1.5">메모 / 요약</label>
              <textarea id="mSummary" rows={3} class="w-full px-4 py-3 border border-surface-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all resize-none text-sm" placeholder="상담 내용 요약"></textarea>
            </div>
            <button type="submit" class="w-full bg-gradient-brand text-white font-bold py-3.5 rounded-xl shadow-md shadow-brand-600/20 active:scale-[0.97] transition-all">
              <i class="fas fa-check mr-2"></i>기록 저장
            </button>
          </form>
        </div>
      </div>

      <script src="/static/pages/consultations.js"></script>
    </Layout>
  )
}
