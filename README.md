# 페이션트 터치 + Presenter 통합 (Patient Touch)

> **"상담 종료 시 완성된 레포트가 기다리는 원스톱 프로세스"**
> **"찾는 건 기계가, 연락은 사람이"**

AI 기반 의료기관 상담 CRM + 실시간 STT + 환자용 치료 제안서 통합 서비스

## 🚀 현재 상태

- **개발 환경**: https://3000-ij4kl7jcr4fhkzr21l8wb-cbeee0f9.sandbox.novita.ai
- **버전**: 2.0.0 (Presenter 통합)
- **기술 스택**: Hono + TypeScript + Cloudflare Pages + D1 Database + R2 Storage + OpenAI

## ✨ 주요 기능 (v2.0 Presenter 통합)

### 🎙️ 실시간 녹음 + STT
- **빠른 녹음 모드**: 환자 등록 없이 즉시 녹음 시작, 나중에 연결
- **실시간 자막**: 녹음 중 실시간 자막 표시
- **AI 힌트 시스템**: 가격 언급, 망설임 감지 시 상담 팁 제공
- **감정 인디케이터**: 환자 감정 변화 실시간 모니터링

### 📊 자동 레포트 생성
- **상담 요약**: 3줄 요약 + 핵심 포인트
- **치료 옵션 비교**: 추천 치료 표시, 가격, 기간, 장단점
- **환자 우려사항**: 해결 여부 표시
- **감정선 타임라인**: 상담 중 감정 변화 차트
- **결정 예측**: 결정 근접도 (1-10점) + 예측 분석
- **분납 옵션 계산**: 개월별 납입 금액 자동 계산

### 🎓 상담사 코칭 피드백
- **영역별 점수**: 라포 형성, SPIN 활용, 반론 처리, 가격 프레이밍, 클로징, 구조
- **총점 100점 만점**: Patient Code 기반 평가
- **강점/개선점**: 구체적 제안 + 예시 멘트
- **팔로업 추천**: 추천 연락일 + 멘트 제안

### 📱 환자용 치료 제안서 (Presenter)
- **맞춤 제안서**: 환자별 개인화 제안서 생성
- **분납 시뮬레이터**: 슬라이더로 월 납입금 계산
- **열람 추적**: 열람 시간, CTA 클릭 추적
- **공개 URL**: 카카오톡/SMS로 공유 가능

### 👨‍⚕️ 원장 대시보드
- **상담사별 성과**: 전환율, 코칭점수, 상담 건수
- **코칭 영역 분석**: 라포/SPIN/반론/가격/클로징 평균
- **코칭 필요 상담**: 70점 미만 상담 목록
- **제안서 현황**: 발송/열람/전환 통계

## 📱 화면 구성

| 화면 | 경로 | 설명 |
|------|------|------|
| 로그인 | `/login` | 이메일/비밀번호 로그인, 데모 계정 |
| 회원가입 | `/register` | 병원 + 관리자 등록, 30일 무료체험 |
| 홈 | `/` | KPI 현황, 오늘 할 일, 빠른 액션 |
| 상담 | `/consultations` | 상담 목록, 필터, 녹음 시작 |
| 상담 상세 | `/consultations/:id` | 상담 노트 전체 보기 |
| **상담 레포트** | `/consultations/:id/report` | 🆕 AI 레포트 + 제안서 생성 |
| 녹음 | `/recording` | 🔄 실시간 자막 + AI 힌트 통합 |
| 환자 | `/patients` | 환자 목록, 검색, 등록 |
| 환자 상세 | `/patients/:id` | 환자 카드, 히스토리 |
| 리포트 | `/report` | KPI 상세, 목표 설정 |
| **원장 대시보드** | `/admin` | 🆕 상담사 성과, 코칭 분석 |
| 설정 | `/settings` | 알림 설정, 계정 관리 |
| **치료 제안서** | `/proposal/:token` | 🆕 환자용 공개 페이지 |

## 🔌 API 엔드포인트

### 인증 (`/api/auth`)
- `POST /register` - 회원가입
- `POST /login` - 로그인
- `POST /logout` - 로그아웃
- `GET /me` - 현재 사용자 정보
- `PUT /goals` - 목표 설정
- `PUT /settings` - 설정 저장

### 환자 (`/api/patients`)
- `GET /` - 환자 목록
- `GET /:id` - 환자 상세
- `POST /` - 환자 등록
- `PUT /:id` - 환자 수정
- `DELETE /:id` - 환자 삭제

### 상담 (`/api/consultations`)
- `GET /` - 상담 목록
- `GET /:id` - 상담 상세
- `POST /` - 상담 생성 (환자 ID 선택사항 - 빠른 녹음)
- `POST /:id/upload-audio` - 🔄 녹음 업로드 + AI 분석 + 레포트 자동 생성
- `PUT /:id/link-patient` - 🆕 빠른 녹음 후 환자 연결
- `POST /:id/analyze` - 텍스트 분석
- `PUT /:id` - 상담 수정
- `DELETE /:id` - 상담 삭제

### 🆕 레포트 & 제안서 (`/api/reports`)
- `GET /:consultationId` - 상담 레포트 조회
- `POST /:consultationId/generate` - 레포트 재생성
- `PATCH /:reportId` - 레포트 수정
- `POST /:consultationId/proposal` - 제안서 생성
- `GET /proposals/:proposalId` - 제안서 조회
- `POST /proposals/:proposalId/send` - 제안서 전송
- `GET /proposals/view/:token` - 공개 제안서 조회 (인증 불필요)
- `POST /proposals/view/:token/interaction` - 제안서 인터랙션 추적

### 연락 (`/api/tasks`)
- `GET /today` - 오늘의 연락 추천
- `GET /` - 연락 태스크 목록
- `POST /` - 태스크 생성
- `POST /generate` - AI 연락 추천 생성
- `PUT /:id/complete` - 연락 완료
- `PUT /:id/skip` - 연락 스킵
- `POST /logs` - 연락 기록 생성
- `GET /logs` - 연락 기록 목록

### 대시보드 (`/api/dashboard`)
- `GET /summary` - 홈 대시보드 요약
- `GET /kpi` - KPI 데이터
- `GET /chart` - 차트 데이터
- `GET /team` - 팀 비교 (관리자)
- 🆕 `GET /admin-summary` - 원장 대시보드 요약
- 🆕 `GET /staff-performance` - 상담사별 성과
- 🆕 `GET /coaching-breakdown` - 코칭 영역 분석
- 🆕 `GET /low-score-consultations` - 코칭 필요 상담
- 🆕 `GET /proposal-analytics` - 제안서 통계

## 🗄️ 데이터 모델

### 기존 모델
- **Organizations**: 병원 정보, 플랜, 구독
- **Users**: 상담사, 역할, 목표, 설정
- **Patients**: 환자 정보, 태그, 메모
- **Consultations**: 상담 기록, 녹음, AI 분석
- **Contact Tasks**: 연락 태스크
- **Contact Logs**: 연락 기록

### 🆕 Presenter 통합 신규 모델
- **Consultation Reports**: 상담 레포트 (요약, 치료옵션, 감정선, 코칭)
- **Treatment Proposals**: 환자용 제안서 (공개 URL, 열람 추적)
- **STT Chunks**: 실시간 STT 청크 (화자 분리)
- **AI Hints Log**: 실시간 힌트 로그
- **Organization Branding**: 병원 브랜딩 (로고, 컬러, 슬로건)
- **Consultant Stats**: 상담사 통계 (일/주/월)

## 🔧 개발 환경 설정

```bash
# 의존성 설치
npm install

# 데이터베이스 초기화 및 마이그레이션
npm run db:reset  # 또는
rm -rf .wrangler/state/v3/d1
npm run db:migrate:local
npm run db:seed

# 빌드
npm run build

# 로컬 개발 서버 (PM2)
pm2 start ecosystem.config.cjs

# 로그 확인
pm2 logs --nostream
```

## 🔑 환경 변수

`.dev.vars` 파일에 다음 변수 설정:
```
OPENAI_API_KEY=your-openai-api-key
```

## 📞 데모 계정

| 계정 | 역할 | 병원 |
|------|------|------|
| kim@bddental.com | 관리자 | 서울BD치과 |
| lee@bddental.com | 스태프 | 서울BD치과 |
| park@bddental.com | 스태프 | 서울BD치과 |
| demo@demo.com | 관리자 | 데모치과 |

**공통 비밀번호**: `test1234`

## 🚧 향후 개발 계획

### Phase 2 (예정)
- [ ] 실제 Deepgram/Whisper 실시간 STT 연동
- [ ] 화자 분리 (pyannote.audio/AssemblyAI)
- [ ] 카카오톡 알림톡 연동
- [ ] 예약 시스템 연동

### Phase 3 (예정)
- [ ] PWA 지원 (오프라인 녹음, 푸시 알림)
- [ ] 덴트웹 연동
- [ ] 피부과/성형외과 커스텀 버전
- [ ] 음성 TTS 안내

---

**Patient Touch v2.0** - 페이션트퍼널  
*"상담 종료 시 완성된 레포트가 기다리는 원스톱 프로세스"*
