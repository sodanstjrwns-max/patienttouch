# 페이션트 터치 (Patient Touch)

> **"찾는 건 기계가, 연락은 사람이"**

AI 기반 의료기관 상담 CRM 서비스로, 상담 녹음을 자동으로 분석하여 상담 노트를 생성하고 개인화된 환자 연락 추천을 제공합니다.

## 🚀 현재 상태

- **개발 환경**: https://3000-ij4kl7jcr4fhkzr21l8wb-cbeee0f9.sandbox.novita.ai
- **버전**: 1.0.0 (MVP)
- **기술 스택**: Hono + TypeScript + Cloudflare Pages + D1 Database

## ✅ 완료된 기능

### 핵심 기능 (P0)
- [x] **녹음→상담노트**: Web Audio API로 상담 녹음 → AI 분석 → 자동 상담 노트 생성
- [x] **AI 분석**: OpenAI Whisper(STT) + GPT-4 (스크립트 요약, 환자 심리, 감정선, 핵심 멘트 추출)
- [x] **상담 피드백**: 잘한 점, 개선 포인트, 상담 점수 (니즈파악/가치전달/이의처리/클로징)
- [x] **환자 카드**: 환자별 히스토리 통합 조회, 검색, 필터링

### 주요 기능 (P1)
- [x] **오늘의 연락 추천**: 클로징 연락 / 안부 연락 분류, AI 멘트 가이드
- [x] **KPI 대시보드**: 상담 전환율, 평균 상담점수, 연락 수행률, 재상담 성공
- [x] **목표 설정**: 개인별 KPI 목표 설정 및 달성 현황 추적
- [x] **연락 결과 기록**: 연락 유형, 결과, 메모 기록

### 부가 기능 (P2)
- [x] **멀티테넌트**: 병원별 데이터 격리
- [x] **반응형 UI**: 모바일 최적화 디자인
- [x] **알림 설정**: 아침 알림 시간, 주말 알림 설정

## 📱 화면 구성

| 화면 | 경로 | 설명 |
|------|------|------|
| 로그인 | `/login` | 이메일/비밀번호 로그인, 데모 계정 |
| 회원가입 | `/register` | 병원 + 관리자 등록, 30일 무료체험 |
| 홈 | `/` | KPI 현황, 오늘 할 일, 빠른 액션 |
| 상담 | `/consultations` | 상담 목록, 필터, 녹음 시작 |
| 상담 상세 | `/consultations/:id` | 상담 노트 전체 보기 |
| 녹음 | `/recording` | 상담 녹음 UI |
| 환자 | `/patients` | 환자 목록, 검색, 등록 |
| 환자 상세 | `/patients/:id` | 환자 카드, 히스토리 |
| 리포트 | `/report` | KPI 상세, 목표 설정 |
| 설정 | `/settings` | 알림 설정, 계정 관리 |

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
- `POST /` - 상담 생성
- `POST /:id/upload-audio` - 녹음 업로드 + AI 분석
- `POST /:id/analyze` - 텍스트 분석
- `PUT /:id` - 상담 수정
- `DELETE /:id` - 상담 삭제

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

## 🗄️ 데이터 모델

### Organizations (병원)
- id, name, plan_type, subscription_status, settings

### Users (상담사)
- id, organization_id, name, email, role, goals, settings

### Patients (환자)
- id, organization_id, name, phone, age, gender, memo, tags

### Consultations (상담)
- id, patient_id, user_id, consultation_date, duration
- transcript, summary, treatment_type, amount
- patient_psychology (JSON), emotion_flow (JSON), key_quotes (JSON)
- feedback (JSON), decision_score, status

### Contact Tasks (연락 태스크)
- id, patient_id, consultation_id, task_type (closing/proactive)
- recommended_date, recommended_message, points (JSON)
- status, result, result_note

### Contact Logs (연락 기록)
- id, patient_id, task_id, contact_type, contact_result, outcome, content

## 🔧 개발 환경 설정

```bash
# 의존성 설치
npm install

# 데이터베이스 마이그레이션
npm run db:migrate:local

# 시드 데이터 삽입
npm run db:seed

# 빌드
npm run build

# 로컬 개발 서버 (PM2)
pm2 start ecosystem.config.cjs

# 또는 직접 실행
npm run dev:sandbox
```

## 🔑 환경 변수

`.dev.vars` 파일에 다음 변수 설정:
```
OPENAI_API_KEY=your-openai-api-key
```

## 🚧 다음 개발 단계

### Phase 2 (예정)
- [ ] PWA 지원 (오프라인 녹음, 푸시 알림)
- [ ] 음성 TTS 안내 문구
- [ ] 덴트웹 연동
- [ ] 원장용 팀 대시보드

### Phase 3 (예정)
- [ ] 피부과/성형외과 커스텀 버전
- [ ] 실장간 비교 분석
- [ ] 고급 AI 분석 (화자 분리 개선)

## 📞 데모 계정

- **이메일**: kim@bddental.com
- **비밀번호**: test1234
- **병원**: 서울BD치과

---

**Patient Touch v1.0** - 페이션트퍼널  
"찾는 건 기계가, 연락은 사람이"
