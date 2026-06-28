'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  Stethoscope,
  Users,
  Download,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { PageHeader } from '@/components/shared/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { consultationApi } from '@/features/consultation/api/consultation-api';
import { ConsultationStatusBadge } from '@/features/consultation/components/consultation-status-badge';
import { patientApi } from '@/features/patients/api/patient-api';
import { useAuth } from '@/providers/auth-provider';
import type { VisitSummary } from '@/types/consultation';
import { formatDate } from '@/utils/date';
import { exportToExcel } from '@/utils/excel';

export function DoctorDashboard() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const { data: dashboardResponse, isLoading } = useQuery({
    queryKey: ['doctor-dashboard', user?.id],
    queryFn: () => consultationApi.getDashboard(),
    refetchInterval: 15000,
  });

  const { data: searchResponse } = useQuery({
    queryKey: ['patient-search', search],
    queryFn: () => patientApi.search(search, 8),
    enabled: search.length >= 2,
  });

  const dashboard = dashboardResponse?.data;

  const filterVisits = (visits: VisitSummary[]) => {
    if (!search.trim()) return visits;
    const q = search.toLowerCase();
    return visits.filter(
      (v) =>
        v.patient.fullName.toLowerCase().includes(q) ||
        v.patient.patientId.toLowerCase().includes(q) ||
        v.patient.phone.includes(q),
    );
  };

  const stats = dashboard?.stats;

  const statCards = useMemo(
    () => [
      { label: "Today's Patients", value: stats?.todayTotal ?? 0, icon: Users },
      { label: 'Waiting', value: stats?.waiting ?? 0, icon: Clock },
      { label: 'In Consultation', value: stats?.inConsultation ?? 0, icon: Stethoscope },
      { label: 'Completed', value: stats?.completed ?? 0, icon: CheckCircle2 },
    ],
    [stats],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleExport = () => {
    if (!dashboard) return;
    
    // Combine all active/completed visits from the dashboard for the export
    const allVisits = [
      ...(dashboard.waitingPatients ?? []),
      ...(dashboard.inConsultation ?? []),
      ...(dashboard.completedToday ?? [])
    ];
    
    const exportData = allVisits.map(visit => ({
      'Token Number': visit.tokenNumber || 'N/A',
      'Patient ID': visit.patient.patientId,
      'Patient Name': visit.patient.fullName,
      'Phone': visit.patient.phone,
      'Chief Complaint': visit.chiefComplaint || 'N/A',
      'Status': visit.consultationStatus,
    }));
    
    exportToExcel(exportData, 'Dashboard Patients', `Doctor_Dashboard_Export_${formatDate(new Date().toISOString())}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader
          title="Doctor Dashboard"
          description={`Good day, Dr. ${user?.lastName ?? ''}. Your clinical workspace for today.`}
        />
        <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export to Excel
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Quick search patients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          aria-label="Quick search patients"
        />
        {search.length >= 2 && searchResponse?.data && searchResponse.data.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
            {searchResponse.data.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/patients/${p.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                >
                  <span className="font-medium">
                    {p.firstName} {p.lastName}
                  </span>
                  <span className="text-muted-foreground">{p.patientId}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <VisitQueueCard
          title="Waiting Patients"
          visits={filterVisits(dashboard?.waitingPatients ?? [])}
          emptyMessage="No patients waiting"
        />
        <VisitQueueCard
          title="In Consultation"
          visits={filterVisits(dashboard?.inConsultation ?? [])}
          emptyMessage="No active consultations"
        />
        <VisitQueueCard
          title="Completed Today"
          visits={filterVisits(dashboard?.completedToday ?? [])}
          emptyMessage="No completed visits yet"
        />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(dashboard?.upcomingAppointments ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming appointments</p>
            ) : (
              dashboard!.upcomingAppointments.map((appt) => (
                <div key={appt.id} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">{appt.patientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(appt.date)} · {appt.startTime} – {appt.endTime}
                  </p>
                  {appt.chiefComplaint && (
                    <p className="mt-1 text-xs">{appt.chiefComplaint}</p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {(dashboard?.recentPatients ?? []).map((p) => (
              <Link
                key={p.id}
                href={`/patients/${p.id}`}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-muted/50"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={p.profileImage} />
                  <AvatarFallback>
                    {p.firstName[0]}
                    {p.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium">{p.fullName}</p>
                  <p className="text-xs text-muted-foreground">{p.patientId}</p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function VisitQueueCard({
  title,
  visits,
  emptyMessage,
}: {
  title: string;
  visits: VisitSummary[];
  emptyMessage: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {visits.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          visits.map((visit) => (
            <Link
              key={visit.id}
              href={`/consultation/${visit.id}`}
              className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={visit.patient.profileImage} />
                  <AvatarFallback>
                    {visit.patient.firstName[0]}
                    {visit.patient.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{visit.patient.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {visit.patient.patientId}
                    {visit.tokenNumber ? ` · Token #${visit.tokenNumber}` : ''}
                  </p>
                  <p className="line-clamp-1 text-xs">{visit.chiefComplaint}</p>
                </div>
              </div>
              <ConsultationStatusBadge status={visit.consultationStatus} />
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function DoctorDashboardPage() {
  return (
    <AuthGuard>
      <DoctorDashboard />
    </AuthGuard>
  );
}
