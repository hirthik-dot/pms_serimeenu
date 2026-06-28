import mongoose, { Schema, type Document, type Model } from 'mongoose';

import {
  applyBaseIndexes,
  auditHooks,
  baseSchemaDefinition,
  baseSchemaOptions,
  softDeletePlugin,
} from '@/models/base';
import { TreatmentCategory } from '@/types/enums';
import type { ITreatment } from '@/types/models';

export type TreatmentDocument = ITreatment & Document;

const treatmentSchema = new Schema<ITreatment>(
  {
    ...baseSchemaDefinition,
    procedureName: { type: String, required: true, trim: true, maxlength: 200 },
    procedureCode: { type: String, trim: true, uppercase: true },
    category: { type: String, enum: Object.values(TreatmentCategory), required: true },
    defaultCost: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true, min: 1, default: 30 },
    description: { type: String, trim: true, maxlength: 2000 },
    isActive: { type: Boolean, default: true },
  },
  baseSchemaOptions,
);

treatmentSchema.index({ procedureName: 'text', procedureCode: 'text' }, { name: 'treatment_text_search' });
treatmentSchema.index({ category: 1, isActive: 1 });
treatmentSchema.index({ procedureCode: 1 }, { sparse: true });

applyBaseIndexes(treatmentSchema);
softDeletePlugin(treatmentSchema);
auditHooks(treatmentSchema, { resource: 'treatments' });

export const TreatmentModel: Model<ITreatment> =
  (mongoose.models.Treatment as Model<ITreatment> | undefined) ??
  mongoose.model<ITreatment>('Treatment', treatmentSchema);
