import { FC } from 'hono/jsx'
import { Layout, Header } from '../shared/Layout'

interface Props {
  id: string
}

export const ConsultationReportPage: FC<Props> = ({ id }) => {
  return (
    <Layout activeTab="consultations">
      <Header title="AI 상담 레포트" subtitle="상세 분석 리포트" showBack backUrl={`/consultations/${id}`} rightAction={
        <button id="shareBtn" class="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-50 text-brand-600 hover:bg-brand-100 transition-all active:scale-95">
          <i class="fas fa-share-nodes text-sm"></i>
        </button>
      } />
      
      <div id="reportContent" class="px-4 py-4 space-y-3 pb-32">
        <div class="space-y-3 stagger-children">
          <div class="card-premium p-5"><div class="shimmer h-5 rounded-lg w-2/3 mb-3"></div><div class="shimmer h-16 rounded-lg w-full"></div></div>
          <div class="card-premium p-5"><div class="shimmer h-5 rounded-lg w-1/2 mb-3"></div><div class="shimmer h-24 rounded-lg w-full"></div></div>
          <div class="card-premium p-5"><div class="shimmer h-5 rounded-lg w-2/5 mb-3"></div><div class="shimmer h-20 rounded-lg w-full"></div></div>
          <div class="card-premium p-5"><div class="shimmer h-5 rounded-lg w-3/5 mb-3"></div><div class="shimmer h-28 rounded-lg w-full"></div></div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div id="bottomActions" class="fixed bottom-0 left-0 right-0 z-40 hidden">
        <div class="max-w-lg mx-auto px-4 pb-6">
          <div class="glass rounded-2xl shadow-float border border-white/60 p-3 flex gap-2">
            <button id="createProposalBtn" class="flex-1 bg-gradient-brand text-white font-semibold py-3 px-4 rounded-xl transition-all active:scale-[0.98] shadow-md shadow-brand-600/20 flex items-center justify-center gap-2 text-sm">
              <i class="fas fa-file-invoice"></i>제안서 생성
            </button>
            <button id="regenerateBtn" class="w-12 bg-surface-100 hover:bg-surface-200 text-surface-600 font-medium py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center">
              <i class="fas fa-arrows-rotate text-sm"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Proposal Modal */}
      <div id="proposalModal" class="hidden fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
        <div class="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-6 animate-slide-up">
          <div class="text-center mb-5">
            <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <i class="fas fa-check text-white text-2xl"></i>
            </div>
            <h3 class="text-lg font-bold text-surface-900">제안서 생성 완료!</h3>
            <p class="text-surface-500 text-sm mt-1">환자에게 공유할 수 있는 치료 제안서가 생성되었습니다</p>
          </div>
          <div class="bg-surface-50 rounded-xl p-3 mb-5">
            <p class="text-[10px] text-surface-400 font-semibold uppercase tracking-wider mb-1.5">공유 링크</p>
            <div class="flex items-center gap-2">
              <input id="proposalUrl" type="text" readonly class="flex-1 text-sm bg-white border border-surface-200 rounded-lg px-3 py-2 outline-none" />
              <button onclick="copyProposalUrl()" class="px-3 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 transition-all active:scale-95">복사</button>
            </div>
          </div>
          <div class="flex gap-2">
            <button onclick="sendViaKakao()" class="flex-1 bg-[#FEE500] hover:brightness-95 text-[#3C1E1E] font-semibold py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm">
              <i class="fas fa-comment"></i>카카오톡
            </button>
            <button onclick="closeProposalModal()" class="flex-1 bg-surface-100 hover:bg-surface-200 text-surface-700 font-semibold py-3 rounded-xl transition-all active:scale-[0.98] text-sm">
              닫기
            </button>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          const consultationId = '${id}';
          let reportData = null;
          let proposalData = null;

          async function loadReport() {
            try {
              const authRes = await fetch('/api/auth/me');
              if (!authRes.ok) { window.location.href = '/login'; return; }
              const reportRes = await fetch('/api/reports/' + consultationId);
              if (reportRes.status === 401) { window.location.href = '/login'; return; }
              const reportJson = await reportRes.json();
              if (reportJson.success) { reportData = reportJson.data; renderReport(reportData); }
              else { showGeneratePrompt(); }
            } catch (err) { console.error('Failed to load report:', err); showError(); }
          }

          function showGeneratePrompt() {
            document.getElementById('reportContent').innerHTML =
              '<div class="text-center py-16 animate-fade-in">' +
                '<div class="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-brand-100 to-purple-100 flex items-center justify-center">' +
                  '<i class="fas fa-wand-magic-sparkles text-4xl text-gradient"></i>' +
                '</div>' +
                '<h3 class="text-xl font-bold text-surface-900 mb-2">AI 레포트 생성</h3>' +
                '<p class="text-surface-500 text-sm mb-8 leading-relaxed">녹음된 상담을 AI가 분석하여<br/>상세 레포트를 생성합니다</p>' +
                '<button onclick="generateReport()" class="inline-flex items-center gap-2 bg-gradient-brand text-white font-semibold py-3.5 px-8 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-brand-600/30">' +
                  '<i class="fas fa-sparkles"></i>레포트 생성하기' +
                '</button>' +
              '</div>';
          }

          async function generateReport() {
            var steps = [
              { icon: 'fa-microphone', text: '음성 인식 (STT)...' },
              { icon: 'fa-users', text: '화자 분리 중...' },
              { icon: 'fa-search', text: '핵심 정보 추출 (NER)...' },
              { icon: 'fa-comments', text: 'SPIN 화법 분석...' },
              { icon: 'fa-file-lines', text: 'AI 리포트 생성 중...' }
            ];
            var stepIdx = 0;
            document.getElementById('reportContent').innerHTML =
              '<div class="text-center py-16 animate-fade-in">' +
                '<div class="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-brand-100 to-purple-100 flex items-center justify-center animate-pulse-soft">' +
                  '<i class="fas fa-brain text-4xl text-brand-600"></i>' +
                '</div>' +
                '<h3 class="text-xl font-bold text-surface-900 mb-2">GPT-5 심층 분석 중...</h3>' +
                '<p class="text-surface-500 text-sm leading-relaxed">5단계 AI 파이프라인을 실행하고 있습니다<br/>약 1~3분 소요됩니다</p>' +
                '<div class="w-64 mx-auto mt-6 bg-surface-100 rounded-full h-2 overflow-hidden">' +
                  '<div id="progressBar" class="bg-gradient-brand h-full rounded-full transition-all duration-1000" style="width:5%"></div>' +
                '</div>' +
                '<p id="analysisStep" class="text-xs text-surface-400 mt-3"><i class="fas fa-microphone mr-1"></i>음성 인식 준비 중...</p>' +
                '<p class="text-[10px] text-surface-300 mt-1" id="elapsedTime">0초 경과</p>' +
              '</div>';

            var startTime = Date.now();
            var stepTimer = setInterval(function() {
              var elapsed = Math.floor((Date.now() - startTime) / 1000);
              var el = document.getElementById('elapsedTime');
              if (el) el.textContent = elapsed + '초 경과';
              // Cycle through steps to show progress
              if (elapsed > 5 && stepIdx < 1) stepIdx = 1;
              if (elapsed > 15 && stepIdx < 2) stepIdx = 2;
              if (elapsed > 25 && stepIdx < 3) stepIdx = 3;
              if (elapsed > 40 && stepIdx < 4) stepIdx = 4;
              var pBar = document.getElementById('progressBar');
              var sEl = document.getElementById('analysisStep');
              if (pBar) pBar.style.width = Math.min(5 + stepIdx * 20, 95) + '%';
              if (sEl && steps[stepIdx]) sEl.innerHTML = '<i class="fas ' + steps[stepIdx].icon + ' mr-1"></i>' + steps[stepIdx].text;
            }, 1000);

            try {
              // Step 1: Trigger generation (returns immediately)
              const triggerRes = await fetch('/api/reports/' + consultationId + '/generate', { method: 'POST' });
              if (triggerRes.status === 401) { clearInterval(stepTimer); window.location.href = '/login'; return; }
              const triggerData = await triggerRes.json();
              if (!triggerData.success) { clearInterval(stepTimer); showError(triggerData.error); return; }

              // Step 2: Poll for completion
              var maxPolls = 90; // 90 * 3s = 270s max
              var pollCount = 0;
              while (pollCount < maxPolls) {
                await new Promise(function(r) { setTimeout(r, 3000); });
                pollCount++;
                try {
                  const statusRes = await fetch('/api/reports/' + consultationId + '/status');
                  if (statusRes.status === 401) { clearInterval(stepTimer); window.location.href = '/login'; return; }
                  const statusData = await statusRes.json();
                  if (!statusData.success) continue;
                  if (statusData.data.status === 'completed') {
                    clearInterval(stepTimer);
                    var pBar = document.getElementById('progressBar');
                    if (pBar) pBar.style.width = '100%';
                    reportData = statusData.data.report;
                    setTimeout(function() { renderReport({ ...statusData.data.report, id: statusData.data.report_id }); }, 500);
                    return;
                  }
                  if (statusData.data.status === 'failed') {
                    clearInterval(stepTimer);
                    showError('AI 분석에 실패했습니다. 다시 시도해주세요.');
                    return;
                  }
                } catch(pollErr) { /* network hiccup, keep polling */ }
              }
              clearInterval(stepTimer);
              showError('분석 시간이 초과되었습니다 (270초). 잠시 후 다시 시도해주세요.');
            } catch (err) {
              clearInterval(stepTimer);
              showError('네트워크 오류: ' + (err.message || '연결에 실패했습니다.'));
            }
          }

          function showError(message) {
            message = message || '오류가 발생했습니다.';
            document.getElementById('reportContent').innerHTML =
              '<div class="text-center py-16 animate-fade-in">' +
                '<div class="w-20 h-20 mx-auto mb-5 rounded-2xl bg-rose-50 flex items-center justify-center"><i class="fas fa-triangle-exclamation text-3xl text-rose-400"></i></div>' +
                '<h3 class="text-lg font-bold text-surface-900 mb-2">레포트 생성에 실패했습니다.</h3>' +
                '<p class="text-surface-500 text-sm mb-6 px-8">' + message + '</p>' +
                '<div class="flex flex-col gap-3 items-center">' +
                  '<button onclick="generateReport()" class="inline-flex items-center gap-2 bg-gradient-brand text-white font-semibold py-3 px-8 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-brand-600/30"><i class="fas fa-arrows-rotate"></i>다시 시도</button>' +
                  '<button onclick="window.location.href=\\'/consultations\\'" class="text-surface-400 text-sm hover:text-surface-600 transition-colors">상담 목록으로</button>' +
                '</div>' +
              '</div>';
          }

          function sec(title, icon, iconBg) {
            return '<div class="flex items-center gap-2 mb-3">' +
              '<div class="w-7 h-7 rounded-lg ' + iconBg + ' flex items-center justify-center"><i class="' + icon + ' text-xs"></i></div>' +
              '<h3 class="font-bold text-sm text-surface-900">' + title + '</h3></div>';
          }

          function gradeStyle(grade) {
            var m = { S:'bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-900', A:'bg-emerald-100 text-emerald-700', B:'bg-sky-100 text-sky-700', C:'bg-amber-100 text-amber-700', D:'bg-rose-100 text-rose-700' };
            return m[grade] || m['C'];
          }

          function renderReport(report) {
            var container = document.getElementById('reportContent');
            document.getElementById('bottomActions').classList.remove('hidden');

            var sentimentEmoji = { very_positive: '😊', positive: '🙂', neutral: '😐', negative: '😟', very_negative: '😔' };
            var sentimentText = { very_positive: '매우 긍정적', positive: '긍정적', neutral: '중립', negative: '부정적', very_negative: '매우 부정적' };

            var html = '<div class="space-y-3 stagger-children">';

            // Summary
            html += '<div class="card-premium p-5">' +
              sec('상담 요약', 'fas fa-file-lines text-brand-600', 'bg-brand-50') +
              '<div class="text-surface-700 text-sm leading-relaxed whitespace-pre-line">' + (report.consultation_summary || '') + '</div></div>';

            // Treatment Options
            if (report.treatment_options && report.treatment_options.length > 0) {
              html += '<div class="card-premium p-5">' +
                sec('치료 옵션', 'fas fa-tooth text-emerald-600', 'bg-emerald-50') +
                '<div class="space-y-2.5">';
              report.treatment_options.forEach(function(opt) {
                var isRec = opt.recommendation_level === 'high';
                html += '<div class="p-3.5 rounded-xl border-2 transition-all ' + (isRec ? 'border-brand-300 bg-brand-50/50 shadow-sm shadow-brand-200/30' : 'border-surface-200 bg-surface-50/50') + '">' +
                  '<div class="flex justify-between items-start mb-2">' +
                    '<div class="flex items-center gap-2"><span class="font-bold text-sm ' + (isRec ? 'text-brand-700' : 'text-surface-900') + '">' + opt.name + '</span>' +
                    (isRec ? '<span class="text-[10px] font-bold bg-brand-600 text-white px-2 py-0.5 rounded-md">추천</span>' : '') + '</div>' +
                    '<span class="text-lg font-black text-surface-900">' + (opt.price > 0 ? (opt.price / 10000).toFixed(0) + '<span class="text-xs font-semibold text-surface-400">만</span>' : '<span class="text-xs font-semibold text-surface-400">미정</span>') + '</span>' +
                  '</div>' +
                  (opt.duration ? '<p class="text-xs text-surface-500 mb-2 flex items-center gap-1"><i class="fas fa-clock text-[10px]"></i>' + opt.duration + '</p>' : '') +
                  '<div class="space-y-1">' +
                    (opt.pros ? opt.pros.map(function(p) { return '<div class="text-xs text-emerald-700 flex items-center gap-1.5"><i class="fas fa-check text-[9px]"></i>' + p + '</div>'; }).join('') : '') +
                    (opt.cons ? opt.cons.map(function(c) { return '<div class="text-xs text-rose-600 flex items-center gap-1.5"><i class="fas fa-xmark text-[9px]"></i>' + c + '</div>'; }).join('') : '') +
                  '</div></div>';
              });
              html += '</div></div>';

              // Payment Options
              if (report.payment_options && report.payment_options.installment_options && report.payment_options.installment_options.length > 0) {
                html += '<div class="card-premium p-5 bg-gradient-to-br from-sky-50/50 to-brand-50/30">' +
                  sec('결제 옵션', 'fas fa-credit-card text-sky-600', 'bg-sky-50') +
                  '<div class="grid grid-cols-3 gap-2">';
                report.payment_options.installment_options.forEach(function(inst) {
                  html += '<div class="bg-white rounded-xl p-3 text-center border border-surface-100 shadow-sm">' +
                    '<p class="text-[10px] text-surface-400 font-semibold">' + inst.months + '개월</p>' +
                    '<p class="text-lg font-black text-brand-600">' + Math.round(inst.monthly_amount / 10000) + '<span class="text-xs font-semibold text-surface-400">만</span></p>' +
                    '<p class="text-[10px] text-surface-400">/월</p></div>';
                });
                html += '</div></div>';
              }
            }

            // Patient Concerns
            if (report.patient_concerns && report.patient_concerns.length > 0) {
              html += '<div class="card-premium p-5">' +
                sec('환자 우려사항', 'fas fa-heart text-rose-600', 'bg-rose-50') +
                '<div class="space-y-2">';
              report.patient_concerns.forEach(function(concern) {
                html += '<div class="flex items-start gap-2.5 p-3 rounded-xl ' + (concern.addressed ? 'bg-emerald-50/50' : 'bg-amber-50/50') + '">' +
                  '<div class="w-6 h-6 rounded-lg shrink-0 mt-0.5 flex items-center justify-center ' + (concern.addressed ? 'bg-emerald-100' : 'bg-amber-100') + '">' +
                    '<i class="fas ' + (concern.addressed ? 'fa-check text-emerald-600' : 'fa-exclamation text-amber-600') + ' text-[10px]"></i></div>' +
                  '<div><p class="text-sm text-surface-800 font-medium">' + concern.concern + '</p>' +
                  (concern.resolution ? '<p class="text-xs text-surface-500 mt-1">→ ' + concern.resolution + '</p>' : '') +
                  '</div></div>';
              });
              html += '</div></div>';
            }

            // Emotion & Decision
            html += '<div class="card-premium p-5">' +
              sec('감정선 분석', 'fas fa-chart-line text-purple-600', 'bg-purple-50') +
              '<div class="flex items-center gap-4 p-3 bg-surface-50 rounded-xl mb-3">' +
                '<div class="text-4xl">' + (sentimentEmoji[report.overall_sentiment] || '😐') + '</div>' +
                '<div><p class="font-bold text-surface-900">' + (sentimentText[report.overall_sentiment] || '중립') + '</p>' +
                '<p class="text-xs text-surface-500">' + (report.emotion_summary || '') + '</p></div>' +
              '</div>' +
              '<div class="flex items-center gap-3 mb-2">' +
                '<span class="text-xs font-semibold text-surface-500">결정 근접도</span>' +
                '<div class="flex-1 bg-surface-100 rounded-full h-2 overflow-hidden"><div class="bg-gradient-to-r from-brand-500 to-brand-400 h-2 rounded-full" style="width:' + ((report.decision_score || 5) * 10) + '%"></div></div>' +
                '<span class="font-black text-brand-600 text-sm">' + (report.decision_score || 5) + '/10</span>' +
              '</div>' +
              (report.decision_prediction ? '<p class="text-sm text-surface-600 bg-surface-50 p-3 rounded-xl">' + report.decision_prediction + '</p>' : '');

            // Emotion Timeline
            if (report.emotion_timeline && report.emotion_timeline.length > 0) {
              html += '<div class="mt-4"><p class="text-[10px] font-semibold text-surface-400 uppercase tracking-wider mb-2">감정 변화</p>' +
                '<div class="flex items-end gap-0.5 h-12">';
              var maxP = Math.min(report.emotion_timeline.length, 20);
              var step = Math.ceil(report.emotion_timeline.length / maxP);
              for (var i = 0; i < report.emotion_timeline.length; i += step) {
                var point = report.emotion_timeline[i];
                var height = ((point.score + 1) / 2) * 100;
                var color = point.score > 0.3 ? 'bg-emerald-400' : point.score < -0.3 ? 'bg-rose-400' : 'bg-amber-400';
                html += '<div class="flex-1 ' + color + ' rounded-t-sm transition-all" style="height:' + Math.max(10, height) + '%" title="' + (point.note || '') + '"></div>';
              }
              html += '</div></div>';
            }
            html += '</div>';

            // Coaching Feedback
            if (report.coaching_feedback) {
              var cf = report.coaching_feedback;
              // Extract grade from patient_code_evaluation (e.g., "등급: D" or "종합 등급: D")
              var extractedGrade = '';
              if (cf.patient_code_evaluation) {
                var gradeMatch = cf.patient_code_evaluation.match(/등급[：:]\\s*([SABCD])/i);
                if (gradeMatch) extractedGrade = gradeMatch[1].toUpperCase();
              }
              var displayGrade = cf.grade || extractedGrade || '';
              html += '<div class="card-premium p-5 bg-gradient-to-br from-purple-50/50 to-pink-50/30">' +
                '<div class="flex items-center gap-2 mb-4">' +
                  '<div class="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center"><i class="fas fa-graduation-cap text-xs text-purple-600"></i></div>' +
                  '<h3 class="font-bold text-sm text-surface-900">코칭 피드백</h3>' +
                  (displayGrade ? '<span class="ml-1 text-xs font-black px-2 py-0.5 rounded-lg ' + gradeStyle(displayGrade) + '">' + displayGrade + '</span>' : '') +
                  '<span class="ml-auto text-2xl font-black text-purple-600">' + (cf.total_score || 0) + '<span class="text-xs font-semibold text-surface-400">점</span></span>' +
                '</div>';
              // 한줄 코칭
              if (cf.one_line_coaching) {
                html += '<div class="mb-4 p-3 bg-gradient-to-r from-brand-50 to-purple-50 rounded-xl border border-brand-200/50">' +
                  '<div class="flex items-center gap-2"><i class="fas fa-bullseye text-brand-500 text-xs"></i><span class="text-[10px] font-bold text-brand-600 uppercase tracking-wider">핵심 코칭</span></div>' +
                  '<p class="text-sm font-semibold text-brand-800 mt-1.5">"' + cf.one_line_coaching + '"</p></div>';
              }
              if (cf.scores) {
                var areas = [
                  {k:'rapport',n:'라포',m:20,c:'pink'}, {k:'spin',n:'SPIN',m:25,c:'purple'}, {k:'objection_handling',n:'반론처리',m:20,c:'sky'},
                  {k:'pricing_framing',n:'가격프레이밍',m:15,c:'emerald'}, {k:'closing',n:'클로징',m:10,c:'amber'}, {k:'structure',n:'구조',m:10,c:'orange'}
                ];
                html += '<div class="space-y-2 mb-4">';
                areas.forEach(function(a) {
                  var s = cf.scores[a.k] || 0;
                  var pct = (s / a.m) * 100;
                  html += '<div class="flex items-center gap-2"><span class="text-[11px] text-surface-500 w-16 shrink-0">' + a.n + '</span>' +
                    '<div class="flex-1 bg-surface-100 rounded-full h-1.5 overflow-hidden"><div class="bg-' + a.c + '-500 h-1.5 rounded-full transition-all" style="width:' + pct + '%"></div></div>' +
                    '<span class="text-xs font-bold text-surface-700 w-12 text-right">' + s + '/' + a.m + '</span></div>';
                });
                html += '</div>';
              }
              if (cf.strengths && cf.strengths.length > 0) {
                html += '<div class="mb-3"><p class="text-xs font-semibold text-emerald-600 mb-2 flex items-center gap-1"><i class="fas fa-muscle"></i>강점</p>' +
                  '<div class="space-y-1">' + cf.strengths.map(function(s) { return '<p class="text-sm text-surface-700">• ' + s + '</p>'; }).join('') + '</div></div>';
              }
              if (cf.improvements && cf.improvements.length > 0) {
                html += '<div><p class="text-xs font-semibold text-amber-600 mb-2 flex items-center gap-1"><i class="fas fa-arrow-trend-up"></i>개선 포인트</p>' +
                  '<div class="space-y-2">' + cf.improvements.map(function(imp) {
                    return '<div class="bg-white rounded-xl p-3 text-sm border border-surface-100"><p class="text-surface-800 font-medium">• ' + imp.issue + '</p>' +
                      '<p class="text-brand-600 mt-1 text-xs">💡 ' + imp.suggestion + '</p>' +
                      (imp.example ? '<p class="text-surface-400 italic text-xs mt-1">"' + imp.example + '"</p>' : '') + '</div>';
                  }).join('') + '</div></div>';
              }
              if (cf.patient_code_evaluation) {
                html += '<div class="mt-3 p-3 bg-white rounded-xl border border-surface-100"><p class="text-[10px] font-semibold text-surface-400 uppercase tracking-wider mb-1">Patient Code 평가</p>' +
                  '<p class="text-sm text-surface-700">' + cf.patient_code_evaluation + '</p></div>';
              }
              html += '</div>';
            }

            // Decision Factors (object, not array)
            if (report.decision_factors && typeof report.decision_factors === 'object') {
              var df = report.decision_factors;
              var dfItems = [];
              if (df.main_concern) dfItems.push({icon:'fa-triangle-exclamation', color:'rose', label:'핵심 장벽', val: df.main_concern});
              if (df.decision_maker) dfItems.push({icon:'fa-user-check', color:'brand', label:'결정권자', val: df.decision_maker});
              if (df.budget_range) dfItems.push({icon:'fa-wallet', color:'emerald', label:'예산 범위', val: df.budget_range});
              if (df.timeline) dfItems.push({icon:'fa-clock', color:'amber', label:'결정 시기', val: df.timeline});
              if (dfItems.length > 0) {
                html += '<div class="card-premium p-5">' +
                  sec('결정 요인 분석', 'fas fa-scale-balanced text-indigo-600', 'bg-indigo-50') +
                  '<div class="space-y-2">';
                dfItems.forEach(function(item) {
                  html += '<div class="p-3 rounded-xl bg-' + item.color + '-50/50 border border-' + item.color + '-200/30">' +
                    '<div class="flex items-center gap-1.5 mb-1"><i class="fas ' + item.icon + ' text-' + item.color + '-500 text-[10px]"></i>' +
                    '<span class="text-[10px] font-bold text-' + item.color + '-600 uppercase tracking-wider">' + item.label + '</span></div>' +
                    '<p class="text-sm text-surface-700">' + item.val + '</p></div>';
                });
                html += '</div></div>';
              }
            }

            // Next Actions
            if (report.next_actions && report.next_actions.length > 0) {
              html += '<div class="card-premium p-5">' +
                sec('다음 액션', 'fas fa-list-check text-amber-600', 'bg-amber-50') +
                '<div class="space-y-2">';
              report.next_actions.forEach(function(action) {
                var pc = action.priority === 'high' ? 'border-l-rose-500 bg-rose-50/30' : action.priority === 'medium' ? 'border-l-amber-500 bg-amber-50/30' : 'border-l-surface-300 bg-surface-50/30';
                html += '<div class="flex items-center gap-3 p-3 rounded-xl border-l-3 ' + pc + '">' +
                  '<div class="flex-1"><p class="text-sm text-surface-800 font-medium">' + action.action + '</p>' +
                  (action.due_date ? '<p class="text-xs text-surface-500 mt-0.5"><i class="fas fa-calendar text-[10px] mr-1"></i>' + action.due_date + '까지</p>' : '') +
                  '</div></div>';
              });
              html += '</div></div>';
            }

            // Followup
            if (report.recommended_followup_date || report.followup_message) {
              html += '<div class="card-premium p-5 bg-gradient-to-br from-sky-50/50 to-brand-50/30">' +
                sec('추천 팔로업', 'fas fa-phone text-sky-600', 'bg-sky-50') +
                (report.recommended_followup_date ? '<div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-100 text-sky-700 text-xs font-semibold mb-2"><i class="fas fa-calendar"></i>' + report.recommended_followup_date + '</div>' : '') +
                (report.followup_message ? '<p class="text-sm text-surface-700 bg-white p-3 rounded-xl border border-surface-100 italic">"' + report.followup_message + '"</p>' : '') +
              '</div>';
            }

            html += '</div>';

            // AI Model Badge (dynamic)
            var modelName = report.generation_model || 'GPT-5';
            var genTime = report.created_at ? new Date(report.created_at).toLocaleString('ko-KR', {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '';
            html += '<div class="flex items-center justify-center gap-2 py-4">' +
              '<div class="flex items-center gap-1.5 px-3 py-1.5 bg-surface-50 rounded-full border border-surface-200">' +
                '<div class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>' +
                '<span class="text-[10px] font-semibold text-surface-500">Powered by ' + modelName + ' &bull; Patient Funnel AI</span>' +
                (genTime ? '<span class="text-[9px] text-surface-400">&bull; ' + genTime + '</span>' : '') +
              '</div>' +
            '</div>';

            container.innerHTML = html;
          }

          // Create Proposal
          document.getElementById('createProposalBtn').addEventListener('click', async function() {
            var btn = document.getElementById('createProposalBtn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner-third fa-spin"></i>생성 중...';
            try {
              var res = await fetch('/api/reports/' + consultationId + '/proposal', { method: 'POST' });
              var data = await res.json();
              if (data.success) {
                proposalData = data.data;
                document.getElementById('proposalUrl').value = window.location.origin + data.data.public_url;
                document.getElementById('proposalModal').classList.remove('hidden');
              } else { showToast(data.error || '제안서 생성에 실패했습니다.','error'); }
            } catch (err) { showToast('오류가 발생했습니다.','error'); }
            finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-file-invoice"></i>제안서 생성'; }
          });

          document.getElementById('regenerateBtn').addEventListener('click', async function() {
            if (!confirm('레포트를 다시 생성하시겠습니까?')) return;
            await generateReport();
          });

          function copyProposalUrl() {
            var input = document.getElementById('proposalUrl');
            input.select();
            navigator.clipboard.writeText(input.value).then(function() { showToast('링크가 복사되었습니다!','success'); });
          }

          function sendViaKakao() {
            if (proposalData) {
              var url = window.location.origin + proposalData.public_url;
              window.open('https://sharer.kakao.com/talk/friends/picker/link?url=' + encodeURIComponent(url), '_blank', 'width=500,height=600');
            }
          }

          function closeProposalModal() { document.getElementById('proposalModal').classList.add('hidden'); }

          loadReport();
        `
      }} />
    </Layout>
  )
}
