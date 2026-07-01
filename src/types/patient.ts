import type { Types } from 'mongoose';

import type { PatientStatus, PatientType } from '@/types/enums';
import type { IEmergencyContactRecord, IMedicalHistory, IPatient } from '@/types/models';
import { calculateAge } from '@/utils/date';
import { getDocumentId } from '@/utils/mongoose';

export interface PatientSummary {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email?: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  patientType: PatientType;
  status: PatientStatus;
  profileImage?: string;
  lastVisit?: string;
  outstandingDue: number;
  createdAt: string;
  updatedAt: string;
}

export interface PatientDetail extends PatientSummary {
  address: IPatient['address'];
  bloodGroup?: string;
  maritalStatus?: string;
  occupation?: string;
  allergies: string[];
  notes?: string;
  referredBy?: string;
  pediatricInfo?: IPatient['pediatricInfo'];
  consentGiven: boolean;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalHistory?: IMedicalHistory | null;
  isDeleted: boolean;
}

export interface PatientTypeaheadResult {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  phone: string;
  profileImage?: string;
}

export interface TimelineEntry {
  type: 'visit' | 'appointment' | 'bill' | 'prescription' | 'payment' | 'file';
  id: string;
  date: string;
  summary: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

export interface CheckinLookupResult {
  found: boolean;
  patient?: PatientDetail;
}

export interface CheckinSubmitResult {
  patientId: string;
  hospitalId: string;
  tokenNumber: number;
  visitId: string;
  message: string;
}

function getId(doc: { _id?: Types.ObjectId | string }): string {
  if (!doc._id) return '';
  return typeof doc._id === 'string' ? doc._id : doc._id.toString();
}

export function mapPatientSummary(
  patient: IPatient,
  extras?: { lastVisit?: Date; outstandingDue?: number },
): PatientSummary {
  return {
    id: getId(patient as IPatient & { _id: Types.ObjectId }),
    patientId: patient.patientId,
    firstName: patient.firstName,
    lastName: patient.lastName,
    fullName: `${patient.firstName} ${patient.lastName}`.trim(),
    phone: patient.phone,
    email: patient.email,
    dateOfBirth: new Date(patient.dateOfBirth).toISOString(),
    age: calculateAge(patient.dateOfBirth),
    gender: patient.gender,
    patientType: patient.patientType,
    status: patient.status,
    profileImage: patient.profileImage,
    lastVisit: extras?.lastVisit?.toISOString(),
    outstandingDue: extras?.outstandingDue ?? 0,
    createdAt: new Date(patient.createdAt).toISOString(),
    updatedAt: new Date(patient.updatedAt).toISOString(),
  };
}

export function mapPatientDetail(
  patient: IPatient,
  emergencyContact?: IEmergencyContactRecord | null,
  medicalHistory?: IMedicalHistory | null,
  extras?: { lastVisit?: Date; outstandingDue?: number },
): PatientDetail {
  const summary = mapPatientSummary(patient, extras);
  return {
    ...summary,
    address: patient.address,
    bloodGroup: patient.bloodGroup,
    maritalStatus: patient.maritalStatus,
    occupation: patient.occupation,
    allergies: patient.allergies ?? [],
    notes: patient.notes,
    referredBy: patient.referredBy,
    pediatricInfo: patient.pediatricInfo,
    consentGiven: patient.consentGiven,
    emergencyContact: emergencyContact
      ? {
          name: emergencyContact.name,
          relationship: emergencyContact.relationship,
          phone: emergencyContact.phone,
        }
      : undefined,
    medicalHistory: medicalHistory ?? null,
    isDeleted: patient.isDeleted,
  };
}

export function mapTypeahead(patient: IPatient): PatientTypeaheadResult {
  return {
    id: getDocumentId(patient),
    patientId: patient.patientId,
    firstName: patient.firstName,
    lastName: patient.lastName,
    phone: patient.phone,
    profileImage: patient.profileImage,
  };
}
