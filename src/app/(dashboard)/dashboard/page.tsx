'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { getDashboardPathForRole } from '@/constants/auth-routes';
import { useAuth } from '@/providers/auth-provider';

export default function DashboardRedirectPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(getDashboardPathForRole(user.role));
    }
  }, [user, isLoading, router]);

  return (
    <AuthGuard>
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Loading dashboard...
      </div>
    </AuthGuard>
  );
}
