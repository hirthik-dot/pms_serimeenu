import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { sanitizeObject } from '@/lib/auth/sanitize';
import { userService, updateUserSchema } from '@/services/user.service';

export const GET = withApiHandler(
  withAuth(async (_request, context, auth) => {
    requirePermission(auth, 'users:manage');
    const { id } = await context.params;
    if (!id) throw new Error('User ID is required');
    const user = await userService.getUser(id);
    return successResponse(user, 'User fetched successfully');
  }, { permissions: ['users:manage'] }),
);

export const PATCH = withApiHandler(
  withAuth(async (request: NextRequest, context, auth) => {
    requirePermission(auth, 'users:manage');
    const { id } = await context.params;
    if (!id) throw new Error('User ID is required');
    const body = sanitizeObject(await parseJsonBody(request, updateUserSchema));
    const user = await userService.updateUser(id, body);
    return successResponse(user, 'User updated successfully');
  }, { permissions: ['users:manage'] }),
);

export const DELETE = withApiHandler(
  withAuth(async (_request, context, auth) => {
    requirePermission(auth, 'users:manage');
    const { id } = await context.params;
    if (!id) throw new Error('User ID is required');
    await userService.deleteUser(id);
    return successResponse(null, 'User deleted successfully');
  }, { permissions: ['users:manage'] }),
);
