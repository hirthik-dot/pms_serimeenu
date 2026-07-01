import { Types } from 'mongoose';
import { z } from 'zod';


import { expandPermissionWildcards } from '@/constants/permissions';
import { connectToDatabase } from '@/lib/db';
import { ConflictError, NotFoundError } from '@/lib/errors';
import { roleRepository } from '@/repositories/role.repository';
import { userRepository } from '@/repositories/user.repository';
import { toAuthUser } from '@/services/auth/auth.service';
import { hashPassword } from '@/services/auth/password.service';
import type { AuthUser } from '@/types/auth';
import { UserRole, UserStatus } from '@/types/enums';
import { getDocumentId } from '@/utils/mongoose';
import { emailSchema, paginationSchema, phoneSchema, requiredStringSchema } from '@/validators/common.validator';

export const createUserSchema = z.object({
  firstName: requiredStringSchema.max(100),
  lastName: requiredStringSchema.max(100),
  email: emailSchema.max(255),
  phone: phoneSchema.optional(),
  password: z.string().min(8),
  role: z.nativeEnum(UserRole),
  roleId: z.string().optional(),
  status: z.nativeEnum(UserStatus).default(UserStatus.Active),
});

export const updateUserSchema = z.object({
  firstName: requiredStringSchema.max(100).optional(),
  lastName: requiredStringSchema.max(100).optional(),
  phone: phoneSchema.optional(),
  role: z.nativeEnum(UserRole).optional(),
  roleId: z.string().optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export const listUsersSchema = paginationSchema.extend({
  status: z.nativeEnum(UserStatus).optional(),
  role: z.nativeEnum(UserRole).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersInput = z.infer<typeof listUsersSchema>;

function stripSecrets(user: AuthUser): Omit<AuthUser, never> {
  return user;
}

export class UserService {
  async listUsers(input: ListUsersInput) {
    await connectToDatabase();

    const filter: Record<string, unknown> = { isDeleted: false };
    if (input.status) filter.status = input.status;
    if (input.role) filter.role = input.role;
    if (input.search) {
      filter.$or = [
        { firstName: { $regex: input.search, $options: 'i' } },
        { lastName: { $regex: input.search, $options: 'i' } },
        { email: { $regex: input.search, $options: 'i' } },
      ];
    }

    const result = await userRepository.findPaginated(filter, {
      page: input.page,
      limit: input.limit,
      sortBy: input.sortBy ?? 'createdAt',
      sortOrder: input.sortOrder,
    });

    const users = await Promise.all(result.data.map((u) => toAuthUser(u)));

    return {
      data: users.map((u) => stripSecrets(u)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  async getUser(id: string): Promise<AuthUser> {
    await connectToDatabase();
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('User');
    return stripSecrets(await toAuthUser(user));
  }

  async createUser(input: CreateUserInput): Promise<AuthUser> {
    await connectToDatabase();

    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('User with this email already exists');
    }

    const role = input.roleId
      ? await roleRepository.findById(input.roleId)
      : await roleRepository.findByName(input.role);

    const permissions = role
      ? expandPermissionWildcards(role.permissions)
      : expandPermissionWildcards([]);

    const passwordHash = await hashPassword(input.password);

    const user = await userRepository.create({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      passwordHash,
      role: input.role,
      roleId: role ? new Types.ObjectId(getDocumentId(role)) : undefined,
      status: input.status,
      permissions,
      tokenVersion: 0,
      isDeleted: false,
    });

    return stripSecrets(await toAuthUser(user));
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<AuthUser> {
    await connectToDatabase();

    const update: Record<string, unknown> = { ...input };

    if (input.roleId) {
      const role = await roleRepository.findById(input.roleId);
      if (role) {
        update.permissions = expandPermissionWildcards(role.permissions);
      }
    } else if (input.role) {
      const role = await roleRepository.findByName(input.role);
      if (role) {
        update.roleId = new Types.ObjectId(getDocumentId(role));
        update.permissions = expandPermissionWildcards(role.permissions);
      }
    }

    const user = await userRepository.updateById(id, { $set: update }, 'User');
    return stripSecrets(await toAuthUser(user));
  }

  async deleteUser(id: string): Promise<void> {
    await connectToDatabase();
    await userRepository.softDelete(id, 'User');
  }
}

export const userService = new UserService();
