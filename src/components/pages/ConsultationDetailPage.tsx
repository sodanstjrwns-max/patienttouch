import { FC } from 'hono/jsx'
import { Layout, Header, Badge } from '../shared/Layout'

interface Props {
  id: string
}

export const ConsultationDetailPage: FC<Props> = ({ id }) => {
  return (
    <Layout activeTab="consultations">
      <Header title="상담 노트" subtitle="AI 분석 결과" showBack backUrl="/consultations" rightAction={
        <button id="editBtn" class="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-50 text-brand-600 hover:bg-brand-100 transition-all active:scale-95">
          <i class="fas fa-pen-to-square text-sm"></i>
        </button>
      } />
      
      <div id="consultationDetail" class="px-4 py-4 space-y-3 pb-32">
        {/* Skeleton Loading */}
        <div class="space-y-3 stagger-children">
          <div class="card-premium p-5"><div class="shimmer h-6 rounded-lg w-2/3 mb-3"></div><div class="shimmer h-4 rounded-lg w-full mb-2"></div><div class="shimmer h-4 rounded-lg w-4/5"></div></div>
          <div class="card-premium p-5"><div class="shimmer h-6 rounded-lg w-1/2 mb-3"></div><div class="shimmer h-20 rounded-lg w-full"></div></div>
          <div class="card-premium p-5"><div class="shimmer h-6 rounded-lg w-2/5 mb-3"></div><div class="shimmer h-16 rounded-lg w-full"></div></div>
        </div>
      </div>

      {/* Link Patient Modal */}
      <div id="linkPatientModal" class="hidden fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
        <div class="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg p-6 max-h-[85vh] overflow-y-auto animate-slide-up">
          <div class="flex justify-between items-center mb-5">
            <h3 class="text-lg font-bold text-surface-900">환자 연결</h3>
            <button onclick="closeLinkModal()" class="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-500 transition-all active:scale-95">
              <i class="fas fa-xmark"></i>
            </button>
          </div>

          {/* Tabs */}
          <div class="flex gap-2 mb-5 p-1 bg-surface-100 rounded-xl">
            <button id="tabExisting" class="flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all bg-white text-surface-900 shadow-sm" onclick="showExistingTab()">
              기존 환자
            </button>
            <button id="tabNew" class="flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all text-surface-500 hover:text-surface-700" onclick="showNewTab()">
              새 환자 등록
            </button>
          </div>

          {/* Existing Patient List */}
          <div id="existingPatientArea">
            <div class="relative mb-4">
              <input type="text" id="patientSearch" placeholder="환자 이름 또는 연락처 검색" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 outline-none pl-10 text-sm transition-all" oninput="filterPatients(this.value)" />
              <i class="fas fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 text-sm"></i>
            </div>
            <div id="patientList" class="space-y-2 max-h-60 overflow-y-auto"></div>
          </div>

          {/* New Patient Form */}
          <div id="newPatientArea" class="hidden">
            <form id="linkNewPatientForm" class="space-y-4" onsubmit="return createAndLinkPatient(event)">
              <div>
                <label class="block text-sm font-semibold text-surface-700 mb-1.5">이름 *</label>
                <input type="text" name="name" required class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 outline-none text-sm transition-all" placeholder="환자 이름" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-surface-700 mb-1.5">연락처</label>
                <input type="tel" name="phone" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 outline-none text-sm transition-all" placeholder="010-0000-0000" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-semibold text-surface-700 mb-1.5">나이</label>
                  <input type="number" name="age" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 outline-none text-sm transition-all" placeholder="나이" />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-surface-700 mb-1.5">성별</label>
                  <select name="gender" class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 outline-none text-sm transition-all">
                    <option value="">선택</option>
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                  </select>
                </div>
              </div>
              <button type="submit" class="w-full bg-gradient-brand text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98] shadow-md shadow-brand-600/20">
                환자 등록 후 연결
              </button>
            </form>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          const consultationId = '${id}';
          let currentConsultation = null;
          let allPatients = [];

          async function loadConsultation() {
            try {
              const authRes = await fetch('/api/auth/me');
              if (!authRes.ok) { window.location.href = '/login'; return; }

              const res = await fetch('/api/consultations/' + consultationId);
              const data = await res.json();

              if (data.success) {
                renderConsultation(data.data);
              } else {
                document.getElementById('consultationDetail').innerHTML =
                  '<div class="text-center py-16 animate-fade-in">' +
                    '<div class="w-20 h-20 mx-auto mb-5 rounded-2xl bg-surface-100 flex items-center justify-center"><i class="fas fa-file-circle-xmark text-3xl text-surface-300"></i></div>' +
                    '<h3 class="text-lg font-bold text-surface-800 mb-1">상담 기록을 찾을 수 없습니다</h3>' +
                    '<p class="text-surface-500 text-sm">삭제되었거나 접근 권한이 없습니다</p>' +
                  '</div>';
              }
            } catch (err) { console.error('Failed to load consultation:', err); }
          }

          function renderConsultation(c) {
            currentConsultation = c;
            const container = document.getElementById('consultationDetail');
            const date = new Date(c.consultation_date);
            const dateStr = date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
            const timeStr = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

            const st = {
              paid: { bg:'bg-emerald-50', text:'text-emerald-700', label:'결제완료', ring:'ring-emerald-200/60', dot:'bg-emerald-500' },
              undecided: { bg:'bg-amber-50', text:'text-amber-700', label:'미결정', ring:'ring-amber-200/60', dot:'bg-amber-500' },
              lost: { bg:'bg-rose-50', text:'text-rose-700', label:'이탈', ring:'ring-rose-200/60', dot:'bg-rose-500' },
              pending: { bg:'bg-surface-50', text:'text-surface-600', label:'분석중', ring:'ring-surface-200/60', dot:'bg-surface-400' }
            }[c.status] || { bg:'bg-surface-50', text:'text-surface-600', label:c.status, ring:'ring-surface-200/60', dot:'bg-surface-400' };

            const psychology = c.patient_psychology || {};
            const emotionFlow = c.emotion_flow || {};
            const feedback = c.feedback || {};
            const keyQuotes = c.key_quotes || [];
            const isUnlinked = !c.patient_id;
            let html = '<div class="space-y-3 stagger-children">';

            // Unlinked warning
            if (isUnlinked) {
              html += '<div class="card-premium p-4 border-l-4 border-l-amber-400 bg-gradient-to-r from-amber-50/50 to-transparent">' +
                '<div class="flex items-start gap-3">' +
                  '<div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0"><i class="fas fa-link-slash text-amber-600"></i></div>' +
                  '<div class="flex-1 min-w-0">' +
                    '<p class="font-bold text-surface-900 text-sm">환자 미연결</p>' +
                    '<p class="text-surface-500 text-xs mt-0.5">빠른 녹음 모드로 생성된 상담입니다</p>' +
                    '<button onclick="showLinkModal()" class="mt-2.5 inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 shadow-sm">' +
                      '<i class="fas fa-link text-[10px]"></i>환자 연결' +
                    '</button>' +
                  '</div>' +
                '</div>' +
              '</div>';
            }

            // Patient Info Header
            html += '<div class="card-premium p-5">' +
              '<div class="flex items-start justify-between mb-4">' +
                '<div class="flex items-center gap-3">' +
                  '<div class="w-12 h-12 rounded-xl ' + (isUnlinked ? 'bg-surface-100' : 'bg-brand-50') + ' flex items-center justify-center">' +
                    '<span class="text-lg font-bold ' + (isUnlinked ? 'text-surface-400' : 'text-brand-600') + '">' + (c.patient_name ? c.patient_name.charAt(0) : '?') + '</span>' +
                  '</div>' +
                  '<div>' +
                    '<h2 class="text-lg font-bold text-surface-900">' + (c.patient_name || '환자 미지정') + '</h2>' +
                    '<p class="text-surface-500 text-xs">' + (c.patient_age ? c.patient_age + '세 ' : '') + (c.patient_gender === 'male' ? '남성' : c.patient_gender === 'female' ? '여성' : '') + '</p>' +
                  '</div>' +
                '</div>' +
                '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ring-1 ring-inset ' + st.bg + ' ' + st.text + ' ' + st.ring + '"><span class="w-1.5 h-1.5 rounded-full ' + st.dot + '"></span>' + st.label + '</span>' +
              '</div>' +
              '<div class="grid grid-cols-2 gap-2.5">' +
                '<div class="bg-surface-50 rounded-xl p-3">' +
                  '<p class="text-surface-400 text-[10px] font-semibold mb-1 uppercase tracking-wider">상담일시</p>' +
                  '<p class="font-semibold text-sm text-surface-800">' + dateStr + '</p>' +
                  '<p class="text-surface-500 text-xs">' + timeStr + (c.duration ? ' · ' + c.duration + '분' : '') + '</p>' +
                '</div>' +
                '<div class="bg-surface-50 rounded-xl p-3">' +
                  '<p class="text-surface-400 text-[10px] font-semibold mb-1 uppercase tracking-wider">진료항목</p>' +
                  '<p class="font-semibold text-sm text-surface-800">' + (c.treatment_type || '-') + '</p>' +
                  '<p class="text-surface-500 text-xs">' + (c.treatment_area || '') + '</p>' +
                '</div>' +
              '</div>' +
              (c.amount ? '<div class="mt-2.5 bg-gradient-to-r from-brand-50 to-brand-50/30 rounded-xl p-3 flex items-center justify-between">' +
                '<span class="text-brand-600 text-xs font-semibold">상담 금액</span>' +
                '<span class="text-xl font-black text-brand-700">' + (c.amount / 10000).toFixed(0) + '<span class="text-sm font-semibold text-brand-500 ml-0.5">만원</span></span>' +
              '</div>' : '') +
            '</div>';

            // Report Link
            html += '<a href="/consultations/' + c.id + '/report" class="card-premium p-4 flex items-center gap-3 group">' +
              '<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm shadow-violet-500/20">' +
                '<i class="fas fa-chart-mixed text-white text-sm"></i>' +
              '</div>' +
              '<div class="flex-1 min-w-0">' +
                '<p class="font-bold text-sm text-surface-900">AI 상담 레포트</p>' +
                '<p class="text-xs text-surface-500 mt-0.5">치료옵션·결제안·코칭 피드백 확인</p>' +
              '</div>' +
              '<i class="fas fa-chevron-right text-surface-300 text-xs group-hover:text-brand-500 transition-colors"></i>' +
            '</a>';

            // Summary
            if (c.summary) {
              html += '<div class="card-premium p-5">' +
                '<div class="flex items-center gap-2 mb-3">' +
                  '<div class="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center"><i class="fas fa-file-lines text-xs text-brand-600"></i></div>' +
                  '<h3 class="font-bold text-sm text-surface-900">스크립트 요약</h3>' +
                '</div>' +
                '<div class="text-surface-700 text-sm leading-relaxed whitespace-pre-line">' + c.summary + '</div>' +
                (c.transcript ? '<button onclick="toggleTranscript()" class="mt-3 inline-flex items-center gap-1.5 text-brand-600 text-xs font-semibold hover:text-brand-700 transition-colors">' +
                  '<i class="fas fa-scroll"></i>전체 스크립트 보기' +
                '</button>' +
                '<div id="fullTranscript" class="hidden mt-3 p-3 bg-surface-50 rounded-xl text-xs text-surface-600 max-h-60 overflow-y-auto whitespace-pre-line leading-relaxed">' + c.transcript + '</div>' : '') +
              '</div>';
            }

            // Patient Psychology
            if (psychology.fear || psychology.hesitation_reason || psychology.decision_factor || psychology.decision_maker) {
              html += '<div class="card-premium p-5">' +
                '<div class="flex items-center gap-2 mb-3">' +
                  '<div class="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center"><i class="fas fa-brain text-xs text-rose-600"></i></div>' +
                  '<h3 class="font-bold text-sm text-surface-900">환자 심리 분석</h3>' +
                '</div>' +
                '<div class="space-y-2.5">' +
                  (psychology.fear ? '<div class="flex gap-3 items-start p-2.5 bg-rose-50/50 rounded-xl"><span class="text-base shrink-0">😰</span><div><p class="text-[10px] font-semibold text-rose-500 uppercase tracking-wider mb-0.5">두려움</p><p class="text-sm text-surface-800">' + psychology.fear + '</p></div></div>' : '') +
                  (psychology.hesitation_reason ? '<div class="flex gap-3 items-start p-2.5 bg-amber-50/50 rounded-xl"><span class="text-base shrink-0">🤔</span><div><p class="text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-0.5">미결정 사유</p><p class="text-sm text-surface-800">' + psychology.hesitation_reason + '</p></div></div>' : '') +
                  (psychology.decision_maker ? '<div class="flex gap-3 items-start p-2.5 bg-sky-50/50 rounded-xl"><span class="text-base shrink-0">👥</span><div><p class="text-[10px] font-semibold text-sky-500 uppercase tracking-wider mb-0.5">결정권자</p><p class="text-sm text-surface-800">' + psychology.decision_maker + '</p></div></div>' : '') +
                  (psychology.decision_factor ? '<div class="flex gap-3 items-start p-2.5 bg-emerald-50/50 rounded-xl"><span class="text-base shrink-0">⭐</span><div><p class="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-0.5">결정 요인</p><p class="text-sm text-surface-800">' + psychology.decision_factor + '</p></div></div>' : '') +
                  (psychology.budget ? '<div class="flex gap-3 items-start p-2.5 bg-violet-50/50 rounded-xl"><span class="text-base shrink-0">💰</span><div><p class="text-[10px] font-semibold text-violet-500 uppercase tracking-wider mb-0.5">예산</p><p class="text-sm text-surface-800">' + psychology.budget + '</p></div></div>' : '') +
                '</div>' +
              '</div>';
            }

            // Emotion Flow
            if (emotionFlow.overall_tone || emotionFlow.summary) {
              var toneEmoji = { positive: '😊', neutral: '😐', negative: '😔' };
              var toneName = { positive: '긍정적', neutral: '중립', negative: '부정적' };
              var toneColor = { positive: 'emerald', neutral: 'amber', negative: 'rose' };
              var tc = toneColor[emotionFlow.overall_tone] || 'amber';
              html += '<div class="card-premium p-5">' +
                '<div class="flex items-center gap-2 mb-3">' +
                  '<div class="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center"><i class="fas fa-face-smile text-xs text-purple-600"></i></div>' +
                  '<h3 class="font-bold text-sm text-surface-900">감정 분석</h3>' +
                '</div>' +
                '<div class="flex items-center gap-4 p-3 bg-' + tc + '-50/50 rounded-xl mb-3">' +
                  '<div class="text-4xl">' + (toneEmoji[emotionFlow.overall_tone] || '😐') + '</div>' +
                  '<div>' +
                    '<p class="font-bold text-surface-900">' + (toneName[emotionFlow.overall_tone] || '중립') + '</p>' +
                    '<p class="text-xs text-surface-500">전반적 분위기</p>' +
                  '</div>' +
                '</div>' +
                (emotionFlow.summary ? '<p class="text-sm text-surface-600 leading-relaxed bg-surface-50 p-3 rounded-xl">' + emotionFlow.summary + '</p>' : '') +
                (c.decision_score ? '<div class="mt-3">' +
                  '<div class="flex justify-between text-xs mb-1.5"><span class="font-semibold text-surface-500">결정 근접도</span><span class="font-black text-brand-600">' + c.decision_score + '/10</span></div>' +
                  '<div class="w-full bg-surface-100 rounded-full h-2 overflow-hidden"><div class="bg-gradient-to-r from-brand-500 to-brand-400 h-2 rounded-full transition-all duration-1000" style="width: ' + c.decision_score * 10 + '%"></div></div>' +
                '</div>' : '') +
              '</div>';
            }

            // Key Quotes
            if (keyQuotes.length > 0) {
              html += '<div class="card-premium p-5">' +
                '<div class="flex items-center gap-2 mb-3">' +
                  '<div class="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center"><i class="fas fa-quote-left text-xs text-amber-600"></i></div>' +
                  '<h3 class="font-bold text-sm text-surface-900">핵심 멘트</h3>' +
                '</div>' +
                '<div class="space-y-2">' +
                  keyQuotes.map(function(q) {
                    return '<div class="p-3 bg-amber-50/50 rounded-xl text-sm text-surface-800 border-l-3 border-amber-400 italic">"' + q + '"</div>';
                  }).join('') +
                '</div>' +
              '</div>';
            }

            // Feedback
            if (feedback.good_points || feedback.improve_points || feedback.total_score) {
              var scores = feedback.scores || {};
              html += '<div class="card-premium p-5">' +
                '<div class="flex items-center gap-2 mb-3">' +
                  '<div class="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center"><i class="fas fa-lightbulb text-xs text-emerald-600"></i></div>' +
                  '<h3 class="font-bold text-sm text-surface-900">상담 피드백</h3>' +
                  (feedback.total_score ? '<span class="ml-auto text-xl font-black text-brand-600">' + feedback.total_score + '<span class="text-xs font-semibold text-surface-400">/100</span></span>' : '') +
                '</div>';

              if (feedback.total_score) {
                html += '<div class="grid grid-cols-4 gap-2 mb-4">' +
                  ['니즈파악', '가치전달', '이의처리', '클로징'].map(function(name, i) {
                    var keys = ['needs_identification', 'value_delivery', 'objection_handling', 'closing'];
                    var s = scores[keys[i]] || 0;
                    var colors = ['sky', 'emerald', 'amber', 'rose'];
                    return '<div class="text-center p-2 bg-' + colors[i] + '-50/50 rounded-xl"><p class="text-lg font-black text-surface-800">' + s + '</p><p class="text-[9px] font-semibold text-surface-400 mt-0.5">' + name + '</p></div>';
                  }).join('') +
                '</div>';
              }

              if (feedback.good_points && feedback.good_points.length > 0) {
                html += '<div class="mb-3"><p class="text-xs font-semibold text-emerald-600 mb-2 flex items-center gap-1"><i class="fas fa-check-circle"></i>잘한 점</p>' +
                  '<div class="space-y-1">' +
                    feedback.good_points.map(function(p) { return '<div class="flex items-start gap-2 text-sm text-surface-700"><span class="text-emerald-500 mt-0.5 shrink-0">•</span>' + p + '</div>'; }).join('') +
                  '</div></div>';
              }

              if (feedback.improve_points && feedback.improve_points.length > 0) {
                html += '<div><p class="text-xs font-semibold text-amber-600 mb-2 flex items-center gap-1"><i class="fas fa-arrow-trend-up"></i>개선 포인트</p>' +
                  '<div class="space-y-2">' +
                    feedback.improve_points.map(function(p) {
                      return '<div class="bg-amber-50/50 rounded-xl p-3"><p class="text-sm text-surface-800">• ' + p.issue + '</p>' +
                        (p.suggestion ? '<p class="text-xs text-brand-600 mt-1 ml-3">💡 "' + p.suggestion + '"</p>' : '') + '</div>';
                    }).join('') +
                  '</div></div>';
              }

              html += '</div>';
            }

            // Actions
            html += '<div class="space-y-2 pt-2">';
            if (isUnlinked) {
              html += '<button onclick="showLinkModal()" class="w-full bg-gradient-brand text-white font-semibold py-3.5 px-4 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2">' +
                '<i class="fas fa-link"></i>환자 연결하기</button>';
            } else {
              if (c.status === 'undecided' && c.patient_phone) {
                html += '<a href="tel:' + c.patient_phone + '" class="block w-full bg-gradient-brand text-white font-semibold py-3.5 px-4 rounded-xl text-center transition-all active:scale-[0.98] shadow-lg shadow-brand-600/20">' +
                  '<i class="fas fa-phone mr-2"></i>환자에게 연락하기</a>';
              }
              html += '<a href="/patients/' + c.patient_id + '" class="block w-full bg-surface-100 hover:bg-surface-200 text-surface-800 font-semibold py-3.5 px-4 rounded-xl text-center transition-all active:scale-[0.98]">' +
                '<i class="fas fa-user mr-2"></i>환자 카드 보기</a>';
            }
            html += '</div></div>';

            container.innerHTML = html;
          }

          async function showLinkModal() {
            if (allPatients.length === 0) {
              var res = await fetch('/api/patients?limit=100');
              var data = await res.json();
              if (data.success) allPatients = data.data;
            }
            document.getElementById('linkPatientModal').classList.remove('hidden');
            renderPatientList(allPatients);
          }

          function closeLinkModal() { document.getElementById('linkPatientModal').classList.add('hidden'); }

          function renderPatientList(patients) {
            var container = document.getElementById('patientList');
            if (patients.length === 0) {
              container.innerHTML = '<p class="text-surface-500 text-center py-6 text-sm">검색 결과가 없습니다</p>';
              return;
            }
            var colors = ['bg-brand-100 text-brand-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-sky-100 text-sky-700'];
            container.innerHTML = patients.map(function(p, i) {
              var c = colors[p.name.charCodeAt(0) % colors.length];
              return '<button class="w-full flex items-center gap-3 p-3 bg-surface-50 hover:bg-surface-100 rounded-xl transition-all text-left active:scale-[0.98]" onclick="linkPatient(\\'' + p.id + '\\')">' +
                '<div class="w-10 h-10 rounded-xl ' + c + ' flex items-center justify-center font-bold text-sm shrink-0">' + p.name.charAt(0) + '</div>' +
                '<div class="min-w-0"><p class="font-semibold text-surface-900 text-sm">' + p.name + '</p><p class="text-surface-500 text-xs">' + (p.phone || '연락처 없음') + '</p></div>' +
              '</button>';
            }).join('');
          }

          async function linkPatient(patientId) {
            try {
              var res = await fetch('/api/consultations/' + consultationId + '/link-patient', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patient_id: patientId })
              });
              var data = await res.json();
              if (data.success) { closeLinkModal(); loadConsultation(); }
              else { alert(data.error || '환자 연결에 실패했습니다.'); }
            } catch (err) { alert('오류가 발생했습니다.'); }
          }

          function filterPatients(query) {
            var q = query.toLowerCase();
            var filtered = allPatients.filter(function(p) { return p.name.toLowerCase().includes(q) || (p.phone && p.phone.includes(q)); });
            renderPatientList(filtered);
          }

          function showExistingTab() {
            document.getElementById('tabExisting').className = 'flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all bg-white text-surface-900 shadow-sm';
            document.getElementById('tabNew').className = 'flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all text-surface-500 hover:text-surface-700';
            document.getElementById('existingPatientArea').classList.remove('hidden');
            document.getElementById('newPatientArea').classList.add('hidden');
          }

          function showNewTab() {
            document.getElementById('tabNew').className = 'flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all bg-white text-surface-900 shadow-sm';
            document.getElementById('tabExisting').className = 'flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all text-surface-500 hover:text-surface-700';
            document.getElementById('newPatientArea').classList.remove('hidden');
            document.getElementById('existingPatientArea').classList.add('hidden');
          }

          async function createAndLinkPatient(e) {
            e.preventDefault();
            var form = e.target;
            var formData = new FormData(form);
            try {
              var patientRes = await fetch('/api/patients', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: formData.get('name'), phone: formData.get('phone') || undefined, age: formData.get('age') ? parseInt(formData.get('age')) : undefined, gender: formData.get('gender') || undefined })
              });
              var patientData = await patientRes.json();
              if (!patientData.success) { alert(patientData.error || '환자 등록에 실패했습니다.'); return false; }
              await linkPatient(patientData.data.id);
            } catch (err) { alert('오류가 발생했습니다.'); }
            return false;
          }

          function toggleTranscript() { document.getElementById('fullTranscript').classList.toggle('hidden'); }

          loadConsultation();
        `
      }} />
    </Layout>
  )
}
