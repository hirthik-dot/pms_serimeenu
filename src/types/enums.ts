// =============================================================================
// Domain Enums
// =============================================================================
// Single source of truth for all enumerated values used across the application.
// These are used in Mongoose schemas, Zod validators, and UI components.
// =============================================================================

// ─── User & Auth ────────────────────────────────────────────────────────────

export enum UserRole {
  SuperAdmin = 'super_admin',
  Admin = 'admin',
  Doctor = 'doctor',
  Receptionist = 'receptionist',
  Support = 'support',
  Patient = 'patient',
}

export enum UserStatus {
  Active = 'active',
  Inactive = 'inactive',
  Suspended = 'suspended',
}

// ─── Patient ────────────────────────────────────────────────────────────────

export enum PatientStatus {
  Active = 'active',
  Waiting = 'waiting',
  InConsultation = 'in_consultation',
  BillingPending = 'billing_pending',
  Completed = 'completed',
  Inactive = 'inactive',
  Archived = 'archived',
}

export enum PatientType {
  Adult = 'adult',
  Pediatric = 'pediatric',
}

export enum Gender {
  Male = 'male',
  Female = 'female',
  Other = 'other',
  PreferNotToSay = 'prefer_not_to_say',
}

export enum BloodGroup {
  APositive = 'A+',
  ANegative = 'A-',
  BPositive = 'B+',
  BNegative = 'B-',
  ABPositive = 'AB+',
  ABNegative = 'AB-',
  OPositive = 'O+',
  ONegative = 'O-',
  Unknown = 'unknown',
}

export enum MaritalStatus {
  Single = 'single',
  Married = 'married',
  Divorced = 'divorced',
  Widowed = 'widowed',
}

// ─── Appointment ────────────────────────────────────────────────────────────

export enum AppointmentStatus {
  Scheduled = 'scheduled',
  Confirmed = 'confirmed',
  CheckedIn = 'checked_in',
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled',
  NoShow = 'no_show',
}

export enum AppointmentType {
  Consultation = 'consultation',
  FollowUp = 'follow_up',
  Emergency = 'emergency',
  Routine = 'routine',
}

// ─── Visit ──────────────────────────────────────────────────────────────────

export enum VisitStatus {
  WaitingRoom = 'waiting_room',
  WithDoctor = 'with_doctor',
  TreatmentInProgress = 'treatment_in_progress',
  Completed = 'completed',
  BillingPending = 'billing_pending',
  Cancelled = 'cancelled',
}

export enum ConsultationDisplayStatus {
  Draft = 'draft',
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

// ─── Treatment ──────────────────────────────────────────────────────────────

export enum TreatmentCategory {
  Preventive = 'preventive',
  Restorative = 'restorative',
  Endodontic = 'endodontic',
  Periodontic = 'periodontic',
  Prosthodontic = 'prosthodontic',
  OralSurgery = 'oral_surgery',
  Orthodontic = 'orthodontic',
  Pediatric = 'pediatric',
  Cosmetic = 'cosmetic',
  Diagnostic = 'diagnostic',
  Other = 'other',
}

export enum ToothSurface {
  Mesial = 'mesial',
  Distal = 'distal',
  Occlusal = 'occlusal',
  Buccal = 'buccal',
  Lingual = 'lingual',
  Incisal = 'incisal',
}

// ─── Tooth Chart ────────────────────────────────────────────────────────────

export enum ToothStatus {
  Healthy = 'healthy',
  Decayed = 'decayed',
  Filled = 'filled',
  Missing = 'missing',
  Crowned = 'crowned',
  RootCanal = 'root_canal',
  Implant = 'implant',
  Bridge = 'bridge',
  Extracted = 'extracted',
  Impacted = 'impacted',
  Fractured = 'fractured',
}

export enum ToothNumberingSystem {
  Universal = 'universal',
  FDI = 'fdi',
  Palmer = 'palmer',
}

// ─── Billing ────────────────────────────────────────────────────────────────

export enum BillStatus {
  Draft = 'draft',
  Finalized = 'finalized',
  PartiallyPaid = 'partially_paid',
  Paid = 'paid',
  Refunded = 'refunded',
  Cancelled = 'cancelled',
}

export enum PaymentMethod {
  Cash = 'cash',
  Card = 'card',
  UPI = 'upi',
  BankTransfer = 'bank_transfer',
  Cheque = 'cheque',
  Other = 'other',
}

export enum PaymentStatus {
  Success = 'success',
  Failed = 'failed',
  Refunded = 'refunded',
}

// ─── X-Ray ──────────────────────────────────────────────────────────────────

export enum XrayType {
  Periapical = 'periapical',
  Panoramic = 'panoramic',
  Bitewing = 'bitewing',
  Cephalometric = 'cephalometric',
  CBCT = 'cbct',
  Occlusal = 'occlusal',
}

export enum XrayRequestType {
  OPG = 'opg',
  IOPA = 'iopa',
  CBCT = 'cbct',
  ClinicalPhoto = 'clinical_photo',
  Custom = 'custom',
}

export enum XrayRequestStatus {
  Pending = 'pending',
  Fulfilled = 'fulfilled',
  Cancelled = 'cancelled',
}

// ─── Notification ───────────────────────────────────────────────────────────

export enum NotificationType {
  AppointmentReminder = 'appointment_reminder',
  NewPatient = 'new_patient',
  BillingAlert = 'billing_alert',
  SystemAlert = 'system_alert',
  PatientCheckedIn = 'patient_checked_in',
  XrayRequest = 'xray_request',
}

export enum NotificationPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

// ─── Audit ──────────────────────────────────────────────────────────────────

export enum AuditAction {
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
  Login = 'login',
  Logout = 'logout',
  Export = 'export',
  Upload = 'upload',
}

// ─── Prescription ───────────────────────────────────────────────────────────

export enum MedicationFrequency {
  OnceDaily = 'once_daily',
  TwiceDaily = 'twice_daily',
  ThriceDaily = 'thrice_daily',
  FourTimesDaily = 'four_times_daily',
  AsNeeded = 'as_needed',
  BeforeMeals = 'before_meals',
  AfterMeals = 'after_meals',
  AtBedtime = 'at_bedtime',
}

export enum MedicationDuration {
  Days = 'days',
  Weeks = 'weeks',
  Months = 'months',
  Ongoing = 'ongoing',
}

// ─── Treatment Plan ─────────────────────────────────────────────────────────

export enum TreatmentPlanStatus {
  Proposed = 'proposed',
  Accepted = 'accepted',
  Rejected = 'rejected',
  InProgress = 'in_progress',
  Completed = 'completed',
}

export enum TreatmentItemPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Urgent = 'urgent',
}

export enum TreatmentItemStatus {
  Pending = 'pending',
  Scheduled = 'scheduled',
  InProgress = 'in_progress',
  Completed = 'completed',
}

// ─── Queue ──────────────────────────────────────────────────────────────────

export enum QueueTokenStatus {
  Waiting = 'waiting',
  Called = 'called',
  Skipped = 'skipped',
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum QueuePriority {
  Normal = 'normal',
  Emergency = 'emergency',
}

// ─── Files ──────────────────────────────────────────────────────────────────

export enum FileCategory {
  Consent = 'consent',
  Referral = 'referral',
  Insurance = 'insurance',
  LabReport = 'lab_report',
  MedicalDocument = 'medical_document',
  Report = 'report',
  ClinicalPhoto = 'clinical_photo',
  Other = 'other',
}

// ─── Reports ────────────────────────────────────────────────────────────────

export enum ReportType {
  Revenue = 'revenue',
  Appointments = 'appointments',
  Doctors = 'doctors',
  Patients = 'patients',
  Gst = 'gst',
  Payments = 'payments',
  Treatments = 'treatments',
}

export enum ReportStatus {
  Pending = 'pending',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
  Expired = 'expired',
}

// ─── Sequences ──────────────────────────────────────────────────────────────

export enum SequenceKey {
  Patient = 'patient',
  VisitGlobal = 'visit_global',
  Invoice = 'invoice',
  Receipt = 'receipt',
}

// ─── Notifications ──────────────────────────────────────────────────────────

export enum NotificationStatus {
  Unread = 'unread',
  Read = 'read',
  Archived = 'archived',
}

// ─── Medicine ───────────────────────────────────────────────────────────────

export enum MedicineRoute {
  Oral = 'oral',
  Topical = 'topical',
  Injection = 'injection',
  Inhalation = 'inhalation',
  Other = 'other',
}

// ─── Prescription ───────────────────────────────────────────────────────────

export enum PrescriptionStatus {
  Active = 'active',
  Completed = 'completed',
  Cancelled = 'cancelled',
}
