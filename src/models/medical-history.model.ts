import mongoose, { Schema, type Document, type Model } from 'mongoose';

import {
  applyBaseIndexes,
  auditHooks,
  baseSchemaDefinition,
  baseSchemaOptions,
  softDeletePlugin,
} from '@/models/base';
import { medicalConditionSchema, medicalHabitsSchema } from '@/models/shared.schemas';
import type { IMedicalHistory } from '@/types/models';

export type MedicalHistoryDocument = IMedicalHistory & Document;

const medicalHistorySchema = new Schema<IMedicalHistory>(
  {
    ...baseSchemaDefinition,
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    conditions: { type: [medicalConditionSchema], default: [] },
    pastSurgeries: { type: [String], default: [] },
    currentMedications: { type: [String], default: [] },
    allergies: { type: [String], default: [] },
    familyHistory: { type: String, trim: true },
    habits: { type: medicalHabitsSchema, default: () => ({}) },
    notes: { type: String, trim: true, maxlength: 5000 },
  },
  baseSchemaOptions,
);

medicalHistorySchema.index({ patientId: 1, version: -1 });
medicalHistorySchema.index({ patientId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

applyBaseIndexes(medicalHistorySchema);
softDeletePlugin(medicalHistorySchema);
auditHooks(medicalHistorySchema, { resource: 'medical_history' });

export const MedicalHistoryModel: Model<IMedicalHistory> =
  (mongoose.models.MedicalHistory as Model<IMedicalHistory> | undefined) ??
  mongoose.model<IMedicalHistory>('MedicalHistory', medicalHistorySchema);
