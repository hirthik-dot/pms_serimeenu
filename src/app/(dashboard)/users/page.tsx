'use client';

import { useQuery } from '@tanstack/react-query';

import { AuthGuard } from '@/components/auth/auth-guard';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetchWithRefresh } from '@/lib/api-client';
import type { AuthUser } from '@/types/auth';

export default function UsersPage() {
  const { data } = useQuery({
    queryKey: ['users'],
    queryFn: () =>
      apiFetchWithRefresh<{ data: AuthUser[]; total: number }>('/users?limit=50'),
  });

  const users = data?.data?.data ?? [];

  return (
    <AuthGuard>
      <div className="space-y-6">
        <PageHeader title="Staff Management" description="Doctors, receptionists, and administrators" />
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded border p-3 text-sm">
                <div>
                  <p className="font-medium">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{u.role}</Badge>
                  <Badge variant="secondary">{u.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
