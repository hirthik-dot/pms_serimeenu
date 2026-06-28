import { Types } from 'mongoose';

import {
  combineFilters,
  dateRangeMatch,
  type RepositoryPaginatedResult,
  type RepositoryPaginationOptions,
} from '@/lib/db/utils';
import { AppointmentModel, APPOINTMENT_POPULATE } from '@/models/appointment.model';
import { BaseRepository } from '@/repositories/base.repository';
import { AppointmentStatus } from '@/types/enums';
import type { IAppointment } from '@/types/models';

export interface AppointmentFilterOptions extends RepositoryPaginationOptions {
  patientId?: string;
  doctorId?: string;
  status?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  includeDeleted?: boolean;
}

const APPOINTMENT_SORT_FIELDS = ['date', 'startTime', 'createdAt', 'status'];

export class AppointmentRepository extends BaseRepository<IAppointment> {
  constructor() {
    super(AppointmentModel);
  }

  async search(
    options: AppointmentFilterOptions,
  ): Promise<RepositoryPaginatedResult<IAppointment>> {
    const filter = combineFilters<IAppointment>(
      options.patientId ? { patientId: new Types.ObjectId(options.patientId) } : null,
      options.doctorId ? { doctorId: new Types.ObjectId(options.doctorId) } : null,
      options.status ? ({ status: options.status } as never) : null,
      dateRangeMatch('date', options.dateFrom, options.dateTo) as never,
    );

    return this.findWithFilters(filter as never, {
      ...options,
      allowedSortFields: APPOINTMENT_SORT_FIELDS,
      populate: APPOINTMENT_POPULATE.list,
    });
  }

  async findUpcoming(
    days = 7,
    doctorId?: string,
    patientId?: string,
  ): Promise<IAppointment[]> {
    const now = new Date();
    const end = new Date();
    end.setDate(end.getDate() + days);

    const filter = combineFilters<IAppointment>(
      { date: { $gte: now, $lte: end } },
      { status: { $nin: [AppointmentStatus.Cancelled, AppointmentStatus.Completed, AppointmentStatus.NoShow] } },
      doctorId ? { doctorId: new Types.ObjectId(doctorId) } : null,
      patientId ? { patientId: new Types.ObjectId(patientId) } : null,
    );

    return AppointmentModel.find(filter)
      .populate(APPOINTMENT_POPULATE.list)
      .sort({ date: 1, startTime: 1 })
      .lean<IAppointment[]>()
      .exec();
  }

  async findOverlapping(
    doctorId: string,
    date: Date,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ): Promise<IAppointment | null> {
    const filter: Record<string, unknown> = {
      doctorId: new Types.ObjectId(doctorId),
      date,
      isDeleted: false,
      status: { $nin: [AppointmentStatus.Cancelled, AppointmentStatus.NoShow] },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    };

    if (excludeId) {
      filter._id = { $ne: new Types.ObjectId(excludeId) };
    }

    return this.findOne(filter as never);
  }

  async findByIdWithDetails(id: string): Promise<IAppointment | null> {
    return AppointmentModel.findById(id)
      .populate(APPOINTMENT_POPULATE.detail)
      .lean<IAppointment>()
      .exec();
  }
}

export const appointmentRepository = new AppointmentRepository();
