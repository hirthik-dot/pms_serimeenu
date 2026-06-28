import mongoose, { Schema, type Document, type Model } from 'mongoose';

import {
  applyBaseIndexes,
  auditHooks,
  baseSchemaDefinition,
  baseSchemaOptions,
  softDeletePlugin,
} from '@/models/base';
import { XrayRequestStatus, XrayRequestType } from '@/types/enums';
import type { IXrayRequest } from '@/types/models';

export type XrayRequestDocument = IXrayRequest & Document;

const xrayRequestSchema = new Schema<IXrayRequest>(
  {
    ...baseSchemaDefinition,
    visitId: { type: Schema.Types.ObjectId, ref: 'Visit', required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(XrayRequestType), required: true },
    customType: { type: String, trim: true, maxlength: 200 },
    toothNumbers: { type: [Number], default: [] },
    notes: { type: String, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: Object.values(XrayRequestStatus),
      default: XrayRequestStatus.Pending,
    },
    requestedAt: { type: Date, required: true, default: () => new Date() },
    fulfilledAt: { type: Date },
  },
  baseSchemaOptions,
);

xrayRequestSchema.index({ visitId: 1, status: 1 });
xrayRequestSchema.index({ patientId: 1, createdAt: -1 });
xrayRequestSchema.index({ status: 1, requestedAt: -1 });

applyBaseIndexes(xrayRequestSchema);
softDeletePlugin(xrayRequestSchema);
auditHooks(xrayRequestSchema, { resource: 'xray_requests' });

export const XrayRequestModel: Model<IXrayRequest> =
  (mongoose.models.XrayRequest as Model<IXrayRequest> | undefined) ??
  mongoose.model<IXrayRequest>('XrayRequest', xrayRequestSchema);

export const XRAY_REQUEST_POPULATE = {
  list: [
    { path: 'patientId', select: 'patientId firstName lastName' },
    { path: 'doctorId', select: 'firstName lastName' },
    { path: 'visitId', select: 'visitNumber date' },
  ],
} as const;
