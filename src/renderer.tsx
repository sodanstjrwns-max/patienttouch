import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children, title }) => {
  return (
    <html lang="ko" class="dark-support">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#0F172A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="description" content="Patient Touch - AI 기반 치과 상담 CRM의 미래" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <title>{title || '페이션트 터치'}</title>
        
        {/* Tailwind CSS */}
        <script src="https://cdn.tailwindcss.com"></script>
        
        {/* Font Awesome 6 Pro */}
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.1/css/all.min.css" rel="stylesheet" />
        
        {/* Pretendard Variable */}
        <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" rel="stylesheet" />
        
        {/* Chart.js */}
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        
        {/* Tailwind Config - Premium Design System */}
        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              darkMode: 'class',
              theme: {
                extend: {
                  fontFamily: {
                    sans: ['Pretendard Variable', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
                  },
                  colors: {
                    brand: {
                      50: '#eef2ff',
                      100: '#e0e7ff',
                      200: '#c7d2fe',
                      300: '#a5b4fc',
                      400: '#818cf8',
                      500: '#6366f1',
                      600: '#4f46e5',
                      700: '#4338ca',
                      800: '#3730a3',
                      900: '#312e81',
                      950: '#1e1b4b',
                    },
                    surface: {
                      50: '#f8fafc',
                      100: '#f1f5f9',
                      200: '#e2e8f0',
                      300: '#cbd5e1',
                      400: '#94a3b8',
                      500: '#64748b',
                      600: '#475569',
                      700: '#334155',
                      800: '#1e293b',
                      900: '#0f172a',
                      950: '#020617',
                    }
                  },
                  borderRadius: {
                    '2xl': '1rem',
                    '3xl': '1.5rem',
                    '4xl': '2rem',
                  },
                  boxShadow: {
                    'glow': '0 0 20px rgba(99, 102, 241, 0.15)',
                    'glow-lg': '0 0 40px rgba(99, 102, 241, 0.2)',
                    'card': '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)',
                    'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 16px 40px rgba(0,0,0,0.1)',
                    'float': '0 20px 60px rgba(0,0,0,0.12)',
                    'inner-glow': 'inset 0 1px 0 0 rgba(255,255,255,0.1)',
                  },
                  animation: {
                    'float': 'float 6s ease-in-out infinite',
                    'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
                    'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                    'slide-down': 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    'fade-in': 'fadeIn 0.4s ease-out',
                    'shimmer': 'shimmer 2s linear infinite',
                    'glow-pulse': 'glowPulse 2s ease-in-out infinite',
                    'counter': 'counter 1.5s ease-out forwards',
                    'wave': 'wave 1.5s ease-in-out infinite',
                    'bounce-in': 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                    'gradient-shift': 'gradientShift 8s ease infinite',
                  },
                  keyframes: {
                    float: {
                      '0%, 100%': { transform: 'translateY(0px)' },
                      '50%': { transform: 'translateY(-10px)' },
                    },
                    pulseSoft: {
                      '0%, 100%': { opacity: '1' },
                      '50%': { opacity: '0.6' },
                    },
                    slideUp: {
                      from: { transform: 'translateY(30px)', opacity: '0' },
                      to: { transform: 'translateY(0)', opacity: '1' },
                    },
                    slideDown: {
                      from: { transform: 'translateY(-10px)', opacity: '0' },
                      to: { transform: 'translateY(0)', opacity: '1' },
                    },
                    scaleIn: {
                      from: { transform: 'scale(0.95)', opacity: '0' },
                      to: { transform: 'scale(1)', opacity: '1' },
                    },
                    fadeIn: {
                      from: { opacity: '0' },
                      to: { opacity: '1' },
                    },
                    shimmer: {
                      '0%': { backgroundPosition: '-200% 0' },
                      '100%': { backgroundPosition: '200% 0' },
                    },
                    glowPulse: {
                      '0%, 100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' },
                      '50%': { boxShadow: '0 0 40px rgba(99, 102, 241, 0.6)' },
                    },
                    wave: {
                      '0%': { transform: 'scaleY(1)' },
                      '50%': { transform: 'scaleY(0.4)' },
                      '100%': { transform: 'scaleY(1)' },
                    },
                    bounceIn: {
                      '0%': { transform: 'scale(0.3)', opacity: '0' },
                      '50%': { transform: 'scale(1.05)' },
                      '70%': { transform: 'scale(0.9)' },
                      '100%': { transform: 'scale(1)', opacity: '1' },
                    },
                    gradientShift: {
                      '0%, 100%': { backgroundPosition: '0% 50%' },
                      '50%': { backgroundPosition: '100% 50%' },
                    },
                  },
                  backgroundImage: {
                    'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                    'mesh': 'url("data:image/svg+xml,%3Csvg width=\\'40\\' height=\\'40\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cdefs%3E%3Cpattern id=\\'grid\\' width=\\'40\\' height=\\'40\\' patternUnits=\\'userSpaceOnUse\\'%3E%3Cpath d=\\'M 40 0 L 0 0 0 40\\' fill=\\'none\\' stroke=\\'rgba(99,102,241,0.05)\\' stroke-width=\\'1\\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\\'100%25\\' height=\\'100%25\\' fill=\\'url(%23grid)\\'/%3E%3C/svg%3E")',
                  }
                }
              }
            }
          `
        }} />
        
        {/* Premium Styles */}
        <style dangerouslySetInnerHTML={{
          __html: `
            * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
            
            html { scroll-behavior: smooth; }
            
            body {
              font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              background: #f8fafc;
              color: #0f172a;
              overflow-x: hidden;
            }
            
            /* Glass morphism */
            .glass {
              background: rgba(255, 255, 255, 0.72);
              backdrop-filter: blur(24px) saturate(180%);
              -webkit-backdrop-filter: blur(24px) saturate(180%);
              border: 1px solid rgba(255, 255, 255, 0.4);
            }
            .glass-dark {
              background: rgba(15, 23, 42, 0.75);
              backdrop-filter: blur(24px) saturate(180%);
              -webkit-backdrop-filter: blur(24px) saturate(180%);
              border: 1px solid rgba(255, 255, 255, 0.08);
            }
            .glass-brand {
              background: rgba(99, 102, 241, 0.08);
              backdrop-filter: blur(16px);
              -webkit-backdrop-filter: blur(16px);
              border: 1px solid rgba(99, 102, 241, 0.15);
            }
            
            /* Scrollbar */
            ::-webkit-scrollbar { width: 4px; height: 4px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
            ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            
            /* Safe area */
            .safe-area-bottom { padding-bottom: max(env(safe-area-inset-bottom), 0.5rem); }
            .safe-area-top { padding-top: env(safe-area-inset-top); }
            
            /* Prevent iOS zoom on input */
            input, textarea, select { font-size: 16px !important; }
            
            /* Shimmer loading */
            .shimmer {
              background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%);
              background-size: 400% 100%;
              animation: shimmer 1.4s ease infinite;
            }
            
            /* Gradient text */
            .text-gradient {
              background: linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            .text-gradient-warm {
              background: linear-gradient(135deg, #f59e0b, #ef4444, #ec4899);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            
            /* Premium gradients */
            .bg-gradient-brand {
              background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6366f1 100%);
              background-size: 200% 200%;
              animation: gradientShift 8s ease infinite;
            }
            .bg-gradient-dark {
              background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
            }
            .bg-gradient-mesh {
              background: 
                radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.08) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 20%, rgba(168,85,247,0.06) 0%, transparent 50%),
                radial-gradient(ellipse at 40% 80%, rgba(236,72,153,0.04) 0%, transparent 50%),
                #f8fafc;
            }
            
            /* Card styles */
            .card-premium {
              background: white;
              border-radius: 1rem;
              border: 1px solid rgba(226, 232, 240, 0.8);
              box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04);
              transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .card-premium:hover {
              border-color: rgba(99, 102, 241, 0.2);
              box-shadow: 0 4px 12px rgba(0,0,0,0.06), 0 20px 48px rgba(0,0,0,0.08);
              transform: translateY(-2px);
            }
            
            /* Button glow effect */
            .btn-glow {
              position: relative;
              overflow: hidden;
            }
            .btn-glow::after {
              content: '';
              position: absolute;
              inset: -2px;
              background: linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa, #6366f1);
              background-size: 300% 300%;
              animation: gradientShift 4s ease infinite;
              border-radius: inherit;
              z-index: -1;
              filter: blur(12px);
              opacity: 0;
              transition: opacity 0.3s;
            }
            .btn-glow:hover::after { opacity: 0.6; }
            
            /* Status dot animation */
            .status-dot-live {
              position: relative;
            }
            .status-dot-live::after {
              content: '';
              position: absolute;
              inset: -3px;
              border-radius: 50%;
              background: inherit;
              opacity: 0;
              animation: pulseSoft 2s ease-in-out infinite;
            }
            
            /* Number counter animation */
            @property --num {
              syntax: '<integer>';
              initial-value: 0;
              inherits: false;
            }
            .counter-animate {
              transition: --num 1.5s ease-out;
              counter-reset: num var(--num);
            }
            .counter-animate::after {
              content: counter(num);
            }
            
            /* Audio waveform */
            .waveform-bar {
              display: inline-block;
              width: 3px;
              min-height: 4px;
              border-radius: 999px;
              background: currentColor;
              transform-origin: bottom;
            }
            
            /* Stagger children animation */
            .stagger-children > * {
              opacity: 0;
              animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .stagger-children > *:nth-child(1) { animation-delay: 0.05s; }
            .stagger-children > *:nth-child(2) { animation-delay: 0.1s; }
            .stagger-children > *:nth-child(3) { animation-delay: 0.15s; }
            .stagger-children > *:nth-child(4) { animation-delay: 0.2s; }
            .stagger-children > *:nth-child(5) { animation-delay: 0.25s; }
            .stagger-children > *:nth-child(6) { animation-delay: 0.3s; }
            .stagger-children > *:nth-child(7) { animation-delay: 0.35s; }
            .stagger-children > *:nth-child(8) { animation-delay: 0.4s; }
            
            /* Tooltip */
            [data-tooltip] {
              position: relative;
            }
            [data-tooltip]::before {
              content: attr(data-tooltip);
              position: absolute;
              bottom: 100%;
              left: 50%;
              transform: translateX(-50%) translateY(-4px);
              padding: 6px 12px;
              background: #1e293b;
              color: white;
              font-size: 12px;
              font-weight: 500;
              border-radius: 8px;
              white-space: nowrap;
              opacity: 0;
              pointer-events: none;
              transition: all 0.2s;
            }
            [data-tooltip]:hover::before {
              opacity: 1;
              transform: translateX(-50%) translateY(-8px);
            }
            
            /* Progress ring */
            .progress-ring circle {
              transition: stroke-dashoffset 1s ease-out;
              transform: rotate(-90deg);
              transform-origin: 50% 50%;
            }
            
            /* Tab indicator */
            .tab-indicator {
              transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            
            /* Line clamp */
            .line-clamp-1 { overflow:hidden; display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:1; }
            .line-clamp-2 { overflow:hidden; display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; }
            .line-clamp-3 { overflow:hidden; display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:3; }
          `
        }} />
        
        {/* Global Auth Interceptor - auto redirect to login on 401 */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var origFetch = window.fetch;
              window.fetch = function(url, opts) {
                return origFetch.apply(this, arguments).then(function(res) {
                  if (res.status === 401 && typeof url === 'string' && url.startsWith('/api/') && !url.includes('/api/auth/login') && !url.includes('/api/reports/proposals/view/')) {
                    window.location.href = '/login';
                  }
                  return res;
                });
              };
            })();
          `
        }} />
      </head>
      <body class="bg-gradient-mesh min-h-screen text-surface-900 antialiased">
        {children}
      </body>
    </html>
  )
})
