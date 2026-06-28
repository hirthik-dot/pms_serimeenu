import { RATE_LIMIT } from '@/constants/app';
import { LoginAttemptModel } from '@/models/login-attempt.model';

export class LoginAttemptRepository {
  async recordAttempt(ipAddress: string, email: string, success: boolean): Promise<void> {
    await LoginAttemptModel.create({ ipAddress, email: email.toLowerCase(), success });
  }

  async countFailedAttempts(ipAddress: string, since: Date): Promise<number> {
    return LoginAttemptModel.countDocuments({
      ipAddress,
      success: false,
      createdAt: { $gte: since },
    }).exec();
  }

  async countPasswordResetAttempts(email: string, since: Date): Promise<number> {
    return LoginAttemptModel.countDocuments({
      email: email.toLowerCase(),
      success: false,
      createdAt: { $gte: since },
    }).exec();
  }

  getLoginWindowStart(): Date {
    return new Date(Date.now() - RATE_LIMIT.LOGIN_WINDOW_MS);
  }
}

export const loginAttemptRepository = new LoginAttemptRepository();
