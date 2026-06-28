import mongoose, { Schema, type Document, type Model } from 'mongoose';

import { PATIENT_ID } from '@/constants/app';
import {
  applyBaseIndexes,
  auditHooks,
  baseSchemaDefinition,
  baseSchemaOptions,
  softDeletePlugin,
} from '@/models/base';
import { addressSchema, workingHoursSchema } from '@/models/shared.schemas';
import type { IClinicSettings } from '@/types/models';

export type ClinicSettingsDocument = IClinicSettings & Document;

const themeSchema = new Schema(
  {
    primaryColor: { type: String, default: '#0066CC' },
    secondaryColor: { type: String, default: '#FFFFFF' },
    accentColor: { type: String, default: '#FF6600' },
  },
  { _id: false },
);

const clinicSettingsSchema = new Schema<IClinicSettings>(
  {
    ...baseSchemaDefinition,
    clinicName: { type: String, required: true, trim: true, default: 'Smile Dental Hospital' },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    address: { type: addressSchema, required: true },
    workingHours: {
      type: workingHoursSchema,
      default: () => ({ start: '09:00', end: '18:00' }),
    },
    workingDays: { type: [Number], default: [1, 2, 3, 4, 5, 6] },
    appointmentDuration: { type: Number, default: 30, min: 5 },
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    patientIdPrefix: { type: String, default: PATIENT_ID.DEFAULT_PREFIX, uppercase: true, trim: true },
    logo: { type: String },
    theme: { type: themeSchema, default: () => ({}) },
    invoiceHeader: { type: String, trim: true },
    invoiceFooter: { type: String, trim: true },
    prescriptionHeader: { type: String, trim: true },
    prescriptionFooter: { type: String, trim: true },
    gstEnabled: { type: Boolean, default: false },
    gstNumber: { type: String, trim: true },
    gstRate: { type: Number, default: 18, min: 0 },
    departments: { type: [String], default: ['General Dentistry', 'Orthodontics', 'Oral Surgery'] },
  },
  baseSchemaOptions,
);

clinicSettingsSchema.index({ isDeleted: 1 });

applyBaseIndexes(clinicSettingsSchema);
softDeletePlugin(clinicSettingsSchema);
auditHooks(clinicSettingsSchema, { resource: 'clinic_settings' });

export const ClinicSettingsModel: Model<IClinicSettings> =
  (mongoose.models.ClinicSettings as Model<IClinicSettings> | undefined) ??
  mongoose.model<IClinicSettings>('ClinicSettings', clinicSettingsSchema);
