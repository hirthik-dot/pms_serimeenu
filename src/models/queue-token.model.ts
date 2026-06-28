import mongoose, { Schema, type Document, type Model } from 'mongoose';

import {
  applyBaseIndexes,
  auditHooks,
  baseSchemaDefinition,
  baseSchemaOptions,
  softDeletePlugin,
} from '@/models/base';
import { QueuePriority, QueueTokenStatus } from '@/types/enums';
import type { IQueueToken } from '@/types/models';

export type QueueTokenDocument = IQueueToken & Document;

const queueTokenSchema = new Schema<IQueueToken>(
  {
    ...baseSchemaDefinition,
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    visitId: { type: Schema.Types.ObjectId, ref: 'Visit' },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    date: { type: String, required: true },
    tokenNumber: { type: Number, required: true, min: 1 },
    priority: { type: String, enum: Object.values(QueuePriority), default: QueuePriority.Normal },
    status: { type: String, enum: Object.values(QueueTokenStatus), default: QueueTokenStatus.Waiting },
    calledAt: { type: Date },
    completedAt: { type: Date },
    skipReason: { type: String, trim: true },
    estimatedWaitTime: { type: Number, min: 0 },
  },
  baseSchemaOptions,
);

queueTokenSchema.index({ doctorId: 1, date: 1, tokenNumber: 1 });
queueTokenSchema.index({ doctorId: 1, date: 1, status: 1 });
queueTokenSchema.index({ patientId: 1, date: 1 });

applyBaseIndexes(queueTokenSchema);
softDeletePlugin(queueTokenSchema);
auditHooks(queueTokenSchema, { resource: 'queue_tokens' });

export const QueueTokenModel: Model<IQueueToken> =
  (mongoose.models.QueueToken as Model<IQueueToken> | undefined) ??
  mongoose.model<IQueueToken>('QueueToken', queueTokenSchema);

export const QUEUE_TOKEN_POPULATE = {
  waitingList: [
    { path: 'patientId', select: 'patientId firstName lastName phone' },
    { path: 'visitId', select: 'visitNumber status chiefComplaint' },
  ],
} as const;
