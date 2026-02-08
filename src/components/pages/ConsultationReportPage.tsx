import { FC } from 'hono/jsx'
import { Layout, Header } from '../shared/Layout'

interface Props {
  id: string
}

export const ConsultationReportPage: FC<Props> = ({ id }) => {
  return (
    <Layout activeTab="consultations">
      <Header title="상담 레포트" showBack backUrl={`/consultations/${id}`} rightAction={
        <button id="shareBtn" class="text-primary-600 font-medium text-sm">
          <i class="fas fa-share-alt mr-1"></i>공유
        </button>
      } />
      
      <div id="reportContent" class="px-4 py-4 space-y-4 pb-24">
        {/* Loading state */}
        <div class="animate-pulse space-y-4">
          <div class="h-24 bg-gray-100 rounded-xl"></div>
          <div class="h-48 bg-gray-100 rounded-xl"></div>
          <div class="h-32 bg-gray-100 rounded-xl"></div>
          <div class="h-40 bg-gray-100 rounded-xl"></div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div id="bottomActions" class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 hidden">
        <div class="max-w-lg mx-auto flex gap-3">
          <button id="createProposalBtn" class="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-xl transition">
            <i class="fas fa-file-invoice mr-2"></i>제안서 생성
          </button>
          <button id="regenerateBtn" class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition">
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>

      {/* Proposal Modal */}
      <div id="proposalModal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl w-full max-w-md p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4">제안서 생성 완료!</h3>
          <div id="proposalInfo" class="space-y-3">
            <p class="text-gray-600 text-sm">환자에게 공유할 수 있는 치료 제안서가 생성되었습니다.</p>
            <div class="bg-gray-50 rounded-lg p-3">
              <p class="text-xs text-gray-500 mb-1">공유 링크</p>
              <div class="flex items-center gap-2">
                <input id="proposalUrl" type="text" readonly class="flex-1 text-sm bg-white border border-gray-200 rounded px-2 py-1" />
                <button onclick="copyProposalUrl()" class="text-primary-600 text-sm font-medium">복사</button>
              </div>
            </div>
          </div>
          <div class="flex gap-3 mt-6">
            <button onclick="sendViaKakao()" class="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-3 rounded-xl transition">
              <i class="fas fa-comment mr-2"></i>카카오톡
            </button>
            <button onclick="closeProposalModal()" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition">
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
              if (!authRes.ok) {
                window.location.href = '/login';
                return;
              }

              // Try to get existing report
              const reportRes = await fetch('/api/reports/' + consultationId);
              const reportJson = await reportRes.json();

              if (reportJson.success) {
                reportData = reportJson.data;
                renderReport(reportData);
              } else {
                // No report yet - show generate button
                showGeneratePrompt();
              }
            } catch (err) {
              console.error('Failed to load report:', err);
              showError();
            }
          }

          function showGeneratePrompt() {
            document.getElementById('reportContent').innerHTML = \`
              <div class="text-center py-12">
                <div class="w-20 h-20 mx-auto bg-primary-50 rounded-full flex items-center justify-center mb-4">
                  <i class="fas fa-magic text-3xl text-primary-600"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">AI 레포트 생성</h3>
                <p class="text-gray-500 mb-6">녹음된 상담을 AI가 분석하여<br/>상세 레포트를 생성합니다.</p>
                <button onclick="generateReport()" class="bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-xl transition">
                  <i class="fas fa-wand-magic-sparkles mr-2"></i>레포트 생성하기
                </button>
              </div>
            \`;
          }

          async function generateReport() {
            document.getElementById('reportContent').innerHTML = \`
              <div class="text-center py-12">
                <div class="w-20 h-20 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-4">
                  <i class="fas fa-spinner fa-spin text-3xl text-primary-600"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">AI 분석 중...</h3>
                <p class="text-gray-500">상담 내용을 분석하고 있습니다.<br/>약 30초~1분 소요됩니다.</p>
              </div>
            \`;

            try {
              const res = await fetch('/api/reports/' + consultationId + '/generate', {
                method: 'POST'
              });
              const data = await res.json();

              if (data.success) {
                reportData = data.data.report;
                renderReport({ ...data.data.report, id: data.data.report_id });
              } else {
                showError(data.error);
              }
            } catch (err) {
              showError('레포트 생성 중 오류가 발생했습니다.');
            }
          }

          function showError(message = '오류가 발생했습니다.') {
            document.getElementById('reportContent').innerHTML = \`
              <div class="text-center py-12">
                <i class="fas fa-exclamation-circle text-4xl text-red-400 mb-4"></i>
                <p class="text-gray-500">\${message}</p>
                <button onclick="loadReport()" class="mt-4 text-primary-600 font-medium">다시 시도</button>
              </div>
            \`;
          }

          function renderReport(report) {
            const container = document.getElementById('reportContent');
            document.getElementById('bottomActions').classList.remove('hidden');

            const sentimentEmoji = {
              very_positive: '😊',
              positive: '🙂',
              neutral: '😐',
              negative: '😟',
              very_negative: '😔'
            };

            const sentimentText = {
              very_positive: '매우 긍정적',
              positive: '긍정적',
              neutral: '중립',
              negative: '부정적',
              very_negative: '매우 부정적'
            };

            let html = '';

            // Summary Card
            html += \`
              <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <h3 class="font-semibold text-gray-900 mb-3">
                  <i class="fas fa-file-alt text-primary-600 mr-2"></i>상담 요약
                </h3>
                <div class="text-gray-700 text-sm whitespace-pre-line">\${report.consultation_summary || ''}</div>
              </div>
            \`;

            // Treatment Options
            if (report.treatment_options && report.treatment_options.length > 0) {
              html += \`
                <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <h3 class="font-semibold text-gray-900 mb-3">
                    <i class="fas fa-tooth text-primary-600 mr-2"></i>치료 옵션
                  </h3>
                  <div class="space-y-3">
              \`;
              report.treatment_options.forEach(opt => {
                const isRecommended = opt.recommendation_level === 'high';
                html += \`
                  <div class="p-3 rounded-lg \${isRecommended ? 'bg-primary-50 border-2 border-primary-200' : 'bg-gray-50'}">
                    <div class="flex justify-between items-start mb-2">
                      <div>
                        <span class="font-medium \${isRecommended ? 'text-primary-700' : 'text-gray-900'}">\${opt.name}</span>
                        \${isRecommended ? '<span class="ml-2 text-xs bg-primary-600 text-white px-2 py-0.5 rounded-full">추천</span>' : ''}
                      </div>
                      <span class="font-bold text-gray-900">\${(opt.price / 10000).toFixed(0)}만원</span>
                    </div>
                    \${opt.duration ? '<p class="text-xs text-gray-500 mb-2">기간: ' + opt.duration + '</p>' : ''}
                    <div class="text-xs space-y-1">
                      \${opt.pros?.map(p => '<div class="text-green-700">✓ ' + p + '</div>').join('') || ''}
                      \${opt.cons?.map(c => '<div class="text-red-600">✗ ' + c + '</div>').join('') || ''}
                    </div>
                  </div>
                \`;
              });
              html += '</div></div>';

              // Payment Options
              if (report.payment_options?.installment_options?.length > 0) {
                html += \`
                  <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                    <h4 class="font-medium text-gray-900 mb-3">
                      <i class="fas fa-credit-card text-blue-600 mr-2"></i>결제 옵션
                    </h4>
                    <div class="grid grid-cols-3 gap-2">
                \`;
                report.payment_options.installment_options.forEach(inst => {
                  html += \`
                    <div class="bg-white rounded-lg p-2 text-center">
                      <p class="text-xs text-gray-500">\${inst.months}개월</p>
                      <p class="font-bold text-blue-600">\${Math.round(inst.monthly_amount / 10000)}만원</p>
                      <p class="text-xs text-gray-400">/월</p>
                    </div>
                  \`;
                });
                html += '</div></div>';
              }
            }

            // Patient Concerns
            if (report.patient_concerns && report.patient_concerns.length > 0) {
              html += \`
                <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <h3 class="font-semibold text-gray-900 mb-3">
                    <i class="fas fa-heart text-primary-600 mr-2"></i>환자 우려사항
                  </h3>
                  <div class="space-y-2">
              \`;
              report.patient_concerns.forEach(concern => {
                html += \`
                  <div class="flex items-start gap-2 p-2 rounded-lg \${concern.addressed ? 'bg-green-50' : 'bg-yellow-50'}">
                    <i class="fas \${concern.addressed ? 'fa-check-circle text-green-600' : 'fa-exclamation-circle text-yellow-600'} mt-0.5"></i>
                    <div>
                      <p class="text-sm text-gray-800">\${concern.concern}</p>
                      \${concern.resolution ? '<p class="text-xs text-gray-500 mt-1">→ ' + concern.resolution + '</p>' : ''}
                    </div>
                  </div>
                \`;
              });
              html += '</div></div>';
            }

            // Emotion Timeline & Sentiment
            html += \`
              <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <h3 class="font-semibold text-gray-900 mb-3">
                  <i class="fas fa-chart-line text-primary-600 mr-2"></i>감정선 분석
                </h3>
                <div class="flex items-center gap-4 mb-4">
                  <div class="text-4xl">\${sentimentEmoji[report.overall_sentiment] || '😐'}</div>
                  <div>
                    <p class="font-medium text-gray-900">\${sentimentText[report.overall_sentiment] || '중립'}</p>
                    <p class="text-sm text-gray-500">\${report.emotion_summary || ''}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-sm text-gray-500">결정 근접도</span>
                  <div class="flex-1 bg-gray-200 rounded-full h-2">
                    <div class="bg-primary-600 h-2 rounded-full" style="width: \${(report.decision_score || 5) * 10}%"></div>
                  </div>
                  <span class="font-bold text-primary-600">\${report.decision_score || 5}/10</span>
                </div>
                \${report.decision_prediction ? '<p class="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg mt-2">' + report.decision_prediction + '</p>' : ''}
            \`;

            // Emotion Timeline Chart (simple representation)
            if (report.emotion_timeline && report.emotion_timeline.length > 0) {
              html += \`
                <div class="mt-4">
                  <p class="text-xs text-gray-500 mb-2">감정 변화 (시간순)</p>
                  <div class="flex items-end gap-1 h-16">
              \`;
              const maxPoints = Math.min(report.emotion_timeline.length, 20);
              const step = Math.ceil(report.emotion_timeline.length / maxPoints);
              for (let i = 0; i < report.emotion_timeline.length; i += step) {
                const point = report.emotion_timeline[i];
                const height = ((point.score + 1) / 2) * 100;
                const color = point.score > 0.3 ? 'bg-green-400' : point.score < -0.3 ? 'bg-red-400' : 'bg-yellow-400';
                html += \`<div class="flex-1 \${color} rounded-t" style="height: \${Math.max(10, height)}%" title="\${point.note || ''}"></div>\`;
              }
              html += '</div></div>';
            }
            html += '</div>';

            // Coaching Feedback
            if (report.coaching_feedback) {
              const cf = report.coaching_feedback;
              html += \`
                <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                  <h3 class="font-semibold text-gray-900 mb-3">
                    <i class="fas fa-graduation-cap text-purple-600 mr-2"></i>코칭 피드백
                    <span class="ml-2 text-2xl font-bold text-purple-600">\${cf.total_score || 0}점</span>
                  </h3>
                  
                  \${cf.scores ? \`
                    <div class="grid grid-cols-3 gap-2 mb-4">
                      <div class="text-center">
                        <div class="text-lg font-bold text-purple-700">\${cf.scores.rapport || 0}/20</div>
                        <div class="text-xs text-gray-500">라포 형성</div>
                      </div>
                      <div class="text-center">
                        <div class="text-lg font-bold text-purple-700">\${cf.scores.spin || 0}/25</div>
                        <div class="text-xs text-gray-500">SPIN 활용</div>
                      </div>
                      <div class="text-center">
                        <div class="text-lg font-bold text-purple-700">\${cf.scores.objection_handling || 0}/20</div>
                        <div class="text-xs text-gray-500">반론 처리</div>
                      </div>
                      <div class="text-center">
                        <div class="text-lg font-bold text-purple-700">\${cf.scores.pricing_framing || 0}/15</div>
                        <div class="text-xs text-gray-500">가격 프레이밍</div>
                      </div>
                      <div class="text-center">
                        <div class="text-lg font-bold text-purple-700">\${cf.scores.closing || 0}/10</div>
                        <div class="text-xs text-gray-500">클로징</div>
                      </div>
                      <div class="text-center">
                        <div class="text-lg font-bold text-purple-700">\${cf.scores.structure || 0}/10</div>
                        <div class="text-xs text-gray-500">구조</div>
                      </div>
                    </div>
                  \` : ''}

                  \${cf.strengths && cf.strengths.length > 0 ? \`
                    <div class="mb-3">
                      <p class="text-sm font-medium text-green-700 mb-1">💪 강점</p>
                      <ul class="text-sm text-gray-700 space-y-1">
                        \${cf.strengths.map(s => '<li>• ' + s + '</li>').join('')}
                      </ul>
                    </div>
                  \` : ''}

                  \${cf.improvements && cf.improvements.length > 0 ? \`
                    <div>
                      <p class="text-sm font-medium text-yellow-700 mb-1">📈 개선 포인트</p>
                      <div class="space-y-2">
                        \${cf.improvements.map(imp => \`
                          <div class="bg-white rounded-lg p-2 text-sm">
                            <p class="text-gray-800">• \${imp.issue}</p>
                            <p class="text-primary-600 mt-1">💡 \${imp.suggestion}</p>
                            \${imp.example ? '<p class="text-gray-500 italic text-xs mt-1">"' + imp.example + '"</p>' : ''}
                          </div>
                        \`).join('')}
                      </div>
                    </div>
                  \` : ''}

                  \${cf.patient_code_evaluation ? \`
                    <div class="mt-3 p-2 bg-white rounded-lg">
                      <p class="text-xs text-gray-500 mb-1">Patient Code 평가</p>
                      <p class="text-sm text-gray-700">\${cf.patient_code_evaluation}</p>
                    </div>
                  \` : ''}
                </div>
              \`;
            }

            // Next Actions
            if (report.next_actions && report.next_actions.length > 0) {
              html += \`
                <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <h3 class="font-semibold text-gray-900 mb-3">
                    <i class="fas fa-tasks text-primary-600 mr-2"></i>다음 액션
                  </h3>
                  <div class="space-y-2">
              \`;
              report.next_actions.forEach(action => {
                const priorityColor = action.priority === 'high' ? 'border-red-400 bg-red-50' : action.priority === 'medium' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300 bg-gray-50';
                html += \`
                  <div class="flex items-center gap-3 p-2 rounded-lg border-l-4 \${priorityColor}">
                    <div class="flex-1">
                      <p class="text-sm text-gray-800">\${action.action}</p>
                      \${action.due_date ? '<p class="text-xs text-gray-500">' + action.due_date + '까지</p>' : ''}
                    </div>
                  </div>
                \`;
              });
              html += '</div></div>';
            }

            // Followup
            if (report.recommended_followup_date || report.followup_message) {
              html += \`
                <div class="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <h3 class="font-semibold text-gray-900 mb-2">
                    <i class="fas fa-phone text-blue-600 mr-2"></i>추천 팔로업
                  </h3>
                  \${report.recommended_followup_date ? '<p class="text-sm text-blue-700 mb-2"><i class="fas fa-calendar mr-1"></i>' + report.recommended_followup_date + '</p>' : ''}
                  \${report.followup_message ? '<p class="text-sm text-gray-700 bg-white p-2 rounded-lg">"' + report.followup_message + '"</p>' : ''}
                </div>
              \`;
            }

            container.innerHTML = html;
          }

          // Create Proposal
          document.getElementById('createProposalBtn').addEventListener('click', async () => {
            const btn = document.getElementById('createProposalBtn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>생성 중...';

            try {
              const res = await fetch('/api/reports/' + consultationId + '/proposal', {
                method: 'POST'
              });
              const data = await res.json();

              if (data.success) {
                proposalData = data.data;
                document.getElementById('proposalUrl').value = window.location.origin + data.data.public_url;
                document.getElementById('proposalModal').classList.remove('hidden');
              } else {
                alert(data.error || '제안서 생성에 실패했습니다.');
              }
            } catch (err) {
              alert('오류가 발생했습니다.');
            } finally {
              btn.disabled = false;
              btn.innerHTML = '<i class="fas fa-file-invoice mr-2"></i>제안서 생성';
            }
          });

          // Regenerate report
          document.getElementById('regenerateBtn').addEventListener('click', async () => {
            if (!confirm('레포트를 다시 생성하시겠습니까? 기존 수정 내용이 사라집니다.')) return;
            await generateReport();
          });

          function copyProposalUrl() {
            const input = document.getElementById('proposalUrl');
            input.select();
            document.execCommand('copy');
            alert('링크가 복사되었습니다!');
          }

          function sendViaKakao() {
            if (proposalData) {
              // In real app, integrate with Kakao API
              const url = window.location.origin + proposalData.public_url;
              window.open('https://sharer.kakao.com/talk/friends/picker/link?url=' + encodeURIComponent(url), '_blank', 'width=500,height=600');
            }
          }

          function closeProposalModal() {
            document.getElementById('proposalModal').classList.add('hidden');
          }

          loadReport();
        `
      }} />
    </Layout>
  )
}
