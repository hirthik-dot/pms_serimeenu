import { z } from 'zod';

import {
  getTeethForDentition,
  resolveDentitionType,
  type DentitionType,
} from '@/features/odontogram/constants/dentition';
import { type PatientType, ToothNumberingSystem, ToothStatus, ToothSurface } from '@/types/enums';

import { objectIdSchema, paginationSchema } from './common.validator';

export const toothSurfaceMapSchema = z
  .object({
    mesial: z.nativeEnum(ToothStatus).optional(),
    distal: z.nativeEnum(ToothStatus).optional(),
    occlusal: z.nativeEnum(ToothStatus).optional(),
    buccal: z.nativeEnum(ToothStatus).optional(),
    lingual: z.nativeEnum(ToothStatus).optional(),
    incisal: z.nativeEnum(ToothStatus).optional(),
  })
  .optional();

export const toothEntryUpdateSchema = z.object({
  status: z.nativeEnum(ToothStatus).optional(),
  surfaces: toothSurfaceMapSchema,
  notes: z.string().trim().max(2000).optional(),
});

export const initToothChartSchema = z.object({
  numberingSystem: z.nativeEnum(ToothNumberingSystem).default(ToothNumberingSystem.FDI),
  dentitionType: z.enum(['adult', 'pediatric']).optional(),
  copyFromPrevious: z.boolean().default(true),
});

export const bulkToothUpdateSchema = z.object({
  teeth: z
    .array(
      z.object({
        toothNumber: z.number().int().min(11).max(85),
        status: z.nativeEnum(ToothStatus).optional(),
        surfaces: toothSurfaceMapSchema,
        notes: z.string().trim().max(2000).optional(),
      }),
    )
    .min(1)
    .max(32),
});

export const treatmentMappingSchema = z.object({
  mappings: z
    .array(
      z.object({
        toothNumber: z.number().int().min(11).max(85),
        treatmentId: objectIdSchema,
        surfaces: z.array(z.nativeEnum(ToothSurface)).default([]),
      }),
    )
    .min(1),
});

export const toothChartHistorySchema = paginationSchema.extend({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  toothNumber: z.coerce.number().int().min(11).max(85).optional(),
});

export type InitToothChartInput = z.infer<typeof initToothChartSchema>;
export type ToothEntryUpdateInput = z.infer<typeof toothEntryUpdateSchema>;
export type BulkToothUpdateInput = z.infer<typeof bulkToothUpdateSchema>;
export type TreatmentMappingInput = z.infer<typeof treatmentMappingSchema>;
export type ToothChartHistoryQuery = z.infer<typeof toothChartHistorySchema>;

export function validateToothNumberForDentition(
  toothNumber: number,
  dentition: DentitionType,
): boolean {
  return getTeethForDentition(dentition).some((n) => n === toothNumber);
}

export function resolveChartDentition(
  patientType?: PatientType | string,
  age?: number,
  override?: DentitionType,
): DentitionType {
  return resolveDentitionType(patientType, age, override);
}
