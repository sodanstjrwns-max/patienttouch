import { FC } from 'hono/jsx'

interface Props {
  token: string
}

export const ProposalPage: FC<Props> = ({ token }) => {
  return (
    <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#4F46E5" />
        <title>치료 제안서</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.1/css/all.min.css" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              theme: {
                extend: {
                  fontFamily: { sans: ['Pretendard Variable', 'Pretendard', '-apple-system', 'sans-serif'] },
                  colors: {
                    brand: { 50:'#eef2ff', 100:'#e0e7ff', 200:'#c7d2fe', 300:'#a5b4fc', 400:'#818cf8', 500:'#6366f1', 600:'#4f46e5', 700:'#4338ca', 800:'#3730a3', 900:'#312e81' },
                  },
                  animation: { 'slide-up': 'slideUp 0.5s ease-out', 'fade-in': 'fadeIn 0.4s ease-out' },
                  keyframes: {
                    slideUp: { from: { transform: 'translateY(20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
                    fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
                  },
                }
              }
            }
          `
        }} />
        <style dangerouslySetInnerHTML={{
          __html: `
            * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
            body { font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; background: #f8fafc; }
            .gradient-header { background: linear-gradient(135deg, var(--primary-color, #4F46E5) 0%, var(--secondary-color, #818CF8) 100%); }
            .card { background: white; border-radius: 1rem; border: 1px solid rgba(226, 232, 240, 0.8); box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04); }
            .stagger > * { opacity: 0; animation: slideUp 0.5s ease-out forwards; }
            .stagger > *:nth-child(1) { animation-delay: 0.1s; }
            .stagger > *:nth-child(2) { animation-delay: 0.2s; }
            .stagger > *:nth-child(3) { animation-delay: 0.3s; }
            .stagger > *:nth-child(4) { animation-delay: 0.4s; }
            .stagger > *:nth-child(5) { animation-delay: 0.5s; }
            .stagger > *:nth-child(6) { animation-delay: 0.6s; }
            input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 24px; height: 24px; border-radius: 50%; background: #4F46E5; cursor: pointer; box-shadow: 0 2px 8px rgba(79,70,229,0.4); }
            input[type="range"]::-webkit-slider-runnable-track { height: 8px; background: #e2e8f0; border-radius: 4px; }
          `
        }} />
      </head>
      <body class="min-h-screen">
        <div id="proposalContent" class="max-w-md mx-auto">
          <div class="p-4 space-y-4">
            <div class="h-40 bg-gray-200 rounded-2xl animate-pulse"></div>
            <div class="h-32 bg-gray-200 rounded-2xl animate-pulse"></div>
            <div class="h-48 bg-gray-200 rounded-2xl animate-pulse"></div>
          </div>
        </div>

        <script dangerouslySetInnerHTML={{
          __html: `
            var token = '${token}';
            var proposalData = null;
            var selectedInstallment = null;
            var startTime = Date.now();

            async function loadProposal() {
              try {
                var res = await fetch('/api/reports/proposals/view/' + token);
                var data = await res.json();
                if (data.success) {
                  proposalData = data.data;
                  document.documentElement.style.setProperty('--primary-color', data.data.primary_color || '#4F46E5');
                  document.documentElement.style.setProperty('--secondary-color', data.data.secondary_color || '#818CF8');
                  renderProposal(data.data);
                } else { showError('제안서를 찾을 수 없거나 만료되었습니다.'); }
              } catch (err) { showError('제안서를 불러오는데 실패했습니다.'); }
            }

            function showError(message) {
              document.getElementById('proposalContent').innerHTML =
                '<div class="flex flex-col items-center justify-center min-h-screen p-4">' +
                  '<div class="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-4"><i class="fas fa-file-circle-xmark text-3xl text-gray-300"></i></div>' +
                  '<p class="text-gray-500 text-center text-sm">' + message + '</p>' +
                '</div>';
            }

            function renderProposal(p) {
              var container = document.getElementById('proposalContent');
              selectedInstallment = p.default_installment_months || 6;

              var html = '<div class="stagger">';

              // Header
              html += '<div class="gradient-header text-white px-6 py-10 text-center relative overflow-hidden">' +
                '<div class="absolute inset-0 opacity-10"><div class="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white"></div><div class="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white"></div></div>' +
                '<div class="relative z-10">' +
                  (p.hospital_logo_url ? '<img src="' + p.hospital_logo_url + '" alt="' + p.hospital_name + '" class="h-12 mx-auto mb-4 drop-shadow-lg" />' : '') +
                  '<h1 class="text-2xl font-black tracking-tight">' + (p.hospital_name || '병원') + '</h1>' +
                  (p.hospital_slogan ? '<p class="text-white/70 text-sm mt-1">' + p.hospital_slogan + '</p>' : '') +
                '</div>' +
              '</div>';

              // Greeting
              html += '<div class="card mx-4 -mt-6 p-5 relative z-10 shadow-lg">' +
                '<h2 class="text-lg font-bold text-gray-900 mb-2">' + p.title + '</h2>' +
                '<p class="text-gray-600 text-sm leading-relaxed whitespace-pre-line">' + (p.greeting_message || '') + '</p>' +
              '</div>';

              // Treatment Options
              html += '<div class="px-4 py-6 space-y-3">' +
                '<h3 class="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">맞춤 치료 안내</h3>';

              p.selected_options.forEach(function(opt) {
                var isRec = opt.recommended;
                html += '<div class="card p-5 border-2 ' + (isRec ? 'border-brand-400 shadow-lg shadow-brand-200/30' : 'border-transparent') + '">' +
                  '<div class="flex justify-between items-start mb-3">' +
                    '<div class="flex items-center gap-2"><span class="font-bold text-gray-900">' + opt.name + '</span>' +
                    (isRec ? '<span class="text-[10px] font-bold bg-brand-600 text-white px-2 py-0.5 rounded-md">추천</span>' : '') + '</div>' +
                    '<div class="text-right"><span class="text-2xl font-black text-brand-600">' + (opt.price / 10000).toFixed(0) + '</span><span class="text-sm text-gray-400 ml-0.5">만원</span></div>' +
                  '</div>' +
                  (opt.duration ? '<p class="text-xs text-gray-400 mb-3 flex items-center gap-1"><i class="fas fa-clock text-[10px]"></i>' + opt.duration + '</p>' : '') +
                  '<div class="space-y-1.5">' +
                    (opt.benefits ? opt.benefits.map(function(b) { return '<div class="text-sm text-gray-600 flex items-start gap-2"><i class="fas fa-check text-emerald-500 text-xs mt-0.5"></i>' + b + '</div>'; }).join('') : '') +
                  '</div>' +
                '</div>';
              });
              html += '</div>';

              // Installment Calculator
              if (p.installment_options && p.installment_options.length > 0) {
                var defIdx = p.installment_options.findIndex(function(o) { return o.months === selectedInstallment; });
                if (defIdx < 0) defIdx = Math.min(1, p.installment_options.length - 1);
                html += '<div class="bg-gradient-to-br from-brand-50 to-purple-50 px-4 py-6">' +
                  '<h3 class="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-4">분납 시뮬레이션</h3>' +
                  '<div class="card p-6 shadow-lg">' +
                    '<div class="text-center mb-6">' +
                      '<p class="text-gray-400 text-xs font-semibold mb-1">월 납입금액</p>' +
                      '<p class="text-5xl font-black text-brand-600"><span id="monthlyAmount">' + Math.round(p.final_amount / selectedInstallment / 10000) + '</span><span class="text-lg font-bold text-gray-400 ml-1">만원</span></p>' +
                    '</div>' +
                    '<div class="mb-6">' +
                      '<input type="range" id="installmentSlider" min="1" max="' + p.installment_options.length + '" value="' + (defIdx + 1) + '" class="w-full cursor-pointer" />' +
                      '<div class="flex justify-between text-[10px] text-gray-400 font-semibold mt-2">' +
                        p.installment_options.map(function(o) { return '<span>' + o.months + '개월</span>'; }).join('') +
                      '</div>' +
                    '</div>' +
                    '<div class="space-y-2 pt-4 border-t border-gray-100">' +
                      '<div class="flex justify-between text-sm"><span class="text-gray-400">총 금액</span><span class="font-bold text-gray-900">' + (p.final_amount / 10000).toFixed(0) + '만원</span></div>' +
                      (p.discount_amount > 0 ? '<div class="flex justify-between text-sm"><span class="text-emerald-600">할인</span><span class="font-bold text-emerald-600">-' + (p.discount_amount / 10000).toFixed(0) + '만원</span></div>' : '') +
                    '</div>' +
                  '</div>' +
                '</div>';
              }

              // CTA
              html += '<div class="px-4 py-8 space-y-3">';
              if (p.cta_type !== 'call') {
                html += '<a href="' + (p.reservation_url || '#') + '" onclick="trackCta()" class="block w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-xl text-center transition-all active:scale-[0.98] shadow-lg shadow-brand-600/30 text-base">' +
                  '<i class="fas fa-calendar-check mr-2"></i>예약하기</a>';
              }
              if (p.hospital_phone) {
                html += '<a href="tel:' + p.hospital_phone + '" onclick="trackCta()" class="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-4 rounded-xl text-center transition-all active:scale-[0.98] text-base">' +
                  '<i class="fas fa-phone mr-2"></i>전화 상담</a>';
              }
              html += '</div>';

              // Footer
              if (p.footer_message) {
                html += '<div class="pb-8"><p class="text-center text-gray-300 text-xs">' + p.footer_message + '</p></div>';
              }

              html += '</div>';
              container.innerHTML = html;
              setupInstallmentSlider();
            }

            function setupInstallmentSlider() {
              var slider = document.getElementById('installmentSlider');
              if (!slider || !proposalData || !proposalData.installment_options) return;
              slider.addEventListener('input', function(e) {
                var idx = parseInt(e.target.value) - 1;
                var option = proposalData.installment_options[idx];
                if (option) {
                  selectedInstallment = option.months;
                  document.getElementById('monthlyAmount').textContent = Math.round(option.monthly_amount / 10000);
                  trackInteraction('installment_slider', { months: option.months, monthly_amount: option.monthly_amount });
                }
              });
            }

            async function trackInteraction(type, data) {
              try {
                await fetch('/api/reports/proposals/view/' + token + '/interaction', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ type: type, data: Object.assign({}, data, { time_spent: Math.floor((Date.now() - startTime) / 1000) }) })
                });
              } catch(e) {}
            }

            function trackCta() { trackInteraction('cta_click', {}); }

            window.addEventListener('beforeunload', function() {
              var timeSpent = Math.floor((Date.now() - startTime) / 1000);
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
