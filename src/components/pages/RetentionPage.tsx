import { FC } from 'hono/jsx'
import { Layout, Header } from '../shared/Layout'

export const RetentionPage: FC = () => {
  return (
    <Layout activeTab="retention">
      <Header title="리텐션 관리" subtitle="치료 미완료 · 리콜 · 이탈 환자" rightAction={
        <div class="flex gap-2">
          <button id="reportBtn" class="w-9 h-9 flex items-center justify-center rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all active:scale-95" onclick="switchView('report')">
            <i class="fas fa-chart-bar text-sm"></i>
          </button>
          <button id="refreshBtn" class="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-50 text-brand-600 hover:bg-brand-100 transition-all active:scale-95" onclick="updateRetentionStatus()">
            <i class="fas fa-arrows-rotate text-sm"></i>
          </button>
        </div>
      } />

      {/* View Tabs: Dashboard vs Report */}
      <div id="dashboardView">
        {/* Filter Tabs */}
        <div class="px-4 pt-3 pb-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
          <button class="filter-btn px-3.5 py-2 text-xs font-bold rounded-xl transition-all bg-brand-600 text-white shadow-sm whitespace-nowrap" data-filter="all" onclick="applyFilter('all')">
            <i class="fas fa-th-large mr-1"></i>전체
          </button>
          <button class="filter-btn px-3.5 py-2 text-xs font-bold rounded-xl transition-all bg-surface-100 text-surface-600 whitespace-nowrap" data-filter="urgent" onclick="applyFilter('urgent')">
            <i class="fas fa-exclamation-triangle mr-1"></i>미완료
          </button>
          <button class="filter-btn px-3.5 py-2 text-xs font-bold rounded-xl transition-all bg-surface-100 text-surface-600 whitespace-nowrap" data-filter="recall" onclick="applyFilter('recall')">
            <i class="fas fa-calendar-check mr-1"></i>리콜
          </button>
          <button class="filter-btn px-3.5 py-2 text-xs font-bold rounded-xl transition-all bg-surface-100 text-surface-600 whitespace-nowrap" data-filter="at_risk" onclick="applyFilter('at_risk')">
            <i class="fas fa-heart-crack mr-1"></i>이탈위험
          </button>
          <button class="filter-btn px-3.5 py-2 text-xs font-bold rounded-xl transition-all bg-surface-100 text-surface-600 whitespace-nowrap" data-filter="unconverted" onclick="applyFilter('unconverted')">
            <i class="fas fa-comment-slash mr-1"></i>미전환
          </button>
        </div>

        <div id="retentionContent" class="px-4 py-3 space-y-3 pb-32">
          {/* Skeleton */}
          <div class="grid grid-cols-2 gap-2.5 stagger-children">
            <div class="card-premium p-4"><div class="shimmer h-5 rounded-lg w-2/3 mb-2"></div><div class="shimmer h-8 rounded-lg w-1/2"></div></div>
            <div class="card-premium p-4"><div class="shimmer h-5 rounded-lg w-2/3 mb-2"></div><div class="shimmer h-8 rounded-lg w-1/2"></div></div>
            <div class="card-premium p-4"><div class="shimmer h-5 rounded-lg w-2/3 mb-2"></div><div class="shimmer h-8 rounded-lg w-1/2"></div></div>
            <div class="card-premium p-4"><div class="shimmer h-5 rounded-lg w-2/3 mb-2"></div><div class="shimmer h-8 rounded-lg w-1/2"></div></div>
          </div>
          <div class="card-premium p-5"><div class="shimmer h-6 rounded-lg w-1/2 mb-4"></div><div class="shimmer h-24 rounded-lg w-full"></div></div>
        </div>
      </div>

      {/* Report View (hidden by default) */}
      <div id="reportView" class="hidden">
        <div class="px-4 pt-3 pb-2 flex gap-1.5">
          <button class="report-period-btn px-4 py-2 text-xs font-bold rounded-xl transition-all bg-brand-600 text-white shadow-sm" data-period="week" onclick="loadReport('week')">
            <i class="fas fa-calendar-week mr-1"></i>주간
          </button>
          <button class="report-period-btn px-4 py-2 text-xs font-bold rounded-xl transition-all bg-surface-100 text-surface-600" data-period="month" onclick="loadReport('month')">
            <i class="fas fa-calendar mr-1"></i>월간
          </button>
          <button class="ml-auto px-4 py-2 text-xs font-bold rounded-xl bg-surface-100 text-surface-600" onclick="switchView('dashboard')">
            <i class="fas fa-arrow-left mr-1"></i>대시보드
          </button>
        </div>
        <div id="reportContent" class="px-4 py-3 space-y-3 pb-32">
          <div class="card-premium p-5"><div class="shimmer h-6 rounded-lg w-1/2 mb-4"></div><div class="shimmer h-32 rounded-lg w-full"></div></div>
        </div>
      </div>

      {/* Contact Result Modal */}
      <div id="contactModal" class="hidden fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
        <div class="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg p-6 animate-slide-up">
          <div class="flex justify-between items-center mb-5">
            <h3 class="text-lg font-bold text-surface-900">연락 결과 기록</h3>
            <button onclick="closeContactModal()" class="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-500 transition-all active:scale-95">
              <i class="fas fa-xmark"></i>
            </button>
          </div>
          <input type="hidden" id="modalPatientId" />
          <input type="hidden" id="modalTreatmentId" />
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">연락 방법</label>
              <div class="flex gap-2">
                <button class="contact-type-btn flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-surface-200 text-surface-600 transition-all" data-type="phone" onclick="selectContactType('phone')"><i class="fas fa-phone mr-1.5"></i>전화</button>
                <button class="contact-type-btn flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-surface-200 text-surface-600 transition-all" data-type="text" onclick="selectContactType('text')"><i class="fas fa-comment mr-1.5"></i>문자</button>
                <button class="contact-type-btn flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-surface-200 text-surface-600 transition-all" data-type="kakao" onclick="selectContactType('kakao')"><i class="fas fa-comment-dots mr-1.5"></i>카카오</button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">결과</label>
              <select id="contactResult" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all">
                <option value="connected">통화 성공</option>
                <option value="no_answer">부재중</option>
                <option value="message_sent">메시지 발송</option>
                <option value="callback_promised">콜백 약속</option>
                <option value="appointment_booked">예약 완료</option>
                <option value="refused">거절</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">메모</label>
              <textarea id="contactNotes" rows={3} class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all resize-none" placeholder="연락 내용 메모"></textarea>
            </div>
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">다음 연락 예정일</label>
              <input type="date" id="nextContactDate" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all" />
            </div>
            <button onclick="saveContact()" class="w-full bg-gradient-brand text-white font-semibold py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-brand-600/20">
              <i class="fas fa-check mr-2"></i>기록 저장
            </button>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          var selectedContactType = 'phone';
          var dashboardData = null;
          var currentFilter = 'all';
          var currentView = 'dashboard';

          var statusMap = {
            unscheduled_urgent: { label: '미예약 긴급', color: 'rose', icon: 'fa-exclamation-triangle', bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200' },
            unscheduled_warning: { label: '미예약 주의', color: 'amber', icon: 'fa-clock', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
            recall_6m: { label: '6개월 리콜', color: 'sky', icon: 'fa-calendar-check', bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-200' },
            recall_12m: { label: '12개월 리콜', color: 'sky', icon: 'fa-calendar-days', bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-200' },
            at_risk: { label: '이탈 위험', color: 'red', icon: 'fa-heart-crack', bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200' },
            consulted_unconverted: { label: '상담 미전환', color: 'amber', icon: 'fa-comment-slash', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
            in_treatment: { label: '치료중', color: 'emerald', icon: 'fa-stethoscope', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
            active: { label: '정상', color: 'surface', icon: 'fa-check', bg: 'bg-surface-50', text: 'text-surface-600', ring: 'ring-surface-200' },
            completed: { label: '완료', color: 'emerald', icon: 'fa-check-double', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' }
          };

          var treatTypeMap = {
            implant: '임플란트', ortho: '교정', prosthetic: '보철', endo: '신경치료',
            extraction: '발치', scaling: '스케일링', whitening: '미백', laminate: '라미네이트', general: '일반'
          };

          function switchView(view) {
            currentView = view;
            document.getElementById('dashboardView').classList.toggle('hidden', view !== 'dashboard');
            document.getElementById('reportView').classList.toggle('hidden', view !== 'report');
            if (view === 'report') loadReport('week');
          }

          function applyFilter(filter) {
            currentFilter = filter;
            document.querySelectorAll('.filter-btn').forEach(function(b) {
              b.className = b.dataset.filter === filter
                ? 'filter-btn px-3.5 py-2 text-xs font-bold rounded-xl transition-all bg-brand-600 text-white shadow-sm whitespace-nowrap'
                : 'filter-btn px-3.5 py-2 text-xs font-bold rounded-xl transition-all bg-surface-100 text-surface-600 whitespace-nowrap';
            });
            loadDashboard();
          }

          async function loadDashboard() {
            try {
              var authRes = await fetch('/api/auth/me');
              if (!authRes.ok) { window.location.href = '/login'; return; }

              var url = '/api/retention/dashboard';
              if (currentFilter !== 'all') url += '?filter=' + currentFilter;
              var res = await fetch(url);
              var data = await res.json();
              if (data.success) { dashboardData = data.data; renderDashboard(data.data); }
            } catch (err) { console.error('Failed to load retention dashboard:', err); }
          }

          function renderDashboard(d) {
            var container = document.getElementById('retentionContent');
            var html = '<div class="space-y-3 stagger-children">';

            // KPI Cards
            html += '<div class="grid grid-cols-2 gap-2.5">';
            html += '<div class="card-premium p-4"><div class="flex items-center gap-2 mb-2"><div class="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center"><i class="fas fa-exclamation-triangle text-xs text-rose-600"></i></div><span class="text-xs font-semibold text-surface-500">치료 미완료</span></div><p class="text-2xl font-black text-rose-600">' + d.incomplete_count + '<span class="text-sm font-semibold text-surface-400 ml-1">명</span></p></div>';
            html += '<div class="card-premium p-4"><div class="flex items-center gap-2 mb-2"><div class="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center"><i class="fas fa-calendar-check text-xs text-sky-600"></i></div><span class="text-xs font-semibold text-surface-500">리콜 대상</span></div><p class="text-2xl font-black text-sky-600">' + d.recall_count + '<span class="text-sm font-semibold text-surface-400 ml-1">명</span></p></div>';
            html += '<div class="card-premium p-4"><div class="flex items-center gap-2 mb-2"><div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center"><i class="fas fa-phone-volume text-xs text-emerald-600"></i></div><span class="text-xs font-semibold text-surface-500">연락 수행률</span></div><p class="text-2xl font-black text-emerald-600">' + d.contact_completion_rate + '<span class="text-sm font-semibold text-surface-400 ml-1">%</span></p></div>';
            html += '<div class="card-premium p-4 bg-gradient-to-br from-rose-50/50 to-amber-50/30"><div class="flex items-center gap-2 mb-2"><div class="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center"><i class="fas fa-coins text-xs text-rose-600"></i></div><span class="text-xs font-semibold text-surface-500">이탈 위험 매출</span></div><p class="text-2xl font-black text-rose-600">' + Math.round(d.estimated_lost_revenue / 10000) + '<span class="text-sm font-semibold text-surface-400 ml-1">만원</span></p></div>';
            html += '</div>';

            // Contact List
            html += '<div class="card-premium p-5">';
            html += '<div class="flex items-center justify-between mb-4"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center"><i class="fas fa-heart-pulse text-xs text-brand-600"></i></div><h3 class="font-bold text-sm text-surface-900">리텐션 연락 대상</h3></div><span class="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg">' + d.today_contacts.length + '건</span></div>';

            if (d.today_contacts.length === 0) {
              html += '<div class="text-center py-8"><div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 flex items-center justify-center"><i class="fas fa-check-circle text-2xl text-emerald-500"></i></div><p class="text-surface-500 text-sm">해당 조건의 환자가 없습니다</p></div>';
            } else {
              html += '<div class="space-y-2.5">';
              d.today_contacts.forEach(function(c) {
                var st = statusMap[c.status] || statusMap.active;
                var treatments = c.treatments || [];
                var treatName = treatments.length > 0 ? (treatTypeMap[treatments[0].treatment_type] || treatments[0].treatment_type) + (treatments[0].treatment_name ? ' - ' + treatments[0].treatment_name : '') : '치료 미등록';
                var colors = ['bg-brand-100 text-brand-700','bg-emerald-100 text-emerald-700','bg-amber-100 text-amber-700','bg-rose-100 text-rose-700','bg-sky-100 text-sky-700'];
                var avatarColor = colors[c.patient_name.charCodeAt(0) % colors.length];

                html += '<div class="p-3.5 bg-surface-50/80 rounded-xl border border-surface-100 hover:border-brand-200 transition-all">';
                html += '<div class="flex items-start gap-3 mb-2.5">';
                html += '<div class="w-10 h-10 rounded-xl ' + avatarColor + ' flex items-center justify-center font-bold text-sm shrink-0">' + c.patient_name.charAt(0) + '</div>';
                html += '<div class="flex-1 min-w-0">';
                html += '<div class="flex items-center gap-2"><a href="/patients/' + c.patient_id + '" class="font-bold text-sm text-surface-900 hover:text-brand-600 transition-colors">' + c.patient_name + '</a>';
                html += '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ring-1 ring-inset ' + st.bg + ' ' + st.text + ' ' + st.ring + '"><i class="fas ' + st.icon + '"></i>' + st.label + '</span></div>';
                html += '<p class="text-xs text-surface-500 mt-0.5 line-clamp-1">' + treatName + '</p>';
                html += '</div>';
                var riskColor = c.risk_score >= 80 ? 'text-rose-600 bg-rose-50' : c.risk_score >= 50 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50';
                html += '<div class="text-center shrink-0"><p class="text-lg font-black ' + riskColor.split(' ')[0] + '">' + c.risk_score + '</p><p class="text-[9px] font-semibold text-surface-400">위험도</p></div>';
                html += '</div>';

                html += '<div class="flex flex-wrap gap-2 mb-2.5 text-[11px]">';
                html += '<span class="flex items-center gap-1 text-surface-500"><i class="fas fa-clock"></i>마지막 내원 ' + c.days_since_visit + '일 전</span>';
                if (c.remaining_treatment_value > 0) {
                  html += '<span class="flex items-center gap-1 text-rose-600 font-semibold"><i class="fas fa-coins"></i>잔여 ' + Math.round(c.remaining_treatment_value / 10000) + '만원</span>';
                }
                if (c.satisfaction_score) {
                  html += '<span class="flex items-center gap-1 text-brand-600"><i class="fas fa-star"></i>만족도 ' + c.satisfaction_score + '점</span>';
                }
                html += '</div>';

                if (c.recommended_contact_script) {
                  html += '<div class="p-2.5 bg-brand-50/50 rounded-lg mb-2.5 border border-brand-100/50"><p class="text-xs text-surface-700 leading-relaxed line-clamp-2"><i class="fas fa-sparkles text-brand-500 mr-1"></i>' + c.recommended_contact_script + '</p></div>';
                }

                html += '<div class="flex gap-2">';
                if (c.patient_phone) {
                  html += '<a href="tel:' + c.patient_phone + '" class="flex-1 flex items-center justify-center gap-1.5 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-700 transition-all active:scale-95"><i class="fas fa-phone text-[10px]"></i>전화</a>';
                  html += '<a href="sms:' + c.patient_phone + '" class="flex-1 flex items-center justify-center gap-1.5 py-2 bg-surface-800 text-white rounded-lg text-xs font-semibold hover:bg-surface-900 transition-all active:scale-95"><i class="fas fa-comment text-[10px]"></i>문자</a>';
                }
                html += '<button onclick="openContactModal(\\'' + c.patient_id + '\\', \\'' + (treatments.length > 0 ? treatments[0].id : '') + '\\')" class="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-all active:scale-95"><i class="fas fa-check text-[10px]"></i>기록</button>';
                html += '</div></div>';
              });
              html += '</div>';
            }
            html += '</div>';

            // Chart
            html += '<div class="card-premium p-5">';
            html += '<div class="flex items-center gap-2 mb-4"><div class="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center"><i class="fas fa-chart-pie text-xs text-purple-600"></i></div><h3 class="font-bold text-sm text-surface-900">리텐션 현황</h3></div>';
            html += '<canvas id="retentionChart" height="200"></canvas>';
            html += '</div>';

            html += '</div>';
            container.innerHTML = html;
            renderChart(d.status_distribution);
          }

          function renderChart(dist) {
            var canvas = document.getElementById('retentionChart');
            if (!canvas || !window.Chart) return;
            var labels = []; var data = []; var colors = [];
            var colorMap = {
              in_treatment: '#10b981', unscheduled_urgent: '#f43f5e', unscheduled_warning: '#f59e0b',
              recall_6m: '#0ea5e9', recall_12m: '#0284c7', at_risk: '#dc2626',
              consulted_unconverted: '#d97706', active: '#94a3b8', completed: '#059669'
            };
            for (var key in dist) {
              var st = statusMap[key] || { label: key };
              labels.push(st.label);
              data.push(dist[key]);
              colors.push(colorMap[key] || '#94a3b8');
            }
            new Chart(canvas.getContext('2d'), {
              type: 'doughnut',
              data: { labels: labels, datasets: [{ data: data, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
              options: {
                responsive: true,
                plugins: { legend: { position: 'bottom', labels: { font: { size: 11, family: 'Pretendard Variable' }, padding: 12, usePointStyle: true, pointStyleWidth: 10 } } },
                cutout: '65%'
              }
            });
          }

          // ============================================
          // Report View
          // ============================================
          async function loadReport(period) {
            document.querySelectorAll('.report-period-btn').forEach(function(b) {
              b.className = b.dataset.period === period
                ? 'report-period-btn px-4 py-2 text-xs font-bold rounded-xl transition-all bg-brand-600 text-white shadow-sm'
                : 'report-period-btn px-4 py-2 text-xs font-bold rounded-xl transition-all bg-surface-100 text-surface-600';
            });
            try {
              var res = await fetch('/api/retention/report?period=' + period);
              var data = await res.json();
              if (data.success) renderReport(data.data);
            } catch (err) { console.error('Report load err:', err); }
          }

          function renderReport(r) {
            var container = document.getElementById('reportContent');
            var cs = r.contact_stats || {};
            var html = '<div class="space-y-3 stagger-children">';

            // Summary Cards
            html += '<div class="grid grid-cols-2 gap-2.5">';
            html += '<div class="card-premium p-4"><div class="flex items-center gap-2 mb-2"><div class="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center"><i class="fas fa-phone text-xs text-brand-600"></i></div><span class="text-xs font-semibold text-surface-500">총 연락</span></div><p class="text-2xl font-black text-brand-600">' + (cs.total_contacts || 0) + '<span class="text-sm font-semibold text-surface-400 ml-1">건</span></p></div>';
            html += '<div class="card-premium p-4"><div class="flex items-center gap-2 mb-2"><div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center"><i class="fas fa-calendar-check text-xs text-emerald-600"></i></div><span class="text-xs font-semibold text-surface-500">예약 전환</span></div><p class="text-2xl font-black text-emerald-600">' + (cs.booked || 0) + '<span class="text-sm font-semibold text-surface-400 ml-1">건</span></p></div>';
            html += '<div class="card-premium p-4"><div class="flex items-center gap-2 mb-2"><div class="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center"><i class="fas fa-user-group text-xs text-purple-600"></i></div><span class="text-xs font-semibold text-surface-500">연락 환자</span></div><p class="text-2xl font-black text-purple-600">' + (cs.unique_patients || 0) + '<span class="text-sm font-semibold text-surface-400 ml-1">명</span></p></div>';
            html += '<div class="card-premium p-4"><div class="flex items-center gap-2 mb-2"><div class="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center"><i class="fas fa-percent text-xs text-sky-600"></i></div><span class="text-xs font-semibold text-surface-500">전환율</span></div><p class="text-2xl font-black text-sky-600">' + r.conversion_rate + '<span class="text-sm font-semibold text-surface-400 ml-1">%</span></p></div>';
            html += '</div>';

            // Contact Result Breakdown
            html += '<div class="card-premium p-5">';
            html += '<div class="flex items-center gap-2 mb-4"><div class="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center"><i class="fas fa-chart-bar text-xs text-brand-600"></i></div><h3 class="font-bold text-sm text-surface-900">연락 결과 분석</h3></div>';
            var results = [
              { label: '예약 완료', value: cs.booked || 0, color: 'emerald' },
              { label: '통화 성공', value: cs.connected || 0, color: 'brand' },
              { label: '콜백 약속', value: cs.callback || 0, color: 'sky' },
              { label: '메시지 발송', value: cs.message_sent || 0, color: 'purple' },
              { label: '부재중', value: cs.no_answer || 0, color: 'amber' },
              { label: '거절', value: cs.refused || 0, color: 'rose' }
            ];
            var maxVal = Math.max(1, ...results.map(function(r) { return r.value; }));
            html += '<div class="space-y-2.5">';
            results.forEach(function(item) {
              var pct = Math.round(item.value / maxVal * 100);
              html += '<div><div class="flex justify-between mb-1"><span class="text-xs font-semibold text-surface-600">' + item.label + '</span><span class="text-xs font-bold text-surface-900">' + item.value + '건</span></div>' +
                '<div class="h-2 bg-surface-100 rounded-full overflow-hidden"><div class="h-full bg-' + item.color + '-500 rounded-full transition-all duration-700" style="width:' + pct + '%"></div></div></div>';
            });
            html += '</div></div>';

            // Staff Performance
            if (r.staff_stats && r.staff_stats.length > 0) {
              html += '<div class="card-premium p-5">';
              html += '<div class="flex items-center gap-2 mb-4"><div class="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center"><i class="fas fa-trophy text-xs text-amber-600"></i></div><h3 class="font-bold text-sm text-surface-900">직원별 성과</h3></div>';
              html += '<div class="space-y-2">';
              r.staff_stats.forEach(function(s, i) {
                var medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
                html += '<div class="flex items-center justify-between p-3 bg-surface-50 rounded-xl">' +
                  '<div class="flex items-center gap-2"><span class="text-base">' + medal + '</span><span class="font-bold text-sm text-surface-900">' + s.staff_name + '</span></div>' +
                  '<div class="flex items-center gap-3"><span class="text-xs text-surface-500">' + s.contacts + '건</span><span class="text-xs font-semibold text-emerald-600">' + s.booked + '건 예약</span></div></div>';
              });
              html += '</div></div>';
            }

            // Risk Revenue
            if (r.risk_revenue) {
              var rv = r.risk_revenue;
              html += '<div class="card-premium p-5">';
              html += '<div class="flex items-center gap-2 mb-4"><div class="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center"><i class="fas fa-coins text-xs text-rose-600"></i></div><h3 class="font-bold text-sm text-surface-900">이탈 위험 매출</h3></div>';
              var rItems = [
                { label: '긴급 미예약', value: rv.urgent, color: 'rose' },
                { label: '주의 미예약', value: rv.warning, color: 'amber' },
                { label: '이탈 위험', value: rv.at_risk, color: 'red' },
                { label: '상담 미전환', value: rv.unconverted, color: 'amber' }
              ];
              html += '<div class="space-y-2">';
              rItems.forEach(function(item) {
                if (item.value > 0) {
                  html += '<div class="flex justify-between items-center p-3 bg-surface-50 rounded-xl">' +
                    '<span class="text-sm font-semibold text-surface-700">' + item.label + '</span>' +
                    '<span class="text-sm font-black text-' + item.color + '-600">' + Math.round(item.value / 10000) + '만원</span></div>';
                }
              });
              var total = (rv.urgent || 0) + (rv.warning || 0) + (rv.at_risk || 0) + (rv.unconverted || 0);
              html += '<div class="flex justify-between items-center p-3 bg-rose-50 rounded-xl mt-2 border border-rose-100">' +
                '<span class="text-sm font-bold text-rose-700">합계</span>' +
                '<span class="text-lg font-black text-rose-600">' + Math.round(total / 10000) + '만원</span></div>';
              html += '</div></div>';
            }

            html += '</div>';
            container.innerHTML = html;
          }

          // ============================================
          // Modal Logic
          // ============================================
          function openContactModal(patientId, treatmentId) {
            document.getElementById('modalPatientId').value = patientId;
            document.getElementById('modalTreatmentId').value = treatmentId || '';
            document.getElementById('contactModal').classList.remove('hidden');
          }
          function closeContactModal() { document.getElementById('contactModal').classList.add('hidden'); }

          function selectContactType(type) {
            selectedContactType = type;
            document.querySelectorAll('.contact-type-btn').forEach(function(b) {
              b.className = b.dataset.type === type
                ? 'contact-type-btn flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-brand-500 text-brand-600 bg-brand-50 transition-all'
                : 'contact-type-btn flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-surface-200 text-surface-600 transition-all';
            });
          }

          async function saveContact() {
            try {
              var res = await fetch('/api/retention/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  patient_id: document.getElementById('modalPatientId').value,
                  treatment_id: document.getElementById('modalTreatmentId').value || null,
                  contact_type: selectedContactType,
                  result: document.getElementById('contactResult').value,
                  notes: document.getElementById('contactNotes').value,
                  next_contact_date: document.getElementById('nextContactDate').value || null
                })
              });
              var data = await res.json();
              if (data.success) { closeContactModal(); loadDashboard(); }
              else { alert(data.error || '저장에 실패했습니다.'); }
            } catch (err) { alert('오류가 발생했습니다.'); }
          }

          async function updateRetentionStatus() {
            var btn = document.getElementById('refreshBtn');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin text-sm"></i>';
            try {
              await fetch('/api/retention/update-status', { method: 'POST' });
              await loadDashboard();
            } catch (err) { console.error(err); }
            btn.innerHTML = '<i class="fas fa-arrows-rotate text-sm"></i>';
          }

          loadDashboard();
        `
      }} />
    </Layout>
  )
}
