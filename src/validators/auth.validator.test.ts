import { describe, expect, it } from 'vitest';

import {
  changePasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from '@/validators/auth.validator';

describe('auth.validator', () => {
  it('validates login input', () => {
    const result = loginSchema.safeParse({
      email: 'doctor@clinic.com',
      password: 'secret',
      rememberMe: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid login email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'secret',
    });
    expect(result.success).toBe(false);
  });

  it('validates reset password confirmation', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'abc123',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
    });
    expect(result.success).toBe(true);
  });

  it('rejects mismatched reset passwords', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'abc123',
      password: 'SecurePass123!',
      confirmPassword: 'DifferentPass123!',
    });
    expect(result.success).toBe(false);
  });

  it('rejects change password when new matches current', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'SecurePass123!',
      newPassword: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
    });
    expect(result.success).toBe(false);
  });
});
