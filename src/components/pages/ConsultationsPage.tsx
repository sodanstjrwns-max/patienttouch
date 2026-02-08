import { FC } from 'hono/jsx'
import { Layout, Header, Card, Badge, Button, SectionTitle } from '../shared/Layout'

export const ConsultationsPage: FC = () => {
  return (
    <Layout activeTab="consultations">
      <Header 
        title="상담 관리" 
        subtitle="AI 분석 기반 상담 기록"
        rightAction={
          <a href="/recording" class="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center text-white shadow-md shadow-brand-600/20 active:scale-95 transition-transform">
            <i class="fas fa-microphone text-sm"></i>
          </a>
        }
      />

      {/* Filters */}
      <div class="px-4 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
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

      <script dangerouslySetInnerHTML={{
        __html: `
          var currentFilter = 'all';
          
          document.querySelectorAll('.filter-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
              document.querySelectorAll('.filter-btn').forEach(function(b) {
                b.className = 'filter-btn shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all bg-surface-100 text-surface-600 hover:bg-surface-200';
              });
              this.className = 'filter-btn active shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all bg-brand-600 text-white shadow-md shadow-brand-600/20';
              currentFilter = this.dataset.status;
              loadConsultations();
            });
          });

          async function loadConsultations() {
            try {
              var url = '/api/consultations?limit=50';
              if (currentFilter !== 'all') url += '&status=' + currentFilter;
              
              var res = await fetch(url);
              var data = await res.json();
              
              if (!data.success) {
                if (res.status === 401) { window.location.href = '/login'; return; }
                return;
              }
              
              if (!data.data || data.data.length === 0) {
                document.getElementById('consultationList').innerHTML = 
                  '<div class="text-center py-16 px-6 animate-fade-in">' +
                    '<div class="w-20 h-20 mx-auto mb-5 rounded-2xl bg-surface-100 flex items-center justify-center"><i class="fas fa-microphone-slash text-3xl text-surface-300"></i></div>' +
                    '<h3 class="text-lg font-bold text-surface-800 mb-1">상담 기록이 없습니다</h3>' +
                    '<p class="text-surface-500 text-sm mb-5">첫 상담을 녹음해보세요</p>' +
                    '<a href="/recording" class="inline-flex items-center gap-2 font-semibold text-sm text-white bg-gradient-brand px-5 py-2.5 rounded-xl shadow-md shadow-brand-600/20"><i class="fas fa-microphone"></i>녹음 시작</a>' +
                  '</div>';
                return;
              }
              
              var html = data.data.map(function(c) {
                var st = {
                  paid: { bg:'bg-emerald-50', text:'text-emerald-700', label:'결제완료', dot:'bg-emerald-500', border:'border-l-emerald-400' },
                  undecided: { bg:'bg-amber-50', text:'text-amber-700', label:'미결정', dot:'bg-amber-500', border:'border-l-amber-400' },
                  lost: { bg:'bg-rose-50', text:'text-rose-700', label:'이탈', dot:'bg-rose-500', border:'border-l-rose-400' },
                  pending: { bg:'bg-surface-50', text:'text-surface-600', label:'대기중', dot:'bg-surface-400', border:'border-l-surface-300' }
                }[c.status] || { bg:'bg-surface-50', text:'text-surface-600', label:c.status, dot:'bg-surface-400', border:'border-l-surface-300' };
                
                var date = new Date(c.consultation_date);
                var dateStr = (date.getMonth()+1) + '/' + date.getDate() + ' ' + String(date.getHours()).padStart(2,'0') + ':' + String(date.getMinutes()).padStart(2,'0');
                var score = c.feedback && c.feedback.total_score ? c.feedback.total_score : null;
                
                return '<a href="/consultations/' + c.id + '" class="card-premium p-4 flex items-center gap-3.5 block border-l-4 ' + st.border + '">' +
                  '<div class="w-11 h-11 rounded-xl ' + st.bg + ' flex items-center justify-center shrink-0">' +
                    '<span class="text-base font-bold ' + st.text + '">' + (c.patient_name ? c.patient_name.charAt(0) : '?') + '</span>' +
                  '</div>' +
                  '<div class="flex-1 min-w-0">' +
                    '<div class="flex items-center gap-2">' +
                      '<span class="font-bold text-sm truncate">' + (c.patient_name || '미지정') + '</span>' +
                      '<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ring-1 ring-inset ' + st.bg + ' ' + st.text + ' ring-current/20"><span class="w-1 h-1 rounded-full ' + st.dot + '"></span>' + st.label + '</span>' +
                    '</div>' +
                    '<div class="flex items-center gap-1.5 mt-0.5 text-xs text-surface-500">' +
                      '<span>' + dateStr + '</span>' +
                      (c.treatment_type ? '<span class="text-surface-300">|</span><span>' + c.treatment_type + '</span>' : '') +
                      (c.amount ? '<span class="text-surface-300">|</span><span class="font-semibold text-surface-600">' + (c.amount / 10000).toFixed(0) + '만</span>' : '') +
                    '</div>' +
                  '</div>' +
                  '<div class="text-right shrink-0">' +
                    (score ? '<div class="text-lg font-black ' + (score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-rose-600') + '">' + score + '</div><div class="text-[10px] text-surface-400">점</div>' : '<i class="fas fa-chevron-right text-surface-300 text-xs"></i>') +
                  '</div>' +
                '</a>';
              }).join('');
              
              document.getElementById('consultationList').innerHTML = '<div class="space-y-2 stagger-children">' + html + '</div>';
            } catch (err) {
              console.error('Load consultations error:', err);
            }
          }

          loadConsultations();
        `
      }} />
    </Layout>
  )
}
