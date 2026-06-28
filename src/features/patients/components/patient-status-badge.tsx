'use client';

import { cn } from '@/lib/utils';
import { PatientStatus } from '@/types/enums';

const STATUS_CONFIG: Record<
  PatientStatus,
  { label: string; className: string }
> = {
  [PatientStatus.Active]: { label: 'Active', className: 'bg-success/10 text-success' },
  [PatientStatus.Waiting]: { label: 'Waiting', className: 'bg-warning/10 text-warning' },
  [PatientStatus.InConsultation]: { label: 'In Consultation', className: 'bg-info/10 text-info' },
  [PatientStatus.BillingPending]: { label: 'Billing Pending', className: 'bg-warning/10 text-warning' },
  [PatientStatus.Completed]: { label: 'Completed', className: 'bg-muted text-muted-foreground' },
  [PatientStatus.Inactive]: { label: 'Inactive', className: 'bg-muted text-muted-foreground' },
  [PatientStatus.Archived]: { label: 'Archived', className: 'bg-destructive/10 text-destructive' },
};

interface PatientStatusBadgeProps {
  status: PatientStatus | string;
  className?: string;
}

export function PatientStatusBadge({ status, className }: PatientStatusBadgeProps) {
  const config = STATUS_CONFIG[status as PatientStatus] ?? {
    label: status,
    className: 'bg-muted text-muted-foreground',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
