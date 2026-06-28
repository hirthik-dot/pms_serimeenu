import mongoose, { Schema, type Document, type Model } from 'mongoose';

import {
  applyBaseIndexes,
  auditHooks,
  baseSchemaDefinition,
  baseSchemaOptions,
  softDeletePlugin,
} from '@/models/base';
import { toothSurfaceMapSchema } from '@/models/shared.schemas';
import { ToothStatus } from '@/types/enums';
import type { IToothCondition } from '@/types/models';

export type ToothConditionDocument = IToothCondition & Document;

const toothConditionSchema = new Schema<IToothCondition>(
  {
    ...baseSchemaDefinition,
    toothChartId: { type: Schema.Types.ObjectId, ref: 'ToothChart', required: true },
    visitId: { type: Schema.Types.ObjectId, ref: 'Visit', required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    toothNumber: { type: Number, required: true },
    status: { type: String, enum: Object.values(ToothStatus), required: true },
    surfaces: { type: toothSurfaceMapSchema },
    notes: { type: String, trim: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recordedAt: { type: Date, required: true, default: () => new Date() },
  },
  baseSchemaOptions,
);

toothConditionSchema.index({ toothChartId: 1, toothNumber: 1 });
toothConditionSchema.index({ patientId: 1, toothNumber: 1, recordedAt: -1 });
toothConditionSchema.index({ visitId: 1 });

applyBaseIndexes(toothConditionSchema);
softDeletePlugin(toothConditionSchema);
auditHooks(toothConditionSchema, { resource: 'tooth_conditions' });

export const ToothConditionModel: Model<IToothCondition> =
  (mongoose.models.ToothCondition as Model<IToothCondition> | undefined) ??
  mongoose.model<IToothCondition>('ToothCondition', toothConditionSchema);
