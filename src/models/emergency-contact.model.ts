import mongoose, { Schema, type Document, type Model } from 'mongoose';

import {
  applyBaseIndexes,
  auditHooks,
  baseSchemaDefinition,
  baseSchemaOptions,
  softDeletePlugin,
} from '@/models/base';
import type { IEmergencyContactRecord } from '@/types/models';

export type EmergencyContactDocument = IEmergencyContactRecord & Document;

const emergencyContactSchema = new Schema<IEmergencyContactRecord>(
  {
    ...baseSchemaDefinition,
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    relationship: { type: String, required: true, trim: true, maxlength: 50 },
    phone: { type: String, required: true, trim: true },
  },
  baseSchemaOptions,
);

emergencyContactSchema.index({ patientId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
emergencyContactSchema.index({ phone: 1 });

applyBaseIndexes(emergencyContactSchema);
softDeletePlugin(emergencyContactSchema);
auditHooks(emergencyContactSchema, { resource: 'emergency_contacts' });

export const EmergencyContactModel: Model<IEmergencyContactRecord> =
  (mongoose.models.EmergencyContact as Model<IEmergencyContactRecord> | undefined) ??
  mongoose.model<IEmergencyContactRecord>('EmergencyContact', emergencyContactSchema);
