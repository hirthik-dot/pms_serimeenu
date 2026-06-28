import { Types } from 'mongoose';

import { ToothChartModel, TOOTH_CHART_POPULATE } from '@/models/tooth-chart.model';
import { ToothConditionModel } from '@/models/tooth-condition.model';
import { BaseRepository } from '@/repositories/base.repository';
import type { IToothChart, IToothCondition } from '@/types/models';

export class ToothChartRepository extends BaseRepository<IToothChart> {
  constructor() {
    super(ToothChartModel);
  }

  async findByVisitId(visitId: string): Promise<IToothChart | null> {
    return ToothChartModel.findOne({
      visitId: new Types.ObjectId(visitId),
      isDeleted: false,
    })
      .populate([...TOOTH_CHART_POPULATE.detail])
      .lean<IToothChart>()
      .exec();
  }

  async findLatestByPatientId(patientId: string, excludeVisitId?: string): Promise<IToothChart | null> {
    const filter: Record<string, unknown> = {
      patientId: new Types.ObjectId(patientId),
      isDeleted: false,
    };
    if (excludeVisitId) {
      filter.visitId = { $ne: new Types.ObjectId(excludeVisitId) };
    }

    return ToothChartModel.findOne(filter)
      .sort({ createdAt: -1 })
      .lean<IToothChart>()
      .exec();
  }

  async findHistoryByPatientId(
    patientId: string,
    options: {
      page: number;
      limit: number;
      dateFrom?: string;
      dateTo?: string;
      toothNumber?: number;
    },
  ) {
    const filter: Record<string, unknown> = {
      patientId: new Types.ObjectId(patientId),
      isDeleted: false,
    };

    if (options.dateFrom || options.dateTo) {
      const recordedAt: Record<string, Date> = {};
      if (options.dateFrom) recordedAt.$gte = new Date(options.dateFrom);
      if (options.dateTo) recordedAt.$lte = new Date(options.dateTo);
      filter.recordedAt = recordedAt;
    }

    if (options.toothNumber) {
      filter.toothNumber = options.toothNumber;
    }

    const skip = (options.page - 1) * options.limit;

    const [data, total] = await Promise.all([
      ToothConditionModel.find(filter)
        .populate('recordedBy', 'firstName lastName')
        .populate('visitId', 'visitNumber date')
        .sort({ recordedAt: -1 })
        .skip(skip)
        .limit(options.limit)
        .lean<IToothCondition[]>()
        .exec(),
      ToothConditionModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page: options.page, limit: options.limit };
  }
}

export const toothChartRepository = new ToothChartRepository();
