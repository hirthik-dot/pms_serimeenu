'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface ModalEntry {
  id: string;
  content: ReactNode;
}

interface ModalContextValue {
  openModal: (id: string, content: ReactNode) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  modals: ModalEntry[];
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modals, setModals] = useState<ModalEntry[]>([]);

  const openModal = useCallback((id: string, content: ReactNode) => {
    setModals((current) => {
      const filtered = current.filter((modal) => modal.id !== id);
      return [...filtered, { id, content }];
    });
  }, []);

  const closeModal = useCallback((id: string) => {
    setModals((current) => current.filter((modal) => modal.id !== id));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals([]);
  }, []);

  const value = useMemo(
    () => ({ openModal, closeModal, closeAllModals, modals }),
    [openModal, closeModal, closeAllModals, modals],
  );

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function useModal(): ModalContextValue {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
}
