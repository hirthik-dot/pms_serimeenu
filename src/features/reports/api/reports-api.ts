import { apiFetch } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types/api';
import type { IVisit } from '@/types/models';

export const reportsApi = {
  getVisits: (page = 1, limit = 50) => {
    return apiFetch<PaginatedResponse<IVisit>>(`/reports?page=${page}&limit=${limit}`);
  },
};
