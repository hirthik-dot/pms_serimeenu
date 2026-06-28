'use client';

import {
  Calendar,
  CreditCard,
  FileText,
  Pill,
  Receipt,
  Stethoscope,
} from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import type { TimelineEntry } from '@/types/patient';
import { formatDateTime } from '@/utils/date';

const TYPE_ICONS = {
  visit: Stethoscope,
  appointment: Calendar,
  bill: Receipt,
  prescription: Pill,
  payment: CreditCard,
  file: FileText,
};

interface PatientTimelineProps {
  entries: TimelineEntry[];
  isLoading?: boolean;
}

export function PatientTimeline({ entries, isLoading }: PatientTimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No timeline events recorded yet.
      </p>
    );
  }

  return (
    <div className="relative space-y-0">
      <div className="absolute left-4 top-2 bottom-2 w-px bg-border" aria-hidden />
      {entries.map((entry) => {
        const Icon = TYPE_ICONS[entry.type] ?? FileText;
        return (
          <div key={`${entry.type}-${entry.id}`} className="relative flex gap-4 pb-6 pl-10">
            <div className="absolute left-2.5 flex h-3 w-3 rounded-full border-2 border-primary bg-background" />
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {entry.type}
                </span>
                {entry.status ? (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{entry.status}</span>
                ) : null}
              </div>
              <p className="text-sm font-medium">{entry.summary}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(entry.date)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
