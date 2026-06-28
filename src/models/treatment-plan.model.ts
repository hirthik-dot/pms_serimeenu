import mongoose, { Schema, type Document, type Model } from 'mongoose';

import {
  applyBaseIndexes,
  auditHooks,
  baseSchemaDefinition,
  baseSchemaOptions,
  softDeletePlugin,
} from '@/models/base';
import { treatmentPlanItemSchema } from '@/models/shared.schemas';
import { TreatmentPlanStatus } from '@/types/enums';
import type { ITreatmentPlan } from '@/types/models';

export type TreatmentPlanDocument = ITreatmentPlan & Document;

const treatmentPlanSchema = new Schema<ITreatmentPlan>(
  {
    ...baseSchemaDefinition,
    visitId: { type: Schema.Types.ObjectId, ref: 'Visit', required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    treatments: { type: [treatmentPlanItemSchema], default: [] },
    totalEstimatedCost: { type: Number, required: true, min: 0, default: 0 },
    validUntil: { type: Date },
    status: { type: String, enum: Object.values(TreatmentPlanStatus), default: TreatmentPlanStatus.Proposed },
  },
  baseSchemaOptions,
);

treatmentPlanSchema.index({ visitId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
treatmentPlanSchema.index({ patientId: 1, createdAt: -1 });
treatmentPlanSchema.index({ doctorId: 1, status: 1 });

applyBaseIndexes(treatmentPlanSchema);
softDeletePlugin(treatmentPlanSchema);
auditHooks(treatmentPlanSchema, { resource: 'treatment_plans' });

export const TreatmentPlanModel: Model<ITreatmentPlan> =
  (mongoose.models.TreatmentPlan as Model<ITreatmentPlan> | undefined) ??
  mongoose.model<ITreatmentPlan>('TreatmentPlan', treatmentPlanSchema);

export const TREATMENT_PLAN_POPULATE = {
  detail: [
    { path: 'visitId', select: 'visitNumber date status' },
    { path: 'patientId', select: 'patientId firstName lastName' },
    { path: 'doctorId', select: 'firstName lastName' },
    { path: 'treatments.treatmentId', select: 'procedureName procedureCode defaultCost' },
  ],
} as const;
