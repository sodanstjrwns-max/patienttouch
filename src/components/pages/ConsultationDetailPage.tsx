import { FC } from 'hono/jsx'
import { Layout, Header, Card, Badge } from '../shared/Layout'

interface Props {
  id: string
}

export const ConsultationDetailPage: FC<Props> = ({ id }) => {
  return (
    <Layout activeTab="consultations">
      <Header title="상담 노트" showBack backUrl="/consultations" rightAction={
        <button id="editBtn" class="text-primary-600 font-medium text-sm">
          <i class="fas fa-edit mr-1"></i>수정
        </button>
      } />
      
      <div id="consultationDetail" class="px-4 py-4 space-y-4">
        <div class="animate-pulse space-y-4">
          <div class="h-32 bg-gray-100 rounded-xl"></div>
          <div class="h-48 bg-gray-100 rounded-xl"></div>
          <div class="h-32 bg-gray-100 rounded-xl"></div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          const consultationId = '${id}';

          async function loadConsultation() {
            try {
              const authRes = await fetch('/api/auth/me');
              if (!authRes.ok) {
                window.location.href = '/login';
                return;
              }

              const res = await fetch('/api/consultations/' + consultationId);
              const data = await res.json();

              if (data.success) {
                renderConsultation(data.data);
              } else {
                document.getElementById('consultationDetail').innerHTML = \`
                  <div class="text-center py-12">
                    <i class="fas fa-exclamation-circle text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">상담 기록을 찾을 수 없습니다</p>
                  </div>
                \`;
              }
            } catch (err) {
              console.error('Failed to load consultation:', err);
            }
          }

          function renderConsultation(c) {
            const container = document.getElementById('consultationDetail');
            const date = new Date(c.consultation_date);
            const dateStr = date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
            const timeStr = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

            const statusColors = {
              paid: 'bg-green-100 text-green-800',
              undecided: 'bg-yellow-100 text-yellow-800',
              lost: 'bg-red-100 text-red-800',
              pending: 'bg-gray-100 text-gray-800'
            };
            const statusText = { paid: '결제완료', undecided: '미결정', lost: '이탈', pending: '분석중' };

            const psychology = c.patient_psychology || {};
            const emotionFlow = c.emotion_flow || {};
            const feedback = c.feedback || {};
            const keyQuotes = c.key_quotes || [];

            let html = \`
              <!-- Patient Info -->
              <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div class="flex items-start justify-between mb-3">
                  <div>
                    <h2 class="text-xl font-bold text-gray-900">\${c.patient_name}</h2>
                    <p class="text-gray-500 text-sm">\${c.patient_age ? c.patient_age + '세 ' : ''}\${c.patient_gender === 'male' ? '남성' : c.patient_gender === 'female' ? '여성' : ''}</p>
                  </div>
                  <span class="px-3 py-1 rounded-full text-sm font-medium \${statusColors[c.status]}">\${statusText[c.status]}</span>
                </div>
                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div class="bg-gray-50 rounded-lg p-3">
                    <p class="text-gray-500 text-xs mb-1">상담일시</p>
                    <p class="font-medium">\${dateStr} \${timeStr}</p>
                    \${c.duration ? '<p class="text-gray-500">(' + c.duration + '분)</p>' : ''}
                  </div>
                  <div class="bg-gray-50 rounded-lg p-3">
                    <p class="text-gray-500 text-xs mb-1">진료항목</p>
                    <p class="font-medium">\${c.treatment_type || '-'}</p>
                    <p class="text-gray-500">\${c.treatment_area || ''}</p>
                  </div>
                  \${c.amount ? \`
                    <div class="bg-primary-50 rounded-lg p-3 col-span-2">
                      <p class="text-primary-600 text-xs mb-1">상담금액</p>
                      <p class="font-bold text-primary-700 text-lg">\${(c.amount / 10000).toFixed(0)}만원</p>
                    </div>
                  \` : ''}
                </div>
              </div>
            \`;

            // Summary
            if (c.summary) {
              html += \`
                <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <h3 class="font-semibold text-gray-900 mb-3">
                    <i class="fas fa-file-alt text-primary-600 mr-2"></i>스크립트 요약
                  </h3>
                  <div class="text-gray-700 text-sm whitespace-pre-line">\${c.summary}</div>
                  \${c.transcript ? \`
                    <button onclick="toggleTranscript()" class="mt-3 text-primary-600 text-sm font-medium">
                      <i class="fas fa-scroll mr-1"></i>전체 스크립트 보기
                    </button>
                    <div id="fullTranscript" class="hidden mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 max-h-60 overflow-y-auto whitespace-pre-line">\${c.transcript}</div>
                  \` : ''}
                </div>
              \`;
            }

            // Patient Psychology
            if (psychology.fear || psychology.hesitation_reason || psychology.decision_factor || psychology.decision_maker) {
              html += \`
                <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <h3 class="font-semibold text-gray-900 mb-3">
                    <i class="fas fa-brain text-primary-600 mr-2"></i>환자 심리
                  </h3>
                  <div class="space-y-2 text-sm">
                    \${psychology.fear ? '<div class="flex gap-2"><span class="text-gray-500 w-20">😰 두려움</span><span class="text-gray-900">' + psychology.fear + '</span></div>' : ''}
                    \${psychology.hesitation_reason ? '<div class="flex gap-2"><span class="text-gray-500 w-20">🤔 미결정</span><span class="text-gray-900">' + psychology.hesitation_reason + '</span></div>' : ''}
                    \${psychology.decision_maker ? '<div class="flex gap-2"><span class="text-gray-500 w-20">👨‍👩‍👦 결정권자</span><span class="text-gray-900">' + psychology.decision_maker + '</span></div>' : ''}
                    \${psychology.decision_factor ? '<div class="flex gap-2"><span class="text-gray-500 w-20">⭐ 결정요인</span><span class="text-gray-900">' + psychology.decision_factor + '</span></div>' : ''}
                    \${psychology.budget ? '<div class="flex gap-2"><span class="text-gray-500 w-20">💰 예산</span><span class="text-gray-900">' + psychology.budget + '</span></div>' : ''}
                  </div>
                </div>
              \`;
            }

            // Emotion Flow
            if (emotionFlow.overall_tone || emotionFlow.summary) {
              const toneEmoji = { positive: '😊', neutral: '😐', negative: '😔' };
              html += \`
                <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <h3 class="font-semibold text-gray-900 mb-3">
                    <i class="fas fa-theater-masks text-primary-600 mr-2"></i>감정선
                  </h3>
                  <div class="flex items-center gap-4 mb-3">
                    <div class="text-3xl">\${toneEmoji[emotionFlow.overall_tone] || '😐'}</div>
                    <div>
                      <p class="text-sm text-gray-500">전반적 분위기</p>
                      <p class="font-medium">\${emotionFlow.overall_tone === 'positive' ? '긍정적' : emotionFlow.overall_tone === 'negative' ? '부정적' : '중립'}</p>
                    </div>
                  </div>
                  \${emotionFlow.summary ? '<p class="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">' + emotionFlow.summary + '</p>' : ''}
                  \${c.decision_score ? \`
                    <div class="mt-3">
                      <div class="flex justify-between text-sm mb-1">
                        <span class="text-gray-500">결정 근접도</span>
                        <span class="font-medium text-primary-600">\${c.decision_score}/10</span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-primary-600 h-2 rounded-full" style="width: \${c.decision_score * 10}%"></div>
                      </div>
                    </div>
                  \` : ''}
                </div>
              \`;
            }

            // Key Quotes
            if (keyQuotes.length > 0) {
              html += \`
                <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <h3 class="font-semibold text-gray-900 mb-3">
                    <i class="fas fa-quote-left text-primary-600 mr-2"></i>핵심 멘트
                  </h3>
                  <div class="space-y-2">
                    \${keyQuotes.map(q => '<div class="p-3 bg-yellow-50 rounded-lg text-sm text-gray-800 border-l-4 border-yellow-400">"' + q + '"</div>').join('')}
                  </div>
                </div>
              \`;
            }

            // Feedback
            if (feedback.good_points || feedback.improve_points || feedback.total_score) {
              const scores = feedback.scores || {};
              html += \`
                <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <h3 class="font-semibold text-gray-900 mb-3">
                    <i class="fas fa-lightbulb text-primary-600 mr-2"></i>상담 피드백
                  </h3>
                  
                  \${feedback.good_points && feedback.good_points.length > 0 ? \`
                    <div class="mb-4">
                      <p class="text-green-700 text-sm font-medium mb-2">✅ 잘한 점</p>
                      <ul class="text-sm text-gray-700 space-y-1">
                        \${feedback.good_points.map(p => '<li class="flex items-start gap-2"><span class="text-green-500">•</span>' + p + '</li>').join('')}
                      </ul>
                    </div>
                  \` : ''}
                  
                  \${feedback.improve_points && feedback.improve_points.length > 0 ? \`
                    <div class="mb-4">
                      <p class="text-yellow-700 text-sm font-medium mb-2">⚠️ 개선 포인트</p>
                      <div class="space-y-2">
                        \${feedback.improve_points.map(p => \`
                          <div class="text-sm">
                            <p class="text-gray-700">• \${p.issue}</p>
                            \${p.suggestion ? '<p class="text-primary-600 ml-4 mt-1">💡 "' + p.suggestion + '"</p>' : ''}
                          </div>
                        \`).join('')}
                      </div>
                    </div>
                  \` : ''}
                  
                  \${feedback.total_score ? \`
                    <div class="bg-gray-50 rounded-lg p-4">
                      <div class="flex items-center justify-between mb-3">
                        <span class="font-medium">상담 점수</span>
                        <span class="text-2xl font-bold text-primary-600">\${feedback.total_score}<span class="text-sm text-gray-500">/100</span></span>
                      </div>
                      <div class="grid grid-cols-2 gap-2 text-xs">
                        <div class="flex justify-between"><span class="text-gray-500">니즈 파악</span><span>\${scores.needs_identification || '-'}점</span></div>
                        <div class="flex justify-between"><span class="text-gray-500">가치 전달</span><span>\${scores.value_delivery || '-'}점</span></div>
                        <div class="flex justify-between"><span class="text-gray-500">이의 처리</span><span>\${scores.objection_handling || '-'}점</span></div>
                        <div class="flex justify-between"><span class="text-gray-500">클로징</span><span>\${scores.closing || '-'}점</span></div>
                      </div>
                    </div>
                  \` : ''}
                </div>
              \`;
            }

            // Actions
            html += \`
              <div class="space-y-3">
                \${c.status === 'undecided' ? \`
                  <a href="tel:\${c.patient_phone}" class="block w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-xl text-center transition">
                    <i class="fas fa-phone mr-2"></i>환자에게 연락하기
                  </a>
                \` : ''}
                <a href="/patients/\${c.patient_id}" class="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-xl text-center transition">
                  <i class="fas fa-user mr-2"></i>환자 카드 보기
                </a>
              </div>
            \`;

            container.innerHTML = html;
          }

          function toggleTranscript() {
            const el = document.getElementById('fullTranscript');
            el.classList.toggle('hidden');
          }

          loadConsultation();
        `
      }} />
    </Layout>
  )
}
