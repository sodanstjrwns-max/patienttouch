import { FC } from 'hono/jsx'
import { Layout, Header } from '../shared/Layout'

export const ReportPage: FC = () => {
  return (
    <Layout activeTab="report">
      <Header title="리포트" subtitle="성과 분석" rightAction={
        <select id="periodSelect" class="text-xs font-semibold bg-surface-100 text-surface-600 border-0 rounded-xl px-3 py-2 outline-none cursor-pointer">
          <option value="week">이번 주</option>
          <option value="month">이번 달</option>
          <option value="quarter">분기</option>
        </select>
      } />
      
      <div class="px-4 py-4 space-y-3 pb-24">
        {/* KPI Overview */}
        <div class="card-premium p-5">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center"><i class="fas fa-bullseye text-xs text-brand-600"></i></div>
            <h2 class="font-bold text-sm text-surface-900">목표 달성 현황</h2>
          </div>
          <div id="kpiSection" class="space-y-4">
            <div class="space-y-4">
              <div class="shimmer h-12 rounded-xl"></div>
              <div class="shimmer h-12 rounded-xl"></div>
              <div class="shimmer h-12 rounded-xl"></div>
              <div class="shimmer h-12 rounded-xl"></div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div class="grid grid-cols-2 gap-2">
          <div class="card-premium p-4">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-8 h-8 rounded-lg bg-surface-50 flex items-center justify-center"><i class="fas fa-comments text-surface-400 text-xs"></i></div>
            </div>
            <p id="totalConsultations" class="text-2xl font-black text-surface-900">-</p>
            <p class="text-[10px] font-semibold text-surface-400 mt-0.5">총 상담</p>
          </div>
          <div class="card-premium p-4">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center"><i class="fas fa-check-circle text-emerald-500 text-xs"></i></div>
            </div>
            <p id="paidConsultations" class="text-2xl font-black text-emerald-600">-</p>
            <p class="text-[10px] font-semibold text-surface-400 mt-0.5">결제 완료</p>
          </div>
          <div class="card-premium p-4">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center"><i class="fas fa-phone text-sky-500 text-xs"></i></div>
            </div>
            <p id="totalTasks" class="text-2xl font-black text-surface-900">-</p>
            <p class="text-[10px] font-semibold text-surface-400 mt-0.5">총 연락</p>
          </div>
          <div class="card-premium p-4">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center"><i class="fas fa-circle-check text-brand-500 text-xs"></i></div>
            </div>
            <p id="completedTasks" class="text-2xl font-black text-brand-600">-</p>
            <p class="text-[10px] font-semibold text-surface-400 mt-0.5">연락 완료</p>
          </div>
        </div>

        {/* Total Amount */}
        <div class="card-premium p-5 bg-gradient-to-r from-brand-50/50 to-purple-50/30">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-[10px] font-semibold text-surface-400 uppercase tracking-wider">총 상담 금액</p>
              <p id="totalAmount" class="text-3xl font-black text-brand-700 mt-1">-</p>
            </div>
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <i class="fas fa-won-sign text-white text-xl"></i>
            </div>
          </div>
        </div>

        {/* Goal Settings */}
        <div class="card-premium p-5">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center"><i class="fas fa-sliders text-xs text-amber-600"></i></div>
              <h2 class="font-bold text-sm text-surface-900">목표 설정</h2>
            </div>
            <button id="editGoalsBtn" class="text-brand-600 text-xs font-semibold flex items-center gap-1 hover:text-brand-700 transition-colors">
              <i class="fas fa-pen text-[10px]"></i>수정
            </button>
          </div>
          <div id="goalsDisplay" class="space-y-3 text-sm">
            <div class="flex justify-between items-center p-2 bg-surface-50 rounded-lg"><span class="text-surface-500 text-xs">상담 전환율</span><span id="goalConversion" class="font-bold text-surface-800">-</span></div>
            <div class="flex justify-between items-center p-2 bg-surface-50 rounded-lg"><span class="text-surface-500 text-xs">평균 상담점수</span><span id="goalScore" class="font-bold text-surface-800">-</span></div>
            <div class="flex justify-between items-center p-2 bg-surface-50 rounded-lg"><span class="text-surface-500 text-xs">연락 수행률</span><span id="goalContact" class="font-bold text-surface-800">-</span></div>
            <div class="flex justify-between items-center p-2 bg-surface-50 rounded-lg"><span class="text-surface-500 text-xs">재상담 성공</span><span id="goalReConsult" class="font-bold text-surface-800">-</span></div>
          </div>
        </div>
      </div>

      {/* Goals Edit Modal */}
      <div id="goalsModal" class="hidden fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
        <div class="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg p-6 animate-slide-up">
          <div class="flex justify-between items-center mb-5">
            <h3 class="text-lg font-bold text-surface-900">목표 설정</h3>
            <button onclick="closeGoalsModal()" class="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-500 transition-all active:scale-95">
              <i class="fas fa-xmark"></i>
            </button>
          </div>
          <form id="goalsForm" class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">상담 전환율 목표 (%)</label>
              <input type="number" name="conversion_rate" min="0" max="100" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 outline-none text-sm transition-all" placeholder="80" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">평균 상담점수 목표 (점)</label>
              <input type="number" name="avg_score" min="0" max="100" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 outline-none text-sm transition-all" placeholder="85" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">연락 수행률 목표 (%)</label>
              <input type="number" name="contact_rate" min="0" max="100" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 outline-none text-sm transition-all" placeholder="95" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-surface-700 mb-1.5">재상담 성공 목표 (건)</label>
              <input type="number" name="re_consultation" min="0" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 outline-none text-sm transition-all" placeholder="3" />
            </div>
            <button type="submit" class="w-full bg-gradient-brand text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98] shadow-md shadow-brand-600/20">
              저장하기
            </button>
          </form>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          var currentGoals = {};

          async function loadReport(period) {
            period = period || 'week';
            try {
              var authRes = await fetch('/api/auth/me');
              if (!authRes.ok) { window.location.href = '/login'; return; }
              var res = await fetch('/api/dashboard/kpi?period=' + period);
              var data = await res.json();
              if (data.success) renderKPI(data.data);
            } catch (err) { console.error('Failed to load report:', err); }
          }

          function renderKPI(data) {
            var kpi = data.kpi;
            var goals = data.goals;
            currentGoals = goals;

            var items = [
              { name: '상담 전환율', val: kpi.conversion_rate, goal: goals.conversion_rate || 80, unit: '%', color: 'brand', sub: kpi.paid_consultations + '건 결제 / ' + kpi.total_consultations + '건 상담' },
              { name: '평균 상담점수', val: kpi.avg_score, goal: goals.avg_score || 85, unit: '점', color: 'emerald', sub: '' },
              { name: '연락 수행률', val: kpi.contact_rate, goal: goals.contact_rate || 95, unit: '%', color: 'amber', sub: kpi.completed_tasks + '건 완료 / ' + kpi.total_tasks + '건 예정' },
              { name: '재상담 성공', val: kpi.re_consultation, goal: goals.re_consultation || 3, unit: '건', color: 'purple', sub: '' }
            ];

            document.getElementById('kpiSection').innerHTML = items.map(function(item) {
              var pct = Math.min(100, (item.val / item.goal) * 100);
              var achieved = item.val >= item.goal;
              return '<div>' +
                '<div class="flex justify-between text-xs mb-1.5">' +
                  '<span class="font-semibold text-surface-500">' + item.name + '</span>' +
                  '<span class="font-bold ' + (achieved ? 'text-emerald-600' : 'text-surface-800') + '">' + item.val + item.unit + ' / ' + item.goal + item.unit + (achieved ? ' ✅' : '') + '</span>' +
                '</div>' +
                '<div class="w-full bg-surface-100 rounded-full h-2 overflow-hidden">' +
                  '<div class="bg-' + item.color + '-500 h-2 rounded-full transition-all duration-1000" style="width:' + pct + '%"></div>' +
                '</div>' +
                (item.sub ? '<p class="text-[10px] text-surface-400 mt-1">' + item.sub + '</p>' : '') +
              '</div>';
            }).join('');

            document.getElementById('totalConsultations').textContent = kpi.total_consultations + '건';
            document.getElementById('paidConsultations').textContent = kpi.paid_consultations + '건';
            document.getElementById('totalTasks').textContent = (kpi.total_tasks || 0) + '건';
            document.getElementById('completedTasks').textContent = (kpi.completed_tasks || 0) + '건';
            document.getElementById('totalAmount').textContent = ((kpi.total_amount || 0) / 10000).toFixed(0) + '만원';

            document.getElementById('goalConversion').textContent = (goals.conversion_rate || 80) + '%';
            document.getElementById('goalScore').textContent = (goals.avg_score || 85) + '점';
            document.getElementById('goalContact').textContent = (goals.contact_rate || 95) + '%';
            document.getElementById('goalReConsult').textContent = (goals.re_consultation || 3) + '건';
          }

          document.getElementById('periodSelect').addEventListener('change', function(e) { loadReport(e.target.value); });

          document.getElementById('editGoalsBtn').addEventListener('click', function() {
            var form = document.getElementById('goalsForm');
            form.conversion_rate.value = currentGoals.conversion_rate || 80;
            form.avg_score.value = currentGoals.avg_score || 85;
            form.contact_rate.value = currentGoals.contact_rate || 95;
            form.re_consultation.value = currentGoals.re_consultation || 3;
            document.getElementById('goalsModal').classList.remove('hidden');
          });

          function closeGoalsModal() { document.getElementById('goalsModal').classList.add('hidden'); }
          document.getElementById('goalsModal').addEventListener('click', function(e) { if (e.target.id === 'goalsModal') closeGoalsModal(); });

          document.getElementById('goalsForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            var formData = new FormData(e.target);
            var goals = {
              conversion_rate: parseInt(formData.get('conversion_rate')) || 80,
              avg_score: parseInt(formData.get('avg_score')) || 85,
              contact_rate: parseInt(formData.get('contact_rate')) || 95,
              re_consultation: parseInt(formData.get('re_consultation')) || 3
            };
            try {
              var res = await fetch('/api/auth/goals', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(goals) });
              var data = await res.json();
              if (data.success) { closeGoalsModal(); loadReport(document.getElementById('periodSelect').value); }
              else { alert(data.error || '목표 저장에 실패했습니다.'); }
            } catch (err) { alert('오류가 발생했습니다.'); }
          });

          loadReport();
        `
      }} />
    </Layout>
  )
}
