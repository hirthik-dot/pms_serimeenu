import type {
  ToothChartDto,
  ToothConditionHistoryItem,
  ToothEntryDto,
  ToothTreatmentMappingDto,
} from '@/types/consultation';
import type { IToothChart, IToothCondition } from '@/types/models';
import { toISODateString } from '@/utils/date';
import { getDocumentId } from '@/utils/mongoose';

export function mapToothEntry(entry: ToothEntryDto | IToothChart['teeth'][number]): ToothEntryDto {
  return {
    toothNumber: entry.toothNumber,
    status: entry.status,
    surfaces: entry.surfaces,
    notes: entry.notes,
  };
}

export function mapToothChart(chart: IToothChart): ToothChartDto {
  const doctor =
    typeof chart.doctorId === 'object' && chart.doctorId && '_id' in chart.doctorId
      ? {
          id: getDocumentId(chart.doctorId),
          firstName: (chart.doctorId as { firstName?: string }).firstName ?? '',
          lastName: (chart.doctorId as { lastName?: string }).lastName ?? '',
        }
      : undefined;

  const treatmentMappings: ToothTreatmentMappingDto[] = (chart.treatmentMappings ?? []).map((m) => ({
    toothNumber: m.toothNumber,
    treatmentId:
      typeof m.treatmentId === 'object' && m.treatmentId && '_id' in m.treatmentId
        ? getDocumentId(m.treatmentId)
        : String(m.treatmentId),
    procedureName:
      typeof m.treatmentId === 'object' && m.treatmentId && 'procedureName' in m.treatmentId
        ? (m.treatmentId as { procedureName?: string }).procedureName
        : undefined,
    surfaces: m.surfaces,
  }));

  return {
    id: getDocumentId(chart),
    visitId:
      typeof chart.visitId === 'object' && chart.visitId && '_id' in chart.visitId
        ? getDocumentId(chart.visitId)
        : String(chart.visitId),
    patientId:
      typeof chart.patientId === 'object' && chart.patientId && '_id' in chart.patientId
        ? getDocumentId(chart.patientId)
        : String(chart.patientId),
    numberingSystem: chart.numberingSystem,
    teeth: chart.teeth.map(mapToothEntry),
    treatmentMappings,
    doctor,
    createdAt: chart.createdAt ? new Date(chart.createdAt).toISOString() : undefined,
    updatedAt: chart.updatedAt ? new Date(chart.updatedAt).toISOString() : undefined,
  };
}

export function mapToothConditionHistory(condition: IToothCondition): ToothConditionHistoryItem {
  const recordedBy =
    typeof condition.recordedBy === 'object' && condition.recordedBy && '_id' in condition.recordedBy
      ? {
          id: getDocumentId(condition.recordedBy),
          name: `${(condition.recordedBy as { firstName?: string }).firstName ?? ''} ${(condition.recordedBy as { lastName?: string }).lastName ?? ''}`.trim(),
        }
      : undefined;

  const visit =
    typeof condition.visitId === 'object' && condition.visitId && '_id' in condition.visitId
      ? {
          id: getDocumentId(condition.visitId),
          visitNumber: (condition.visitId as { visitNumber?: number }).visitNumber,
          date: (condition.visitId as { date?: Date }).date
            ? toISODateString((condition.visitId as { date?: Date }).date!)
            : undefined,
        }
      : undefined;

  return {
    id: getDocumentId(condition),
    toothNumber: condition.toothNumber,
    status: condition.status,
    surfaces: condition.surfaces,
    notes: condition.notes,
    recordedAt: condition.recordedAt.toISOString(),
    recordedBy,
    visit,
  };
}
