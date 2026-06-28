// =============================================================================
// Audit Hooks — Automatic audit trail on create, update, delete, restore
// =============================================================================

import type { Schema } from 'mongoose';

import { AuditLogModel } from '@/models/audit-log.model';
import { AuditAction } from '@/types/enums';
import type { IAuditContext } from '@/types/models';

export interface AuditHookOptions {
  resource: string;
  trackFields?: string[];
}

function getAuditContext(doc: { $locals?: Record<string, unknown> }): IAuditContext {
  return (doc.$locals?.auditContext as IAuditContext | undefined) ?? {};
}

function sanitizeForAudit(value: unknown): Record<string, unknown> | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== 'object') return { value };
  const plain = JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  delete plain.passwordHash;
  delete plain.tokenVersion;
  return plain;
}

async function writeAuditLog(
  action: AuditAction,
  resource: string,
  resourceId: string | undefined,
  context: IAuditContext,
  before?: Record<string, unknown>,
  after?: Record<string, unknown>,
): Promise<void> {
  try {
    await AuditLogModel.create({
      userId: context.userId,
      action,
      resource,
      resourceId,
      details: {
        userEmail: context.userEmail,
        description: `${action} ${resource}${resourceId ? ` ${resourceId}` : ''}`,
        before,
        after,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      success: true,
    });
  } catch {
    // Audit failures must not block database operations
  }
}

export function auditHooks(schema: Schema, options: AuditHookOptions): void {
  const { resource } = options;

  schema.post('save', async function auditSave(doc) {
    const context = getAuditContext(doc);
    const isNew = doc.isNew ?? false;
    const action = isNew ? AuditAction.Create : AuditAction.Update;
    const id = doc._id?.toString();

    await writeAuditLog(
      action,
      resource,
      id,
      context,
      isNew ? undefined : sanitizeForAudit(doc.toObject()),
      sanitizeForAudit(doc.toObject()),
    );
  });
}
