import { apiFetchWithRefresh } from '@/lib/api-client';
import type {
  ToothChartDto,
  ToothChartHistoryDto,
  ToothEntryDto,
} from '@/types/consultation';
import type { ToothNumberingSystem } from '@/types/enums';
import type {
  BulkToothUpdateInput,
  InitToothChartInput,
  ToothEntryUpdateInput,
  TreatmentMappingInput,
} from '@/validators/tooth-chart.validator';

export const toothChartApi = {
  getChart(visitId: string) {
    return apiFetchWithRefresh<ToothChartDto | null>(`/visits/${visitId}/tooth-chart`);
  },

  initializeChart(visitId: string, data: InitToothChartInput) {
    return apiFetchWithRefresh<ToothChartDto>(`/visits/${visitId}/tooth-chart`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateTooth(visitId: string, toothNumber: number, data: ToothEntryUpdateInput) {
    return apiFetchWithRefresh<ToothChartDto>(`/visits/${visitId}/tooth-chart/${toothNumber}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  bulkUpdate(visitId: string, data: BulkToothUpdateInput) {
    return apiFetchWithRefresh<ToothChartDto>(`/visits/${visitId}/tooth-chart/bulk`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  getHistory(patientId: string, params: Record<string, string | number | undefined> = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') query.set(key, String(value));
    });
    return apiFetchWithRefresh<ToothChartHistoryDto>(
      `/patients/${patientId}/tooth-chart/history?${query.toString()}`,
    );
  },

  addTreatmentMappings(visitId: string, data: TreatmentMappingInput) {
    return apiFetchWithRefresh<ToothChartDto>(
      `/visits/${visitId}/tooth-chart/treatment-mapping`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    );
  },
};

export type { ToothChartDto, ToothEntryDto, ToothNumberingSystem };
