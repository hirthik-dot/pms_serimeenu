'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers/auth-provider';
import { hasAnyPermission, hasPermission } from '@/services/auth/permission.service';

interface PermissionGateProps {
  permission: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { user, isLoading } = useAuth();
  const permissions = Array.isArray(permission) ? permission : [permission];
  const allowed = user
    ? permissions.length === 1
      ? hasPermission(user.permissions, permissions[0]!)
      : hasAnyPermission(user.permissions, permissions)
    : false;

  if (isLoading) {
    return <Skeleton className="h-8 w-full" />;
  }

  if (!user || !allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-3 text-center">
          <Skeleton className="mx-auto h-10 w-10 rounded-full" />
          <Skeleton className="mx-auto h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
