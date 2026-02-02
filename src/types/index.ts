// Patient Touch Type Definitions

export interface Organization {
  id: string;
  name: string;
  plan_type: 'basic' | 'standard' | 'premium' | 'enterprise';
  subscription_status: 'active' | 'expired' | 'trial';
  subscription_start_date: string;
  subscription_end_date: string;
  settings: OrganizationSettings;
  created_at: string;
  updated_at: string;
}

export interface OrganizationSettings {
  notification_time?: string;
  recording_notice?: string;
  weekend_notification?: boolean;
}

export interface User {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  phone?: string;
  goals: UserGoals;
  settings: UserSettings;
  created_at: string;
  last_login_at?: string;
}

export interface UserGoals {
  conversion_rate?: number;
  avg_score?: number;
  contact_rate?: number;
  re_consultation?: number;
}

export interface UserSettings {
  notification_enabled?: boolean;
  notification_time?: string;
  weekend_notification?: boolean;
}

export interface Patient {
  id: string;
  organization_id: string;
  name: string;
  phone?: string;
  age?: number;
  gender?: 'male' | 'female';
  memo?: string;
  tags: string[];
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Consultation {
  id: string;
  organization_id: string;
  user_id: string;
  patient_id: string;
  consultation_date: string;
  duration?: number;
  audio_url?: string;
  transcript?: string;
  summary?: string;
  treatment_type?: string;
  treatment_area?: string;
  amount?: number;
  patient_psychology: PatientPsychology;
  emotion_flow: EmotionFlow;
  key_quotes: string[];
  companion?: CompanionInfo;
  referrer?: ReferrerInfo;
  previous_experience?: string;
  feedback: ConsultationFeedback;
  status: 'pending' | 'undecided' | 'paid' | 'lost';
  decision_score: number;
  ai_analysis_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  // Joined fields
  patient_name?: string;
  user_name?: string;
}

export interface PatientPsychology {
  fear?: string;
  hesitation_reason?: string;
  decision_factor?: string;
  special_event?: string;
  decision_maker?: string;
  budget?: string;
}

export interface EmotionFlow {
  overall_tone?: 'positive' | 'neutral' | 'negative';
  decision_score?: number;
  timeline?: EmotionTimelineItem[];
  summary?: string;
}

export interface EmotionTimelineItem {
  time: string;
  emotion: string;
  note?: string;
}

export interface CompanionInfo {
  present: boolean;
  relationship?: string;
  reaction?: string;
}

export interface ReferrerInfo {
  exists: boolean;
  name?: string;
  patient_id?: string;
}

export interface ConsultationFeedback {
  good_points?: string[];
  improve_points?: ImprovePoint[];
  scores?: FeedbackScores;
  total_score?: number;
}

export interface ImprovePoint {
  issue: string;
  suggestion: string;
}

export interface FeedbackScores {
  needs_identification?: number;
  value_delivery?: number;
  objection_handling?: number;
  closing?: number;
}

export interface ContactTask {
  id: string;
  organization_id: string;
  consultation_id?: string;
  user_id: string;
  patient_id: string;
  task_type: 'closing' | 'proactive';
  recommended_date: string;
  recommended_message?: string;
  points: string[];
  status: 'pending' | 'completed' | 'skipped';
  completed_at?: string;
  result?: 'booked' | 'callback' | 'hold' | 'rejected';
  result_note?: string;
  created_at: string;
  // Joined fields
  patient_name?: string;
  patient_phone?: string;
  consultation?: Consultation;
}

export interface ContactLog {
  id: string;
  organization_id: string;
  patient_id: string;
  user_id: string;
  task_id?: string;
  contact_type: 'call' | 'message' | 'kakao';
  contact_result?: 'success' | 'no_answer' | 'busy';
  outcome?: 'booked' | 'callback' | 'hold' | 'rejected';
  content?: string;
  created_at: string;
}

// KPI Types
export interface KPIData {
  conversion_rate: number;
  avg_score: number;
  contact_rate: number;
  re_consultation: number;
  total_consultations: number;
  paid_consultations: number;
  total_tasks: number;
  completed_tasks: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth Types
export interface AuthPayload {
  user_id: string;
  organization_id: string;
  email: string;
  role: string;
  exp: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  organization_name: string;
  phone?: string;
}

// AI Analysis Types
export interface AIAnalysisResult {
  transcript: string;
  summary: string;
  patient_psychology: PatientPsychology;
  emotion_flow: EmotionFlow;
  key_quotes: string[];
  feedback: ConsultationFeedback;
  treatment_type?: string;
  treatment_area?: string;
  amount?: number;
  decision_score: number;
}

// Bindings for Cloudflare
export interface Env {
  DB: D1Database;
  R2: R2Bucket;
  OPENAI_API_KEY: string;
}
