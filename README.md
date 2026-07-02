# 페이션트 터치 (Patient Touch v8.6.0)

## 🔐 v8.6.0 원문 검색 + 컴플라이언스 패키지 + 프론트 부채 상환 1차 (2026-07-02)

### 1. 상담 원문 키워드 검색
- `GET /api/consultations/search-transcripts?q=키워드` — 원문 LIKE 검색, 매치 스니펫(±60자) 최대 3개 + 하이라이트, 감사로그 기록
- 상담 목록 페이지 검색창 옆 **"원문" 토글** → 원문 검색 모드 (450ms 디바운스, `<mark>` 하이라이트, 상담 상세 링크)

### 2. 개인정보/의료정보 컴플라이언스 (migration 0013)
- **녹음 동의 게이트**: 녹음 시작 전 동의 바텀시트 (병원별 안내 문구 커스텀) → `recording_consent/consent_at/consent_by` 저장, 녹음 종료 시 리셋
- **보존기간 정책**: 설정→개인정보 보호(관리자) — 무기한/6개월~5년 선택, 기간 경과 원문·녹음 자동 파기 대상 카운트 표시, "지금 파기 실행" (통계는 유지)
- **크론 파기**: `POST /api/privacy/purge-expired` (X-Cron-Secret 인증)
- **환자 삭제 요청 처리 (개보법 §36)**: 환자 상세 → 관리자 위험 영역 → 이름 확인 입력 → 익명화 (이름/연락처/메모/원문/녹음 영구 파기, 금액·점수 통계만 익명 유지)
- **감사 로그**: 원문 열람·검색·파기·환자삭제·동의 기록 → 설정에서 조회 (audit_logs 테이블)

### 3. 프론트 부채 상환 1차 — `/static/components.js` (window.PT)
- `PT.CONSULT_STATUS` — 상담 상태 맵 3곳 중복 → 1곳 (consultations.js ×2, patient-detail.js)
- `PT.avatarColor()` — 아바타 컬러 해시 7곳 중복 → 1곳 (settings/patients/patient-detail/consultation-detail/admin-dashboard/retention)
- `PT.openSheet/sheetHeader/sectionHeader/statusBadge/scoreColor` — 바텀시트·배지·섹션헤더 공통 헬퍼
- SW 캐시 pt-v8.6.0 범프, components.js 프리캐시 추가

---

## 📜 v8.5.1 스크립트 원문 보존 + 환자 원문 뷰어 (2026-07-02)

**핵심: "스크립트 원문은 무슨 일이 있어도 상담 기록과 함께 저장된다"**

### 1. 스크립트 원문 항상 저장 (분석 실패 무관)
- 분석 순서 변경: STT 완료 → **원문 즉시 DB 저장** → AI 분석 (화자분리→NER→리포트)
- `persistRawTranscript()` — 분석 파이프라인 시작 전에 transcript를 consultations에 먼저 커밋
- AI 분석이 중간에 실패해도 원문은 무조건 보존 (세그먼트/단일오디오/리포트재생성 3경로 모두)

### 2. 환자 이름 클릭 → 기존 상담 원문 뷰어
- `GET /api/patients/:id/transcripts` — 환자별 상담 원문 목록 (transcript 없으면 stt_chunks 병합 폴백)
- `openTranscriptViewer(patientId, name)` 공용 바텀시트 (utils.js) — 어느 페이지든 호출 가능
- 상담별 아코디언: 상태배지·날짜·진료·금액·상담사·글자수 → 펼치면 AI 요약 + 스크립트 원문 전체
- 원문 복사 버튼 + 상담 상세 이동 링크
- 연결 위치: 홈(오늘의 연락 📜아이콘/최우선 연락/MVP/최근 상담), /today(액션 리스트 📜/최우선), 환자 목록, 환자 상세(이름+원문 보기 버튼), 상담 목록, 상담 상세
- 클릭 가능한 이름은 점선 밑줄(brand color)로 표시
- SW 캐시 pt-v8.5.1 범프

---

# (이전) Patient Touch v8.4

## 🔔 v8.4 아침 브리핑 푸시 알림 (2026-07-02)

**핵심 철학: "앱을 열지 않아도, 매일 아침 폰에 오늘 할 일이 도착한다"**

### 1. Web Push 아침 브리핑 (매일 설정 시각, 기본 09:00 KST)
- 알림 내용: **☀️ 오늘 연락 N건이 기다려요** — 예상 금액 X만원 · 최우선: OOO님 · ⏰ 이월 M건
- 알림 탭 → 앱 열리며 `/today` 오늘의 액션 페이지로 바로 이동
- 연락할 건이 0건이면 발송 스킵 (방해 금지), 주말 알림은 설정에서 별도 ON/OFF
- 사용자 설정 반영: `notification_enabled` / `notification_time`(시각) / `weekend_notification`

### 2. 구독 관리 & 클라이언트
- `public/static/push-client.js` — `ptPush` 유틸 (enable/disable/test/getState), VAPID 공개키 기반 구독
- 설정 페이지: "아침 브리핑 푸시 알림" 토글 + 상태 표시 + **테스트 발송 버튼** (실제 브리핑 데이터로 즉시 발송)
- `/today` 상단: 미구독 사용자에게 푸시 켜기 넛지 배너 (닫으면 localStorage로 재표시 방지)
- `sw.js` (pt-v8.4.0): `push` 수신 → 알림 표시, `notificationclick` → 기존 창 포커스+이동 또는 새 창

### 3. 서버 & 인프라
- `/api/push` 라우트 6종: vapid-public-key / status / subscribe / unsubscribe / test / **send-morning-briefings** (크론 전용, X-Cron-Secret 인증)
- 암호화: `@block65/webcrypto-web-push` (Workers 호환 Web Crypto, VAPID)
- D1 `push_subscriptions` 테이블 (migration 0012): endpoint UNIQUE upsert, 실패 5회 누적 시 자동 제외, 404/410 응답 시 구독 자동 삭제
- **크론 워커** `patient-touch-briefing-cron` (별도 Worker): KST 06~22시 매시 정각 Pages 엔드포인트 호출 → 각 사용자의 설정 시각과 일치할 때만 발송

---

## ☀️ v8.3 아침 루틴 완성 (2026-07-02)

**핵심 철학: "출근하면 앱이 먼저 오늘 할 일을 브리핑해준다"**

### 1. 아침 브리핑 오버레이 (홈, 하루 1회 자동)
- 홈 진입 시 하루 1회: "오늘 연락 N건 / 예상 금액 / 이월 연락" 3-스탯 요약 + 최우선 연락 환자 카드
- "오늘의 액션 시작하기" CTA → /today 이동, localStorage로 재표시 방지
- 연락할 건이 없으면 브리핑 스킵 (방해 제로)

### 2. /today 오늘의 액션 전용 페이지 + 하단 네비 '오늘' 탭
- 브리핑 요약 카드 (연락수/예상금액/이월 + 최우선 환자 전화 버튼)
- 전체 액션 리스트: 오늘의 연락 + 리텐션 긴급 통합, 진행률 링, 멘트 가이드, AI 추천 배지
- 오늘 완료한 연락 이력 섹션 (예약완료/콜백/거절 결과 배지)
- 연락 결과 기록 모달 (홈과 동일 플로우, 완료 시 자동 새로고침)

### 3. 미완료 연락 이월 알림
- `today-contacts` API: 이월(지연) 연락 최상단 정렬 + `overdue_count`/`expected_revenue` 응답 추가
- 홈 오늘의 연락·체크리스트 + /today: **⏰ N일 지연** 오렌지 배지
- /today 상단: "어제 못 한 연락 N건이 이월됐어요 (최대 M일 지연)" 경고 배너

---

## 🔄 v8.2 녹음→피드백→다음 연락 루프 완성 (2026-07-02)

**핵심 철학: "녹음하면 끝이 아니라, AI가 '누구한테 언제 뭐라고 연락할지'까지 자동으로 확정한다"**

### 1. AI 분석 → 연락 태스크 자동 동기화 (`syncFollowupTask`)
- 상담 분석이 끝나는 순간, AI 리포트의 `recommended_followup_date` + `followup_message` + `next_actions`가 **contact_tasks에 자동 등록**
- 팔로업 날짜 검증: 과거/무효 날짜 → 결정도 기반 스마트 보정 (결정도 8+ → 내일, 5-7 → 2일, 그 외 → 3일 / 14일 초과 추천 → 7일로 당김)
- 재분석 시 기존 자동 태스크는 최신 AI 추천으로 교체 (수동 태스크는 보존)
- 이미 결제(paid)/이탈(lost) 확정 상담은 태스크 생성 안 함
- 적용 경로: 세그먼트 finalize, 재분석, 수동 리포트 생성 3곳 모두

### 2. 녹음 전 브리핑 API (`GET /api/dashboard/pre-consultation-briefing`)
- **코치 미션**: 최근 5회 리포트 분석 → 직전 개선과제 + 반복 지적사항 + **최약 영역(만점 대비 달성률) + Patient Code 기반 실천 팁**
- **환자 브리핑** (`?patient_id=`): 재상담 환자의 지난 상담 핵심 장벽·미해소 우려·결정권자·결정 예측을 녹음 시작 전에 리마인드
- 녹음 화면에 2개 카드로 표시: 재상담 브리핑(sky) + 오늘의 미션(amber)

### 3. 연락 태스크 출처 추적 (migration 0011)
- `contact_tasks.origin`: `manual` / `auto_rule` / `ai_analysis`
- `contact_tasks.ai_reason`: AI 추천 근거 (결정도 + 핵심 장벽 + 결정 예측)
- 홈 "오늘의 연락" 카드에 **🤖 AI 추천 배지 + 추천 근거** 노출
- `GET /api/tasks?consultation_id=` 필터 추가

### 4. 리포트 페이지 팔로업 위젯
- 추천 팔로업 섹션에 **연락 예약 상태 배지** (AI 자동 등록 / 수동 등록 + 예약일)
- 태스크가 없으면 **원클릭 "연락 태스크 등록" 버튼** (AI 추천 날짜/멘트/포인트 그대로 사용)

### DB 변경
- migration 0011: `contact_tasks.origin`, `contact_tasks.ai_reason`, `idx_contact_tasks_consultation`
- 프로덕션 배포 시: `npx wrangler d1 migrations apply patient-touch-db` 필수

---

## 🛡️ v8.1 보안·성능 심층 감사 (2026-07-02)

### 보안 — 인가(Authorization) 강화
- **adminOnly 미들웨어 신설**: 일반 상담사가 조직 전체 매출·동료 실적을 열람할 수 있던 인가 누락 수정
- 적용 API (7개): `admin-summary`, `staff-performance`, `coaching-breakdown`, `low-score-consultations`, `proposal-analytics`, `export`(CSV 전체 내보내기), `team`은 응답 필드 차등화
- `GET /api/auth/team`: 팀 명단은 전 직원, **개인별 매출·상담수·전화번호는 관리자만**
- 설정 페이지 데이터 내보내기 UI: 관리자에게만 표시

### 보안 — 입력 검증
- `PUT /consultations/:id`: status 화이트리스트(pending/paid/undecided/lost) + amount 음수/비숫자 차단
- `POST /:id/segments`: 세그먼트 10MB 제한 + index 0~9999 범위 검증

### 성능
- **이탈 예측 배치**: INSERT 최대 100회 순차 → D1 batch 1회
- **utils.js 추출**: 렌더러가 모든 페이지에 ~14KB JS를 인라인하던 것을 정적 파일로 분리
  → HTML 응답 ~22KB → 8.5KB, SW 프리캐시 등록으로 재방문 시 즉시 로드
- SW 캐시 버전 v8.1.0 (구버전 캐시 자동 정리)

### 코드 품질 (v8.0.2 포함)
- **타입 에러 969건 → 0건**: workers-types 도입 + AppEnv(Bindings+Variables) 타입 시스템
- 런타임 버그 수정: userId 미정의 2곳(자동 태스크/성장 비교 무력화), nerData.amount 오타(금액 항상 null), patient_id spread 덮어쓰기

---

## 🚀 v8.0 슈퍼 업그레이드 (2026-07-01)

**핵심 목적 재정렬: 상담실장이 녹음 → 개선 → 병원 매출 성과로 연결**

### 1. 녹음 신뢰성 (데이터 손실 제로)
- 60초 세그먼트 분할 녹음 → 즉시 R2 업로드 (`consultations/{id}/segments/NNNN.webm`)
- 세그먼트별 STT 병렬 처리 + finalize 시 병합 (25MB STT 한계 해결)
- 탭 종료/브라우저 크래시에도 업로드된 세그먼트는 보존
- API: `POST /:id/segments`, `POST /:id/finalize`, `GET /:id/analysis-status`, `POST /:id/reanalyze`, `GET /:id/audio`

### 2. 비동기 분석 파이프라인
- `waitUntil` 백그라운드 분석 + 3초 폴링 진행률 UI (음성인식→화자분리→NER/SPIN→리포트)
- 실패 시 `failed:<step>` 기록 + 상담 상세에서 원클릭 재분석
- 녹음 다시듣기 (단일 파일 + 세그먼트 순차 자동재생)

### 3. 블라인드 채점 (점수 신뢰성)
- 이전 피드백은 growth_comparison 필드 전용 — 채점에 영향 차단
- 루브릭 앵커로 세션 간 점수 일관성 확보
- growth_comparison 리포트 영속화 (개선/미개선 영역 추적)

### 4. 오늘의 미션 카드
- 녹음 시작 화면에 직전 상담 개선과제 리마인드

### 5. 점수 → 매출 증명
- `GET /api/dashboard/score-revenue` — 코칭 점수 구간별(60미만/60-69/70-79/80+) 결제 전환율·결제금액
- 성장 페이지 + 관리자 대시보드 위젯: "점수가 오르면 전환율이 오른다" 시각화

### 6. 보안 강화
- PBKDF2 비밀번호 해싱 + 로그인 시 레거시 SHA-256 자동 재해싱
- JWT_SECRET 미설정 시 하드페일 (fallback 제거)
- CORS 허용목록, CSP unsafe-eval 제거, kakao.ts 컨텍스트 버그 6곳 수정

### DB 변경
- migration 0010: `consultations.analysis_step / analysis_error / segment_count` + 인덱스 2개
- 프로덕션 배포 시: `npx wrangler d1 migrations apply patient-touch-db` 필수

---

# (이전) Patient Touch v7.7

## 🎬 데모 계정 (v7.7 추가)

**모든 기능을 풀패키지로 체험할 수 있는 데모 계정:**

| 역할 | 이메일 | 비밀번호 | 이름 |
|------|--------|----------|------|
| 원장 (admin) | `demo@patienttouch.kr` | `test1234` | 문석준 원장 |
| 상담사 | `yujin@patienttouch.kr` | `test1234` | 김유진 실장 |
| 상담사 | `seoyeon@patienttouch.kr` | `test1234` | 박서연 상담 |
| 상담사 | `jiwon@patienttouch.kr` | `test1234` | 이지원 상담 |

**데모 데이터 규모:**
- 환자 25명 + 5단계 다단계 소개 네트워크 (Tree depth 5)
- 상담 30건 (paid/undecided/lost/pending 분포)
- 보고서 7건 + 제안서 7건 + STT 청크 + AI 코칭 힌트
- 이탈 예측 60건 (피드백 50건 누적 → 재학습 대시보드 즉시 작동)
- 안부 컨택 12건 (다양한 result 분포)

**확인할 수 있는 핵심 화면:**
- `/admin` → 전체 K-factor + **상담사별 K-factor 위젯** (김유진 실장이 viral K=1.55로 1위)
- `/network` → 25노드 18엣지 D3.js 소개 네트워크 그래프 (top: 김민수)
- `/retention/churn` → AI 이탈 예측 환자 리스트
- `/retention/retraining` → **AI 정확도 85.7%, 혼동행렬, 주별 추이, 재학습 권장 엔진**
- `/retention` → 안부 컨택 대상자 우선순위 리스트

---

# 페이션트 터치 (Patient Touch v7.6)

> **"상담 종료 시 완성된 레포트가 기다리는 원스톱 프로세스"**
> **"찾는 건 기계가, 연락은 사람이"**
> **"한 명의 팬이 다섯 명을 데려온다 — 그 흐름을 그래프로 본다"**
> **"이탈은 예측하고, 망은 측정하고, 오프라인에서도 끊기지 않는다"**
> **"모델은 학습하고, 망은 누가 만들었는지 보이고, 캐시는 미리 준비된다"**

AI 기반 의료기관 상담 CRM + 실시간 STT + 환자용 치료 제안서 + **환자 소개 네트워크 시각화** + **AI 이탈 예측 + 모델 재학습 대시보드** + **PWA 오프라인 + 사전 캐시 워밍업** 통합 서비스

## 현재 상태

- **버전**: 7.6.0 (Build Pipeline + Per-Staff K-Factor + Retraining Dashboard + SW Precaching)
- **프로덕션 URL**: https://patienttouch.pages.dev
- **기술 스택**: Hono + TypeScript + Cloudflare Pages + D1 Database + R2 Storage + OpenAI GPT-5 hybrid + D3.js + PWA (Service Worker + Manifest + Precaching)
- **디자인 시스템**: 글래스모피즘 + Indigo 브랜드 컬러 + 프리미엄 애니메이션 + Chart.js + D3 force-directed graph + Tailwind PostCSS 정적 번들 (CDN 제거)

## v7.6 신규 기능 (최신)

### 1. 빌드 파이프라인 통합 (`npm run build` 한 방)
- **`css:build`** + **`vite build`**를 `&&`로 직렬 체이닝 → 명령 하나로 CSS + SSR 번들 동시 생성
- **`css:watch`** + `vite` 병렬 실행을 위한 `concurrently` 도입 → `npm run dev` 시 CSS 변경 즉시 반영
- **`build:vite-only`** 보조 스크립트: CSS 변경 없을 때 빠른 빌드 (Tailwind CLI 스킵, 2초 → 1.8초)
- **deploy:prod** 프로젝트명 오타 수정 (`patient-touch` → `patienttouch`)

### 2. 상담사별 K-Factor 분해 (`/admin` 신규 위젯)
- **신규 API**: `GET /api/patients/network/by-staff` — 환자의 "주 담당 상담사"를 첫 결제 상담의 `user_id`로 정의
- **이중 지표**:
  - **K-factor**: 직접 소개 / 담당 환자 — 단기 추천력
  - **바이럴 K**: 다운스트림 누적 / 담당 환자 — 장기 누적 효과
- **순위 시각화**: 🥇🥈🥉 메달 + 등급별 색상 (자생/가속/형성/초기 4단계) + 전사 평균 대비 +/- 표시
- **최고 인플루언서 추적**: 각 상담사가 담당한 환자 중 가장 많이 데려온 환자 자동 노출
- **이중 막대 그래프**: K-factor + 바이럴 K를 정규화된 막대로 동시 표시

### 3. AI 이탈 예측 모델 재학습 대시보드 (`/retention/retraining`)
- **신규 페이지**: `/retention/retraining` — Patient Funnel 식 모델 운영 본부
- **재학습 권장 엔진** (4단계 의사결정 트리):
  - 🔍 **not_ready** (피드백 <20건): 데이터 수집 안내
  - ✅ **optional** (정확도 ≥75% & <50건): 안정 상태 유지
  - 📈 **recommended** (≥50건 누적 또는 최근 4주 하락): 재학습 권장 + 액션 가이드
  - 🚨 **urgent** (정확도 <65%): 즉시 프롬프트/임계값 튜닝 필요
- **혼동 행렬 시각화**: True Positive / False Positive / False Negative / True Negative 4-grid
- **메트릭 카드**: AI 정확도 / 규칙 기반 정확도 / Precision / Recall / F1 Score
- **주별 정확도 추이 차트**: Chart.js 듀얼 Y축 (정확도% + 피드백 건수)
- **위험 등급별 적중률**: critical/high/medium/low 등급별 예측 vs 실제 분해
- **최근 피드백 리스트**: 오답 케이스(False Positive/Negative) 우선 노출 → 학습 자료로 활용
- **신규 API 2종**:
  - `GET /api/retention/predictions/retraining-stats` — 종합 통계 + 재학습 추천
  - `GET /api/retention/predictions/recent-feedback` — 오답 우선 정렬된 피드백 내역

### 4. Service Worker 사전 캐시 워밍업 (Precaching v7.6.0)
- **PRECACHE_STATIC**: 정적 자산 11종 (Tailwind/PWA/페이지 JS/아이콘) 설치 시 즉시 캐싱
- **PRECACHE_PAGES**: Patient Funnel 핵심 동선 6페이지 (`/`, `/recording`, `/admin`, `/retention/churn`, `/retention/retraining`, `/network`) 사전 워밍업
- **Stale-While-Revalidate**: 정적 자산은 캐시 즉시 응답 + 백그라운드 업데이트 → 페이지 로드 속도↑
- **3-tier 캐시**: STATIC_CACHE / RUNTIME_CACHE / PAGE_CACHE 분리 + 버전별 자동 정리
- **오프라인 폴백 강화**: 캐시된 페이지로 빠른 링크 4종(홈/관리/이탈/네트워크) 추가
- **로그인 후 idle 워밍업**: `requestIdleCallback`으로 첫 페인트 이후 사용자 권한 페이지 사전 캐싱
- **캐시 상태 조회 API**: `window.pwaCacheStatus()` — SW 메시지 통신으로 캐시 건수 노출
- **수동 재워밍업**: `WARM_PAGES` 메시지로 강제 재캐싱 가능

## v7.5 기능 (이전 릴리스)

## v7.5 신규 기능 (최신)

### 1. Service Worker 정식 활성화 (PWA Production Ready)
- **활성화 트리거**: `public/_routes.json`의 exclude 패턴에 `/sw.js`, `/manifest.json` 추가하여 Cloudflare Worker 인터셉트 차단
- **`SW_ENABLED = true`**: `pwa-register.js`에서 자동 등록 활성화
- **캐시 전략**: API는 Network-first / `/static/*`는 Cache-first / HTML은 Network-first + 오프라인 폴백
- **오프라인 폴백 페이지** 내장 — 네트워크 단절 시에도 앱 사용자 안내
- **홈 화면 설치 프롬프트**: `beforeinstallprompt` 핸들링 + iOS 안내 모달
- **검증**: `GET /sw.js` → 200 + `Content-Type: application/javascript` ✅

### 2. Tailwind PostCSS 전환 (CDN 경고 제거 + 다이어트)
- **CDN `cdn.tailwindcss.com` 완전 제거** → 프로덕션 콘솔 경고 사라짐
- **`tailwind.config.js`**: brand/surface 컬러 팔레트 + 12개 커스텀 애니메이션 + keyframes 전부 마이그레이션
- **`src/styles/index.css`**: `@layer base/components/utilities` 구조로 글래스모피즘, ripple, safe-area, 카드, 스켈레톤 등 22개 커스텀 컴포넌트 정리
- **정적 번들**: `npx tailwindcss` CLI로 `public/static/tailwind.css`(약 153 KB minified)로 빌드
- **`renderer.tsx` 정리**: 인라인 `<script>` config + 300줄 `<style>` 블록 모두 제거 → SSR 번들 444 → 428 kB로 감소
- **safelist 정제**: innerHTML 기반 동적 클래스(`bg-emerald-500/10`, `animate-fade-in` 등)만 보존

### 3. K-Factor 대시보드 위젯 (`/admin`)
- **Patient Funnel 핵심 지표**를 원장 대시보드에 풀폭 카드로 노출
- **그라데이션 카드** (인디고→퍼플→핑크) + 글래스 블러 + 카운트업 애니메이션
- **표시 데이터**: K-factor 값 / 총 환자 / 총 소개 / 최대 깊이 / 소개받은 환자 수
- **자동 등급 배지**:
  - K≥1.0 → 🚀 자생 성장 구간 (광고비 의존도↓)
  - K≥0.5 → 📈 성장 가속 구간
  - K≥0.2 → 🌱 기반 형성 구간
  - K<0.2 → 🔍 초기 진단 구간
- **딥링크**: 카드 우상단 "망 보기 →" 버튼으로 `/network` 그래프 이동

### 4. v7.4 → v7.5 안정화 작업 누적
- v7.4 AI 이탈 예측 모델(GPT-5-mini 하이브리드) — production stable
- v7.4 시드 데이터(김민수 다운스트림 15명, 4,115만 원 매출) — production stable
- 모든 PWA 자산(icon-192/512, apple-touch-icon, manifest) 활성 서빙

## v7.4 신규 기능 (직전 릴리스)

### 1. AI 기반 이탈 예측 모델 (`/retention/churn`)
- **하이브리드 패턴**: 규칙 기반 0-100점 스코어 + GPT-5-mini 정밀 분석 (높은 위험군만 AI 호출)
- **Rescue Hero 카드**: 미수 치료비 총액(구조 가능 금액) 그라데이션 카드로 노출
- **위험 등급 4단계**: critical / high / medium / low — 색상 코딩
- **피드백 루프**: 실제 이탈 여부(유지/이탈) 버튼 → `actual_outcome` 기록 → 모델 개선 데이터 축적

### 2. 풍부한 시드 데이터 (브라우저 검증 + 데모용)
- 김민수(루트) 아래로 10명 신규 환자 + 10건 결제 상담 추가
- **총 15명 다운스트림, 4,115만 원 매출**으로 K-factor 시각화 효과 극대화

### 3. PWA 기반 구조 (v7.4 셋업 → v7.5 활성화)
- `manifest.json`: 앱 이름, theme_color, 4종 shortcuts(녹음/이탈예측/소개망)
- `sw.js`: 캐시 전략 + 오프라인 폴백 페이지
- 아이콘 4종(192/512/180/32px) ImageMagick으로 SVG→PNG 변환

### 4. v7.4 API 엔드포인트
- `POST /api/retention/predictions/calculate` — 배치 예측 실행
- `GET /api/retention/predictions` — 예측 결과 조회 (필터: risk_level, limit)
- `GET /api/retention/predictions/:patient_id` — 개별 환자 예측 상세
- `POST /api/retention/predictions/:id/feedback` — 실제 이탈 여부 피드백
- `GET /api/retention/predictions/summary` — 위험도별 요약 통계

## v7.3 기능 (이전 릴리스)

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
