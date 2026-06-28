'use client';

import { useState, type ReactNode } from 'react';

import { CommandPaletteSkeleton } from '@/components/shared/command-palette';
import { cn } from '@/lib/utils';

import { AppBreadcrumb } from './app-breadcrumb';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { SidebarProvider, useSidebarContext } from './sidebar-context';

function DashboardShell({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebarContext();
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn(
          'flex min-h-screen flex-col transition-[padding] duration-200 ease-in-out',
          collapsed ? 'lg:pl-[4.5rem]' : 'lg:pl-[16rem]',
        )}
      >
        <Header onOpenCommandPalette={() => setCommandOpen(true)} />
        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6">
            <AppBreadcrumb />
          </div>
          {children}
        </main>
      </div>
      <CommandPaletteSkeleton open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardShell>{children}</DashboardShell>
    </SidebarProvider>
  );
}
