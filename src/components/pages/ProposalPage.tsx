import { FC } from 'hono/jsx'

interface Props {
  token: string
}

export const ProposalPage: FC<Props> = ({ token }) => {
  return (
    <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>치료 제안서</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{
          __html: `
            body { font-family: 'Pretendard', sans-serif; }
            .gradient-header { background: linear-gradient(135deg, var(--primary-color, #4F46E5) 0%, var(--secondary-color, #818CF8) 100%); }
          `
        }} />
      </head>
      <body class="bg-gray-50 min-h-screen">
        <div id="proposalContent" class="max-w-md mx-auto">
          {/* Loading */}
          <div class="animate-pulse p-4 space-y-4">
            <div class="h-32 bg-gray-200 rounded-xl"></div>
            <div class="h-48 bg-gray-200 rounded-xl"></div>
            <div class="h-32 bg-gray-200 rounded-xl"></div>
          </div>
        </div>

        <script dangerouslySetInnerHTML={{
          __html: `
            const token = '${token}';
            let proposalData = null;
            let selectedInstallment = null;
            let startTime = Date.now();

            async function loadProposal() {
              try {
                const res = await fetch('/api/reports/proposals/view/' + token);
                const data = await res.json();

                if (data.success) {
                  proposalData = data.data;
                  document.documentElement.style.setProperty('--primary-color', data.data.primary_color || '#4F46E5');
                  document.documentElement.style.setProperty('--secondary-color', data.data.secondary_color || '#818CF8');
                  renderProposal(data.data);
                } else {
                  showError('제안서를 찾을 수 없거나 만료되었습니다.');
                }
              } catch (err) {
                showError('제안서를 불러오는데 실패했습니다.');
              }
            }

            function showError(message) {
              document.getElementById('proposalContent').innerHTML = \`
                <div class="flex flex-col items-center justify-center min-h-screen p-4">
                  <i class="fas fa-exclamation-circle text-5xl text-gray-300 mb-4"></i>
                  <p class="text-gray-500 text-center">\${message}</p>
                </div>
              \`;
            }

            function renderProposal(p) {
              const container = document.getElementById('proposalContent');
              selectedInstallment = p.default_installment_months || 6;

              let html = \`
                <!-- Header -->
                <div class="gradient-header text-white px-4 py-8 text-center">
                  \${p.hospital_logo_url ? \`<img src="\${p.hospital_logo_url}" alt="\${p.hospital_name}" class="h-12 mx-auto mb-4" />\` : ''}
                  <h1 class="text-xl font-bold">\${p.hospital_name || '병원'}</h1>
                  \${p.hospital_slogan ? \`<p class="text-white/80 text-sm mt-1">\${p.hospital_slogan}</p>\` : ''}
                </div>

                <!-- Greeting -->
                <div class="bg-white mx-4 -mt-4 rounded-xl shadow-lg p-5 relative z-10">
                  <h2 class="text-lg font-bold text-gray-900 mb-2">\${p.title}</h2>
                  <p class="text-gray-600 text-sm whitespace-pre-line">\${p.greeting_message || ''}</p>
                </div>

                <!-- Treatment Options -->
                <div class="px-4 py-6">
                  <h3 class="text-sm font-semibold text-gray-500 mb-3">맞춤 치료 안내</h3>
                  <div class="space-y-3">
              \`;

              p.selected_options.forEach(opt => {
                const isRecommended = opt.recommended;
                html += \`
                  <div class="bg-white rounded-xl shadow-sm p-4 border-2 \${isRecommended ? 'border-indigo-500' : 'border-transparent'}">
                    <div class="flex justify-between items-start mb-3">
                      <div>
                        <span class="font-semibold text-gray-900">\${opt.name}</span>
                        \${isRecommended ? '<span class="ml-2 text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full">추천</span>' : ''}
                      </div>
                      <div class="text-right">
                        <span class="text-xl font-bold text-indigo-600">\${(opt.price / 10000).toFixed(0)}</span>
                        <span class="text-sm text-gray-500">만원</span>
                      </div>
                    </div>
                    \${opt.duration ? '<p class="text-xs text-gray-500 mb-2"><i class="fas fa-clock mr-1"></i>' + opt.duration + '</p>' : ''}
                    <div class="space-y-1">
                      \${opt.benefits.map(b => '<div class="text-sm text-gray-600"><i class="fas fa-check text-green-500 mr-2"></i>' + b + '</div>').join('')}
                    </div>
                  </div>
                \`;
              });

              html += '</div></div>';

              // Installment Calculator
              if (p.installment_options && p.installment_options.length > 0) {
                html += \`
                  <div class="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-6">
                    <h3 class="text-sm font-semibold text-gray-500 mb-4">분납 시뮬레이션</h3>
                    <div class="bg-white rounded-xl p-5 shadow-sm">
                      <div class="text-center mb-6">
                        <p class="text-gray-500 text-sm mb-1">월 납입금액</p>
                        <p class="text-4xl font-bold text-indigo-600">
                          <span id="monthlyAmount">\${Math.round(p.final_amount / selectedInstallment / 10000)}</span>
                          <span class="text-lg">만원</span>
                        </p>
                      </div>
                      
                      <div class="mb-4">
                        <input type="range" 
                               id="installmentSlider" 
                               min="1" 
                               max="\${p.installment_options.length}" 
                               value="\${p.installment_options.findIndex(o => o.months === selectedInstallment) + 1 || 2}"
                               class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                               style="accent-color: #4F46E5;" />
                        <div class="flex justify-between text-xs text-gray-400 mt-1">
                          \${p.installment_options.map(o => '<span>' + o.months + '개월</span>').join('')}
                        </div>
                      </div>
                      
                      <div class="flex justify-between text-sm">
                        <span class="text-gray-500">총 금액</span>
                        <span class="font-semibold">\${(p.final_amount / 10000).toFixed(0)}만원</span>
                      </div>
                      \${p.discount_amount > 0 ? \`
                        <div class="flex justify-between text-sm text-green-600">
                          <span>할인</span>
                          <span>-\${(p.discount_amount / 10000).toFixed(0)}만원</span>
                        </div>
                      \` : ''}
                    </div>
                  </div>
                \`;
              }

              // CTA Section
              html += \`
                <div class="px-4 py-6 bg-white border-t border-gray-100">
                  <div class="space-y-3">
                    \${p.cta_type !== 'call' ? \`
                      <a href="\${p.reservation_url || '#'}" onclick="trackCta()" 
                         class="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-4 rounded-xl text-center transition">
                        <i class="fas fa-calendar-check mr-2"></i>예약하기
                      </a>
                    \` : ''}
                    \${p.hospital_phone ? \`
                      <a href="tel:\${p.hospital_phone}" onclick="trackCta()"
                         class="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-4 px-4 rounded-xl text-center transition">
                        <i class="fas fa-phone mr-2"></i>전화 상담
                      </a>
                    \` : ''}
                  </div>
                  \${p.footer_message ? '<p class="text-center text-gray-400 text-xs mt-4">' + p.footer_message + '</p>' : ''}
                </div>
              \`;

              container.innerHTML = html;

              // Setup installment slider
              setupInstallmentSlider();
            }

            function setupInstallmentSlider() {
              const slider = document.getElementById('installmentSlider');
              if (!slider || !proposalData?.installment_options) return;

              slider.addEventListener('input', (e) => {
                const idx = parseInt(e.target.value) - 1;
                const option = proposalData.installment_options[idx];
                if (option) {
                  selectedInstallment = option.months;
                  document.getElementById('monthlyAmount').textContent = Math.round(option.monthly_amount / 10000);
                  
                  // Track interaction
                  trackInteraction('installment_slider', {
                    months: option.months,
                    monthly_amount: option.monthly_amount
                  });
                }
              });
            }

            async function trackInteraction(type, data) {
              try {
                await fetch('/api/reports/proposals/view/' + token + '/interaction', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    type, 
                    data: { 
                      ...data, 
                      time_spent: Math.floor((Date.now() - startTime) / 1000) 
                    } 
                  })
                });
              } catch {}
            }

            function trackCta() {
              trackInteraction('cta_click', {});
            }

            // Track page exit
            window.addEventListener('beforeunload', () => {
              const timeSpent = Math.floor((Date.now() - startTime) / 1000);
              navigator.sendBeacon('/api/reports/proposals/view/' + token + '/interaction', 
                JSON.stringify({ type: 'page_exit', data: { time_spent: timeSpent } }));
            });

            loadProposal();
          `
        }} />
      </body>
    </html>
  )
}
