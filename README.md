# 페이션트 터치 (Patient Touch v4.1)

> **"상담 종료 시 완성된 레포트가 기다리는 원스톱 프로세스"**
> **"찾는 건 기계가, 연락은 사람이"**

AI 기반 의료기관 상담 CRM + 실시간 STT + 환자용 치료 제안서 통합 서비스

## 현재 상태

- **개발 환경**: [서비스 URL]
- **버전**: 4.1.0 (Optimized & Hardened)
- **기술 스택**: Hono + TypeScript + Cloudflare Pages + D1 Database + R2 Storage + OpenAI
- **디자인 시스템**: 글래스모피즘 + Indigo 브랜드 컬러 + 프리미엄 애니메이션

## v4.1 최적화 및 기능 고도화

### 성능 최적화
- **Dashboard 쿼리 병렬화**: 12개 순차 DB 쿼리 → `Promise.all` 병렬 실행 (2-3배 빠름)
- **KPI/Admin 쿼리 병렬화**: 각 3-4개 쿼리 병렬 처리
- **프론트엔드 검색 디바운스**: 200ms debounce로 불필요한 필터링 방지
- **API 응답 캐시**: `fetchCached()` 5초 중복 호출 방지
- **응답 캐시 헤더**: summary 엔드포인트 30초 브라우저 캐시

### 보안 강화
- **Rate Limiting**: 인증 엔드포인트 10회/분, API 전체 120회/분
- **Security Headers**: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`
- **SQL Injection 방지**: 모든 template literal 패턴 제거 → parameterized queries
- **입력 검증**: `sanitize()`, `safeInt()`, `isValidEmail()` 적용
- **기간 파라미터 화이트리스트**: `validatePeriod()`, `validateAdminPeriod()`
- **비밀번호 정책**: 최소 6자 요구
- **JSON 파싱 안전화**: `safeParseJSON()` 전면 적용 (crash 방지)

### 프론트엔드 글로벌 유틸리티
- `debounce(fn, delay)` - 검색, 스크롤 등에 사용
- `fetchCached(url, ttlMs)` - API 응답 단기 캐시
- `animateValue(el, end, duration, suffix)` - 숫자 카운트업 애니메이션
- `lazyLoad(selector, callback)` - IntersectionObserver 기반 지연 로딩
- `showToast(msg, type, duration)` - 글로벌 토스트 알림
- `showErrorState(containerId, message, retryFn)` - 에러 + 재시도 버튼
- `initPullToRefresh(refreshFn)` - 터치 Pull-to-Refresh

### 리텐션 자동화
- 상담 상태 `paid` 변경 시 환자 `last_visit_date` 자동 업데이트
- AI 연락 스크립트: 상태별 6종 맞춤 메시지/톤/팁

## v4.0 기능 (완료)

### Phase 1 – UX 품질
1. **Pull-to-Refresh**: 홈/상담/환자/리포트 터치 당겨 새로고침
2. **Toast 알림**: alert() → 컬러별 토스트 (success/error/warning/info)
3. **에러/재시도**: 네트워크 실패 시 재시도 버튼
4. **페이지 전환**: fade-out/fade-in 부드러운 전환
5. **온보딩 가이드**: 데이터 없을 때 3단계 시작 가이드

### Phase 2 – 비즈니스
6. **환자 타임라인**: 상담/치료/연락 이벤트 시각화
7. **기간 비교**: 주간/월간/분기 KPI 전기 대비
8. **스마트 스케줄링**: AI 추천 최적 연락 시점/시간대
9. **상담 비교 분석**: 첫 상담 vs 최근 상담 Side-by-Side
10. **팀 관리**: 팀원 추가/역할 관리 (admin/consultant)
11. **데이터 내보내기**: 상담/환자/리텐션 CSV 다운로드
12. **중복 환자 감지**: 전화번호 기반 감지 및 병합

## 핵심 기능

### 실시간 녹음 + AI 분석
- 빠른 녹음 모드 (환자 미선택 → 나중에 연결)
- 음성 → 텍스트 → AI 분석 → 레포트 자동 생성 (GPT-4o)
- 화자 분리, NER 추출, SPIN 분석
- 6대 상담 코칭 영역 점수화

### 환자 치료 제안서
- 프리미엄 UI + 분납 시뮬레이터
- 공개 URL 토큰 (카카오/문자 전송)
- 열람 시간, CTA 클릭 자동 추적

### 원장 대시보드
- KPI 카드 + 추세 비교
- 상담사별 성과 테이블
- 코칭 영역별 분석
- 제안서 열람/전환 통계

### 리텐션 CRM
- 환자 자동 분류 (긴급미예약/주의/리콜/이탈위험)
- 우선순위 스코어링
- AI 연락 스크립트 6종
- 연락 이력 + 통계 리포트

## 페이지 라우트

| 경로 | 설명 | 인증 |
|------|------|------|
| `/login` | 로그인 (데모 계정 지원) | - |
| `/register` | 회원가입 | - |
| `/` | 홈 대시보드 | 필요 |
| `/consultations` | 상담 목록 | 필요 |
| `/consultations/:id` | 상담 상세 | 필요 |
| `/consultations/:id/report` | AI 레포트 | 필요 |
| `/patients` | 환자 관리 | 필요 |
| `/patients/:id` | 환자 상세 (타임라인/리텐션) | 필요 |
| `/recording` | 빠른 상담 녹음 | 필요 |
| `/recording/:patientId` | 환자 지정 녹음 | 필요 |
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
| POST | `/logout` | 로그아웃 |
| GET | `/me` | 현재 사용자 정보 |
| PUT | `/goals` | 목표 설정 |
| PUT | `/settings` | 알림 설정 |
| GET | `/team` | 팀원 목록 |
| POST | `/team` | 팀원 추가 (Admin) |
| PUT | `/team/:id` | 팀원 수정 (Admin) |
| DELETE | `/team/:id` | 팀원 삭제 (Admin) |
| GET | `/google` | Google OAuth 시작 |

### Dashboard (`/api/dashboard`)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/summary` | 홈 대시보드 요약 (병렬 최적화) |
| GET | `/kpi` | KPI 상세 (period: week/month/quarter) |
| GET | `/chart` | 차트 데이터 |
| GET | `/today-contacts` | 오늘 연락 통합 리스트 |
| GET | `/period-compare` | 기간 비교 KPI |
| GET | `/smart-schedule` | AI 추천 연락 스케줄 |
| GET | `/consultation-compare/:patientId` | 상담 비교 |
| GET | `/referral-roi` | 내원경로 ROI 분석 |
| GET | `/treatment-analysis` | 치료항목 분석 |
| GET | `/revenue-trend` | 매출 추이 |
| GET | `/export` | CSV 내보내기 (type: consultations/patients/retention) |
| GET | `/admin-summary` | 원장 대시보드 |
| GET | `/staff-performance` | 상담사 성과 |
| GET | `/coaching-breakdown` | 코칭 영역 분석 |

### Patients (`/api/patients`)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/` | 환자 목록 (검색/필터/정렬) |
| POST | `/` | 환자 등록 |
| GET | `/:id` | 환자 상세 |
| PUT | `/:id` | 환자 수정 |
| DELETE | `/:id` | 환자 비활성화 |
| GET | `/:id/stats` | 환자 통계 |

### Consultations (`/api/consultations`)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/` | 상담 목록 |
| POST | `/` | 상담 생성 (환자 미지정 가능) |
| GET | `/:id` | 상담 상세 |
| PUT | `/:id` | 상담 수정 + 리텐션 자동 업데이트 |
| POST | `/:id/upload-audio` | 음성 업로드 + AI 전체 분석 |
| PUT | `/:id/link-patient` | 환자 연결 |

### Retention (`/api/retention`)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/dashboard` | 리텐션 대시보드 |
| GET | `/patients/:id` | 환자 리텐션 상태 |
| POST | `/treatments` | 치료 등록 |
| PUT | `/treatments/:id` | 치료 업데이트 |
| POST | `/contacts` | 연락 기록 |
| POST | `/update-status` | 전체 상태 재분류 |
| GET | `/ai-script/:patientId` | AI 연락 스크립트 |
| GET | `/report` | 리텐션 리포트 |

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
│   ├── patients.ts       # 환자 CRUD
│   ├── consultations.ts  # 상담 + AI 분석
│   ├── tasks.ts          # 연락 태스크
│   ├── dashboard.ts      # KPI/차트/분석/내보내기
│   ├── reports.ts        # AI 레포트 + 제안서
│   └── retention.ts      # 리텐션 CRM
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

## 환경변수 (`.dev.vars`)

```
OPENAI_API_KEY=your-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 다음 로드맵

### 즉시 가능
- [ ] Deepgram 실시간 STT 통합
- [ ] 카카오톡 알림 연동
- [ ] PWA 오프라인 지원
- [ ] 예약 시스템 연결

### 향후 계획
- [ ] DentWeb 연동
- [ ] TTS 안내 기능
- [ ] 미용/성형 특화 버전
- [ ] 다국어 지원

---

**Patient Touch v4.1** - 페이션트퍼널
*"필요한 진료를 받지 못하는 사람이 없도록"*
