import { z } from 'zod';

import { AppointmentStatus, AppointmentType } from '@/types/enums';

import { objectIdSchema, paginationSchema, requiredStringSchema, timeSchema } from './common.validator';

export const createAppointmentSchema = z.object({
  patientId: objectIdSchema,
  doctorId: objectIdSchema,
  date: z.string().min(1),
  startTime: timeSchema,
  endTime: timeSchema,
  type: z.nativeEnum(AppointmentType).default(AppointmentType.Consultation),
  chiefComplaint: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const updateAppointmentSchema = z.object({
  date: z.string().optional(),
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
  type: z.nativeEnum(AppointmentType).optional(),
  status: z.nativeEnum(AppointmentStatus).optional(),
  chiefComplaint: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const rescheduleAppointmentSchema = z.object({
  date: z.string().min(1),
  startTime: timeSchema,
  endTime: timeSchema,
  reason: z.string().trim().max(500).optional(),
});

export const cancelAppointmentSchema = z.object({
  reason: requiredStringSchema.max(500),
});

export const listAppointmentsSchema = paginationSchema.extend({
  patientId: objectIdSchema.optional(),
  doctorId: objectIdSchema.optional(),
  status: z.nativeEnum(AppointmentStatus).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const calendarQuerySchema = z.object({
  doctorId: objectIdSchema.optional(),
  dateFrom: z.string().min(1),
  dateTo: z.string().min(1),
});

export const queueTokenSchema = z.object({
  patientId: objectIdSchema,
  doctorId: objectIdSchema,
  visitId: objectIdSchema.optional(),
  appointmentId: objectIdSchema.optional(),
  priority: z.enum(['normal', 'emergency']).default('normal'),
});

export const queueActionSchema = z.object({
  tokenId: objectIdSchema.optional(),
  doctorId: objectIdSchema.optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type ListAppointmentsInput = z.infer<typeof listAppointmentsSchema>;
