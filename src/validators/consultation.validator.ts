import { z } from 'zod';

import {
  MedicationDuration,
  MedicationFrequency,
  MedicineRoute,
  TreatmentItemPriority,
  TreatmentItemStatus,
  TreatmentPlanStatus,
  VisitStatus,
  XrayRequestType,
} from '@/types/enums';

import { objectIdSchema, paginationSchema, requiredStringSchema, timeSchema } from './common.validator';

export const listVisitsSchema = paginationSchema.extend({
  patientId: objectIdSchema.optional(),
  doctorId: objectIdSchema.optional(),
  status: z.nativeEnum(VisitStatus).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  today: z.coerce.boolean().optional(),
});

export const createVisitSchema = z.object({
  patientId: objectIdSchema,
  doctorId: objectIdSchema,
  appointmentId: objectIdSchema.optional(),
  chiefComplaint: requiredStringSchema.max(500),
});

export const cancelVisitSchema = z.object({
  reason: requiredStringSchema.max(500),
});

export const consultationDraftSchema = z
  .object({
    chiefComplaint: z.string().trim().max(500).optional(),
    presentIllness: z.string().trim().max(5000).optional(),
    clinicalFindings: z.string().trim().max(5000).optional(),
    diagnosis: z.string().trim().max(1000).optional(),
    clinicalNotes: z.string().trim().max(10000).optional(),
    additionalNotes: z.string().trim().max(5000).optional(),
    treatmentRecommendation: z.string().trim().max(5000).optional(),
    advice: z.string().trim().max(2000).optional(),
    followUpDate: z.string().optional(),
    followUpTime: timeSchema.optional(),
    followUpPurpose: z.string().trim().max(500).optional(),
    followUpReminder: z.boolean().optional(),
    followUpNotes: z.string().trim().max(1000).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export const diagnosisSchema = z.object({
  diagnosis: requiredStringSchema.max(1000),
});

export const findingsSchema = z.object({
  clinicalFindings: z.string().trim().max(5000),
  presentIllness: z.string().trim().max(5000).optional(),
  treatmentRecommendation: z.string().trim().max(5000).optional(),
  additionalNotes: z.string().trim().max(5000).optional(),
});

export const clinicalNotesSchema = z.object({
  clinicalNotes: z.string().trim().max(10000),
});

export const adviceSchema = z.object({
  advice: z.string().trim().max(2000),
});

export const followUpSchema = z.object({
  followUpDate: z.string().min(1, 'Follow-up date is required'),
  followUpTime: timeSchema.optional(),
  followUpPurpose: z.string().trim().max(500).optional(),
  followUpReminder: z.boolean().optional(),
  followUpNotes: z.string().trim().max(1000).optional(),
});

export const medicationSchema = z.object({
  medicineId: objectIdSchema.optional(),
  name: requiredStringSchema.max(200),
  dosage: requiredStringSchema.max(100),
  frequency: z.nativeEnum(MedicationFrequency),
  duration: z.number().int().min(1).max(365),
  durationUnit: z.nativeEnum(MedicationDuration),
  route: z.nativeEnum(MedicineRoute).default(MedicineRoute.Oral),
  instructions: z.string().trim().max(500).optional(),
  morning: z.boolean().optional(),
  afternoon: z.boolean().optional(),
  night: z.boolean().optional(),
  beforeFood: z.boolean().optional(),
  afterFood: z.boolean().optional(),
});

export const createPrescriptionSchema = z.object({
  medications: z.array(medicationSchema).min(1).max(20),
  generalInstructions: z.string().trim().max(2000).optional(),
  followUpDate: z.string().optional(),
});

export const treatmentPlanItemSchema = z.object({
  treatmentId: objectIdSchema.optional(),
  procedureName: requiredStringSchema.max(200),
  procedureCode: z.string().trim().max(50).optional(),
  toothNumbers: z.array(z.number().int().min(1).max(85)).default([]),
  estimatedCost: z.number().min(0),
  estimatedTimeMinutes: z.number().int().min(0).max(480).optional(),
  priority: z.nativeEnum(TreatmentItemPriority).optional(),
  status: z.nativeEnum(TreatmentItemStatus).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const createTreatmentPlanSchema = z.object({
  name: requiredStringSchema.max(200),
  description: z.string().trim().max(2000).optional(),
  treatments: z.array(treatmentPlanItemSchema).min(1).max(50),
  validUntil: z.string().optional(),
});

export const updateTreatmentPlanSchema = z.object({
  name: z.string().trim().max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  treatments: z.array(treatmentPlanItemSchema).min(1).max(50).optional(),
  validUntil: z.string().optional(),
  status: z.nativeEnum(TreatmentPlanStatus).optional(),
});

export const xrayRequestSchema = z
  .object({
    type: z.nativeEnum(XrayRequestType),
    customType: z.string().trim().max(200).optional(),
    toothNumbers: z.array(z.number().int().min(1).max(85)).default([]),
    notes: z.string().trim().max(1000).optional(),
  })
  .refine(
    (data) => data.type !== XrayRequestType.Custom || Boolean(data.customType?.trim()),
    { message: 'Custom type description is required', path: ['customType'] },
  );

export const medicineSearchSchema = z.object({
  q: z.string().trim().min(2),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const treatmentSearchSchema = z.object({
  q: z.string().trim().min(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const clinicalHistorySearchSchema = z.object({
  q: z.string().trim().optional(),
  type: z
    .enum(['diagnosis', 'prescription', 'treatment', 'xray', 'bill', 'note', 'procedure'])
    .optional(),
});

export type ListVisitsInput = z.infer<typeof listVisitsSchema>;
export type CreateVisitInput = z.infer<typeof createVisitSchema>;
export type ConsultationDraftInput = z.infer<typeof consultationDraftSchema>;
export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;
export type CreateTreatmentPlanInput = z.infer<typeof createTreatmentPlanSchema>;
export type UpdateTreatmentPlanInput = z.infer<typeof updateTreatmentPlanSchema>;
export type XrayRequestInput = z.infer<typeof xrayRequestSchema>;
