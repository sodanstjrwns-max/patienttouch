import { FC } from 'hono/jsx'
import { Layout, Header } from '../shared/Layout'

export const AdminDashboardPage: FC = () => {
  return (
    <Layout activeTab="report">
      <Header title="원장 대시보드" subtitle="팀 성과 종합" rightAction={
        <button id="periodSelect" class="text-xs font-semibold bg-surface-100 text-surface-600 rounded-xl px-3 py-2 transition-all active:scale-95">
          이번 주 <i class="fas fa-chevron-down ml-1 text-[10px]"></i>
        </button>
      } />
      
      <div class="px-4 py-4 space-y-3 pb-24">
        {/* Summary Cards */}
        <div class="grid grid-cols-2 gap-2">
          <div class="card-premium p-4 bg-gradient-to-br from-brand-500 to-brand-700 text-white border-0 shadow-lg shadow-brand-500/20">
            <p class="text-brand-200 text-[10px] font-semibold">총 상담</p>
            <p id="totalConsultations" class="text-3xl font-black mt-1">-</p>
            <p class="text-brand-200 text-[10px] mt-1"><span id="consultationTrend">-</span> vs 지난주</p>
          </div>
          <div class="card-premium p-4 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-0 shadow-lg shadow-emerald-500/20">
            <p class="text-emerald-200 text-[10px] font-semibold">전환율</p>
            <p id="conversionRate" class="text-3xl font-black mt-1">-%</p>
            <p class="text-emerald-200 text-[10px] mt-1"><span id="conversionTrend">-</span> vs 지난주</p>
          </div>
          <div class="card-premium p-4 bg-gradient-to-br from-sky-500 to-sky-700 text-white border-0 shadow-lg shadow-sky-500/20">
            <p class="text-sky-200 text-[10px] font-semibold">평균 코칭점수</p>
            <p id="avgCoachingScore" class="text-3xl font-black mt-1">-점</p>
            <p class="text-sky-200 text-[10px] mt-1"><span id="coachingTrend">-</span> vs 지난주</p>
          </div>
          <div class="card-premium p-4 bg-gradient-to-br from-purple-500 to-purple-700 text-white border-0 shadow-lg shadow-purple-500/20">
            <p class="text-purple-200 text-[10px] font-semibold">제안서 열람율</p>
            <p id="proposalViewRate" class="text-3xl font-black mt-1">-%</p>
            <p class="text-purple-200 text-[10px] mt-1"><span id="proposalTrend">-</span> vs 지난주</p>
          </div>
        </div>

        {/* Staff Performance */}
        <div class="card-premium overflow-hidden">
          <div class="p-4 border-b border-surface-100">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center"><i class="fas fa-users text-xs text-brand-600"></i></div>
              <h3 class="font-bold text-sm text-surface-900">상담사 성과</h3>
            </div>
          </div>
          <div id="staffPerformance">
            <div class="p-4 space-y-3">
              <div class="shimmer h-16 rounded-xl"></div>
              <div class="shimmer h-16 rounded-xl"></div>
            </div>
          </div>
        </div>

        {/* Coaching Breakdown */}
        <div class="card-premium p-5">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center"><i class="fas fa-chart-radar text-xs text-purple-600"></i></div>
            <h3 class="font-bold text-sm text-surface-900">코칭 영역별 평균</h3>
          </div>
          <div id="coachingBreakdown" class="space-y-3">
            <div class="shimmer h-6 rounded-lg"></div>
            <div class="shimmer h-6 rounded-lg"></div>
            <div class="shimmer h-6 rounded-lg"></div>
          </div>
        </div>

        {/* Low Score Consultations */}
        <div class="card-premium overflow-hidden">
          <div class="p-4 border-b border-surface-100">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center"><i class="fas fa-triangle-exclamation text-xs text-amber-600"></i></div>
              <div>
                <h3 class="font-bold text-sm text-surface-900">코칭 필요 상담</h3>
                <p class="text-[10px] text-surface-400">점수 70점 미만</p>
              </div>
            </div>
          </div>
          <div id="lowScoreConsultations" class="divide-y divide-surface-50 max-h-80 overflow-y-auto">
            <div class="p-4"><div class="shimmer h-16 rounded-xl"></div></div>
          </div>
        </div>

        {/* Proposal Analytics */}
        <div class="card-premium p-5">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center"><i class="fas fa-file-invoice text-xs text-sky-600"></i></div>
            <h3 class="font-bold text-sm text-surface-900">제안서 현황</h3>
          </div>
          <div id="proposalAnalytics" class="grid grid-cols-3 gap-2">
            <div class="bg-surface-50 rounded-xl p-3.5 text-center">
              <p id="proposalsSent" class="text-2xl font-black text-surface-900">-</p>
              <p class="text-[10px] font-semibold text-surface-400 mt-0.5">발송</p>
            </div>
            <div class="bg-sky-50 rounded-xl p-3.5 text-center">
              <p id="proposalsViewed" class="text-2xl font-black text-sky-600">-</p>
              <p class="text-[10px] font-semibold text-surface-400 mt-0.5">열람</p>
            </div>
            <div class="bg-emerald-50 rounded-xl p-3.5 text-center">
              <p id="proposalsConverted" class="text-2xl font-black text-emerald-600">-</p>
              <p class="text-[10px] font-semibold text-surface-400 mt-0.5">전환</p>
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          var currentPeriod = 'weekly';

          async function loadDashboard() {
            try {
              var authRes = await fetch('/api/auth/me');
              if (!authRes.ok) { window.location.href = '/login'; return; }
              var userData = await authRes.json();
              if (userData.data.role !== 'admin') { alert('관리자만 접근할 수 있습니다.'); window.location.href = '/'; return; }
              await Promise.all([loadSummary(), loadStaffPerformance(), loadCoachingBreakdown(), loadLowScoreConsultations(), loadProposalAnalytics()]);
            } catch (err) { console.error('Failed to load dashboard:', err); }
          }

          async function loadSummary() {
            try {
              var res = await fetch('/api/dashboard/admin-summary?period=' + currentPeriod);
              var data = await res.json();
              if (data.success) {
                var s = data.data;
                document.getElementById('totalConsultations').textContent = s.total_consultations || 0;
                document.getElementById('conversionRate').textContent = (s.conversion_rate || 0).toFixed(0) + '%';
                document.getElementById('avgCoachingScore').textContent = (s.avg_coaching_score || 0).toFixed(0) + '점';
                document.getElementById('proposalViewRate').textContent = (s.proposal_view_rate || 0).toFixed(0) + '%';
                document.getElementById('consultationTrend').textContent = formatTrend(s.consultation_trend);
                document.getElementById('conversionTrend').textContent = formatTrend(s.conversion_trend);
                document.getElementById('coachingTrend').textContent = formatTrend(s.coaching_trend);
                document.getElementById('proposalTrend').textContent = formatTrend(s.proposal_trend);
              }
            } catch(e) {}
          }

          function formatTrend(value) {
            if (!value) return '-';
            var sign = value > 0 ? '+' : '';
            return sign + value.toFixed(1) + '%';
          }

          async function loadStaffPerformance() {
            try {
              var res = await fetch('/api/dashboard/staff-performance?period=' + currentPeriod);
              var data = await res.json();
              var container = document.getElementById('staffPerformance');
              if (data.success && data.data.length > 0) {
                var colors = ['bg-brand-100 text-brand-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-sky-100 text-sky-700'];
                container.innerHTML = '<div class="divide-y divide-surface-50">' + data.data.map(function(staff) {
                  var c = colors[staff.name.charCodeAt(0) % colors.length];
                  return '<div class="p-4 hover:bg-surface-50 transition-all">' +
                    '<div class="flex items-center gap-3">' +
                      '<div class="w-10 h-10 rounded-xl ' + c + ' flex items-center justify-center font-bold text-sm shrink-0">' + staff.name.charAt(0) + '</div>' +
                      '<div class="flex-1 min-w-0"><p class="font-bold text-sm text-surface-900">' + staff.name + '</p><p class="text-[10px] text-surface-400">' + staff.total_consultations + '건 상담</p></div>' +
                      '<div class="text-right"><p class="font-black text-surface-900">' + (staff.conversion_rate || 0).toFixed(0) + '%</p><p class="text-[10px] text-surface-400">전환율</p></div>' +
                      '<div class="text-right ml-3"><p class="font-black ' + ((staff.avg_coaching_score || 0) >= 80 ? 'text-emerald-600' : (staff.avg_coaching_score || 0) >= 60 ? 'text-amber-600' : 'text-rose-600') + '">' + (staff.avg_coaching_score || 0).toFixed(0) + '점</p><p class="text-[10px] text-surface-400">코칭점수</p></div>' +
                    '</div>' +
                    '<div class="mt-2 flex gap-1"><div class="h-1 rounded-full bg-brand-400 transition-all" style="width:' + (staff.conversion_rate || 0) + '%"></div><div class="h-1 rounded-full bg-surface-100 flex-1"></div></div>' +
                  '</div>';
                }).join('') + '</div>';
              } else { container.innerHTML = '<p class="p-6 text-surface-400 text-center text-sm">데이터가 없습니다</p>'; }
            } catch(e) {}
          }

          async function loadCoachingBreakdown() {
            try {
              var res = await fetch('/api/dashboard/coaching-breakdown?period=' + currentPeriod);
              var data = await res.json();
              var container = document.getElementById('coachingBreakdown');
              if (data.success) {
                var areas = [
                  {k:'rapport',n:'라포 형성',m:20,c:'rose'}, {k:'spin',n:'SPIN 활용',m:25,c:'purple'}, {k:'objection',n:'반론 처리',m:20,c:'sky'},
                  {k:'pricing',n:'가격 프레이밍',m:15,c:'emerald'}, {k:'closing',n:'클로징',m:10,c:'amber'}, {k:'structure',n:'전체 구조',m:10,c:'orange'}
                ];
                container.innerHTML = areas.map(function(a) {
                  var s = data.data[a.k] || 0;
                  var pct = (s / a.m) * 100;
                  return '<div class="flex items-center gap-2"><span class="text-xs text-surface-500 w-20 shrink-0">' + a.n + '</span>' +
                    '<div class="flex-1 bg-surface-100 rounded-full h-2 overflow-hidden"><div class="bg-' + a.c + '-500 h-2 rounded-full transition-all" style="width:' + pct + '%"></div></div>' +
                    '<span class="text-xs font-bold text-surface-700 w-14 text-right">' + s.toFixed(1) + '/' + a.m + '</span></div>';
                }).join('');
              }
            } catch(e) {}
          }

          async function loadLowScoreConsultations() {
            try {
              var res = await fetch('/api/dashboard/low-score-consultations?threshold=70&limit=5');
              var data = await res.json();
              var container = document.getElementById('lowScoreConsultations');
              if (data.success && data.data.length > 0) {
                container.innerHTML = data.data.map(function(c) {
                  var date = new Date(c.consultation_date);
                  return '<a href="/consultations/' + c.id + '/report" class="block p-4 hover:bg-surface-50 transition-all">' +
                    '<div class="flex items-center justify-between">' +
                      '<div class="min-w-0"><p class="font-bold text-sm text-surface-900 truncate">' + (c.patient_name || '환자 미지정') + '</p>' +
                      '<p class="text-[10px] text-surface-400">' + (c.user_name || '') + ' · ' + date.toLocaleDateString('ko-KR') + '</p></div>' +
                      '<div class="text-right shrink-0 ml-3"><p class="text-xl font-black text-rose-500">' + (c.coaching_score || 0) + '점</p></div>' +
                    '</div>' +
                    (c.improvement_needed ? '<p class="text-xs text-amber-600 mt-1.5 flex items-center gap-1"><i class="fas fa-lightbulb text-[10px]"></i>' + c.improvement_needed + '</p>' : '') +
                  '</a>';
                }).join('');
              } else {
                container.innerHTML = '<div class="text-center py-6"><div class="w-12 h-12 mx-auto mb-2 rounded-xl bg-emerald-50 flex items-center justify-center"><i class="fas fa-check text-emerald-600"></i></div><p class="text-surface-400 text-sm">코칭 필요 상담이 없습니다 👍</p></div>';
              }
            } catch(e) {}
          }

          async function loadProposalAnalytics() {
            try {
              var res = await fetch('/api/dashboard/proposal-analytics?period=' + currentPeriod);
              var data = await res.json();
              if (data.success) {
                document.getElementById('proposalsSent').textContent = data.data.sent || 0;
                document.getElementById('proposalsViewed').textContent = data.data.viewed || 0;
                document.getElementById('proposalsConverted').textContent = data.data.converted || 0;
              }
            } catch(e) {}
          }

          document.getElementById('periodSelect').addEventListener('click', function() {
            var periods = { daily:'오늘', weekly:'이번 주', monthly:'이번 달' };
            var keys = Object.keys(periods);
            var currentIdx = keys.indexOf(currentPeriod);
            currentPeriod = keys[(currentIdx + 1) % keys.length];
            document.getElementById('periodSelect').innerHTML = periods[currentPeriod] + ' <i class="fas fa-chevron-down ml-1 text-[10px]"></i>';
            loadDashboard();
          });

          loadDashboard();
        `
      }} />
    </Layout>
  )
}
