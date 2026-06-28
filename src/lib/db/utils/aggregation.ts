// =============================================================================
// Aggregation Helper
// =============================================================================

import type mongoose from 'mongoose';
import type { ClientSession, Model, PipelineStage } from 'mongoose';

type QueryFilter<T> = mongoose.QueryFilter<T>;

export interface AggregationOptions {
  session?: ClientSession;
  allowDiskUse?: boolean;
}

export async function runAggregation<T, TDoc = unknown>(
  model: Model<TDoc>,
  pipeline: PipelineStage[],
  options: AggregationOptions = {},
): Promise<T[]> {
  const agg = model.aggregate<T>(pipeline);

  if (options.allowDiskUse) {
    agg.allowDiskUse(true);
  }

  if (options.session) {
    agg.session(options.session);
  }

  return agg.exec();
}

export function matchNotDeleted<T>(extra: QueryFilter<T> = {}): QueryFilter<T> {
  return { isDeleted: false, ...extra } as QueryFilter<T>;
}

export function dateRangeMatch(
  field: string,
  dateFrom?: Date | string,
  dateTo?: Date | string,
): Record<string, unknown> {
  if (!dateFrom && !dateTo) return {};

  const range: Record<string, Date> = {};
  if (dateFrom) range.$gte = new Date(dateFrom);
  if (dateTo) range.$lte = new Date(dateTo);

  return { [field]: range };
}

export function groupByDateField(field: string, sumField?: string): PipelineStage[] {
  const group: Record<string, unknown> = {
    _id: {
      $dateToString: { format: '%Y-%m-%d', date: `$${field}` },
    },
    count: { $sum: 1 },
  };

  if (sumField) {
    group.total = { $sum: `$${sumField}` };
  }

  return [
    { $group: group } as PipelineStage,
    { $sort: { _id: 1 } },
  ];
}
