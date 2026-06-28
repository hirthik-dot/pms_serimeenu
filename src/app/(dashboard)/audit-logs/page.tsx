'use client';

import { useQuery } from '@tanstack/react-query';

import { AuthGuard } from '@/components/auth/auth-guard';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetchWithRefresh } from '@/lib/api-client';

interface AuditLogRow {
  _id: string;
  action: string;
  resource: string;
  resourceId?: string;
  createdAt: string;
  userId?: { firstName?: string; lastName?: string; email?: string };
}

export default function AuditLogsPage() {
  const { data } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () =>
      apiFetchWithRefresh<{ data: AuditLogRow[]; total: number }>('/audit-logs?limit=50'),
  });

  const logs = data?.data?.data ?? [];

  return (
    <AuthGuard>
      <div className="space-y-6">
        <PageHeader title="Audit Logs" description="System activity and change history" />
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No audit logs</p>
            ) : (
              logs.map((log) => (
                <div key={log._id} className="flex justify-between rounded border p-3 text-sm">
                  <div>
                    <p className="font-medium">{log.resource}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.userId
                        ? `${log.userId.firstName ?? ''} ${log.userId.lastName ?? ''}`.trim()
                        : 'System'}
                      · {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline">{log.action}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
