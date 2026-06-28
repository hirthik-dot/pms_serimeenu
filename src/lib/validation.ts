import type { ZodType } from 'zod';
import { ZodError } from 'zod';

import { ValidationError } from './errors';

export function validate<T>(schema: ZodType<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(
        'Validation failed',
        error.issues.map((issue) => ({
          field: issue.path.join('.') || 'root',
          message: issue.message,
        })),
      );
    }
    throw error;
  }
}

export function validateSafe<T>(
  schema: ZodType<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: ValidationError } {
  try {
    return { success: true, data: validate(schema, data) };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, error };
    }
    throw error;
  }
}
