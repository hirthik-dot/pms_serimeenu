import { PERMISSION_CODES } from '@/constants/permissions';

/**
 * Check if a user has a required permission.
 * Supports wildcards: `*:*`, `patients:*`, and exact codes.
 */
export function hasPermission(
  userPermissions: string[],
  required: string,
): boolean {
  if (userPermissions.includes('*:*')) {
    return true;
  }

  if (userPermissions.includes(required)) {
    return true;
  }

  const [reqResource, reqAction] = required.split(':');

  for (const perm of userPermissions) {
    if (perm === '*:*') return true;

    const [resource, action] = perm.split(':');

    if (resource === reqResource && action === '*') {
      return true;
    }

    if (resource === '*' && action === reqAction) {
      return true;
    }
  }

  return false;
}

/** Check if user has ALL required permissions. */
export function hasAllPermissions(
  userPermissions: string[],
  required: string[],
): boolean {
  return required.every((perm) => hasPermission(userPermissions, perm));
}

/** Check if user has ANY of the required permissions. */
export function hasAnyPermission(
  userPermissions: string[],
  required: string[],
): boolean {
  return required.some((perm) => hasPermission(userPermissions, perm));
}

/** Resolve effective permissions from role defaults + user overrides. */
export function resolveEffectivePermissions(
  rolePermissions: string[],
  userPermissions: string[],
): string[] {
  const combined = new Set([...rolePermissions, ...userPermissions]);
  return [...combined];
}

/** Expand permissions for API responses (optional, for UI). */
export function expandPermissionsForDisplay(permissions: string[]): string[] {
  const expanded = new Set<string>();

  for (const perm of permissions) {
    if (perm === '*:*') {
      PERMISSION_CODES.forEach((code) => expanded.add(code));
      continue;
    }

    if (perm.endsWith(':*')) {
      const resource = perm.slice(0, -2);
      PERMISSION_CODES.filter((code) => code.startsWith(`${resource}:`)).forEach((code) =>
        expanded.add(code),
      );
      continue;
    }

    expanded.add(perm);
  }

  return [...expanded];
}
