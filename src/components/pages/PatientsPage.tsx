import { FC } from 'hono/jsx'
import { Layout, Header, Card } from '../shared/Layout'

export const PatientsPage: FC = () => {
  return (
    <Layout activeTab="patients">
      <Header title="환자" rightAction={
        <button id="addPatientBtn" class="text-primary-600 font-medium text-sm">
          <i class="fas fa-plus mr-1"></i>등록
        </button>
      } />
      
      <div class="px-4 py-4">
        {/* Search */}
        <div class="relative mb-4">
          <input 
            type="text" 
            id="searchInput"
            placeholder="이름 또는 연락처로 검색"
            class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
          <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
        </div>

        {/* Filter */}
        <div class="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button data-filter="all" class="filter-btn px-4 py-2 rounded-full text-sm font-medium bg-primary-600 text-white whitespace-nowrap">
            전체
          </button>
          <button data-filter="undecided" class="filter-btn px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600 whitespace-nowrap">
            🟡 미결정
          </button>
          <button data-filter="paid" class="filter-btn px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600 whitespace-nowrap">
            🟢 결제완료
          </button>
        </div>

        {/* Patient List */}
        <div id="patientList" class="space-y-3">
          <div class="animate-pulse space-y-3">
            <div class="h-20 bg-gray-100 rounded-xl"></div>
            <div class="h-20 bg-gray-100 rounded-xl"></div>
            <div class="h-20 bg-gray-100 rounded-xl"></div>
          </div>
        </div>
      </div>

      {/* Add Patient Modal */}
      <div id="addPatientModal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
        <div class="bg-white rounded-t-2xl w-full max-w-lg p-6 slide-up">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">새 환자 등록</h3>
            <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          <form id="addPatientForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
              <input type="text" name="name" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="환자 이름" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">연락처</label>
              <input type="tel" name="phone" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="010-0000-0000" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">나이</label>
                <input type="number" name="age" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="00" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">성별</label>
                <select name="gender" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="">선택</option>
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">메모</label>
              <textarea name="memo" rows={2} class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none" placeholder="환자 관련 메모"></textarea>
            </div>
            <button type="submit" class="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 rounded-lg transition">
              등록하기
            </button>
          </form>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          let currentFilter = 'all';
          let searchTimeout;

          async function loadPatients(filter = 'all', search = '') {
            try {
              const authRes = await fetch('/api/auth/me');
              if (!authRes.ok) {
                window.location.href = '/login';
                return;
              }

              const params = new URLSearchParams({ limit: '50' });
              if (filter !== 'all') params.set('status', filter);
              if (search) params.set('search', search);

              const res = await fetch('/api/patients?' + params);
              const data = await res.json();

              if (data.success) {
                renderPatients(data.data);
              }
            } catch (err) {
              console.error('Failed to load patients:', err);
            }
          }

          function renderPatients(patients) {
            const container = document.getElementById('patientList');
            
            if (!patients || patients.length === 0) {
              container.innerHTML = \`
                <div class="text-center py-12">
                  <i class="fas fa-users text-4xl text-gray-300 mb-4"></i>
                  <p class="text-gray-500">환자 정보가 없습니다</p>
                  <button onclick="openModal()" class="mt-4 text-primary-600 font-medium">
                    <i class="fas fa-plus mr-2"></i>첫 환자 등록하기
                  </button>
                </div>
              \`;
              return;
            }

            const statusColors = {
              paid: 'text-green-600',
              undecided: 'text-yellow-600',
              lost: 'text-red-600'
            };
            const statusEmoji = { paid: '🟢', undecided: '🟡', lost: '🔴' };

            container.innerHTML = patients.map(p => {
              const lastDate = p.last_consultation ? new Date(p.last_consultation).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : null;
              const tags = p.tags || [];
              
              return \`
                <a href="/patients/\${p.id}" class="block">
                  <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition">
                    <div class="flex justify-between items-start">
                      <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                          <i class="fas fa-user text-primary-600"></i>
                        </div>
                        <div>
                          <div class="flex items-center gap-2">
                            <span class="font-semibold text-gray-900">\${p.name}</span>
                            \${p.age ? '<span class="text-gray-500 text-sm">' + p.age + '세</span>' : ''}
                            \${p.gender === 'male' ? '<span class="text-blue-500 text-xs">♂</span>' : p.gender === 'female' ? '<span class="text-pink-500 text-xs">♀</span>' : ''}
                          </div>
                          \${p.phone ? '<p class="text-gray-500 text-sm">' + p.phone + '</p>' : ''}
                        </div>
                      </div>
                      <div class="text-right">
                        \${p.last_consultation_status ? \`
                          <span class="\${statusColors[p.last_consultation_status] || 'text-gray-500'} text-sm">
                            \${statusEmoji[p.last_consultation_status] || ''} \${p.last_consultation_status === 'paid' ? '결제완료' : p.last_consultation_status === 'undecided' ? '미결정' : p.last_consultation_status}
                          </span>
                        \` : ''}
                        \${p.last_decision_score && p.last_consultation_status === 'undecided' ? \`
                          <p class="text-xs text-gray-500 mt-1">결정도 \${p.last_decision_score}/10</p>
                        \` : ''}
                      </div>
                    </div>
                    <div class="flex items-center justify-between mt-3 text-sm">
                      <div class="flex gap-2">
                        \${tags.slice(0, 3).map(t => '<span class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">' + t + '</span>').join('')}
                      </div>
                      <span class="text-gray-400 text-xs">
                        \${p.consultation_count ? p.consultation_count + '회 상담' : ''}
                        \${lastDate ? ' · ' + lastDate : ''}
                      </span>
                    </div>
                  </div>
                </a>
              \`;
            }).join('');
          }

          function openModal() {
            document.getElementById('addPatientModal').classList.remove('hidden');
          }

          function closeModal() {
            document.getElementById('addPatientModal').classList.add('hidden');
            document.getElementById('addPatientForm').reset();
          }

          // Modal backdrop click
          document.getElementById('addPatientModal').addEventListener('click', (e) => {
            if (e.target.id === 'addPatientModal') closeModal();
          });

          // Add patient button
          document.getElementById('addPatientBtn').addEventListener('click', openModal);

          // Add patient form
          document.getElementById('addPatientForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = {
              name: formData.get('name'),
              phone: formData.get('phone') || undefined,
              age: formData.get('age') ? parseInt(formData.get('age')) : undefined,
              gender: formData.get('gender') || undefined,
              memo: formData.get('memo') || undefined
            };

            try {
              const res = await fetch('/api/patients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });
              const result = await res.json();
              
              if (result.success) {
                closeModal();
                loadPatients(currentFilter, document.getElementById('searchInput').value);
              } else {
                alert(result.error || '환자 등록에 실패했습니다.');
              }
            } catch (err) {
              alert('오류가 발생했습니다.');
            }
          });

          // Filter buttons
          document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('bg-primary-600', 'text-white');
                b.classList.add('bg-gray-100', 'text-gray-600');
              });
              btn.classList.remove('bg-gray-100', 'text-gray-600');
              btn.classList.add('bg-primary-600', 'text-white');
              
              currentFilter = btn.dataset.filter;
              loadPatients(currentFilter, document.getElementById('searchInput').value);
            });
          });

          // Search
          document.getElementById('searchInput').addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
              loadPatients(currentFilter, e.target.value);
            }, 300);
          });

          loadPatients();
        `
      }} />
    </Layout>
  )
}
