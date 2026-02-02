import { FC } from 'hono/jsx'
import { Layout, Header, Card, ProgressBar } from '../shared/Layout'

export const ReportPage: FC = () => {
  return (
    <Layout activeTab="report">
      <Header title="리포트" rightAction={
        <select id="periodSelect" class="text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none">
          <option value="week">이번 주</option>
          <option value="month">이번 달</option>
          <option value="quarter">분기</option>
        </select>
      } />
      
      <div class="px-4 py-4 space-y-4">
        {/* KPI Overview */}
        <Card className="p-4">
          <h2 class="font-semibold text-gray-900 mb-4">
            <i class="fas fa-chart-pie text-primary-600 mr-2"></i>
            목표 달성 현황
          </h2>
          <div id="kpiSection" class="space-y-4">
            <div class="animate-pulse space-y-4">
              <div class="h-12 bg-gray-100 rounded"></div>
              <div class="h-12 bg-gray-100 rounded"></div>
              <div class="h-12 bg-gray-100 rounded"></div>
              <div class="h-12 bg-gray-100 rounded"></div>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div class="grid grid-cols-2 gap-3">
          <Card className="p-4 text-center">
            <p class="text-gray-500 text-sm">총 상담</p>
            <p id="totalConsultations" class="text-2xl font-bold text-gray-900">-</p>
          </Card>
          <Card className="p-4 text-center">
            <p class="text-gray-500 text-sm">결제 완료</p>
            <p id="paidConsultations" class="text-2xl font-bold text-green-600">-</p>
          </Card>
          <Card className="p-4 text-center">
            <p class="text-gray-500 text-sm">총 연락</p>
            <p id="totalTasks" class="text-2xl font-bold text-gray-900">-</p>
          </Card>
          <Card className="p-4 text-center">
            <p class="text-gray-500 text-sm">연락 완료</p>
            <p id="completedTasks" class="text-2xl font-bold text-primary-600">-</p>
          </Card>
        </div>

        {/* Total Amount */}
        <Card className="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">총 상담 금액</p>
              <p id="totalAmount" class="text-2xl font-bold text-primary-600">-</p>
            </div>
            <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <i class="fas fa-won-sign text-primary-600 text-xl"></i>
            </div>
          </div>
        </Card>

        {/* Goal Settings */}
        <Card className="p-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-gray-900">
              <i class="fas fa-bullseye text-primary-600 mr-2"></i>
              목표 설정
            </h2>
            <button id="editGoalsBtn" class="text-primary-600 text-sm font-medium">
              <i class="fas fa-edit mr-1"></i>수정
            </button>
          </div>
          <div id="goalsDisplay" class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">상담 전환율 목표</span>
              <span id="goalConversion" class="font-medium">-</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">평균 상담점수 목표</span>
              <span id="goalScore" class="font-medium">-</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">연락 수행률 목표</span>
              <span id="goalContact" class="font-medium">-</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">재상담 성공 목표</span>
              <span id="goalReConsult" class="font-medium">-</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Goals Edit Modal */}
      <div id="goalsModal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
        <div class="bg-white rounded-t-2xl w-full max-w-lg p-6 slide-up">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">목표 설정</h3>
            <button onclick="closeGoalsModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          <form id="goalsForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">상담 전환율 목표 (%)</label>
              <input type="number" name="conversion_rate" min="0" max="100" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="80" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">평균 상담점수 목표 (점)</label>
              <input type="number" name="avg_score" min="0" max="100" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="85" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">연락 수행률 목표 (%)</label>
              <input type="number" name="contact_rate" min="0" max="100" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="95" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">재상담 성공 목표 (건)</label>
              <input type="number" name="re_consultation" min="0" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="3" />
            </div>
            <button type="submit" class="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 rounded-lg transition">
              저장하기
            </button>
          </form>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          let currentGoals = {};

          async function loadReport(period = 'week') {
            try {
              const authRes = await fetch('/api/auth/me');
              if (!authRes.ok) {
                window.location.href = '/login';
                return;
              }

              const res = await fetch('/api/dashboard/kpi?period=' + period);
              const data = await res.json();

              if (data.success) {
                renderKPI(data.data);
              }
            } catch (err) {
              console.error('Failed to load report:', err);
            }
          }

          function renderKPI(data) {
            const { kpi, goals } = data;
            currentGoals = goals;

            // KPI Section
            document.getElementById('kpiSection').innerHTML = \`
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-600">상담 전환율</span>
                  <span class="font-medium \${kpi.conversion_rate >= goals.conversion_rate ? 'text-green-600' : 'text-gray-900'}">
                    \${kpi.conversion_rate}% / \${goals.conversion_rate || 80}%
                    \${kpi.conversion_rate >= goals.conversion_rate ? '✅' : ''}
                  </span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2.5">
                  <div class="bg-primary-600 h-2.5 rounded-full" style="width: \${Math.min(100, (kpi.conversion_rate / (goals.conversion_rate || 80)) * 100)}%"></div>
                </div>
                <p class="text-xs text-gray-500 mt-1">\${kpi.paid_consultations}건 결제 / \${kpi.total_consultations}건 상담</p>
              </div>
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-600">평균 상담점수</span>
                  <span class="font-medium \${kpi.avg_score >= goals.avg_score ? 'text-green-600' : 'text-gray-900'}">
                    \${kpi.avg_score}점 / \${goals.avg_score || 85}점
                    \${kpi.avg_score >= goals.avg_score ? '✅' : ''}
                  </span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2.5">
                  <div class="bg-green-500 h-2.5 rounded-full" style="width: \${Math.min(100, (kpi.avg_score / (goals.avg_score || 85)) * 100)}%"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-600">연락 수행률</span>
                  <span class="font-medium \${kpi.contact_rate >= goals.contact_rate ? 'text-green-600' : 'text-gray-900'}">
                    \${kpi.contact_rate}% / \${goals.contact_rate || 95}%
                    \${kpi.contact_rate >= goals.contact_rate ? '✅' : ''}
                  </span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2.5">
                  <div class="bg-yellow-500 h-2.5 rounded-full" style="width: \${Math.min(100, (kpi.contact_rate / (goals.contact_rate || 95)) * 100)}%"></div>
                </div>
                <p class="text-xs text-gray-500 mt-1">\${kpi.completed_tasks}건 완료 / \${kpi.total_tasks}건 예정</p>
              </div>
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-600">재상담 성공</span>
                  <span class="font-medium \${kpi.re_consultation >= goals.re_consultation ? 'text-green-600' : 'text-gray-900'}">
                    \${kpi.re_consultation}건 / \${goals.re_consultation || 3}건
                    \${kpi.re_consultation >= goals.re_consultation ? '✅' : ''}
                  </span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2.5">
                  <div class="bg-purple-500 h-2.5 rounded-full" style="width: \${Math.min(100, (kpi.re_consultation / (goals.re_consultation || 3)) * 100)}%"></div>
                </div>
              </div>
            \`;

            // Stats
            document.getElementById('totalConsultations').textContent = kpi.total_consultations + '건';
            document.getElementById('paidConsultations').textContent = kpi.paid_consultations + '건';
            document.getElementById('totalTasks').textContent = kpi.total_tasks + '건';
            document.getElementById('completedTasks').textContent = kpi.completed_tasks + '건';
            document.getElementById('totalAmount').textContent = (data.total_amount / 10000).toFixed(0) + '만원';

            // Goals display
            document.getElementById('goalConversion').textContent = (goals.conversion_rate || 80) + '%';
            document.getElementById('goalScore').textContent = (goals.avg_score || 85) + '점';
            document.getElementById('goalContact').textContent = (goals.contact_rate || 95) + '%';
            document.getElementById('goalReConsult').textContent = (goals.re_consultation || 3) + '건';
          }

          // Period select
          document.getElementById('periodSelect').addEventListener('change', (e) => {
            loadReport(e.target.value);
          });

          // Goals modal
          document.getElementById('editGoalsBtn').addEventListener('click', () => {
            const form = document.getElementById('goalsForm');
            form.conversion_rate.value = currentGoals.conversion_rate || 80;
            form.avg_score.value = currentGoals.avg_score || 85;
            form.contact_rate.value = currentGoals.contact_rate || 95;
            form.re_consultation.value = currentGoals.re_consultation || 3;
            document.getElementById('goalsModal').classList.remove('hidden');
          });

          function closeGoalsModal() {
            document.getElementById('goalsModal').classList.add('hidden');
          }

          document.getElementById('goalsModal').addEventListener('click', (e) => {
            if (e.target.id === 'goalsModal') closeGoalsModal();
          });

          document.getElementById('goalsForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const goals = {
              conversion_rate: parseInt(formData.get('conversion_rate')) || 80,
              avg_score: parseInt(formData.get('avg_score')) || 85,
              contact_rate: parseInt(formData.get('contact_rate')) || 95,
              re_consultation: parseInt(formData.get('re_consultation')) || 3
            };

            try {
              const res = await fetch('/api/auth/goals', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(goals)
              });
              
              const data = await res.json();
              
              if (data.success) {
                closeGoalsModal();
                loadReport(document.getElementById('periodSelect').value);
              } else {
                alert(data.error || '목표 저장에 실패했습니다.');
              }
            } catch (err) {
              alert('오류가 발생했습니다.');
            }
          });

          loadReport();
        `
      }} />
    </Layout>
  )
}
