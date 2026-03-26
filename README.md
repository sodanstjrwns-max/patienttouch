# 페이션트 터치 (Patient Touch v5.0)

> **"상담 종료 시 완성된 레포트가 기다리는 원스톱 프로세스"**
> **"찾는 건 기계가, 연락은 사람이"**

AI 기반 의료기관 상담 CRM + 실시간 STT + 환자용 치료 제안서 통합 서비스

## 현재 상태

- **버전**: 5.0.0 (Deep Enhancement)
- **기술 스택**: Hono + TypeScript + Cloudflare Pages + D1 Database + R2 Storage + OpenAI
- **디자인 시스템**: 글래스모피즘 + Indigo 브랜드 컬러 + 프리미엄 애니메이션 + Chart.js 시각화

## v5.0 기능 고도화

### 1. 상담 목록 고급 검색/필터 시스템
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
