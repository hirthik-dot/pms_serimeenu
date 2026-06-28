'use client';

import { useEffect } from 'react';

interface UseConsultationKeyboardOptions {
  onSave: () => void;
  onPrintPrescription: () => void;
  onSearchPatient: () => void;
  onComplete: () => void;
  enabled?: boolean;
}

export function useConsultationKeyboard({
  onSave,
  onPrintPrescription,
  onSearchPatient,
  onComplete,
  enabled = true,
}: UseConsultationKeyboardOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (event: KeyboardEvent) => {
      const isMod = event.ctrlKey || event.metaKey;

      if (isMod && event.key.toLowerCase() === 's') {
        event.preventDefault();
        onSave();
        return;
      }

      if (isMod && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        onPrintPrescription();
        return;
      }

      if (isMod && event.key === '/') {
        event.preventDefault();
        onSearchPatient();
        return;
      }

      if (isMod && event.key === 'Enter') {
        event.preventDefault();
        onComplete();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, onSave, onPrintPrescription, onSearchPatient, onComplete]);
}
