import { Types } from 'mongoose';

import { AuditLogModel } from '@/models/audit-log.model';
import { type AuditAction } from '@/types/enums';

export interface AuditLogInput {
  userId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
}

export class AuditLogRepository {
  async create(input: AuditLogInput): Promise<void> {
    await AuditLogModel.create({
      userId: input.userId ? new Types.ObjectId(input.userId) : undefined,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      details: input.details,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      success: input.success ?? true,
    });
  }
}

export const auditLogRepository = new AuditLogRepository();
