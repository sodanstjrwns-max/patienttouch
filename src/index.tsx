import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { renderer } from './renderer'

// Import routes
import authRoutes from './routes/auth'
import patientRoutes from './routes/patients'
import consultationRoutes from './routes/consultations'
import taskRoutes from './routes/tasks'
import dashboardRoutes from './routes/dashboard'

// Import pages
import { LoginPage } from './components/pages/LoginPage'
import { RegisterPage } from './components/pages/RegisterPage'
import { HomePage } from './components/pages/HomePage'
import { ConsultationsPage } from './components/pages/ConsultationsPage'
import { ConsultationDetailPage } from './components/pages/ConsultationDetailPage'
import { PatientsPage } from './components/pages/PatientsPage'
import { PatientDetailPage } from './components/pages/PatientDetailPage'
import { ReportPage } from './components/pages/ReportPage'
import { RecordingPage } from './components/pages/RecordingPage'
import { SettingsPage } from './components/pages/SettingsPage'

import type { Env } from './types'

const app = new Hono<{ Bindings: Env }>()

// Middleware
app.use('*', logger())
app.use('/api/*', cors())
app.use(renderer)

// API Routes
app.route('/api/auth', authRoutes)
app.route('/api/patients', patientRoutes)
app.route('/api/consultations', consultationRoutes)
app.route('/api/tasks', taskRoutes)
app.route('/api/dashboard', dashboardRoutes)

// Page Routes
app.get('/login', (c) => c.render(<LoginPage />, { title: '로그인 - 페이션트 터치' }))
app.get('/register', (c) => c.render(<RegisterPage />, { title: '회원가입 - 페이션트 터치' }))
app.get('/', (c) => c.render(<HomePage />, { title: '홈 - 페이션트 터치' }))
app.get('/consultations', (c) => c.render(<ConsultationsPage />, { title: '상담 - 페이션트 터치' }))
app.get('/consultations/:id', (c) => c.render(<ConsultationDetailPage id={c.req.param('id')} />, { title: '상담 상세 - 페이션트 터치' }))
app.get('/patients', (c) => c.render(<PatientsPage />, { title: '환자 - 페이션트 터치' }))
app.get('/patients/:id', (c) => c.render(<PatientDetailPage id={c.req.param('id')} />, { title: '환자 상세 - 페이션트 터치' }))
app.get('/report', (c) => c.render(<ReportPage />, { title: '리포트 - 페이션트 터치' }))
app.get('/recording', (c) => c.render(<RecordingPage />, { title: '상담 녹음 - 페이션트 터치' }))
app.get('/recording/:patientId', (c) => c.render(<RecordingPage patientId={c.req.param('patientId')} />, { title: '상담 녹음 - 페이션트 터치' }))
app.get('/settings', (c) => c.render(<SettingsPage />, { title: '설정 - 페이션트 터치' }))

export default app
