import { Types } from 'mongoose';
import type { z } from 'zod';

import { connectToDatabase } from '@/lib/db';
import { ConflictError, NotFoundError } from '@/lib/errors';
import { AppointmentModel } from '@/models/appointment.model';
import { appointmentRepository } from '@/repositories/appointment.repository';
import type { AuthContext } from '@/types/auth';
import { AppointmentStatus } from '@/types/enums';
import type { IAppointment } from '@/types/models';
import { getDocumentId } from '@/utils/mongoose';
import type {
  cancelAppointmentSchema,
  createAppointmentSchema,
  listAppointmentsSchema,
  rescheduleAppointmentSchema,
  updateAppointmentSchema,
} from '@/validators/appointment.validator';

type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
type ListAppointmentsInput = z.infer<typeof listAppointmentsSchema>;
type RescheduleInput = z.infer<typeof rescheduleAppointmentSchema>;
type CancelInput = z.infer<typeof cancelAppointmentSchema>;

export interface AppointmentDto {
  id: string;
  patientId: string;
  patientName?: string;
  patientPhone?: string;
  doctorId: string;
  doctorName?: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  chiefComplaint?: string;
  notes?: string;
}

function mapAppointment(apt: IAppointment): AppointmentDto {
  const patient =
    typeof apt.patientId === 'object' && apt.patientId && '_id' in apt.patientId
      ? apt.patientId as { firstName?: string; lastName?: string; phone?: string }
      : null;
  const doctor =
    typeof apt.doctorId === 'object' && apt.doctorId && '_id' in apt.doctorId
      ? apt.doctorId as { firstName?: string; lastName?: string }
      : null;

  return {
    id: getDocumentId(apt),
    patientId:
      typeof apt.patientId === 'object' && apt.patientId && '_id' in apt.patientId
        ? getDocumentId(apt.patientId)
        : String(apt.patientId),
    patientName: patient ? `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim() : undefined,
    patientPhone: patient?.phone,
    doctorId:
      typeof apt.doctorId === 'object' && apt.doctorId && '_id' in apt.doctorId
        ? getDocumentId(apt.doctorId)
        : String(apt.doctorId),
    doctorName: doctor ? `${doctor.firstName ?? ''} ${doctor.lastName ?? ''}`.trim() : undefined,
    date: new Date(apt.date).toISOString().split('T')[0]!,
    startTime: apt.startTime,
    endTime: apt.endTime,
    type: apt.type,
    status: apt.status,
    chiefComplaint: apt.chiefComplaint,
    notes: apt.notes,
  };
}

class AppointmentService {
  async list(input: ListAppointmentsInput) {
    await connectToDatabase();
    const result = await appointmentRepository.search({
      page: input.page,
      limit: input.limit,
      sortBy: input.sortBy ?? 'date',
      sortOrder: input.sortOrder,
      patientId: input.patientId,
      doctorId: input.doctorId,
      status: input.status,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
    });
    return {
      data: result.data.map(mapAppointment),
      total: result.meta.total,
      page: result.meta.page,
      limit: result.meta.limit,
    };
  }

  async get(id: string): Promise<AppointmentDto> {
    await connectToDatabase();
    const apt = await appointmentRepository.findByIdWithDetails(id);
    if (!apt) throw new NotFoundError('Appointment');
    return mapAppointment(apt);
  }

  async create(input: CreateAppointmentInput, auth: AuthContext): Promise<AppointmentDto> {
    await connectToDatabase();

    const overlap = await appointmentRepository.findOverlapping(
      input.doctorId,
      new Date(input.date),
      input.startTime,
      input.endTime,
    );
    if (overlap) throw new ConflictError('Doctor has overlapping appointment');

    const doc = await AppointmentModel.create({
      patientId: new Types.ObjectId(input.patientId),
      doctorId: new Types.ObjectId(input.doctorId),
      date: new Date(input.date),
      startTime: input.startTime,
      endTime: input.endTime,
      type: input.type,
      status: AppointmentStatus.Scheduled,
      chiefComplaint: input.chiefComplaint,
      notes: input.notes,
      createdBy: new Types.ObjectId(auth.userId),
      isDeleted: false,
    });

    return mapAppointment(doc.toObject());
  }

  async update(id: string, input: UpdateAppointmentInput, auth: AuthContext): Promise<AppointmentDto> {
    await connectToDatabase();
    await appointmentRepository.findByIdOrThrow(id, 'Appointment');

    const update: Record<string, unknown> = { updatedBy: auth.userId };
    if (input.date) update.date = new Date(input.date);
    if (input.startTime) update.startTime = input.startTime;
    if (input.endTime) update.endTime = input.endTime;
    if (input.type) update.type = input.type;
    if (input.status) update.status = input.status;
    if (input.chiefComplaint !== undefined) update.chiefComplaint = input.chiefComplaint;
    if (input.notes !== undefined) update.notes = input.notes;

    const updated = await appointmentRepository.updateWithAudit(
      id,
      { $set: update },
      auth.userId,
      'Appointment',
    );

    return mapAppointment(updated);
  }

  async reschedule(id: string, input: RescheduleInput, auth: AuthContext): Promise<AppointmentDto> {
    await connectToDatabase();
    const apt = await appointmentRepository.findByIdOrThrow(id, 'Appointment');

    const overlap = await appointmentRepository.findOverlapping(
      String(apt.doctorId),
      new Date(input.date),
      input.startTime,
      input.endTime,
      id,
    );
    if (overlap) throw new ConflictError('Doctor has overlapping appointment');

    const updated = await appointmentRepository.updateWithAudit(
      id,
      {
        $set: {
          date: new Date(input.date),
          startTime: input.startTime,
          endTime: input.endTime,
          rescheduleReason: input.reason,
          status: AppointmentStatus.Scheduled,
          updatedBy: auth.userId,
        },
      },
      auth.userId,
      'Appointment',
    );

    return mapAppointment(updated);
  }

  async cancel(id: string, input: CancelInput, auth: AuthContext): Promise<AppointmentDto> {
    await connectToDatabase();
    const updated = await appointmentRepository.updateWithAudit(
      id,
      {
        $set: {
          status: AppointmentStatus.Cancelled,
          cancelReason: input.reason,
          updatedBy: auth.userId,
        },
      },
      auth.userId,
      'Appointment',
    );
    return mapAppointment(updated);
  }

  async complete(id: string, auth: AuthContext): Promise<AppointmentDto> {
    await connectToDatabase();
    const updated = await appointmentRepository.updateWithAudit(
      id,
      { $set: { status: AppointmentStatus.Completed, updatedBy: auth.userId } },
      auth.userId,
      'Appointment',
    );
    return mapAppointment(updated);
  }

  async markNoShow(id: string, auth: AuthContext): Promise<AppointmentDto> {
    await connectToDatabase();
    const updated = await appointmentRepository.updateWithAudit(
      id,
      { $set: { status: AppointmentStatus.NoShow, updatedBy: auth.userId } },
      auth.userId,
      'Appointment',
    );
    return mapAppointment(updated);
  }

  async upcoming(doctorId?: string, patientId?: string, days = 7) {
    await connectToDatabase();
    const appointments = await appointmentRepository.findUpcoming(days, doctorId, patientId);
    return appointments.map(mapAppointment);
  }

  async calendar(dateFrom: string, dateTo: string, doctorId?: string) {
    await connectToDatabase();
    const result = await appointmentRepository.search({
      doctorId,
      dateFrom,
      dateTo,
      limit: 500,
      page: 1,
    });
    return result.data.map(mapAppointment);
  }
}

export const appointmentService = new AppointmentService();
