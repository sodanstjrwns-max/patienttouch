import { FC } from 'hono/jsx'
import { Layout, Header, Card } from '../shared/Layout'

interface Props {
  id: string
}

export const PatientDetailPage: FC<Props> = ({ id }) => {
  return (
    <Layout activeTab="patients">
      <Header title="환자 카드" showBack backUrl="/patients" rightAction={
        <button id="editBtn" class="text-primary-600 font-medium text-sm">
          <i class="fas fa-edit mr-1"></i>수정
        </button>
      } />
      
      <div id="patientDetail" class="px-4 py-4 space-y-4">
        <div class="animate-pulse space-y-4">
          <div class="h-32 bg-gray-100 rounded-xl"></div>
          <div class="h-48 bg-gray-100 rounded-xl"></div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          const patientId = '${id}';

          async function loadPatient() {
            try {
              const authRes = await fetch('/api/auth/me');
              if (!authRes.ok) {
                window.location.href = '/login';
                return;
              }

              const res = await fetch('/api/patients/' + patientId);
              const data = await res.json();

              if (data.success) {
                renderPatient(data.data);
              } else {
                document.getElementById('patientDetail').innerHTML = \`
                  <div class="text-center py-12">
                    <i class="fas fa-exclamation-circle text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">환자 정보를 찾을 수 없습니다</p>
                  </div>
                \`;
              }
            } catch (err) {
              console.error('Failed to load patient:', err);
            }
          }

          function renderPatient(p) {
            const container = document.getElementById('patientDetail');
            const consultations = p.consultations || [];
            const contactLogs = p.contact_logs || [];
            const pendingTasks = p.pending_tasks || [];
            const tags = p.tags || [];

            const statusColors = {
              paid: 'bg-green-100 text-green-800',
              undecided: 'bg-yellow-100 text-yellow-800',
              lost: 'bg-red-100 text-red-800',
              pending: 'bg-gray-100 text-gray-800'
            };
            const statusText = { paid: '결제완료', undecided: '미결정', lost: '이탈', pending: '대기중' };

            let html = \`
              <!-- Patient Info Card -->
              <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div class="flex items-start gap-4">
                  <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-user text-2xl text-primary-600"></i>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <h2 class="text-xl font-bold text-gray-900">\${p.name}</h2>
                      \${p.age ? '<span class="text-gray-500">(' + p.age + '세 ' + (p.gender === 'male' ? '남성' : p.gender === 'female' ? '여성' : '') + ')</span>' : ''}
                    </div>
                    \${p.phone ? \`
                      <a href="tel:\${p.phone}" class="text-primary-600 font-medium">
                        <i class="fas fa-phone mr-1"></i>\${p.phone}
                      </a>
                    \` : ''}
                    \${tags.length > 0 ? \`
                      <div class="flex flex-wrap gap-1 mt-2">
                        \${tags.map(t => '<span class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">' + t + '</span>').join('')}
                      </div>
                    \` : ''}
                  </div>
                </div>
                \${p.memo ? '<p class="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">' + p.memo + '</p>' : ''}
              </div>

              <!-- Quick Actions -->
              <div class="grid grid-cols-2 gap-3">
                <a href="tel:\${p.phone || ''}" class="bg-primary-600 hover:bg-primary-700 text-white rounded-xl py-3 text-center font-medium transition \${!p.phone ? 'opacity-50 pointer-events-none' : ''}">
                  <i class="fas fa-phone mr-2"></i>전화
                </a>
                <a href="/recording/\${p.id}" class="bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl py-3 text-center font-medium transition">
                  <i class="fas fa-microphone mr-2"></i>상담 녹음
                </a>
              </div>
            \`;

            // Pending Tasks
            if (pendingTasks.length > 0) {
              html += \`
                <div class="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
                  <h3 class="font-semibold text-yellow-800 mb-3">
                    <i class="fas fa-bell mr-2"></i>예정된 연락
                  </h3>
                  <div class="space-y-2">
                    \${pendingTasks.map(t => {
                      const date = new Date(t.recommended_date);
                      const dateStr = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
                      const typeEmoji = t.task_type === 'closing' ? '🔥' : '💙';
                      return \`
                        <div class="bg-white p-3 rounded-lg">
                          <div class="flex justify-between items-start">
                            <span class="font-medium">\${typeEmoji} \${t.task_type === 'closing' ? '클로징' : '안부'} 연락</span>
                            <span class="text-xs text-gray-500">\${dateStr}</span>
                          </div>
                          \${t.points && t.points.length > 0 ? '<p class="text-sm text-gray-600 mt-1">' + t.points[0] + '</p>' : ''}
                        </div>
                      \`;
                    }).join('')}
                  </div>
                </div>
              \`;
            }

            // Consultation History
            html += \`
              <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <h3 class="font-semibold text-gray-900 mb-3">
                  <i class="fas fa-history text-primary-600 mr-2"></i>상담 히스토리
                </h3>
            \`;

            if (consultations.length > 0) {
              html += '<div class="space-y-3">' + consultations.map(c => {
                const date = new Date(c.consultation_date);
                const dateStr = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
                const score = c.feedback?.total_score;
                
                return \`
                  <a href="/consultations/\${c.id}" class="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div class="flex justify-between items-start">
                      <div>
                        <span class="font-medium">\${c.treatment_type || '상담'}</span>
                        \${c.amount ? '<span class="text-gray-500 text-sm ml-2">' + (c.amount / 10000).toFixed(0) + '만원</span>' : ''}
                      </div>
                      <span class="px-2 py-0.5 rounded-full text-xs \${statusColors[c.status]}">\${statusText[c.status]}</span>
                    </div>
                    <div class="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span>\${dateStr}</span>
                      \${c.duration ? '<span>' + c.duration + '분</span>' : ''}
                      \${c.decision_score ? '<span>결정도 ' + c.decision_score + '/10</span>' : ''}
                    </div>
                    \${score ? \`
                      <div class="mt-2 flex items-center gap-2">
                        <div class="flex-1 bg-gray-200 rounded-full h-1.5">
                          <div class="bg-primary-600 h-1.5 rounded-full" style="width: \${score}%"></div>
                        </div>
                        <span class="text-xs font-medium text-primary-600">\${score}점</span>
                      </div>
                    \` : ''}
                  </a>
                \`;
              }).join('') + '</div>';
            } else {
              html += '<p class="text-center text-gray-500 py-4">상담 기록이 없습니다</p>';
            }

            html += '</div>';

            // Contact History
            html += \`
              <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <h3 class="font-semibold text-gray-900 mb-3">
                  <i class="fas fa-phone-volume text-primary-600 mr-2"></i>연락 히스토리
                </h3>
            \`;

            if (contactLogs.length > 0) {
              html += '<div class="space-y-2">' + contactLogs.map(l => {
                const date = new Date(l.created_at);
                const dateStr = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
                const timeStr = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
                const typeIcon = l.contact_type === 'call' ? 'fa-phone' : l.contact_type === 'kakao' ? 'fa-comment' : 'fa-envelope';
                const resultText = { success: '연결', no_answer: '부재중', busy: '통화중' };
                const outcomeText = { booked: '예약완료', callback: '재연락', hold: '보류', rejected: '거절' };
                
                return \`
                  <div class="flex items-start gap-3 p-2">
                    <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <i class="fas \${typeIcon} text-gray-500 text-sm"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex justify-between items-start">
                        <span class="font-medium text-sm">
                          \${l.contact_type === 'call' ? '전화' : l.contact_type === 'kakao' ? '카톡' : '문자'}
                          \${l.contact_result ? ' · ' + resultText[l.contact_result] : ''}
                        </span>
                        <span class="text-xs text-gray-400">\${dateStr} \${timeStr}</span>
                      </div>
                      \${l.outcome ? '<span class="text-xs text-primary-600">' + outcomeText[l.outcome] + '</span>' : ''}
                      \${l.content ? '<p class="text-sm text-gray-600 mt-1 truncate">' + l.content + '</p>' : ''}
                    </div>
                  </div>
                \`;
              }).join('') + '</div>';
            } else {
              html += '<p class="text-center text-gray-500 py-4">연락 기록이 없습니다</p>';
            }

            html += '</div>';

            container.innerHTML = html;
          }

          loadPatient();
        `
      }} />
    </Layout>
  )
}
