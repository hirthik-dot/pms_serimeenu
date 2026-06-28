import { z } from 'zod';

import { PaymentMethod } from '@/types/enums';

import { objectIdSchema, paginationSchema } from './common.validator';

export const billLineItemSchema = z.object({
  treatmentId: objectIdSchema.optional(),
  description: z.string().trim().min(1).max(500),
  quantity: z.number().min(0.01).default(1),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).default(0),
});

export const createBillSchema = z.object({
  visitId: objectIdSchema,
  lineItems: z.array(billLineItemSchema).min(1),
  discountPercentage: z.number().min(0).max(100).default(0),
  discountAmount: z.number().min(0).default(0),
  notes: z.string().trim().max(2000).optional(),
  dueDate: z.string().optional(),
});

export const updateBillSchema = z.object({
  lineItems: z.array(billLineItemSchema).min(1).optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  discountAmount: z.number().min(0).optional(),
  notes: z.string().trim().max(2000).optional(),
  dueDate: z.string().optional(),
});

export const listBillsSchema = paginationSchema.extend({
  patientId: objectIdSchema.optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const createPaymentSchema = z.object({
  billId: objectIdSchema,
  amount: z.number().positive(),
  method: z.nativeEnum(PaymentMethod),
  referenceNumber: z.string().trim().optional(),
  notes: z.string().trim().max(500).optional(),
  idempotencyKey: z.string().trim().optional(),
});

export const splitPaymentSchema = z.object({
  billId: objectIdSchema,
  payments: z
    .array(
      z.object({
        amount: z.number().positive(),
        method: z.nativeEnum(PaymentMethod),
        referenceNumber: z.string().trim().optional(),
        notes: z.string().trim().max(500).optional(),
      }),
    )
    .min(1),
});

export const refundPaymentSchema = z.object({
  amount: z.number().positive().optional(),
  reason: z.string().trim().min(1).max(500),
});

export type CreateBillInput = z.infer<typeof createBillSchema>;
export type UpdateBillInput = z.infer<typeof updateBillSchema>;
export type ListBillsInput = z.infer<typeof listBillsSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type SplitPaymentInput = z.infer<typeof splitPaymentSchema>;
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;
