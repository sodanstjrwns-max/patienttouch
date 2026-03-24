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

      <script dangerouslySetInnerHTML={{
        __html: `
          var patientId = '${id}';
          var currentTab = 'info';
          var retentionData = null;
          var retContactType = 'phone';
          var currentPatient = null;

          var statusMap = {
            unscheduled_urgent: { label: '미예약 긴급', icon: 'fa-exclamation-triangle', bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200', color: 'rose' },
            unscheduled_warning: { label: '미예약 주의', icon: 'fa-clock', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', color: 'amber' },
            recall_6m: { label: '6개월 리콜', icon: 'fa-calendar-check', bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-200', color: 'sky' },
            recall_12m: { label: '12개월 리콜', icon: 'fa-calendar-days', bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-200', color: 'sky' },
            at_risk: { label: '이탈 위험', icon: 'fa-heart-crack', bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200', color: 'red' },
            consulted_unconverted: { label: '상담 미전환', icon: 'fa-comment-slash', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', color: 'amber' },
            in_treatment: { label: '치료중', icon: 'fa-stethoscope', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', color: 'emerald' },
            active: { label: '정상', icon: 'fa-check', bg: 'bg-surface-50', text: 'text-surface-600', ring: 'ring-surface-200', color: 'surface' },
            completed: { label: '완료', icon: 'fa-check-double', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', color: 'emerald' }
          };

          var treatTypeMap = {
            implant: '임플란트', ortho: '교정', prosthetic: '보철', endo: '신경치료',
            extraction: '발치', scaling: '스케일링', whitening: '미백', laminate: '라미네이트', general: '일반'
          };

          var treatStatusMap = {
            consulted: { label: '상담완료', bg: 'bg-surface-100', text: 'text-surface-600' },
            scheduled: { label: '예약됨', bg: 'bg-sky-50', text: 'text-sky-700' },
            in_progress: { label: '진행중', bg: 'bg-brand-50', text: 'text-brand-700' },
            completed: { label: '완료', bg: 'bg-emerald-50', text: 'text-emerald-700' },
            abandoned: { label: '중단', bg: 'bg-rose-50', text: 'text-rose-700' }
          };

          function switchTab(tab) {
            currentTab = tab;
            document.getElementById('tabInfo').className = tab === 'info' 
              ? 'flex-1 py-2.5 text-sm font-bold rounded-xl transition-all bg-brand-600 text-white shadow-md'
              : 'flex-1 py-2.5 text-sm font-bold rounded-xl transition-all bg-surface-100 text-surface-600';
            document.getElementById('tabRetention').className = tab === 'retention'
              ? 'flex-1 py-2.5 text-sm font-bold rounded-xl transition-all bg-brand-600 text-white shadow-md'
              : 'flex-1 py-2.5 text-sm font-bold rounded-xl transition-all bg-surface-100 text-surface-600';
            document.getElementById('patientDetail').classList.toggle('hidden', tab !== 'info');
            document.getElementById('retentionDetail').classList.toggle('hidden', tab !== 'retention');
            if (tab === 'retention' && !retentionData) loadRetention();
          }

          async function loadPatient() {
            try {
              var authRes = await fetch('/api/auth/me');
              if (!authRes.ok) { window.location.href = '/login'; return; }

              var res = await fetch('/api/patients/' + patientId);
              if (res.status === 401) { window.location.href = '/login'; return; }
              var data = await res.json();

              if (data.success) { currentPatient = data.data; renderPatient(data.data); }
              else {
                document.getElementById('patientDetail').innerHTML =
                  '<div class="text-center py-16 animate-fade-in">' +
                    '<div class="w-20 h-20 mx-auto mb-5 rounded-2xl bg-surface-100 flex items-center justify-center"><i class="fas fa-user-slash text-3xl text-surface-300"></i></div>' +
                    '<h3 class="text-lg font-bold text-surface-800 mb-1">환자 정보를 찾을 수 없습니다</h3>' +
                    '<a href="/patients" class="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-all active:scale-95"><i class="fas fa-list"></i>환자 목록으로</a>' +
                  '</div>';
              }
            } catch (err) {
              console.error('Failed to load patient:', err);
              document.getElementById('patientDetail').innerHTML =
                '<div class="text-center py-16 animate-fade-in">' +
                  '<div class="w-20 h-20 mx-auto mb-5 rounded-2xl bg-surface-100 flex items-center justify-center"><i class="fas fa-triangle-exclamation text-3xl text-amber-400"></i></div>' +
                  '<h3 class="text-lg font-bold text-surface-800 mb-1">데이터를 불러올 수 없습니다</h3>' +
                  '<button onclick="loadPatient()" class="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-all active:scale-95"><i class="fas fa-rotate-right"></i>다시 시도</button>' +
                '</div>';
            }
          }

          function sec(title, icon, iconBg) {
            return '<div class="flex items-center gap-2 mb-3">' +
              '<div class="w-7 h-7 rounded-lg ' + iconBg + ' flex items-center justify-center"><i class="' + icon + ' text-xs"></i></div>' +
              '<h3 class="font-bold text-sm text-surface-900">' + title + '</h3></div>';
          }

          function renderPatient(p) {
            var container = document.getElementById('patientDetail');
            var consultations = p.consultations || [];
            var contactLogs = p.contact_logs || [];
            var pendingTasks = p.pending_tasks || [];
            var tags = p.tags || [];

            var st = {
              paid: { bg:'bg-emerald-50', text:'text-emerald-700', label:'결제완료', dot:'bg-emerald-500' },
              undecided: { bg:'bg-amber-50', text:'text-amber-700', label:'미결정', dot:'bg-amber-500' },
              lost: { bg:'bg-rose-50', text:'text-rose-700', label:'이탈', dot:'bg-rose-500' },
              pending: { bg:'bg-surface-50', text:'text-surface-600', label:'대기중', dot:'bg-surface-400' }
            };

            var colors = ['bg-brand-100 text-brand-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-sky-100 text-sky-700', 'bg-purple-100 text-purple-700'];
            var avatarColor = colors[p.name.charCodeAt(0) % colors.length];

            var html = '<div class="space-y-3 stagger-children">';

            // Patient Info Card
            html += '<div class="card-premium p-5">' +
              '<div class="flex items-start gap-4">' +
                '<div class="w-16 h-16 rounded-2xl ' + avatarColor + ' flex items-center justify-center font-black text-2xl shrink-0">' + p.name.charAt(0) + '</div>' +
                '<div class="flex-1 min-w-0">' +
                  '<div class="flex items-center gap-2 mb-0.5">' +
                    '<h2 class="text-xl font-bold text-surface-900">' + p.name + '</h2>' +
                    (p.age ? '<span class="text-surface-400 text-sm">' + p.age + '세 ' + (p.gender === 'male' ? '남' : p.gender === 'female' ? '여' : '') + '</span>' : '') +
                  '</div>' +
                  (p.phone ? '<a href="tel:' + p.phone + '" class="inline-flex items-center gap-1.5 text-brand-600 font-semibold text-sm hover:text-brand-700 transition-colors"><i class="fas fa-phone text-xs"></i>' + p.phone + '</a>' : '') +
                  (tags.length > 0 ? '<div class="flex flex-wrap gap-1 mt-2">' + tags.map(function(t) { return '<span class="px-2 py-0.5 bg-surface-100 text-surface-600 rounded-lg text-[10px] font-semibold">' + t + '</span>'; }).join('') + '</div>' : '') +
                '</div>' +
              '</div>' +
              (p.memo ? '<p class="mt-3 text-sm text-surface-600 bg-surface-50 p-3 rounded-xl leading-relaxed">' + p.memo + '</p>' : '') +
            '</div>';

            // Quick Actions
            html += '<div class="grid grid-cols-2 gap-2">' +
              '<a href="tel:' + (p.phone || '') + '" class="card-premium p-3.5 flex items-center justify-center gap-2 font-semibold text-sm ' + (!p.phone ? 'opacity-40 pointer-events-none' : 'active:scale-[0.98]') + '">' +
                '<div class="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center"><i class="fas fa-phone text-brand-600 text-xs"></i></div>' +
                '<span class="text-surface-800">전화</span>' +
              '</a>' +
              '<a href="/recording/' + p.id + '" class="card-premium p-3.5 flex items-center justify-center gap-2 font-semibold text-sm active:scale-[0.98]">' +
                '<div class="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center"><i class="fas fa-microphone text-rose-600 text-xs"></i></div>' +
                '<span class="text-surface-800">상담 녹음</span>' +
              '</a>' +
            '</div>';

            // Pending Tasks
            if (pendingTasks.length > 0) {
              html += '<div class="card-premium p-5 border-l-4 border-l-amber-400">' +
                sec('예정된 연락', 'fas fa-bell text-amber-600', 'bg-amber-50') +
                '<div class="space-y-2">';
              pendingTasks.forEach(function(t) {
                var date = new Date(t.recommended_date);
                var dateStr = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
                var typeEmoji = t.task_type === 'closing' ? '🔥' : '💙';
                html += '<div class="bg-white p-3 rounded-xl border border-surface-100">' +
                  '<div class="flex justify-between items-start">' +
                    '<span class="font-semibold text-sm">' + typeEmoji + ' ' + (t.task_type === 'closing' ? '클로징' : '안부') + ' 연락</span>' +
                    '<span class="text-[10px] font-semibold text-surface-400 bg-surface-50 px-2 py-0.5 rounded-md">' + dateStr + '</span>' +
                  '</div>' +
                  (t.points && t.points.length > 0 ? '<p class="text-xs text-surface-600 mt-1.5">' + t.points[0] + '</p>' : '') +
                '</div>';
              });
              html += '</div></div>';
            }

            // Consultation History
            html += '<div class="card-premium p-5">' +
              sec('상담 히스토리', 'fas fa-clock-rotate-left text-brand-600', 'bg-brand-50');
            if (consultations.length > 0) {
              html += '<div class="space-y-2">';
              consultations.forEach(function(c) {
                var date = new Date(c.consultation_date);
                var dateStr = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
                var score = c.feedback && c.feedback.total_score ? c.feedback.total_score : null;
                var s = st[c.status] || st.pending;
                html += '<a href="/consultations/' + c.id + '" class="block p-3 bg-surface-50 rounded-xl hover:bg-surface-100 transition-all active:scale-[0.99]">' +
                  '<div class="flex justify-between items-start">' +
                    '<div><span class="font-bold text-sm text-surface-900">' + (c.treatment_type || '상담') + '</span>' +
                    (c.amount ? '<span class="text-surface-400 text-xs ml-2">' + (c.amount / 10000).toFixed(0) + '만원</span>' : '') + '</div>' +
                    '<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ' + s.bg + ' ' + s.text + '"><span class="w-1 h-1 rounded-full ' + s.dot + '"></span>' + s.label + '</span>' +
                  '</div>' +
                  '<div class="flex items-center gap-2 mt-1 text-xs text-surface-500">' +
                    '<span>' + dateStr + '</span>' +
                    (c.duration ? '<span class="text-surface-300">·</span><span>' + c.duration + '분</span>' : '') +
                    (c.decision_score ? '<span class="text-surface-300">·</span><span>결정도 ' + c.decision_score + '/10</span>' : '') +
                  '</div>' +
                  (score ? '<div class="mt-2 flex items-center gap-2"><div class="flex-1 bg-surface-200 rounded-full h-1 overflow-hidden"><div class="bg-gradient-to-r from-brand-500 to-brand-400 h-1 rounded-full" style="width:' + score + '%"></div></div><span class="text-[10px] font-bold ' + (score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-rose-600') + '">' + score + '점</span></div>' : '') +
                '</a>';
              });
              html += '</div>';
            } else {
              html += '<div class="text-center py-6"><p class="text-surface-400 text-sm">상담 기록이 없습니다</p></div>';
            }
            html += '</div>';

            // Contact History
            html += '<div class="card-premium p-5">' +
              sec('연락 히스토리', 'fas fa-phone-volume text-sky-600', 'bg-sky-50');
            if (contactLogs.length > 0) {
              html += '<div class="space-y-2">';
              contactLogs.forEach(function(l) {
                var date = new Date(l.created_at);
                var dateStr = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
                var timeStr = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
                var typeIcon = l.contact_type === 'call' ? 'fa-phone' : l.contact_type === 'kakao' ? 'fa-comment' : 'fa-envelope';
                var typeName = l.contact_type === 'call' ? '전화' : l.contact_type === 'kakao' ? '카톡' : '문자';
                var resultText = { success: '연결', no_answer: '부재중', busy: '통화중' };
                var outcomeText = { booked: '예약완료', callback: '재연락', hold: '보류', rejected: '거절' };
                html += '<div class="flex items-start gap-3 p-2.5">' +
                  '<div class="w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center shrink-0"><i class="fas ' + typeIcon + ' text-surface-500 text-xs"></i></div>' +
                  '<div class="flex-1 min-w-0">' +
                    '<div class="flex justify-between items-start">' +
                      '<span class="font-semibold text-sm text-surface-800">' + typeName + (l.contact_result ? ' · ' + (resultText[l.contact_result] || '') : '') + '</span>' +
                      '<span class="text-[10px] text-surface-400">' + dateStr + ' ' + timeStr + '</span>' +
                    '</div>' +
                    (l.outcome ? '<span class="inline-flex items-center text-[10px] font-semibold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded mt-0.5">' + (outcomeText[l.outcome] || '') + '</span>' : '') +
                    (l.content ? '<p class="text-xs text-surface-500 mt-1 line-clamp-1">' + l.content + '</p>' : '') +
                  '</div></div>';
              });
              html += '</div>';
            } else {
              html += '<div class="text-center py-6"><p class="text-surface-400 text-sm">연락 기록이 없습니다</p></div>';
            }
            html += '</div></div>';

            container.innerHTML = html;
          }

          // ============================================
          // 리텐션 탭 로직
          // ============================================
          async function loadRetention() {
            try {
              var res = await fetch('/api/retention/patients/' + patientId);
              var data = await res.json();
              if (data.success) { retentionData = data.data; renderRetention(data.data); }
              else { renderRetentionEmpty(); }
            } catch (err) { console.error('Retention load err:', err); renderRetentionEmpty(); }
          }

          function renderRetentionEmpty() {
            document.getElementById('retentionDetail').innerHTML =
              '<div class="text-center py-12"><div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-100 flex items-center justify-center"><i class="fas fa-heart-pulse text-2xl text-surface-300"></i></div>' +
              '<p class="text-surface-500 text-sm mb-3">리텐션 데이터가 없습니다</p>' +
              '<button onclick="openTreatmentModal()" class="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-all active:scale-95"><i class="fas fa-plus"></i>치료 등록하기</button></div>';
          }

          function renderRetention(d) {
            var container = document.getElementById('retentionDetail');
            var rs = d.retention_status;
            var treatments = d.treatments || [];
            var contacts = d.retention_contacts || [];
            var timeline = d.timeline || [];
            var html = '<div class="space-y-3 stagger-children">';

            // 리텐션 상태 카드
            if (rs) {
              var st = statusMap[rs.status] || statusMap.active;
              var riskColor = rs.risk_score >= 80 ? 'text-rose-600' : rs.risk_score >= 50 ? 'text-amber-600' : rs.risk_score >= 30 ? 'text-sky-600' : 'text-emerald-600';
              var riskBg = rs.risk_score >= 80 ? 'from-rose-500' : rs.risk_score >= 50 ? 'from-amber-500' : rs.risk_score >= 30 ? 'from-sky-500' : 'from-emerald-500';

              html += '<div class="card-premium p-5 border-l-4 border-l-' + st.color + '-400">' +
                '<div class="flex items-center justify-between mb-4">' +
                  '<div class="flex items-center gap-2"><div class="w-8 h-8 rounded-lg ' + st.bg + ' flex items-center justify-center"><i class="fas ' + st.icon + ' text-xs ' + st.text + '"></i></div>' +
                  '<div><span class="font-bold text-sm ' + st.text + '">' + st.label + '</span><p class="text-[10px] text-surface-500">마지막 내원 ' + rs.days_since_visit + '일 전</p></div></div>' +
                  '<div class="text-center"><p class="text-3xl font-black ' + riskColor + '">' + rs.risk_score + '</p><p class="text-[9px] font-semibold text-surface-400">이탈위험도</p></div>' +
                '</div>' +
                '<div class="h-2 bg-surface-100 rounded-full overflow-hidden"><div class="h-full bg-gradient-to-r ' + riskBg + ' to-surface-200 rounded-full transition-all duration-1000" style="width:' + rs.risk_score + '%"></div></div>' +
                '<div class="flex justify-between mt-2 text-[10px] text-surface-400"><span>안전</span><span>주의</span><span>위험</span></div>' +
              '</div>';

              // AI 추천 멘트
              if (rs.recommended_contact_script) {
                html += '<div class="card-premium p-4 bg-gradient-to-br from-brand-50/50 to-purple-50/30 border border-brand-100/50">' +
                  '<div class="flex items-center gap-2 mb-2"><i class="fas fa-sparkles text-brand-500 text-sm"></i><span class="font-bold text-xs text-brand-700">AI 추천 멘트</span></div>' +
                  '<p class="text-sm text-surface-700 leading-relaxed">' + rs.recommended_contact_script + '</p>' +
                  '<button onclick="openRetContactModal(\\'\\')" class="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 transition-all active:scale-95"><i class="fas fa-phone"></i>연락 기록하기</button>' +
                '</div>';
              }
            }

            // 잔여 치료비 요약
            html += '<div class="card-premium p-5">' +
              '<div class="flex items-center justify-between mb-3">' +
                sec('잔여 치료비', 'fas fa-coins text-amber-600', 'bg-amber-50') +
              '</div>' +
              '<p class="text-3xl font-black text-surface-900">' + Math.round((d.remaining_treatment_value || 0) / 10000) + '<span class="text-sm font-semibold text-surface-400 ml-1">만원</span></p>';
            if (d.next_recall_date) {
              html += '<p class="text-xs text-sky-600 mt-2"><i class="fas fa-calendar-check mr-1"></i>다음 리콜 예정: ' + d.next_recall_date + '</p>';
            }
            html += '</div>';

            // 치료 목록
            html += '<div class="card-premium p-5">' +
              '<div class="flex items-center justify-between mb-3">' +
                '<div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center"><i class="fas fa-tooth text-xs text-brand-600"></i></div>' +
                '<h3 class="font-bold text-sm text-surface-900">치료 내역</h3></div>' +
                '<button onclick="openTreatmentModal()" class="text-xs font-semibold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-all active:scale-95"><i class="fas fa-plus mr-1"></i>추가</button>' +
              '</div>';
            if (treatments.length > 0) {
              html += '<div class="space-y-2">';
              treatments.forEach(function(t) {
                var ts = treatStatusMap[t.status] || treatStatusMap.consulted;
                var typeName = treatTypeMap[t.treatment_type] || t.treatment_type;
                var remaining = (t.total_amount || 0) - (t.paid_amount || 0);
                html += '<div class="p-3 bg-surface-50 rounded-xl">' +
                  '<div class="flex justify-between items-start">' +
                    '<div><span class="font-bold text-sm text-surface-900">' + typeName + '</span>' +
                    (t.treatment_name ? '<span class="text-surface-400 text-xs ml-1.5">' + t.treatment_name + '</span>' : '') + '</div>' +
                    '<span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold ' + ts.bg + ' ' + ts.text + '">' + ts.label + '</span>' +
                  '</div>' +
                  '<div class="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-surface-500">' +
                    (t.total_amount ? '<span><i class="fas fa-won-sign mr-0.5"></i>총 ' + (t.total_amount/10000).toFixed(0) + '만</span>' : '') +
                    (t.paid_amount ? '<span class="text-emerald-600">수납 ' + (t.paid_amount/10000).toFixed(0) + '만</span>' : '') +
                    (remaining > 0 ? '<span class="text-rose-600 font-semibold">잔여 ' + (remaining/10000).toFixed(0) + '만</span>' : '') +
                    (t.next_appointment ? '<span><i class="fas fa-calendar mr-0.5"></i>' + t.next_appointment + '</span>' : '') +
                  '</div>' +
                  (t.notes ? '<p class="text-xs text-surface-500 mt-1.5 line-clamp-1">' + t.notes + '</p>' : '') +
                '</div>';
              });
              html += '</div>';
            } else {
              html += '<div class="text-center py-6"><p class="text-surface-400 text-sm">등록된 치료가 없습니다</p></div>';
            }
            html += '</div>';

            // 타임라인
            if (timeline.length > 0) {
              html += '<div class="card-premium p-5">' +
                sec('활동 타임라인', 'fas fa-timeline text-purple-600', 'bg-purple-50') +
                '<div class="relative pl-6 space-y-3">';
              timeline.slice(0, 15).forEach(function(e, i) {
                var date = e.date ? new Date(e.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '';
                var iconMap = { consultation: 'fa-stethoscope text-brand-600', treatment: 'fa-tooth text-emerald-600', contact: 'fa-phone text-sky-600' };
                var bgMap = { consultation: 'bg-brand-50', treatment: 'bg-emerald-50', contact: 'bg-sky-50' };
                var icon = iconMap[e.event_type] || 'fa-circle text-surface-400';
                var bg = bgMap[e.event_type] || 'bg-surface-50';
                var desc = '';
                if (e.event_type === 'consultation') desc = (e.treatment_type || '상담') + (e.amount ? ' · ' + (e.amount/10000).toFixed(0) + '만원' : '');
                else if (e.event_type === 'treatment') desc = (treatTypeMap[e.treatment_type] || '') + (e.treatment_name ? ' ' + e.treatment_name : '');
                else if (e.event_type === 'contact') desc = (e.contact_type === 'phone' ? '전화' : e.contact_type === 'text' ? '문자' : '카카오') + (e.result ? ' · ' + e.result : '');

                html += '<div class="relative">' +
                  '<div class="absolute -left-6 top-0.5 w-4 h-4 rounded-full ' + bg + ' flex items-center justify-center ring-2 ring-white"><i class="fas ' + icon + '" style="font-size:7px"></i></div>' +
                  (i < timeline.length - 1 ? '<div class="absolute -left-[17px] top-4 w-0.5 h-full bg-surface-200"></div>' : '') +
                  '<div class="ml-1"><span class="text-[10px] text-surface-400 font-semibold">' + date + '</span>' +
                  '<p class="text-xs text-surface-700 font-medium">' + desc + '</p></div></div>';
              });
              html += '</div></div>';
            }

            // 리텐션 연락 기록
            if (contacts.length > 0) {
              html += '<div class="card-premium p-5">' +
                sec('리텐션 연락 기록', 'fas fa-phone-volume text-emerald-600', 'bg-emerald-50') +
                '<div class="space-y-2">';
              contacts.forEach(function(rc) {
                var date = rc.contacted_at ? new Date(rc.contacted_at).toLocaleDateString('ko-KR', { month:'short', day:'numeric' }) : '';
                var resMap = { connected: '통화 성공', no_answer: '부재중', message_sent: '메시지 발송', callback_promised: '콜백 약속', appointment_booked: '예약 완료', refused: '거절' };
                var resColor = rc.result === 'appointment_booked' ? 'text-emerald-700 bg-emerald-50' : rc.result === 'refused' ? 'text-rose-700 bg-rose-50' : 'text-surface-700 bg-surface-50';
                html += '<div class="p-3 bg-surface-50 rounded-xl">' +
                  '<div class="flex justify-between items-start">' +
                    '<div class="flex items-center gap-2">' +
                      '<span class="text-sm font-semibold">' + (rc.contact_type === 'phone' ? '📞' : rc.contact_type === 'text' ? '💬' : '💛') + '</span>' +
                      '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ' + resColor + '">' + (resMap[rc.result] || rc.result) + '</span>' +
                    '</div>' +
                    '<span class="text-[10px] text-surface-400">' + date + (rc.staff_name ? ' · ' + rc.staff_name : '') + '</span>' +
                  '</div>' +
                  (rc.notes ? '<p class="text-xs text-surface-500 mt-1.5">' + rc.notes + '</p>' : '') +
                '</div>';
              });
              html += '</div></div>';
            }

            html += '</div>';
            container.innerHTML = html;
          }

          // ============================================
          // 치료 등록 모달
          // ============================================
          function openTreatmentModal() { document.getElementById('treatmentModal').classList.remove('hidden'); }
          function closeTreatmentModal() { document.getElementById('treatmentModal').classList.add('hidden'); }

          async function saveTreatment() {
            try {
              var res = await fetch('/api/retention/treatments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  patient_id: patientId,
                  treatment_type: document.getElementById('treatType').value,
                  treatment_name: document.getElementById('treatName').value || null,
                  status: document.getElementById('treatStatus').value,
                  total_amount: parseInt(document.getElementById('treatTotalAmount').value) || 0,
                  paid_amount: parseInt(document.getElementById('treatPaidAmount').value) || 0,
                  started_at: document.getElementById('treatStartDate').value || null,
                  next_appointment: document.getElementById('treatNextAppt').value || null,
                  notes: document.getElementById('treatNotes').value || null
                })
              });
              var data = await res.json();
              if (data.success) {
                closeTreatmentModal();
                retentionData = null;
                loadRetention();
              } else { alert(data.error || '저장에 실패했습니다.'); }
            } catch (err) { alert('오류가 발생했습니다.'); }
          }

          // ============================================
          // 연락 기록 모달
          // ============================================
          function openRetContactModal(treatId) {
            document.getElementById('retModalTreatId').value = treatId || '';
            document.getElementById('retContactModal').classList.remove('hidden');
          }
          function closeRetContactModal() { document.getElementById('retContactModal').classList.add('hidden'); }

          function selectRetContactType(type) {
            retContactType = type;
            document.querySelectorAll('.ret-ct-btn').forEach(function(b) {
              b.className = b.dataset.type === type
                ? 'ret-ct-btn flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-brand-500 text-brand-600 bg-brand-50 transition-all'
                : 'ret-ct-btn flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-surface-200 text-surface-600 transition-all';
            });
          }

          async function saveRetContact() {
            try {
              var res = await fetch('/api/retention/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  patient_id: patientId,
                  treatment_id: document.getElementById('retModalTreatId').value || null,
                  contact_type: retContactType,
                  result: document.getElementById('retContactResult').value,
                  notes: document.getElementById('retContactNotes').value || null,
                  next_contact_date: document.getElementById('retNextContact').value || null
                })
              });
              var data = await res.json();
              if (data.success) {
                closeRetContactModal();
                retentionData = null;
                loadRetention();
              } else { alert(data.error || '저장에 실패했습니다.'); }
            } catch (err) { alert('오류가 발생했습니다.'); }
          }

          // ============================================
          // 환자 정보 수정
          // ============================================
          function openEditModal() {
            if (!currentPatient) return;
            var p = currentPatient;
            document.getElementById('editName').value = p.name || '';
            document.getElementById('editAge').value = p.age || '';
            document.getElementById('editGender').value = p.gender || '';
            document.getElementById('editPhone').value = p.phone || '';
            document.getElementById('editTags').value = (p.tags || []).join(', ');
            document.getElementById('editMemo').value = p.memo || '';
            document.getElementById('editPatientModal').classList.remove('hidden');
          }
          function closeEditModal() { document.getElementById('editPatientModal').classList.add('hidden'); }

          async function savePatientEdit() {
            var btn = document.getElementById('saveEditBtn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>저장 중...';
            try {
              var tagsStr = document.getElementById('editTags').value;
              var tags = tagsStr ? tagsStr.split(',').map(function(t) { return t.trim(); }).filter(Boolean) : [];
              var res = await fetch('/api/patients/' + patientId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: document.getElementById('editName').value,
                  age: parseInt(document.getElementById('editAge').value) || null,
                  gender: document.getElementById('editGender').value || null,
                  phone: document.getElementById('editPhone').value || null,
                  tags: tags,
                  memo: document.getElementById('editMemo').value || null
                })
              });
              var data = await res.json();
              if (data.success) {
                closeEditModal();
                loadPatient();
              } else { alert(data.error || '저장에 실패했습니다.'); }
            } catch (err) { alert('오류가 발생했습니다.'); }
            finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check mr-2"></i>저장'; }
          }

          document.getElementById('editBtn').addEventListener('click', openEditModal);

          loadPatient();
        `
      }} />
    </Layout>
  )
}
