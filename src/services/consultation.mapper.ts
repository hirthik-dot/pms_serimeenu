import type { Types } from 'mongoose';

import type { IUser } from '@/models/user.model';
import type {
  ConsultationRecord,
  ConsultationWorkspaceData,
  DoctorDashboardAppointment,
  DoctorDashboardData,
  MedicineSearchResult,
  PrescriptionDto,
  TreatmentPlanDto,
  TreatmentSearchResult,
  VisitFileDto,
  VisitPatientSummary,
  VisitSummary,
  XrayRequestDto,
} from '@/types/consultation';
import type { IMedicine, IPatient, IPrescription, ITreatment, ITreatmentPlan, IVisit, IXrayRequest } from '@/types/models';
import { mapVisitToConsultationStatus } from '@/utils/consultation-status';
import { calculateAge, toISODateString } from '@/utils/date';
import { getDocumentId } from '@/utils/mongoose';

type PopulatedPatient = IPatient & { _id: Types.ObjectId };
type PopulatedDoctor = IUser & { _id: Types.ObjectId };

function resolvePopulated<T>(value: T | Types.ObjectId | undefined): T | undefined {
  if (!value || typeof value === 'string') return undefined;
  if ('_id' in (value as object)) return value as T;
  return undefined;
}

export function mapVisitPatient(patient: PopulatedPatient, extras?: { outstandingDue?: number; lastVisit?: Date }): VisitPatientSummary {
  return {
    id: getDocumentId(patient),
    patientId: patient.patientId,
    firstName: patient.firstName,
    lastName: patient.lastName,
    fullName: `${patient.firstName} ${patient.lastName}`,
    phone: patient.phone,
    profileImage: patient.profileImage,
    dateOfBirth: patient.dateOfBirth ? toISODateString(patient.dateOfBirth) : undefined,
    age: patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : undefined,
    gender: patient.gender,
    bloodGroup: patient.bloodGroup,
    status: patient.status,
    outstandingDue: extras?.outstandingDue,
    lastVisit: extras?.lastVisit ? toISODateString(extras.lastVisit) : undefined,
  };
}

export function mapVisitSummary(
  visit: IVisit,
  extras?: { tokenNumber?: number; outstandingDue?: number; lastVisit?: Date },
): VisitSummary {
  const patient = resolvePopulated<PopulatedPatient>(visit.patientId as never)!;
  const doctor = resolvePopulated<PopulatedDoctor>(visit.doctorId as never)!;

  return {
    id: getDocumentId(visit),
    visitNumber: visit.visitNumber,
    visitCode: visit.visitCode,
    date: toISODateString(visit.date),
    status: visit.status,
    consultationStatus: mapVisitToConsultationStatus(visit.status, visit.startedAt),
    chiefComplaint: visit.chiefComplaint,
    patient: mapVisitPatient(patient, {
      outstandingDue: extras?.outstandingDue,
      lastVisit: extras?.lastVisit,
    }),
    doctor: {
      id: getDocumentId(doctor),
      firstName: doctor.firstName,
      lastName: doctor.lastName,
    },
    startedAt: visit.startedAt ? visit.startedAt.toISOString() : undefined,
    completedAt: visit.completedAt ? visit.completedAt.toISOString() : undefined,
    tokenNumber: extras?.tokenNumber,
  };
}

export function mapConsultationRecord(visit: IVisit): ConsultationRecord {
  const c = visit.consultation ?? {};

  return {
    visitId: getDocumentId(visit),
    status: visit.status,
    consultationStatus: mapVisitToConsultationStatus(visit.status, visit.startedAt),
    chiefComplaint: visit.chiefComplaint,
    presentIllness: c.presentIllness,
    clinicalFindings: c.clinicalFindings,
    diagnosis: c.diagnosis,
    clinicalNotes: c.clinicalNotes,
    additionalNotes: c.additionalNotes,
    treatmentRecommendation: c.treatmentRecommendation,
    advice: c.advice,
    followUpDate: c.followUpDate ? toISODateString(c.followUpDate) : undefined,
    followUpTime: c.followUpTime,
    followUpPurpose: c.followUpPurpose,
    followUpReminder: c.followUpReminder,
    followUpNotes: c.followUpNotes,
    startedAt: visit.startedAt ? visit.startedAt.toISOString() : undefined,
    completedAt: visit.completedAt ? visit.completedAt.toISOString() : undefined,
  };
}

export function mapPrescription(prescription: IPrescription): PrescriptionDto {
  return {
    id: getDocumentId(prescription),
    visitId: String(prescription.visitId),
    patientId: String(prescription.patientId),
    medications: prescription.medications.map((m) => ({
      medicineId: m.medicineId ? String(m.medicineId) : undefined,
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      duration: m.duration,
      durationUnit: m.durationUnit,
      route: m.route,
      instructions: m.instructions,
      morning: m.morning,
      afternoon: m.afternoon,
      night: m.night,
      beforeFood: m.beforeFood,
      afterFood: m.afterFood,
    })),
    generalInstructions: prescription.generalInstructions,
    followUpDate: prescription.followUpDate ? toISODateString(prescription.followUpDate) : undefined,
    status: prescription.status,
    createdAt: prescription.createdAt.toISOString(),
    updatedAt: prescription.updatedAt.toISOString(),
  };
}

export function mapTreatmentPlan(plan: ITreatmentPlan): TreatmentPlanDto {
  return {
    id: getDocumentId(plan),
    visitId: String(plan.visitId),
    patientId: String(plan.patientId),
    name: plan.name,
    description: plan.description,
    treatments: plan.treatments.map((t) => ({
      treatmentId: t.treatmentId ? String(t.treatmentId) : undefined,
      procedureName: t.procedureName,
      procedureCode: t.procedureCode,
      toothNumbers: t.toothNumbers,
      estimatedCost: t.estimatedCost,
      estimatedTimeMinutes: t.estimatedTimeMinutes,
      priority: t.priority,
      status: t.status,
      notes: t.notes,
    })),
    totalEstimatedCost: plan.totalEstimatedCost,
    validUntil: plan.validUntil ? toISODateString(plan.validUntil) : undefined,
    status: plan.status,
  };
}

export function mapXrayRequest(request: IXrayRequest): XrayRequestDto {
  return {
    id: getDocumentId(request),
    visitId: String(request.visitId),
    patientId: String(request.patientId),
    type: request.type,
    customType: request.customType,
    toothNumbers: request.toothNumbers,
    notes: request.notes,
    status: request.status,
    requestedAt: request.requestedAt.toISOString(),
  };
}

export function mapMedicine(medicine: IMedicine): MedicineSearchResult {
  return {
    id: getDocumentId(medicine),
    name: medicine.name,
    genericName: medicine.genericName,
    defaultDosage: medicine.defaultDosage,
    defaultFrequency: medicine.defaultFrequency,
    defaultRoute: medicine.defaultRoute,
  };
}

export function mapTreatmentSearch(treatment: ITreatment): TreatmentSearchResult {
  return {
    id: getDocumentId(treatment),
    procedureName: treatment.procedureName,
    procedureCode: treatment.procedureCode,
    defaultCost: treatment.defaultCost,
    duration: treatment.duration,
  };
}

export function mapVisitFile(file: {
  _id: unknown;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  category: string;
  createdAt: Date;
}): VisitFileDto {
  return {
    id: getDocumentId(file),
    fileName: file.fileName,
    originalName: file.originalName,
    mimeType: file.mimeType,
    size: file.size,
    url: file.url,
    category: file.category,
    createdAt: file.createdAt.toISOString(),
  };
}

export function buildWorkspaceData(
  visit: VisitSummary,
  consultation: ConsultationRecord,
  treatmentPlan: TreatmentPlanDto | null,
  prescription: PrescriptionDto | null,
  xrayRequests: XrayRequestDto[],
  files: VisitFileDto[],
  nextAppointment: DoctorDashboardAppointment | null,
): ConsultationWorkspaceData {
  return {
    visit,
    consultation,
    treatmentPlan,
    prescription,
    xrayRequests,
    files,
    nextAppointment,
  };
}

export function buildDashboardData(data: DoctorDashboardData): DoctorDashboardData {
  return data;
}
