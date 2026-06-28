import { apiFetchWithRefresh } from '@/lib/api-client';
import type {
  ClinicalHistorySearchResult,
  ConsultationRecord,
  ConsultationWorkspaceData,
  DoctorDashboardData,
  MedicineSearchResult,
  PrescriptionDto,
  TreatmentPlanDto,
  TreatmentSearchResult,
  VisitSummary,
  XrayRequestDto,
} from '@/types/consultation';
import type {
  ConsultationDraftInput,
  CreatePrescriptionInput,
  CreateTreatmentPlanInput,
  UpdateTreatmentPlanInput,
  XrayRequestInput,
} from '@/validators/consultation.validator';

export const consultationApi = {
  getDashboard(doctorId?: string) {
    const suffix = doctorId ? `?doctorId=${doctorId}` : '';
    return apiFetchWithRefresh<DoctorDashboardData>(`/doctor/dashboard${suffix}`);
  },

  listVisits(params: Record<string, string | number | boolean | undefined> = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') query.set(key, String(value));
    });
    return apiFetchWithRefresh<VisitSummary[]>(`/visits?${query.toString()}`);
  },

  getVisit(id: string) {
    return apiFetchWithRefresh<VisitSummary>(`/visits/${id}`);
  },

  startVisit(id: string) {
    return apiFetchWithRefresh<VisitSummary>(`/visits/${id}/start`, { method: 'POST' });
  },

  saveDraft(id: string, data: ConsultationDraftInput) {
    return apiFetchWithRefresh<ConsultationRecord>(`/visits/${id}/draft`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  completeVisit(id: string) {
    return apiFetchWithRefresh<VisitSummary>(`/visits/${id}/complete`, { method: 'POST' });
  },

  cancelVisit(id: string, reason: string) {
    return apiFetchWithRefresh<VisitSummary>(`/visits/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  getWorkspace(visitId: string) {
    return apiFetchWithRefresh<ConsultationWorkspaceData>(`/visits/${visitId}/workspace`);
  },

  getConsultation(visitId: string) {
    return apiFetchWithRefresh<ConsultationRecord>(`/visits/${visitId}/consultation`);
  },

  updateDiagnosis(visitId: string, diagnosis: string) {
    return apiFetchWithRefresh<ConsultationRecord>(`/visits/${visitId}/consultation/diagnosis`, {
      method: 'PUT',
      body: JSON.stringify({ diagnosis }),
    });
  },

  updateFindings(
    visitId: string,
    data: {
      clinicalFindings: string;
      presentIllness?: string;
      treatmentRecommendation?: string;
      additionalNotes?: string;
    },
  ) {
    return apiFetchWithRefresh<ConsultationRecord>(`/visits/${visitId}/consultation/findings`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateNotes(visitId: string, clinicalNotes: string) {
    return apiFetchWithRefresh<ConsultationRecord>(`/visits/${visitId}/consultation/notes`, {
      method: 'PUT',
      body: JSON.stringify({ clinicalNotes }),
    });
  },

  updateAdvice(visitId: string, advice: string) {
    return apiFetchWithRefresh<ConsultationRecord>(`/visits/${visitId}/consultation/advice`, {
      method: 'PUT',
      body: JSON.stringify({ advice }),
    });
  },

  updateFollowUp(visitId: string, data: ConsultationDraftInput) {
    return apiFetchWithRefresh<ConsultationRecord>(`/visits/${visitId}/consultation/follow-up`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getTreatmentPlan(visitId: string) {
    return apiFetchWithRefresh<TreatmentPlanDto | null>(`/visits/${visitId}/treatment-plan`);
  },

  createTreatmentPlan(visitId: string, data: CreateTreatmentPlanInput) {
    return apiFetchWithRefresh<TreatmentPlanDto>(`/visits/${visitId}/treatment-plan`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateTreatmentPlan(visitId: string, data: UpdateTreatmentPlanInput) {
    return apiFetchWithRefresh<TreatmentPlanDto>(`/visits/${visitId}/treatment-plan`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  getPrescription(visitId: string) {
    return apiFetchWithRefresh<PrescriptionDto | null>(`/visits/${visitId}/prescriptions`);
  },

  savePrescription(visitId: string, data: CreatePrescriptionInput) {
    return apiFetchWithRefresh<PrescriptionDto>(`/visits/${visitId}/prescriptions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getXrayRequests(visitId: string) {
    return apiFetchWithRefresh<XrayRequestDto[]>(`/visits/${visitId}/xray-requests`);
  },

  createXrayRequest(visitId: string, data: XrayRequestInput) {
    return apiFetchWithRefresh<XrayRequestDto>(`/visits/${visitId}/xray-requests`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  searchMedicines(q: string, limit = 20) {
    return apiFetchWithRefresh<MedicineSearchResult[]>(
      `/medicines/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    );
  },

  searchTreatments(q: string, limit = 20) {
    return apiFetchWithRefresh<TreatmentSearchResult[]>(
      `/treatments/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    );
  },

  searchClinicalHistory(patientId: string, q?: string, type?: string) {
    const query = new URLSearchParams();
    if (q) query.set('q', q);
    if (type) query.set('type', type);
    return apiFetchWithRefresh<ClinicalHistorySearchResult>(
      `/patients/${patientId}/clinical-history/search?${query.toString()}`,
    );
  },
};
