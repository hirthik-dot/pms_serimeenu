import type { NextRequest } from 'next/server';

import { withApiHandler, parseJsonBody, parseSearchParams } from '@/lib/api-handler';
import { buildPaginationMeta, createdResponse, paginatedResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { sanitizeObject } from '@/lib/auth/sanitize';
import { userService, createUserSchema, listUsersSchema } from '@/services/user.service';

export const GET = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    requirePermission(auth, 'users:manage');
    const params = parseSearchParams(request, listUsersSchema);
    const result = await userService.listUsers(params);
    return paginatedResponse(
      result.data,
      buildPaginationMeta(result.total, result.page, result.limit),
      'Users fetched successfully',
    );
  }, { permissions: ['users:manage'] }),
);

export const POST = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    requirePermission(auth, 'users:manage');
    const body = sanitizeObject(await parseJsonBody(request, createUserSchema));
    const user = await userService.createUser(body);
    return createdResponse(user, 'User created successfully');
  }, { permissions: ['users:manage'] }),
);
