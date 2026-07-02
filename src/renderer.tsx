import { jsxRenderer } from 'hono/jsx-renderer'

declare module 'hono' {
  interface ContextRenderer {
    (content: string | Promise<string>, props?: { title?: string }): Response | Promise<Response>
  }
}

export const renderer = jsxRenderer(({ children, title }) => {
  return (
    <html lang="ko" class="dark-support">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#7c4dff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="페이션트 터치" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="description" content="Patient Touch - AI 기반 치과 상담 CRM + 환자 소개 네트워크 + 이탈 예측" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/static/icons/favicon-32.png" />
        <link rel="apple-touch-icon" href="/static/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/static/manifest.json" />
        <title>{title || '페이션트 터치'}</title>
        
        {/* Tailwind CSS (v7.5: PostCSS pre-built bundle, removed CDN to drop production warning) */}
        <link rel="stylesheet" href="/static/tailwind.css" />
        
        {/* Font Awesome 6 Pro */}
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.1/css/all.min.css" rel="stylesheet" />
        
        {/* Pretendard Variable */}
        <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" rel="stylesheet" />
        
        {/* Chart.js */}
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        
        {/* v7.5: Inline tailwind.config + custom <style> blocks removed.
            → Tailwind config:    /tailwind.config.js
            → Custom CSS source:  /src/styles/index.css
            → Compiled bundle:    /public/static/tailwind.css  (loaded via <link> above) */}
        
        {/* Global Utilities (v8.1: extracted to cacheable static file — was ~14KB inlined per page) */}
        <script src="/static/utils.js"></script>
        {/* Shared UI Components (v8.6: 상태맵/아바타/시트 등 페이지 중복 제거) */}
        <script src="/static/components.js"></script>

      </head>
      <body class="bg-gradient-mesh min-h-screen text-surface-900 antialiased">
        {children}
        <script src="/static/pwa-register.js" defer></script>
      </body>
    </html>
  )
})
