import mongoose, { Schema, type Document, type Model } from 'mongoose';

import {
  applyBaseIndexes,
  auditHooks,
  baseSchemaDefinition,
  baseSchemaOptions,
  softDeletePlugin,
} from '@/models/base';
import { MedicationFrequency, MedicineRoute } from '@/types/enums';
import type { IMedicine } from '@/types/models';

export type MedicineDocument = IMedicine & Document;

const medicineSchema = new Schema<IMedicine>(
  {
    ...baseSchemaDefinition,
    name: { type: String, required: true, trim: true, maxlength: 200 },
    genericName: { type: String, trim: true, maxlength: 200 },
    defaultDosage: { type: String, trim: true },
    defaultFrequency: { type: String, enum: Object.values(MedicationFrequency) },
    defaultRoute: { type: String, enum: Object.values(MedicineRoute) },
    manufacturer: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  baseSchemaOptions,
);

medicineSchema.index({ name: 'text', genericName: 'text' }, { name: 'medicine_text_search' });
medicineSchema.index({ isActive: 1, name: 1 });

applyBaseIndexes(medicineSchema);
softDeletePlugin(medicineSchema);
auditHooks(medicineSchema, { resource: 'medicines' });

export const MedicineModel: Model<IMedicine> =
  (mongoose.models.Medicine as Model<IMedicine> | undefined) ??
  mongoose.model<IMedicine>('Medicine', medicineSchema);
