import mongoose, { Schema, type Document, type Model } from 'mongoose';

import {
  applyBaseIndexes,
  auditHooks,
  baseSchemaDefinition,
  baseSchemaOptions,
  softDeletePlugin,
} from '@/models/base';
import { PaymentMethod, PaymentStatus } from '@/types/enums';
import type { IPayment } from '@/types/models';

export type PaymentDocument = IPayment & Document;

const paymentSchema = new Schema<IPayment>(
  {
    ...baseSchemaDefinition,
    receiptNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    billId: { type: Schema.Types.ObjectId, ref: 'Bill', required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: Object.values(PaymentMethod), required: true },
    status: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.Success },
    referenceNumber: { type: String, trim: true },
    notes: { type: String, trim: true, maxlength: 500 },
    receivedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isRefund: { type: Boolean, default: false },
    refundReason: { type: String, trim: true },
    refundedPaymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    idempotencyKey: { type: String, trim: true },
  },
  baseSchemaOptions,
);

paymentSchema.index({ billId: 1 });
paymentSchema.index({ patientId: 1 });
paymentSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

applyBaseIndexes(paymentSchema);
softDeletePlugin(paymentSchema, { preventHardDelete: true });
auditHooks(paymentSchema, { resource: 'payments' });

export const PaymentModel: Model<IPayment> =
  (mongoose.models.Payment as Model<IPayment> | undefined) ??
  mongoose.model<IPayment>('Payment', paymentSchema);

export const PAYMENT_POPULATE = {
  list: [
    { path: 'patientId', select: 'patientId firstName lastName' },
    { path: 'billId', select: 'billNumber totalAmount balanceAmount' },
    { path: 'receivedBy', select: 'firstName lastName' },
  ],
  detail: [
    { path: 'patientId', select: 'patientId firstName lastName phone' },
    { path: 'billId', select: 'billNumber totalAmount paidAmount balanceAmount status lineItems' },
    { path: 'receivedBy', select: 'firstName lastName email' },
  ],
} as const;
