'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { AUTO_SAVE_DEBOUNCE_MS, DRAFT_STORAGE_PREFIX } from '@/features/consultation/constants';
import type { AutoSaveState } from '@/types/consultation';

interface UseAutoSaveOptions<T> {
  visitId: string;
  data: T;
  onSave: (data: T) => Promise<void>;
  enabled?: boolean;
  debounceMs?: number;
}

export function useAutoSave<T>({
  visitId,
  data,
  onSave,
  enabled = true,
  debounceMs = AUTO_SAVE_DEBOUNCE_MS,
}: UseAutoSaveOptions<T>) {
  const [state, setState] = useState<AutoSaveState>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef(data);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (!enabled || !visitId) return;

    const storageKey = `${DRAFT_STORAGE_PREFIX}${visitId}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      // ignore quota errors
    }
  }, [data, enabled, visitId]);

  const recoverDraft = useCallback((): T | null => {
    try {
      const raw = localStorage.getItem(`${DRAFT_STORAGE_PREFIX}${visitId}`);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }, [visitId]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(`${DRAFT_STORAGE_PREFIX}${visitId}`);
  }, [visitId]);

  const saveNow = useCallback(async () => {
    if (!enabled) return;
    setState('saving');
    try {
      await onSave(dataRef.current);
      if (isMounted.current) setState('saved');
    } catch {
      if (isMounted.current) setState('error');
    }
  }, [enabled, onSave]);

  const markUnsaved = useCallback(() => {
    setState('unsaved');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void saveNow();
    }, debounceMs);
  }, [debounceMs, saveNow]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    state,
    markUnsaved,
    saveNow,
    recoverDraft,
    clearDraft,
    setState,
  };
}
