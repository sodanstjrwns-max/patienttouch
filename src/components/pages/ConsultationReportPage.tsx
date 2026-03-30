import { FC } from 'hono/jsx'
import { Layout, Header } from '../shared/Layout'

interface Props {
  id: string
}

export const ConsultationReportPage: FC<Props> = ({ id }) => {
  return (
    <Layout activeTab="consultations">
      <Header title="AI 상담 레포트" subtitle="상세 분석 리포트" showBack backUrl={`/consultations/${id}`} rightAction={
        <button id="shareBtn" class="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-50 text-brand-600 hover:bg-brand-100 transition-all active:scale-95">
          <i class="fas fa-share-nodes text-sm"></i>
        </button>
      } />
      
      <div id="reportContent" class="px-4 py-4 space-y-3 pb-32">
        <div class="space-y-3 stagger-children">
          <div class="card-premium p-5"><div class="shimmer h-5 rounded-lg w-2/3 mb-3"></div><div class="shimmer h-16 rounded-lg w-full"></div></div>
          <div class="card-premium p-5"><div class="shimmer h-5 rounded-lg w-1/2 mb-3"></div><div class="shimmer h-24 rounded-lg w-full"></div></div>
          <div class="card-premium p-5"><div class="shimmer h-5 rounded-lg w-2/5 mb-3"></div><div class="shimmer h-20 rounded-lg w-full"></div></div>
          <div class="card-premium p-5"><div class="shimmer h-5 rounded-lg w-3/5 mb-3"></div><div class="shimmer h-28 rounded-lg w-full"></div></div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div id="bottomActions" class="fixed bottom-0 left-0 right-0 z-40 hidden">
        <div class="max-w-lg mx-auto px-4 pb-6">
          <div class="glass rounded-2xl shadow-float border border-white/60 p-3 flex gap-2">
            <button id="createProposalBtn" class="flex-1 bg-gradient-brand text-white font-semibold py-3 px-4 rounded-xl transition-all active:scale-[0.98] shadow-md shadow-brand-600/20 flex items-center justify-center gap-2 text-sm">
              <i class="fas fa-file-invoice"></i>제안서 생성
            </button>
            <button id="regenerateBtn" class="w-12 bg-surface-100 hover:bg-surface-200 text-surface-600 font-medium py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center">
              <i class="fas fa-arrows-rotate text-sm"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Proposal Modal */}
      <div id="proposalModal" class="hidden fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
        <div class="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-6 animate-slide-up">
          <div class="text-center mb-5">
            <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <i class="fas fa-check text-white text-2xl"></i>
            </div>
            <h3 class="text-lg font-bold text-surface-900">제안서 생성 완료!</h3>
            <p class="text-surface-500 text-sm mt-1">환자에게 공유할 수 있는 치료 제안서가 생성되었습니다</p>
          </div>
          <div class="bg-surface-50 rounded-xl p-3 mb-5">
            <p class="text-[10px] text-surface-400 font-semibold uppercase tracking-wider mb-1.5">공유 링크</p>
            <div class="flex items-center gap-2">
              <input id="proposalUrl" type="text" readonly class="flex-1 text-sm bg-white border border-surface-200 rounded-lg px-3 py-2 outline-none" />
              <button onclick="copyProposalUrl()" class="px-3 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 transition-all active:scale-95">복사</button>
            </div>
          </div>
          <div class="flex gap-2">
            <button onclick="sendViaKakao()" class="flex-1 bg-[#FEE500] hover:brightness-95 text-[#3C1E1E] font-semibold py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm">
              <i class="fas fa-comment"></i>카카오톡
            </button>
            <button onclick="closeProposalModal()" class="flex-1 bg-surface-100 hover:bg-surface-200 text-surface-700 font-semibold py-3 rounded-xl transition-all active:scale-[0.98] text-sm">
              닫기
            </button>
          </div>
        </div>
      </div>

      <script src="/static/pages/consultation-report.js"></script>
    </Layout>
  )
}
