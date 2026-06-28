import { Types, type ClientSession } from 'mongoose';

import {
  combineFilters,
  dateRangeMatch,
  type RepositoryPaginatedResult,
  type RepositoryPaginationOptions,
} from '@/lib/db/utils';
import { VisitModel, VISIT_POPULATE } from '@/models/visit.model';
import { BaseRepository } from '@/repositories/base.repository';
import { VisitStatus } from '@/types/enums';
import type { IVisit } from '@/types/models';

export interface VisitFilterOptions extends RepositoryPaginationOptions {
  patientId?: string;
  doctorId?: string;
  status?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  includeDeleted?: boolean;
}

const VISIT_SORT_FIELDS = ['date', 'visitNumber', 'createdAt', 'status'];

export class VisitRepository extends BaseRepository<IVisit> {
  constructor() {
    super(VisitModel);
  }

  async findByPatient(
    patientId: string,
    options: VisitFilterOptions = {},
  ): Promise<RepositoryPaginatedResult<IVisit>> {
    const filter = combineFilters<IVisit>(
      { patientId: new Types.ObjectId(patientId) },
      options.doctorId ? { doctorId: new Types.ObjectId(options.doctorId) } : null,
      options.status ? ({ status: options.status } as never) : null,
      dateRangeMatch('date', options.dateFrom, options.dateTo) as never,
    );

    return this.findWithFilters(filter as never, {
      ...options,
      allowedSortFields: VISIT_SORT_FIELDS,
      populate: VISIT_POPULATE.list,
    });
  }

  async findByIdWithDetails(id: string): Promise<IVisit | null> {
    return VisitModel.findById(id)
      .populate(VISIT_POPULATE.detail)
      .lean<IVisit>()
      .exec();
  }

  async getLatestVisitNumber(patientId: string, session?: ClientSession): Promise<number> {
    const latest = await VisitModel.findOne({ patientId, isDeleted: false })
      .sort({ visitNumber: -1 })
      .select('visitNumber')
      .session(session ?? null)
      .lean<{ visitNumber: number }>()
      .exec();

    return latest?.visitNumber ?? 0;
  }

  async findActiveByPatient(patientId: string): Promise<IVisit | null> {
    return this.findOne({
      patientId: new Types.ObjectId(patientId),
      isDeleted: false,
      status: { $nin: [VisitStatus.Completed, VisitStatus.BillingPending, VisitStatus.Cancelled] },
    } as never);
  }

  async findTodayByDoctor(
    doctorId: string,
    status?: VisitStatus | VisitStatus[],
  ): Promise<IVisit[]> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const filter: Record<string, unknown> = {
      doctorId: new Types.ObjectId(doctorId),
      isDeleted: false,
      date: { $gte: start, $lte: end },
    };

    if (status) {
      filter.status = Array.isArray(status) ? { $in: status } : status;
    }

    return VisitModel.find(filter)
      .populate(VISIT_POPULATE.list)
      .sort({ date: 1, visitNumber: 1 })
      .lean<IVisit[]>()
      .exec();
  }

  async searchVisits(
    options: VisitFilterOptions,
  ): Promise<RepositoryPaginatedResult<IVisit>> {
    const filter = combineFilters<IVisit>(
      options.patientId ? { patientId: new Types.ObjectId(options.patientId) } : null,
      options.doctorId ? { doctorId: new Types.ObjectId(options.doctorId) } : null,
      options.status ? ({ status: options.status } as never) : null,
      dateRangeMatch('date', options.dateFrom, options.dateTo) as never,
    );

    return this.findWithFilters(filter as never, {
      ...options,
      allowedSortFields: VISIT_SORT_FIELDS,
      populate: VISIT_POPULATE.list,
    });
  }

  async createVisit(data: Partial<IVisit>, session?: ClientSession): Promise<IVisit> {
    const doc = await VisitModel.create([data], { session });
    return doc[0]!.toObject() as IVisit;
  }
}

export const visitRepository = new VisitRepository();
