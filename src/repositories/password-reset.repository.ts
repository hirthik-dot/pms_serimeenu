import crypto from 'crypto';

import { PasswordResetTokenModel, type IPasswordResetToken } from '@/models/password-reset.model';
import { BaseRepository } from '@/repositories/base.repository';

export class PasswordResetRepository extends BaseRepository<IPasswordResetToken> {
  constructor() {
    super(PasswordResetTokenModel);
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async findValidToken(tokenHash: string): Promise<IPasswordResetToken | null> {
    return this.findOne({
      tokenHash,
      usedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    } as unknown as Partial<IPasswordResetToken>);
  }

  async markUsed(tokenHash: string): Promise<void> {
    await PasswordResetTokenModel.updateOne(
      { tokenHash },
      { $set: { usedAt: new Date() } },
    ).exec();
  }

  async invalidateAllForUser(userId: string): Promise<void> {
    await PasswordResetTokenModel.updateMany(
      { userId, usedAt: { $exists: false } },
      { $set: { usedAt: new Date() } },
    ).exec();
  }
}

export const passwordResetRepository = new PasswordResetRepository();
