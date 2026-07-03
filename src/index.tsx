import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { renderer } from './renderer'
import { securityHeaders, authRateLimit, apiRateLimit, uploadRateLimit, reportRateLimit, csrfProtection, auditLog } from './lib/middleware'

// Import routes
import authRoutes from './routes/auth'
import patientRoutes from './routes/patients'
import consultationRoutes from './routes/consultations'
import taskRoutes from './routes/tasks'
import dashboardRoutes from './routes/dashboard'
import reportRoutes from './routes/reports'
import retentionRoutes from './routes/retention'
import kakaoRoutes from './routes/kakao'
import pushRoutes from './routes/push'
import privacyRoutes from './routes/privacy'
import leadRoutes from './routes/leads'
import { WelcomePage } from './components/pages/WelcomePage'

// Import pages
import { LoginPage } from './components/pages/LoginPage'
import { RegisterPage } from './components/pages/RegisterPage'
import { HomePage } from './components/pages/HomePage'
import { TodayPage } from './components/pages/TodayPage'
import { ConsultationsPage } from './components/pages/ConsultationsPage'
import { ConsultationDetailPage } from './components/pages/ConsultationDetailPage'
import { PatientsPage } from './components/pages/PatientsPage'
import { PatientDetailPage } from './components/pages/PatientDetailPage'
import { ReportPage } from './components/pages/ReportPage'
import { ConsultationReportPage } from './components/pages/ConsultationReportPage'
import { RecordingPage } from './components/pages/RecordingPage'
import { SettingsPage } from './components/pages/SettingsPage'
import { AdminDashboardPage } from './components/pages/AdminDashboardPage'
import { ProposalPage } from './components/pages/ProposalPage'
import { RetentionPage } from './components/pages/RetentionPage'
import { GrowthPage } from './components/pages/GrowthPage'
import { ReferralNetworkPage } from './components/pages/ReferralNetworkPage'
import { ChurnPredictionPage } from './components/pages/ChurnPredictionPage'
import { ChurnRetrainingPage } from './components/pages/ChurnRetrainingPage'

import type { AppEnv } from './types'

const app = new Hono<AppEnv>()

// Middleware
app.use('*', logger())
app.use('*', securityHeaders)
app.use('*', auditLog)
// v8.0: CORS restricted — same-origin cookie auth; allow only known origins
app.use('/api/*', cors({
  origin: (origin) => {
    if (!origin) return origin; // same-origin/no-origin requests
    try {
      const host = new URL(origin).hostname;
      if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.pages.dev') || host.endsWith('.e2b.dev')) return origin;
    } catch {}
    return '';
  },
  credentials: true,
}))
app.use('/api/*', csrfProtection())
app.use('/api/auth/login', authRateLimit)
app.use('/api/auth/register', authRateLimit)
app.use('/api/reports/*/generate', reportRateLimit)
// 업로드 계열만 제한 — GET /audio 재생은 세그먼트 순차 재생이라 제한하면 안 됨
// segments 업로드는 60초당 1회라 apiRateLimit(120/min)으로 충분
app.use('/api/consultations/*/upload-audio', uploadRateLimit)
app.use('/api/*', apiRateLimit)
app.use(renderer)

// API Routes
app.route('/api/auth', authRoutes)
app.route('/api/patients', patientRoutes)
app.route('/api/consultations', consultationRoutes)
app.route('/api/tasks', taskRoutes)
app.route('/api/dashboard', dashboardRoutes)
app.route('/api/reports', reportRoutes)
app.route('/api/retention', retentionRoutes)
app.route('/api/kakao', kakaoRoutes)
app.route('/api/push', pushRoutes)
app.route('/api/privacy', privacyRoutes)
app.route('/api/leads', leadRoutes)

// Page Routes
app.get('/welcome', (c) => c.render(<WelcomePage />, { title: '페이션트 터치 — 치과 상담을 매출 엔진으로' }))
app.get('/login', (c) => c.render(<LoginPage />, { title: '로그인 - 페이션트 터치' }))
app.get('/register', (c) => c.render(<RegisterPage />, { title: '회원가입 - 페이션트 터치' }))
app.get('/', (c) => c.render(<HomePage />, { title: '홈 - 페이션트 터치' }))
app.get('/today', (c) => c.render(<TodayPage />, { title: '오늘의 액션 - 페이션트 터치' }))
app.get('/consultations', (c) => c.render(<ConsultationsPage />, { title: '상담 - 페이션트 터치' }))
app.get('/consultations/:id', (c) => c.render(<ConsultationDetailPage id={c.req.param('id')} />, { title: '상담 상세 - 페이션트 터치' }))
app.get('/consultations/:id/report', (c) => c.render(<ConsultationReportPage id={c.req.param('id')} />, { title: '상담 레포트 - 페이션트 터치' }))
app.get('/patients', (c) => c.render(<PatientsPage />, { title: '환자 - 페이션트 터치' }))
app.get('/patients/:id', (c) => c.render(<PatientDetailPage id={c.req.param('id')} />, { title: '환자 상세 - 페이션트 터치' }))
app.get('/report', (c) => c.render(<ReportPage />, { title: '리포트 - 페이션트 터치' }))
app.get('/recording', (c) => c.render(<RecordingPage />, { title: '상담 녹음 - 페이션트 터치' }))
app.get('/recording/:patientId', (c) => c.render(<RecordingPage patientId={c.req.param('patientId')} />, { title: '상담 녹음 - 페이션트 터치' }))
app.get('/settings', (c) => c.render(<SettingsPage />, { title: '설정 - 페이션트 터치' }))
app.get('/retention', (c) => c.render(<RetentionPage />, { title: '리텐션 - 페이션트 터치' }))
app.get('/growth', (c) => c.render(<GrowthPage />, { title: '상담 성장 추적 - 페이션트 터치' }))
app.get('/network', (c) => c.render(<ReferralNetworkPage />, { title: '환자 소개 네트워크 - 페이션트 터치' }))
app.get('/retention/churn', (c) => c.render(<ChurnPredictionPage />, { title: 'AI 이탈 예측 - 페이션트 터치' }))
app.get('/retention/retraining', (c) => c.render(<ChurnRetrainingPage />, { title: '모델 재학습 대시보드 - 페이션트 터치' }))
app.get('/admin', (c) => c.render(<AdminDashboardPage />, { title: '원장 대시보드 - 페이션트 터치' }))

// Public Pages (no auth)
app.get('/proposal/:token', (c) => c.render(<ProposalPage token={c.req.param('token')} />, { title: '치료 제안서' }))

export default app
