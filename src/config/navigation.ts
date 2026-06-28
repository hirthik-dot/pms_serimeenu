// =============================================================================
// Navigation Configuration
// =============================================================================
// Role-based sidebar navigation definitions.
// Each item declares which permissions are required to see it.
// =============================================================================

import {
  CalendarDays,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  type LucideIcon,
  Settings,
  Stethoscope,
  UserCog,
  Users,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  requiredPermissions: string[];
  badge?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navigationConfig: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        requiredPermissions: [],
      },
    ],
  },
  {
    title: 'Clinical',
    items: [
      {
        label: 'Patients',
        href: '/patients',
        icon: Users,
        requiredPermissions: ['patients:read'],
      },
      {
        label: 'Appointments',
        href: '/appointments',
        icon: CalendarDays,
        requiredPermissions: ['appointments:read'],
      },
      {
        label: 'Consultation',
        href: '/consultation',
        icon: Stethoscope,
        requiredPermissions: ['visits:read'],
      },
    ],
  },
  {
    title: 'Finance',
    items: [
      {
        label: 'Billing',
        href: '/billing',
        icon: CreditCard,
        requiredPermissions: ['billing:read'],
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        label: 'Staff',
        href: '/users',
        icon: UserCog,
        requiredPermissions: ['users:manage'],
      },
      {
        label: 'Audit Logs',
        href: '/audit-logs',
        icon: ClipboardList,
        requiredPermissions: ['audit:read'],
      },
      {
        label: 'Reports',
        href: '/reports',
        icon: ClipboardList,
        requiredPermissions: ['reports:read'],
      },
      {
        label: 'Settings',
        href: '/settings',
        icon: Settings,
        requiredPermissions: ['settings:manage'],
      },
    ],
  },
];

import { hasPermission } from '@/services/auth/permission.service';

/**
 * Filter navigation items based on user's permissions.
 */
export function getNavigationForPermissions(permissions: string[]): NavGroup[] {
  return navigationConfig
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.requiredPermissions.every((perm) => hasPermission(permissions, perm)),
      ),
    }))
    .filter((group) => group.items.length > 0);
}
