import { FC } from 'hono/jsx'
import { Layout, Header, Card } from '../shared/Layout'

export const ConsultationsPage: FC = () => {
  return (
    <Layout activeTab="consultations">
      <Header title="상담" rightAction={
        <a href="/recording" class="text-primary-600 font-medium text-sm">
          <i class="fas fa-plus mr-1"></i>새 녹음
        </a>
      } />
      
      <div class="px-4 py-4">
        {/* Quick Record Button */}
        <a href="/recording" class="block mb-4">
          <div class="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white text-center shadow-lg">
            <i class="fas fa-microphone text-4xl mb-3"></i>
            <p class="text-lg font-semibold">상담 녹음 시작</p>
            <p class="text-primary-200 text-sm mt-1">버튼 하나로 녹음부터 분석까지</p>
          </div>
        </a>

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
          <button data-filter="lost" class="filter-btn px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600 whitespace-nowrap">
            🔴 이탈
          </button>
        </div>

        {/* Consultation List */}
        <div id="consultationList" class="space-y-3">
          <div class="animate-pulse space-y-3">
            <div class="h-24 bg-gray-100 rounded-xl"></div>
            <div class="h-24 bg-gray-100 rounded-xl"></div>
            <div class="h-24 bg-gray-100 rounded-xl"></div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          let currentFilter = 'all';

          async function loadConsultations(filter = 'all') {
            try {
              const authRes = await fetch('/api/auth/me');
              if (!authRes.ok) {
                window.location.href = '/login';
                return;
              }

              const params = new URLSearchParams({ my_only: 'true', limit: '50' });
              if (filter !== 'all') params.set('status', filter);

              const res = await fetch('/api/consultations?' + params);
              const data = await res.json();

              if (data.success) {
                renderConsultations(data.data);
              }
            } catch (err) {
              console.error('Failed to load consultations:', err);
            }
          }

          function renderConsultations(consultations) {
            const container = document.getElementById('consultationList');
            
            if (!consultations || consultations.length === 0) {
              container.innerHTML = \`
                <div class="text-center py-12">
                  <i class="fas fa-clipboard-list text-4xl text-gray-300 mb-4"></i>
                  <p class="text-gray-500">상담 기록이 없습니다</p>
                  <a href="/recording" class="mt-4 inline-flex items-center text-primary-600 font-medium">
                    <i class="fas fa-microphone mr-2"></i>첫 상담 녹음하기
                  </a>
                </div>
              \`;
              return;
            }

            const statusColors = {
              paid: 'bg-green-100 text-green-800',
              undecided: 'bg-yellow-100 text-yellow-800',
              lost: 'bg-red-100 text-red-800',
              pending: 'bg-gray-100 text-gray-800'
            };
            const statusText = { paid: '결제완료', undecided: '미결정', lost: '이탈', pending: '분석중' };
            const statusEmoji = { paid: '🟢', undecided: '🟡', lost: '🔴', pending: '⏳' };

            container.innerHTML = consultations.map(c => {
              const date = new Date(c.consultation_date);
              const dateStr = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
              const timeStr = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
              const score = c.feedback?.total_score;
              
              return \`
                <a href="/consultations/\${c.id}" class="block">
                  <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition">
                    <div class="flex justify-between items-start mb-2">
                      <div>
                        <span class="font-semibold text-gray-900">\${c.patient_name}</span>
                        <span class="text-gray-500 text-sm ml-2">\${c.treatment_type || '상담'}</span>
                      </div>
                      <span class="px-2 py-0.5 rounded-full text-xs font-medium \${statusColors[c.status] || statusColors.pending}">
                        \${statusEmoji[c.status] || ''} \${statusText[c.status] || c.status}
                      </span>
                    </div>
                    <div class="flex items-center gap-4 text-sm text-gray-500">
                      <span><i class="far fa-calendar mr-1"></i>\${dateStr} \${timeStr}</span>
                      \${c.duration ? '<span><i class="far fa-clock mr-1"></i>' + c.duration + '분</span>' : ''}
                      \${c.amount ? '<span><i class="fas fa-won-sign mr-1"></i>' + (c.amount / 10000).toFixed(0) + '만원</span>' : ''}
                    </div>
                    \${score ? \`
                      <div class="mt-2 flex items-center gap-2">
                        <span class="text-xs text-gray-500">상담점수</span>
                        <div class="flex-1 bg-gray-200 rounded-full h-1.5">
                          <div class="bg-primary-600 h-1.5 rounded-full" style="width: \${score}%"></div>
                        </div>
                        <span class="text-xs font-medium text-primary-600">\${score}점</span>
                      </div>
                    \` : ''}
                    \${c.decision_score && c.status === 'undecided' ? \`
                      <div class="mt-2 text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded inline-block">
                        결정근접도 \${c.decision_score}/10
                      </div>
                    \` : ''}
                  </div>
                </a>
              \`;
            }).join('');
          }

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
              loadConsultations(currentFilter);
            });
          });

          loadConsultations();
        `
      }} />
    </Layout>
  )
}
