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

      {/* Link Patient Modal */}
      <div id="linkPatientModal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-gray-900">환자 연결</h3>
            <button onclick="closeLinkModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>

          {/* Tabs */}
          <div class="flex gap-2 mb-4">
            <button id="tabExisting" class="flex-1 py-2 px-4 rounded-lg font-medium transition bg-primary-600 text-white" onclick="showExistingTab()">
              기존 환자
            </button>
            <button id="tabNew" class="flex-1 py-2 px-4 rounded-lg font-medium transition bg-gray-100 text-gray-700 hover:bg-gray-200" onclick="showNewTab()">
              새 환자 등록
            </button>
          </div>

          {/* Existing Patient List */}
          <div id="existingPatientArea">
            <div class="relative mb-4">
              <input type="text" id="patientSearch" placeholder="환자 이름 또는 연락처 검색" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none pl-10" oninput="filterPatients(this.value)" />
              <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            </div>
            <div id="patientList" class="space-y-2 max-h-60 overflow-y-auto">
              {/* Patient list will be loaded here */}
            </div>
          </div>

          {/* New Patient Form */}
          <div id="newPatientArea" class="hidden">
            <form id="linkNewPatientForm" class="space-y-4" onsubmit="return createAndLinkPatient(event)">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                <input type="text" name="name" required class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="환자 이름" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                <input type="tel" name="phone" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="010-0000-0000" />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">나이</label>
                  <input type="number" name="age" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="나이" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">성별</label>
                  <select name="gender" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value="">선택</option>
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                  </select>
                </div>
              </div>
              <button type="submit" class="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 rounded-lg transition">
                환자 등록 후 연결
              </button>
            </form>
          </div>
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

          let currentConsultation = null;
          let allPatients = [];

          function renderConsultation(c) {
            currentConsultation = c;
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

            // Check if patient is linked
            const isUnlinked = !c.patient_id;

            let html = '';

            // Show unlinked warning banner if no patient
            if (isUnlinked) {
              html += \`
                <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                  <div class="flex items-start gap-3">
                    <i class="fas fa-exclamation-triangle text-yellow-600 mt-1"></i>
                    <div class="flex-1">
                      <p class="text-yellow-800 font-medium">환자가 연결되지 않았습니다</p>
                      <p class="text-yellow-700 text-sm mt-1">빠른 녹음 모드로 녹음된 상담입니다. 환자를 연결해주세요.</p>
                      <button onclick="showLinkModal()" class="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                        <i class="fas fa-link mr-1"></i>환자 연결하기
                      </button>
                    </div>
                  </div>
                </div>
              \`;
            }

            html += \`
              <!-- Patient Info -->
              <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div class="flex items-start justify-between mb-3">
                  <div>
                    <h2 class="text-xl font-bold text-gray-900">\${c.patient_name || '환자 미지정'}</h2>
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
                \${isUnlinked ? \`
                  <button onclick="showLinkModal()" class="block w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-xl text-center transition">
                    <i class="fas fa-link mr-2"></i>환자 연결하기
                  </button>
                \` : \`
                  \${c.status === 'undecided' && c.patient_phone ? \`
                    <a href="tel:\${c.patient_phone}" class="block w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-xl text-center transition">
                      <i class="fas fa-phone mr-2"></i>환자에게 연락하기
                    </a>
                  \` : ''}
                  <a href="/patients/\${c.patient_id}" class="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-xl text-center transition">
                    <i class="fas fa-user mr-2"></i>환자 카드 보기
                  </a>
                \`}
              </div>
            \`;

            container.innerHTML = html;
          }

          // Link patient modal functions
          async function showLinkModal() {
            // Load patients if not loaded
            if (allPatients.length === 0) {
              const res = await fetch('/api/patients?limit=100');
              const data = await res.json();
              if (data.success) {
                allPatients = data.data;
              }
            }
            document.getElementById('linkPatientModal').classList.remove('hidden');
            renderPatientList(allPatients);
          }

          function closeLinkModal() {
            document.getElementById('linkPatientModal').classList.add('hidden');
          }

          function renderPatientList(patients) {
            const container = document.getElementById('patientList');
            if (patients.length === 0) {
              container.innerHTML = '<p class="text-gray-500 text-center py-4">검색 결과가 없습니다</p>';
              return;
            }
            container.innerHTML = patients.map(p => \`
              <button class="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-left" onclick="linkPatient('\${p.id}')">
                <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <i class="fas fa-user text-gray-400"></i>
                </div>
                <div>
                  <p class="text-gray-900 font-medium">\${p.name}</p>
                  <p class="text-gray-500 text-sm">\${p.phone || '연락처 없음'}</p>
                </div>
              </button>
            \`).join('');
          }

          async function linkPatient(patientId) {
            try {
              const res = await fetch('/api/consultations/' + consultationId + '/link-patient', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patient_id: patientId })
              });
              
              const data = await res.json();
              if (data.success) {
                closeLinkModal();
                loadConsultation(); // Refresh the page
              } else {
                alert(data.error || '환자 연결에 실패했습니다.');
              }
            } catch (err) {
              alert('오류가 발생했습니다.');
            }
          }

          function filterPatients(query) {
            const q = query.toLowerCase();
            const filtered = allPatients.filter(p => 
              p.name.toLowerCase().includes(q) || 
              (p.phone && p.phone.includes(q))
            );
            renderPatientList(filtered);
          }

          function showExistingTab() {
            document.getElementById('tabExisting').classList.remove('bg-gray-100', 'text-gray-700');
            document.getElementById('tabExisting').classList.add('bg-primary-600', 'text-white');
            document.getElementById('tabNew').classList.remove('bg-primary-600', 'text-white');
            document.getElementById('tabNew').classList.add('bg-gray-100', 'text-gray-700');
            document.getElementById('existingPatientArea').classList.remove('hidden');
            document.getElementById('newPatientArea').classList.add('hidden');
          }

          function showNewTab() {
            document.getElementById('tabNew').classList.remove('bg-gray-100', 'text-gray-700');
            document.getElementById('tabNew').classList.add('bg-primary-600', 'text-white');
            document.getElementById('tabExisting').classList.remove('bg-primary-600', 'text-white');
            document.getElementById('tabExisting').classList.add('bg-gray-100', 'text-gray-700');
            document.getElementById('newPatientArea').classList.remove('hidden');
            document.getElementById('existingPatientArea').classList.add('hidden');
          }

          async function createAndLinkPatient(e) {
            e.preventDefault();
            const form = e.target;
            const formData = new FormData(form);
            
            try {
              // Create patient
              const patientRes = await fetch('/api/patients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: formData.get('name'),
                  phone: formData.get('phone') || undefined,
                  age: formData.get('age') ? parseInt(formData.get('age')) : undefined,
                  gender: formData.get('gender') || undefined
                })
              });
              
              const patientData = await patientRes.json();
              if (!patientData.success) {
                alert(patientData.error || '환자 등록에 실패했습니다.');
                return false;
              }
              
              // Link to consultation
              await linkPatient(patientData.data.id);
            } catch (err) {
              alert('오류가 발생했습니다.');
            }
            return false;
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
