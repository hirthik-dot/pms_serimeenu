// =============================================================================
// Search Helper — Text and regex search utilities for repositories
// =============================================================================

import type mongoose from 'mongoose';

type QueryFilter<T> = mongoose.QueryFilter<T>;

export interface TextSearchOptions {
  query: string;
  fields?: string[];
  minLength?: number;
}

export function buildTextSearchFilter<T>(
  options: TextSearchOptions,
): QueryFilter<T> | null {
  const { query, minLength = 2 } = options;
  const trimmed = query.trim();

  if (trimmed.length < minLength) return null;

  return {
    $text: { $search: trimmed },
  } as QueryFilter<T>;
}

export function buildRegexSearchFilter<T>(
  query: string,
  fields: string[],
  minLength = 2,
): QueryFilter<T> | null {
  const trimmed = query.trim();
  if (trimmed.length < minLength || fields.length === 0) return null;

  const regex = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  return {
    $or: fields.map((field) => ({ [field]: regex })),
  } as QueryFilter<T>;
}

export function buildPatientSearchFilter<T>(search: string): QueryFilter<T> | null {
  return buildRegexSearchFilter<T>(search, [
    'firstName',
    'lastName',
    'patientId',
    'phone',
    'email',
  ]);
}

export function buildBillSearchFilter<T>(search: string): QueryFilter<T> | null {
  return buildRegexSearchFilter<T>(search, ['billNumber']);
}

export function combineFilters<T>(
  ...filters: Array<QueryFilter<T> | null | undefined>
): QueryFilter<T> {
  const valid = filters.filter(Boolean) as QueryFilter<T>[];
  if (valid.length === 0) return {} as QueryFilter<T>;
  if (valid.length === 1) return valid[0]!;
  return { $and: valid } as QueryFilter<T>;
}

export function activeOnlyFilter<T>(): QueryFilter<T> {
  return { isDeleted: false } as QueryFilter<T>;
}
