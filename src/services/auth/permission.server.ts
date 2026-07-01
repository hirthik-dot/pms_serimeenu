import { DEFAULT_ROLE_PERMISSIONS, expandPermissionWildcards } from '@/constants/permissions';
import { roleRepository } from '@/repositories/role.repository';
import { resolveEffectivePermissions } from '@/services/auth/permission.service';

/** Load merged permissions for a user from their role document and stored overrides. */
export async function resolveUserPermissions(user: {
  role: string;
  roleId?: { toString(): string } | string;
  permissions?: string[];
}): Promise<string[]> {
  let rolePermissions: string[] = [];

  if (user.roleId) {
    const roleId = typeof user.roleId === 'string' ? user.roleId : user.roleId.toString();
    const role = await roleRepository.findById(roleId);
    if (role?.permissions?.length) {
      rolePermissions = role.permissions;
    }
  }

  if (rolePermissions.length === 0) {
    const role = await roleRepository.findByName(user.role);
    if (role?.permissions?.length) {
      rolePermissions = role.permissions;
    }
  }

  if (rolePermissions.length === 0) {
    rolePermissions = expandPermissionWildcards(
      DEFAULT_ROLE_PERMISSIONS[user.role] ?? [],
    );
  }

  return resolveEffectivePermissions(rolePermissions, user.permissions ?? []);
}
