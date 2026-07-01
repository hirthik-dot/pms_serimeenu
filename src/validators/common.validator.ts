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

/**
 * Optional Indian phone number — empty or valid 10-digit.
 */
export const optionalPhoneSchema = z
  .union([z.literal(''), z.string()])
  .transform((val) => {
    const trimmed = val.trim();
    if (!trimmed) return undefined;
    return trimmed.replace(/^\+91/, '');
  })
  .refine((val) => val === undefined || /^[6-9]\d{9}$/.test(val), 'Invalid phone number');

/**
 * Registration address — street required; other fields optional with defaults applied on save.
 */
export const registrationAddressSchema = z.object({
  street: requiredStringSchema,
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  pincode: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^\d{6}$/.test(v), 'Pincode must be 6 digits'),
  country: z.string().trim().default('India'),
});

export const addressSchema = z.object({
  street: requiredStringSchema,
  city: requiredStringSchema,
  state: requiredStringSchema,
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  country: requiredStringSchema.default('India'),
});
