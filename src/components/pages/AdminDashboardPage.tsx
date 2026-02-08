import { FC } from 'hono/jsx'
import { Layout, Header } from '../shared/Layout'

export const AdminDashboardPage: FC = () => {
  return (
    <Layout activeTab="report">
      <Header title="원장 대시보드" showBack={false} rightAction={
        <button id="periodSelect" class="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">
          이번 주 <i class="fas fa-chevron-down ml-1"></i>
        </button>
      } />
      
      <div class="px-4 py-4 space-y-6">
        {/* Summary Cards */}
        <div id="summaryCards" class="grid grid-cols-2 gap-3">
          <div class="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-4 text-white">
            <p class="text-primary-100 text-xs">총 상담</p>
            <p id="totalConsultations" class="text-3xl font-bold mt-1">-</p>
            <p class="text-primary-200 text-xs mt-1"><span id="consultationTrend">-</span> vs 지난주</p>
          </div>
          <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
            <p class="text-green-100 text-xs">전환율</p>
            <p id="conversionRate" class="text-3xl font-bold mt-1">-%</p>
            <p class="text-green-200 text-xs mt-1"><span id="conversionTrend">-</span> vs 지난주</p>
          </div>
          <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <p class="text-blue-100 text-xs">평균 코칭점수</p>
            <p id="avgCoachingScore" class="text-3xl font-bold mt-1">-점</p>
            <p class="text-blue-200 text-xs mt-1"><span id="coachingTrend">-</span> vs 지난주</p>
          </div>
          <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
            <p class="text-purple-100 text-xs">제안서 열람율</p>
            <p id="proposalViewRate" class="text-3xl font-bold mt-1">-%</p>
            <p class="text-purple-200 text-xs mt-1"><span id="proposalTrend">-</span> vs 지난주</p>
          </div>
        </div>

        {/* Staff Performance */}
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div class="p-4 border-b border-gray-100">
            <h3 class="font-semibold text-gray-900">
              <i class="fas fa-users text-primary-600 mr-2"></i>상담사 성과
            </h3>
          </div>
          <div id="staffPerformance" class="divide-y divide-gray-50">
            {/* Loading */}
            <div class="p-4 animate-pulse">
              <div class="h-16 bg-gray-100 rounded-lg"></div>
            </div>
          </div>
        </div>

        {/* Coaching Breakdown */}
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 class="font-semibold text-gray-900 mb-4">
            <i class="fas fa-chart-radar text-primary-600 mr-2"></i>코칭 영역별 평균
          </h3>
          <div id="coachingBreakdown" class="space-y-3">
            {/* Will be filled dynamically */}
          </div>
        </div>

        {/* Recent Low Score Consultations */}
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div class="p-4 border-b border-gray-100">
            <h3 class="font-semibold text-gray-900">
              <i class="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>코칭 필요 상담
            </h3>
            <p class="text-xs text-gray-500 mt-1">점수 70점 미만 상담</p>
          </div>
          <div id="lowScoreConsultations" class="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            <div class="p-4 animate-pulse">
              <div class="h-16 bg-gray-100 rounded-lg"></div>
            </div>
          </div>
        </div>

        {/* Proposal Analytics */}
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 class="font-semibold text-gray-900 mb-4">
            <i class="fas fa-file-invoice text-primary-600 mr-2"></i>제안서 현황
          </h3>
          <div id="proposalAnalytics" class="grid grid-cols-3 gap-3 text-center">
            <div class="bg-gray-50 rounded-lg p-3">
              <p id="proposalsSent" class="text-2xl font-bold text-gray-900">-</p>
              <p class="text-xs text-gray-500">발송</p>
            </div>
            <div class="bg-blue-50 rounded-lg p-3">
              <p id="proposalsViewed" class="text-2xl font-bold text-blue-600">-</p>
              <p class="text-xs text-gray-500">열람</p>
            </div>
            <div class="bg-green-50 rounded-lg p-3">
              <p id="proposalsConverted" class="text-2xl font-bold text-green-600">-</p>
              <p class="text-xs text-gray-500">전환</p>
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          let currentPeriod = 'weekly';

          async function loadDashboard() {
            try {
              const authRes = await fetch('/api/auth/me');
              if (!authRes.ok) {
                window.location.href = '/login';
                return;
              }

              const userData = await authRes.json();
              if (userData.data.role !== 'admin') {
                // Not admin - redirect
                alert('관리자만 접근할 수 있습니다.');
                window.location.href = '/';
                return;
              }

              await Promise.all([
                loadSummary(),
                loadStaffPerformance(),
                loadCoachingBreakdown(),
                loadLowScoreConsultations(),
                loadProposalAnalytics()
              ]);
            } catch (err) {
              console.error('Failed to load dashboard:', err);
            }
          }

          async function loadSummary() {
            try {
              const res = await fetch('/api/dashboard/admin-summary?period=' + currentPeriod);
              const data = await res.json();

              if (data.success) {
                const s = data.data;
                document.getElementById('totalConsultations').textContent = s.total_consultations || 0;
                document.getElementById('conversionRate').textContent = (s.conversion_rate || 0).toFixed(0) + '%';
                document.getElementById('avgCoachingScore').textContent = (s.avg_coaching_score || 0).toFixed(0) + '점';
                document.getElementById('proposalViewRate').textContent = (s.proposal_view_rate || 0).toFixed(0) + '%';

                // Trends
                document.getElementById('consultationTrend').textContent = formatTrend(s.consultation_trend);
                document.getElementById('conversionTrend').textContent = formatTrend(s.conversion_trend);
                document.getElementById('coachingTrend').textContent = formatTrend(s.coaching_trend);
                document.getElementById('proposalTrend').textContent = formatTrend(s.proposal_trend);
              }
            } catch {}
          }

          function formatTrend(value) {
            if (!value) return '-';
            const sign = value > 0 ? '+' : '';
            return sign + value.toFixed(1) + '%';
          }

          async function loadStaffPerformance() {
            try {
              const res = await fetch('/api/dashboard/staff-performance?period=' + currentPeriod);
              const data = await res.json();

              const container = document.getElementById('staffPerformance');
              
              if (data.success && data.data.length > 0) {
                container.innerHTML = data.data.map(staff => \`
                  <div class="p-4 hover:bg-gray-50 transition">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span class="text-primary-700 font-medium">\${staff.name.slice(0, 1)}</span>
                        </div>
                        <div>
                          <p class="font-medium text-gray-900">\${staff.name}</p>
                          <p class="text-xs text-gray-500">\${staff.total_consultations}건 상담</p>
                        </div>
                      </div>
                      <div class="text-right">
                        <p class="font-bold text-gray-900">\${(staff.conversion_rate || 0).toFixed(0)}%</p>
                        <p class="text-xs text-gray-500">전환율</p>
                      </div>
                      <div class="text-right">
                        <p class="font-bold \${staff.avg_coaching_score >= 80 ? 'text-green-600' : staff.avg_coaching_score >= 60 ? 'text-yellow-600' : 'text-red-600'}">\${(staff.avg_coaching_score || 0).toFixed(0)}점</p>
                        <p class="text-xs text-gray-500">코칭점수</p>
                      </div>
                    </div>
                    <div class="mt-2 flex gap-1">
                      <div class="h-1 rounded-full bg-green-400" style="width: \${staff.conversion_rate || 0}%"></div>
                      <div class="h-1 rounded-full bg-gray-200 flex-1"></div>
                    </div>
                  </div>
                \`).join('');
              } else {
                container.innerHTML = '<p class="p-4 text-gray-500 text-center text-sm">데이터가 없습니다.</p>';
              }
            } catch {}
          }

          async function loadCoachingBreakdown() {
            try {
              const res = await fetch('/api/dashboard/coaching-breakdown?period=' + currentPeriod);
              const data = await res.json();

              const container = document.getElementById('coachingBreakdown');
              
              if (data.success) {
                const areas = [
                  { key: 'rapport', name: '라포 형성', max: 20, color: 'bg-pink-500' },
                  { key: 'spin', name: 'SPIN 활용', max: 25, color: 'bg-purple-500' },
                  { key: 'objection', name: '반론 처리', max: 20, color: 'bg-blue-500' },
                  { key: 'pricing', name: '가격 프레이밍', max: 15, color: 'bg-green-500' },
                  { key: 'closing', name: '클로징', max: 10, color: 'bg-yellow-500' },
                  { key: 'structure', name: '전체 구조', max: 10, color: 'bg-orange-500' }
                ];

                container.innerHTML = areas.map(area => {
                  const score = data.data[area.key] || 0;
                  const percent = (score / area.max) * 100;
                  return \`
                    <div class="flex items-center gap-3">
                      <span class="text-sm text-gray-600 w-24">\${area.name}</span>
                      <div class="flex-1 bg-gray-100 rounded-full h-2">
                        <div class="\${area.color} h-2 rounded-full" style="width: \${percent}%"></div>
                      </div>
                      <span class="text-sm font-medium text-gray-900 w-16 text-right">\${score.toFixed(1)}/\${area.max}</span>
                    </div>
                  \`;
                }).join('');
              }
            } catch {}
          }

          async function loadLowScoreConsultations() {
            try {
              const res = await fetch('/api/dashboard/low-score-consultations?threshold=70&limit=5');
              const data = await res.json();

              const container = document.getElementById('lowScoreConsultations');
              
              if (data.success && data.data.length > 0) {
                container.innerHTML = data.data.map(c => {
                  const date = new Date(c.consultation_date);
                  return \`
                    <a href="/consultations/\${c.id}/report" class="block p-4 hover:bg-gray-50 transition">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="font-medium text-gray-900">\${c.patient_name || '환자 미지정'}</p>
                          <p class="text-xs text-gray-500">\${c.user_name} · \${date.toLocaleDateString('ko-KR')}</p>
                        </div>
                        <div class="text-right">
                          <p class="text-xl font-bold text-red-500">\${c.coaching_score || 0}점</p>
                        </div>
                      </div>
                      \${c.improvement_needed ? \`<p class="text-xs text-yellow-600 mt-1">💡 \${c.improvement_needed}</p>\` : ''}
                    </a>
                  \`;
                }).join('');
              } else {
                container.innerHTML = '<p class="p-4 text-gray-500 text-center text-sm">코칭 필요 상담이 없습니다. 👍</p>';
              }
            } catch {}
          }

          async function loadProposalAnalytics() {
            try {
              const res = await fetch('/api/dashboard/proposal-analytics?period=' + currentPeriod);
              const data = await res.json();

              if (data.success) {
                document.getElementById('proposalsSent').textContent = data.data.sent || 0;
                document.getElementById('proposalsViewed').textContent = data.data.viewed || 0;
                document.getElementById('proposalsConverted').textContent = data.data.converted || 0;
              }
            } catch {}
          }

          // Period selector
          document.getElementById('periodSelect').addEventListener('click', () => {
            const periods = { daily: '오늘', weekly: '이번 주', monthly: '이번 달' };
            const keys = Object.keys(periods);
            const currentIdx = keys.indexOf(currentPeriod);
            currentPeriod = keys[(currentIdx + 1) % keys.length];
            document.getElementById('periodSelect').innerHTML = periods[currentPeriod] + ' <i class="fas fa-chevron-down ml-1"></i>';
            loadDashboard();
          });

          loadDashboard();
        `
      }} />
    </Layout>
  )
}
