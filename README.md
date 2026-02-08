# 페이션트 터치 Premium (Patient Touch v3.0)

> **"상담 종료 시 완성된 레포트가 기다리는 원스톱 프로세스"**
> **"찾는 건 기계가, 연락은 사람이"**

AI 기반 의료기관 상담 CRM + 실시간 STT + 환자용 치료 제안서 통합 서비스

## 🚀 현재 상태

- **개발 환경**: https://3000-ij4kl7jcr4fhkzr21l8wb-cbeee0f9.sandbox.novita.ai
- **버전**: 3.0.0 (Premium UI)
- **기술 스택**: Hono + TypeScript + Cloudflare Pages + D1 Database + R2 Storage + OpenAI
- **디자인 시스템**: 글래스모피즘 + Indigo 브랜드 컬러 + 프리미엄 애니메이션

## ✨ v3.0 Premium UI 업그레이드 완료

### 디자인 시스템
- **Glass Morphism**: 반투명 블러 네비게이션 & 헤더
- **Custom Color System**: Brand(Indigo) + Surface(Slate) 듀얼 팔레트
- **Stagger Animation**: 카드별 순차 등장 애니메이션
- **Shimmer Loading**: 프리미엄 스켈레톤 로딩
- **Card Premium**: 호버 시 상승 + 보더 글로우 이펙트
- **Font**: Pretendard Variable (한글 최적화)

### 🎙️ 실시간 녹음 + STT
- **빠른 녹음 모드**: 환자 등록 없이 즉시 녹음 시작, 나중에 연결
- **실시간 자막**: 녹음 중 실시간 자막 표시
- **AI 힌트 시스템**: 가격 언급, 망설임 감지 시 상담 팁 제공
- **감정 인디케이터**: 환자 감정 변화 실시간 모니터링
- **오디오 웨이브폼**: 녹음 중 시각적 파형 표시

### 📊 자동 레포트 생성
- **상담 요약**: 3줄 요약 + 핵심 포인트
- **치료 옵션 비교**: 추천 치료 표시, 가격, 기간, 장단점
- **환자 우려사항**: 해결 여부 표시
- **감정선 타임라인**: 상담 중 감정 변화 차트
- **결정 예측**: 결정 근접도 (1-10점) + 예측 분석
- **분납 옵션 계산**: 개월별 납입 금액 자동 계산

### 🎓 상담사 코칭 피드백
- **6대 영역 점수**: 라포/SPIN/반론처리/가격프레이밍/클로징/구조
- **강점 & 개선점**: 구체적 제안 + 예시 문구
- **Patient Code 평가**: 페이션트 퍼널 기반 상담 평가

### 📄 환자용 치료 제안서
- **프리미엄 제안서 UI**: 글래스모피즘 디자인
- **분납 시뮬레이터**: 슬라이더로 개월 선택 → 월납입금 실시간 계산
- **CTA 버튼**: 예약/전화 연결
- **Read Tracking**: 열람 시간, CTA 클릭 추적

### 👨‍⚕️ 원장 대시보드
- **그라데이션 KPI 카드**: 총상담/전환율/코칭점수/제안서열람율
- **상담사 성과 테이블**: 전환율 + 코칭점수 바 그래프
- **코칭 영역별 레이더**: 6대 영역 평균 프로그레스바
- **코칭 필요 상담**: 70점 미만 상담 리스트

## 📱 페이지 라우트

| 경로 | 설명 | 인증 |
|------|------|------|
| `/login` | 로그인 (데모 로그인 지원) | ❌ |
| `/register` | 회원가입 | ❌ |
| `/` | 홈 대시보드 (KPI + 할일 + 최근상담) | ✅ |
| `/consultations` | 상담 목록 (필터링) | ✅ |
| `/consultations/:id` | 상담 상세 (AI 분석 결과) | ✅ |
| `/consultations/:id/report` | AI 상담 레포트 | ✅ |
| `/patients` | 환자 목록 | ✅ |
| `/patients/:id` | 환자 카드 상세 | ✅ |
| `/recording` | 빠른 녹음 | ✅ |
| `/recording/:patientId` | 환자 지정 녹음 | ✅ |
| `/report` | 성과 리포트 (KPI) | ✅ |
| `/settings` | 설정 | ✅ |
| `/admin` | 원장 대시보드 | ✅ (Admin) |
| `/proposal/:token` | 환자용 치료 제안서 (공개) | ❌ |

## 🔌 API 엔드포인트

### Auth: `/api/auth`
- `POST /login` - 로그인
- `POST /register` - 회원가입
- `POST /logout` - 로그아웃
- `GET /me` - 현재 사용자
- `PUT /goals` - 목표 설정
- `PUT /settings` - 알림/녹음 설정

### Patients: `/api/patients`
- `GET /` - 환자 목록
- `POST /` - 환자 등록
- `GET /:id` - 환자 상세 (상담/연락 히스토리 포함)

### Consultations: `/api/consultations`
- `GET /` - 상담 목록 (status 필터)
- `POST /` - 상담 생성
- `GET /:id` - 상담 상세
- `PUT /:id` - 상담 수정
- `POST /:id/upload-audio` - 오디오 업로드 + AI 분석
- `POST /:id/analyze` - 텍스트 분석
- `PUT /:id/link-patient` - 환자 연결

### Reports: `/api/reports`
- `GET /:consultationId` - 상담 레포트
- `POST /:consultationId/generate` - AI 레포트 생성
- `POST /:consultationId/proposal` - 치료 제안서 생성
- `GET /proposals/view/:token` - 공개 제안서 열람

### Dashboard: `/api/dashboard`
- `GET /summary` - 홈 대시보드 요약
- `GET /kpi` - KPI 상세 (period: week/month/quarter)
- `GET /admin-summary` - 원장 대시보드
- `GET /staff-performance` - 상담사 성과
- `GET /coaching-breakdown` - 코칭 영역별 평균
- `GET /low-score-consultations` - 코칭 필요 상담
- `GET /proposal-analytics` - 제안서 현황

### Tasks: `/api/tasks`
- `GET /today` - 오늘 할 일
- `POST /generate` - AI 연락 대상 생성

## 🎮 데모 계정

| 이메일 | 비밀번호 | 역할 | 병원 |
|--------|----------|------|------|
| kim@bddental.com | test1234 | Admin | 서울BD치과 |
| lee@bddental.com | test1234 | Staff | 서울BD치과 |
| park@bddental.com | test1234 | Staff | 서울BD치과 |
| demo@demo.com | test1234 | Admin | Demo Clinic |

## 🛠️ 개발 환경 세팅

```bash
npm install
npm run db:reset        # DB 초기화 + 시드
npm run build           # 빌드
pm2 start ecosystem.config.cjs
pm2 logs --nostream
```

## 📋 환경변수

`.dev.vars` 파일에 설정:
```
OPENAI_API_KEY=your-openai-api-key
```

## 🗺️ 다음 로드맵

### Phase 2: 실시간 강화
- Deepgram/Whisper 실시간 STT
- 화자 분리 (Diarization)
- 카카오톡 연동
- 예약 시스템 연결

### Phase 3: PWA & 확장
- PWA 오프라인 모드
- DentWeb 연동
- 미용/성형 특화 버전
- TTS 가이드 기능

---

**Patient Touch v3.0 Premium** - 페이션트퍼널  
*"상담 종료 시 완성된 레포트가 기다리는 원스톱 프로세스"*
