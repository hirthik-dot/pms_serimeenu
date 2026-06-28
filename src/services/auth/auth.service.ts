import crypto from 'crypto';

import { Types } from 'mongoose';

import { getEnv } from '@/config/env';
import { RATE_LIMIT } from '@/constants/app';
import { connectToDatabase } from '@/lib/db';
import { ensureAuthSeed } from '@/lib/db/seed-auth';
import {
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  UnauthorizedError,
} from '@/lib/errors';
import { logger } from '@/lib/logger';
import type { IUser } from '@/models/user.model';
import { auditLogRepository } from '@/repositories/audit-log.repository';
import { loginAttemptRepository } from '@/repositories/login-attempt.repository';
import { passwordResetRepository } from '@/repositories/password-reset.repository';
import { refreshTokenRepository } from '@/repositories/refresh-token.repository';
import { userRepository } from '@/repositories/user.repository';
import {
  getRefreshTokenMaxAge,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '@/services/auth/jwt.service';
import {
  hashPassword,
  validatePasswordStrength,
  verifyPassword,
} from '@/services/auth/password.service';
import type { AuthContext, AuthUser, SessionOptions } from '@/types/auth';
import { AuditAction, UserStatus } from '@/types/enums';
import { getDocumentId } from '@/utils/mongoose';

function toAuthUser(user: IUser & { _id?: { toString(): string } }): AuthUser {
  const id = '_id' in user && user._id ? user._id.toString() : String(user);
  return {
    id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    permissions: user.permissions,
    avatar: user.avatar,
    lastLoginAt: user.lastLoginAt?.toISOString(),
    createdAt: user.createdAt?.toISOString?.() ?? undefined,
    updatedAt: user.updatedAt?.toISOString?.() ?? undefined,
  };
}

export class AuthService {
  async login(
    email: string,
    password: string,
    ipAddress: string,
    userAgent: string,
    options: SessionOptions = {},
  ) {
    await connectToDatabase();
    await ensureAuthSeed();

    const windowStart = loginAttemptRepository.getLoginWindowStart();
    const failedAttempts = await loginAttemptRepository.countFailedAttempts(
      ipAddress,
      windowStart,
    );

    if (failedAttempts >= RATE_LIMIT.LOGIN_MAX_ATTEMPTS) {
      throw new RateLimitError('Too many login attempts. Please try again in 15 minutes.');
    }

    const user = await userRepository.findByEmail(email, true);

    if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
      await loginAttemptRepository.recordAttempt(ipAddress, email, false);
      await auditLogRepository.create({
        action: AuditAction.Login,
        resource: 'auth',
        details: { email, reason: 'invalid_credentials' },
        ipAddress,
        userAgent,
        success: false,
      });
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status === UserStatus.Suspended) {
      await loginAttemptRepository.recordAttempt(ipAddress, email, false);
      throw new ForbiddenError('Your account has been suspended. Contact an administrator.');
    }

    if (user.status === UserStatus.Inactive) {
      await loginAttemptRepository.recordAttempt(ipAddress, email, false);
      throw new ForbiddenError('Your account is inactive. Contact an administrator.');
    }

    await loginAttemptRepository.recordAttempt(ipAddress, email, true);
    await userRepository.updateLastLogin(getDocumentId(user));

    const tokens = await this.issueTokens(user, ipAddress, userAgent, options.rememberMe);

    await auditLogRepository.create({
      userId: getDocumentId(user),
      action: AuditAction.Login,
      resource: 'auth',
      ipAddress,
      userAgent,
      success: true,
    });

    return {
      user: {
        id: getDocumentId(user),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      },
      ...tokens,
    };
  }

  async issueTokens(
    user: IUser & { _id?: { toString(): string } },
    ipAddress: string,
    userAgent: string,
    rememberMe = false,
  ) {
    const userId = getDocumentId(user);
    const familyId = crypto.randomUUID();
    const jti = crypto.randomUUID();

    const accessToken = await signAccessToken({
      sub: userId,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      tokenVersion: user.tokenVersion,
    });

    const refreshTokenRaw = await signRefreshToken(
      { sub: userId, tokenVersion: user.tokenVersion, jti },
      rememberMe,
    );

    const tokenHash = refreshTokenRepository.hashToken(refreshTokenRaw);
    const expiresAt = new Date(Date.now() + getRefreshTokenMaxAge(rememberMe) * 1000);

    await refreshTokenRepository.create({
      userId: new Types.ObjectId(userId),
      tokenHash,
      familyId,
      expiresAt,
      userAgent,
      ipAddress,
    });

    return { accessToken, refreshToken: refreshTokenRaw, rememberMe };
  }

  async logout(
    userId: string,
    refreshToken: string | undefined,
    allDevices: boolean,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await connectToDatabase();

    if (allDevices) {
      await refreshTokenRepository.revokeAllForUser(userId);
      await userRepository.incrementTokenVersion(userId);
    } else if (refreshToken) {
      const tokenHash = refreshTokenRepository.hashToken(refreshToken);
      await refreshTokenRepository.revokeByTokenHash(tokenHash);
    }

    await auditLogRepository.create({
      userId,
      action: AuditAction.Logout,
      resource: 'auth',
      details: { allDevices },
      ipAddress,
      userAgent,
    });
  }

  async refresh(refreshToken: string, ipAddress: string, userAgent: string) {
    await connectToDatabase();

    let payload;
    try {
      payload = await verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const tokenHash = refreshTokenRepository.hashToken(refreshToken);
    const storedToken = await refreshTokenRepository.findByTokenHash(tokenHash);

    if (!storedToken) {
      await refreshTokenRepository.revokeFamily(payload.jti);
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await userRepository.findById(payload.sub);
    if (!user || user.isDeleted) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      await refreshTokenRepository.revokeAllForUser(payload.sub);
      throw new UnauthorizedError('Session expired. Please log in again.');
    }

    if (user.status !== UserStatus.Active) {
      throw new ForbiddenError('Account is not active');
    }

    await refreshTokenRepository.revokeByTokenHash(tokenHash);

    const newRefreshRaw = await signRefreshToken({
      sub: payload.sub,
      tokenVersion: user.tokenVersion,
      jti: crypto.randomUUID(),
    });

    const newTokenHash = refreshTokenRepository.hashToken(newRefreshRaw);
    const expiresAt = new Date(Date.now() + getRefreshTokenMaxAge() * 1000);

    await refreshTokenRepository.create({
      userId: storedToken.userId,
      tokenHash: newTokenHash,
      familyId: storedToken.familyId,
      expiresAt,
      userAgent,
      ipAddress,
      replacedByTokenHash: newTokenHash,
    });

    const accessToken = await signAccessToken({
      sub: payload.sub,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      tokenVersion: user.tokenVersion,
    });

    return { accessToken, refreshToken: newRefreshRaw };
  }

  async getCurrentUser(userId: string): Promise<AuthUser> {
    await connectToDatabase();
    const user = await userRepository.findById(userId);
    if (!user || user.isDeleted) {
      throw new UnauthorizedError('User not found');
    }
    return toAuthUser(user);
  }

  async authenticateRequest(accessToken: string | undefined): Promise<AuthContext> {
    if (!accessToken) {
      throw new UnauthorizedError();
    }

    await connectToDatabase();

    let payload;
    try {
      payload = await verifyAccessToken(accessToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }

    const user = await userRepository.findById(payload.sub);
    if (!user || user.isDeleted) {
      throw new UnauthorizedError('User not found');
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedError('Session expired. Please log in again.');
    }

    if (user.status !== UserStatus.Active) {
      throw new ForbiddenError('Account is not active');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
      tokenVersion: payload.tokenVersion,
    };
  }

  async forgotPassword(email: string, ipAddress?: string): Promise<string | null> {
    await connectToDatabase();
    await ensureAuthSeed();

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const attempts = await loginAttemptRepository.countPasswordResetAttempts(email, oneHourAgo);

    if (attempts >= 3) {
      throw new RateLimitError('Too many password reset requests. Please try again later.');
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      return null;
    }

    await passwordResetRepository.invalidateAllForUser(getDocumentId(user));

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = passwordResetRepository.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await passwordResetRepository.create({
      userId: new Types.ObjectId(getDocumentId(user)),
      tokenHash,
      expiresAt,
    });

    await auditLogRepository.create({
      userId: getDocumentId(user),
      action: AuditAction.Update,
      resource: 'user',
      resourceId: getDocumentId(user),
      details: { action: 'password_reset_requested' },
      ipAddress,
      success: true,
    });

    if (process.env.NODE_ENV === 'development') {
      logger.info('Password reset token generated', {
        email,
        resetUrl: `${getEnv().NEXT_PUBLIC_APP_URL}/reset-password?token=${rawToken}`,
      });
    }

    return rawToken;
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await connectToDatabase();

    if (!validatePasswordStrength(password)) {
      throw new Error('Password does not meet requirements');
    }

    const tokenHash = passwordResetRepository.hashToken(token);
    const resetRecord = await passwordResetRepository.findValidToken(tokenHash);

    if (!resetRecord) {
      throw new NotFoundError('Reset token');
    }

    const userId = resetRecord.userId.toString();
    const passwordHash = await hashPassword(password);

    await userRepository.updateById(userId, {
      $set: { passwordHash },
      $inc: { tokenVersion: 1 },
    });

    await passwordResetRepository.markUsed(tokenHash);
    await refreshTokenRepository.revokeAllForUser(userId);

    await auditLogRepository.create({
      userId,
      action: AuditAction.Update,
      resource: 'user',
      resourceId: userId,
      details: { action: 'password_reset_completed' },
      success: true,
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    await connectToDatabase();

    const user = await userRepository.findByIdWithPassword(userId);

    if (!user?.passwordHash) {
      throw new UnauthorizedError('User not found');
    }

    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    if (!validatePasswordStrength(newPassword)) {
      throw new Error('Password does not meet requirements');
    }

    const passwordHash = await hashPassword(newPassword);

    await userRepository.updateById(userId, {
      $set: { passwordHash },
      $inc: { tokenVersion: 1 },
    });

    await refreshTokenRepository.revokeAllForUser(userId);

    await auditLogRepository.create({
      userId,
      action: AuditAction.Update,
      resource: 'user',
      resourceId: userId,
      details: { action: 'password_changed' },
      success: true,
    });
  }
}

export const authService = new AuthService();

export { toAuthUser };
