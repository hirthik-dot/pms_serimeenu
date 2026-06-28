import { describe, expect, it } from 'vitest';

import {
  PASSWORD_REQUIREMENTS,
  validatePasswordStrength,
} from '@/services/auth/password.service';

describe('password.service', () => {
  it('accepts strong passwords', () => {
    expect(validatePasswordStrength('SecurePass123!')).toBe(true);
  });

  it('rejects weak passwords', () => {
    expect(validatePasswordStrength('password')).toBe(false);
    expect(validatePasswordStrength('Short1!')).toBe(false);
  });

  it('documents password requirements', () => {
    expect(PASSWORD_REQUIREMENTS).toContain('8 characters');
  });
});
