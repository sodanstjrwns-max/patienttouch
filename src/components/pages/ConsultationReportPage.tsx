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
            document.getElementById('reportContent').innerHTML =
              '<div class="text-center py-16 animate-fade-in">' +
                '<div class="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-brand-100 to-purple-100 flex items-center justify-center animate-pulse-soft">' +
                  '<i class="fas fa-brain text-4xl text-brand-600"></i>' +
                '</div>' +
                '<h3 class="text-xl font-bold text-surface-900 mb-2">AI 분석 중...</h3>' +
                '<p class="text-surface-500 text-sm leading-relaxed">상담 내용을 분석하고 있습니다<br/>약 30초~1분 소요됩니다</p>' +
                '<div class="flex justify-center gap-1 mt-6">' +
                  '<div class="w-2 h-2 rounded-full bg-brand-400 animate-wave" style="animation-delay:0s"></div>' +
                  '<div class="w-2 h-2 rounded-full bg-brand-400 animate-wave" style="animation-delay:0.2s"></div>' +
                  '<div class="w-2 h-2 rounded-full bg-brand-400 animate-wave" style="animation-delay:0.4s"></div>' +
                '</div>' +
              '</div>';
            try {
              const res = await fetch('/api/reports/' + consultationId + '/generate', { method: 'POST' });
              const data = await res.json();
              if (data.success) { reportData = data.data.report; renderReport({ ...data.data.report, id: data.data.report_id }); }
              else { showError(data.error); }
            } catch (err) { showError('레포트 생성 중 오류가 발생했습니다.'); }
          }

          function showError(message) {
            message = message || '오류가 발생했습니다.';
            document.getElementById('reportContent').innerHTML =
              '<div class="text-center py-16 animate-fade-in">' +
                '<div class="w-20 h-20 mx-auto mb-5 rounded-2xl bg-rose-50 flex items-center justify-center"><i class="fas fa-triangle-exclamation text-3xl text-rose-400"></i></div>' +
                '<p class="text-surface-500 text-sm">' + message + '</p>' +
                '<button onclick="loadReport()" class="mt-4 text-brand-600 font-semibold text-sm hover:text-brand-700 transition-colors">다시 시도</button>' +
              '</div>';
          }

          function sec(title, icon, iconBg) {
            return '<div class="flex items-center gap-2 mb-3">' +
              '<div class="w-7 h-7 rounded-lg ' + iconBg + ' flex items-center justify-center"><i class="' + icon + ' text-xs"></i></div>' +
              '<h3 class="font-bold text-sm text-surface-900">' + title + '</h3></div>';
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
                    '<span class="text-lg font-black text-surface-900">' + (opt.price / 10000).toFixed(0) + '<span class="text-xs font-semibold text-surface-400">만</span></span>' +
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
              html += '<div class="card-premium p-5 bg-gradient-to-br from-purple-50/50 to-pink-50/30">' +
                '<div class="flex items-center gap-2 mb-4">' +
                  '<div class="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center"><i class="fas fa-graduation-cap text-xs text-purple-600"></i></div>' +
                  '<h3 class="font-bold text-sm text-surface-900">코칭 피드백</h3>' +
                  '<span class="ml-auto text-2xl font-black text-purple-600">' + (cf.total_score || 0) + '<span class="text-xs font-semibold text-surface-400">점</span></span>' +
                '</div>';
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
              } else { alert(data.error || '제안서 생성에 실패했습니다.'); }
            } catch (err) { alert('오류가 발생했습니다.'); }
            finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-file-invoice"></i>제안서 생성'; }
          });

          document.getElementById('regenerateBtn').addEventListener('click', async function() {
            if (!confirm('레포트를 다시 생성하시겠습니까?')) return;
            await generateReport();
          });

          function copyProposalUrl() {
            var input = document.getElementById('proposalUrl');
            input.select();
            navigator.clipboard.writeText(input.value).then(function() { alert('링크가 복사되었습니다!'); });
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
