import { FC } from 'hono/jsx'
import { Layout, Header } from '../shared/Layout'

interface Props {
  id: string
}

export const PatientDetailPage: FC<Props> = ({ id }) => {
  return (
    <Layout activeTab="patients">
      <Header title="환자 카드" subtitle="상세 정보" showBack backUrl="/patients" rightAction={
        <button id="editBtn" class="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-50 text-brand-600 hover:bg-brand-100 transition-all active:scale-95">
          <i class="fas fa-pen-to-square text-sm"></i>
        </button>
      } />
      
      {/* Tabs */}
      <div class="px-4 pt-3 flex gap-1.5 sticky top-[52px] z-30 bg-white/80 backdrop-blur-lg pb-2.5">
        <button id="tabInfo" onclick="switchTab('info')" class="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all bg-brand-600 text-white shadow-md">
          <i class="fas fa-user mr-1.5 text-xs"></i>정보
        </button>
        <button id="tabTimeline" onclick="switchTab('timeline')" class="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all bg-surface-100 text-surface-600">
          <i class="fas fa-timeline mr-1.5 text-xs"></i>타임라인
        </button>
        <button id="tabRetention" onclick="switchTab('retention')" class="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all bg-surface-100 text-surface-600">
          <i class="fas fa-heart-pulse mr-1.5 text-xs"></i>리텐션
        </button>
      </div>

      <div id="patientDetail" class="px-4 py-3 space-y-3 pb-24">
        <div class="space-y-3 stagger-children">
          <div class="card-premium p-5"><div class="flex gap-4"><div class="w-16 h-16 shimmer rounded-2xl"></div><div class="flex-1 space-y-2"><div class="shimmer h-5 rounded-lg w-1/2"></div><div class="shimmer h-4 rounded-lg w-2/3"></div></div></div></div>
          <div class="card-premium p-5"><div class="shimmer h-5 rounded-lg w-1/3 mb-3"></div><div class="shimmer h-20 rounded-lg w-full"></div></div>
        </div>
      </div>

      <div id="retentionDetail" class="px-4 py-3 space-y-3 pb-24 hidden">
        <div class="space-y-3 stagger-children">
          <div class="card-premium p-5"><div class="shimmer h-5 rounded-lg w-1/3 mb-3"></div><div class="shimmer h-20 rounded-lg w-full"></div></div>
        </div>
      </div>

      {/* Feature 6: Timeline View */}
      <div id="timelineDetail" class="px-4 py-3 space-y-3 pb-24 hidden">
        {/* Consultation Amount Chart */}
        <div id="consultChartSection" class="card-premium p-4 hidden">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center">
              <i class="fas fa-chart-bar text-brand-600 text-xs"></i>
            </div>
            <h3 class="text-sm font-bold text-surface-900">상담 금액 추이</h3>
          </div>
          <canvas id="patientConsultChart" height="140"></canvas>
        </div>

        {/* Summary Stats */}
        <div id="timelineSummary" class="grid grid-cols-3 gap-2 hidden">
          <div class="card-premium p-3 text-center">
            <p id="tlTotalConsult" class="text-lg font-black text-brand-600">0</p>
            <p class="text-[9px] font-semibold text-surface-400">총 상담</p>
          </div>
          <div class="card-premium p-3 text-center">
            <p id="tlTotalAmount" class="text-lg font-black text-emerald-600">0</p>
            <p class="text-[9px] font-semibold text-surface-400">총 금액</p>
          </div>
          <div class="card-premium p-3 text-center">
            <p id="tlAvgScore" class="text-lg font-black text-purple-600">-</p>
            <p class="text-[9px] font-semibold text-surface-400">평균 점수</p>
          </div>
        </div>

        <div class="card-premium p-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold text-surface-900"><i class="fas fa-timeline text-brand-500 mr-2 text-xs"></i>환자 여정 타임라인</h3>
            <span id="timelineCount" class="text-[10px] font-bold bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">0건</span>
          </div>
          <div id="timelineContent" class="space-y-0">
            <div class="shimmer h-20 rounded-lg w-full mb-2"></div>
            <div class="shimmer h-20 rounded-lg w-full"></div>
          </div>
        </div>
        {/* Feature 9: Consultation Comparison */}
        <div id="comparisonSection" class="hidden">
          <div class="card-premium p-4">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                <i class="fas fa-code-compare text-purple-600 text-xs"></i>
              </div>
              <h3 class="text-sm font-bold text-surface-900">상담 비교 분석</h3>
            </div>
            <div id="comparisonContent"></div>
          </div>
        </div>
      </div>

      {/* 치료 등록 모달 */}
      <div id="treatmentModal" class="hidden fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
        <div class="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg p-6 animate-slide-up max-h-[85vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-5">
            <h3 class="text-lg font-bold text-surface-900">
              <i class="fas fa-tooth text-brand-500 mr-2"></i>치료 등록
            </h3>
            <button onclick="closeTreatmentModal()" class="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-500 transition-all active:scale-95">
              <i class="fas fa-xmark"></i>
            </button>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">치료 유형 *</label>
              <select id="treatType" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all">
                <option value="implant">임플란트</option>
                <option value="ortho">교정</option>
                <option value="prosthetic">보철</option>
                <option value="endo">신경치료</option>
                <option value="extraction">발치</option>
                <option value="scaling">스케일링</option>
                <option value="whitening">미백</option>
                <option value="laminate">라미네이트</option>
                <option value="general">일반진료</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">세부 치료명</label>
              <input type="text" id="treatName" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all" placeholder="예: 임플란트 #36 식립" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">상태</label>
              <select id="treatStatus" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all">
                <option value="consulted">상담 완료</option>
                <option value="scheduled">예약됨</option>
                <option value="in_progress">진행중</option>
                <option value="completed">완료</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-semibold text-surface-700 mb-1.5">총 치료비</label>
                <input type="number" id="treatTotalAmount" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all" placeholder="0" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-surface-700 mb-1.5">수납 금액</label>
                <input type="number" id="treatPaidAmount" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all" placeholder="0" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-semibold text-surface-700 mb-1.5">치료 시작일</label>
                <input type="date" id="treatStartDate" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-surface-700 mb-1.5">다음 예약일</label>
                <input type="date" id="treatNextAppt" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">메모</label>
              <textarea id="treatNotes" rows={2} class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all resize-none" placeholder="치료 관련 메모"></textarea>
            </div>
            <button onclick="saveTreatment()" class="w-full bg-gradient-brand text-white font-semibold py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-brand-600/20">
              <i class="fas fa-plus-circle mr-2"></i>치료 등록
            </button>
          </div>
        </div>
      </div>

      {/* 환자 수정 모달 */}
      <div id="editPatientModal" class="hidden fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
        <div class="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg p-6 animate-slide-up max-h-[85vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-5">
            <h3 class="text-lg font-bold text-surface-900">
              <i class="fas fa-pen-to-square text-brand-500 mr-2"></i>환자 정보 수정
            </h3>
            <button onclick="closeEditModal()" class="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-500 transition-all active:scale-95">
              <i class="fas fa-xmark"></i>
            </button>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">이름 *</label>
              <input type="text" id="editName" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all" placeholder="환자 이름" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-semibold text-surface-700 mb-1.5">나이</label>
                <input type="number" id="editAge" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all" placeholder="나이" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-surface-700 mb-1.5">성별</label>
                <select id="editGender" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all">
                  <option value="">미지정</option>
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">전화번호</label>
              <input type="tel" id="editPhone" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all" placeholder="010-0000-0000" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">내원 경로</label>
              <select id="editReferral" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all">
                <option value="">선택</option>
                <option value="온라인광고">온라인 광고</option>
                <option value="네이버검색">네이버 검색</option>
                <option value="인스타그램">인스타그램</option>
                <option value="유튜브">유튜브</option>
                <option value="지인소개">지인 소개</option>
                <option value="간판">간판/도보</option>
                <option value="블로그">블로그</option>
                <option value="카페/커뮤니티">카페/커뮤니티</option>
                <option value="재내원">재내원</option>
                <option value="기타">기타</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">지역</label>
              <input type="text" id="editRegion" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all" placeholder="예: 강남구, 서초구" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">태그 <span class="font-normal text-surface-400">(쉼표로 구분)</span></label>
              <input type="text" id="editTags" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all" placeholder="임플란트, VIP, 소개환자" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">메모</label>
              <textarea id="editMemo" rows={3} class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all resize-none" placeholder="환자 관련 메모"></textarea>
            </div>
            <button onclick="savePatientEdit()" id="saveEditBtn" class="w-full bg-gradient-brand text-white font-semibold py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-brand-600/20">
              <i class="fas fa-check mr-2"></i>저장
            </button>
          </div>
        </div>
      </div>

      {/* 연락 기록 모달 */}
      <div id="retContactModal" class="hidden fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
        <div class="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg p-6 animate-slide-up">
          <div class="flex justify-between items-center mb-5">
            <h3 class="text-lg font-bold text-surface-900">연락 결과 기록</h3>
            <button onclick="closeRetContactModal()" class="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-500 transition-all active:scale-95">
              <i class="fas fa-xmark"></i>
            </button>
          </div>
          <input type="hidden" id="retModalTreatId" />
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">연락 방법</label>
              <div class="flex gap-2">
                <button class="ret-ct-btn flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-brand-500 text-brand-600 bg-brand-50 transition-all" data-type="phone" onclick="selectRetContactType('phone')"><i class="fas fa-phone mr-1.5"></i>전화</button>
                <button class="ret-ct-btn flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-surface-200 text-surface-600 transition-all" data-type="text" onclick="selectRetContactType('text')"><i class="fas fa-comment mr-1.5"></i>문자</button>
                <button class="ret-ct-btn flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-surface-200 text-surface-600 transition-all" data-type="kakao" onclick="selectRetContactType('kakao')"><i class="fas fa-comment-dots mr-1.5"></i>카카오</button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">결과</label>
              <select id="retContactResult" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all">
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
              <textarea id="retContactNotes" rows={3} class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all resize-none" placeholder="연락 내용 메모"></textarea>
            </div>
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">다음 연락 예정일</label>
              <input type="date" id="retNextContact" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all" />
            </div>
            <button onclick="saveRetContact()" class="w-full bg-gradient-brand text-white font-semibold py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-brand-600/20">
              <i class="fas fa-check mr-2"></i>기록 저장
            </button>
          </div>
        </div>
      </div>

      <script src="/static/pages/patient-detail.js"></script>
    </Layout>
  )
}
