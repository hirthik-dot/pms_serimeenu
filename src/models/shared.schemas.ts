// =============================================================================
// Shared Mongoose Sub-schemas
// =============================================================================

import { Schema } from 'mongoose';

import {
  BloodGroup,
  Gender,
  MaritalStatus,
  MedicationDuration,
  MedicationFrequency,
  MedicineRoute,
  PatientStatus,
  PatientType,
  TreatmentItemPriority,
  TreatmentItemStatus,
  ToothStatus,
  UserStatus,
} from '@/types/enums';
import type {
  IAddress,
  IBillLineItem,
  IEmergencyContact,
  IMedicalCondition,
  IMedicalHabits,
  IPediatricInfo,
  IPrescriptionMedication,
  IToothEntry,
  IToothSurfaceMap,
  IToothTreatmentMapping,
  ITreatmentPlanItem,
  IVisitConsultation,
  IWorkingHours,
} from '@/types/models';

export const addressSchema = new Schema<IAddress>(
  {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: 'India' },
  },
  { _id: false },
);

export const emergencyContactSchema = new Schema<IEmergencyContact>(
  {
    name: { type: String, required: true, trim: true },
    relationship: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { _id: false },
);

export const medicalConditionSchema = new Schema<IMedicalCondition>(
  {
    name: { type: String, required: true, trim: true },
    diagnosedDate: { type: Date },
    isActive: { type: Boolean, default: true },
    notes: { type: String, trim: true },
  },
  { _id: false },
);

export const medicalHabitsSchema = new Schema<IMedicalHabits>(
  {
    smoking: { type: Boolean, default: false },
    alcohol: { type: Boolean, default: false },
    tobacco: { type: Boolean, default: false },
  },
  { _id: false },
);

export const visitConsultationSchema = new Schema<IVisitConsultation>(
  {
    chiefComplaint: { type: String, trim: true, maxlength: 500 },
    presentIllness: { type: String, trim: true, maxlength: 5000 },
    clinicalFindings: { type: String, trim: true, maxlength: 5000 },
    diagnosis: { type: String, trim: true, maxlength: 1000 },
    clinicalNotes: { type: String, trim: true, maxlength: 10000 },
    additionalNotes: { type: String, trim: true, maxlength: 5000 },
    treatmentRecommendation: { type: String, trim: true, maxlength: 5000 },
    advice: { type: String, trim: true, maxlength: 2000 },
    followUpDate: { type: Date },
    followUpTime: { type: String, trim: true },
    followUpPurpose: { type: String, trim: true, maxlength: 500 },
    followUpReminder: { type: Boolean, default: false },
    followUpNotes: { type: String, trim: true, maxlength: 1000 },
  },
  { _id: false },
);

export const billLineItemSchema = new Schema<IBillLineItem>(
  {
    treatmentId: { type: Schema.Types.ObjectId, ref: 'Treatment' },
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

export const prescriptionMedicationSchema = new Schema<IPrescriptionMedication>(
  {
    medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine' },
    name: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    frequency: { type: String, enum: Object.values(MedicationFrequency), required: true },
    duration: { type: Number, required: true, min: 1 },
    durationUnit: { type: String, enum: Object.values(MedicationDuration), required: true },
    route: { type: String, enum: Object.values(MedicineRoute), default: MedicineRoute.Oral },
    instructions: { type: String, trim: true },
    morning: { type: Boolean, default: false },
    afternoon: { type: Boolean, default: false },
    night: { type: Boolean, default: false },
    beforeFood: { type: Boolean, default: false },
    afterFood: { type: Boolean, default: false },
  },
  { _id: false },
);

export const treatmentPlanItemSchema = new Schema<ITreatmentPlanItem>(
  {
    treatmentId: { type: Schema.Types.ObjectId, ref: 'Treatment' },
    procedureName: { type: String, required: true, trim: true },
    procedureCode: { type: String, trim: true },
    toothNumbers: { type: [Number], default: [] },
    estimatedCost: { type: Number, required: true, min: 0 },
    estimatedTimeMinutes: { type: Number, min: 0, default: 30 },
    priority: { type: String, enum: Object.values(TreatmentItemPriority), default: TreatmentItemPriority.Medium },
    status: { type: String, enum: Object.values(TreatmentItemStatus), default: TreatmentItemStatus.Pending },
    notes: { type: String, trim: true },
  },
  { _id: false },
);

export const toothSurfaceMapSchema = new Schema<IToothSurfaceMap>(
  {
    mesial: { type: String, enum: Object.values(ToothStatus) },
    distal: { type: String, enum: Object.values(ToothStatus) },
    occlusal: { type: String, enum: Object.values(ToothStatus) },
    buccal: { type: String, enum: Object.values(ToothStatus) },
    lingual: { type: String, enum: Object.values(ToothStatus) },
    incisal: { type: String, enum: Object.values(ToothStatus) },
  },
  { _id: false },
);

export const toothEntrySchema = new Schema<IToothEntry>(
  {
    toothNumber: { type: Number, required: true },
    status: { type: String, enum: Object.values(ToothStatus), required: true },
    surfaces: { type: toothSurfaceMapSchema },
    notes: { type: String, trim: true },
  },
  { _id: false },
);

export const toothTreatmentMappingSchema = new Schema<IToothTreatmentMapping>(
  {
    toothNumber: { type: Number, required: true },
    treatmentId: { type: Schema.Types.ObjectId, ref: 'Treatment', required: true },
    surfaces: { type: [String], default: [] },
  },
  { _id: false },
);

export const workingHoursSchema = new Schema<IWorkingHours>(
  {
    start: { type: String, required: true },
    end: { type: String, required: true },
  },
  { _id: false },
);

export const pediatricInfoSchema = new Schema<IPediatricInfo>(
  {
    parentName: { type: String, trim: true, maxlength: 100 },
    guardianName: { type: String, trim: true, maxlength: 100 },
    schoolName: { type: String, trim: true, maxlength: 150 },
    pediatrician: { type: String, trim: true, maxlength: 100 },
    height: { type: Number, min: 0, max: 300 },
    weight: { type: Number, min: 0, max: 500 },
    guardianSignatureUrl: { type: String },
  },
  { _id: false },
);

export const genderEnum = Object.values(Gender);
export const bloodGroupEnum = Object.values(BloodGroup);
export const maritalStatusEnum = Object.values(MaritalStatus);
export const userStatusEnum = Object.values(UserStatus);
export const patientStatusEnum = Object.values(PatientStatus);
export const patientTypeEnum = Object.values(PatientType);
