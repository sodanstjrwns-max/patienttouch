import { FC } from 'hono/jsx'
import { Layout, Header, Card, Badge } from '../shared/Layout'

export const PatientsPage: FC = () => {
  return (
    <Layout activeTab="patients">
      <Header 
        title="환자 관리" 
        subtitle="환자 정보 및 히스토리"
        rightAction={
          <button id="addPatientBtn" class="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center text-white shadow-md shadow-brand-600/20 active:scale-95 transition-transform">
            <i class="fas fa-plus text-sm"></i>
          </button>
        }
      />

      {/* Stats Summary */}
      <div id="patientStats" class="px-4 pt-3 pb-1">
        <div class="grid grid-cols-3 gap-2">
          <div class="card-premium p-3 text-center">
            <p id="statTotal" class="text-lg font-black text-surface-900">-</p>
            <p class="text-[10px] font-semibold text-surface-400">전체</p>
          </div>
          <div class="card-premium p-3 text-center">
            <p id="statConsulted" class="text-lg font-black text-brand-600">-</p>
            <p class="text-[10px] font-semibold text-surface-400">상담완료</p>
          </div>
          <div class="card-premium p-3 text-center">
            <p id="statPaid" class="text-lg font-black text-emerald-600">-</p>
            <p class="text-[10px] font-semibold text-surface-400">결제완료</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div class="px-4 py-3">
        <div class="relative">
          <i class="fas fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 text-sm"></i>
          <input id="searchInput" type="text" placeholder="이름, 전화번호, 내원경로, 지역, 태그 검색" class="w-full pl-11 pr-4 py-3 bg-white border border-surface-200 rounded-xl text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder-surface-400" />
        </div>
      </div>

      {/* Sort & Filter */}
      <div class="px-4 pb-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <select id="sortSelect" class="shrink-0 px-3 py-1.5 text-xs font-semibold bg-surface-100 text-surface-600 border-0 rounded-xl outline-none cursor-pointer">
          <option value="recent">최근 등록순</option>
          <option value="name">이름순</option>
          <option value="consultation">최근 상담순</option>
        </select>
        <button class="patient-filter-btn shrink-0 px-3 py-1.5 text-xs font-bold rounded-xl transition-all bg-brand-600 text-white" data-filter="all" onclick="applyPatientFilter('all')">전체</button>
        <button class="patient-filter-btn shrink-0 px-3 py-1.5 text-xs font-bold rounded-xl transition-all bg-surface-100 text-surface-600" data-filter="undecided" onclick="applyPatientFilter('undecided')">미결정</button>
        <button class="patient-filter-btn shrink-0 px-3 py-1.5 text-xs font-bold rounded-xl transition-all bg-surface-100 text-surface-600" data-filter="paid" onclick="applyPatientFilter('paid')">결제완료</button>
        <button class="patient-filter-btn shrink-0 px-3 py-1.5 text-xs font-bold rounded-xl transition-all bg-surface-100 text-surface-600" data-filter="lost" onclick="applyPatientFilter('lost')">이탈</button>
      </div>

      {/* Patient Count */}
      <div class="px-4 pb-2 flex items-center justify-between">
        <span id="patientCount" class="text-xs font-semibold text-surface-500"></span>
      </div>

      <div class="px-4 pb-6">
        <div id="patientList" class="space-y-2">
          <div class="card-premium p-5"><div class="shimmer h-4 rounded-lg w-2/3 mb-3"></div><div class="shimmer h-3 rounded-lg w-full"></div></div>
          <div class="card-premium p-5"><div class="shimmer h-4 rounded-lg w-2/3 mb-3"></div><div class="shimmer h-3 rounded-lg w-full"></div></div>
        </div>
      </div>

      {/* Add Patient Modal */}
      <div id="addPatientModal" class="fixed inset-0 z-[60] hidden">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="closeModal()"></div>
        <div class="absolute bottom-0 left-0 right-0 max-w-lg mx-auto">
          <div class="bg-white rounded-t-3xl p-6 shadow-2xl animate-slide-up">
            <div class="flex items-center justify-between mb-5">
              <h2 class="text-lg font-bold">환자 등록</h2>
              <button onclick="closeModal()" class="w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center text-surface-500 hover:bg-surface-200 transition-colors"><i class="fas fa-xmark"></i></button>
            </div>
            <form id="addPatientForm" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-surface-600 mb-1.5">이름 *</label>
                <input type="text" id="pName" required class="w-full px-4 py-3 border border-surface-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all" placeholder="환자 이름" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-surface-600 mb-1.5">전화번호</label>
                <input type="tel" id="pPhone" class="w-full px-4 py-3 border border-surface-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all" placeholder="010-0000-0000" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-surface-600 mb-1.5">나이</label>
                  <input type="number" id="pAge" class="w-full px-4 py-3 border border-surface-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all" placeholder="30" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-surface-600 mb-1.5">성별</label>
                  <select id="pGender" class="w-full px-4 py-3 border border-surface-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all bg-white">
                    <option value="">선택</option>
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-xs font-semibold text-surface-600 mb-1.5">내원 경로</label>
                <select id="pReferral" class="w-full px-4 py-3 border border-surface-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all bg-white">
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
                <label class="block text-xs font-semibold text-surface-600 mb-1.5">지역</label>
                <input type="text" id="pRegion" class="w-full px-4 py-3 border border-surface-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all" placeholder="예: 강남구, 서초구" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-surface-600 mb-1.5">메모</label>
                <textarea id="pMemo" rows="2" class="w-full px-4 py-3 border border-surface-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all resize-none" placeholder="특이사항 메모"></textarea>
              </div>
              <button type="submit" class="w-full bg-gradient-brand text-white font-bold py-3.5 rounded-xl shadow-md shadow-brand-600/20 active:scale-[0.97] transition-all">환자 등록</button>
            </form>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          var allPatients = [];
          var currentPatientFilter = 'all';
          var currentSort = 'recent';
          
          document.getElementById('addPatientBtn').addEventListener('click', function() {
            document.getElementById('addPatientModal').classList.remove('hidden');
          });
          
          window.closeModal = function() {
            document.getElementById('addPatientModal').classList.add('hidden');
          };

          document.getElementById('searchInput').addEventListener('input', debounce(function(e) {
            filterAndRender();
          }, 200));

          document.getElementById('sortSelect').addEventListener('change', function(e) {
            currentSort = e.target.value;
            filterAndRender();
          });

          window.applyPatientFilter = function(filter) {
            currentPatientFilter = filter;
            document.querySelectorAll('.patient-filter-btn').forEach(function(b) {
              b.className = b.dataset.filter === filter
                ? 'patient-filter-btn shrink-0 px-3 py-1.5 text-xs font-bold rounded-xl transition-all bg-brand-600 text-white'
                : 'patient-filter-btn shrink-0 px-3 py-1.5 text-xs font-bold rounded-xl transition-all bg-surface-100 text-surface-600';
            });
            filterAndRender();
          };

          function filterAndRender() {
            var q = (document.getElementById('searchInput').value || '').toLowerCase();
            var filtered = allPatients.filter(function(p) {
              // Text search: name, phone, referral_source, region, tags
              var matchText = true;
              if (q) {
                var tags = [];
                try { tags = Array.isArray(p.tags) ? p.tags : JSON.parse(p.tags || '[]'); } catch(e) {}
                var tagsStr = tags.join(' ').toLowerCase();
                matchText = p.name.toLowerCase().includes(q) || 
                  (p.phone && p.phone.includes(q)) ||
                  (p.phone_full && p.phone_full.includes(q)) ||
                  (p.referral_source && p.referral_source.toLowerCase().includes(q)) ||
                  (p.region && p.region.toLowerCase().includes(q)) ||
                  tagsStr.includes(q) ||
                  (p.memo && p.memo.toLowerCase().includes(q));
              }
              // Status filter
              var matchFilter = true;
              if (currentPatientFilter !== 'all') {
                matchFilter = p.last_consultation_status === currentPatientFilter;
              }
              return matchText && matchFilter;
            });

            // Sort
            filtered.sort(function(a, b) {
              if (currentSort === 'name') return a.name.localeCompare(b.name, 'ko');
              if (currentSort === 'consultation') {
                var da = a.last_consultation || '';
                var db = b.last_consultation || '';
                return db.localeCompare(da);
              }
              // recent (default): by updated_at desc
              return (b.updated_at || b.created_at || '').localeCompare(a.updated_at || a.created_at || '');
            });

            document.getElementById('patientCount').textContent = filtered.length + '명';
            renderPatients(filtered);
          }

          document.getElementById('addPatientForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            try {
              var res = await fetch('/api/patients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: document.getElementById('pName').value,
                  phone: document.getElementById('pPhone').value || undefined,
                  age: document.getElementById('pAge').value ? parseInt(document.getElementById('pAge').value) : undefined,
                  gender: document.getElementById('pGender').value || undefined,
                  referral_source: document.getElementById('pReferral').value || undefined,
                  region: document.getElementById('pRegion').value || undefined,
                  memo: document.getElementById('pMemo').value || undefined
                })
              });
              var data = await res.json();
              if (data.success) {
                closeModal();
                loadPatients();
                document.getElementById('addPatientForm').reset();
              } else {
                showToast(data.error || '등록 실패','error');
              }
            } catch (err) { showToast('오류가 발생했습니다.','error'); }
          });

          function renderPatients(patients) {
            if (!patients || patients.length === 0) {
              document.getElementById('patientList').innerHTML = '<div class="text-center py-16 px-6"><div class="w-20 h-20 mx-auto mb-5 rounded-2xl bg-surface-100 flex items-center justify-center"><i class="fas fa-user-group text-3xl text-surface-300"></i></div><h3 class="text-lg font-bold text-surface-800 mb-1">환자가 없습니다</h3><p class="text-surface-500 text-sm">첫 환자를 등록해보세요</p></div>';
              return;
            }
            var colors = ['bg-brand-100 text-brand-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-sky-100 text-sky-700', 'bg-purple-100 text-purple-700'];
            var statusMap = {
              paid: { label: '결제', bg: 'bg-emerald-50 text-emerald-700' },
              undecided: { label: '미결정', bg: 'bg-amber-50 text-amber-700' },
              lost: { label: '이탈', bg: 'bg-rose-50 text-rose-700' },
              pending: { label: '대기', bg: 'bg-surface-100 text-surface-600' }
            };
            var html = patients.map(function(p) {
              var ci = p.name.charCodeAt(0) % colors.length;
              var tags = [];
              try { tags = Array.isArray(p.tags) ? p.tags : JSON.parse(p.tags || '[]'); } catch(e){}
              var st = statusMap[p.last_consultation_status] || null;
              return '<a href="/patients/' + p.id + '" class="card-premium p-4 flex items-center gap-3.5 block">' +
                '<div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ' + colors[ci] + '">' +
                  '<span class="text-base font-bold">' + p.name.charAt(0) + '</span>' +
                '</div>' +
                '<div class="flex-1 min-w-0">' +
                  '<div class="flex items-center gap-2">' +
                    '<span class="font-bold text-sm">' + p.name + '</span>' +
                    (p.age ? '<span class="text-xs text-surface-400">' + p.age + '세</span>' : '') +
                    (p.gender ? '<span class="text-xs text-surface-400">' + (p.gender === 'male' ? '남' : '여') + '</span>' : '') +
                    (st ? '<span class="text-[9px] px-1.5 py-0.5 rounded-md font-semibold ' + st.bg + '">' + st.label + '</span>' : '') +
                  '</div>' +
                  '<div class="flex items-center gap-1.5 mt-0.5 flex-wrap">' +
                    (p.phone ? '<span class="text-xs text-surface-500">' + (p.phone_display || p.phone) + '</span>' : '') +
                    (p.referral_source ? '<span class="text-[10px] px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-600 font-medium">' + p.referral_source + '</span>' : '') +
                    (p.region ? '<span class="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 font-medium">' + p.region + '</span>' : '') +
                    (tags.length > 0 ? tags.slice(0,2).map(function(t){ return '<span class="text-[10px] px-1.5 py-0.5 rounded-md bg-brand-50 text-brand-600 font-medium">' + t + '</span>'; }).join('') : '') +
                    (p.consultation_count > 0 ? '<span class="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-100 text-surface-500 font-medium">상담 ' + p.consultation_count + '회</span>' : '') +
                  '</div>' +
                '</div>' +
                '<i class="fas fa-chevron-right text-surface-300 text-xs"></i>' +
              '</a>';
            }).join('');
            document.getElementById('patientList').innerHTML = '<div class="space-y-2 stagger-children">' + html + '</div>';
          }

          function updateStats() {
            var total = allPatients.length;
            var consulted = allPatients.filter(function(p) { return p.consultation_count > 0; }).length;
            var paid = allPatients.filter(function(p) { return p.last_consultation_status === 'paid'; }).length;
            document.getElementById('statTotal').textContent = total;
            document.getElementById('statConsulted').textContent = consulted;
            document.getElementById('statPaid').textContent = paid;
          }

          async function loadPatients() {
            try {
              var res = await fetch('/api/patients');
              if (res.status === 401) { window.location.href = '/login'; return; }
              var data = await res.json();
              if (data.success) {
                allPatients = data.data;
                updateStats();
                filterAndRender();
              }
            } catch (err) { console.error(err); }
          }

          loadPatients();
          initPullToRefresh(function(){ loadPatients(); });
        `
      }} />
    </Layout>
  )
}
