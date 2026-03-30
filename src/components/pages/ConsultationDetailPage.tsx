import { FC } from 'hono/jsx'
import { Layout, Header, Badge } from '../shared/Layout'

interface Props {
  id: string
}

export const ConsultationDetailPage: FC<Props> = ({ id }) => {
  return (
    <Layout activeTab="consultations">
      <Header title="상담 노트" subtitle="AI 분석 결과" showBack backUrl="/consultations" rightAction={
        <button id="editBtn" class="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-50 text-brand-600 hover:bg-brand-100 transition-all active:scale-95">
          <i class="fas fa-pen-to-square text-sm"></i>
        </button>
      } />
      
      <div id="consultationDetail" class="px-4 py-4 space-y-3 pb-32">
        {/* Skeleton Loading */}
        <div class="space-y-3 stagger-children">
          <div class="card-premium p-5"><div class="shimmer h-6 rounded-lg w-2/3 mb-3"></div><div class="shimmer h-4 rounded-lg w-full mb-2"></div><div class="shimmer h-4 rounded-lg w-4/5"></div></div>
          <div class="card-premium p-5"><div class="shimmer h-6 rounded-lg w-1/2 mb-3"></div><div class="shimmer h-20 rounded-lg w-full"></div></div>
          <div class="card-premium p-5"><div class="shimmer h-6 rounded-lg w-2/5 mb-3"></div><div class="shimmer h-16 rounded-lg w-full"></div></div>
        </div>
      </div>

      {/* Link Patient Modal */}
      <div id="linkPatientModal" class="hidden fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
        <div class="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg p-6 max-h-[85vh] overflow-y-auto animate-slide-up">
          <div class="flex justify-between items-center mb-5">
            <h3 class="text-lg font-bold text-surface-900">환자 연결</h3>
            <button onclick="closeLinkModal()" class="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-500 transition-all active:scale-95">
              <i class="fas fa-xmark"></i>
            </button>
          </div>

          {/* Tabs */}
          <div class="flex gap-2 mb-5 p-1 bg-surface-100 rounded-xl">
            <button id="tabExisting" class="flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all bg-white text-surface-900 shadow-sm" onclick="showExistingTab()">
              기존 환자
            </button>
            <button id="tabNew" class="flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all text-surface-500 hover:text-surface-700" onclick="showNewTab()">
              새 환자 등록
            </button>
          </div>

          {/* Existing Patient List */}
          <div id="existingPatientArea">
            <div class="relative mb-4">
              <input type="text" id="patientSearch" placeholder="환자 이름 또는 연락처 검색" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 outline-none pl-10 text-sm transition-all" oninput="filterPatients(this.value)" />
              <i class="fas fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 text-sm"></i>
            </div>
            <div id="patientList" class="space-y-2 max-h-60 overflow-y-auto"></div>
          </div>

          {/* New Patient Form */}
          <div id="newPatientArea" class="hidden">
            <form id="linkNewPatientForm" class="space-y-4" onsubmit="return createAndLinkPatient(event)">
              <div>
                <label class="block text-sm font-semibold text-surface-700 mb-1.5">이름 *</label>
                <input type="text" name="name" required class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 outline-none text-sm transition-all" placeholder="환자 이름" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-surface-700 mb-1.5">연락처</label>
                <input type="tel" name="phone" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 outline-none text-sm transition-all" placeholder="010-0000-0000" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-semibold text-surface-700 mb-1.5">나이</label>
                  <input type="number" name="age" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 outline-none text-sm transition-all" placeholder="나이" />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-surface-700 mb-1.5">성별</label>
                  <select name="gender" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 outline-none text-sm transition-all">
                    <option value="">선택</option>
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                  </select>
                </div>
              </div>
              <button type="submit" class="w-full bg-gradient-brand text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98] shadow-md shadow-brand-600/20">
                환자 등록 후 연결
              </button>
            </form>
          </div>
        </div>
      </div>

      <script src="/static/pages/consultation-detail.js"></script>
    </Layout>
  )
}
