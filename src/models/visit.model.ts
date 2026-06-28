import mongoose, { Schema, type Document, type Model, type PopulateOptions } from 'mongoose';

import {
  applyBaseIndexes,
  auditHooks,
  baseSchemaDefinition,
  baseSchemaOptions,
  softDeletePlugin,
} from '@/models/base';
import { visitConsultationSchema } from '@/models/shared.schemas';
import { VisitStatus } from '@/types/enums';
import type { IVisit } from '@/types/models';

export type VisitDocument = IVisit & Document;

const visitSchema = new Schema<IVisit>(
  {
    ...baseSchemaDefinition,
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    visitNumber: { type: Number, required: true, min: 1 },
    visitCode: { type: String, trim: true, uppercase: true },
    date: { type: Date, required: true, default: () => new Date() },
    status: { type: String, enum: Object.values(VisitStatus), default: VisitStatus.WaitingRoom },
    chiefComplaint: { type: String, required: true, trim: true, maxlength: 500 },
    consultation: { type: visitConsultationSchema, default: () => ({}) },
    startedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String, trim: true, maxlength: 500 },
  },
  baseSchemaOptions,
);

visitSchema.index({ patientId: 1, visitNumber: 1 });
visitSchema.index({ doctorId: 1, date: -1 });
visitSchema.index({ appointmentId: 1 }, { sparse: true });
visitSchema.index({ patientId: 1, date: -1 });
visitSchema.index({ status: 1, date: -1 });
visitSchema.index({ isDeleted: 1 });

applyBaseIndexes(visitSchema);
softDeletePlugin(visitSchema, { preventHardDelete: true });
auditHooks(visitSchema, { resource: 'visits' });

export const VisitModel: Model<IVisit> =
  (mongoose.models.Visit as Model<IVisit> | undefined) ??
  mongoose.model<IVisit>('Visit', visitSchema);

export const VISIT_POPULATE: { list: PopulateOptions[]; detail: PopulateOptions[] } = {
  list: [
    { path: 'patientId', select: 'patientId firstName lastName phone' },
    { path: 'doctorId', select: 'firstName lastName' },
  ],
  detail: [
    { path: 'patientId', select: 'patientId firstName lastName phone profileImage dateOfBirth gender' },
    { path: 'doctorId', select: 'firstName lastName email' },
    { path: 'appointmentId', select: 'date startTime endTime type status' },
  ],
};
