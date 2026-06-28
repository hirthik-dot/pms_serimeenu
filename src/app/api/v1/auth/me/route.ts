import { withApiHandler } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { withAuth } from '@/lib/auth/api-guard';
import { authService } from '@/services/auth/auth.service';

export const GET = withApiHandler(
  withAuth(async (_request, _context, auth) => {
    const user = await authService.getCurrentUser(auth.userId);
    return successResponse(user, 'User profile fetched successfully');
  }),
);
