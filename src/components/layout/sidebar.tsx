'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { getNavigationForPermissions, type NavGroup } from '@/config/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';

import { useSidebarContext } from './sidebar-context';

function NavSection({ group, collapsed }: { group: NavGroup; collapsed: boolean }) {
  const pathname = usePathname();

  return (
    <div className="space-y-1">
      {!collapsed ? (
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {group.title}
        </p>
      ) : null}
      {group.items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              collapsed && 'justify-center px-2',
            )}
            title={collapsed ? item.label : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed ? <span>{item.label}</span> : null}
          </Link>
        );
      })}
    </div>
  );
}

export function Sidebar() {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebarContext();
  const { user } = useAuth();
  const navigation = getNavigationForPermissions(user?.permissions ?? []);

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-card',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              D
            </div>
            {!collapsed ? <span className="truncate">Dental PMS</span> : null}
          </Link>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto p-3">
          {navigation.map((group) => (
            <NavSection key={group.title} group={group} collapsed={collapsed} />
          ))}
        </nav>

        {!collapsed ? (
          <div className="border-t p-3">
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Profile & Settings
            </Link>
          </div>
        ) : null}
      </motion.aside>
    </>
  );
}
