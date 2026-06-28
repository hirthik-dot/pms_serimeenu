'use client';

import { Toaster } from '@/components/ui/sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'border-border bg-card text-card-foreground',
        },
      }}
    />
  );
}
