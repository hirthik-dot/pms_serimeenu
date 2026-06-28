'use client';

import {
  AlertTriangle,
  Calendar,
  Droplets,
  Phone,
  User,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ConsultationStatusBadge } from '@/features/consultation/components/consultation-status-badge';
import { PatientStatusBadge } from '@/features/patients/components/patient-status-badge';
import type { ConsultationWorkspaceData } from '@/types/consultation';
import type { IMedicalHistory } from '@/types/models';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';

interface PatientSummaryPanelProps {
  workspace: ConsultationWorkspaceData;
  medicalHistory?: IMedicalHistory | null;
  timelinePreview?: Array<{ date: string; summary: string }>;
  previousVisits?: number;
}

export function PatientSummaryPanel({
  workspace,
  medicalHistory,
  timelinePreview = [],
  previousVisits = 0,
}: PatientSummaryPanelProps) {
  const { visit } = workspace;
  const patient = visit.patient;
  const allergies = medicalHistory?.allergies ?? [];
  const conditions = medicalHistory?.conditions?.filter((c) => c.isActive) ?? [];

  return (
    <div className="sticky top-4 space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-14 w-14">
              <AvatarImage src={patient.profileImage} alt={patient.fullName} />
              <AvatarFallback>
                {patient.firstName[0]}
                {patient.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-base">{patient.fullName}</CardTitle>
              <p className="font-mono text-xs text-muted-foreground">{patient.patientId}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                <ConsultationStatusBadge status={visit.consultationStatus} />
                {patient.status && <PatientStatusBadge status={patient.status} />}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <InfoRow icon={User} label="Age" value={patient.age ? `${patient.age} yrs` : '—'} />
            <InfoRow
              icon={Calendar}
              label="DOB"
              value={patient.dateOfBirth ? formatDate(patient.dateOfBirth) : '—'}
            />
            <InfoRow icon={Phone} label="Phone" value={patient.phone} />
            <InfoRow
              icon={Droplets}
              label="Blood"
              value={patient.bloodGroup ?? 'Unknown'}
            />
          </div>

          {patient.outstandingDue !== undefined && patient.outstandingDue > 0 && (
            <div className="rounded-md bg-amber-50 px-3 py-2 text-xs dark:bg-amber-950/30">
              Outstanding: {formatCurrency(patient.outstandingDue)}
            </div>
          )}

          {patient.lastVisit && (
            <p className="text-xs text-muted-foreground">
              Last visit: {formatDate(patient.lastVisit)}
            </p>
          )}

          {visit.tokenNumber && (
            <Badge variant="secondary">Token #{visit.tokenNumber}</Badge>
          )}
        </CardContent>
      </Card>

      {(allergies.length > 0 || conditions.length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Medical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {allergies.length > 0 && (
              <div>
                <p className="font-medium text-destructive">Allergies</p>
                <p className="text-muted-foreground">{allergies.join(', ')}</p>
              </div>
            )}
            {conditions.length > 0 && (
              <div>
                <p className="font-medium">Conditions</p>
                <ul className="list-inside list-disc text-muted-foreground">
                  {conditions.map((c) => (
                    <li key={c.name}>{c.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Timeline Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          {timelinePreview.length === 0 ? (
            <p className="text-muted-foreground">No recent events</p>
          ) : (
            timelinePreview.slice(0, 5).map((entry) => (
              <div key={`${entry.date}-${entry.summary}`}>
                <p className="text-muted-foreground">{formatDate(entry.date)}</p>
                <p className="line-clamp-2">{entry.summary}</p>
                <Separator className="mt-2" />
              </div>
            ))
          )}
          <p className="text-muted-foreground">{previousVisits} previous visit(s)</p>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
