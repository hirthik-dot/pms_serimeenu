import { apiFetchWithRefresh } from '@/lib/api-client';
import type { PaginationMeta } from '@/types/api';
import type { IMedicalHistory } from '@/types/models';
import type {
  CheckinLookupResult,
  CheckinSubmitResult,
  PatientDetail,
  PatientSummary,
  PatientTypeaheadResult,
  TimelineEntry,
} from '@/types/patient';
import type { CreatePatientInput, UpdatePatientInput } from '@/validators/patient.validator';

export interface ListPatientsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: string;
  patientType?: string;
}

export const patientApi = {
  list(params: ListPatientsParams = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') query.set(key, String(value));
    });
    return apiFetchWithRefresh<PatientSummary[]>(`/patients?${query.toString()}`);
  },

  search(q: string, limit = 10) {
    return apiFetchWithRefresh<PatientTypeaheadResult[]>(
      `/patients/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    );
  },

  get(id: string, includeDeleted = false) {
    const suffix = includeDeleted ? '?includeDeleted=true' : '';
    return apiFetchWithRefresh<PatientDetail>(`/patients/${id}${suffix}`);
  },

  create(input: CreatePatientInput) {
    return apiFetchWithRefresh<{ id: string; patientId: string; firstName: string; lastName: string }>(
      '/patients',
      { method: 'POST', body: JSON.stringify(input) },
    );
  },

  update(id: string, input: UpdatePatientInput) {
    return apiFetchWithRefresh<PatientDetail>(`/patients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  delete(id: string) {
    return apiFetchWithRefresh<null>(`/patients/${id}`, { method: 'DELETE' });
  },

  archive(id: string) {
    return apiFetchWithRefresh<PatientDetail>(`/patients/${id}/archive`, { method: 'POST' });
  },

  restore(id: string) {
    return apiFetchWithRefresh<PatientDetail>(`/patients/${id}/restore`, { method: 'POST' });
  },

  merge(primaryPatientId: string, duplicatePatientId: string) {
    return apiFetchWithRefresh<PatientDetail>('/patients/merge', {
      method: 'POST',
      body: JSON.stringify({ primaryPatientId, duplicatePatientId }),
    });
  },

  getTimeline(id: string, params: { page?: number; limit?: number; type?: string } = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) query.set(key, String(value));
    });
    return apiFetchWithRefresh<TimelineEntry[]>(`/patients/${id}/timeline?${query.toString()}`);
  },

  getHistory(id: string) {
    return apiFetchWithRefresh<Record<string, unknown>>(`/patients/${id}/history`);
  },

  getMedicalHistory(id: string) {
    return apiFetchWithRefresh<IMedicalHistory | null>(`/patients/${id}/medical-history`);
  },

  updateMedicalHistory(id: string, data: unknown) {
    return apiFetchWithRefresh<IMedicalHistory>(`/patients/${id}/medical-history`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateEmergencyContact(id: string, data: { name: string; relationship: string; phone: string }) {
    return apiFetchWithRefresh<unknown>(`/patients/${id}/emergency-contact`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  uploadProfilePhoto(id: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetchWithRefresh<{ profileImage: string }>(`/patients/${id}/profile-photo`, {
      method: 'POST',
      body: formData,
    });
  },

  deleteProfilePhoto(id: string) {
    return apiFetchWithRefresh<null>(`/patients/${id}/profile-photo`, { method: 'DELETE' });
  },

  uploadDocument(id: string, file: File, category: string, visitId?: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (visitId) formData.append('visitId', visitId);
    return apiFetchWithRefresh<unknown>(`/patients/${id}/documents`, {
      method: 'POST',
      body: formData,
    });
  },

  getDocuments(id: string, page = 1, limit = 20) {
    return apiFetchWithRefresh<unknown[]>(`/patients/${id}/documents?page=${page}&limit=${limit}`);
  },

  exportCsv(params: ListPatientsParams = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') query.set(key, String(value));
    });
    return fetch(`/api/v1/patients/export?${query.toString()}`, { credentials: 'include' });
  },
};

export const checkinApi = {
  lookup(phone: string) {
    return fetch('/api/v1/checkin/lookup', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message ?? 'Lookup failed');
      return data as { data: CheckinLookupResult; message: string };
    });
  },

  submit(body: unknown) {
    return fetch('/api/v1/checkin/submit', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message ?? 'Check-in failed');
      return data as { data: CheckinSubmitResult; message: string };
    });
  },
};

export type { PaginationMeta };
