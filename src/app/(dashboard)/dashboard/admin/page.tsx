'use client';

import { useQuery } from '@tanstack/react-query';

import { AuthGuard } from '@/components/auth/auth-guard';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROLE_DISPLAY_NAMES } from '@/constants/auth-routes';
import { apiFetchWithRefresh } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';
import type { ExecutiveDashboardData } from '@/services/report.service';

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();

  const { data: dashboardRes } = useQuery({
    queryKey: ['reports', 'executive'],
    queryFn: () => apiFetchWithRefresh<ExecutiveDashboardData>('/reports/executive'),
  });

  const stats = dashboardRes?.data;

  return (
    <AuthGuard>
      <div className="space-y-6">
        <PageHeader
          title="Admin Dashboard"
          description="Executive overview and clinic analytics"
        />
        <Card>
          <CardHeader>
            <CardTitle>
              Welcome, {user?.firstName} {user?.lastName}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Role: {user ? ROLE_DISPLAY_NAMES[user.role] : '—'}
          </CardContent>
        </Card>

        {stats && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard label="Today's Revenue" value={`₹${stats.revenue.today.toLocaleString()}`} />
              <KpiCard label="Monthly Revenue" value={`₹${stats.revenue.month.toLocaleString()}`} />
              <KpiCard label="Outstanding" value={`₹${stats.revenue.outstanding.toLocaleString()}`} />
              <KpiCard label="Today's Visits" value={String(stats.patients.todayVisits)} />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Top Treatments (This Month)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.topTreatments.map((t) => (
                  <div key={t.name} className="flex justify-between text-sm">
                    <span>{t.name}</span>
                    <span className="font-medium">₹{t.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-1 h-32">
                  {stats.revenueByDay.map((d) => {
                    const max = Math.max(...stats.revenueByDay.map((x) => x.amount), 1);
                    const height = (d.amount / max) * 100;
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t bg-primary/70 min-h-[2px]"
                          style={{ height: `${height}%` }}
                        />
                        <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                          {d.date.slice(-2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AuthGuard>
  );
}
