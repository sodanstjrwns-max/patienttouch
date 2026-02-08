import { FC } from 'hono/jsx'
import { Layout, Card, Badge, Button, SectionTitle, Skeleton, Avatar } from '../shared/Layout'

export const HomePage: FC = () => {
  return (
    <Layout activeTab="home">
      {/* Hero Header */}
      <header class="relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-dark">
          <div class="absolute inset-0 opacity-40" style="background-image: url(&quot;data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='g' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(99,102,241,0.06)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3C/svg%3E&quot;)" />
          <div class="absolute -top-20 -right-20 w-60 h-60 bg-brand-500/15 rounded-full blur-3xl" />
          <div class="absolute bottom-0 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
        </div>
        
        <div class="relative px-5 pt-14 pb-8 safe-area-top">
          <div class="flex items-start justify-between mb-8">
            <div id="greetingSection">
              <div class="flex items-center gap-2 mb-1">
                <div class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-soft" />
                <p class="text-brand-300 text-xs font-medium tracking-wide">로딩 중...</p>
              </div>
              <h1 class="text-2xl font-black text-white tracking-tight">페이션트 터치</h1>
            </div>
            <div class="flex items-center gap-2">
              <a href="/admin" class="w-10 h-10 glass-dark rounded-xl flex items-center justify-center text-surface-400 hover:text-white transition-colors">
                <i class="fas fa-chart-mixed text-sm"></i>
              </a>
              <a href="/settings" class="w-10 h-10 glass-dark rounded-xl flex items-center justify-center text-surface-400 hover:text-white transition-colors">
                <i class="fas fa-gear text-sm"></i>
              </a>
            </div>
          </div>
          
          {/* Quick Action Buttons */}
          <div class="flex gap-3">
            <a href="/recording" class="flex-1 bg-gradient-brand rounded-2xl p-4 flex items-center gap-3 shadow-lg shadow-brand-600/30 hover:shadow-xl hover:shadow-brand-600/40 transition-all active:scale-[0.97] group">
              <div class="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <i class="fas fa-microphone text-xl text-white"></i>
              </div>
              <div>
                <p class="text-white font-bold text-sm">상담 녹음</p>
                <p class="text-brand-200 text-xs">터치 한 번으로 시작</p>
              </div>
            </a>
            <a href="/patients" class="glass-dark rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 min-w-[80px] hover:bg-white/10 transition-all active:scale-[0.97]">
              <i class="fas fa-user-plus text-lg text-brand-400"></i>
              <span class="text-xs font-semibold text-surface-300">환자 등록</span>
            </a>
          </div>
        </div>
      </header>

      <div class="px-4 -mt-2 space-y-5 stagger-children">
        {/* KPI Cards */}
        <div>
          <SectionTitle 
            title="이번 주 성과" 
            icon="fas fa-chart-pie"
            action={
              <a href="/report" class="text-xs font-semibold text-brand-600 flex items-center gap-1 hover:text-brand-700 transition-colors">
                상세 <i class="fas fa-chevron-right text-[8px]"></i>
              </a>
            }
          />
          <div id="kpiSection" class="grid grid-cols-2 gap-3">
            <Skeleton type="card" />
            <Skeleton type="card" />
          </div>
        </div>

        {/* Today's Tasks */}
        <div>
          <SectionTitle 
            title="오늘 할 일"
            icon="fas fa-list-check"
            action={<span id="taskCount" class="text-xs font-bold text-surface-400 bg-surface-100 px-2 py-0.5 rounded-md">0</span>}
          />
          <div id="taskSection" class="space-y-3">
            <Skeleton type="card" />
          </div>
        </div>

        {/* Recent Consultations */}
        <div>
          <SectionTitle 
            title="오늘 상담"
            icon="fas fa-clock"
            action={
              <a href="/consultations" class="text-xs font-semibold text-brand-600 flex items-center gap-1 hover:text-brand-700 transition-colors">
                전체 <i class="fas fa-chevron-right text-[8px]"></i>
              </a>
            }
          />
          <div id="recentConsultations">
            <div class="card-premium p-5">
              <div class="text-center py-4">
                <div class="w-12 h-12 mx-auto bg-surface-100 rounded-xl flex items-center justify-center mb-3">
                  <i class="fas fa-calendar-check text-surface-300 text-lg"></i>
                </div>
                <p class="text-surface-400 text-sm font-medium">오늘 상담 내역이 없습니다</p>
              </div>
            </div>
          </div>
        </div>

        {/* Spacer for bottom nav */}
        <div class="h-4" />
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          async function loadHomePage() {
            try {
              const authRes = await fetch('/api/auth/me');
              if (!authRes.ok) { window.location.href = '/login'; return; }
              const authData = await authRes.json();
              if (!authData.success) { window.location.href = '/login'; return; }

              const hour = new Date().getHours();
              let greeting = '좋은 저녁이에요';
              let emoji = '🌙';
              if (hour < 12) { greeting = '좋은 아침이에요'; emoji = '☀️'; }
              else if (hour < 18) { greeting = '좋은 오후예요'; emoji = '🌤️'; }
              
              document.getElementById('greetingSection').innerHTML = \`
                <div class="flex items-center gap-2 mb-1">
                  <div class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-soft"></div>
                  <p class="text-brand-300 text-xs font-medium tracking-wide">\${emoji} \${greeting}, \${authData.data.name}님</p>
                </div>
                <h1 class="text-2xl font-black text-white tracking-tight">\${authData.data.organization_name}</h1>
              \`;

              const summaryRes = await fetch('/api/dashboard/summary');
              const summaryData = await summaryRes.json();
              
              if (summaryData.success) {
                const { week_stats, today_tasks, recent_consultations, user } = summaryData.data;
                const goals = user.goals || { conversion_rate: 80, avg_score: 85, contact_rate: 95 };

                // KPI Cards
                document.getElementById('kpiSection').innerHTML = \`
                  <div class="card-premium p-4 group">
                    <div class="flex items-start justify-between mb-3">
                      <div class="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 group-hover:scale-110 transition-transform">
                        <i class="fas fa-chart-line text-base"></i>
                      </div>
                      \${week_stats.conversion_rate > 0 ? '<span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md"><i class="fas fa-arrow-up text-[9px] mr-0.5"></i>전환</span>' : ''}
                    </div>
                    <div class="text-2xl font-extrabold tracking-tight">\${week_stats.conversion_rate}<span class="text-sm font-medium text-surface-400 ml-0.5">%</span></div>
                    <div class="text-xs font-medium text-surface-500 mt-0.5">상담 전환율</div>
                    <div class="mt-3">
                      <div class="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-1000" style="width: \${Math.min(100, (week_stats.conversion_rate / (goals.conversion_rate || 80)) * 100)}%"></div>
                      </div>
                      <div class="flex justify-between mt-1"><span class="text-[10px] text-surface-400">목표 \${goals.conversion_rate || 80}%</span></div>
                    </div>
                  </div>
                  <div class="card-premium p-4 group">
                    <div class="flex items-start justify-between mb-3">
                      <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                        <i class="fas fa-star text-base"></i>
                      </div>
                    </div>
                    <div class="text-2xl font-extrabold tracking-tight">\${week_stats.avg_score}<span class="text-sm font-medium text-surface-400 ml-0.5">점</span></div>
                    <div class="text-xs font-medium text-surface-500 mt-0.5">평균 상담점수</div>
                    <div class="mt-3">
                      <div class="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000" style="width: \${Math.min(100, (week_stats.avg_score / (goals.avg_score || 85)) * 100)}%"></div>
                      </div>
                      <div class="flex justify-between mt-1"><span class="text-[10px] text-surface-400">목표 \${goals.avg_score || 85}점</span></div>
                    </div>
                  </div>
                  <div class="card-premium p-4 group">
                    <div class="flex items-start justify-between mb-3">
                      <div class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                        <i class="fas fa-phone text-base"></i>
                      </div>
                    </div>
                    <div class="text-2xl font-extrabold tracking-tight">\${week_stats.contact_rate}<span class="text-sm font-medium text-surface-400 ml-0.5">%</span></div>
                    <div class="text-xs font-medium text-surface-500 mt-0.5">연락 수행률</div>
                    <div class="mt-3">
                      <div class="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-1000" style="width: \${Math.min(100, (week_stats.contact_rate / (goals.contact_rate || 95)) * 100)}%"></div>
                      </div>
                      <div class="flex justify-between mt-1"><span class="text-[10px] text-surface-400">목표 \${goals.contact_rate || 95}%</span></div>
                    </div>
                  </div>
                  <div class="card-premium p-4 group">
                    <div class="flex items-start justify-between mb-3">
                      <div class="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 group-hover:scale-110 transition-transform">
                        <i class="fas fa-stethoscope text-base"></i>
                      </div>
                    </div>
                    <div class="text-2xl font-extrabold tracking-tight">\${week_stats.total_consultations}<span class="text-sm font-medium text-surface-400 ml-0.5">건</span></div>
                    <div class="text-xs font-medium text-surface-500 mt-0.5">총 상담 건수</div>
                    <div class="mt-3 flex items-center gap-2">
                      <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700">\${week_stats.paid_consultations} 결제</span>
                      <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-surface-100 text-surface-600">\${week_stats.total_consultations - week_stats.paid_consultations} 미결정</span>
                    </div>
                  </div>
                \`;

                document.getElementById('taskCount').textContent = today_tasks.total + '명';

                // Recent consultations
                if (recent_consultations && recent_consultations.length > 0) {
                  document.getElementById('recentConsultations').innerHTML = '<div class="space-y-2">' + recent_consultations.map(function(c) {
                    var statusConfig = {
                      paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200/50', label: '결제완료', dot: 'bg-emerald-500' },
                      undecided: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200/50', label: '미결정', dot: 'bg-amber-500' },
                      lost: { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200/50', label: '이탈', dot: 'bg-rose-500' },
                      pending: { bg: 'bg-surface-50', text: 'text-surface-600', ring: 'ring-surface-200/50', label: '대기중', dot: 'bg-surface-400' }
                    };
                    var st = statusConfig[c.status] || statusConfig.pending;
                    return '<a href="/consultations/' + c.id + '" class="card-premium p-4 flex items-center gap-3.5 block">' +
                      '<div class="w-11 h-11 rounded-xl ' + st.bg + ' flex items-center justify-center shrink-0">' +
                        '<span class="text-lg font-bold ' + st.text + '">' + (c.patient_name ? c.patient_name.charAt(0) : '?') + '</span>' +
                      '</div>' +
                      '<div class="flex-1 min-w-0">' +
                        '<div class="flex items-center justify-between">' +
                          '<span class="font-bold text-sm truncate">' + (c.patient_name || '미지정') + '</span>' +
                          '<span class="inline-flex items-center gap-1 font-semibold rounded-lg ring-1 ring-inset px-1.5 py-0.5 text-[10px] ' + st.bg + ' ' + st.text + ' ' + st.ring + '">' +
                            '<span class="w-1.5 h-1.5 rounded-full ' + st.dot + '"></span>' + st.label +
                          '</span>' +
                        '</div>' +
                        '<div class="flex items-center gap-2 mt-0.5">' +
                          (c.treatment_type ? '<span class="text-xs text-surface-500">' + c.treatment_type + '</span>' : '') +
                          (c.amount ? '<span class="text-xs font-semibold text-surface-600">' + (c.amount / 10000).toFixed(0) + '만원</span>' : '') +
                          (c.feedback && c.feedback.total_score ? '<span class="text-xs font-semibold text-brand-600">' + c.feedback.total_score + '점</span>' : '') +
                        '</div>' +
                      '</div>' +
                      '<i class="fas fa-chevron-right text-surface-300 text-xs"></i>' +
                    '</a>';
                  }).join('') + '</div>';
                }
              }

              // Load today's tasks
              const tasksRes = await fetch('/api/tasks/today');
              const tasksData = await tasksRes.json();
              
              if (tasksData.success && (tasksData.data.closing.length > 0 || tasksData.data.proactive.length > 0)) {
                var taskHtml = '';
                
                if (tasksData.data.closing.length > 0) {
                  taskHtml += '<div class="mb-3"><div class="flex items-center gap-2 mb-2"><span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold ring-1 ring-inset ring-rose-200/50"><i class="fas fa-fire text-[9px]"></i>클로징 ' + tasksData.data.closing.length + '</span></div>';
                  taskHtml += tasksData.data.closing.slice(0, 3).map(function(t) {
                    return '<div class="card-premium p-4 mb-2 border-l-4 border-l-rose-400">' +
                      '<div class="flex items-center justify-between mb-2">' +
                        '<div class="flex items-center gap-2">' +
                          '<div class="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-700 font-bold text-xs">' + (t.patient_name ? t.patient_name.charAt(0) : '?') + '</div>' +
                          '<div>' +
                            '<span class="font-bold text-sm">' + t.patient_name + '</span>' +
                            '<div class="text-[10px] text-surface-500">' + (t.treatment_type || '') + ' ' + (t.amount ? (t.amount / 10000).toFixed(0) + '만' : '') + '</div>' +
                          '</div>' +
                        '</div>' +
                        '<div class="text-right">' +
                          '<div class="text-[10px] font-bold text-brand-600">결정도</div>' +
                          '<div class="text-lg font-black text-surface-900">' + (t.decision_score || '-') + '<span class="text-xs text-surface-400">/10</span></div>' +
                        '</div>' +
                      '</div>' +
                      '<p class="text-xs text-surface-600 line-clamp-1 mb-2">' + (t.points && t.points[0] ? t.points[0] : '') + '</p>' +
                      '<a href="tel:' + t.patient_phone + '" class="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg transition-colors">' +
                        '<i class="fas fa-phone text-[10px]"></i>연락하기' +
                      '</a>' +
                    '</div>';
                  }).join('');
                  taskHtml += '</div>';
                }
                
                if (tasksData.data.proactive.length > 0) {
                  taskHtml += '<div><div class="flex items-center gap-2 mb-2"><span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-[10px] font-bold ring-1 ring-inset ring-sky-200/50"><i class="fas fa-heart text-[9px]"></i>안부 ' + tasksData.data.proactive.length + '</span></div>';
                  taskHtml += tasksData.data.proactive.slice(0, 2).map(function(t) {
                    return '<div class="card-premium p-4 mb-2 border-l-4 border-l-sky-400">' +
                      '<div class="flex items-center justify-between">' +
                        '<div class="flex items-center gap-2">' +
                          '<div class="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-700 font-bold text-xs">' + (t.patient_name ? t.patient_name.charAt(0) : '?') + '</div>' +
                          '<span class="font-bold text-sm">' + t.patient_name + '</span>' +
                        '</div>' +
                        '<a href="tel:' + t.patient_phone + '" class="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 hover:bg-brand-100 transition-colors"><i class="fas fa-phone text-xs"></i></a>' +
                      '</div>' +
                      '<p class="text-xs text-surface-500 mt-2 line-clamp-1">' + (t.points && t.points[0] ? t.points[0] : '') + '</p>' +
                    '</div>';
                  }).join('');
                  taskHtml += '</div>';
                }
                
                document.getElementById('taskSection').innerHTML = taskHtml;
              } else {
                document.getElementById('taskSection').innerHTML = 
                  '<div class="card-premium p-6 text-center">' +
                    '<div class="w-14 h-14 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center mb-3">' +
                      '<i class="fas fa-circle-check text-2xl text-emerald-500"></i>' +
                    '</div>' +
                    '<p class="font-bold text-surface-800 mb-0.5">오늘 할 일 완료!</p>' +
                    '<p class="text-sm text-surface-500 mb-4">연락할 환자가 없어요</p>' +
                    '<button onclick="generateTasks()" class="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-xl transition-all">' +
                      '<i class="fas fa-wand-magic-sparkles"></i>연락 대상 찾기' +
                    '</button>' +
                  '</div>';
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
