import bcrypt from 'bcryptjs';

import { getEnv } from '@/config/env';

export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export const PASSWORD_REQUIREMENTS =
  'Password must be at least 8 characters with uppercase, lowercase, number, and special character';

export async function hashPassword(password: string): Promise<string> {
  const { BCRYPT_SALT_ROUNDS } = getEnv();
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function validatePasswordStrength(password: string): boolean {
  return PASSWORD_REGEX.test(password);
}
