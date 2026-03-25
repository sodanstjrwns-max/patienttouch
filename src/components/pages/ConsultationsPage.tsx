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

      {/* Search */}
      <div class="px-4 pt-3 pb-1">
        <div class="relative">
          <i class="fas fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 text-sm"></i>
          <input id="consultSearch" type="text" placeholder="환자명, 치료유형 검색" class="w-full pl-11 pr-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder-surface-400" />
        </div>
      </div>

      {/* Summary Stats */}
      <div id="consultStats" class="px-4 pt-2 pb-1">
        <div class="flex items-center gap-3">
          <span id="consultCount" class="text-xs font-semibold text-surface-500"></span>
          <span id="consultTotalAmount" class="text-xs font-bold text-brand-600"></span>
        </div>
      </div>

      {/* Filters */}
      <div class="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button class="filter-btn active shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all bg-brand-600 text-white shadow-md shadow-brand-600/20" data-status="all">전체</button>
        <button class="filter-btn shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all bg-surface-100 text-surface-600 hover:bg-surface-200" data-status="pending">대기중</button>
        <button class="filter-btn shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all bg-surface-100 text-surface-600 hover:bg-surface-200" data-status="undecided">미결정</button>
        <button class="filter-btn shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all bg-surface-100 text-surface-600 hover:bg-surface-200" data-status="paid">결제완료</button>
        <button class="filter-btn shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all bg-surface-100 text-surface-600 hover:bg-surface-200" data-status="lost">이탈</button>
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

      <script dangerouslySetInnerHTML={{
        __html: `
          var currentFilter = 'all';
          var allConsultations = [];
          var searchQuery = '';
          
          document.querySelectorAll('.filter-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
              document.querySelectorAll('.filter-btn').forEach(function(b) {
                b.className = 'filter-btn shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all bg-surface-100 text-surface-600 hover:bg-surface-200';
              });
              this.className = 'filter-btn active shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all bg-brand-600 text-white shadow-md shadow-brand-600/20';
              currentFilter = this.dataset.status;
              filterAndRender();
            });
          });

          document.getElementById('consultSearch').addEventListener('input', debounce(function(e) {
            searchQuery = (e.target.value || '').toLowerCase();
            filterAndRender();
          }, 200));

          function filterAndRender() {
            var filtered = allConsultations.filter(function(c) {
              // Status filter
              var matchStatus = currentFilter === 'all' || c.status === currentFilter;
              // Search filter
              var matchSearch = true;
              if (searchQuery) {
                matchSearch = (c.patient_name && c.patient_name.toLowerCase().includes(searchQuery)) ||
                  (c.treatment_type && c.treatment_type.toLowerCase().includes(searchQuery)) ||
                  (c.user_name && c.user_name.toLowerCase().includes(searchQuery));
              }
              return matchStatus && matchSearch;
            });
            renderConsultations(filtered);
          }

          function renderConsultations(data) {
            if (!data || data.length === 0) {
              document.getElementById('consultCount').textContent = '0건';
              document.getElementById('consultTotalAmount').textContent = '';
              document.getElementById('consultationList').innerHTML = 
                '<div class="text-center py-16 px-6 animate-fade-in">' +
                  '<div class="w-20 h-20 mx-auto mb-5 rounded-2xl bg-surface-100 flex items-center justify-center"><i class="fas fa-microphone-slash text-3xl text-surface-300"></i></div>' +
                  '<h3 class="text-lg font-bold text-surface-800 mb-1">상담 기록이 없습니다</h3>' +
                  '<p class="text-surface-500 text-sm mb-5">첫 상담을 녹음해보세요</p>' +
                  '<a href="/recording" class="inline-flex items-center gap-2 font-semibold text-sm text-white bg-gradient-brand px-5 py-2.5 rounded-xl shadow-md shadow-brand-600/20"><i class="fas fa-microphone"></i>녹음 시작</a>' +
                '</div>';
              return;
            }

            // Calculate stats
            var totalAmount = data.reduce(function(sum, c){ return sum + (c.amount || 0); }, 0);
            var paidAmount = data.filter(function(c){ return c.status === 'paid'; }).reduce(function(sum, c){ return sum + (c.amount || 0); }, 0);
            document.getElementById('consultCount').textContent = data.length + '건';
            document.getElementById('consultTotalAmount').textContent = 
              '결정 ' + Math.round(paidAmount / 10000).toLocaleString() + '만 / 전체 ' + Math.round(totalAmount / 10000).toLocaleString() + '만원';

            // Group by date
            var groups = {};
            data.forEach(function(c) {
              var dateKey = c.consultation_date ? c.consultation_date.split('T')[0] : 'unknown';
              if (!groups[dateKey]) groups[dateKey] = [];
              groups[dateKey].push(c);
            });

            // Sort date keys desc
            var dateKeys = Object.keys(groups).sort(function(a, b) { return b.localeCompare(a); });

            var st = {
              paid: { bg:'bg-emerald-50', text:'text-emerald-700', label:'결제완료', dot:'bg-emerald-500', border:'border-l-emerald-400' },
              undecided: { bg:'bg-amber-50', text:'text-amber-700', label:'미결정', dot:'bg-amber-500', border:'border-l-amber-400' },
              lost: { bg:'bg-rose-50', text:'text-rose-700', label:'이탈', dot:'bg-rose-500', border:'border-l-rose-400' },
              pending: { bg:'bg-surface-50', text:'text-surface-600', label:'대기중', dot:'bg-surface-400', border:'border-l-surface-300' }
            };

            var today = new Date().toISOString().split('T')[0];
            var yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

            var html = '<div class="space-y-4">';
            dateKeys.forEach(function(dk) {
              var items = groups[dk];
              var dayAmount = items.reduce(function(s, c){ return s + (c.amount || 0); }, 0);
              var dayPaid = items.filter(function(c){ return c.status === 'paid'; }).length;
              
              // Date label
              var dateLabel = dk;
              if (dk === today) dateLabel = '오늘';
              else if (dk === yesterday) dateLabel = '어제';
              else {
                var d = new Date(dk);
                var dayNames = ['일','월','화','수','목','금','토'];
                dateLabel = (d.getMonth()+1) + '/' + d.getDate() + ' (' + dayNames[d.getDay()] + ')';
              }

              html += '<div>';
              html += '<div class="flex items-center justify-between mb-2 px-1">';
              html += '<div class="flex items-center gap-2"><span class="text-xs font-bold text-surface-900">' + dateLabel + '</span><span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-surface-100 text-surface-500">' + items.length + '건</span></div>';
              if (dayAmount > 0) html += '<span class="text-[10px] font-bold text-brand-600">' + Math.round(dayAmount / 10000).toLocaleString() + '만원' + (dayPaid > 0 ? ' (결정 ' + dayPaid + '건)' : '') + '</span>';
              html += '</div>';
              html += '<div class="space-y-2">';
              
              items.forEach(function(c) {
                var s = st[c.status] || st.pending;
                var date = new Date(c.consultation_date);
                var timeStr = String(date.getHours()).padStart(2,'0') + ':' + String(date.getMinutes()).padStart(2,'0');
                var score = c.feedback && c.feedback.total_score ? c.feedback.total_score : null;
                
                html += '<a href="/consultations/' + c.id + '" class="card-premium p-4 flex items-center gap-3.5 block border-l-4 ' + s.border + '">' +
                  '<div class="w-11 h-11 rounded-xl ' + s.bg + ' flex items-center justify-center shrink-0">' +
                    '<span class="text-base font-bold ' + s.text + '">' + (c.patient_name ? c.patient_name.charAt(0) : '?') + '</span>' +
                  '</div>' +
                  '<div class="flex-1 min-w-0">' +
                    '<div class="flex items-center gap-2">' +
                      '<span class="font-bold text-sm truncate">' + (c.patient_name || '미지정') + '</span>' +
                      '<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ring-1 ring-inset ' + s.bg + ' ' + s.text + ' ring-current/20"><span class="w-1 h-1 rounded-full ' + s.dot + '"></span>' + s.label + '</span>' +
                    '</div>' +
                    '<div class="flex items-center gap-1.5 mt-0.5 text-xs text-surface-500">' +
                      '<span>' + timeStr + '</span>' +
                      (c.treatment_type ? '<span class="text-surface-300">|</span><span>' + c.treatment_type + '</span>' : '') +
                      (c.amount ? '<span class="text-surface-300">|</span><span class="font-semibold text-surface-600">' + (c.amount / 10000).toFixed(0) + '만</span>' : '') +
                      (c.user_name ? '<span class="text-surface-300">|</span><span class="text-surface-400">' + c.user_name + '</span>' : '') +
                    '</div>' +
                  '</div>' +
                  '<div class="text-right shrink-0">' +
                    (score ? '<div class="text-lg font-black ' + (score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-rose-600') + '">' + score + '</div><div class="text-[10px] text-surface-400">점</div>' : '<i class="fas fa-chevron-right text-surface-300 text-xs"></i>') +
                  '</div>' +
                '</a>';
              });
              
              html += '</div></div>';
            });
            html += '</div>';
            
            document.getElementById('consultationList').innerHTML = html;
          }

          async function loadConsultations() {
            try {
              var url = '/api/consultations?limit=100';
              var res = await fetch(url);
              var data = await res.json();
              
              if (!data.success) {
                if (res.status === 401) { window.location.href = '/login'; return; }
                return;
              }
              
              allConsultations = data.data || [];
              filterAndRender();
            } catch (err) {
              console.error('Load consultations error:', err);
            }
          }

          loadConsultations();
          initPullToRefresh(function(){ loadConsultations(); });

          // ============================================
          // Manual Consultation Entry
          // ============================================
          document.getElementById('addManualBtn').addEventListener('click', async function() {
            // Load patients for dropdown
            try {
              var res = await fetch('/api/patients?limit=200');
              var data = await res.json();
              if (data.success) {
                var sel = document.getElementById('mPatient');
                sel.innerHTML = '<option value="">환자를 선택하세요</option>';
                data.data.forEach(function(p) {
                  sel.innerHTML += '<option value="' + p.id + '">' + p.name + (p.phone ? ' (' + p.phone + ')' : '') + '</option>';
                });
              }
            } catch(e) {}
            // Set default date
            var now = new Date();
            var local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
            document.getElementById('mDate').value = local.toISOString().slice(0, 16);
            document.getElementById('manualModal').classList.remove('hidden');
          });

          window.closeManualModal = function() {
            document.getElementById('manualModal').classList.add('hidden');
          };

          document.getElementById('manualForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            var patientId = document.getElementById('mPatient').value;
            if (!patientId) { showToast('환자를 선택해주세요.','warning'); return; }
            try {
              var res = await fetch('/api/consultations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  patient_id: patientId,
                  treatment_type: document.getElementById('mTreatType').value || null,
                  amount: document.getElementById('mAmount').value ? parseInt(document.getElementById('mAmount').value) : null,
                  status: document.getElementById('mStatus').value || 'undecided',
                  consultation_date: document.getElementById('mDate').value ? new Date(document.getElementById('mDate').value).toISOString() : new Date().toISOString()
                })
              });
              var data = await res.json();
              if (data.success) {
                // Update summary if provided
                var summary = document.getElementById('mSummary').value;
                if (summary && data.data.id) {
                  await fetch('/api/consultations/' + data.data.id, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ summary: summary })
                  });
                }
                closeManualModal();
                document.getElementById('manualForm').reset();
                loadConsultations();
              } else { showToast(data.error || '저장 실패','error'); }
            } catch (err) { showToast('오류가 발생했습니다.','error'); }
          });
        `
      }} />
    </Layout>
  )
}
