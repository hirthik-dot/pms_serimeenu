import { z } from 'zod';

import { phoneSchema, requiredStringSchema } from '@/validators/common.validator';

export const updateProfileSchema = z.object({
  firstName: requiredStringSchema.max(100),
  lastName: requiredStringSchema.max(100),
  phone: phoneSchema.optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
