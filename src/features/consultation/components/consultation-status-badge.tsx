'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ConsultationDisplayStatus } from '@/types/enums';

const VARIANTS: Record<
  ConsultationDisplayStatus,
  { label: string; className: string }
> = {
  [ConsultationDisplayStatus.Draft]: {
    label: 'Draft',
    className: 'bg-muted text-muted-foreground',
  },
  [ConsultationDisplayStatus.InProgress]: {
    label: 'In Progress',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  },
  [ConsultationDisplayStatus.Completed]: {
    label: 'Completed',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  },
  [ConsultationDisplayStatus.Cancelled]: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  },
};

interface ConsultationStatusBadgeProps {
  status: ConsultationDisplayStatus;
  className?: string;
}

export function ConsultationStatusBadge({ status, className }: ConsultationStatusBadgeProps) {
  const config = VARIANTS[status] ?? VARIANTS[ConsultationDisplayStatus.Draft];

  return (
    <Badge variant="outline" className={cn('border-0 font-medium', config.className, className)}>
      {config.label}
    </Badge>
  );
}
