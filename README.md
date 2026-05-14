# 페이션트 터치 (Patient Touch v7.3)

> **"상담 종료 시 완성된 레포트가 기다리는 원스톱 프로세스"**
> **"찾는 건 기계가, 연락은 사람이"**
> **"한 명의 팬이 다섯 명을 데려온다 — 그 흐름을 그래프로 본다"**

AI 기반 의료기관 상담 CRM + 실시간 STT + 환자용 치료 제안서 + **환자 소개 네트워크 시각화** 통합 서비스

## 현재 상태

- **버전**: 7.3.0 (Referral Network + Hardening)
- **프로덕션 URL**: https://patienttouch.pages.dev
- **기술 스택**: Hono + TypeScript + Cloudflare Pages + D1 Database + R2 Storage + OpenAI + D3.js
- **디자인 시스템**: 글래스모피즘 + Indigo 브랜드 컬러 + 프리미엄 애니메이션 + Chart.js + D3 force-directed graph

## v7.3 신규 기능 (최신)

### 1. 환자 소개 네트워크 시각화 (`/network`)
- **D3 force-directed graph**: 환자 간 소개 관계를 노드/엣지로 시각화
- **K-factor 자동 계산**: 1명당 평균 소개 환자 수 (Patient Funnel 핵심 지표)
- **다운스트림 BFS 카운팅**: 한 환자가 직·간접적으로 데려온 전체 환자 수
- **Top Influencers 사이드바**: 가장 많이 소개한 환자 TOP 10 + 매출 기여도
- **소개 경로별 색상 코딩**: 지인소개(에메랄드) / 네이버광고(앰버) / 인스타(핑크) 등
- **VIP 크라운 배지**: VIP 등급 환자 시각적 강조
- **노드 반경 = 다운스트림 환자 수**: 영향력이 큰 환자가 한눈에 보임
- **사이클 방지**: 부모 체인을 최대 50홉까지 추적해 순환 참조 차단

### 2. v7.3 버그 수정 (코드 리뷰 기반)
- **JWT 시크릿 fallback 보안 경고**: `resolveSecret()` 헬퍼로 16자 미만 시크릿 사용 시 콘솔 경고
- **CSV export double-escape 버그**: 리터럴 `\uFEFF`/`\n` 문자열 → 진짜 BOM/CRLF로 교체
- **CSV 필드 RFC 4180 이스케이프**: 환자 이름에 콤마/따옴표가 들어가도 행이 깨지지 않도록 quoting
- **admin-summary 트렌드 로직**: `prev=0`일 때 트렌드가 숨겨지던 문제 → OR 조건으로 항상 표시
- **마이그레이션 0006 인덱스 컬럼 오타**: `notification_type` → `channel`로 수정 (프로덕션 D1 적용 차단되던 문제)

### 3. v7.3 API 엔드포인트
- `GET /api/patients/network/graph` — 노드/엣지/통계/소개경로분포/TOP인플루언서 반환
- `PUT /api/patients/:id/referrer` — 환자 소개자 설정 (사이클 감지 포함)

## v7.2 최적화 (이전 릴리스)
- Dashboard route 68KB 리팩토링 (Promise.all 병렬화 강화)
- D1 쿼리 인덱스 추가 (마이그레이션 0006: 성능 인덱스 8종)
- 메모 변경 이력 추적 (마이그레이션 0007)

## v5.1 기능 고도화

## v5.1 기능 고도화 (최신)

### 1. SPIN 상담 전략 분석 시각화
- **4축 분석**: 상황(S)/문제(P)/시사(I)/해결(N) 각 영역별 프로그레스 바
- **AI 전략 코칭 팁**: 가장 약한 SPIN 영역 자동 추출 + 구체적 개선 가이드
- **미결정 환자 전략 카드**: 심리분석 기반 맞춤 다음 스텝 액션 리스트
- **동반인 정보**: 관계/반응 표시 카드

### 2. 환자 가치 분석 시스템
- **4-Grid 서머리**: 총 상담수, 전환율, 총 수납액, 평균 결정도
- **등급 시스템**: VIP(1천만+) / Gold(5백만+) / Silver(1백만+) / New
- **잠재매출 표시**: 미결정 상담 금액 자동 계산
- **수납률/치료진행률**: 프로그레스 바 + 3-Grid 금액 요약 (총치료비/수납완료/미수납)

### 3. 관리자 대시보드 강화
- **목표 달성률 게이지**: SVG 원형 게이지 (전환율/코칭점수/연락수행률)
- **시간대별 상담 분포**: 피크 시간 하이라이트 바 차트
- **이번 주 vs 지난 주**: 4-Grid 비교 카드 (트렌드 화살표)
- **contact_rate API**: admin-summary에 연락 수행률 필드 추가

### 4. 리텐션 이탈 위험 히트맵
- **4단계 히트맵**: 긴급(80+)/높음(60+)/보통(40+)/낮음 프로그레스 바
- **TOP3 긴급 미니카드**: 이탈 위험 상위 3명 + 잔여치료비 표시
- **연락 성공률 추이**: 일별 성공률 라인 차트

## v5.0 기능 (이전 릴리스)
- **날짜 범위 필터**: 오늘/이번주/이번달/3개월 퀵선택 + 커스텀 날짜
- **금액 범위 필터**: 최소~최대 금액 (만원 단위)
- **코칭 점수 필터**: 점수 범위 검색
- **치료 유형 필터**: 10가지 치료 유형별 필터
- **7가지 정렬 옵션**: 최신순/오래된순/금액↑↓/점수↑↓/결정도
- **활성 필터 태그**: 적용된 필터 시각화 + 개별 제거
- **미니 차트**: 필터 결과의 일별 금액 막대 그래프
- **통계 요약**: 건수, 결정/전체 금액, 평균 점수

### 2. 상담 상세 AI 코칭 시각화
- **코칭 레이더 차트**: Chart.js radar로 4영역 시각화 (니즈파악/가치전달/이의처리/클로징)
- **감정 흐름 차트**: 상담 단계별 긍정/중립/부정 라인 차트
- **등급 배지**: S(90+)/A(80+)/B(70+)/C(60+)/D 자동 등급
- **점수 진행 바**: 영역별 퍼센티지 프로그레스 바

### 3. 환자 상세 타임라인 차트
- **상담 금액 추이**: 막대 차트 + 결정도 오버레이 라인
- **상태별 색상**: 결정(초록)/미결정(주황)/이탈(빨강)
- **요약 통계 카드**: 총 상담 수, 총 금액, 평균 결정도

### 4. 관리자 대시보드 차트 3종 추가
- **매출 트렌드**: 결정매출 vs 상담매출 막대 + 상담수 라인 (14일)
- **팀 역량 레이더**: 최대 5명 동시 비교 (상담수/전환율/코칭점수/매출/결정건수)
- **코칭 점수 추이**: 종합점수 + 6개 세부영역 라인 차트 (주간)

### 5. 리텐션 페이지 강화
- **도넛 차트 개선**: 인라인 범례 + 상태별 색상
- **일별 연락 추이**: 총 연락 vs 예약 전환 막대 차트

### 6. 카카오톡 알림톡 API 연동
- **6개 메시지 템플릿**: 예약알림, 제안서발송, 리텐션 팔로업, 정기검진 리콜, 치료미완료 안내, 감사&소개
- **개별 발송**: `POST /api/kakao/send`
- **제안서 발송**: `POST /api/kakao/send-proposal`
- **일괄 발송**: `POST /api/kakao/send-batch` (최대 50명)
- **발송 이력**: `GET /api/kakao/logs`
- **관리자 설정**: `PUT /api/kakao/config`
- **notification_logs DB 테이블**

## 이전 버전 하이라이트 (v4.x)

### 성능 최적화
- 리텐션 대시보드 N+1 제거 (90→3 쿼리, 30x 향상)
- today-contacts 병렬화 (3x 향상)
- 환자 상세 병렬화 (2-3x 향상)
- Dashboard 12개 쿼리 Promise.all 병렬화
- 200ms 검색 디바운스 + fetchCached() 5초 중복 방지
- summary 30초 캐시

### 보안 강화
- Rate limiting (auth 10/min, API 120/min)
- Security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
- 파라미터화된 쿼리 (SQL injection 방지)
- 입력 새니타이저 (sanitize(), safeInt(), isValidEmail())
- 최소 6자 비밀번호, 안전한 JSON 파싱

### 비즈니스 자동화
- 미결정 상담 2일 경과 시 자동 클로징 태스크 생성
- 결제 시 환자 last_visit_date 자동 업데이트
- AI 연락 스크립트 6종 (상태별 맞춤 톤/메시지)

## 주요 기능

### 코어 기능
- 실시간 녹음 → STT → AI 분석 (GPT-4o)
- 화자 분리, NER, SPIN 분석, 감정 분석
- 프리미엄 치료 제안서 (토큰 기반 공개 URL + CTA 추적)
- 원장 대시보드 (KPI/트렌드 비교/직원 성과)
- 리텐션 CRM (자동 분류/우선순위/AI 스크립트/연락 기록)

### 페이지 라우트
| 경로 | 설명 |
|------|------|
| `/login`, `/register` | 인증 |
| `/` | 홈 대시보드 |
| `/consultations` | 상담 목록 (고급 필터) |
| `/consultations/:id` | 상담 상세 (AI 시각화) |
| `/consultations/:id/report` | AI 상담 레포트 |
| `/patients` | 환자 목록 |
| `/patients/:id` | 환자 상세 (타임라인 차트) |
| `/recording` | 상담 녹음 |
| `/report` | 성과 리포트 |
| `/settings` | 설정 |
| `/retention` | 리텐션 관리 (차트) |
| `/admin` | 원장 대시보드 (3종 차트) |
| `/proposal/:token` | 공개 치료 제안서 |

### API 엔드포인트
- **Auth**: login, register, logout, me, goals, settings, team, Google OAuth
- **Dashboard**: summary, kpi, chart, today-contacts, achievements, coaching-trend, period-compare, smart-schedule, consultation-compare, referral-roi, treatment-analysis, revenue-trend, export, admin-summary, staff-performance, coaching-breakdown, low-score-consultations, proposal-analytics
- **Patients**: CRUD, stats, duplicates check/merge
- **Consultations**: CRUD, upload-audio (AI 분석), link-patient, unlinked list
- **Reports**: consultation reports, treatment proposals (create/send/view/interact)
- **Retention**: dashboard, patient status, treatments CRUD, contacts, auto-classification, AI script, report
- **Tasks**: today, generate, complete, skip, logs
- **KakaoTalk**: config, templates, send, send-proposal, send-batch, logs

## 기술 아키텍처
```
src/
├── index.tsx                # 앱 엔트리
├── renderer.tsx             # HTML 렌더러 + 디자인 시스템 + 글로벌 유틸리티
├── lib/
│   ├── middleware.ts         # Rate limiting, 보안 헤더, 유효성 검증
│   ├── auth.ts              # JWT 인증
│   ├── utils.ts             # 유틸리티 함수
│   ├── ai.ts                # OpenAI 분석 파이프라인
│   └── ai-presenter.ts      # AI 프레젠터 (제안서 생성)
├── routes/
│   ├── auth.ts, patients.ts, consultations.ts
│   ├── tasks.ts, dashboard.ts, reports.ts
│   ├── retention.ts
│   └── kakao.ts             # v5.0 NEW: 카카오톡 알림톡
├── components/
│   ├── shared/Layout.tsx
│   └── pages/ (14개 페이지)
└── types/index.ts
```

## 개발 환경 설정
```bash
npm install
npm run db:reset     # DB 초기화 + 시드 데이터
npm run build
pm2 start ecosystem.config.cjs
```

## 환경변수
- `OPENAI_API_KEY`: OpenAI API 키
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Google OAuth
- Kakao API: 설정 페이지에서 관리

## 향후 로드맵
- [ ] Deepgram 실시간 STT 통합
- [ ] PWA 오프라인 지원
- [ ] 예약 시스템 연동
- [ ] DentWeb 연동
- [ ] TTS 안내 기능
- [ ] 다국어 지원
- [ ] 시간대별 상담 분포 실시간 API
- [x] **환자 소개 추적 네트워크 시각화 (v7.3 완료)**
- [ ] 리텐션 이탈 예측 ML 모델
- [ ] Tailwind CSS PostCSS 빌드 전환 (현재 CDN 사용 중)

## 배포 정보
- **플랫폼**: Cloudflare Pages
- **프로젝트명**: `patienttouch`
- **프로덕션 URL**: https://patienttouch.pages.dev
- **D1 데이터베이스**: `patient-touch-db` (id: `b3918de1-1d51-426d-ab33-0062e18a0de2`)
- **R2 버킷**: `patient-touch-audio`
- **마이그레이션**: 0001~0008 모두 적용 완료 (로컬+프로덕션)
- **시크릿**: `JWT_SECRET`, `OPENAI_API_KEY` 등록 완료
- **최종 업데이트**: 2026-05-14 (v7.3)
