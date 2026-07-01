// =============================================================================
// Domain Model Types
// =============================================================================
// Authoritative TypeScript interfaces for all domain entities.
// Used by Mongoose schemas, Zod validators, and repositories.
// =============================================================================

import type { Types } from 'mongoose';

import type {
  AppointmentStatus,
  AppointmentType,
  AuditAction,
  BillStatus,
  BloodGroup,
  FileCategory,
  Gender,
  MaritalStatus,
  PatientStatus,
  PatientType,
  ReferralSource,
  MedicationDuration,
  MedicationFrequency,
  MedicineRoute,
  NotificationPriority,
  NotificationStatus,
  NotificationType,
  PaymentMethod,
  PaymentStatus,
  PrescriptionStatus,
  QueuePriority,
  QueueTokenStatus,
  ReportStatus,
  ReportType,
  SequenceKey,
  ToothNumberingSystem,
  ToothStatus,
  ToothSurface,
  TreatmentCategory,
  TreatmentItemPriority,
  TreatmentItemStatus,
  TreatmentPlanStatus,
  VisitStatus,
  XrayRequestStatus,
  XrayRequestType,
  XrayType,
} from '@/types/enums';

// ─── Shared Sub-documents ───────────────────────────────────────────────────

export interface IAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface IEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface IMedicalCondition {
  name: string;
  diagnosedDate?: Date;
  isActive: boolean;
  notes?: string;
}

export interface IMedicalHabits {
  smoking: boolean;
  alcohol: boolean;
  tobacco: boolean;
}

export interface IBillLineItem {
  treatmentId?: Types.ObjectId;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface IPrescriptionMedication {
  medicineId?: Types.ObjectId;
  name: string;
  dosage: string;
  frequency: MedicationFrequency;
  duration: number;
  durationUnit: MedicationDuration;
  route: MedicineRoute;
  instructions?: string;
  morning?: boolean;
  afternoon?: boolean;
  night?: boolean;
  beforeFood?: boolean;
  afterFood?: boolean;
}

export interface ITreatmentPlanItem {
  treatmentId?: Types.ObjectId;
  procedureName: string;
  procedureCode?: string;
  toothNumbers: number[];
  estimatedCost: number;
  estimatedTimeMinutes?: number;
  priority?: TreatmentItemPriority;
  status?: TreatmentItemStatus;
  notes?: string;
}

export interface IToothSurfaceMap {
  mesial?: ToothStatus;
  distal?: ToothStatus;
  occlusal?: ToothStatus;
  buccal?: ToothStatus;
  lingual?: ToothStatus;
  incisal?: ToothStatus;
}

export interface IToothEntry {
  toothNumber: number;
  status: ToothStatus;
  surfaces?: IToothSurfaceMap;
  notes?: string;
}

export interface IToothTreatmentMapping {
  toothNumber: number;
  treatmentId: Types.ObjectId;
  surfaces: ToothSurface[];
}

export interface IWorkingHours {
  start: string;
  end: string;
}

export interface IThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface IAuditContext {
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
}

// ─── Base ───────────────────────────────────────────────────────────────────

export interface IBaseFields {
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedBy?: Types.ObjectId;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Permission ─────────────────────────────────────────────────────────────

export interface IPermission extends IBaseFields {
  code: string;
  resource: string;
  action: string;
  description: string;
  module: string;
  isActive: boolean;
}

// ─── Patient ────────────────────────────────────────────────────────────────

export interface IPediatricInfo {
  parentName?: string;
  guardianName?: string;
  schoolName?: string;
  pediatrician?: string;
  height?: number;
  weight?: number;
  guardianSignatureUrl?: string;
}

export interface IPatient extends IBaseFields {
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: Gender;
  phone: string;
  email?: string;
  address: IAddress;
  bloodGroup?: BloodGroup;
  maritalStatus?: MaritalStatus;
  occupation?: string;
  allergies: string[];
  notes?: string;
  profileImage?: string;
  patientType: PatientType;
  pediatricInfo?: IPediatricInfo;
  consentGiven: boolean;
  referredBy?: ReferralSource;
  status: PatientStatus;
}

// ─── Medical History ────────────────────────────────────────────────────────

export interface IMedicalHistory extends IBaseFields {
  patientId: Types.ObjectId;
  conditions: IMedicalCondition[];
  pastSurgeries: string[];
  currentMedications: string[];
  allergies: string[];
  familyHistory?: string;
  habits: IMedicalHabits;
  notes?: string;
}

// ─── Emergency Contact ──────────────────────────────────────────────────────

export interface IEmergencyContactRecord extends IBaseFields {
  patientId: Types.ObjectId;
  name: string;
  relationship: string;
  phone: string;
}

// ─── Visit ──────────────────────────────────────────────────────────────────

export interface IVisitConsultation {
  chiefComplaint?: string;
  presentIllness?: string;
  clinicalFindings?: string;
  diagnosis?: string;
  clinicalNotes?: string;
  additionalNotes?: string;
  treatmentRecommendation?: string;
  advice?: string;
  followUpDate?: Date;
  followUpTime?: string;
  followUpPurpose?: string;
  followUpReminder?: boolean;
  followUpNotes?: string;
}

export interface IVisit extends IBaseFields {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  visitNumber: number;
  visitCode?: string;
  date: Date;
  status: VisitStatus;
  chiefComplaint: string;
  consultation: IVisitConsultation;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
}

// ─── Appointment ────────────────────────────────────────────────────────────

export interface IAppointment extends IBaseFields {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  type: AppointmentType;
  status: AppointmentStatus;
  chiefComplaint?: string;
  notes?: string;
  rescheduleReason?: string;
  cancelReason?: string;
  rescheduledFrom?: Types.ObjectId;
}

// ─── Treatment ──────────────────────────────────────────────────────────────

export interface ITreatment extends IBaseFields {
  procedureName: string;
  procedureCode?: string;
  category: TreatmentCategory;
  defaultCost: number;
  duration: number;
  description?: string;
  isActive: boolean;
}

// ─── Treatment Plan ─────────────────────────────────────────────────────────

export interface ITreatmentPlan extends IBaseFields {
  visitId: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  name: string;
  description?: string;
  treatments: ITreatmentPlanItem[];
  totalEstimatedCost: number;
  validUntil?: Date;
  status: TreatmentPlanStatus;
}

// ─── Medicine ───────────────────────────────────────────────────────────────

export interface IMedicine extends IBaseFields {
  name: string;
  genericName?: string;
  defaultDosage?: string;
  defaultFrequency?: MedicationFrequency;
  defaultRoute?: MedicineRoute;
  manufacturer?: string;
  isActive: boolean;
}

// ─── Prescription ───────────────────────────────────────────────────────────

export interface IPrescription extends IBaseFields {
  visitId: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  medications: IPrescriptionMedication[];
  generalInstructions?: string;
  followUpDate?: Date;
  status: PrescriptionStatus;
}

// ─── Bill ───────────────────────────────────────────────────────────────────

export interface IBill extends IBaseFields {
  billNumber: string;
  visitId: Types.ObjectId;
  patientId: Types.ObjectId;
  lineItems: IBillLineItem[];
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: BillStatus;
  notes?: string;
  dueDate?: Date;
  finalizedAt?: Date;
}

// ─── Payment ─────────────────────────────────────────────────────────────────

export interface IPayment extends IBaseFields {
  receiptNumber: string;
  billId: Types.ObjectId;
  patientId: Types.ObjectId;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  referenceNumber?: string;
  notes?: string;
  receivedBy: Types.ObjectId;
  isRefund: boolean;
  refundReason?: string;
  refundedPaymentId?: Types.ObjectId;
  idempotencyKey?: string;
}

// ─── Queue Token ────────────────────────────────────────────────────────────

export interface IQueueToken extends IBaseFields {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  visitId?: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  date: string;
  tokenNumber: number;
  priority: QueuePriority;
  status: QueueTokenStatus;
  calledAt?: Date;
  completedAt?: Date;
  skipReason?: string;
  estimatedWaitTime?: number;
}

// ─── Tooth Chart ────────────────────────────────────────────────────────────

export interface IToothChart extends IBaseFields {
  visitId: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  numberingSystem: ToothNumberingSystem;
  teeth: IToothEntry[];
  treatmentMappings: IToothTreatmentMapping[];
}

// ─── Tooth Condition ────────────────────────────────────────────────────────

export interface IToothCondition extends IBaseFields {
  toothChartId: Types.ObjectId;
  visitId: Types.ObjectId;
  patientId: Types.ObjectId;
  toothNumber: number;
  status: ToothStatus;
  surfaces?: IToothSurfaceMap;
  notes?: string;
  recordedBy: Types.ObjectId;
  recordedAt: Date;
}

// ─── X-Ray ──────────────────────────────────────────────────────────────────

export interface IXRay extends IBaseFields {
  visitId: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId?: Types.ObjectId;
  type: XrayType;
  imageUrl: string;
  cloudinaryPublicId: string;
  fileName?: string;
  toothNumbers: number[];
  findings?: string;
  notes?: string;
  uploadedBy: Types.ObjectId;
}

export interface IXrayRequest extends IBaseFields {
  visitId: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  type: XrayRequestType;
  customType?: string;
  toothNumbers: number[];
  notes?: string;
  status: XrayRequestStatus;
  requestedAt: Date;
  fulfilledAt?: Date;
}

// ─── File ───────────────────────────────────────────────────────────────────

export interface IFile extends IBaseFields {
  patientId: Types.ObjectId;
  visitId?: Types.ObjectId;
  uploadedBy: Types.ObjectId;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  cloudinaryPublicId?: string;
  category: FileCategory;
}

// ─── Clinic Settings ────────────────────────────────────────────────────────

export interface IClinicSettings extends IBaseFields {
  clinicName: string;
  phone: string;
  email: string;
  address: IAddress;
  workingHours: IWorkingHours;
  workingDays: number[];
  appointmentDuration: number;
  currency: string;
  currencySymbol: string;
  patientIdPrefix: string;
  logo?: string;
  theme: IThemeSettings;
  invoiceHeader?: string;
  invoiceFooter?: string;
  prescriptionHeader?: string;
  prescriptionFooter?: string;
  gstEnabled: boolean;
  gstNumber?: string;
  gstRate: number;
  departments: string[];
}

// ─── Notification ───────────────────────────────────────────────────────────

export interface INotification extends IBaseFields {
  userId: Types.ObjectId;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  title: string;
  message: string;
  resource?: string;
  resourceId?: string;
  readAt?: Date;
  expiresAt?: Date;
}

// ─── Sequence ───────────────────────────────────────────────────────────────

export interface ISequence {
  key: SequenceKey | string;
  prefix?: string;
  year?: number;
  doctorId?: Types.ObjectId;
  date?: string;
  value: number;
  updatedAt: Date;
}

// ─── Report ─────────────────────────────────────────────────────────────────

export interface IReport extends IBaseFields {
  type: ReportType;
  status: ReportStatus;
  parameters: Record<string, unknown>;
  result?: Record<string, unknown>;
  generatedBy: Types.ObjectId;
  completedAt?: Date;
  errorMessage?: string;
  expiresAt?: Date;
  fileUrl?: string;
}

// ─── Audit Log (extended spec fields) ───────────────────────────────────────

export interface IAuditLogExtended {
  userId?: Types.ObjectId;
  userEmail?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  description?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  createdAt: Date;
}

// ─── Population Selectors ───────────────────────────────────────────────────

export const POPULATE = {
  doctorSummary: { path: 'doctorId', select: 'firstName lastName email' },
  patientSummary: {
    path: 'patientId',
    select: 'patientId firstName lastName phone profileImage',
  },
  userSummary: { path: 'createdBy', select: 'firstName lastName email' },
  billSummary: { path: 'billId', select: 'billNumber totalAmount balanceAmount status' },
  visitSummary: { path: 'visitId', select: 'visitNumber date status chiefComplaint' },
} as const;
