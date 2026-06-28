import { describe, expect, it } from 'vitest';

import { signAccessToken, verifyAccessToken } from '@/services/auth/jwt.service';
import { UserRole } from '@/types/enums';

describe('jwt.service integration', () => {
  it('signs and verifies access tokens', async () => {
    const payload = {
      sub: '665a1b2c3d4e5f6789012345',
      email: 'doctor@clinic.com',
      role: UserRole.Doctor,
      permissions: ['patients:read'],
      tokenVersion: 1,
    };

    const token = await signAccessToken(payload);
    const verified = await verifyAccessToken(token);

    expect(verified.sub).toBe(payload.sub);
    expect(verified.email).toBe(payload.email);
    expect(verified.role).toBe(UserRole.Doctor);
    expect(verified.permissions).toEqual(['patients:read']);
    expect(verified.tokenVersion).toBe(1);
  });
});
