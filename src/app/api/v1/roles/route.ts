import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { withApiHandler, parseJsonBody } from '@/lib/api-handler';
import { createdResponse, successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { sanitizeObject } from '@/lib/auth/sanitize';
import { roleService } from '@/services/role.service';

const roleInputSchema = z.object({
  name: z.string().min(1).max(50),
  displayName: z.string().min(1).max(100),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1),
});

export const GET = withApiHandler(
  withAuth(async (_request, _context, auth) => {
    requirePermission(auth, 'users:manage');
    const roles = await roleService.listRoles();
    return successResponse(roles, 'Roles fetched successfully');
  }, { permissions: ['users:manage'] }),
);

export const POST = withApiHandler(
  withAuth(async (request: NextRequest, _context, auth) => {
    requirePermission(auth, 'users:manage');
    const body = sanitizeObject(await parseJsonBody(request, roleInputSchema));
    const role = await roleService.createRole(body);
    return createdResponse(role, 'Role created successfully');
  }, { permissions: ['users:manage'] }),
);
