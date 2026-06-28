'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { toothChartApi } from '@/features/odontogram/api/tooth-chart-api';
import {
  resolveDentitionType,
  type DentitionType,
} from '@/features/odontogram/constants/dentition';
import type { ToothChartDto, ToothEntryDto } from '@/types/consultation';
import { type PatientType, ToothNumberingSystem, ToothStatus } from '@/types/enums';
import type { ToothEntryUpdateInput } from '@/validators/tooth-chart.validator';

interface UseToothChartOptions {
  visitId: string;
  patientId: string;
  patientType?: PatientType | string;
  patientAge?: number;
  isEditable?: boolean;
}

export function useToothChart({
  visitId,
  patientId,
  patientType,
  patientAge,
  isEditable = true,
}: UseToothChartOptions) {
  const queryClient = useQueryClient();
  const [numberingSystem, setNumberingSystem] = useState(ToothNumberingSystem.FDI);
  const [dentitionOverride, setDentitionOverride] = useState<DentitionType | undefined>();

  const dentition = useMemo(
    () => resolveDentitionType(patientType, patientAge, dentitionOverride),
    [patientType, patientAge, dentitionOverride],
  );

  const queryKey = ['tooth-chart', visitId];

  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => toothChartApi.getChart(visitId),
  });

  const chart = response?.data ?? null;

  const initMutation = useMutation({
    mutationFn: () =>
      toothChartApi.initializeChart(visitId, {
        numberingSystem,
        dentitionType: dentition,
        copyFromPrevious: true,
      }),
    onSuccess: (res) => {
      queryClient.setQueryData(queryKey, res);
      toast.success('Tooth chart initialized');
    },
    onError: () => toast.error('Failed to initialize tooth chart'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ toothNumber, data }: { toothNumber: number; data: ToothEntryUpdateInput }) =>
      toothChartApi.updateTooth(visitId, toothNumber, data),
    onMutate: async ({ toothNumber, data }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<{ data: ToothChartDto | null }>(queryKey);

      if (previous?.data) {
        const teeth = previous.data.teeth.map((t) =>
          t.toothNumber === toothNumber
            ? {
                ...t,
                ...(data.status !== undefined ? { status: data.status } : {}),
                ...(data.surfaces !== undefined ? { surfaces: data.surfaces } : {}),
                ...(data.notes !== undefined ? { notes: data.notes } : {}),
              }
            : t,
        );
        const exists = teeth.some((t) => t.toothNumber === toothNumber);
        const optimistic: ToothChartDto = {
          ...previous.data,
          teeth: exists
            ? teeth
            : [...teeth, { toothNumber, status: data.status ?? ToothStatus.Healthy, ...data }],
        };
        queryClient.setQueryData(queryKey, { ...previous, data: optimistic });
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error('Failed to update tooth');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({ queryKey: ['patients', patientId, 'timeline'] });
    },
  });

  const teethMap = useMemo(() => {
    const map = new Map<number, ToothEntryDto>();
    chart?.teeth.forEach((t) => map.set(t.toothNumber, t));
    return map;
  }, [chart?.teeth]);

  const updateTooth = useCallback(
    (toothNumber: number, data: ToothEntryUpdateInput) => {
      if (!isEditable) return;
      updateMutation.mutate({ toothNumber, data });
    },
    [isEditable, updateMutation],
  );

  const ensureChart = useCallback(async () => {
    if (chart) return chart;
    const result = await initMutation.mutateAsync();
    return result.data;
  }, [chart, initMutation]);

  return {
    chart,
    teethMap,
    isLoading,
    error,
    refetch,
    dentition,
    dentitionOverride,
    setDentitionOverride,
    numberingSystem,
    setNumberingSystem,
    updateTooth,
    ensureChart,
    isInitializing: initMutation.isPending,
    isUpdating: updateMutation.isPending,
    isEditable,
  };
}
