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

// ============================================
// Presenter Types (Report & Proposal)
// ============================================

export interface ConsultationReport {
  id: string;
  organization_id: string;
  consultation_id: string;
  patient_summary?: string;
  consultation_summary: string;
  treatment_options: TreatmentOption[];
  discussed_amount?: number;
  payment_options: PaymentOptions;
  patient_concerns: PatientConcern[];
  emotion_timeline: EmotionTimelineEntry[];
  emotion_summary?: string;
  overall_sentiment: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
  decision_factors: DecisionFactors;
  decision_score: number;
  decision_prediction?: string;
  next_actions: NextAction[];
  recommended_followup_date?: string;
  followup_message?: string;
  coaching_feedback: CoachingFeedback;
  coaching_score: number;
  generated_at: string;
  generation_model?: string;
  is_edited: boolean;
  edited_at?: string;
}

export interface TreatmentOption {
  name: string;
  price: number;
  duration?: string;
  pros: string[];
  cons: string[];
  recommendation_level: 'high' | 'medium' | 'low';
}

export interface PaymentOptions {
  full_payment?: number;
  installment_options: InstallmentOption[];
}

export interface InstallmentOption {
  months: number;
  monthly_amount: number;
  interest_rate?: number;
}

export interface PatientConcern {
  concern: string;
  addressed: boolean;
  resolution?: string;
}

export interface EmotionTimelineEntry {
  timestamp: number;
  score: number;
  note?: string;
  highlight?: boolean;
  speaker: 'consultant' | 'patient';
}

export interface DecisionFactors {
  main_concern?: string;
  decision_maker?: string;
  budget_range?: string;
  timeline?: string;
}

export interface NextAction {
  action: string;
  due_date?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface CoachingFeedback {
  scores: {
    rapport: number;
    spin: number;
    objection_handling: number;
    pricing_framing: number;
    closing: number;
    structure: number;
  };
  total_score: number;
  strengths: string[];
  improvements: CoachingImprovement[];
  patient_code_evaluation?: string;
}

export interface CoachingImprovement {
  issue: string;
  suggestion: string;
  example?: string;
  timestamp?: number;
}

export interface TreatmentProposal {
  id: string;
  organization_id: string;
  consultation_id: string;
  report_id: string;
  patient_id: string;
  title: string;
  greeting_message?: string;
  selected_options: ProposalOption[];
  recommended_option?: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  installment_options: InstallmentOption[];
  default_installment_months: number;
  hospital_name?: string;
  hospital_logo_url?: string;
  hospital_phone?: string;
  public_token: string;
  public_url?: string;
  expires_at?: string;
  sent_via?: 'kakao' | 'sms' | 'email' | 'link';
  sent_at?: string;
  viewed_at?: string;
  view_count: number;
  cta_clicked: boolean;
  status: 'draft' | 'sent' | 'viewed' | 'expired' | 'converted';
}

export interface ProposalOption {
  name: string;
  price: number;
  duration?: string;
  benefits: string[];
  recommended: boolean;
}

export interface DiarizedSegment {
  speaker: 'consultant' | 'patient' | 'unknown';
  text: string;
  start: number;
  end: number;
  emotion?: number;
  confidence?: number;
}

export interface RealtimeHint {
  type: 'pricing' | 'objection' | 'closing' | 'rapport' | 'spin' | 'warning';
  message: string;
  trigger_text?: string;
  timestamp: number;
}

export interface ConsultantStats {
  id: string;
  organization_id: string;
  user_id: string;
  period_type: 'daily' | 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  total_consultations: number;
  total_duration_minutes: number;
  converted_count: number;
  pending_count: number;
  lost_count: number;
  conversion_rate: number;
  total_amount: number;
  avg_amount: number;
  avg_coaching_score: number;
  proposals_sent: number;
  proposals_viewed: number;
  proposals_converted: number;
}

// ============================================
// Retention Module Types
// ============================================

export type TreatmentType = 'implant' | 'ortho' | 'prosthetic' | 'endo' | 'extraction' | 'scaling' | 'whitening' | 'laminate' | 'general';
export type TreatmentStatus = 'consulted' | 'scheduled' | 'in_progress' | 'completed' | 'abandoned';
export type RetentionStatus = 'in_treatment' | 'unscheduled_urgent' | 'unscheduled_warning' | 'recall_6m' | 'recall_12m' | 'at_risk' | 'consulted_unconverted' | 'active' | 'completed';
export type RetentionContactResult = 'connected' | 'no_answer' | 'message_sent' | 'callback_promised' | 'appointment_booked' | 'refused';

export interface PatientTreatment {
  id: string;
  organization_id: string;
  patient_id: string;
  treatment_type: TreatmentType;
  treatment_name?: string;
  status: TreatmentStatus;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  started_at?: string;
  completed_at?: string;
  next_appointment?: string;
  source_consultation_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PatientRetentionStatus {
  id: string;
  organization_id: string;
  patient_id: string;
  status: RetentionStatus;
  risk_score: number;
  last_visit_date?: string;
  days_since_visit: number;
  remaining_treatment_value: number;
  recommended_contact_date?: string;
  recommended_contact_script?: string;
  recommended_contact_type?: 'phone' | 'text' | 'kakao';
  priority_score: number;
  updated_at: string;
  // Joined fields
  patient_name?: string;
  patient_phone?: string;
  patient_age?: number;
  patient_gender?: string;
  treatments?: PatientTreatment[];
}

export interface RetentionContact {
  id: string;
  organization_id: string;
  patient_id: string;
  staff_id: string;
  treatment_id?: string;
  contact_type: 'phone' | 'text' | 'kakao';
  result: RetentionContactResult;
  notes?: string;
  next_contact_date?: string;
  contacted_at: string;
  // Joined
  staff_name?: string;
}

export interface RetentionDashboard {
  incomplete_count: number;
  recall_count: number;
  contact_completion_rate: number;
  estimated_lost_revenue: number;
  today_contacts: PatientRetentionStatus[];
  status_distribution: Record<string, number>;
}

// Bindings for Cloudflare
export interface Env {
  DB: D1Database;
  R2: R2Bucket;
  OPENAI_API_KEY: string;
  DEEPGRAM_API_KEY?: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}
