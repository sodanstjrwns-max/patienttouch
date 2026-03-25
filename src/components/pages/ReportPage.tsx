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

      {/* View Tabs */}
      <div class="px-4 pt-3 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
        <button class="report-tab px-3.5 py-2 text-xs font-bold rounded-xl transition-all bg-brand-600 text-white shadow-sm whitespace-nowrap" data-tab="overview" onclick="switchTab('overview')">
          <i class="fas fa-bullseye mr-1"></i>목표
        </button>
        <button class="report-tab px-3.5 py-2 text-xs font-bold rounded-xl transition-all bg-surface-100 text-surface-600 whitespace-nowrap" data-tab="chart" onclick="switchTab('chart')">
          <i class="fas fa-chart-line mr-1"></i>매출 추이
        </button>
        <button class="report-tab px-3.5 py-2 text-xs font-bold rounded-xl transition-all bg-surface-100 text-surface-600 whitespace-nowrap" data-tab="referral" onclick="switchTab('referral')">
          <i class="fas fa-route mr-1"></i>경로 ROI
        </button>
        <button class="report-tab px-3.5 py-2 text-xs font-bold rounded-xl transition-all bg-surface-100 text-surface-600 whitespace-nowrap" data-tab="treatment" onclick="switchTab('treatment')">
          <i class="fas fa-tooth mr-1"></i>치료항목
        </button>
      </div>
      
      <div class="px-4 py-4 space-y-3 pb-24">
        {/* Overview Tab */}
        <div id="overviewTab">
          {/* KPI Overview */}
          <div class="card-premium p-5 mb-3">
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
          <div class="grid grid-cols-2 gap-2 mb-3">
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
          <div class="card-premium p-5 bg-gradient-to-r from-brand-50/50 to-purple-50/30 mb-3">
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

        {/* Chart Tab */}
        <div id="chartTab" class="hidden">
          <div class="card-premium p-5 mb-3">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center"><i class="fas fa-chart-line text-xs text-brand-600"></i></div>
              <h2 class="font-bold text-sm text-surface-900">매출 추이</h2>
            </div>
            <canvas id="revenueChart" height="220"></canvas>
          </div>
          <div class="card-premium p-5">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center"><i class="fas fa-percent text-xs text-emerald-600"></i></div>
              <h2 class="font-bold text-sm text-surface-900">전환율 추이</h2>
            </div>
            <canvas id="conversionChart" height="200"></canvas>
          </div>
        </div>

        {/* Referral ROI Tab */}
        <div id="referralTab" class="hidden">
          <div id="referralContent">
            <div class="card-premium p-5"><div class="shimmer h-40 rounded-lg w-full"></div></div>
          </div>
        </div>

        {/* Treatment Tab */}
        <div id="treatmentTab" class="hidden">
          <div id="treatmentContent">
            <div class="card-premium p-5"><div class="shimmer h-40 rounded-lg w-full"></div></div>
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
          var currentTab = 'overview';
          var revenueChartInstance = null;
          var conversionChartInstance = null;

          function switchTab(tab) {
            currentTab = tab;
            ['overview','chart','referral','treatment'].forEach(function(t) {
              document.getElementById(t + 'Tab').classList.toggle('hidden', t !== tab);
            });
            document.querySelectorAll('.report-tab').forEach(function(b) {
              b.className = b.dataset.tab === tab
                ? 'report-tab px-3.5 py-2 text-xs font-bold rounded-xl transition-all bg-brand-600 text-white shadow-sm whitespace-nowrap'
                : 'report-tab px-3.5 py-2 text-xs font-bold rounded-xl transition-all bg-surface-100 text-surface-600 whitespace-nowrap';
            });
            var period = document.getElementById('periodSelect').value;
            if (tab === 'chart') loadChartData(period);
            if (tab === 'referral') loadReferralROI(period);
            if (tab === 'treatment') loadTreatmentAnalysis(period);
          }

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
            document.getElementById('totalAmount').textContent = ((data.total_amount || 0) / 10000).toFixed(0) + '만원';

            document.getElementById('goalConversion').textContent = (goals.conversion_rate || 80) + '%';
            document.getElementById('goalScore').textContent = (goals.avg_score || 85) + '점';
            document.getElementById('goalContact').textContent = (goals.contact_rate || 95) + '%';
            document.getElementById('goalReConsult').textContent = (goals.re_consultation || 3) + '건';
          }

          // ============================================
          // Chart Data
          // ============================================
          async function loadChartData(period) {
            var days = period === 'week' ? 7 : period === 'quarter' ? 90 : 30;
            try {
              var res = await fetch('/api/dashboard/revenue-trend?days=' + days);
              var data = await res.json();
              if (data.success) renderCharts(data.data);
            } catch (err) { console.error('Chart load error:', err); }
          }

          function renderCharts(data) {
            if (!window.Chart || !data || data.length === 0) return;

            var labels = data.map(function(d) { 
              var dt = new Date(d.date); 
              return (dt.getMonth()+1)+'/'+dt.getDate(); 
            });
            var paidAmts = data.map(function(d) { return Math.round((d.paid_amount || 0) / 10000); });
            var totalAmts = data.map(function(d) { return Math.round((d.total_amount || 0) / 10000); });
            var convRates = data.map(function(d) { return d.conversion_rate || 0; });
            var consultCounts = data.map(function(d) { return d.total_consultations || 0; });

            // Revenue Chart
            if (revenueChartInstance) revenueChartInstance.destroy();
            var ctx1 = document.getElementById('revenueChart');
            if (ctx1) {
              revenueChartInstance = new Chart(ctx1.getContext('2d'), {
                type: 'bar',
                data: {
                  labels: labels,
                  datasets: [
                    { label: '결정 매출 (만원)', data: paidAmts, backgroundColor: 'rgba(99,102,241,0.8)', borderRadius: 6, order: 1 },
                    { label: '상담 매출 (만원)', data: totalAmts, backgroundColor: 'rgba(99,102,241,0.15)', borderRadius: 6, order: 2 }
                  ]
                },
                options: {
                  responsive: true,
                  plugins: { legend: { display: true, position: 'bottom', labels: { font: { size: 10, family: 'Pretendard Variable' }, usePointStyle: true, pointStyleWidth: 8, padding: 12 } } },
                  scales: { x: { grid: { display: false }, ticks: { font: { size: 9 } } }, y: { beginAtZero: true, ticks: { font: { size: 9 }, callback: function(v) { return v + '만'; } }, grid: { color: '#f1f5f9' } } }
                }
              });
            }

            // Conversion Chart
            if (conversionChartInstance) conversionChartInstance.destroy();
            var ctx2 = document.getElementById('conversionChart');
            if (ctx2) {
              conversionChartInstance = new Chart(ctx2.getContext('2d'), {
                type: 'line',
                data: {
                  labels: labels,
                  datasets: [
                    { label: '전환율 (%)', data: convRates, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', fill: true, tension: 0.3, pointRadius: 3, pointBackgroundColor: '#10b981', borderWidth: 2, yAxisID: 'y' },
                    { label: '상담 건수', data: consultCounts, borderColor: '#6366f1', backgroundColor: 'transparent', tension: 0.3, pointRadius: 3, pointBackgroundColor: '#6366f1', borderWidth: 2, borderDash: [4,4], yAxisID: 'y1' }
                  ]
                },
                options: {
                  responsive: true,
                  interaction: { mode: 'index', intersect: false },
                  plugins: { legend: { display: true, position: 'bottom', labels: { font: { size: 10, family: 'Pretendard Variable' }, usePointStyle: true, pointStyleWidth: 8, padding: 12 } } },
                  scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 9 } } },
                    y: { beginAtZero: true, max: 100, position: 'left', ticks: { font: { size: 9 }, callback: function(v) { return v + '%'; } }, grid: { color: '#f1f5f9' } },
                    y1: { beginAtZero: true, position: 'right', ticks: { font: { size: 9 }, callback: function(v) { return v + '건'; } }, grid: { display: false } }
                  }
                }
              });
            }
          }

          // ============================================
          // Referral ROI
          // ============================================
          async function loadReferralROI(period) {
            try {
              var res = await fetch('/api/dashboard/referral-roi?period=' + period);
              var data = await res.json();
              if (data.success) renderReferralROI(data.data);
            } catch (err) { console.error('Referral ROI error:', err); }
          }

          function renderReferralROI(data) {
            if (!data || data.length === 0) {
              document.getElementById('referralContent').innerHTML = '<div class="card-premium p-8 text-center"><i class="fas fa-chart-bar text-3xl text-surface-300 mb-3"></i><p class="text-surface-500 text-sm">데이터가 아직 없습니다</p></div>';
              return;
            }

            var refLabels = { '온라인광고': '🔍 온라인광고', '네이버검색': '🟢 네이버', '인스타그램': '📸 인스타', '유튜브': '🎬 유튜브', '지인소개': '👥 지인소개', '간판': '🏠 간판/도보', '블로그': '📝 블로그', '카페/커뮤니티': '💬 커뮤니티', '재내원': '🔄 재내원', '기타': '📌 기타', '미분류': '❓ 미분류' };

            var html = '';
            // Top summary chart
            html += '<div class="card-premium p-5 mb-3">';
            html += '<div class="flex items-center gap-2 mb-4"><div class="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center"><i class="fas fa-route text-xs text-brand-600"></i></div><h2 class="font-bold text-sm text-surface-900">내원경로별 전환율</h2></div>';
            html += '<canvas id="referralChart" height="200"></canvas>';
            html += '</div>';

            // Detail cards
            html += '<div class="space-y-2">';
            data.forEach(function(r) {
              var label = refLabels[r.referral_source] || r.referral_source;
              var cvColor = r.conversion_rate >= 70 ? 'text-emerald-600' : r.conversion_rate >= 40 ? 'text-amber-600' : 'text-rose-600';
              html += '<div class="card-premium p-4">';
              html += '<div class="flex items-center justify-between mb-2">';
              html += '<span class="font-bold text-sm text-surface-900">' + label + '</span>';
              html += '<span class="text-xl font-black ' + cvColor + '">' + r.conversion_rate + '<span class="text-xs">%</span></span>';
              html += '</div>';
              html += '<div class="grid grid-cols-4 gap-2 text-center">';
              html += '<div><p class="text-sm font-bold text-surface-800">' + r.total_consultations + '</p><p class="text-[9px] text-surface-400">상담</p></div>';
              html += '<div><p class="text-sm font-bold text-emerald-600">' + r.paid_consultations + '</p><p class="text-[9px] text-surface-400">결제</p></div>';
              html += '<div><p class="text-sm font-bold text-brand-600">' + Math.round(r.paid_amount / 10000) + '만</p><p class="text-[9px] text-surface-400">매출</p></div>';
              html += '<div><p class="text-sm font-bold text-purple-600">' + r.avg_score + '점</p><p class="text-[9px] text-surface-400">점수</p></div>';
              html += '</div>';
              // Progress bar
              html += '<div class="mt-2 flex items-center gap-2">';
              html += '<div class="flex-1 h-1.5 bg-surface-100 rounded-full overflow-hidden">';
              var paidW = r.total_consultations > 0 ? Math.round(r.paid_consultations / r.total_consultations * 100) : 0;
              var undW = r.total_consultations > 0 ? Math.round(r.undecided_consultations / r.total_consultations * 100) : 0;
              html += '<div class="h-full flex"><div class="bg-emerald-500 rounded-l-full" style="width:' + paidW + '%"></div><div class="bg-amber-400" style="width:' + undW + '%"></div><div class="bg-rose-400 rounded-r-full flex-1"></div></div>';
              html += '</div>';
              html += '<span class="text-[9px] text-surface-400 shrink-0">' + r.unique_patients + '명</span>';
              html += '</div>';
              html += '</div>';
            });
            html += '</div>';

            document.getElementById('referralContent').innerHTML = html;

            // Render chart
            setTimeout(function() {
              var canvas = document.getElementById('referralChart');
              if (!canvas || !window.Chart) return;
              var labels = data.map(function(r) { return r.referral_source; });
              var rates = data.map(function(r) { return r.conversion_rate; });
              var amounts = data.map(function(r) { return Math.round(r.paid_amount / 10000); });
              new Chart(canvas.getContext('2d'), {
                type: 'bar',
                data: {
                  labels: labels,
                  datasets: [
                    { label: '전환율(%)', data: rates, backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 4, yAxisID: 'y' },
                    { label: '매출(만원)', data: amounts, backgroundColor: 'rgba(99,102,241,0.3)', borderRadius: 4, yAxisID: 'y1' }
                  ]
                },
                options: {
                  responsive: true,
                  plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, usePointStyle: true, pointStyleWidth: 8, padding: 10 } } },
                  scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 9 }, maxRotation: 45 } },
                    y: { beginAtZero: true, max: 100, position: 'left', ticks: { font: { size: 9 }, callback: function(v){return v+'%';} }, grid: { color: '#f1f5f9' } },
                    y1: { beginAtZero: true, position: 'right', ticks: { font: { size: 9 }, callback: function(v){return v+'만';} }, grid: { display: false } }
                  }
                }
              });
            }, 50);
          }

          // ============================================
          // Treatment Analysis
          // ============================================
          async function loadTreatmentAnalysis(period) {
            try {
              var res = await fetch('/api/dashboard/treatment-analysis?period=' + period);
              var data = await res.json();
              if (data.success) renderTreatmentAnalysis(data.data);
            } catch (err) { console.error('Treatment analysis error:', err); }
          }

          function renderTreatmentAnalysis(data) {
            if (!data || data.length === 0) {
              document.getElementById('treatmentContent').innerHTML = '<div class="card-premium p-8 text-center"><i class="fas fa-tooth text-3xl text-surface-300 mb-3"></i><p class="text-surface-500 text-sm">데이터가 아직 없습니다</p></div>';
              return;
            }

            var html = '';
            // Chart
            html += '<div class="card-premium p-5 mb-3">';
            html += '<div class="flex items-center gap-2 mb-4"><div class="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center"><i class="fas fa-tooth text-xs text-emerald-600"></i></div><h2 class="font-bold text-sm text-surface-900">치료항목별 전환율</h2></div>';
            html += '<canvas id="treatmentChart" height="200"></canvas>';
            html += '</div>';

            // Ranking
            html += '<div class="card-premium p-5 mb-3">';
            html += '<div class="flex items-center gap-2 mb-4"><div class="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center"><i class="fas fa-ranking-star text-xs text-amber-600"></i></div><h2 class="font-bold text-sm text-surface-900">매출 기여도 순위</h2></div>';
            var totalPaid = data.reduce(function(s, d) { return s + (d.paid_amount || 0); }, 0);
            html += '<div class="space-y-2">';
            data.forEach(function(t, i) {
              var contribution = totalPaid > 0 ? Math.round(t.paid_amount / totalPaid * 100) : 0;
              var medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i+1)+'';
              var cvColor = t.conversion_rate >= 70 ? 'text-emerald-600 bg-emerald-50' : t.conversion_rate >= 40 ? 'text-amber-600 bg-amber-50' : 'text-rose-600 bg-rose-50';
              html += '<div class="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">';
              html += '<span class="text-base w-6 text-center shrink-0">' + medal + '</span>';
              html += '<div class="flex-1 min-w-0">';
              html += '<div class="flex items-center gap-2 mb-1"><span class="font-bold text-sm">' + t.treatment_type + '</span><span class="text-[10px] px-1.5 py-0.5 rounded-md font-bold ' + cvColor + '">전환 ' + t.conversion_rate + '%</span></div>';
              html += '<div class="h-1.5 bg-surface-200 rounded-full overflow-hidden"><div class="h-full bg-brand-500 rounded-full" style="width:' + contribution + '%"></div></div>';
              html += '</div>';
              html += '<div class="text-right shrink-0">';
              html += '<p class="text-sm font-black text-brand-600">' + Math.round(t.paid_amount / 10000) + '만</p>';
              html += '<p class="text-[9px] text-surface-400">' + t.total_consultations + '건 / ' + contribution + '%</p>';
              html += '</div>';
              html += '</div>';
            });
            html += '</div></div>';

            // Detail stats
            html += '<div class="space-y-2">';
            data.forEach(function(t) {
              html += '<div class="card-premium p-4">';
              html += '<div class="flex items-center justify-between mb-2"><span class="font-bold text-sm">' + t.treatment_type + '</span><span class="text-[10px] font-semibold px-2 py-1 rounded-lg bg-brand-50 text-brand-600">평균 ' + Math.round(t.avg_amount / 10000) + '만원</span></div>';
              html += '<div class="grid grid-cols-4 gap-2 text-center">';
              html += '<div><p class="text-sm font-bold text-surface-800">' + t.total_consultations + '</p><p class="text-[9px] text-surface-400">전체</p></div>';
              html += '<div><p class="text-sm font-bold text-emerald-600">' + t.paid_consultations + '</p><p class="text-[9px] text-surface-400">결제</p></div>';
              html += '<div><p class="text-sm font-bold text-amber-600">' + t.undecided_consultations + '</p><p class="text-[9px] text-surface-400">미결정</p></div>';
              html += '<div><p class="text-sm font-bold text-rose-600">' + t.lost_consultations + '</p><p class="text-[9px] text-surface-400">이탈</p></div>';
              html += '</div>';
              html += '</div>';
            });
            html += '</div>';

            document.getElementById('treatmentContent').innerHTML = html;

            // Render chart
            setTimeout(function() {
              var canvas = document.getElementById('treatmentChart');
              if (!canvas || !window.Chart) return;
              var labels = data.map(function(t) { return t.treatment_type; });
              var rates = data.map(function(t) { return t.conversion_rate; });
              var paid = data.map(function(t) { return t.paid_consultations; });
              var undecided = data.map(function(t) { return t.undecided_consultations; });
              var lost = data.map(function(t) { return t.lost_consultations; });
              new Chart(canvas.getContext('2d'), {
                type: 'bar',
                data: {
                  labels: labels,
                  datasets: [
                    { label: '결제', data: paid, backgroundColor: '#10b981', borderRadius: 4 },
                    { label: '미결정', data: undecided, backgroundColor: '#f59e0b', borderRadius: 4 },
                    { label: '이탈', data: lost, backgroundColor: '#f43f5e', borderRadius: 4 }
                  ]
                },
                options: {
                  responsive: true,
                  plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, usePointStyle: true, pointStyleWidth: 8, padding: 10 } } },
                  scales: {
                    x: { stacked: true, grid: { display: false }, ticks: { font: { size: 9 }, maxRotation: 45 } },
                    y: { stacked: true, beginAtZero: true, ticks: { font: { size: 9 }, stepSize: 1, callback: function(v){return v+'건';} }, grid: { color: '#f1f5f9' } }
                  }
                }
              });
            }, 50);
          }

          // ============================================
          // Events & Init
          // ============================================
          document.getElementById('periodSelect').addEventListener('change', function(e) {
            var period = e.target.value;
            loadReport(period);
            if (currentTab === 'chart') loadChartData(period);
            if (currentTab === 'referral') loadReferralROI(period);
            if (currentTab === 'treatment') loadTreatmentAnalysis(period);
          });

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
