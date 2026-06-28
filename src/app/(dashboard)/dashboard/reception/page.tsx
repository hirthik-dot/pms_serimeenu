'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { IndianRupee, PhoneForwarded, Plus, QrCode, Users } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { AuthGuard } from '@/components/auth/auth-guard';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { patientApi } from '@/features/patients/api/patient-api';
import { CheckinQrCode } from '@/features/patients/components/checkin-qr-code';
import { apiFetchWithRefresh } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';
import type { AppointmentDto } from '@/services/appointment.service';
import type { BillDto } from '@/services/bill.service';
import type { QueueTokenDto } from '@/services/queue.service';
import type { ExecutiveDashboardData } from '@/services/report.service';
import type { PatientSummary } from '@/types/patient';

export default function ReceptionDashboardPage() {
  const { user } = useAuth();

  const { data: dashRes, refetch: refetchDash } = useQuery({
    queryKey: ['reception', 'dashboard'],
    queryFn: () =>
      apiFetchWithRefresh<{
        stats: ExecutiveDashboardData;
        todayAppointments: AppointmentDto[];
        waitingQueue: QueueTokenDto[];
        outstandingBills: BillDto[];
      }>('/reception/dashboard'),
    refetchInterval: 15000,
  });

  const { data: patientsRes } = useQuery({
    queryKey: ['patients', 'recent'],
    queryFn: () => patientApi.list({ page: 1, limit: 8, sortBy: 'createdAt', sortOrder: 'desc' }),
    refetchInterval: 15000,
  });

  const dash = dashRes?.data;
  const recentPatients = patientsRes?.data ?? [];

  const callNext = useMutation({
    mutationFn: () =>
      apiFetchWithRefresh('/queue/call', {
        method: 'POST',
        body: JSON.stringify({ doctorId: user?.id }),
      }),
    onSuccess: () => {
      toast.success('Patient called');
      void refetchDash();
    },
    onError: () => toast.error('Queue empty'),
  });

  return (
    <AuthGuard>
      <div className="space-y-6">
        <PageHeader
          title="Reception Dashboard"
          description="Front desk operations — register patients or use QR self check-in"
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <QrCode className="h-4 w-4" />
                Patient Self Check-in QR
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <CheckinQrCode size={160} />
              <p className="text-center text-xs text-muted-foreground">
                Patients scan this code to fill their details and submit. They appear in the
                patient list and waiting queue automatically.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/checkin" target="_blank">
                  Open Check-in Page
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Button asChild className="h-auto py-4">
                <Link href="/patients/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Register Patient (Manual)
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4">
                <Link href="/patients">View All Patients</Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4">
                <Link href="/appointments">Appointments & Queue</Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4">
                <Link href="/billing">Billing</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Waiting</p>
                <p className="text-lg font-semibold">{dash?.waitingQueue?.length ?? 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <IndianRupee className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Today Revenue</p>
                <p className="text-lg font-semibold">
                  ₹{(dash?.stats?.revenue?.today ?? 0).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Button className="w-full" onClick={() => callNext.mutate()} disabled={callNext.isPending}>
                <PhoneForwarded className="mr-2 h-4 w-4" />
                Call Next
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Recent Patients</p>
                <p className="text-lg font-semibold">{recentPatients.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Patients</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentPatients.length === 0 ? (
                <p className="text-sm text-muted-foreground">No patients yet</p>
              ) : (
                recentPatients.map((p: PatientSummary) => (
                  <Link
                    key={p.id}
                    href={`/patients/${p.id}`}
                    className="flex justify-between rounded border p-2 text-sm hover:bg-muted/50"
                  >
                    <span>{p.fullName}</span>
                    <span className="font-mono text-xs text-muted-foreground">{p.patientId}</span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Waiting Queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(dash?.waitingQueue ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Queue is empty</p>
              ) : (
                (dash?.waitingQueue ?? []).map((t) => (
                  <div key={t.id} className="flex justify-between rounded border p-2 text-sm">
                    <span>#{t.tokenNumber} {t.patientName}</span>
                    <Badge variant="outline">{t.status}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
