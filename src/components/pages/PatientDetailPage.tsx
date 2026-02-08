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
      
      <div id="patientDetail" class="px-4 py-4 space-y-3 pb-24">
        <div class="space-y-3 stagger-children">
          <div class="card-premium p-5"><div class="flex gap-4"><div class="w-16 h-16 shimmer rounded-2xl"></div><div class="flex-1 space-y-2"><div class="shimmer h-5 rounded-lg w-1/2"></div><div class="shimmer h-4 rounded-lg w-2/3"></div></div></div></div>
          <div class="card-premium p-5"><div class="shimmer h-5 rounded-lg w-1/3 mb-3"></div><div class="shimmer h-20 rounded-lg w-full"></div></div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          const patientId = '${id}';

          async function loadPatient() {
            try {
              const authRes = await fetch('/api/auth/me');
              if (!authRes.ok) { window.location.href = '/login'; return; }

              const res = await fetch('/api/patients/' + patientId);
              if (res.status === 401) { window.location.href = '/login'; return; }
              const data = await res.json();

              if (data.success) { renderPatient(data.data); }
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
                html += '<a href="/consultations/' + c.id + '" class="block p-3 bg-surface-50 rounded-xl hover:bg-surface-100 transition-all active:scale-[0.99] border-l-3 border-l-' + (c.status === 'paid' ? 'emerald' : c.status === 'undecided' ? 'amber' : c.status === 'lost' ? 'rose' : 'surface') + '-400">' +
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

          loadPatient();
        `
      }} />
    </Layout>
  )
}
