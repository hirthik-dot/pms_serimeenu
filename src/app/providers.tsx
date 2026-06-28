'use client';

import {
  AuthProvider,
  ModalProvider,
  QueryProvider,
  ThemeProvider,
  ToastProvider,
} from '@/providers';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryProvider>
        <AuthProvider>
          <ModalProvider>
            {children}
            <ToastProvider />
          </ModalProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
