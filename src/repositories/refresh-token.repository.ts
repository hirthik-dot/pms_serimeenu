import crypto from 'crypto';

import { RefreshTokenModel, type IRefreshToken } from '@/models/refresh-token.model';
import { BaseRepository } from '@/repositories/base.repository';

export class RefreshTokenRepository extends BaseRepository<IRefreshToken> {
  constructor() {
    super(RefreshTokenModel);
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async findByTokenHash(tokenHash: string): Promise<IRefreshToken | null> {
    return this.findOne({
      tokenHash,
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    } as unknown as Partial<IRefreshToken>);
  }

  async revokeByTokenHash(tokenHash: string): Promise<void> {
    await RefreshTokenModel.updateOne(
      { tokenHash },
      { $set: { revokedAt: new Date() } },
    ).exec();
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await RefreshTokenModel.updateMany(
      { userId, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } },
    ).exec();
  }

  async revokeFamily(familyId: string): Promise<void> {
    await RefreshTokenModel.updateMany(
      { familyId, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } },
    ).exec();
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
