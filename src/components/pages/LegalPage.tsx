import { FC } from 'hono/jsx'

const LegalLayout: FC<{ title: string; children?: any }> = ({ title, children }) => (
  <div class="min-h-screen relative overflow-x-hidden">
    <div class="fixed inset-0 bg-aurora-dark">
      <div class="absolute top-20 -left-32 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl" />
      <div class="absolute bottom-20 -right-32 w-80 h-80 bg-accent-cyan/10 rounded-full blur-3xl" />
    </div>
    <div class="relative z-10 max-w-3xl mx-auto px-5 py-12">
      <a href="/welcome" class="inline-flex items-center gap-2 text-surface-400 hover:text-white text-sm font-semibold transition-colors mb-8">
        <i class="fas fa-arrow-left text-xs"></i> 페이션트 터치로 돌아가기
      </a>
      <div class="glass-dark rounded-3xl p-8 md:p-10">
        <h1 class="text-2xl md:text-3xl font-black text-white tracking-tight mb-8">{title}</h1>
        <div class="legal-content space-y-6 text-surface-300 text-sm leading-relaxed">
          {children}
        </div>
      </div>
      <p class="text-surface-600 text-xs text-center mt-8">Patient Touch — 페이션트퍼널</p>
    </div>
  </div>
)

const H: FC<{ children?: any }> = ({ children }) => (
  <h2 class="text-white font-bold text-base mt-8 mb-3">{children}</h2>
)

export const PrivacyPolicyPage: FC = () => (
  <LegalLayout title="개인정보처리방침">
    <p>페이션트 터치(이하 "회사")는 「개인정보 보호법」 등 관련 법령을 준수하며, 이용자의 개인정보를 보호하기 위해 다음과 같이 개인정보처리방침을 수립·공개합니다.</p>

    <H>1. 수집하는 개인정보 항목 및 수집 방법</H>
    <p><strong class="text-surface-200">① 도입 문의 (랜딩페이지):</strong> 병원명, 담당자 성함, 연락처, 이메일(선택), 문의 내용 — 이용자가 직접 입력</p>
    <p><strong class="text-surface-200">② 회원가입:</strong> 이메일, 비밀번호(암호화 저장), 성명, 병원명, 연락처(선택) — 이용자가 직접 입력. Google 계정 가입 시 Google이 제공하는 이메일·성명·프로필 식별자</p>
    <p><strong class="text-surface-200">③ 서비스 이용 과정:</strong> 접속 로그, 서비스 이용 기록(감사 로그), 기기 정보(푸시 알림 구독 정보)</p>
    <p><strong class="text-surface-200">④ 환자 정보(병원이 입력하는 정보):</strong> 병원(개인정보처리자)이 환자 성명, 연락처, 상담 녹음·전사·분석 내용을 입력·생성합니다. 이 경우 회사는 「개인정보 보호법」 제26조에 따른 수탁자의 지위에서 해당 정보를 처리하며, 개별 환자에 대한 고지·동의 의무는 병원에 있습니다.</p>

    <H>2. 개인정보의 처리 목적</H>
    <p>· 도입 문의 응대 및 서비스 안내<br />· 회원 식별, 서비스 제공 및 운영<br />· 상담 녹음의 AI 분석·요약·코칭 제공 (병원의 위탁 범위 내)<br />· 서비스 개선 및 보안(부정 이용 방지, 감사 로그)</p>

    <H>3. 보유 및 이용 기간</H>
    <p>· <strong class="text-surface-200">도입 문의 정보:</strong> 상담 완료 후 1년 이내 파기 (이용자 요청 시 즉시 파기)<br />· <strong class="text-surface-200">회원 정보:</strong> 회원 탈퇴 시까지 (관계 법령에 따른 보존 의무가 있는 경우 해당 기간)<br />· <strong class="text-surface-200">상담 전사·녹음:</strong> 병원이 설정한 보관 기간 경과 시 자동 파기. 환자의 삭제 요청 시 병원 관리자가 완전 삭제(잊힐 권리) 기능으로 즉시 파기 가능</p>

    <H>4. 개인정보의 제3자 제공</H>
    <p>회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 이용자가 사전에 동의한 경우, 법령에 의한 경우는 예외로 합니다.</p>

    <H>5. 개인정보 처리의 위탁</H>
    <p>· Cloudflare, Inc. — 서비스 인프라(호스팅, 데이터베이스, 파일 저장) 운영<br />· OpenAI — 상담 녹음의 전사 및 AI 분석 (분석 목적 범위 내 일시 처리)<br />회사는 위탁 계약 시 개인정보 보호 관련 법규 준수, 재위탁 제한, 사고 시 책임 등을 명확히 규정합니다.</p>

    <H>6. 정보주체의 권리와 행사 방법</H>
    <p>이용자는 언제든지 개인정보 열람·정정·삭제·처리정지를 요구할 수 있습니다. 서비스 내 설정 메뉴 또는 아래 연락처를 통해 행사할 수 있으며, 회사는 지체 없이 조치합니다.</p>

    <H>7. 개인정보의 안전성 확보 조치</H>
    <p>· 비밀번호 일방향 암호화 저장<br />· 전송 구간 암호화(HTTPS)<br />· 접근 권한 관리(역할 기반) 및 전체 감사 로그 기록<br />· 보관 기간 경과 데이터 자동 파기 시스템 운영</p>

    <H>8. 개인정보 보호책임자</H>
    <p>· 성명: 문석준<br />· 소속: 페이션트퍼널<br />· 문의: 서비스 내 도입 문의 또는 고객 지원 채널</p>

    <H>9. 방침의 변경</H>
    <p>본 방침은 2026년 7월 4일부터 적용됩니다. 내용의 추가·삭제·수정이 있을 경우 시행 7일 전부터 공지합니다.</p>
  </LegalLayout>
)

export const TermsPage: FC = () => (
  <LegalLayout title="이용약관">
    <H>제1조 (목적)</H>
    <p>본 약관은 페이션트 터치(이하 "회사")가 제공하는 치과 상담 관리 서비스(이하 "서비스")의 이용 조건 및 절차, 회사와 이용자의 권리·의무·책임 사항을 규정함을 목적으로 합니다.</p>

    <H>제2조 (정의)</H>
    <p>· "서비스"란 상담 녹음, AI 분석·요약, 상담 코칭, 환자 리텐션 관리 등 회사가 제공하는 일체의 기능을 말합니다.<br />· "회원"이란 본 약관에 동의하고 계정을 발급받은 병·의원 및 그 소속 구성원을 말합니다.<br />· "관리자"란 병원 단위 계정의 대표 권한자를 말합니다.</p>

    <H>제3조 (약관의 효력 및 변경)</H>
    <p>① 본 약관은 서비스 화면에 게시함으로써 효력이 발생합니다.<br />② 회사는 관련 법령을 위배하지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 적용일 7일 전부터 공지합니다.</p>

    <H>제4조 (서비스의 제공 및 변경)</H>
    <p>① 회사는 연중무휴, 1일 24시간 서비스 제공을 원칙으로 합니다. 다만 시스템 점검 등 운영상 필요한 경우 서비스를 일시 중단할 수 있습니다.<br />② AI 분석 결과는 상담 품질 향상을 위한 참고 자료이며, 의료적 판단 또는 진단을 대체하지 않습니다.</p>

    <H>제5조 (요금 및 결제)</H>
    <p>① 서비스 요금은 병원 단위 월 정액제이며, 요금제별 상세 내용은 서비스 안내 페이지에 게시합니다.<br />② 무료 체험 기간 종료 후 유료 전환 여부는 회원의 선택에 따릅니다.<br />③ 프로모션(파운더 50 등)의 할인 조건은 해당 프로모션 안내에 따르며, 회원이 해지하지 않는 한 유지됩니다.</p>

    <H>제6조 (회원의 의무)</H>
    <p>① 회원은 환자 상담 녹음 시 관련 법령(개인정보 보호법 등)에 따른 고지·동의 절차를 준수해야 합니다. 환자 개인정보의 수집·이용에 대한 법적 책임은 개인정보처리자인 회원(병원)에게 있습니다.<br />② 회원은 계정 정보를 제3자에게 양도·대여할 수 없습니다.<br />③ 회원은 서비스를 이용하여 법령 또는 공서양속에 반하는 행위를 해서는 안 됩니다.</p>

    <H>제7조 (개인정보 보호)</H>
    <p>회사는 관련 법령 및 개인정보처리방침에 따라 회원 및 환자의 개인정보를 보호합니다. 회사는 회원(병원)의 위탁 범위 내에서 환자 정보를 처리하는 수탁자의 지위를 가집니다.</p>

    <H>제8조 (계약 해지 및 데이터 처리)</H>
    <p>① 회원은 언제든지 해지를 요청할 수 있습니다.<br />② 해지 시 회원의 데이터는 30일의 유예 기간 후 완전 삭제됩니다. 유예 기간 내 데이터 내보내기를 요청할 수 있습니다.</p>

    <H>제9조 (책임의 한계)</H>
    <p>① 회사는 천재지변, 기간통신사업자의 서비스 중단 등 불가항력으로 인한 손해에 대해 책임지지 않습니다.<br />② AI 분석 결과의 활용 및 그에 따른 의사결정의 책임은 회원에게 있습니다.</p>

    <H>제10조 (분쟁 해결)</H>
    <p>본 약관과 관련한 분쟁은 대한민국 법률에 따르며, 관할 법원은 민사소송법에 따릅니다.</p>

    <p class="text-surface-500 mt-8">시행일: 2026년 7월 4일</p>
  </LegalLayout>
)
