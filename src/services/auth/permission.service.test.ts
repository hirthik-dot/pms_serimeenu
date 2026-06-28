import { describe, expect, it } from 'vitest';

import { hasAllPermissions, hasAnyPermission, hasPermission } from '@/services/auth/permission.service';

describe('permission.service', () => {
  const doctorPermissions = ['patients:read', 'visits:create', 'billing:read'];

  it('matches exact permission codes', () => {
    expect(hasPermission(doctorPermissions, 'patients:read')).toBe(true);
    expect(hasPermission(doctorPermissions, 'patients:delete')).toBe(false);
  });

  it('supports resource wildcards', () => {
    expect(hasPermission(['patients:*'], 'patients:update')).toBe(true);
    expect(hasPermission(['patients:*'], 'billing:read')).toBe(false);
  });

  it('supports global wildcard', () => {
    expect(hasPermission(['*:*'], 'settings:manage')).toBe(true);
  });

  it('checks any and all permission sets', () => {
    expect(hasAnyPermission(doctorPermissions, ['patients:delete', 'visits:create'])).toBe(true);
    expect(hasAllPermissions(doctorPermissions, ['patients:read', 'visits:create'])).toBe(true);
    expect(hasAllPermissions(doctorPermissions, ['patients:read', 'users:manage'])).toBe(false);
  });
});
