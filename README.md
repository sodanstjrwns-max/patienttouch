# 페이션트 터치 (Patient Touch v9.1.4)

## ⚠️ v9.1.4 녹음 유실 투명화 — "타임라인이 실녹음과 안 맞음" (2026-07-17)

### 진단: 버그가 아니라 데이터 유실의 침묵
- 사용자 지적: "2분짜리 상담인데 12초밖에 원문이 안 남아있네"
- 원인: consult_bd5c780d의 세그먼트 0·1(약 2분 분량)은 v9.1.1에서 밝혀진 로테이션 레이스로 **파일 자체가 손상**(헤더 이식 복구 시도 결과 실제 오디오 데이터도 각 1.9초/0.9초 조각뿐 — 복구 불가). AI 분석·타임라인·재생은 살아남은 세그먼트 2(약 27초)만으로 구성됐는데, **화면 어디에도 그 사실을 알리지 않아** 정상 분석처럼 보였음
- 타임라인 0:00/0:05/0:12는 살아남은 구간 기준 상대 시각이라 실제 상담 시각과 어긋남 — 유실 사실을 모르면 "타임라인이 틀렸다"고 느껴지는 게 당연

### 수정
- **서버**: GET /:id에 `audio_health {total_segments, lost_segments, lost_indexes}` 추가 (stt_chunks 손상 마킹 기반, 세그먼트 없는 상담은 null)
- **프론트**: 손상 구간이 있으면 상담 상세 최상단에 ⚠️ **녹음 일부 유실 배너** — "N개 구간 중 M개 손상, 살아남은 약 X분 분량만으로 AI 분석·타임라인·재생이 구성됨" 명시
- 손상 원인 자체는 v9.1.1에서 근본 수정 완료 (새 녹음에는 미발생)

### ✅ 검증 (실사용 시뮬레이션)
- 로컬: 손상 상담 audio_health `{total:2, lost:1, lost_indexes:[0]}`, 정상 mp3 상담 null, 배너 렌더 스모크 3/3 통과
- 프로덕션: sw `pt-v9.1.4`, 배너 코드 서빙, 정상 세그먼트 상담 2건 lost_segments:0(배너 미표시), mp3 상담 null 확인. consult_bd5c780d는 remote D1 기준 3구간 중 2구간 손상 마킹 → 배너 표시 조건 충족



## 🔊 v9.1.3 감정 차트 세로 무한증식 + 녹음 다시듣기 수정 (2026-07-17)

### 1) 감정 차트가 세로로 무한히 길어지는 버그
- 원인: Chart.js `maintainAspectRatio:false` 차트를 고정 높이 래퍼 없이 `<canvas height=120>`으로 사용 → 리사이즈마다 캔버스가 부모 크기를 따라가며 세로 증식
- 수정: `<div style="position:relative;height:130px">` 고정 높이 래퍼로 감쌈 (Chart.js 공식 권장 방식)

### 2) 녹음 다시듣기 안 됨 (특히 손상 세그먼트 포함 상담)
- 원인 A: v9.1.1에서 STT 4xx 영구실패 처리된 손상 세그먼트(EBML 헤더 없는 webm)도 재생 목록에 포함 → `<audio>`가 디코딩 실패, 구간 1에서 그대로 멈춤
- 수정 A(서버): `/audio` 세그먼트 목록에서 손상 세그먼트(`transcript='' AND confidence=0`) 제외
- 수정 B(프론트): `<audio>` error 이벤트 핸들러 추가 — 재생 불가 구간은 "재생 불가 (손상된 녹음)" 표기 후 0.8초 뒤 다음 구간 자동 스킵, 전 구간 불가 시 토스트 안내

### ✅ 검증 (실사용 시뮬레이션)
- 로컬: 손상 세그먼트 상담(consult_b9075260) 목록이 `[0,1]`→`[1]`로 정제됨 확인, 정상 세그먼트 스트림 200 audio/webm
- 프로덕션: sw `pt-v9.1.3`, 신규 JS 서빙, mp3 상담 스트림 200 audio/mpeg 1.17MB, 세그먼트 상담 segment=0 스트림 200 audio/webm(ffprobe 60.0s 정상), consult_bd5c780d는 손상 0·1 제외되고 정상 구간 2만 재생 목록에 남음 (remote D1 확인)

## 🩺 v9.1.2 상담 상세 화면 데이터 정합성 전면 수리 (2026-07-17)

### 🚨 "모자란거 파악해봐" — 화면 vs DB 감사 결과 (9개 갭 발견, 전부 수정)
사용자 화면에는 코칭 점수 0점·가짜 SPIN 숫자·중립 감정 등이 표시됐지만 **DB에는 실데이터가 전부 존재**했음. 원인은 프론트↔백엔드 스키마 불일치 8건 + UI 부재 1건.

| # | 갭 | 원인 | 수정 |
|---|-----|------|------|
| 1 | 상태 배지 "분석중" 오표기 | `pending`(결과 미입력)을 분석 상태로 오해석 | 배지 → **"결과 미입력"** |
| 2 | 코칭 점수 전부 0 표시 | 프론트가 구 4키(needs/value…) 기대, 백엔드는 6키(rapport 0-20, spin 0-25, objection_handling 0-20, pricing_framing 0-15, closing 0-10, structure 0-10) | 6영역 신스키마 렌더 + 구스키마 폴백 |
| 3 | 잘한 점/개선점 미표시 | `strengths`/`improvements` 키 미대응 | strengths·improvements(💡suggestion+example)·patient_code_evaluation 렌더 |
| 4 | 레이더 차트 왜곡 | 만점이 영역별로 달라(20/25/…) 절대값 비교 불가 | 100% 환산 정규화 |
| 5 | SPIN 카드 가짜 숫자 | 코칭 점수에서 유도한 파생값 표시 | `spin_analysis` 실데이터(질문 감지수·질문 텍스트·spin_score/100·spin_feedback) 렌더 |
| 6 | spin_analysis API 미반환 | GET /:id에서 파싱 자체를 안 함 | `safeParseJSON` 추가 반환 |
| 7 | 감정 "중립" 오표기 | `very_positive`/`very_negative` 톤 미매핑, `timeline` 대신 `phases` 기대 | 톤 5단계 매핑 + timeline 차트(-1~+1→0~4, mm:ss) + 하이라이트 멘트(화자 표기) |
| 8 | 환자 심리 결정권자만 표시 | 백엔드 키 {main_concern, budget_range, timeline} 미대응 | 핵심 고민·예산 민감도·결정 타임라인 렌더 추가 (구키 폴백 유지) |
| 9 | 상담 결과 입력 UI 부재 | pending에서 벗어날 방법이 화면에 없었음 | **상담 결과 카드** 신설: 결제완료(금액 입력)/미결정/이탈 버튼 → `PUT /api/consultations/:id` |

### ✅ 검증 (실사용 시뮬레이션 — 필수 절차 준수)
- 로컬: API 응답에 spin_analysis(score=25)·6키 scores·신 psychology 키·timeline 12pt 확인, DOM 스텁 렌더 스모크 13/13 통과, PUT paid(₩3,500,000)→undecided→pending 왕복 + 화이트리스트 400 확인
- 프로덕션: sw `pt-v9.1.2` 서빙, consultation-detail.js 신코드 서빙, consult_3c44f8b7 API 필드 전부 확인, PUT paid(₩1,200,000)→pending 왕복 성공
- consult_bd5c780d 원본 데이터(remote D1): main_concern·very_positive·spin_analysis 실존 확인 → 새 프론트에서 정상 표시됨

## 🎙 v9.1.1 녹음 파일 업로드 + 세그먼트 손상 근본 수정 (2026-07-17)

### 🚨 "음성 인식 중 25% 멈춤" 근본 원인
`recording.js`의 세그먼트 로테이션 레이스: 60초마다 레코더를 재시작할 때 **전역 `segmentChunks` 배열을 새 레코더가 먼저 초기화**하면, 이전 레코더의 `onstop`이 **webm 헤더가 없는 깨진 조각**을 업로드. OpenAI STT가 400(파일 손상)을 반환하는데 기존 코드는 이를 재시도 대상(NULL)으로 남겨 **stt_retry 무한 반복 → 25%에서 정체**.

### ✅ 수정 3종
1. **로테이션 레이스 제거**: 세그먼트별 chunks를 클로저로 격리 — 각 세그먼트가 항상 완전한 webm으로 업로드됨 (`startSegmentRecorder`)
2. **손상 세그먼트 구제**: STT 4xx(영구 실패)는 `''`로 마킹해 재시도 루프에서 제외, **정상 세그먼트만으로 분석 계속 진행** (5xx/네트워크 오류만 재시도)
3. **녹음 파일 업로드**: `/recording` 화면에 "녹음 파일 업로드" 버튼 — 이미 녹음된 mp3·m4a·wav·webm·ogg(최대 25MB)를 선택하면 동의 확인 → 업로드 → 즉시 분석 (매직바이트 포맷 감지로 R2 원본 확장자 보존, 브라우저 디코더로 길이 추정)

### 📊 실파일 검증
- 로컬 mp3 업로드 → 분석 완료 103초 (score 47) ✅
- 로컬 깨진 세그먼트+정상 세그먼트 혼합 finalize → **정상 구간만으로 76초 완료** (score 35) ✅
- **프로덕션 mp3 업로드 → 103초 완료 (score 51)** ✅
- 25%에서 멈춰 있던 실사용 상담(consult_bd5c780d)은 손상 세그먼트 마킹 후 failed로 전환 — 상세 화면 [재분석] 한 번이면 정상 구간(세그먼트 2)으로 복구
- sw 캐시 `pt-v9.1.1`

---

## 🔧 v9.1.0 poll-to-advance 분석 파이프라인 — 프로덕션 88% 멈춤 근본 수정 (2026-07-17)

### 🚨 근본 원인 (실오디오 프로덕션 E2E로 확정)
Cloudflare 프로덕션은 `waitUntil` 백그라운드 작업을 **응답 후 ~30초 내에 강제 종료**한다. 레포트 생성 등 60~90초 걸리는 AI 콜이 중간에 죽어 분석이 **88%(reporting)에서 영구 멈춤**. 로컬 `wrangler pages dev`는 이 제한이 없어 **로컬 테스트만으로는 절대 재현 불가** — 이것이 "로컬은 되는데 프로덕션은 안 되는" 이유였음.

### ✅ 해결: poll-to-advance 아키텍처
- **클라이언트 폴링 요청이 곧 파이프라인 실행자**: `analysis-status` 폴링(3초)이 들어올 때마다 서버가 다음 단계를 **동기 실행** 후 응답 (클라이언트 연결이 워커를 살려둠 — waitUntil 의존 제거)
- **클레임 락** (migration 0019: `analysis_claim`/`analysis_claim_at`, TTL 150초): 동시 폴링이 와도 한 요청만 실행, 나머지는 현재 상태만 반환
- **단계별 아티팩트 D1 영속화**: transcribing(세그먼트 STT 배치3, 재시도 2회) → diarizing → extracting(NER+SPIN 병렬) → reporting. 어느 요청이든 이어서 재개 가능
- **터치 리포트 동일 패턴**: `gen_claim` 락, content_json 유무로 생성/검증 단계 구분, `manage/list`·`manage/:id` 조회가 진행시킴
- **finalize/reanalyze/generate**는 상태만 세팅 + best-effort 1회 advance 후 즉시 응답
- stale 감지는 15분 안전망으로만 유지 (클레임이 updated_at 갱신)
- `src/routes/reports.ts` 레거시 waitUntil 백그라운드 잡(9.5KB) 전면 삭제

### 📊 실오디오 E2E 검증 결과 (TTS 한국어 상담 73초 → webm opus 60초 세그먼트, 브라우저 녹음 동일 포맷)
| 환경 | 결과 |
|---|---|
| 로컬 | 214초 완료 (score 50) ✅ |
| **프로덕션** | **118초 완료 (score 51)** ✅ — 세그먼트 업로드→STT→finalize→분석→레포트 전 구간 |
| 프로덕션 터치리포트 | 생성→review 18초 (flag 5건) → resolve→approve→send→환자 열람 `/r/:token` (인증·open tracking) 전부 통과 ✅ |

### 📏 실사용 시뮬레이션 필수 절차 (배포 전 체크리스트 — 반드시 준수)
1. **실제 오디오 필수**: TTS로 한국어 상담 대화 생성 → ffmpeg로 webm opus 60초 세그먼트 분할 (브라우저 MediaRecorder 포맷 재현). 텍스트 재분석 숏컷 테스트만으로 통과 처리 금지
2. **로컬 E2E**: 세그먼트 업로드 → finalize → analysis-status 폴링 → completed + coaching_score 확인
3. **프로덕션 E2E**: 배포 후 **프로덕션에서 동일 플로우 반복** — waitUntil 등 프로덕션 전용 제약은 로컬에서 재현되지 않음
4. **터치 리포트 전 구간**: 동의 → 생성 → 검수(flag resolve) → 승인 → 발송 → 환자 열람(인증 성공/실패) → open_count/이벤트 기록 확인
5. **전 페이지·핵심 API 스모크**: 주요 페이지 200 + dashboard/patients/consultations/tasks API 응답 확인

---

## 📋 v9.0.0 터치 리포트 — 환자용 상담 보고서 (2026-07-14)

상담 녹음 한 번으로 실장용 CRM 기록 + **환자에게 보낼 상담 보고서**가 만들어지고, 실장 승인 후 카카오톡(또는 링크)으로 전달되는 신규 기능. **자동 발송 없음 — 모든 보고서는 실장 승인 후에만 발송.**

### 정확성 설계 (제품 1원칙)
- **근거 기반 생성**: 모든 문장에 녹취 인용(evidence_quote) 필수. 녹취에 없으면 생성 금지 (`src/lib/touch-report.ts` GENERATION_SYSTEM_PROMPT)
- **숫자 이중 검증**: 생성 1콜(gpt-5.5) + 검증 1콜(gpt-5.4-mini) 분리. 불일치/검증불가 → 노란 "확인 필요" 배지. 검증 콜 실패 시 모든 숫자 자동 플래그 (안전 우선)
- **금칙어 필터**: 의료광고법 방어 12개 기본 사전 + 병원별 추가. 생성 후 + 발송 승인 직전 2회 검사, 대체 표현 제안
- **발송 게이트**: 배지/금칙어 1건이라도 남으면 승인 API 400 (`FLAGS_REMAINING`/`BANNED_WORDS`) + 검수 화면 발송버튼 비활성화
- **동의 게이트**: `kakao_delivery` 동의 없으면 생성 자체 차단 (403 `CONSENT_REQUIRED`) → 상담 상세에서 동의 기록 모달

### 플로우
상담 상세 → [터치 리포트 만들기] → (동의 확인) → AI 생성(백그라운드) → `/touch-reports/:id/review` 검수 (근거 패널 + 배지 + 인라인 수정/이력 로그) → 승인 → 발송(auth_hint 입력) → 환자 `/r/:token` 열람 (생년월일 4자리 인증, 90일 TTL)

### 화면 / API
- `/touch-reports` 목록 (상태 필터: 검수대기/승인/발송완료 + 열람 배지)
- `/touch-reports/:id/review` 실장 검수 — 미리보기·근거(녹취 맥락 하이라이트)·배지·인라인 수정·승인·발송
- `/r/:token` 환자 보고서 — 다크 커버 + 밝은 본문, FDI 치식도, 치료옵션 비교카드, QnA, 예약 버튼, 공유/PDF, 고지문구 고정, 빈 섹션 숨김
- API: `/api/touch-report/manage/*` (인증) — generate/list/:id/content(PATCH)/resolve-flag/approve/send/brand-kit/consent · `/api/touch-report/public/:token` (+/meta, /event) — 열람 추적(opened/pdf_saved/shared/booking_clicked, open_count)
- 알림톡: org kakao 키 설정 시 솔라피 어댑터 발송, 미설정 시 `manual_link` (링크 복사 전달)

### DB (migration 0017, 0018)
`touch_reports`(id=토큰 PK, status: generating/review/approved/sent/failed, content_json, flags_json, banned_hits_json, auth_hint, expires_at, open_count), `touch_report_revisions`(수정 이력), `touch_report_events`, `clinic_brand_kits`(병원 브랜드/금칙어/TTL), `patient_consents` + organizations kakao 컬럼 정식 마이그레이션(0018)

---

## 📅 v8.9.0 일정 캘린더 + 스케일 검증 (2026-07-04)

### 일정 캘린더 (`/calendar`)
상담·연락·예약·리콜 4종 일정을 하나의 월별 캘린더로 통합.
- **월 뷰**: 날짜별 유형 색상 도트(🟣상담/🟡연락/🟢예약/🔴리콜) + 건수 뱃지, 오늘 하이라이트
- **월 요약 스트립**: 상담 수 / 연락 수 / 예약+리콜 수 / 월 결제액
- **일별 상세**: 날짜 탭 → 시간·환자·치료유형·금액·담당자 카드 목록, 상담 상세/환자 페이지 딥링크, `tel:` 원터치 전화
- **필터**: 유형별 + "내 것만" 토글 (상담사별 개인 일정)
- **진입점**: 홈 퀵액션 "일정 캘린더" + 상담 관리 헤더 캘린더 아이콘

### API (`src/routes/calendar.ts`)
- `GET /api/calendar/month?year&month&my_only` — 일자별 집계 (4테이블 병렬 GROUP BY)
- `GET /api/calendar/day?date&my_only` — 일별 상세 (각 쿼리 LIMIT 200 방어캡)

### 🚀 수천 명 스케일 검증 (부하 테스트)
- **테스트 데이터**: 환자 3,000 + 상담 8,000 + 태스크 5,000 + 예약 2,000 + 리콜 2,000 (총 2만 행)
- **월별 API**: 35~75ms (월 726건 상담 집계 포함) / **일별 API**: 35ms
- **동시 20요청**: 전부 200 OK, 평균 331ms, 총 0.46s — 병목 없음
- **쿼리 최적화**: `date(col)=?` → 인덱스 활용 가능한 범위비교(`>= AND <`)로 전환, EXPLAIN QUERY PLAN으로 4개 쿼리 전부 COVERING INDEX 사용 확인
- **migration 0016**: `idx_contact_tasks_org_recdate` + `idx_retention_contacts_org_nextdate` (부분 인덱스) 추가 — 로컬/원격 D1 적용 완료
- SW 캐시 pt-v8.9.0 범프, 프로드 배포 및 API 검증 완료 (월별 145~260ms E2E)

## 🛡️ v8.7.1 런칭 전 실사용 시뮬레이션 이슈 7건 일괄 수정 (2026-07-03)

방문자→리드→가입→온보딩→일상 사용→관리자 전 여정 시뮬레이션으로 발견한 이슈 전량 수정.

### 🚨 런칭 블로커 수정 (5건)
- **회원가입 500 수정**: `auth.ts` register INSERT의 `plan_type 'trial'` → `'basic'` (organizations CHECK 제약 위반으로 모든 프로드 가입 실패하던 치명적 버그) — 프로드 실가입 검증 완료
- **비로그인 루트(/) → /welcome 302 리다이렉트**: auth_token 쿠키 없으면 마케팅 랜딩으로 (로그인 사용자는 홈 유지)
- **OG 태그 + og-image.png**: 카톡/SNS 공유 미리보기 (`renderer.tsx`에 og:title/description/image/url + twitter:card, 1200x630 브랜드 이미지 생성)
- **법적 페이지 신설**: `/privacy-policy` (수탁자 지위·위탁 고지·보유기간 등 9개 조항) + `/terms` (AI 분석 면책·녹음 동의 책임·파운더50 유지 조항 등 10개 조항) — 가입 폼/리드 폼/랜딩 푸터에서 링크
- **리드 스팸 3중 방어**: IP당 분당 5건 rateLimit + 허니팟 필드(`website`, 봇이면 조용히 드랍) + IP당 일 10건 캐핑 (`source`에 `|IP` 저장하여 추적)

### 🟡 개선 (2건)
- **온보딩 1단계 기준 교체**: 달성 불가능하던 branding 체크 → '개인정보 보관정책 설정' (설정 UI로 달성 가능, `settings.transcript_retention_months` 기준)
- **설정 페이지 리드 관리 UI** (admin 전용): 신규 리드 배지 + 상태 필터(신규/연락함/데모/계약/이탈) + 카드 목록(tel: 링크) + 인라인 상태 변경

### 검증
- 로컬 12개 시나리오 + 프로드 6개 검증 전부 통과, SW 캐시 pt-v8.7.1 범프
- 후순위 (런칭 후): 신규 리드 알림(푸시/카톡), 플랜별 월 건수 한도 자동 제한

## 🚀 v8.7.0 마케팅 랜딩페이지 + 리드 접수 + 온보딩 플로우 (2026-07-03)

### 랜딩페이지 `/welcome` (비로그인 공개)
- 다크 오로라 디자인 언어 통일 (glass-dark, gradient orbs, text-gradient)
- 히어로: "놓친 상담 한 건이 임플란트 한 건입니다" + 성과 지표 스트립 (62% 전환율 / 2.1배 성장 / 40% 광고비 절감 / 6,000+ 수료 원장)
- 페인포인트 3종 → 풀사이클 기능 4종 (녹음→AI분석→코칭→리텐션) + 컴플라이언스 스트립
- ROI 섹션: 전환율 +5%p = 월 +750만원, ROI 25배+
- 요금제: Starter 149,000 / Growth 290,000 ⭐ / Enterprise 590,000~ (VAT별도, 병원 단위 정액, 초과 건당 2,000원)
- **파운더 50 프로모션**: 첫 50개 병원 평생 30% 할인 + 실시간 잔여 슬롯 카운터 (`#founderCounter`)
- 도입 문의 폼 → `POST /api/leads` (성공 시 데모 체험 유도), FAQ 5문항, 하단 CTA

### 리드 접수 API (`src/routes/leads.ts`, migration 0014)
- `GET /api/leads/founder-count` (공개): 잔여 슬롯 계산 (status != 'lost' 기준 50 - taken)
- `POST /api/leads` (공개): 병원명/담당자/연락처 검증, 24시간 중복 전화번호 409 처리
- `GET /api/leads` + `PUT /api/leads/:id/status` (admin 전용): 리드 목록/상태 관리 (new→contacted→demo→won/lost)

### 온보딩 플로우 (신규 병원 가이드)
- `GET /api/dashboard/onboarding-status`: 6단계 자동 감지 (병원 설정→직원 초대→환자 등록→첫 녹음→첫 AI 분석→첫 리콜)
- 홈 화면 `#onboardingCard`: 진행률 바 + "다음 단계" 하이라이트 + 완료 시 자동 숨김 + 닫기(localStorage)

### 기타
- SW 캐시 pt-v8.7.0 범프, 원격 D1 migration 0014 적용 완료

## 🔎 v8.6.1 뷰어 내부 검색 + 자동 파기 크론 + 부채 상환 2차 (2026-07-03)

### ⓐ 원문 뷰어 모달 내부 키워드 검색
- 뷰어 상단 검색 바 (300ms 디바운스) — 매치된 상담만 필터 + 자동 펼침
- 원문·AI 요약 모두에서 `<mark>` 하이라이트, 상담별 "N곳" 배지 + 헤더에 총 일치 수
- X 버튼으로 초기화, 결과 없으면 빈 상태 안내

### ⓑ 보존기간 자동 파기 크론
- cron-worker에 `0 19 * * *` (KST 04:00) 슬롯 추가 — `event.cron` 분기로 `/api/privacy/purge-expired` 호출
- 기존 브리핑 크론과 동일한 X-Cron-Secret 인증, 워커 배포 완료 (스케줄 3개 활성)
- 보존기간 설정된 병원만 파기 실행 (무기한 병원은 스킵)

### ⓒ 프론트 부채 상환 2차 — 원문 링크 렌더러 공통화
- `PT.patientNameLink(id, name, opt)` — 클릭 시 원문 뷰어 열리는 환자 이름 (tag/suffix/stop/fallback 옵션)
- `PT.transcriptBtn(id, name)` — 📜 스크롤 버튼
- **10곳 중복 인라인 onclick 문자열 → 1곳** (home ×4, today ×2, patients, patient-detail, consultations, consultation-detail)
- SW 캐시 pt-v8.6.1 범프

---


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
