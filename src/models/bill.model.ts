import mongoose, { Schema, type Document, type Model, type PopulateOptions } from 'mongoose';

import {
  applyBaseIndexes,
  auditHooks,
  baseSchemaDefinition,
  baseSchemaOptions,
  softDeletePlugin,
} from '@/models/base';
import { billLineItemSchema } from '@/models/shared.schemas';
import { BillStatus } from '@/types/enums';
import type { IBill } from '@/types/models';

export type BillDocument = IBill & Document;

const billSchema = new Schema<IBill>(
  {
    ...baseSchemaDefinition,
    billNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    visitId: { type: Schema.Types.ObjectId, ref: 'Visit', required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    lineItems: { type: [billLineItemSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0, default: 0 },
    discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
    discountAmount: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0, default: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    balanceAmount: { type: Number, required: true, min: 0, default: 0 },
    status: { type: String, enum: Object.values(BillStatus), default: BillStatus.Draft },
    notes: { type: String, trim: true, maxlength: 2000 },
    dueDate: { type: Date },
    finalizedAt: { type: Date },
  },
  baseSchemaOptions,
);

billSchema.index({ patientId: 1 });
billSchema.index({ status: 1 });
billSchema.index({ visitId: 1 });
billSchema.index({ balanceAmount: 1, status: 1 });
billSchema.index({ billNumber: 'text' }, { name: 'bill_text_search' });

applyBaseIndexes(billSchema);
softDeletePlugin(billSchema, { preventHardDelete: true });
auditHooks(billSchema, { resource: 'bills' });

export const BillModel: Model<IBill> =
  (mongoose.models.Bill as Model<IBill> | undefined) ??
  mongoose.model<IBill>('Bill', billSchema);

export const BILL_POPULATE: { list: PopulateOptions[]; detail: PopulateOptions[] } = {
  list: [
    { path: 'patientId', select: 'patientId firstName lastName phone' },
    { path: 'visitId', select: 'visitNumber date' },
  ],
  detail: [
    { path: 'patientId', select: 'patientId firstName lastName phone address' },
    { path: 'visitId', select: 'visitNumber date doctorId' },
    { path: 'lineItems.treatmentId', select: 'procedureName procedureCode' },
  ],
};
