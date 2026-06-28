'use client';

import { useAuth } from '@/providers/auth-provider';
import { hasPermission } from '@/services/auth/permission.service';

export function usePermissions() {
  const { user, hasPermission: check, hasAnyPermission } = useAuth();

  return {
    permissions: user?.permissions ?? [],
    hasPermission: check,
    hasAnyPermission,
    hasAllPermissions: (required: string[]) =>
      required.every((perm) => hasPermission(user?.permissions ?? [], perm)),
  };
}

export function useRequireAuth(redirectTo = '/login') {
  const { isAuthenticated, isLoading, user } = useAuth();

  return { isAuthenticated, isLoading, user, redirectTo };
}
