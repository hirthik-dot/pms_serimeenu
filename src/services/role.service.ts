import { PERMISSION_CATALOG, PERMISSION_CODE_SET } from '@/constants/permissions';
import { expandPermissionWildcards } from '@/constants/permissions';
import { connectToDatabase } from '@/lib/db';
import { ConflictError, ForbiddenError, ValidationError } from '@/lib/errors';
import type { IRole } from '@/models/role.model';
import { roleRepository } from '@/repositories/role.repository';
import { userRepository } from '@/repositories/user.repository';

export class RoleService {
  async listRoles(): Promise<IRole[]> {
    await connectToDatabase();
    return roleRepository.findAllActive();
  }

  async getRole(id: string): Promise<IRole> {
    await connectToDatabase();
    return roleRepository.findByIdOrThrow(id, 'Role');
  }

  async createRole(input: {
    name: string;
    displayName: string;
    description?: string;
    permissions: string[];
  }): Promise<IRole> {
    await connectToDatabase();
    this.validatePermissions(input.permissions);

    const existing = await roleRepository.findByName(input.name);
    if (existing) {
      throw new ConflictError('Role with this name already exists');
    }

    const expandedPermissions = expandPermissionWildcards(input.permissions);

    return roleRepository.create({
      name: input.name.toLowerCase(),
      displayName: input.displayName,
      description: input.description,
      permissions: expandedPermissions,
      isSystem: false,
      isDeleted: false,
    });
  }

  async updateRole(
    id: string,
    input: Partial<{
      displayName: string;
      description: string;
      permissions: string[];
    }>,
  ): Promise<IRole> {
    await connectToDatabase();
    const role = await roleRepository.findByIdOrThrow(id, 'Role');

    if (role.isSystem && input.permissions) {
      throw new ForbiddenError('Cannot modify permissions of system roles');
    }

    if (input.permissions) {
      this.validatePermissions(input.permissions);
    }

    const update: Partial<IRole> = {};
    if (input.displayName) update.displayName = input.displayName;
    if (input.description !== undefined) update.description = input.description;
    if (input.permissions) {
      update.permissions = expandPermissionWildcards(input.permissions);
    }

    return roleRepository.updateById(id, { $set: update }, 'Role');
  }

  async deleteRole(id: string): Promise<void> {
    await connectToDatabase();
    const role = await roleRepository.findByIdOrThrow(id, 'Role');

    if (role.isSystem) {
      throw new ForbiddenError('System roles cannot be deleted');
    }

    const userCount = await userRepository.countByRoleId(id);
    if (userCount > 0) {
      throw new ConflictError('Cannot delete role with assigned users');
    }

    await roleRepository.softDelete(id, 'Role');
  }

  listPermissions() {
    return PERMISSION_CATALOG;
  }

  private validatePermissions(permissions: string[]): void {
    for (const perm of permissions) {
      if (perm.endsWith(':*')) continue;
      if (perm === '*:*') continue;
      if (!PERMISSION_CODE_SET.has(perm)) {
        throw new ValidationError(`Invalid permission code: ${perm}`, [
          { field: 'permissions', message: `Unknown permission: ${perm}` },
        ]);
      }
    }
  }
}

export const roleService = new RoleService();
