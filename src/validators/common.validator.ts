// =============================================================================
// Common Validators (Zod Schemas)
// =============================================================================
// Reusable schema fragments for request validation.
// Used in both server (route handlers) and client (form resolvers).
// =============================================================================

import { z } from 'zod';

import { PAGINATION } from '@/constants/app';

// ─── Primitives ─────────────────────────────────────────────────────────────

/**
 * MongoDB ObjectId string validation.
 */
export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

/**
 * Indian phone number (10 digits, optionally prefixed with +91).
 */
export const phoneSchema = z
  .string()
  .regex(/^(\+91)?[6-9]\d{9}$/, 'Invalid phone number')
  .transform((val) => val.replace(/^\+91/, ''));

/**
 * Email validation.
 */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .toLowerCase()
  .trim();

/**
 * Non-empty trimmed string.
 */
export const requiredStringSchema = z
  .string()
  .trim()
  .min(1, 'This field is required');

/**
 * Optional trimmed string.
 */
export const optionalStringSchema = z
  .string()
  .trim()
  .optional();

/**
 * Date string in ISO format.
 */
export const dateSchema = z
  .string()
  .datetime({ message: 'Invalid date format' })
  .or(z.date());

/**
 * Time in HH:mm format.
 */
export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)');

// ─── Pagination ─────────────────────────────────────────────────────────────

/**
 * Pagination query parameter schema.
 */
export const paginationSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive()
    .default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(PAGINATION.MAX_LIMIT)
    .default(PAGINATION.DEFAULT_LIMIT),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().trim().optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// ─── Address ────────────────────────────────────────────────────────────────

export const addressSchema = z.object({
  street: requiredStringSchema,
  city: requiredStringSchema,
  state: requiredStringSchema,
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  country: requiredStringSchema.default('India'),
});
