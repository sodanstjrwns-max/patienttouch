import { FC } from 'hono/jsx'
import { Layout, Header } from '../shared/Layout'

// ============================================
// 터치 리포트 — 실장 검수 화면 (/touch-reports/:id/review)
// 제작서 §3.3: 미리보기 + 근거 패널 + 확인필요 배지 + 인라인 수정
// 핵심 규칙: 배지가 하나라도 남으면 발송 버튼 비활성화. 자동 발송 없음.
// ============================================

export const TouchReportReviewPage: FC<{ id: string }> = ({ id }) => {
  return (
    <Layout activeTab="consultations">
      <Header title="리포트 검수" subtitle="환자에게 발송 전 최종 확인" showBack backUrl="/touch-reports" />

      <div id="trvContainer" class="px-4 py-4 pb-40">
        {/* Skeleton */}
        <div id="trvSkeleton" class="space-y-3">
          <div class="card-premium p-5"><div class="shimmer h-6 rounded-lg w-2/3 mb-3"></div><div class="shimmer h-4 rounded-lg w-full mb-2"></div><div class="shimmer h-4 rounded-lg w-4/5"></div></div>
          <div class="card-premium p-5"><div class="shimmer h-6 rounded-lg w-1/2 mb-3"></div><div class="shimmer h-20 rounded-lg w-full"></div></div>
        </div>

        {/* 상태 헤더 (JS 렌더) */}
        <div id="trvStatus" class="hidden mb-4"></div>

        {/* 확인 필요 배지 요약 */}
        <div id="trvFlagSummary" class="hidden mb-4"></div>

        {/* 보고서 미리보기 + 인라인 수정 영역 */}
        <div id="trvPreview" class="hidden space-y-3"></div>
      </div>

      {/* 하단 고정 액션 바 */}
      <div id="trvActionBar" class="hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-surface-200 px-4 py-3 safe-area-bottom">
        <div class="max-w-lg mx-auto flex items-center gap-3">
          <div id="trvActionInfo" class="flex-1 min-w-0 text-xs text-surface-500 leading-snug"></div>
          <button id="trvApproveBtn" class="hidden px-5 py-3 rounded-xl bg-gradient-brand text-white font-bold text-sm shadow-md shadow-brand-600/20 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none">
            <i class="fas fa-check mr-1.5"></i>발송 승인
          </button>
          <button id="trvSendBtn" class="hidden px-5 py-3 rounded-xl bg-gradient-brand text-white font-bold text-sm shadow-md shadow-brand-600/20 active:scale-[0.98] transition-all">
            <i class="fas fa-paper-plane mr-1.5"></i>발송하기
          </button>
        </div>
      </div>

      {/* 근거 패널 (바텀시트) */}
      <div id="trvEvidenceModal" class="hidden fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onclick="if(event.target===this)window.trvCloseEvidence()">
        <div class="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg p-6 max-h-[80vh] overflow-y-auto animate-slide-up">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-base font-bold text-surface-900"><i class="fas fa-quote-left text-brand-500 mr-2"></i>녹취 근거</h3>
            <button onclick="window.trvCloseEvidence()" class="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-500 transition-all active:scale-95"><i class="fas fa-xmark"></i></button>
          </div>
          <div id="trvEvidenceBody"></div>
        </div>
      </div>

      {/* 인라인 수정 모달 */}
      <div id="trvEditModal" class="hidden fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onclick="if(event.target===this)window.trvCloseEdit()">
        <div class="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg p-6 animate-slide-up">
          <div class="flex justify-between items-center mb-4">
            <h3 id="trvEditTitle" class="text-base font-bold text-surface-900">내용 수정</h3>
            <button onclick="window.trvCloseEdit()" class="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-500 transition-all active:scale-95"><i class="fas fa-xmark"></i></button>
          </div>
          <div id="trvEditFlagInfo" class="hidden mb-3"></div>
          <textarea id="trvEditInput" rows={4} class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 outline-none text-sm transition-all resize-none"></textarea>
          <div class="flex gap-2 mt-4">
            <button id="trvEditResolveBtn" class="hidden flex-1 py-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-sm active:scale-[0.98] transition-all">수정 없이 확인 완료</button>
            <button id="trvEditSaveBtn" class="flex-1 py-3 rounded-xl bg-gradient-brand text-white font-bold text-sm shadow-md shadow-brand-600/20 active:scale-[0.98] transition-all">저장</button>
          </div>
        </div>
      </div>

      {/* 발송 모달 (auth_hint 입력) */}
      <div id="trvSendModal" class="hidden fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onclick="if(event.target===this)window.trvCloseSend()">
        <div class="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg p-6 animate-slide-up">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-base font-bold text-surface-900"><i class="fas fa-paper-plane text-brand-500 mr-2"></i>보고서 발송</h3>
            <button onclick="window.trvCloseSend()" class="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-500 transition-all active:scale-95"><i class="fas fa-xmark"></i></button>
          </div>
          <div id="trvSendAuthArea" class="mb-4">
            <label class="block text-sm font-semibold text-surface-700 mb-1.5">열람 인증번호 (생년월일 뒤 4자리)</label>
            <input id="trvSendAuthInput" type="tel" maxlength={4} inputmode="numeric" placeholder="예: 0815" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 outline-none text-sm transition-all text-center tracking-[0.3em] font-bold" />
            <p class="text-xs text-surface-400 mt-1.5">환자가 보고서를 열 때 입력해야 하는 번호입니다. 비워두면 인증 없이 열람됩니다.</p>
          </div>
          <button id="trvSendConfirmBtn" class="w-full py-3.5 rounded-xl bg-gradient-brand text-white font-bold text-sm shadow-md shadow-brand-600/20 active:scale-[0.98] transition-all">
            발송 확정
          </button>
          <div id="trvSendResult" class="hidden mt-4"></div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `window.__REPORT_ID__ = ${JSON.stringify(id)};` }} />
      <script src="/static/pages/touch-report-review.js"></script>
    </Layout>
  )
}
