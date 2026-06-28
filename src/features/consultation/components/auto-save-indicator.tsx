'use client';

import { Check, Cloud, CloudOff, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { AutoSaveState } from '@/types/consultation';

const LABELS: Record<AutoSaveState, string> = {
  idle: 'Ready',
  saving: 'Saving...',
  saved: 'Saved',
  unsaved: 'Unsaved changes',
  error: 'Save failed',
};

interface AutoSaveIndicatorProps {
  state: AutoSaveState;
  className?: string;
}

export function AutoSaveIndicator({ state, className }: AutoSaveIndicatorProps) {
  const Icon =
    state === 'saving'
      ? Loader2
      : state === 'saved'
        ? Check
        : state === 'error'
          ? CloudOff
          : Cloud;

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs',
        state === 'saved' && 'text-emerald-600 dark:text-emerald-400',
        state === 'unsaved' && 'text-amber-600 dark:text-amber-400',
        state === 'error' && 'text-destructive',
        state === 'saving' && 'text-muted-foreground',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Icon className={cn('h-3.5 w-3.5', state === 'saving' && 'animate-spin')} />
      <span>{LABELS[state]}</span>
    </div>
  );
}
