import { UserRole } from '@/types/enums';

/** Public routes that do not require authentication. */
export const PUBLIC_ROUTES = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/checkin',
] as const;

/** API routes that do not require authentication. */
export const PUBLIC_API_ROUTES = [
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/api/v1/health',
  '/api/v1/checkin/lookup',
  '/api/v1/checkin/submit',
] as const;

/** Role-based dashboard landing paths after login. */
export const ROLE_DASHBOARD_PATHS: Record<UserRole, string> = {
  [UserRole.SuperAdmin]: '/dashboard/admin',
  [UserRole.Admin]: '/dashboard/admin',
  [UserRole.Doctor]: '/dashboard/doctor',
  [UserRole.Receptionist]: '/dashboard/reception',
  [UserRole.Support]: '/dashboard/support',
  [UserRole.Patient]: '/dashboard/patient',
};

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  [UserRole.SuperAdmin]: 'Super Administrator',
  [UserRole.Admin]: 'Administrator',
  [UserRole.Doctor]: 'Doctor',
  [UserRole.Receptionist]: 'Receptionist',
  [UserRole.Support]: 'Support',
  [UserRole.Patient]: 'Patient',
};

export function getDashboardPathForRole(role: UserRole): string {
  return ROLE_DASHBOARD_PATHS[role] ?? '/dashboard';
}

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((route) => pathname === route);
}
