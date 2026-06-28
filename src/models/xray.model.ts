import mongoose, { Schema, type Document, type Model } from 'mongoose';

import {
  applyBaseIndexes,
  auditHooks,
  baseSchemaDefinition,
  baseSchemaOptions,
  softDeletePlugin,
} from '@/models/base';
import { XrayType } from '@/types/enums';
import type { IXRay } from '@/types/models';

export type XRayDocument = IXRay & Document;

const xraySchema = new Schema<IXRay>(
  {
    ...baseSchemaDefinition,
    visitId: { type: Schema.Types.ObjectId, ref: 'Visit', required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: Object.values(XrayType), required: true },
    imageUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true },
    fileName: { type: String, trim: true },
    toothNumbers: { type: [Number], default: [] },
    findings: { type: String, trim: true, maxlength: 2000 },
    notes: { type: String, trim: true, maxlength: 2000 },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  baseSchemaOptions,
);

xraySchema.index({ visitId: 1 });
xraySchema.index({ patientId: 1, createdAt: -1 });
xraySchema.index({ cloudinaryPublicId: 1 }, { sparse: true });

applyBaseIndexes(xraySchema);
softDeletePlugin(xraySchema);
auditHooks(xraySchema, { resource: 'xrays' });

export const XRayModel: Model<IXRay> =
  (mongoose.models.XRay as Model<IXRay> | undefined) ??
  mongoose.model<IXRay>('XRay', xraySchema);

export const XRAY_POPULATE = {
  list: [
    { path: 'patientId', select: 'patientId firstName lastName' },
    { path: 'visitId', select: 'visitNumber date' },
    { path: 'uploadedBy', select: 'firstName lastName' },
  ],
} as const;
