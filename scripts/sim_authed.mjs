// 실제 로그인 → localStorage 토큰 주입 → 각 페이지 방문 → 데이터 렌더링 확인
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const EMAIL = 'demo@patienttouch.kr';
const PASSWORD = 'test1234';

// 1단계: 로그인해서 Set-Cookie 헤더 받기
const loginResp = await fetch(`${BASE}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD })
});
const loginData = await loginResp.json();

if (!loginData.success) {
  console.error('❌ 로그인 실패:', loginData);
  process.exit(1);
}
const setCookie = loginResp.headers.get('set-cookie') || '';
const authTokenMatch = setCookie.match(/auth_token=([^;]+)/);
const authToken = authTokenMatch ? authTokenMatch[1] : loginData.data.token;
const user = loginData.data.user;
console.log(`✅ 로그인 성공: ${user.name} (${user.role}) @ ${user.organization_name}`);
console.log(`   auth_token 쿠키: ${authToken.slice(0, 30)}...`);

// 2단계: Playwright로 브라우저 띄우고 쿠키 주입
const browser = await chromium.launch({ headless: true });
const url = new URL(BASE);
const context = await browser.newContext();

// auth_token 쿠키 주입 (sandbox.novita.ai는 https라 secure 가능)
await context.addCookies([{
  name: 'auth_token',
  value: authToken,
  domain: url.hostname,
  path: '/',
  httpOnly: false, // Playwright 제약: httpOnly 쿠키도 명시는 가능하지만 서버 검증용
  secure: url.protocol === 'https:',
  sameSite: 'Lax',
}]);

const page = await context.newPage();

// 콘솔 메시지 캡처
const allLogs = [];
page.on('console', msg => {
  allLogs.push(`[${msg.type()}] ${msg.text()}`);
});
page.on('pageerror', err => {
  allLogs.push(`[PAGE_ERROR] ${err.message}`);
});

const pages = [
  { path: '/', label: '홈 (HomePage)', wait: '#dashboardKpi, [data-page="home"], h1, h2' },
  { path: '/admin', label: '원장 대시보드', wait: '#kFactorByStaff, #staffPerformance, h1, h2' },
  { path: '/network', label: '소개 네트워크 그래프', wait: '#networkGraph, svg, h1' },
  { path: '/retention', label: '리텐션 (안부 컨택)', wait: '#retentionList, h1, h2' },
  { path: '/retention/churn', label: '이탈 예측', wait: '#churnList, h1, h2' },
  { path: '/retention/retraining', label: '재학습 대시보드', wait: '#retrainingOverview, #confusionMatrix, h1' },
  { path: '/patients', label: '환자 목록', wait: '#patientList, table, h1' },
  { path: '/patients/pd_01', label: '환자 상세 (김민수)', wait: '#patientInfo, h1, h2' },
  { path: '/consultations', label: '상담 목록', wait: '#consultationsList, table, h1' },
  { path: '/consultations/cd_01', label: '상담 상세 (cd_01)', wait: 'h1, h2' },
  { path: '/consultations/cd_01/report', label: '상담 보고서', wait: 'h1, h2' },
  { path: '/growth', label: '상담 성장 추적', wait: 'h1, h2' },
  { path: '/report', label: '리포트', wait: 'h1, h2' },
  { path: '/settings', label: '설정', wait: 'h1, h2' },
  { path: '/proposal/tok_demo_pd01_aa11', label: '제안서 (김민수)', wait: 'h1, h2' },
];

const results = [];

for (const p of pages) {
  const pageLogs = [];
  const onMsg = msg => pageLogs.push(`[${msg.type()}] ${msg.text()}`);
  const onErr = err => pageLogs.push(`[ERR] ${err.message}`);
  page.on('console', onMsg);
  page.on('pageerror', onErr);

  const start = Date.now();
  try {
    await page.goto(`${BASE}${p.path}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    // 콘텐츠 로딩 기다림 (API fetch 대기)
    await page.waitForTimeout(3500);

    const info = await page.evaluate(() => {
      const bodyText = document.body.innerText.slice(0, 800);
      const errors = Array.from(document.querySelectorAll('.error, [class*="error"], .text-red-500'))
        .map(el => el.innerText.trim()).filter(t => t).slice(0, 3);
      const dataMarkers = {
        // 페이지별 핵심 데이터 마커
        kFactorCard: !!document.querySelector('#kFactorByStaff'),
        kFactorEntries: document.querySelectorAll('#kFactorByStaff [data-staff-id], #kFactorByStaff .staff-row, #kFactorByStaff > div').length,
        networkSvg: !!document.querySelector('svg'),
        networkCircles: document.querySelectorAll('svg circle').length,
        confusionMatrix: !!document.querySelector('#confusionMatrix'),
        retrainingMetrics: !!document.querySelector('#retrainingMetrics, #overviewCards, [class*="confusion"]'),
        patientRows: document.querySelectorAll('tr, [class*="patient-row"], [data-patient-id]').length,
        churnRows: document.querySelectorAll('#churnList tr, #churnList > div').length,
        consultRows: document.querySelectorAll('#consultationsList tr, #consultationsList > div, [data-consult-id]').length,
        h1Text: document.querySelector('h1')?.innerText || '',
        h2Texts: Array.from(document.querySelectorAll('h2')).slice(0, 3).map(h => h.innerText.trim()),
        chartCanvases: document.querySelectorAll('canvas').length,
      };
      return { bodyText, errors, dataMarkers };
    });

    const elapsed = Date.now() - start;
    const errorLogs = pageLogs.filter(l => /\[err|\[error\]|404|500|fail/i.test(l)).slice(0, 3);
    results.push({
      path: p.path, label: p.label, status: 'OK', elapsed,
      h1: info.dataMarkers.h1Text,
      markers: info.dataMarkers,
      uiErrors: info.errors,
      consoleErrors: errorLogs,
      textPreview: info.bodyText.replace(/\s+/g, ' ').slice(0, 200),
    });
  } catch (e) {
    results.push({ path: p.path, label: p.label, status: 'FAIL', error: e.message, consoleErrors: pageLogs.slice(-5) });
  }

  page.off('console', onMsg);
  page.off('pageerror', onErr);
}

await browser.close();

// 결과 출력
console.log('\n\n========== 📊 실제 시뮬레이션 결과 ==========\n');
for (const r of results) {
  const icon = r.status === 'OK' ? '✅' : '❌';
  console.log(`${icon} ${r.path.padEnd(35)} | ${r.label}`);
  if (r.status === 'OK') {
    if (r.h1) console.log(`   📌 H1: "${r.h1.slice(0, 60)}"`);
    const m = r.markers;
    const hits = [];
    if (m.kFactorCard) hits.push(`K-factor카드(상담사 ${m.kFactorEntries}개)`);
    if (m.networkSvg) hits.push(`SVG ${m.networkCircles}노드`);
    if (m.confusionMatrix) hits.push('혼동행렬✓');
    if (m.chartCanvases) hits.push(`차트 ${m.chartCanvases}개`);
    if (m.patientRows) hits.push(`환자행 ${m.patientRows}`);
    if (m.churnRows) hits.push(`이탈행 ${m.churnRows}`);
    if (m.consultRows) hits.push(`상담행 ${m.consultRows}`);
    if (hits.length) console.log(`   🎯 마커: ${hits.join(' / ')}`);
    if (m.h2Texts.length) console.log(`   📝 H2: ${m.h2Texts.filter(t=>t).join(' | ').slice(0, 100)}`);
    if (r.uiErrors.length) console.log(`   ⚠️  UI 에러: ${r.uiErrors.join(', ')}`);
    if (r.consoleErrors.length) console.log(`   🐛 Console: ${r.consoleErrors[0]?.slice(0, 100)}`);
    console.log(`   📄 텍스트: ${r.textPreview.slice(0, 120)}...`);
  } else {
    console.log(`   ❌ ${r.error}`);
  }
  console.log();
}

const okCount = results.filter(r => r.status === 'OK').length;
console.log(`\n🎯 결과: ${okCount}/${results.length} 페이지 정상 렌더링`);
