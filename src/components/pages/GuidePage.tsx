import { FC } from 'hono/jsx'

/**
 * 사용 설명서 (공개 페이지 — 로그인 불필요)
 * 가입부터 모든 기능까지, 처음 쓰는 원장/실장 눈높이로.
 */

const Step: FC<{ n: string; title: string; children?: any }> = ({ n, title, children }) => (
  <div class="flex gap-4 items-start">
    <div class="flex-shrink-0 w-8 h-8 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-300 font-black text-sm flex items-center justify-center mt-0.5">{n}</div>
    <div class="min-w-0">
      <p class="text-white font-bold mb-1">{title}</p>
      <div class="text-surface-400 text-sm leading-relaxed">{children}</div>
    </div>
  </div>
)

const Tip: FC<{ children?: any }> = ({ children }) => (
  <div class="mt-4 flex gap-2.5 items-start rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
    <i class="fas fa-lightbulb text-amber-400 mt-0.5"></i>
    <p class="text-amber-200/90 text-sm leading-relaxed">{children}</p>
  </div>
)

const SectionTitle: FC<{ id: string; icon: string; badge: string; title: string; desc?: string }> = ({ id, icon, badge, title, desc }) => (
  <div id={id} class="scroll-mt-24 mb-6">
    <div class="flex items-center gap-2 mb-2">
      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/25 text-brand-300 text-xs font-bold">
        <i class={`fas ${icon}`}></i>{badge}
      </span>
    </div>
    <h2 class="text-2xl md:text-3xl font-black text-white tracking-tight">{title}</h2>
    {desc ? <p class="text-surface-400 mt-2 leading-relaxed">{desc}</p> : null}
  </div>
)

export const GuidePage: FC = () => {
  return (
    <div class="min-h-screen relative overflow-x-hidden bg-aurora-dark">
      <div class="fixed inset-0 pointer-events-none">
        <div class="absolute top-20 -left-32 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl" />
        <div class="absolute bottom-20 -right-32 w-80 h-80 bg-accent-cyan/10 rounded-full blur-3xl" />
      </div>

      <div class="relative z-10">
        {/* ===== Nav ===== */}
        <nav class="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-white/5">
          <div class="max-w-5xl mx-auto px-5 py-3.5 flex items-center justify-between">
            <a href="/welcome" class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-lg shadow-brand-600/30">
                <i class="fas fa-book-open text-white text-sm"></i>
              </div>
              <span class="text-white font-black tracking-tight">Patient Touch <span class="text-gradient">사용 설명서</span></span>
            </a>
            <div class="flex items-center gap-2.5">
              <a href="/login" class="px-4 py-2 rounded-xl text-sm font-semibold text-surface-300 hover:text-white border border-white/10 hover:border-white/25 bg-white/5 transition-all">로그인</a>
              <a href="/register" class="px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-brand hover:shadow-lg hover:shadow-brand-600/30 transition-all">무료로 시작</a>
            </div>
          </div>
        </nav>

        {/* ===== Hero ===== */}
        <header class="max-w-5xl mx-auto px-5 pt-14 pb-10 text-center">
          <h1 class="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            처음부터 끝까지, <span class="text-gradient">이 페이지 하나면 됩니다</span>
          </h1>
          <p class="text-surface-400 text-base md:text-lg max-w-2xl mx-auto">
            가입 30초 → 첫 상담 녹음 → AI 분석 → 환자에게 리포트 발송까지.<br class="hidden md:block" />
            페이션트 터치의 모든 기능을 순서대로 안내합니다.
          </p>
        </header>

        {/* ===== TOC ===== */}
        <section id="toc-section" class="max-w-5xl mx-auto px-5 pb-12">
          <div class="rounded-2xl bg-white/5 border border-white/10 p-6">
            <p class="text-white font-bold mb-4"><i class="fas fa-list text-brand-400 mr-2"></i>목차</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
              <a href="#g-signup" class="toc-link">1. 가입하고 시작하기 (30초)</a>
              <a href="#g-onboarding" class="toc-link">2. 첫 화면과 온보딩 6단계</a>
              <a href="#g-team" class="toc-link">3. 팀 관리 — 실장님 초대</a>
              <a href="#g-patients" class="toc-link">4. 환자 등록과 관리</a>
              <a href="#g-recording" class="toc-link">5. 상담 녹음 (핵심!)</a>
              <a href="#g-analysis" class="toc-link">6. AI 상담 분석 읽는 법</a>
              <a href="#g-today" class="toc-link">7. 오늘의 액션 — 아침 루틴</a>
              <a href="#g-calendar" class="toc-link">8. 일정 캘린더</a>
              <a href="#g-touchreport" class="toc-link">9. 터치 리포트 — 환자용 보고서</a>
              <a href="#g-proposal" class="toc-link">10. 치료 제안서</a>
              <a href="#g-retention" class="toc-link">11. 리텐션 — 미동의 환자 리콜</a>
              <a href="#g-churn" class="toc-link">12. AI 이탈 예측</a>
              <a href="#g-growth" class="toc-link">13. 성장 추적 & 소개 네트워크</a>
              <a href="#g-report" class="toc-link">14. 성과 리포트 & 목표</a>
              <a href="#g-admin" class="toc-link">15. 원장 대시보드</a>
              <a href="#g-kakao" class="toc-link">16. 카카오 알림톡 연동</a>
              <a href="#g-settings" class="toc-link">17. 설정 — 전체 항목</a>
              <a href="#g-privacy" class="toc-link">18. 개인정보 보호 & 보안</a>
              <a href="#g-roles" class="toc-link">19. 권한 — 원장 vs 실장</a>
              <a href="#g-billing" class="toc-link">20. 무료 체험과 구독</a>
              <a href="#g-pwa" class="toc-link">21. 홈 화면에 앱 설치</a>
              <a href="#g-faq" class="toc-link">22. 자주 묻는 질문</a>
            </div>
          </div>
        </section>

        <main class="max-w-3xl mx-auto px-5 pb-24 space-y-16">

          {/* ============ 1. 가입 ============ */}
          <section>
            <SectionTitle id="g-signup" icon="fa-rocket" badge="STEP 1" title="가입하고 시작하기 (30초)"
              desc="신용카드 없이 바로 시작합니다. 가입하는 순간 30일 무료 체험이 자동으로 시작됩니다." />
            <div class="space-y-5">
              <Step n="1" title="patienttouch.kr 접속 → [무료로 시작] 클릭">
                또는 주소창에 <code class="code-chip">patienttouch.kr/register</code> 를 직접 입력하세요.
              </Step>
              <Step n="2" title="4가지만 입력하면 끝">
                <b class="text-surface-200">병원 이름</b> (예: 서울비디치과) · <b class="text-surface-200">내 이름</b> · <b class="text-surface-200">이메일</b> · <b class="text-surface-200">비밀번호</b>(8자 이상). 가입한 사람이 자동으로 <b class="text-surface-200">원장(관리자)</b> 권한을 받습니다.
              </Step>
              <Step n="3" title="Google 계정으로도 가능">
                로그인 화면의 <b class="text-surface-200">Google로 계속하기</b> 버튼을 누르면 비밀번호 없이 시작할 수 있습니다.
              </Step>
              <Step n="4" title="가입 완료 → 홈 화면">
                로그인하면 바로 홈 대시보드가 열립니다. 상단에 <b class="text-surface-200">체험판 D-30 배너</b>가 남은 기간을 알려줍니다.
              </Step>
            </div>
            <Tip>병원 하나당 계정 하나가 아닙니다 — <b>병원 하나에 팀원 여러 명</b>이 각자 계정으로 들어옵니다. 실장님 초대는 3번 항목에서!</Tip>
          </section>

          {/* ============ 2. 온보딩 ============ */}
          <section>
            <SectionTitle id="g-onboarding" icon="fa-flag-checkered" badge="STEP 2" title="첫 화면과 온보딩 6단계"
              desc="가입 직후 홈 화면에 '시작 가이드' 체크리스트가 뜹니다. 하나씩 완료하면 자동으로 체크됩니다." />
            <div class="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3 text-sm">
              <div class="guide-check"><i class="fas fa-check-circle text-emerald-400"></i><span class="text-surface-300"><b class="text-white">① 첫 환자 등록</b> — 환자 탭에서 이름·연락처만 넣으면 끝</span></div>
              <div class="guide-check"><i class="fas fa-check-circle text-emerald-400"></i><span class="text-surface-300"><b class="text-white">② 첫 상담 녹음</b> — 녹음 버튼 한 번이면 AI가 알아서 분석</span></div>
              <div class="guide-check"><i class="fas fa-check-circle text-emerald-400"></i><span class="text-surface-300"><b class="text-white">③ AI 분석 리포트 확인</b> — 코칭 점수와 환자 심리 확인</span></div>
              <div class="guide-check"><i class="fas fa-check-circle text-emerald-400"></i><span class="text-surface-300"><b class="text-white">④ 팀원 초대</b> — 실장님 계정 추가</span></div>
              <div class="guide-check"><i class="fas fa-check-circle text-emerald-400"></i><span class="text-surface-300"><b class="text-white">⑤ 목표 설정</b> — 전환율·연락 수행률 목표 입력</span></div>
              <div class="guide-check"><i class="fas fa-check-circle text-emerald-400"></i><span class="text-surface-300"><b class="text-white">⑥ 아침 브리핑 알림 켜기</b> — 매일 오늘 할 일을 푸시로</span></div>
            </div>
            <p class="text-surface-400 text-sm mt-4 leading-relaxed">
              하단 내비게이션은 <b class="text-surface-200">홈 · 오늘 · 상담 · 환자 · 리텐션 · 리포트</b> 6개 탭입니다. 어디에 있든 한 번의 탭으로 이동합니다.
            </p>
          </section>

          {/* ============ 3. 팀 관리 ============ */}
          <section>
            <SectionTitle id="g-team" icon="fa-users" badge="STEP 3" title="팀 관리 — 실장님 초대"
              desc="병원 하나에 실장·상담사를 몇 명이든 추가할 수 있습니다. 각자 자기 계정으로 로그인해서 자기 상담을 기록합니다." />
            <div class="space-y-5">
              <Step n="1" title="설정 → 팀 관리 (원장만 보임)">
                이름 · 이메일 · 임시 비밀번호 · 역할(원장/실장)을 입력하고 추가를 누릅니다.
              </Step>
              <Step n="2" title="실장님은 받은 이메일+비밀번호로 로그인">
                로그인 후 설정 → 계정에서 비밀번호를 바꾸도록 안내해 주세요.
              </Step>
              <Step n="3" title="역할 변경 · 삭제도 팀 관리에서">
                실장을 원장(관리자)으로 승격하거나, 퇴사자를 삭제할 수 있습니다. 단, <b class="text-surface-200">마지막 남은 원장 계정은 강등·삭제할 수 없습니다</b> (병원이 잠기는 사고 방지).
              </Step>
            </div>
            <Tip>실장 계정에게는 매출 합계·타 직원 연락처 등 민감 정보가 자동으로 가려집니다. 자세한 권한 차이는 <a href="#g-roles" class="text-brand-300 underline">19번 권한표</a>를 보세요.</Tip>
          </section>

          {/* ============ 4. 환자 ============ */}
          <section>
            <SectionTitle id="g-patients" icon="fa-hospital-user" badge="STEP 4" title="환자 등록과 관리"
              desc="환자 탭에서 병원의 모든 환자를 검색·관리합니다. 상담과 자동으로 연결됩니다." />
            <div class="space-y-5">
              <Step n="1" title="환자 등록">
                환자 탭 → <b class="text-surface-200">+ 버튼</b>. 이름과 연락처만 필수, 나이·성별·내원 경로(네이버 검색/블로그/간판·도보/소개/광고 등)·메모는 선택입니다.
              </Step>
              <Step n="2" title="환자 상세 화면에서 볼 수 있는 것">
                상담 이력 타임라인 · <b class="text-surface-200">상담 금액 추이 차트</b> · 상담 비교 분석(지난 상담 대비 변화) · 치료 항목(임플란트/교정/보철/미백/라미네이트 등) · 다음 연락 예정일 · 다음 예약일 · 메모 이력.
              </Step>
              <Step n="3" title="소개 관계 입력">
                "누가 소개해서 왔는지"를 입력하면 <a href="#g-growth" class="text-brand-300 underline">소개 네트워크 지도</a>에 자동 반영됩니다.
              </Step>
              <Step n="4" title="중복 환자 정리">
                설정 → 중복 환자 관리에서 이름·연락처가 겹치는 환자를 검사하고 한 명으로 병합할 수 있습니다. 상담 이력도 함께 합쳐집니다.
              </Step>
            </div>
          </section>

          {/* ============ 5. 녹음 ============ */}
          <section>
            <SectionTitle id="g-recording" icon="fa-microphone" badge="STEP 5 · 핵심" title="상담 녹음 — 버튼 하나면 됩니다"
              desc="페이션트 터치의 심장입니다. 상담실에서 폰이나 태블릿을 열고 녹음 버튼만 누르세요. 나머지는 AI가 합니다." />
            <div class="space-y-5">
              <Step n="1" title="녹음 전: 환자 동의 안내">
                녹음 시작 전 <b class="text-surface-200">동의 안내 문구</b>가 화면에 뜹니다 (문구는 설정에서 병원에 맞게 수정 가능). 환자에게 고지하고 확인을 누르면 녹음이 시작됩니다.
              </Step>
              <Step n="2" title="녹음 중">
                실시간 파형과 음질 표시가 나옵니다. 긴 상담도 걱정 없이 — 녹음은 <b class="text-surface-200">60초 단위로 자동 분할 업로드</b>되어 중간에 앱이 꺼져도 이미 올라간 부분은 안전합니다.
              </Step>
              <Step n="3" title="녹음 파일 업로드도 가능">
                다른 기기로 녹음했다면? <b class="text-surface-200">파일 선택</b>으로 m4a/mp3/webm 등 오디오 파일을 올려도 똑같이 분석됩니다.
              </Step>
              <Step n="4" title="저장하면 AI 분석 자동 시작">
                음성 인식(STT) → 화자 분리 → 심리 분석 → 코칭 리포트 순으로 진행됩니다. 진행률이 실시간 표시되고, 보통 <b class="text-surface-200">수 분 안에</b> 완료됩니다. 화면을 닫아도 분석은 계속됩니다.
              </Step>
            </div>
            <Tip>첫 녹음을 완료하면 축하 화면과 함께 첫 코칭 점수를 바로 보여드립니다. 점수가 낮아도 놀라지 마세요 — 여기서부터 올라가는 게 성장 그래프입니다.</Tip>
          </section>

          {/* ============ 6. AI 분석 ============ */}
          <section>
            <SectionTitle id="g-analysis" icon="fa-brain" badge="STEP 6" title="AI 상담 분석 읽는 법"
              desc="상담 탭 → 상담 선택 → 상세 화면. 상담 한 건이 아래 정보로 해부됩니다." />
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="feature-card"><i class="fas fa-gauge-high text-brand-400"></i><div><p class="text-white font-bold text-sm">코칭 점수 (100점)</p><p class="text-surface-400 text-xs mt-1">상담 스킬 종합 점수. 라포·니즈파악·가치전달·클로징 항목별 세부 점수와 개선 코멘트 제공</p></div></div>
              <div class="feature-card"><i class="fas fa-signal text-emerald-400"></i><div><p class="text-white font-bold text-sm">결정 신호 (10점)</p><p class="text-surface-400 text-xs mt-1">환자가 치료를 결정할 가능성. 7점 이상이면 클로징 콜 타이밍</p></div></div>
              <div class="feature-card"><i class="fas fa-heart-pulse text-rose-400"></i><div><p class="text-white font-bold text-sm">환자 심리 분석</p><p class="text-surface-400 text-xs mt-1">망설임의 진짜 이유(비용/두려움/불신/타이밍)와 대응 전략</p></div></div>
              <div class="feature-card"><i class="fas fa-chart-line text-amber-400"></i><div><p class="text-white font-bold text-sm">감정 흐름 차트</p><p class="text-surface-400 text-xs mt-1">상담 중 환자 감정이 언제 올라가고 언제 식었는지 시각화</p></div></div>
              <div class="feature-card"><i class="fas fa-quote-left text-cyan-400"></i><div><p class="text-white font-bold text-sm">핵심 발언 인용</p><p class="text-surface-400 text-xs mt-1">환자의 결정적 발언을 원문 그대로 인용 (지어내지 않음)</p></div></div>
              <div class="feature-card"><i class="fas fa-file-lines text-violet-400"></i><div><p class="text-white font-bold text-sm">원문 전체 보기 + 검색</p><p class="text-surface-400 text-xs mt-1">화자 분리된 전체 대화록. 키워드 검색으로 "임플란트" 언급 지점 바로 찾기</p></div></div>
              <div class="feature-card"><i class="fas fa-headphones text-brand-400"></i><div><p class="text-white font-bold text-sm">녹음 다시 듣기</p><p class="text-surface-400 text-xs mt-1">구간별 재생. 녹음 일부가 유실됐다면 어디가 빠졌는지 투명하게 표시</p></div></div>
              <div class="feature-card"><i class="fas fa-bell-concierge text-emerald-400"></i><div><p class="text-white font-bold text-sm">후속 액션 자동 생성</p><p class="text-surface-400 text-xs mt-1">미결정 환자면 클로징 콜 태스크가 맞춤 멘트와 함께 자동 등록</p></div></div>
            </div>
            <p class="text-surface-400 text-sm mt-4 leading-relaxed">
              녹음 없이 만든 상담이나 환자 연결이 빠진 상담은 <b class="text-surface-200">상담 상세 → 환자 연결</b>로 나중에 연결할 수 있고, <b class="text-surface-200">재분석</b> 버튼으로 AI 분석을 다시 돌릴 수도 있습니다.
            </p>
          </section>

          {/* ============ 7. 오늘의 액션 ============ */}
          <section>
            <SectionTitle id="g-today" icon="fa-sun" badge="STEP 7" title="오늘의 액션 — 매일 아침 이 탭부터"
              desc="'오늘' 탭은 병원의 하루 업무 지시서입니다. 출근하면 여기부터 여세요." />
            <div class="space-y-5">
              <Step n="1" title="아침 브리핑 요약">
                오늘 연락할 환자 수 · 밀린 태스크 · 어제 상담 요약이 한눈에 정리됩니다.
              </Step>
              <Step n="2" title="오늘의 연락 리스트">
                AI가 골라준 <b class="text-surface-200">오늘 연락해야 할 환자</b>가 우선순위 순으로 나열됩니다. 각 환자마다 왜 연락해야 하는지 이유와 추천 멘트가 붙어 있습니다.
              </Step>
              <Step n="3" title="연락 후 결과 기록">
                환자 카드를 탭 → 전화/문자/카카오 중 수단 선택 → 결과(통화 성공/부재중/예약 완료/콜백 약속/거절) 기록. 결과에 따라 다음 연락이 자동으로 잡힙니다.
              </Step>
              <Step n="4" title="기한 지난 태스크 경고">
                놓친 연락이 있으면 빨간 알림으로 최상단에 표시됩니다. 완료/건너뛰기 처리로 정리하세요.
              </Step>
              <Step n="5" title="아침 브리핑 푸시 알림">
                설정 → 알림 설정에서 시간을 정하면 (예: 오전 8:30) 매일 그 시간에 오늘 할 일이 폰 알림으로 옵니다. 주말 알림 여부도 선택 가능합니다.
              </Step>
            </div>
          </section>

          {/* ============ 8. 캘린더 ============ */}
          <section>
            <SectionTitle id="g-calendar" icon="fa-calendar-days" badge="STEP 8" title="일정 캘린더"
              desc="상담 · 연락 예정 · 예약이 월간 달력 하나에 모입니다." />
            <p class="text-surface-400 text-sm leading-relaxed">
              상담 탭 상단의 <b class="text-surface-200">캘린더</b> 아이콘 (또는 <code class="code-chip">/calendar</code>). 날짜를 탭하면 그날의 상담 목록·연락 예정 환자·예약이 나오고, 각 항목을 누르면 바로 해당 상담/환자 화면으로 이동합니다. 월 이동은 좌우 화살표 또는 스와이프.
            </p>
          </section>

          {/* ============ 9. 터치 리포트 ============ */}
          <section>
            <SectionTitle id="g-touchreport" icon="fa-file-medical" badge="STEP 9 · 시그니처" title="터치 리포트 — 환자에게 보내는 상담 보고서"
              desc="상담 내용을 환자용 언어로 정리한 개인 맞춤 보고서입니다. '우리 병원은 이렇게까지 신경 쓴다'를 보여주는 팬 만들기 도구." />
            <div class="space-y-5">
              <Step n="1" title="① 환자 동의 받기 (필수)">
                리포트를 카카오톡/링크로 받는 것에 대한 <b class="text-surface-200">환자 동의</b>가 먼저입니다. 환자 상세 또는 리포트 생성 화면에서 동의를 기록하세요. 동의 없이는 생성 버튼이 눌리지 않습니다 — 개인정보 보호를 위한 설계입니다.
              </Step>
              <Step n="2" title="② 생성 (약 20초)">
                분석 완료된 상담에서 <b class="text-surface-200">터치 리포트 만들기</b>를 누르면 AI가 환자 눈높이 보고서를 작성합니다: 상담 요약 · 제안된 치료와 이유 · 비용 안내 · 자주 하는 질문 답변.
              </Step>
              <Step n="3" title="③ 검수 — AI를 그냥 믿지 않습니다">
                생성된 리포트에는 <b class="text-surface-200">검증 플래그</b>가 붙습니다 (금액·치료명·날짜 등 사실 확인이 필요한 부분). 실장님이 하나씩 확인·수정해서 플래그를 전부 해소해야 다음 단계로 갑니다. <b class="text-surface-200">틀린 정보가 환자에게 나가는 것을 구조적으로 차단</b>합니다.
              </Step>
              <Step n="4" title="④ 승인 → ⑤ 발송">
                플래그가 모두 해소되면 승인 버튼이 활성화됩니다. 발송 시 <b class="text-surface-200">본인 확인 번호</b>(예: 생년 4자리)를 설정하고, 카카오 알림톡 또는 링크 복사로 전달합니다.
              </Step>
              <Step n="5" title="⑥ 환자 열람">
                환자는 받은 링크를 열고 본인 확인 번호를 입력해야 볼 수 있습니다. <b class="text-surface-200">열람 여부와 횟수가 기록</b>되어 "읽었는데 연락 없는 환자"를 골라 팔로업할 수 있습니다.
              </Step>
            </div>
            <p class="text-surface-400 text-sm mt-4">전체 리포트 목록과 상태(작성중/검수중/승인/발송/열람)는 <code class="code-chip">/touch-reports</code> 에서 한눈에 관리합니다.</p>
          </section>

          {/* ============ 10. 제안서 ============ */}
          <section>
            <SectionTitle id="g-proposal" icon="fa-file-signature" badge="STEP 10" title="치료 제안서"
              desc="상담에서 제안한 치료 계획을 프리미엄 디자인의 웹 제안서로 만들어 보냅니다." />
            <p class="text-surface-400 text-sm leading-relaxed">
              상담 상세에서 <b class="text-surface-200">제안서 생성</b> → 치료 항목·금액·유효기간 확인 → 링크 발송. 환자가 열어보면 <b class="text-surface-200">열람·버튼 클릭이 추적</b>되어 원장 대시보드의 "제안서 현황"(발송/열람/전환)에 집계됩니다. 열람율이 곧 상담 품질의 바로미터입니다.
            </p>
          </section>

          {/* ============ 11. 리텐션 ============ */}
          <section>
            <SectionTitle id="g-retention" icon="fa-rotate" badge="STEP 11" title="리텐션 — '생각해볼게요' 환자를 되살리는 엔진"
              desc="미동의 환자는 사라진 게 아니라 아직 결정을 못 한 것뿐입니다. 리텐션 탭이 그들을 찾아서 줄 세워줍니다." />
            <div class="space-y-5">
              <Step n="1" title="자동 분류">
                상담 결과에 따라 환자가 <b class="text-surface-200">미동의 · 부분동의 · 치료중 · 완료 · 이탈위험</b>으로 자동 분류됩니다. 손으로 엑셀 정리할 필요가 없습니다.
              </Step>
              <Step n="2" title="우선순위 리스트">
                상담 금액 · 결정 신호 · 경과일을 종합해 <b class="text-surface-200">지금 연락하면 살아날 확률이 높은 순서</b>로 정렬됩니다.
              </Step>
              <Step n="3" title="AI 연락 스크립트">
                환자마다 <b class="text-surface-200">이 환자의 상담 내용에 기반한</b> 전화/문자 멘트를 AI가 만들어줍니다. 상담 때 환자가 걱정했던 바로 그 지점을 짚어주는 멘트입니다.
              </Step>
              <Step n="4" title="연락 기록 & 루프">
                연락 방법(전화/문자/카카오)과 결과(통화 성공/부재중/콜백 약속/예약 완료/거절)를 기록하면 다음 연락 예정일이 자동으로 걸립니다. <b class="text-surface-200">찾는 건 기계가, 연락은 사람이.</b>
              </Step>
            </div>
          </section>

          {/* ============ 12. 이탈 예측 ============ */}
          <section>
            <SectionTitle id="g-churn" icon="fa-user-slash" badge="STEP 12" title="AI 이탈 예측"
              desc="리텐션 탭 → 이탈 예측. 어떤 환자가 언제쯤 떠날지 AI가 미리 알려줍니다." />
            <p class="text-surface-400 text-sm leading-relaxed mb-4">
              <b class="text-surface-200">예측 실행</b> 버튼을 누르면 (최대 30초) 환자별 <b class="text-surface-200">이탈 확률 · 예상 이탈 시점 · 위험 요인</b>이 계산됩니다. 대시보드에는 고위험군 수 · 평균 이탈확률 · <b class="text-surface-200">"지금 액션하면 살릴 수 있는 매출"</b>(고위험군 미수납 치료비 합계)이 표시됩니다. 고위험 환자는 바로 리텐션 연락 리스트로 보낼 수 있습니다.
            </p>
            <p class="text-surface-400 text-sm leading-relaxed">
              <code class="code-chip">/retention/retraining</code> 에서는 예측 모델이 실제 결과 대비 얼마나 맞았는지(적중률)를 확인하고 재학습시킬 수 있습니다.
            </p>
          </section>

          {/* ============ 13. 성장/네트워크 ============ */}
          <section>
            <SectionTitle id="g-growth" icon="fa-seedling" badge="STEP 13" title="성장 추적 & 소개 네트워크"
              desc="실장님 개인의 성장과, 환자가 환자를 데려오는 바이럴을 눈으로 확인합니다." />
            <div class="space-y-5">
              <Step n="1" title="상담 성장 추적 (/growth)">
                내 코칭 점수가 주 단위로 어떻게 변했는지, 어떤 항목(라포/니즈/가치/클로징)이 늘고 어떤 항목이 정체인지 그래프로 봅니다. <b class="text-surface-200">"내 상담 실력의 변화를 확인하세요"</b> — 코칭의 근거가 됩니다.
              </Step>
              <Step n="2" title="환자 소개 네트워크 (/network)">
                누가 누구를 소개했는지 <b class="text-surface-200">소개 트리</b>로 시각화됩니다. 최고 인플루언서(가장 많은 환자를 데려온 팬) · 소개로 만든 매출 · 최대 소개 깊이를 확인하세요. <b class="text-surface-200">팬을 만들면 환자가 환자를 데려옵니다.</b>
              </Step>
            </div>
          </section>

          {/* ============ 14. 리포트 ============ */}
          <section>
            <SectionTitle id="g-report" icon="fa-chart-pie" badge="STEP 14" title="성과 리포트 & 목표 관리"
              desc="리포트 탭. 병원의 숫자를 주간/월간/분기로 봅니다." />
            <p class="text-surface-400 text-sm leading-relaxed">
              <b class="text-surface-200">총 상담 · 총 상담 금액 · 결제 완료 · 상담 전환율 · 연락 수행률 · 재상담 성공</b>이 핵심 지표입니다. <b class="text-surface-200">목표 설정</b>에서 전환율 목표(%) · 연락 수행률 목표(%) · 재상담 목표(건)를 입력하면 목표 달성 현황이 게이지로 표시되고, <b class="text-surface-200">기간 비교</b>(이번 주 vs 지난 주, 이번 달 vs 지난 달)로 추세를 확인합니다. 매출 추이 · 전환율 추이 차트 포함.
            </p>
          </section>

          {/* ============ 15. 원장 대시보드 ============ */}
          <section>
            <SectionTitle id="g-admin" icon="fa-user-tie" badge="STEP 15 · 원장 전용" title="원장 대시보드 (/admin)"
              desc="원장(관리자)만 볼 수 있는 경영 화면입니다. 병원 전체가 한 장에 들어옵니다." />
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="feature-card"><i class="fas fa-users-gear text-brand-400"></i><div><p class="text-white font-bold text-sm">상담사별 성과</p><p class="text-surface-400 text-xs mt-1">실장별 상담 수 · 전환율 · 평균 점수 · 연락수행률 비교</p></div></div>
              <div class="feature-card"><i class="fas fa-arrow-trend-up text-emerald-400"></i><div><p class="text-white font-bold text-sm">매출 트렌드</p><p class="text-surface-400 text-xs mt-1">이번 주 vs 지난 주, 목표 달성률</p></div></div>
              <div class="feature-card"><i class="fas fa-triangle-exclamation text-amber-400"></i><div><p class="text-white font-bold text-sm">저점수 상담 자동 표시</p><p class="text-surface-400 text-xs mt-1">70점 미만 상담 리스트 → 코칭 대상을 데이터로 선정</p></div></div>
              <div class="feature-card"><i class="fas fa-viruses text-cyan-400"></i><div><p class="text-white font-bold text-sm">소개 바이럴 지수 (K-factor)</p><p class="text-surface-400 text-xs mt-1">상담사별 바이럴 기여도 — 누가 팬을 만들고 있는가</p></div></div>
              <div class="feature-card"><i class="fas fa-clock text-violet-400"></i><div><p class="text-white font-bold text-sm">시간대별 상담 분포</p><p class="text-surface-400 text-xs mt-1">상담이 몰리는 시간대 파악 → 인력 배치 근거</p></div></div>
              <div class="feature-card"><i class="fas fa-envelope-open-text text-rose-400"></i><div><p class="text-white font-bold text-sm">제안서 현황</p><p class="text-surface-400 text-xs mt-1">발송 → 열람 → 전환 퍼널, 점수↔매출 상관 분석</p></div></div>
            </div>
          </section>

          {/* ============ 16. 카카오 ============ */}
          <section>
            <SectionTitle id="g-kakao" icon="fa-comment" badge="STEP 16" title="카카오 알림톡 연동 (선택)"
              desc="터치 리포트·제안서·리콜 안내를 카카오톡으로 자동 발송하려면 알림톡을 연동하세요." />
            <p class="text-surface-400 text-sm leading-relaxed">
              설정에서 알림톡 API 정보(솔라피 등)와 템플릿을 등록하면 <b class="text-surface-200">개별 발송 · 일괄 발송 · 발송 로그 확인</b>이 가능합니다. 연동 전에도 모든 기능은 <b class="text-surface-200">링크 복사 방식</b>으로 쓸 수 있으니, 처음엔 링크로 시작하고 나중에 연동해도 됩니다.
            </p>
          </section>

          {/* ============ 17. 설정 ============ */}
          <section>
            <SectionTitle id="g-settings" icon="fa-gear" badge="STEP 17" title="설정 — 전체 항목"
              desc="설정 화면의 모든 메뉴를 정리합니다. (원장 전용) 표시가 있는 항목은 실장에게 보이지 않습니다." />
            <div class="overflow-x-auto rounded-2xl border border-white/10">
              <table class="w-full text-sm">
                <thead><tr class="bg-white/5 text-surface-300"><th class="table-th">메뉴</th><th class="table-th">내용</th></tr></thead>
                <tbody class="divide-y divide-white/5 text-surface-400">
                  <tr><td class="table-td font-bold text-white">계정</td><td class="table-td">내 이름·비밀번호 변경</td></tr>
                  <tr><td class="table-td font-bold text-white">팀 관리 <span class="badge-admin">원장</span></td><td class="table-td">팀원 추가·역할 변경·삭제</td></tr>
                  <tr><td class="table-td font-bold text-white">구독 상태</td><td class="table-td">현재 플랜 · 체험 남은 기간(D-n)</td></tr>
                  <tr><td class="table-td font-bold text-white">이번 달 AI 사용량 <span class="badge-admin">원장</span></td><td class="table-td">AI 분석 건수·처리 분·터치 리포트·이탈 예측 횟수와 예상 비용</td></tr>
                  <tr><td class="table-td font-bold text-white">알림 설정</td><td class="table-td">아침 브리핑 푸시 켜기/시간/주말 여부</td></tr>
                  <tr><td class="table-td font-bold text-white">녹음 설정</td><td class="table-td">녹음 동의 안내 문구 편집</td></tr>
                  <tr><td class="table-td font-bold text-white">개인정보 보호 <span class="badge-admin">원장</span></td><td class="table-td">상담 원문 보존 기간 설정 → 기간 경과 시 원문·녹음 자동 파기(통계는 유지) · 감사 로그(열람/검색/파기/삭제 이력)</td></tr>
                  <tr><td class="table-td font-bold text-white">데이터 내보내기 <span class="badge-admin">원장</span></td><td class="table-td">전체 환자 CSV · 최근 30일 상담 CSV · 이탈 위험 환자 CSV</td></tr>
                  <tr><td class="table-td font-bold text-white">중복 환자 관리</td><td class="table-td">중복 검사 → 병합</td></tr>
                  <tr><td class="table-td font-bold text-white">목표 설정</td><td class="table-td">전환율·연락수행률·재상담 목표 (리포트 탭과 연동)</td></tr>
                  <tr><td class="table-td font-bold text-white">앱 정보</td><td class="table-td">버전 · 문의처 · 이용약관 · 개인정보처리방침</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ============ 18. 개인정보/보안 ============ */}
          <section>
            <SectionTitle id="g-privacy" icon="fa-shield-halved" badge="STEP 18" title="개인정보 보호 & 보안"
              desc="의료 데이터를 다루는 서비스답게, 보호 장치가 기본으로 켜져 있습니다." />
            <div class="space-y-3 text-sm text-surface-400">
              <p><i class="fas fa-check text-emerald-400 mr-2"></i><b class="text-surface-200">병원 간 완전 격리</b> — 다른 병원의 데이터는 어떤 경로로도 접근 불가 (멀티테넌트 격리, 정기 감사)</p>
              <p><i class="fas fa-check text-emerald-400 mr-2"></i><b class="text-surface-200">녹음 동의 절차 내장</b> — 녹음 전 고지 문구, 터치 리포트 발송 전 수신 동의 필수</p>
              <p><i class="fas fa-check text-emerald-400 mr-2"></i><b class="text-surface-200">보존기간 자동 파기</b> — 설정한 기간이 지나면 상담 원문·녹음이 자동 삭제 (통계 수치만 유지)</p>
              <p><i class="fas fa-check text-emerald-400 mr-2"></i><b class="text-surface-200">감사 로그</b> — 누가 언제 원문을 열람·검색·파기했는지 전부 기록</p>
              <p><i class="fas fa-check text-emerald-400 mr-2"></i><b class="text-surface-200">환자 열람 본인 확인</b> — 터치 리포트·제안서는 본인 확인 번호를 맞춰야만 열람</p>
              <p><i class="fas fa-check text-emerald-400 mr-2"></i><b class="text-surface-200">역할 기반 정보 마스킹</b> — 실장 계정에는 매출 합계·타 직원 연락처 자동 숨김</p>
              <p><i class="fas fa-check text-emerald-400 mr-2"></i><b class="text-surface-200">암호화 통신</b> — 전 구간 HTTPS, 비밀번호는 복호화 불가능한 해시로 저장</p>
            </div>
          </section>

          {/* ============ 19. 권한 ============ */}
          <section>
            <SectionTitle id="g-roles" icon="fa-key" badge="STEP 19" title="권한 — 원장 vs 실장 한눈에" />
            <div class="overflow-x-auto rounded-2xl border border-white/10">
              <table class="w-full text-sm">
                <thead><tr class="bg-white/5 text-surface-300"><th class="table-th">기능</th><th class="table-th text-center">원장 (admin)</th><th class="table-th text-center">실장 (staff)</th></tr></thead>
                <tbody class="divide-y divide-white/5 text-surface-400">
                  <tr><td class="table-td">상담 녹음 · AI 분석 · 환자 관리</td><td class="table-td text-center text-emerald-400">✓</td><td class="table-td text-center text-emerald-400">✓</td></tr>
                  <tr><td class="table-td">오늘의 액션 · 리텐션 · 캘린더</td><td class="table-td text-center text-emerald-400">✓</td><td class="table-td text-center text-emerald-400">✓</td></tr>
                  <tr><td class="table-td">터치 리포트 생성·검수·발송</td><td class="table-td text-center text-emerald-400">✓</td><td class="table-td text-center text-emerald-400">✓</td></tr>
                  <tr><td class="table-td">내 성장 추적 (/growth)</td><td class="table-td text-center text-emerald-400">✓</td><td class="table-td text-center text-emerald-400">✓</td></tr>
                  <tr><td class="table-td">원장 대시보드 (/admin) · 직원 성과 비교</td><td class="table-td text-center text-emerald-400">✓</td><td class="table-td text-center text-rose-400">✗</td></tr>
                  <tr><td class="table-td">팀 관리 (추가/역할/삭제)</td><td class="table-td text-center text-emerald-400">✓</td><td class="table-td text-center text-rose-400">✗</td></tr>
                  <tr><td class="table-td">AI 사용량/비용 · 데이터 내보내기 · 개인정보 설정</td><td class="table-td text-center text-emerald-400">✓</td><td class="table-td text-center text-rose-400">✗</td></tr>
                  <tr><td class="table-td">팀원 목록에서 매출·연락처 열람</td><td class="table-td text-center text-emerald-400">✓</td><td class="table-td text-center text-rose-400">마스킹</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ============ 20. 구독 ============ */}
          <section>
            <SectionTitle id="g-billing" icon="fa-credit-card" badge="STEP 20" title="무료 체험과 구독"
              desc="투명하게 말씀드립니다." />
            <div class="space-y-3 text-sm text-surface-400">
              <p><i class="fas fa-circle-info text-brand-400 mr-2"></i>가입 즉시 <b class="text-surface-200">30일 무료 체험</b>이 시작됩니다. 카드 등록 없음, 자동 결제 없음.</p>
              <p><i class="fas fa-circle-info text-brand-400 mr-2"></i>남은 기간은 홈 상단 배너와 설정 → 구독 상태에서 <b class="text-surface-200">D-n</b>으로 확인합니다. 7일 이하가 되면 배너 색이 바뀌어 알려드립니다.</p>
              <p><i class="fas fa-circle-info text-brand-400 mr-2"></i>체험이 끝나면? <b class="text-surface-200">데이터는 절대 잠기지 않습니다.</b> 조회는 계속 가능한 <b class="text-surface-200">읽기 전용 모드</b>가 되고, 새 녹음·수정만 제한됩니다. 구독하면 그 자리에서 전부 다시 열립니다.</p>
              <p><i class="fas fa-circle-info text-brand-400 mr-2"></i>요금제·도입 문의: <a href="/welcome#pricing-section" class="text-brand-300 underline">요금제 안내</a> 또는 <a href="/welcome#lead-section" class="text-brand-300 underline">도입 문의</a>를 남겨주세요.</p>
            </div>
          </section>

          {/* ============ 21. PWA ============ */}
          <section>
            <SectionTitle id="g-pwa" icon="fa-mobile-screen" badge="STEP 21" title="홈 화면에 앱처럼 설치"
              desc="앱스토어 다운로드 없이, 브라우저에서 바로 설치됩니다." />
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="rounded-2xl bg-white/5 border border-white/10 p-5">
                <p class="text-white font-bold mb-2"><i class="fab fa-apple mr-2"></i>아이폰 (Safari)</p>
                <p class="text-surface-400 text-sm leading-relaxed">patienttouch.kr 접속 → 하단 <b class="text-surface-200">공유 버튼</b> <i class="fas fa-arrow-up-from-bracket text-xs"></i> → <b class="text-surface-200">홈 화면에 추가</b></p>
              </div>
              <div class="rounded-2xl bg-white/5 border border-white/10 p-5">
                <p class="text-white font-bold mb-2"><i class="fab fa-android mr-2"></i>안드로이드 (Chrome)</p>
                <p class="text-surface-400 text-sm leading-relaxed">patienttouch.kr 접속 → 우상단 <b class="text-surface-200">⋮ 메뉴</b> → <b class="text-surface-200">홈 화면에 추가</b> (또는 자동으로 뜨는 설치 배너)</p>
              </div>
            </div>
            <p class="text-surface-400 text-sm mt-4">설치하면 전체 화면 앱으로 열리고, 아침 브리핑 푸시 알림도 받을 수 있습니다.</p>
          </section>

          {/* ============ 22. FAQ ============ */}
          <section>
            <SectionTitle id="g-faq" icon="fa-circle-question" badge="STEP 22" title="자주 묻는 질문" />
            <div class="space-y-3">
              <details class="faq-item"><summary class="faq-q">녹음하다 앱이 꺼지면 다 날아가나요?</summary><p class="faq-a">아닙니다. 녹음은 60초 단위로 실시간 업로드되어, 꺼진 시점까지의 내용은 안전하게 저장·분석됩니다. 유실된 구간이 있으면 어디가 빠졌는지 화면에 투명하게 표시됩니다.</p></details>
              <details class="faq-item"><summary class="faq-q">AI 분석이 얼마나 걸리나요?</summary><p class="faq-a">보통 상담 길이에 따라 수 분 내외입니다. 진행률이 실시간 표시되고, 화면을 닫아도 분석은 서버에서 계속 진행됩니다.</p></details>
              <details class="faq-item"><summary class="faq-q">실장이 여러 명인데 각자 자기 상담만 보나요?</summary><p class="faq-a">기본은 병원 전체 상담을 함께 보되, 상담 목록의 '내 상담만' 필터로 자기 것만 볼 수 있습니다. 성장 추적(/growth)은 본인 점수 기준입니다.</p></details>
              <details class="faq-item"><summary class="faq-q">환자 녹음 동의는 어떻게 받아야 하나요?</summary><p class="faq-a">녹음 시작 전 화면에 동의 안내 문구가 뜨며, 환자에게 고지 후 진행하는 절차가 내장되어 있습니다. 문구는 설정에서 병원 상황에 맞게 수정하세요.</p></details>
              <details class="faq-item"><summary class="faq-q">터치 리포트에 잘못된 금액이 나가면 어쩌죠?</summary><p class="faq-a">그래서 검수 단계가 필수입니다. AI가 생성한 리포트의 금액·치료명·날짜에는 검증 플래그가 붙고, 실장님이 전부 확인·해소해야만 발송 버튼이 활성화됩니다.</p></details>
              <details class="faq-item"><summary class="faq-q">체험 끝나면 데이터가 사라지나요?</summary><p class="faq-a">아니요. 읽기 전용 모드로 전환될 뿐 데이터는 안전하게 보관됩니다. 언제든 다시 구독하면 그대로 이어서 쓸 수 있습니다.</p></details>
              <details class="faq-item"><summary class="faq-q">기존에 다른 프로그램 쓰던 환자 명단을 옮길 수 있나요?</summary><p class="faq-a">도입 문의를 남겨주시면 환자 명단 이관을 도와드립니다. 반대로 내보내기는 설정 → 데이터 내보내기에서 언제든 CSV로 직접 받을 수 있습니다.</p></details>
              <details class="faq-item"><summary class="faq-q">문의는 어디로 하나요?</summary><p class="faq-a">설정 → 앱 정보의 문의처 또는 <a href="/welcome#lead-section" class="text-brand-300 underline">도입 문의 폼</a>으로 남겨주세요.</p></details>
            </div>
          </section>

          {/* ===== CTA ===== */}
          <section class="text-center pt-4">
            <div class="rounded-3xl bg-gradient-to-br from-brand-600/20 to-accent-fuchsia/10 border border-brand-500/25 p-10">
              <h2 class="text-2xl md:text-3xl font-black text-white mb-3">읽는 것보다 써보는 게 빠릅니다</h2>
              <p class="text-surface-400 mb-6">가입 30초, 카드 등록 없음. 오늘 첫 상담부터 녹음해 보세요.</p>
              <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a href="/register" class="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-brand text-white font-bold hover:shadow-xl hover:shadow-brand-600/30 active:scale-[0.97] transition-all">
                  <i class="fas fa-rocket mr-2"></i>30일 무료로 시작하기
                </a>
                <a href="/welcome" class="w-full sm:w-auto px-8 py-4 rounded-2xl border border-white/10 hover:border-brand-500/30 bg-white/5 text-surface-300 hover:text-white font-semibold transition-all">서비스 소개 보기</a>
              </div>
            </div>
          </section>
        </main>

        {/* ===== Footer ===== */}
        <footer class="border-t border-white/5 py-8 text-center text-surface-500 text-sm">
          <p>© 2026 Patient Touch · <a href="/terms" class="hover:text-surface-300">이용약관</a> · <a href="/privacy-policy" class="hover:text-surface-300">개인정보처리방침</a></p>
        </footer>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .toc-link { display:flex; align-items:center; gap:.5rem; padding:.5rem .75rem; border-radius:.75rem; color:rgb(148 163 184); transition:all .15s; }
        .toc-link:hover { background:rgba(124,77,255,.12); color:#fff; }
        .code-chip { background:rgba(124,77,255,.15); border:1px solid rgba(124,77,255,.3); color:#bda6ff; padding:.1rem .45rem; border-radius:.4rem; font-size:.8em; }
        .guide-check { display:flex; align-items:flex-start; gap:.6rem; }
        .guide-check i { margin-top:.2rem; }
        .feature-card { display:flex; gap:.8rem; align-items:flex-start; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:1rem; padding:1rem; }
        .feature-card > i { font-size:1.1rem; margin-top:.15rem; }
        .table-th { text-align:left; padding:.7rem .9rem; font-weight:700; font-size:.8rem; }
        .table-td { padding:.65rem .9rem; vertical-align:top; }
        .badge-admin { display:inline-block; font-size:.65rem; font-weight:800; color:#fbbf24; background:rgba(251,191,36,.12); border:1px solid rgba(251,191,36,.3); border-radius:9999px; padding:.05rem .45rem; margin-left:.3rem; vertical-align:middle; }
        .faq-item { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:1rem; padding:1rem 1.25rem; }
        .faq-q { color:#fff; font-weight:700; cursor:pointer; font-size:.95rem; list-style:none; }
        .faq-q::-webkit-details-marker { display:none; }
        .faq-q::before { content:'Q. '; color:#9d75ff; font-weight:900; }
        .faq-a { color:rgb(148 163 184); font-size:.875rem; line-height:1.7; margin-top:.6rem; }
        .faq-a::before { content:'A. '; color:#34d399; font-weight:900; }
        html { scroll-behavior:smooth; }
      ` }} />
    </div>
  )
}
