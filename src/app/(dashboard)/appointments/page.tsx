'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { Calendar, PhoneForwarded, Users } from 'lucide-react';
import { toast } from 'sonner';

import { AuthGuard } from '@/components/auth/auth-guard';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetchWithRefresh } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';
import type { AppointmentDto } from '@/services/appointment.service';
import type { QueueTokenDto } from '@/services/queue.service';

export default function AppointmentsPage() {
  const { user } = useAuth();

  const { data: appointmentsRes } = useQuery({
    queryKey: ['appointments', 'today'],
    queryFn: () => apiFetchWithRefresh<AppointmentDto[]>('/appointments/upcoming?days=1'),
  });

  const { data: queueRes, refetch: refetchQueue } = useQuery({
    queryKey: ['queue', 'waiting'],
    queryFn: () => apiFetchWithRefresh<QueueTokenDto[]>('/queue/waiting-list'),
  });

  const callNext = useMutation({
    mutationFn: () =>
      apiFetchWithRefresh('/queue/call', {
        method: 'POST',
        body: JSON.stringify({ doctorId: user?.id }),
      }),
    onSuccess: () => {
      toast.success('Next patient called');
      void refetchQueue();
    },
    onError: () => toast.error('No patients in queue'),
  });

  const appointments = appointmentsRes?.data ?? [];
  const queue = queueRes?.data ?? [];

  return (
    <AuthGuard>
      <div className="space-y-6">
        <PageHeader title="Appointments & Queue" description="Schedule and manage patient flow" />

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Today</p>
                <p className="text-lg font-semibold">{appointments.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Waiting</p>
                <p className="text-lg font-semibold">{queue.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Button
                className="w-full"
                onClick={() => callNext.mutate()}
                disabled={callNext.isPending}
              >
                <PhoneForwarded className="mr-2 h-4 w-4" />
                Call Next Patient
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Today&apos;s Appointments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {appointments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No appointments today</p>
              ) : (
                appointments.map((a) => (
                  <div key={a.id} className="flex justify-between rounded border p-3 text-sm">
                    <div>
                      <p className="font-medium">{a.patientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.startTime} – {a.endTime} · Dr. {a.doctorName}
                      </p>
                    </div>
                    <Badge variant="outline">{a.status}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Waiting Queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {queue.length === 0 ? (
                <p className="text-sm text-muted-foreground">Queue is empty</p>
              ) : (
                queue.map((t) => (
                  <div key={t.id} className="flex justify-between rounded border p-3 text-sm">
                    <div>
                      <p className="font-medium">#{t.tokenNumber} {t.patientName}</p>
                      <p className="text-xs text-muted-foreground">Dr. {t.doctorName}</p>
                    </div>
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
