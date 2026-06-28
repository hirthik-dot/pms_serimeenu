import mongoose, { Schema, type Document, type Model, type PopulateOptions } from 'mongoose';

import {
  applyBaseIndexes,
  auditHooks,
  baseSchemaDefinition,
  baseSchemaOptions,
  softDeletePlugin,
} from '@/models/base';
import { AppointmentStatus, AppointmentType } from '@/types/enums';
import type { IAppointment } from '@/types/models';

export type AppointmentDocument = IAppointment & Document;

const appointmentSchema = new Schema<IAppointment>(
  {
    ...baseSchemaDefinition,
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    type: { type: String, enum: Object.values(AppointmentType), required: true },
    status: { type: String, enum: Object.values(AppointmentStatus), default: AppointmentStatus.Scheduled },
    chiefComplaint: { type: String, trim: true, maxlength: 500 },
    notes: { type: String, trim: true, maxlength: 2000 },
    rescheduleReason: { type: String, trim: true },
    cancelReason: { type: String, trim: true },
    rescheduledFrom: { type: Schema.Types.ObjectId, ref: 'Appointment' },
  },
  baseSchemaOptions,
);

appointmentSchema.index({ patientId: 1, date: 1 });
appointmentSchema.index({ doctorId: 1, date: 1 });
appointmentSchema.index({ status: 1, date: 1 });
appointmentSchema.index({ doctorId: 1, date: 1, startTime: 1, endTime: 1 });

applyBaseIndexes(appointmentSchema);
softDeletePlugin(appointmentSchema);
auditHooks(appointmentSchema, { resource: 'appointments' });

export const AppointmentModel: Model<IAppointment> =
  (mongoose.models.Appointment as Model<IAppointment> | undefined) ??
  mongoose.model<IAppointment>('Appointment', appointmentSchema);

export const APPOINTMENT_POPULATE: { list: PopulateOptions[]; detail: PopulateOptions[] } = {
  list: [
    { path: 'patientId', select: 'patientId firstName lastName phone' },
    { path: 'doctorId', select: 'firstName lastName' },
  ],
  detail: [
    { path: 'patientId', select: 'patientId firstName lastName phone profileImage' },
    { path: 'doctorId', select: 'firstName lastName email' },
  ],
};
