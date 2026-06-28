import { z } from 'zod';

import { TreatmentCategory } from '@/types/enums';

import { paginationSchema, requiredStringSchema } from './common.validator';

export const updateClinicSchema = z.object({
  clinicName: requiredStringSchema.max(200).optional(),
  phone: z.string().trim().optional(),
  email: z.string().email().optional(),
  address: z
    .object({
      street: z.string().trim(),
      city: z.string().trim(),
      state: z.string().trim(),
      pincode: z.string().trim(),
      country: z.string().trim().default('India'),
    })
    .optional(),
  workingHours: z.object({ start: z.string(), end: z.string() }).optional(),
  workingDays: z.array(z.number().int().min(0).max(6)).optional(),
  appointmentDuration: z.number().int().min(5).optional(),
  departments: z.array(z.string().trim()).optional(),
  invoiceHeader: z.string().trim().optional(),
  invoiceFooter: z.string().trim().optional(),
});

export const updateBrandingSchema = z.object({
  logo: z.string().url().optional(),
  theme: z
    .object({
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      accentColor: z.string().optional(),
    })
    .optional(),
  prescriptionHeader: z.string().trim().optional(),
  prescriptionFooter: z.string().trim().optional(),
});

export const updateGstSchema = z.object({
  gstEnabled: z.boolean(),
  gstNumber: z.string().trim().optional(),
  gstRate: z.number().min(0).max(100).optional(),
});

export const createTreatmentAdminSchema = z.object({
  procedureName: requiredStringSchema.max(200),
  procedureCode: z.string().trim().max(20).optional(),
  category: z.nativeEnum(TreatmentCategory),
  defaultCost: z.number().min(0),
  duration: z.number().int().min(1).default(30),
  description: z.string().trim().max(2000).optional(),
  isActive: z.boolean().default(true),
});

export const updateTreatmentAdminSchema = createTreatmentAdminSchema.partial();

export const listTreatmentsAdminSchema = paginationSchema.extend({
  search: z.string().optional(),
  category: z.nativeEnum(TreatmentCategory).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const createMedicineAdminSchema = z.object({
  name: requiredStringSchema.max(200),
  genericName: z.string().trim().max(200).optional(),
  defaultDosage: z.string().trim().optional(),
  manufacturer: z.string().trim().optional(),
  isActive: z.boolean().default(true),
});

export const updateMedicineAdminSchema = createMedicineAdminSchema.partial();

export const listMedicinesAdminSchema = paginationSchema.extend({
  search: z.string().optional(),
});

export const listAuditLogsSchema = paginationSchema.extend({
  resource: z.string().optional(),
  action: z.string().optional(),
  userId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const reportDateRangeSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  doctorId: z.string().optional(),
});
