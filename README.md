# 페이션트 터치 (Patient Touch v4.2)

> **"상담 종료 시 완성된 레포트가 기다리는 원스톱 프로세스"**
> **"찾는 건 기계가, 연락은 사람이"**

AI 기반 의료기관 상담 CRM + 실시간 STT + 환자용 치료 제안서 통합 서비스

## 현재 상태

- **개발 환경**: [서비스 URL]
- **버전**: 4.2.0 (Analysis Enhanced)
- **기술 스택**: Hono + TypeScript + Cloudflare Pages + D1 Database + R2 Storage + OpenAI
- **디자인 시스템**: 글래스모피즘 + Indigo 브랜드 컬러 + 프리미엄 애니메이션

## v4.2 분석 고도화 & 성능 대폭 개선

### 성능 최적화 (v4.2 NEW)
- **리텐션 대시보드 N+1 제거**: 30명 × 3쿼리 = 90개 순차 → 3개 배치 쿼리 + Map 룩업 (30x 빠름)
- **today-contacts 병렬화**: 3개 소스 쿼리 Promise.all 병렬 실행
- **환자 상세 API 병렬화**: 4개 순차 → 8개 병렬 쿼리 (2-3x 빠름)

### 새로운 API 엔드포인트 (v4.2 NEW)
- **`GET /api/dashboard/coaching-trend`**: 주간 코칭 점수 트렌드 (6개 영역별)
  - 가장 큰 개선점/약점 자동 분석 (insights)
  - user_id 필터로 상담사별 조회 가능
- **`GET /api/dashboard/achievements`**: 실시간 성과 알림
  - 일매출 마일스톤 (500만/1000만 돌파)
  - 연속 결정 스트릭, 오늘 예약 환자 수

### 비즈니스 로직 강화 (v4.2 NEW)
- **자동 태스크 생성**: 상담 상태→undecided 시 2일 후 closing 태스크 자동 생성
  - 환자명+치료항목 포함 맞춤 메시지
  - 중복 태스크 방지 (기존 pending 체크)
- **환자 통합 타임라인**: 상담+치료+연락+연락로그 통합 시간순 뷰
- **환자 요약 통계**: 전환율, 평균점수, 잔여치료비 한번에 조회

### 상담 검색 고도화 (v4.2 NEW)
- 날짜 범위 필터 (`date_from`, `date_to`)
- 금액 범위 필터 (`amount_min`, `amount_max`)
- 코칭점수 범위 필터 (`score_min`, `score_max`)
- 치료항목 필터 (`treatment_type`)
- 다중 정렬: `date_desc`, `amount_desc`, `score_desc`, `decision_desc` 등
- 요약(summary) 필드도 검색 대상에 포함

### 프론트엔드 강화 (v4.2 NEW)
- 홈 대시보드: 성과 달성 배너 (마일스톤, 스트릭, 예약 알림)
- achievements API 병렬 호출로 페이지 로드 속도 유지

## v4.1 최적화 및 보안 (이전)

### 성능 최적화
- Dashboard 쿼리 병렬화: 12개 순차 → `Promise.all` (2-3배 빠름)
- 프론트엔드 검색 디바운스 (200ms), API 응답 캐시 (5초)

### 보안 강화
- Rate Limiting (인증 10회/분, API 120회/분)
- Security Headers (X-Content-Type-Options, X-Frame-Options 등)
- SQL Injection 완전 제거 (template literal → parameterized queries)
- 입력 검증: `sanitize()`, `safeInt()`, `isValidEmail()`

## 핵심 기능

### 실시간 녹음 + AI 분석
- 빠른 녹음 모드 (환자 미선택 → 나중에 연결)
- 음성 → 텍스트 → AI 분석 → 레포트 자동 생성 (GPT-4o)
- 화자 분리, NER 추출, SPIN 분석, 6대 코칭 점수화

### 환자 치료 제안서
- 프리미엄 UI + 분납 시뮬레이터
- 공개 URL 토큰 (카카오/문자 전송)
- 열람 시간, CTA 클릭 자동 추적

### 원장 대시보드
- KPI 카드 + 추세 비교
- 상담사별 성과 + 코칭 영역별 분석 + 코칭 트렌드
- 제안서 열람/전환 통계

### 리텐션 CRM
- 환자 자동 분류 (긴급미예약/주의/리콜/이탈위험)
- 가중치 기반 우선순위 스코어링 (긴급도 40%, 잔여치료비 25%, 경과일수 15%, 이전연락반응 10%, 만족도 10%)
- AI 연락 스크립트 6종 + 연락 이력/통계

## 페이지 라우트

| 경로 | 설명 | 인증 |
|------|------|------|
| `/login` | 로그인 (데모 계정 지원) | - |
| `/register` | 회원가입 | - |
| `/` | 홈 대시보드 (성과 배너 + KPI + 연락 리스트) | 필요 |
| `/consultations` | 상담 목록 (고급 검색/정렬) | 필요 |
| `/consultations/:id` | 상담 상세 | 필요 |
| `/consultations/:id/report` | AI 레포트 | 필요 |
| `/patients` | 환자 관리 | 필요 |
| `/patients/:id` | 환자 상세 (통합 타임라인/리텐션) | 필요 |
| `/recording` | 빠른 상담 녹음 | 필요 |
| `/report` | 성과 리포트 (6개 탭) | 필요 |
| `/settings` | 설정/팀관리/내보내기 | 필요 |
| `/retention` | 리텐션 관리 | 필요 |
| `/admin` | 원장 대시보드 | Admin |
| `/proposal/:token` | 치료 제안서 (공개) | - |

## API 엔드포인트

### Auth (`/api/auth`)
| Method | Path | 설명 |
|--------|------|------|
| POST | `/login` | 로그인 (Rate Limited 10/min) |
| POST | `/register` | 회원가입 (Rate Limited 10/min) |
| GET | `/me` | 현재 사용자 정보 |
| PUT | `/goals` | 목표 설정 |
| PUT | `/settings` | 알림 설정 |
| GET/POST/PUT/DELETE | `/team` | 팀 관리 (Admin) |

### Dashboard (`/api/dashboard`)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/summary` | 홈 대시보드 요약 (병렬 최적화) |
| GET | `/kpi` | KPI 상세 (period: week/month/quarter) |
| GET | `/chart` | 차트 데이터 |
| GET | `/today-contacts` | 오늘 연락 통합 리스트 (병렬화) |
| GET | `/achievements` | **NEW** 성과 알림/마일스톤 |
| GET | `/coaching-trend` | **NEW** 코칭 점수 트렌드 (주간, 6영역) |
| GET | `/period-compare` | 기간 비교 KPI |
| GET | `/smart-schedule` | AI 추천 연락 스케줄 |
| GET | `/referral-roi` | 내원경로 ROI 분석 |
| GET | `/treatment-analysis` | 치료항목 분석 |
| GET | `/revenue-trend` | 매출 추이 |
| GET | `/export` | CSV 내보내기 |
| GET | `/admin-summary` | 원장 대시보드 |
| GET | `/staff-performance` | 상담사 성과 |
| GET | `/coaching-breakdown` | 코칭 영역 분석 |
| GET | `/low-score-consultations` | 코칭 필요 상담 |
| GET | `/proposal-analytics` | 제안서 통계 |

### Consultations (`/api/consultations`)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/` | 상담 목록 **고급 필터: date/amount/score/treatment_type, 다중 정렬** |
| POST | `/` | 상담 생성 (환자 미지정 가능) |
| GET | `/:id` | 상담 상세 |
| PUT | `/:id` | 상담 수정 **+ 자동 태스크 생성 트리거** |
| POST | `/:id/upload-audio` | 음성 업로드 + AI 전체 분석 |
| POST | `/:id/analyze` | 텍스트 분석 |
| PUT | `/:id/link-patient` | 환자 연결 |

### Patients (`/api/patients`)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/` | 환자 목록 (검색/필터/정렬) |
| POST | `/` | 환자 등록 |
| GET | `/:id` | 환자 상세 **통합 타임라인 + 요약 통계 + 리텐션** |
| PUT | `/:id` | 환자 수정 |
| GET | `/:id/stats` | 환자 통계 |
| GET | `/duplicates/check` | 중복 감지 |
| POST | `/duplicates/merge` | 환자 병합 |

### Retention (`/api/retention`)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/dashboard` | 리텐션 대시보드 **(배치 쿼리 최적화)** |
| GET | `/patients/:id` | 환자 리텐션 상태 |
| POST | `/treatments` | 치료 등록 + 자동 상태 갱신 |
| PUT | `/treatments/:id` | 치료 업데이트 + 자동 상태 갱신 |
| POST | `/contacts` | 연락 기록 |
| POST | `/update-status` | 전체 상태 재분류 |
| GET | `/ai-script/:patientId` | AI 연락 스크립트 |
| GET | `/report` | 리텐션 리포트 (주간/월간) |

## 아키텍처

```
src/
├── index.tsx             # 메인 앱 + 라우트 + 미들웨어 체인
├── renderer.tsx          # HTML 템플릿 + 글로벌 JS/CSS
├── lib/
│   ├── middleware.ts      # Rate Limiting, Security Headers, Validation
│   ├── auth.ts           # JWT 인증 미들웨어
│   ├── utils.ts          # 유틸리티 함수
│   ├── ai.ts             # OpenAI 분석
│   └── ai-presenter.ts   # 전체 분석 파이프라인
├── routes/
│   ├── auth.ts           # 인증 + 팀 관리
│   ├── patients.ts       # 환자 CRUD + 통합 타임라인
│   ├── consultations.ts  # 상담 + AI 분석 + 고급 검색
│   ├── tasks.ts          # 연락 태스크
│   ├── dashboard.ts      # KPI/차트/분석/코칭트렌드/성과/내보내기
│   ├── reports.ts        # AI 레포트 + 제안서
│   └── retention.ts      # 리텐션 CRM (배치 최적화)
├── components/
│   ├── shared/Layout.tsx  # 공통 UI 컴포넌트
│   └── pages/            # 14개 페이지 컴포넌트
└── types/index.ts         # TypeScript 타입 정의
```

## 개발 환경

```bash
npm install
npm run db:reset        # DB 초기화 + 시드
npm run build           # Vite 빌드
pm2 start ecosystem.config.cjs
```

## 데모 계정

| 이메일 | 비밀번호 | 역할 |
|-------|---------|------|
| kim@bddental.com | test1234 | Admin |
| lee@bddental.com | test1234 | Staff |
| park@bddental.com | test1234 | Staff |
| demo@demo.com | test1234 | Admin |

## 다음 로드맵

### 즉시 가능
- [ ] Deepgram 실시간 STT 통합
- [ ] 카카오톡 알림 연동
- [ ] PWA 오프라인 지원
- [ ] 예약 시스템 연결
- [ ] AdminDashboardPage에 coaching-trend 차트 연동

### 향후 계획
- [ ] DentWeb 연동
- [ ] TTS 안내 기능
- [ ] 미용/성형 특화 버전
- [ ] 다국어 지원

---

**Patient Touch v4.2** - 페이션트퍼널
*"필요한 진료를 받지 못하는 사람이 없도록"*
