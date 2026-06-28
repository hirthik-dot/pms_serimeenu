import mongoose, { Schema, type Document, type Model } from 'mongoose';

import {
  applyBaseIndexes,
  auditHooks,
  baseSchemaDefinition,
  baseSchemaOptions,
  softDeletePlugin,
} from '@/models/base';
import { prescriptionMedicationSchema } from '@/models/shared.schemas';
import { PrescriptionStatus } from '@/types/enums';
import type { IPrescription } from '@/types/models';

export type PrescriptionDocument = IPrescription & Document;

const prescriptionSchema = new Schema<IPrescription>(
  {
    ...baseSchemaDefinition,
    visitId: { type: Schema.Types.ObjectId, ref: 'Visit', required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    medications: {
      type: [prescriptionMedicationSchema],
      required: true,
      validate: [(v: unknown[]) => v.length >= 1 && v.length <= 20, '1-20 medications required'],
    },
    generalInstructions: { type: String, trim: true, maxlength: 2000 },
    followUpDate: { type: Date },
    status: { type: String, enum: Object.values(PrescriptionStatus), default: PrescriptionStatus.Active },
  },
  baseSchemaOptions,
);

prescriptionSchema.index({ visitId: 1 });
prescriptionSchema.index({ patientId: 1, createdAt: -1 });
prescriptionSchema.index({ doctorId: 1, createdAt: -1 });

applyBaseIndexes(prescriptionSchema);
softDeletePlugin(prescriptionSchema, { preventHardDelete: true });
auditHooks(prescriptionSchema, { resource: 'prescriptions' });

export const PrescriptionModel: Model<IPrescription> =
  (mongoose.models.Prescription as Model<IPrescription> | undefined) ??
  mongoose.model<IPrescription>('Prescription', prescriptionSchema);

export const PRESCRIPTION_POPULATE = {
  list: [
    { path: 'patientId', select: 'patientId firstName lastName' },
    { path: 'doctorId', select: 'firstName lastName' },
  ],
  detail: [
    { path: 'visitId', select: 'visitNumber date status' },
    { path: 'patientId', select: 'patientId firstName lastName phone dateOfBirth gender' },
    { path: 'doctorId', select: 'firstName lastName' },
    { path: 'medications.medicineId', select: 'name genericName defaultDosage' },
  ],
} as const;
