import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { sanitizeObject } from '@/lib/auth/sanitize';
import { roleService } from '@/services/role.service';

const roleUpdateSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1).optional(),
});

export const GET = withApiHandler(
  withAuth(async (_request, context, auth) => {
    requirePermission(auth, 'users:manage');
    const { id } = await context.params;
    if (!id) throw new Error('Role ID is required');
    const role = await roleService.getRole(id);
    return successResponse(role, 'Role fetched successfully');
  }, { permissions: ['users:manage'] }),
);

export const PATCH = withApiHandler(
  withAuth(async (request: NextRequest, context, auth) => {
    requirePermission(auth, 'users:manage');
    const { id } = await context.params;
    if (!id) throw new Error('Role ID is required');
    const body = sanitizeObject(await parseJsonBody(request, roleUpdateSchema));
    const role = await roleService.updateRole(id, body);
    return successResponse(role, 'Role updated successfully');
  }, { permissions: ['users:manage'] }),
);

export const DELETE = withApiHandler(
  withAuth(async (_request, context, auth) => {
    requirePermission(auth, 'users:manage');
    const { id } = await context.params;
    if (!id) throw new Error('Role ID is required');
    await roleService.deleteRole(id);
    return successResponse(null, 'Role deleted successfully');
  }, { permissions: ['users:manage'] }),
);
