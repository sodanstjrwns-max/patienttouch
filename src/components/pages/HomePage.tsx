import { FC } from 'hono/jsx'
import { Layout, Card, Badge, ProgressBar, Button } from '../shared/Layout'

export const HomePage: FC = () => {
  return (
    <Layout activeTab="home">
      {/* Header */}
      <header class="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 pt-6 pb-8">
        <div class="flex items-center justify-between mb-4">
          <div id="greetingSection">
            <p class="text-primary-200 text-sm">로딩 중...</p>
            <h1 class="text-xl font-bold">페이션트 터치</h1>
          </div>
          <a href="/settings" class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <i class="fas fa-cog text-white"></i>
          </a>
        </div>
      </header>

      <div class="px-4 -mt-4 space-y-4">
        {/* KPI Card */}
        <Card className="p-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-gray-900">
              <i class="fas fa-chart-pie text-primary-600 mr-2"></i>
              이번 주 내 성과
            </h2>
            <a href="/report" class="text-primary-600 text-sm font-medium">
              상세 보기 <i class="fas fa-chevron-right text-xs"></i>
            </a>
          </div>
          <div id="kpiSection" class="space-y-4">
            <div class="animate-pulse space-y-4">
              <div class="h-4 bg-gray-200 rounded w-full"></div>
              <div class="h-4 bg-gray-200 rounded w-full"></div>
              <div class="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </Card>

        {/* Today's Tasks */}
        <Card className="p-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-gray-900">
              <i class="fas fa-tasks text-primary-600 mr-2"></i>
              오늘 할 일
            </h2>
            <span id="taskCount" class="text-sm text-gray-500">0명</span>
          </div>
          
          <div id="taskSection" class="space-y-3">
            <div class="animate-pulse space-y-3">
              <div class="h-20 bg-gray-100 rounded-lg"></div>
              <div class="h-20 bg-gray-100 rounded-lg"></div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div class="grid grid-cols-2 gap-3">
          <a href="/recording" class="bg-primary-600 hover:bg-primary-700 text-white rounded-xl p-4 text-center transition shadow-lg shadow-primary-600/30">
            <i class="fas fa-microphone text-2xl mb-2"></i>
            <p class="font-medium">상담 녹음</p>
          </a>
          <a href="/patients" class="bg-white hover:bg-gray-50 text-gray-800 rounded-xl p-4 text-center border border-gray-200 transition">
            <i class="fas fa-user-plus text-2xl mb-2 text-primary-600"></i>
            <p class="font-medium">환자 등록</p>
          </a>
        </div>

        {/* Recent Consultations */}
        <Card className="p-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-gray-900">
              <i class="fas fa-clock text-primary-600 mr-2"></i>
              오늘 상담
            </h2>
            <a href="/consultations" class="text-primary-600 text-sm font-medium">
              전체 보기 <i class="fas fa-chevron-right text-xs"></i>
            </a>
          </div>
          <div id="recentConsultations" class="space-y-2">
            <p class="text-gray-500 text-sm text-center py-4">오늘 상담 내역이 없습니다</p>
          </div>
        </Card>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          // Check auth and load data
          async function loadHomePage() {
            try {
              // Check auth
              const authRes = await fetch('/api/auth/me');
              if (!authRes.ok) {
                window.location.href = '/login';
                return;
              }
              const authData = await authRes.json();
              if (!authData.success) {
                window.location.href = '/login';
                return;
              }

              // Update greeting
              const hour = new Date().getHours();
              let greeting = '좋은 저녁이에요';
              if (hour < 12) greeting = '좋은 아침이에요';
              else if (hour < 18) greeting = '좋은 오후예요';
              
              document.getElementById('greetingSection').innerHTML = \`
                <p class="text-primary-200 text-sm">\${greeting}, \${authData.data.name}님</p>
                <h1 class="text-xl font-bold">\${authData.data.organization_name}</h1>
              \`;

              // Load dashboard summary
              const summaryRes = await fetch('/api/dashboard/summary');
              const summaryData = await summaryRes.json();
              
              if (summaryData.success) {
                const { week_stats, today_tasks, recent_consultations, user } = summaryData.data;
                const goals = user.goals || { conversion_rate: 80, avg_score: 85, contact_rate: 95, re_consultation: 3 };

                // KPI Section
                document.getElementById('kpiSection').innerHTML = \`
                  <div class="space-y-3">
                    <div>
                      <div class="flex justify-between text-sm mb-1">
                        <span class="text-gray-600">상담 전환율</span>
                        <span class="font-medium">\${week_stats.conversion_rate}% / 목표 \${goals.conversion_rate || 80}%</span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-primary-600 h-2 rounded-full" style="width: \${Math.min(100, (week_stats.conversion_rate / (goals.conversion_rate || 80)) * 100)}%"></div>
                      </div>
                    </div>
                    <div>
                      <div class="flex justify-between text-sm mb-1">
                        <span class="text-gray-600">평균 상담점수</span>
                        <span class="font-medium">\${week_stats.avg_score}점 / 목표 \${goals.avg_score || 85}점</span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-green-500 h-2 rounded-full" style="width: \${Math.min(100, (week_stats.avg_score / (goals.avg_score || 85)) * 100)}%"></div>
                      </div>
                    </div>
                    <div>
                      <div class="flex justify-between text-sm mb-1">
                        <span class="text-gray-600">연락 수행률</span>
                        <span class="font-medium">\${week_stats.contact_rate}% / 목표 \${goals.contact_rate || 95}%</span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-yellow-500 h-2 rounded-full" style="width: \${Math.min(100, (week_stats.contact_rate / (goals.contact_rate || 95)) * 100)}%"></div>
                      </div>
                    </div>
                  </div>
                \`;

                // Task count
                document.getElementById('taskCount').textContent = today_tasks.total + '명';

                // Recent consultations
                if (recent_consultations && recent_consultations.length > 0) {
                  document.getElementById('recentConsultations').innerHTML = recent_consultations.map(c => {
                    const statusColors = {
                      paid: 'bg-green-100 text-green-800',
                      undecided: 'bg-yellow-100 text-yellow-800',
                      lost: 'bg-red-100 text-red-800',
                      pending: 'bg-gray-100 text-gray-800'
                    };
                    const statusText = { paid: '결제완료', undecided: '미결정', lost: '이탈', pending: '대기중' };
                    return \`
                      <a href="/consultations/\${c.id}" class="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                        <div class="flex justify-between items-start">
                          <div>
                            <span class="font-medium">\${c.patient_name}</span>
                            <span class="text-gray-500 text-sm ml-2">\${c.treatment_type || '상담'}</span>
                          </div>
                          <span class="px-2 py-0.5 rounded-full text-xs \${statusColors[c.status] || statusColors.pending}">\${statusText[c.status] || c.status}</span>
                        </div>
                        <div class="text-sm text-gray-500 mt-1">
                          \${c.amount ? (c.amount / 10000).toFixed(0) + '만원' : ''} 
                          \${c.feedback?.total_score ? '• 상담점수 ' + c.feedback.total_score + '점' : ''}
                        </div>
                      </a>
                    \`;
                  }).join('');
                }
              }

              // Load today's tasks
              const tasksRes = await fetch('/api/tasks/today');
              const tasksData = await tasksRes.json();
              
              if (tasksData.success && (tasksData.data.closing.length > 0 || tasksData.data.proactive.length > 0)) {
                let taskHtml = '';
                
                if (tasksData.data.closing.length > 0) {
                  taskHtml += '<div class="mb-3"><p class="text-xs font-medium text-red-600 mb-2">🔥 클로징 (' + tasksData.data.closing.length + ')</p>';
                  taskHtml += tasksData.data.closing.slice(0, 3).map(t => \`
                    <div class="p-3 bg-red-50 rounded-lg border border-red-100 mb-2">
                      <div class="flex justify-between items-start">
                        <div>
                          <span class="font-medium">\${t.patient_name}</span>
                          <span class="text-gray-500 text-sm ml-2">\${t.treatment_type || ''} \${t.amount ? (t.amount / 10000).toFixed(0) + '만' : ''}</span>
                        </div>
                        <span class="text-xs text-gray-500">결정도 \${t.decision_score || '-'}/10</span>
                      </div>
                      <p class="text-sm text-gray-600 mt-1 line-clamp-1">\${t.points?.[0] || ''}</p>
                      <a href="tel:\${t.patient_phone}" class="mt-2 inline-flex items-center text-sm text-primary-600 font-medium">
                        <i class="fas fa-phone mr-1"></i> 연락하기
                      </a>
                    </div>
                  \`).join('');
                  taskHtml += '</div>';
                }
                
                if (tasksData.data.proactive.length > 0) {
                  taskHtml += '<div><p class="text-xs font-medium text-blue-600 mb-2">💙 안부 (' + tasksData.data.proactive.length + ')</p>';
                  taskHtml += tasksData.data.proactive.slice(0, 2).map(t => \`
                    <div class="p-3 bg-blue-50 rounded-lg border border-blue-100 mb-2">
                      <div class="flex justify-between items-start">
                        <span class="font-medium">\${t.patient_name}</span>
                      </div>
                      <p class="text-sm text-gray-600 mt-1 line-clamp-1">\${t.points?.[0] || ''}</p>
                      <a href="tel:\${t.patient_phone}" class="mt-2 inline-flex items-center text-sm text-primary-600 font-medium">
                        <i class="fas fa-phone mr-1"></i> 연락하기
                      </a>
                    </div>
                  \`).join('');
                  taskHtml += '</div>';
                }
                
                document.getElementById('taskSection').innerHTML = taskHtml;
              } else {
                document.getElementById('taskSection').innerHTML = \`
                  <div class="text-center py-6">
                    <i class="fas fa-check-circle text-3xl text-green-500 mb-2"></i>
                    <p class="text-gray-600">오늘 연락할 환자가 없어요!</p>
                    <button onclick="generateTasks()" class="mt-3 text-primary-600 text-sm font-medium">
                      <i class="fas fa-magic mr-1"></i> 연락 대상 찾기
                    </button>
                  </div>
                \`;
              }
            } catch (err) {
              console.error('Failed to load home page:', err);
            }
          }

          async function generateTasks() {
            try {
              const res = await fetch('/api/tasks/generate', { method: 'POST' });
              const data = await res.json();
              if (data.success && data.data.generated > 0) {
                alert(data.data.generated + '명의 연락 대상을 찾았습니다!');
                window.location.reload();
              } else {
                alert('연락할 환자를 찾지 못했습니다.');
              }
            } catch (err) {
              alert('오류가 발생했습니다.');
            }
          }

          loadHomePage();
        `
      }} />
    </Layout>
  )
}
