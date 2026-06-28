import mongoose, { Schema, type Document, type Model } from 'mongoose';

import {
  applyBaseIndexes,
  auditHooks,
  baseSchemaDefinition,
  baseSchemaOptions,
  softDeletePlugin,
} from '@/models/base';
import { toothEntrySchema, toothTreatmentMappingSchema } from '@/models/shared.schemas';
import { ToothNumberingSystem } from '@/types/enums';
import type { IToothChart } from '@/types/models';

export type ToothChartDocument = IToothChart & Document;

const toothChartSchema = new Schema<IToothChart>(
  {
    ...baseSchemaDefinition,
    visitId: { type: Schema.Types.ObjectId, ref: 'Visit', required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    numberingSystem: {
      type: String,
      enum: Object.values(ToothNumberingSystem),
      default: ToothNumberingSystem.FDI,
    },
    teeth: { type: [toothEntrySchema], default: [] },
    treatmentMappings: { type: [toothTreatmentMappingSchema], default: [] },
  },
  baseSchemaOptions,
);

toothChartSchema.index({ visitId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
toothChartSchema.index({ patientId: 1, createdAt: -1 });

applyBaseIndexes(toothChartSchema);
softDeletePlugin(toothChartSchema);
auditHooks(toothChartSchema, { resource: 'tooth_charts' });

export const ToothChartModel: Model<IToothChart> =
  (mongoose.models.ToothChart as Model<IToothChart> | undefined) ??
  mongoose.model<IToothChart>('ToothChart', toothChartSchema);

export const TOOTH_CHART_POPULATE = {
  detail: [
    { path: 'visitId', select: 'visitNumber date' },
    { path: 'patientId', select: 'patientId firstName lastName' },
    { path: 'doctorId', select: 'firstName lastName' },
    { path: 'treatmentMappings.treatmentId', select: 'procedureName procedureCode' },
  ],
} as const;
