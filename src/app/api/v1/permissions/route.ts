import { withApiHandler } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth, requirePermission } from '@/lib/auth/api-guard';
import { roleService } from '@/services/role.service';

export const GET = withApiHandler(
  withAuth(async (_request, _context, auth) => {
    requirePermission(auth, 'users:manage');
    const permissions = roleService.listPermissions();
    return successResponse(permissions, 'Permissions fetched successfully');
  }, { permissions: ['users:manage'] }),
);
