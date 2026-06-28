// =============================================================================
// Populate Helper — Standard population paths for list/detail views
// =============================================================================

import type { PopulateOptions, Query } from 'mongoose';

export function applyPopulate<T>(
  query: Query<T, unknown>,
  paths: PopulateOptions | PopulateOptions[],
): Query<T, unknown> {
  const list = Array.isArray(paths) ? paths : [paths];
  return query.populate(list as PopulateOptions[]);
}

export function mergePopulate(...groups: PopulateOptions[][]): PopulateOptions[] {
  return groups.flat();
}

export const STANDARD_POPULATE = {
  doctor: { path: 'doctorId', select: 'firstName lastName email' } satisfies PopulateOptions,
  patient: {
    path: 'patientId',
    select: 'patientId firstName lastName phone profileImage',
  } satisfies PopulateOptions,
  user: { path: 'createdBy', select: 'firstName lastName email' } satisfies PopulateOptions,
  bill: { path: 'billId', select: 'billNumber totalAmount balanceAmount status' } satisfies PopulateOptions,
  visit: { path: 'visitId', select: 'visitNumber date status chiefComplaint' } satisfies PopulateOptions,
} as const;
