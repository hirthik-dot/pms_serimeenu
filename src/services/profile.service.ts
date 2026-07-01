import { connectToDatabase } from '@/lib/db';
import { NotFoundError } from '@/lib/errors';
import { auditLogRepository } from '@/repositories/audit-log.repository';
import { userRepository } from '@/repositories/user.repository';
import { toAuthUser } from '@/services/auth/auth.service';
import type { AuthUser } from '@/types/auth';
import { AuditAction } from '@/types/enums';
import type { UpdateProfileInput } from '@/validators/profile.validator';

export class ProfileService {
  async getProfile(userId: string): Promise<AuthUser> {
    await connectToDatabase();
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User');
    return await toAuthUser(user);
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<AuthUser> {
    await connectToDatabase();
    const user = await userRepository.updateById(userId, { $set: input }, 'User');

    await auditLogRepository.create({
      userId,
      action: AuditAction.Update,
      resource: 'profile',
      resourceId: userId,
      success: true,
    });

    return await toAuthUser(user);
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<AuthUser> {
    await connectToDatabase();
    const user = await userRepository.updateById(
      userId,
      { $set: { avatar: avatarUrl } },
      'User',
    );

    await auditLogRepository.create({
      userId,
      action: AuditAction.Upload,
      resource: 'profile',
      resourceId: userId,
      details: { avatar: avatarUrl },
      success: true,
    });

    return await toAuthUser(user);
  }
}

export const profileService = new ProfileService();
