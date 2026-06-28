import { Types } from 'mongoose';

import {
  buildRegexSearchFilter,
  combineFilters,
  type RepositoryPaginatedResult,
  type RepositoryPaginationOptions,
} from '@/lib/db/utils';
import { UserModel, type IUser } from '@/models/user.model';
import { BaseRepository } from '@/repositories/base.repository';
import { UserRole } from '@/types/enums';

export interface UserFilterOptions extends RepositoryPaginationOptions {
  search?: string;
  status?: string;
  role?: string;
  includeDeleted?: boolean;
}

const USER_SORT_FIELDS = ['createdAt', 'lastName', 'firstName', 'email', 'updatedAt'];

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(UserModel);
  }

  async findByEmail(email: string, includePassword = false): Promise<IUser | null> {
    const query = UserModel.findOne({ email: email.toLowerCase(), isDeleted: false });
    if (includePassword) {
      query.select('+passwordHash');
    }
    return query.lean<IUser>().exec();
  }

  async findByEmailOrThrow(email: string, includePassword = false): Promise<IUser> {
    const user = await this.findByEmail(email, includePassword);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async findByIdWithPassword(id: string): Promise<IUser | null> {
    return UserModel.findOne({ _id: id, isDeleted: false })
      .select('+passwordHash')
      .lean<IUser>()
      .exec();
  }

  async incrementTokenVersion(userId: string): Promise<IUser> {
    return this.updateById(userId, { $inc: { tokenVersion: 1 } }, 'User');
  }

  async updateLastLogin(userId: string): Promise<void> {
    await UserModel.updateOne({ _id: userId }, { $set: { lastLoginAt: new Date() } }).exec();
  }

  async countByRoleId(roleId: string): Promise<number> {
    return this.count({
      roleId: new Types.ObjectId(roleId),
      isDeleted: false,
    } as unknown as Partial<IUser>);
  }

  async search(options: UserFilterOptions): Promise<RepositoryPaginatedResult<IUser>> {
    const searchFilter = options.search
      ? buildRegexSearchFilter<IUser>(options.search, ['firstName', 'lastName', 'email', 'phone'])
      : null;

    const filter = combineFilters<IUser>(
      options.includeDeleted ? {} : { isDeleted: false },
      options.status ? ({ status: options.status } as never) : null,
      options.role ? ({ role: options.role } as never) : null,
      searchFilter,
    );

    return this.findWithFilters(filter as never, {
      ...options,
      allowedSortFields: USER_SORT_FIELDS,
    });
  }

  async findDoctors(search?: string, status = 'active'): Promise<IUser[]> {
    const filter = combineFilters<IUser>(
      { role: UserRole.Doctor, isDeleted: false, status: status as IUser['status'] },
      search
        ? buildRegexSearchFilter<IUser>(search, ['firstName', 'lastName', 'email'])
        : null,
    );

    return UserModel.find(filter)
      .select('firstName lastName email phone avatar status')
      .sort({ lastName: 1, firstName: 1 })
      .lean<IUser[]>()
      .exec();
  }

  async countActiveAdmins(): Promise<number> {
    return this.count({
      role: { $in: [UserRole.Admin, UserRole.SuperAdmin] },
      status: 'active',
      isDeleted: false,
    } as never);
  }
}

export const userRepository = new UserRepository();
