import type {
  ConsultationDisplayStatus,
  MedicationDuration,
  MedicationFrequency,
  MedicineRoute,
  ToothNumberingSystem,
  ToothStatus,
  ToothSurface,
  TreatmentItemPriority,
  TreatmentItemStatus,
  TreatmentPlanStatus,
  VisitStatus,
  XrayRequestStatus,
  XrayRequestType,
} from '@/types/enums';
import type { IToothSurfaceMap } from '@/types/models';

export interface VisitPatientSummary {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  profileImage?: string;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  status?: string;
  outstandingDue?: number;
  lastVisit?: string;
}

export interface VisitDoctorSummary {
  id: string;
  firstName: string;
  lastName: string;
}

export interface VisitSummary {
  id: string;
  visitNumber: number;
  visitCode?: string;
  date: string;
  status: VisitStatus;
  consultationStatus: ConsultationDisplayStatus;
  chiefComplaint: string;
  patient: VisitPatientSummary;
  doctor: VisitDoctorSummary;
  startedAt?: string;
  completedAt?: string;
  tokenNumber?: number;
}

export interface ConsultationRecord {
  visitId: string;
  status: VisitStatus;
  consultationStatus: ConsultationDisplayStatus;
  chiefComplaint: string;
  presentIllness?: string;
  clinicalFindings?: string;
  diagnosis?: string;
  clinicalNotes?: string;
  additionalNotes?: string;
  treatmentRecommendation?: string;
  advice?: string;
  followUpDate?: string;
  followUpTime?: string;
  followUpPurpose?: string;
  followUpReminder?: boolean;
  followUpNotes?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface PrescriptionMedicationDto {
  medicineId?: string;
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

export interface PrescriptionDto {
  id: string;
  visitId: string;
  patientId: string;
  medications: PrescriptionMedicationDto[];
  generalInstructions?: string;
  followUpDate?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface TreatmentPlanItemDto {
  treatmentId?: string;
  procedureName: string;
  procedureCode?: string;
  toothNumbers: number[];
  estimatedCost: number;
  estimatedTimeMinutes?: number;
  priority?: TreatmentItemPriority;
  status?: TreatmentItemStatus;
  notes?: string;
}

export interface TreatmentPlanDto {
  id: string;
  visitId: string;
  patientId: string;
  name: string;
  description?: string;
  treatments: TreatmentPlanItemDto[];
  totalEstimatedCost: number;
  validUntil?: string;
  status: TreatmentPlanStatus;
}

export interface XrayRequestDto {
  id: string;
  visitId: string;
  patientId: string;
  type: XrayRequestType;
  customType?: string;
  toothNumbers: number[];
  notes?: string;
  status: XrayRequestStatus;
  requestedAt: string;
}

export interface VisitFileDto {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  category: string;
  createdAt: string;
}

export interface DoctorDashboardStats {
  todayTotal: number;
  waiting: number;
  inConsultation: number;
  completed: number;
}

export interface DoctorDashboardAppointment {
  id: string;
  patientId: string;
  patientName: string;
  hospitalId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  chiefComplaint?: string;
}

export interface DoctorDashboardData {
  stats: DoctorDashboardStats;
  waitingPatients: VisitSummary[];
  inConsultation: VisitSummary[];
  completedToday: VisitSummary[];
  upcomingAppointments: DoctorDashboardAppointment[];
  recentPatients: VisitPatientSummary[];
}

export interface ConsultationWorkspaceData {
  visit: VisitSummary;
  consultation: ConsultationRecord;
  treatmentPlan: TreatmentPlanDto | null;
  prescription: PrescriptionDto | null;
  xrayRequests: XrayRequestDto[];
  files: VisitFileDto[];
  nextAppointment: DoctorDashboardAppointment | null;
}

export interface MedicineSearchResult {
  id: string;
  name: string;
  genericName?: string;
  defaultDosage?: string;
  defaultFrequency?: MedicationFrequency;
  defaultRoute?: MedicineRoute;
}

export interface TreatmentSearchResult {
  id: string;
  procedureName: string;
  procedureCode?: string;
  defaultCost: number;
  duration: number;
}

export interface ClinicalHistoryItem {
  id: string;
  date: string;
  summary: string;
  details?: string;
  type: 'diagnosis' | 'prescription' | 'treatment' | 'xray' | 'bill' | 'note' | 'procedure';
}

export interface ClinicalHistorySearchResult {
  diagnoses: ClinicalHistoryItem[];
  prescriptions: ClinicalHistoryItem[];
  treatments: ClinicalHistoryItem[];
  xrays: ClinicalHistoryItem[];
  bills: ClinicalHistoryItem[];
  notes: ClinicalHistoryItem[];
  procedures: ClinicalHistoryItem[];
}

export type AutoSaveState = 'idle' | 'saving' | 'saved' | 'unsaved' | 'error';

export interface ToothEntryDto {
  toothNumber: number;
  status: ToothStatus;
  surfaces?: IToothSurfaceMap;
  notes?: string;
}

export interface ToothTreatmentMappingDto {
  toothNumber: number;
  treatmentId: string;
  procedureName?: string;
  surfaces: ToothSurface[];
}

export interface ToothChartDto {
  id: string;
  visitId: string;
  patientId: string;
  numberingSystem: ToothNumberingSystem;
  teeth: ToothEntryDto[];
  treatmentMappings: ToothTreatmentMappingDto[];
  doctor?: { id: string; firstName: string; lastName: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface ToothConditionHistoryItem {
  id: string;
  toothNumber: number;
  status: ToothStatus;
  surfaces?: IToothSurfaceMap;
  notes?: string;
  recordedAt: string;
  recordedBy?: { id: string; name: string };
  visit?: { id: string; visitNumber?: number; date?: string };
}

export interface ToothChartHistoryDto {
  data: ToothConditionHistoryItem[];
  total: number;
  page: number;
  limit: number;
}
