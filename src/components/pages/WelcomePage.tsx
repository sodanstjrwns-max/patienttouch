import { FC } from 'hono/jsx'

export const WelcomePage: FC = () => {
  return (
    <div class="min-h-screen relative overflow-x-hidden">
      {/* Animated background */}
      <div class="fixed inset-0 bg-aurora-dark">
        <div class="absolute inset-0 opacity-30" style="background-image: url(&quot;data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(124,77,255,0.1)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E&quot;)" />
        <div class="absolute top-20 -left-32 w-96 h-96 bg-brand-500/25 rounded-full blur-3xl animate-float" />
        <div class="absolute bottom-20 -right-32 w-80 h-80 bg-accent-cyan/15 rounded-full blur-3xl animate-float" style="animation-delay: -3s" />
        <div class="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent-fuchsia/10 rounded-full blur-3xl" />
      </div>

      <div class="relative z-10">
        {/* ===== Nav ===== */}
        <nav class="sticky top-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/5">
          <div class="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
            <a href="/welcome" class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-lg shadow-brand-600/30">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-white">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" opacity="0.9"/>
                  <path d="M8 11h8M12 8v6" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
                </svg>
              </div>
              <span class="text-white font-black tracking-tight">Patient <span class="text-gradient">Touch</span></span>
            </a>
            <div class="hidden md:flex items-center gap-6 text-sm font-medium text-surface-400">
              <a href="#features-section" class="hover:text-white transition-colors">기능</a>
              <a href="#roi-section" class="hover:text-white transition-colors">ROI</a>
              <a href="#pricing-section" class="hover:text-white transition-colors">요금제</a>
              <a href="#faq-section" class="hover:text-white transition-colors">FAQ</a>
            </div>
            <div class="flex items-center gap-2.5">
              <a href="/login" class="px-4 py-2 rounded-xl text-sm font-semibold text-surface-300 hover:text-white border border-white/10 hover:border-white/25 bg-white/5 transition-all">로그인</a>
              <a href="#lead-section" class="px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-brand hover:shadow-lg hover:shadow-brand-600/30 transition-all">도입 문의</a>
            </div>
          </div>
        </nav>

        {/* ===== Hero ===== */}
        <header id="hero-section" class="max-w-6xl mx-auto px-5 pt-16 pb-20 text-center">
          <div class="animate-fade-in">
            <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/25 text-brand-300 text-xs font-bold tracking-wide mb-6">
              <i class="fas fa-fire text-amber-400"></i>
              파운더 50 — 첫 50개 병원 평생 30% 할인 <span id="founderCountBadge" class="text-amber-300"></span>
            </div>
            <h1 class="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight mb-5">
              놓친 상담 한 건이<br />
              <span class="text-gradient">임플란트 한 건</span>입니다
            </h1>
            <p class="text-surface-400 text-base md:text-lg max-w-2xl mx-auto mb-3">
              상담 녹음 → AI 분석 → 원장 코칭 → 미동의 환자 리콜까지.<br class="hidden md:block" />
              치과 상담실의 모든 순간을 매출 엔진으로 바꿉니다.
            </p>
            <p class="text-surface-500 text-sm font-medium tracking-wide mb-9">"찾는 건 기계가, 연락은 사람이"</p>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="#lead-section" class="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-brand text-white font-bold text-base hover:shadow-xl hover:shadow-brand-600/30 active:scale-[0.97] transition-all btn-glow">
                <i class="fas fa-rocket mr-2"></i>파운더 50 신청하기
              </a>
              <a href="/login" class="w-full sm:w-auto px-8 py-4 rounded-2xl border border-white/10 hover:border-brand-500/30 bg-white/5 hover:bg-brand-500/10 text-surface-300 hover:text-white font-semibold transition-all">
                <i class="fas fa-play mr-2 text-brand-400"></i>데모 체험하기
              </a>
            </div>
          </div>

          {/* Stats strip */}
          <div class="mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 animate-slide-up" style="animation-delay:0.15s">
            <div class="glass-dark rounded-2xl p-5">
              <p class="text-2xl md:text-3xl font-black text-gradient">62%</p>
              <p class="text-surface-500 text-xs mt-1 font-medium">상담 전환율 달성 사례</p>
            </div>
            <div class="glass-dark rounded-2xl p-5">
              <p class="text-2xl md:text-3xl font-black text-gradient">2.1배</p>
              <p class="text-surface-500 text-xs mt-1 font-medium">평균 매출 성장</p>
            </div>
            <div class="glass-dark rounded-2xl p-5">
              <p class="text-2xl md:text-3xl font-black text-gradient">40%</p>
              <p class="text-surface-500 text-xs mt-1 font-medium">광고비 절감</p>
            </div>
            <div class="glass-dark rounded-2xl p-5">
              <p class="text-2xl md:text-3xl font-black text-gradient">6,000+</p>
              <p class="text-surface-500 text-xs mt-1 font-medium">페이션트 퍼널 수료 원장</p>
            </div>
          </div>
          <p class="text-surface-600 text-[11px] mt-3">* 페이션트 퍼널 교육 적용 병원 기준 성과 데이터</p>
        </header>

        {/* ===== Pain Points ===== */}
        <section id="pain-section" class="max-w-6xl mx-auto px-5 py-16">
          <h2 class="text-2xl md:text-4xl font-black text-white text-center tracking-tight mb-3">
            원장님, 이런 경험 있으시죠?
          </h2>
          <p class="text-surface-500 text-center text-sm mb-10">상담실에서 매일 새어나가는 매출, 지금은 아무도 모릅니다</p>
          <div class="grid md:grid-cols-3 gap-4">
            <article class="glass-dark rounded-3xl p-6">
              <div class="w-12 h-12 rounded-2xl bg-rose-500/15 flex items-center justify-center mb-4">
                <i class="fas fa-comment-slash text-rose-400 text-lg"></i>
              </div>
              <h3 class="text-white font-bold text-lg mb-2">상담실은 블랙박스</h3>
              <p class="text-surface-400 text-sm leading-relaxed">실장이 뭐라고 상담했는지, 왜 환자가 동의하지 않았는지 원장은 알 길이 없습니다. 상담 품질은 감으로만 관리됩니다.</p>
            </article>
            <article class="glass-dark rounded-3xl p-6">
              <div class="w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center mb-4">
                <i class="fas fa-user-clock text-amber-400 text-lg"></i>
              </div>
              <h3 class="text-white font-bold text-lg mb-2">"생각해볼게요" 환자의 증발</h3>
              <p class="text-surface-400 text-sm leading-relaxed">미동의 환자의 70%는 다시 연락받지 못합니다. 광고비로 어렵게 모셔온 환자가 팔로업 없이 경쟁 병원으로 흘러갑니다.</p>
            </article>
            <article class="glass-dark rounded-3xl p-6">
              <div class="w-12 h-12 rounded-2xl bg-sky-500/15 flex items-center justify-center mb-4">
                <i class="fas fa-graduation-cap text-sky-400 text-lg"></i>
              </div>
              <h3 class="text-white font-bold text-lg mb-2">코칭할 시간도 근거도 없다</h3>
              <p class="text-surface-400 text-sm leading-relaxed">신입 상담자 교육은 어깨너머 배움이 전부. 잘하는 실장의 노하우는 기록되지 않고, 퇴사와 함께 사라집니다.</p>
            </article>
          </div>
        </section>

        {/* ===== Features ===== */}
        <section id="features-section" class="max-w-6xl mx-auto px-5 py-16">
          <h2 class="text-2xl md:text-4xl font-black text-white text-center tracking-tight mb-3">
            녹음부터 리콜까지, <span class="text-gradient">풀사이클</span>
          </h2>
          <p class="text-surface-500 text-center text-sm mb-10">전화 상담만 분석하는 툴과 다릅니다. 대면 상담의 전 과정을 커버합니다.</p>
          <div class="grid md:grid-cols-2 gap-4">
            <article class="glass-dark rounded-3xl p-7 relative overflow-hidden">
              <div class="absolute -top-6 -right-6 text-[100px] font-black text-white/[0.03] select-none">1</div>
              <div class="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center mb-4 shadow-lg shadow-brand-600/25">
                <i class="fas fa-microphone text-white"></i>
              </div>
              <h3 class="text-white font-bold text-lg mb-2">원터치 상담 녹음</h3>
              <p class="text-surface-400 text-sm leading-relaxed">PWA 앱에서 버튼 하나로 대면 상담 녹음. 환자 동의 안내문 자동 표시, 녹음 파일은 암호화되어 안전하게 보관됩니다.</p>
            </article>
            <article class="glass-dark rounded-3xl p-7 relative overflow-hidden">
              <div class="absolute -top-6 -right-6 text-[100px] font-black text-white/[0.03] select-none">2</div>
              <div class="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center mb-4 shadow-lg shadow-brand-600/25">
                <i class="fas fa-wand-magic-sparkles text-white"></i>
              </div>
              <h3 class="text-white font-bold text-lg mb-2">AI 상담 분석 & 스코어링</h3>
              <p class="text-surface-400 text-sm leading-relaxed">전사 → 요약 → 치료 항목/금액 추출 → 동의 여부 판정 → 상담 품질 점수까지 자동. 원문 키워드 검색으로 어떤 상담이든 3초 안에 찾습니다.</p>
            </article>
            <article class="glass-dark rounded-3xl p-7 relative overflow-hidden">
              <div class="absolute -top-6 -right-6 text-[100px] font-black text-white/[0.03] select-none">3</div>
              <div class="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center mb-4 shadow-lg shadow-brand-600/25">
                <i class="fas fa-chalkboard-user text-white"></i>
              </div>
              <h3 class="text-white font-bold text-lg mb-2">데이터 기반 원장 코칭</h3>
              <p class="text-surface-400 text-sm leading-relaxed">상담자별 전환율·강점·개선점을 대시보드로. 잘된 상담은 팀의 교과서가 되고, 아쉬운 상담은 구체적 코칭 포인트가 됩니다.</p>
            </article>
            <article class="glass-dark rounded-3xl p-7 relative overflow-hidden">
              <div class="absolute -top-6 -right-6 text-[100px] font-black text-white/[0.03] select-none">4</div>
              <div class="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center mb-4 shadow-lg shadow-brand-600/25">
                <i class="fas fa-bell text-white"></i>
              </div>
              <h3 class="text-white font-bold text-lg mb-2">미동의 환자 리텐션 엔진</h3>
              <p class="text-surface-400 text-sm leading-relaxed">미동의·보류 환자를 자동 추적하고 최적 시점에 리콜 알림. 매일 아침 브리핑으로 오늘 연락할 환자를 알려드립니다. 찾는 건 기계가, 연락은 사람이.</p>
            </article>
          </div>
          {/* Compliance strip */}
          <div class="mt-4 glass-dark rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6">
            <div class="flex items-center gap-2.5 shrink-0">
              <i class="fas fa-shield-halved text-emerald-400"></i>
              <span class="text-white font-bold text-sm">의료정보 컴플라이언스 내장</span>
            </div>
            <p class="text-surface-500 text-xs leading-relaxed">녹음 동의 게이트 · 보관기간 자동 파기 · 환자 데이터 완전 삭제(잊힐 권리) · 전체 감사 로그 — 개인정보보호법 대응 기능이 기본 탑재되어 있습니다.</p>
          </div>
        </section>

        {/* ===== ROI ===== */}
        <section id="roi-section" class="max-w-6xl mx-auto px-5 py-16">
          <div class="glass-dark rounded-3xl p-8 md:p-12 relative overflow-hidden">
            <div class="absolute -top-20 -right-20 w-72 h-72 bg-brand-500/15 rounded-full blur-3xl" />
            <div class="relative">
              <h2 class="text-2xl md:text-4xl font-black text-white tracking-tight mb-3">
                한 달에 <span class="text-gradient">단 한 건</span>만 더 살려도
              </h2>
              <p class="text-surface-400 text-sm mb-8 max-w-xl">임플란트 1건 평균 진료비 150~400만원. 월 100건 상담하는 병원이 전환율을 5%p만 올리면 어떻게 될까요?</p>
              <div class="grid md:grid-cols-3 gap-4 mb-8">
                <div class="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <p class="text-surface-500 text-xs font-semibold uppercase tracking-wide mb-2">전환율 +5%p 효과</p>
                  <p class="text-3xl font-black text-white">월 5건 <span class="text-base text-surface-400 font-semibold">추가 동의</span></p>
                  <p class="text-surface-500 text-xs mt-2">월 100건 상담 기준</p>
                </div>
                <div class="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <p class="text-surface-500 text-xs font-semibold uppercase tracking-wide mb-2">추가 매출</p>
                  <p class="text-3xl font-black text-gradient">월 +750만원</p>
                  <p class="text-surface-500 text-xs mt-2">건당 150만원 보수적 추정</p>
                </div>
                <div class="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <p class="text-surface-500 text-xs font-semibold uppercase tracking-wide mb-2">투자 대비 수익</p>
                  <p class="text-3xl font-black text-emerald-400">ROI 25배+</p>
                  <p class="text-surface-500 text-xs mt-2">Growth 요금 29만원 기준</p>
                </div>
              </div>
              <p class="text-surface-500 text-xs">여기에 미동의 환자 리콜 회수, 광고비 절감, 상담자 교육 비용 절감까지 더해집니다.</p>
            </div>
          </div>
        </section>

        {/* ===== Pricing ===== */}
        <section id="pricing-section" class="max-w-6xl mx-auto px-5 py-16">
          <h2 class="text-2xl md:text-4xl font-black text-white text-center tracking-tight mb-3">
            병원 규모에 맞는 <span class="text-gradient">요금제</span>
          </h2>
          <p class="text-surface-500 text-center text-sm mb-4">인원수 과금이 아닌 <strong class="text-surface-300">병원 단위 정액제</strong>. 직원이 몇 명이든 요금은 그대로.</p>

          {/* Founder 50 banner */}
          <div class="max-w-2xl mx-auto mb-10 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-brand-500/10 p-5 text-center">
            <p class="text-amber-300 font-black text-lg mb-1"><i class="fas fa-crown mr-2"></i>파운더 50 프로모션</p>
            <p class="text-surface-300 text-sm">첫 50개 병원에게 <strong class="text-white">평생 30% 할인</strong> — 해지 전까지 영구 적용</p>
            <p id="founderCounter" class="text-amber-400 text-xs font-bold mt-2">
              <i class="fas fa-circle-notch fa-spin mr-1"></i>잔여 슬롯 확인 중...
            </p>
          </div>

          <div class="grid md:grid-cols-3 gap-4 items-stretch">
            {/* Starter */}
            <article class="glass-dark rounded-3xl p-7 flex flex-col">
              <h3 class="text-white font-bold text-lg">Starter</h3>
              <p class="text-surface-500 text-xs mt-1 mb-5">개원 초기 · 1인 원장 병원</p>
              <div class="mb-1">
                <span class="text-surface-500 text-sm line-through mr-2">149,000원</span>
                <span class="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-full px-2 py-0.5">파운더 -30%</span>
              </div>
              <p class="mb-5"><span class="text-3xl font-black text-white">104,300원</span><span class="text-surface-500 text-sm"> /월</span></p>
              <ul class="space-y-2.5 text-sm text-surface-300 flex-1">
                <li><i class="fas fa-check text-emerald-400 mr-2"></i>월 상담 분석 40건</li>
                <li><i class="fas fa-check text-emerald-400 mr-2"></i>사용자 3명</li>
                <li><i class="fas fa-check text-emerald-400 mr-2"></i>녹음 + AI 분석 + 요약</li>
                <li><i class="fas fa-check text-emerald-400 mr-2"></i>미동의 환자 리콜 알림</li>
                <li><i class="fas fa-check text-emerald-400 mr-2"></i>컴플라이언스 기본 기능</li>
              </ul>
              <button data-plan="starter" class="plan-select-btn mt-6 w-full py-3 rounded-xl border border-white/10 hover:border-brand-500/40 bg-white/5 hover:bg-brand-500/10 text-white font-bold text-sm transition-all active:scale-[0.97]">Starter 문의하기</button>
            </article>

            {/* Growth */}
            <article class="rounded-3xl p-7 flex flex-col relative bg-gradient-to-b from-brand-500/15 to-brand-900/20 border-2 border-brand-500/50 shadow-xl shadow-brand-600/20">
              <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-brand text-white text-xs font-black tracking-wide shadow-lg">가장 인기 ⭐</div>
              <h3 class="text-white font-bold text-lg">Growth</h3>
              <p class="text-surface-400 text-xs mt-1 mb-5">성장기 병원 · 상담실장 운영</p>
              <div class="mb-1">
                <span class="text-surface-500 text-sm line-through mr-2">290,000원</span>
                <span class="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-full px-2 py-0.5">파운더 -30%</span>
              </div>
              <p class="mb-5"><span class="text-3xl font-black text-gradient">203,000원</span><span class="text-surface-500 text-sm"> /월</span></p>
              <ul class="space-y-2.5 text-sm text-surface-200 flex-1">
                <li><i class="fas fa-check text-brand-400 mr-2"></i>월 상담 분석 120건</li>
                <li><i class="fas fa-check text-brand-400 mr-2"></i>사용자 10명</li>
                <li><i class="fas fa-check text-brand-400 mr-2"></i>Starter 전체 기능</li>
                <li><i class="fas fa-check text-brand-400 mr-2"></i>상담자별 코칭 대시보드</li>
                <li><i class="fas fa-check text-brand-400 mr-2"></i>원문 키워드 검색</li>
                <li><i class="fas fa-check text-brand-400 mr-2"></i>매일 아침 자동 브리핑</li>
              </ul>
              <button data-plan="growth" class="plan-select-btn mt-6 w-full py-3 rounded-xl bg-gradient-brand text-white font-bold text-sm hover:shadow-lg hover:shadow-brand-600/40 transition-all active:scale-[0.97] btn-glow">Growth 문의하기</button>
            </article>

            {/* Enterprise */}
            <article class="glass-dark rounded-3xl p-7 flex flex-col">
              <h3 class="text-white font-bold text-lg">Enterprise</h3>
              <p class="text-surface-500 text-xs mt-1 mb-5">대형 · 네트워크 병원</p>
              <div class="mb-1">
                <span class="text-surface-500 text-sm line-through mr-2">590,000원~</span>
                <span class="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-full px-2 py-0.5">파운더 -30%</span>
              </div>
              <p class="mb-5"><span class="text-3xl font-black text-white">413,000원~</span><span class="text-surface-500 text-sm"> /월</span></p>
              <ul class="space-y-2.5 text-sm text-surface-300 flex-1">
                <li><i class="fas fa-check text-emerald-400 mr-2"></i>상담 분석 무제한</li>
                <li><i class="fas fa-check text-emerald-400 mr-2"></i>사용자 무제한</li>
                <li><i class="fas fa-check text-emerald-400 mr-2"></i>Growth 전체 기능</li>
                <li><i class="fas fa-check text-emerald-400 mr-2"></i>다지점 통합 관리</li>
                <li><i class="fas fa-check text-emerald-400 mr-2"></i>전담 온보딩 매니저</li>
                <li><i class="fas fa-check text-emerald-400 mr-2"></i>페이션트 퍼널 연계 컨설팅</li>
              </ul>
              <button data-plan="enterprise" class="plan-select-btn mt-6 w-full py-3 rounded-xl border border-white/10 hover:border-brand-500/40 bg-white/5 hover:bg-brand-500/10 text-white font-bold text-sm transition-all active:scale-[0.97]">Enterprise 문의하기</button>
            </article>
          </div>
          <p class="text-surface-600 text-[11px] text-center mt-4">모든 요금은 VAT 별도, 병원(사업자) 단위 과금 · 플랜 한도 초과 상담은 건당 2,000원 · 연 결제 시 2개월 무료</p>
        </section>

        {/* ===== Lead Form ===== */}
        <section id="lead-section" class="max-w-3xl mx-auto px-5 py-16">
          <div class="glass-dark rounded-3xl p-8 md:p-10">
            <div class="text-center mb-8">
              <h2 class="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">도입 문의</h2>
              <p class="text-surface-400 text-sm">영업일 기준 1일 내에 연락드립니다. 파운더 50 슬롯은 문의 순서대로 배정됩니다.</p>
            </div>
            <form id="leadForm" class="space-y-5">
              <div class="grid md:grid-cols-2 gap-5">
                <div>
                  <label class="block text-xs font-semibold text-surface-400 mb-2 tracking-wide uppercase">병원명 *</label>
                  <input type="text" id="clinicName" name="clinic_name" required placeholder="OO치과의원"
                    class="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-surface-500 outline-none transition-all focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-surface-400 mb-2 tracking-wide uppercase">담당자 성함 *</label>
                  <input type="text" id="contactName" name="contact_name" required placeholder="홍길동 원장"
                    class="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-surface-500 outline-none transition-all focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-surface-400 mb-2 tracking-wide uppercase">연락처 *</label>
                  <input type="tel" id="leadPhone" name="phone" required placeholder="010-0000-0000"
                    class="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-surface-500 outline-none transition-all focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-surface-400 mb-2 tracking-wide uppercase">이메일</label>
                  <input type="email" id="leadEmail" name="email" placeholder="email@example.com"
                    class="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-surface-500 outline-none transition-all focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-surface-400 mb-2 tracking-wide uppercase">관심 요금제</label>
                  <select id="planInterest" name="plan_interest"
                    class="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none transition-all focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20">
                    <option value="starter" class="bg-surface-900">Starter (월 40건)</option>
                    <option value="growth" class="bg-surface-900" selected>Growth (월 120건) ⭐</option>
                    <option value="enterprise" class="bg-surface-900">Enterprise (무제한)</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-surface-400 mb-2 tracking-wide uppercase">월 상담 건수</label>
                  <select id="monthlyConsultations" name="monthly_consultations"
                    class="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none transition-all focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20">
                    <option value="~40" class="bg-surface-900">40건 이하</option>
                    <option value="40-120" class="bg-surface-900" selected>40 ~ 120건</option>
                    <option value="120+" class="bg-surface-900">120건 이상</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-xs font-semibold text-surface-400 mb-2 tracking-wide uppercase">문의 내용</label>
                <textarea id="leadMessage" name="message" rows={3} placeholder="궁금한 점을 자유롭게 남겨주세요"
                  class="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-surface-500 outline-none transition-all focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 resize-none"></textarea>
              </div>

              <div id="leadError" class="hidden text-rose-400 text-sm text-center py-2 px-4 bg-rose-500/10 rounded-xl border border-rose-500/20">
                <i class="fas fa-circle-exclamation mr-1.5"></i><span id="leadErrorText"></span>
              </div>

              <button type="submit" id="leadSubmitBtn"
                class="w-full bg-gradient-brand text-white font-bold py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-brand-600/30 active:scale-[0.97] btn-glow">
                <span id="leadBtnText"><i class="fas fa-paper-plane mr-2"></i>도입 문의 보내기</span>
                <span id="leadBtnLoading" class="hidden"><i class="fas fa-circle-notch fa-spin mr-2"></i>전송 중...</span>
              </button>
              <p class="text-surface-600 text-[11px] text-center">문의 접수 시 개인정보는 상담 목적으로만 이용되며, 상담 완료 후 파기됩니다.</p>
            </form>

            {/* Success state */}
            <div id="leadSuccess" class="hidden text-center py-10">
              <div class="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
                <i class="fas fa-check text-emerald-400 text-2xl"></i>
              </div>
              <h3 class="text-white font-black text-xl mb-2">문의가 접수되었습니다!</h3>
              <p class="text-surface-400 text-sm mb-6">영업일 기준 1일 내에 담당자가 연락드립니다.<br />파운더 50 슬롯을 우선 배정해드릴게요. 🎉</p>
              <a href="/login" class="inline-block px-6 py-3 rounded-xl border border-white/10 hover:border-brand-500/30 bg-white/5 hover:bg-brand-500/10 text-surface-300 hover:text-white font-semibold text-sm transition-all">
                <i class="fas fa-play mr-2 text-brand-400"></i>기다리는 동안 데모 체험하기
              </a>
            </div>
          </div>
        </section>

        {/* ===== FAQ ===== */}
        <section id="faq-section" class="max-w-3xl mx-auto px-5 py-16">
          <h2 class="text-2xl md:text-3xl font-black text-white text-center tracking-tight mb-10">자주 묻는 질문</h2>
          <div class="space-y-3">
            <details class="glass-dark rounded-2xl p-5 group">
              <summary class="text-white font-bold text-sm cursor-pointer list-none flex items-center justify-between">
                환자 상담 녹음, 법적으로 괜찮은가요?
                <i class="fas fa-chevron-down text-surface-500 text-xs group-open:rotate-180 transition-transform"></i>
              </summary>
              <p class="text-surface-400 text-sm mt-3 leading-relaxed">대화 당사자가 참여한 녹음은 통신비밀보호법상 합법입니다. 페이션트 터치는 여기에 더해 녹음 전 환자 동의 안내 게이트, 보관기간 자동 파기, 완전 삭제(잊힐 권리), 감사 로그까지 내장해 개인정보보호법 기준으로 안전하게 운영하실 수 있습니다.</p>
            </details>
            <details class="glass-dark rounded-2xl p-5 group">
              <summary class="text-white font-bold text-sm cursor-pointer list-none flex items-center justify-between">
                직원 수가 많으면 요금이 올라가나요?
                <i class="fas fa-chevron-down text-surface-500 text-xs group-open:rotate-180 transition-transform"></i>
              </summary>
              <p class="text-surface-400 text-sm mt-3 leading-relaxed">아니요. 인원수 과금이 아닌 병원 단위 정액제입니다. 플랜별 사용자 한도(Starter 3명 / Growth 10명 / Enterprise 무제한) 내에서 직원이 늘어도 요금은 동일합니다.</p>
            </details>
            <details class="glass-dark rounded-2xl p-5 group">
              <summary class="text-white font-bold text-sm cursor-pointer list-none flex items-center justify-between">
                월 상담 건수 한도를 초과하면 어떻게 되나요?
                <i class="fas fa-chevron-down text-surface-500 text-xs group-open:rotate-180 transition-transform"></i>
              </summary>
              <p class="text-surface-400 text-sm mt-3 leading-relaxed">서비스가 중단되지 않습니다. 초과분은 건당 2,000원으로 정산되며, 초과가 반복되면 상위 플랜 전환을 안내드립니다. 상위 플랜이 대부분 더 저렴합니다.</p>
            </details>
            <details class="glass-dark rounded-2xl p-5 group">
              <summary class="text-white font-bold text-sm cursor-pointer list-none flex items-center justify-between">
                파운더 50 할인은 언제까지 유지되나요?
                <i class="fas fa-chevron-down text-surface-500 text-xs group-open:rotate-180 transition-transform"></i>
              </summary>
              <p class="text-surface-400 text-sm mt-3 leading-relaxed">해지하지 않는 한 평생 30% 할인이 유지됩니다. 플랜을 업그레이드해도 할인율은 그대로 적용됩니다. 첫 50개 병원 한정이며, 문의 접수 순서대로 슬롯이 배정됩니다.</p>
            </details>
            <details class="glass-dark rounded-2xl p-5 group">
              <summary class="text-white font-bold text-sm cursor-pointer list-none flex items-center justify-between">
                도입하면 바로 쓸 수 있나요? 교육이 필요한가요?
                <i class="fas fa-chevron-down text-surface-500 text-xs group-open:rotate-180 transition-transform"></i>
              </summary>
              <p class="text-surface-400 text-sm mt-3 leading-relaxed">설치 없이 웹/PWA로 바로 시작합니다. 가입 후 온보딩 체크리스트가 병원 설정 → 직원 초대 → 첫 녹음까지 단계별로 안내하며, 대부분의 병원이 당일 첫 상담 분석을 시작합니다.</p>
            </details>
          </div>
        </section>

        {/* ===== Bottom CTA ===== */}
        <section id="bottom-cta" class="max-w-4xl mx-auto px-5 py-16 text-center">
          <h2 class="text-2xl md:text-4xl font-black text-white tracking-tight mb-4">
            오늘 놓친 상담, <span class="text-gradient">내일은 살릴 수 있습니다</span>
          </h2>
          <p class="text-surface-400 text-sm mb-8">파운더 50 슬롯이 마감되면 정가로 돌아갑니다.</p>
          <a href="#lead-section" class="inline-block px-10 py-4 rounded-2xl bg-gradient-brand text-white font-bold hover:shadow-xl hover:shadow-brand-600/30 active:scale-[0.97] transition-all btn-glow">
            <i class="fas fa-rocket mr-2"></i>지금 파운더 50 신청하기
          </a>
        </section>

        {/* ===== Footer ===== */}
        <footer class="border-t border-white/5 py-10 text-center">
          <p class="text-surface-500 text-sm font-medium mb-1">Patient <span class="text-gradient font-bold">Touch</span></p>
          <p class="text-surface-600 text-xs mb-3">찾는 건 기계가, 연락은 사람이 · 페이션트퍼널</p>
          <div class="flex items-center justify-center gap-4 text-xs text-surface-600">
            <a href="/login" class="hover:text-surface-400 transition-colors">로그인</a>
            <span>·</span>
            <a href="#pricing-section" class="hover:text-surface-400 transition-colors">요금제</a>
            <span>·</span>
            <a href="#faq-section" class="hover:text-surface-400 transition-colors">FAQ</a>
          </div>
        </footer>
      </div>

      <script src="/static/pages/welcome.js"></script>
    </div>
  )
}
