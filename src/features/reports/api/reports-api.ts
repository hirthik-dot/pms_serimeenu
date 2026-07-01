import { apiFetchWithRefresh } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types/api';
import type { BillDto } from '@/services/bill.service';
import type { PatientDetail } from '@/types/patient';
import type { IVisit } from '@/types/models';

export interface PatientRecordSummary {
  id: string;
  patientId: string;
  fullName: string;
  phone?: string;
  dateOfBirth: string;
  gender: string;
  referredBy?: string;
  notes?: string;
  status: string;
  createdAt: string;
}

export interface PrescriptionRecordSummary {
  id: string;
  date: string;
  doctorName: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: number;
    durationUnit: string;
    instructions?: string;
  }>;
  generalInstructions?: string;
  followUpDate?: string;
  status: string;
}

export interface PatientRecordDetail {
  patient: PatientDetail;
  bills: BillDto[];
  prescriptions: PrescriptionRecordSummary[];
}

export const reportsApi = {
  getVisits: (page = 1, limit = 50) => {
    return apiFetchWithRefresh<PaginatedResponse<IVisit>>(`/reports?page=${page}&limit=${limit}`);
  },

  getPatientRecords: (page = 1, limit = 25, search?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    return apiFetchWithRefresh<{ data: PatientRecordSummary[]; total: number; page: number; limit: number }>(
      `/reports/patient-records?${params.toString()}`,
    );
  },

  getPatientRecordDetail: (id: string) => {
    return apiFetchWithRefresh<PatientRecordDetail>(`/reports/patient-records/${id}`);
  },
};
