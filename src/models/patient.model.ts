import mongoose, { Schema, type Document, type Model } from 'mongoose';

import {
  applyBaseIndexes,
  auditHooks,
  baseSchemaDefinition,
  baseSchemaOptions,
  softDeletePlugin,
} from '@/models/base';
import {
  addressSchema,
  bloodGroupEnum,
  genderEnum,
  maritalStatusEnum,
  pediatricInfoSchema,
  patientStatusEnum,
  patientTypeEnum,
} from '@/models/shared.schemas';
import { PatientStatus, PatientType, ReferralSource } from '@/types/enums';
import type { IPatient } from '@/types/models';

export type PatientDocument = IPatient & Document;

const patientSchema = new Schema<IPatient>(
  {
    ...baseSchemaDefinition,
    patientId: { type: String, required: true, unique: true, trim: true, uppercase: true },
    firstName: { type: String, required: true, trim: true, maxlength: 100 },
    lastName: { type: String, required: true, trim: true, maxlength: 100 },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: genderEnum, required: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: addressSchema, required: true },
    bloodGroup: { type: String, enum: bloodGroupEnum },
    maritalStatus: { type: String, enum: maritalStatusEnum },
    occupation: { type: String, trim: true, maxlength: 100 },
    allergies: { type: [String], default: [], validate: [(v: string[]) => v.length <= 50, 'Max 50 allergies'] },
    notes: { type: String, trim: true, maxlength: 2000 },
    profileImage: { type: String },
    patientType: { type: String, enum: patientTypeEnum, default: PatientType.Adult },
    pediatricInfo: { type: pediatricInfoSchema },
    consentGiven: { type: Boolean, default: false },
    referredBy: { type: String, enum: Object.values(ReferralSource) },
    status: { type: String, enum: patientStatusEnum, default: PatientStatus.Active },
  },
  baseSchemaOptions,
);

patientSchema.index({ lastName: 1, firstName: 1 });
patientSchema.index(
  { phone: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);
patientSchema.index(
  {
    firstName: 'text',
    lastName: 'text',
    patientId: 'text',
    phone: 'text',
    email: 'text',
    'pediatricInfo.guardianName': 'text',
    'pediatricInfo.schoolName': 'text',
  },
  { name: 'patient_text_search' },
);
patientSchema.index({ status: 1 });
patientSchema.index({ 'pediatricInfo.guardianName': 1 }, { sparse: true });
patientSchema.index({ 'pediatricInfo.schoolName': 1 }, { sparse: true });

patientSchema.virtual('fullName').get(function fullName(this: IPatient) {
  return `${this.firstName} ${this.lastName}`;
});

applyBaseIndexes(patientSchema);
softDeletePlugin(patientSchema, { preventHardDelete: true });
auditHooks(patientSchema, { resource: 'patients' });

export const PatientModel: Model<IPatient> =
  (mongoose.models.Patient as Model<IPatient> | undefined) ??
  mongoose.model<IPatient>('Patient', patientSchema);

export const PATIENT_POPULATE = {
  list: '',
  detail: '',
} as const;
