// =============================================================================
// Permission Catalog
// =============================================================================
// Canonical list of all permissions in {resource}:{action} format.
// Role permissions reference codes from this catalog — never hardcode checks.
// =============================================================================

export interface PermissionDefinition {
  code: string;
  resource: string;
  action: string;
  description: string;
  module: string;
}

const define = (
  resource: string,
  action: string,
  description: string,
  module: string,
): PermissionDefinition => ({
  code: `${resource}:${action}`,
  resource,
  action,
  description,
  module,
});

export const PERMISSION_CATALOG: PermissionDefinition[] = [
  // Patients
  define('patients', 'read', 'View patient records', 'Clinical'),
  define('patients', 'create', 'Register new patients', 'Clinical'),
  define('patients', 'update', 'Update patient records', 'Clinical'),
  define('patients', 'delete', 'Delete patient records', 'Clinical'),
  // Appointments
  define('appointments', 'read', 'View appointments', 'Clinical'),
  define('appointments', 'create', 'Create appointments', 'Clinical'),
  define('appointments', 'update', 'Update appointments', 'Clinical'),
  define('appointments', 'delete', 'Cancel/delete appointments', 'Clinical'),
  // Visits
  define('visits', 'read', 'View visits', 'Clinical'),
  define('visits', 'create', 'Create visits', 'Clinical'),
  define('visits', 'update', 'Update visits', 'Clinical'),
  define('visits', 'delete', 'Delete visits', 'Clinical'),
  // Consultation
  define('consultation', 'read', 'View consultation notes', 'Clinical'),
  define('consultation', 'create', 'Create consultation records', 'Clinical'),
  define('consultation', 'update', 'Update consultation records', 'Clinical'),
  define('consultation', 'delete', 'Delete consultation records', 'Clinical'),
  // Prescriptions
  define('prescriptions', 'read', 'View prescriptions', 'Clinical'),
  define('prescriptions', 'create', 'Create prescriptions', 'Clinical'),
  define('prescriptions', 'update', 'Update prescriptions', 'Clinical'),
  define('prescriptions', 'delete', 'Delete prescriptions', 'Clinical'),
  // Tooth chart
  define('tooth-chart', 'read', 'View tooth charts', 'Clinical'),
  define('tooth-chart', 'create', 'Create tooth chart entries', 'Clinical'),
  define('tooth-chart', 'update', 'Update tooth charts', 'Clinical'),
  define('tooth-chart', 'delete', 'Delete tooth chart entries', 'Clinical'),
  // X-rays
  define('xrays', 'read', 'View X-rays', 'Clinical'),
  define('xrays', 'create', 'Upload X-rays', 'Clinical'),
  define('xrays', 'update', 'Update X-ray records', 'Clinical'),
  define('xrays', 'delete', 'Delete X-rays', 'Clinical'),
  // Billing
  define('billing', 'read', 'View bills and invoices', 'Finance'),
  define('billing', 'create', 'Create bills', 'Finance'),
  define('billing', 'update', 'Update bills', 'Finance'),
  define('billing', 'delete', 'Delete bills', 'Finance'),
  // Payments
  define('payments', 'read', 'View payments', 'Finance'),
  define('payments', 'create', 'Record payments', 'Finance'),
  define('payments', 'update', 'Update payments', 'Finance'),
  define('payments', 'delete', 'Delete/refund payments', 'Finance'),
  // Queue
  define('queue', 'read', 'View queue tokens', 'Operations'),
  define('queue', 'create', 'Issue queue tokens', 'Operations'),
  define('queue', 'update', 'Update queue status', 'Operations'),
  define('queue', 'delete', 'Remove queue entries', 'Operations'),
  // Reports
  define('reports', 'read', 'View reports and analytics', 'Administration'),
  define('reports', 'view', 'View reports dashboard', 'Administration'),
  // Export
  define('export', 'read', 'Export data', 'Administration'),
  define('export', 'create', 'Generate exports', 'Administration'),
  // Settings
  define('settings', 'manage', 'Manage clinic settings', 'Administration'),
  define('settings', 'update', 'Update clinic settings', 'Administration'),
  // Users
  define('users', 'manage', 'Manage staff users and roles', 'Administration'),
  // Audit
  define('audit', 'read', 'View audit logs', 'Administration'),
  // Files
  define('files', 'read', 'View uploaded files', 'General'),
  define('files', 'create', 'Upload files', 'General'),
  define('files', 'update', 'Update file metadata', 'General'),
  define('files', 'delete', 'Delete files', 'General'),
];

export const PERMISSION_CODES = PERMISSION_CATALOG.map((p) => p.code);

export const PERMISSION_CODE_SET = new Set(PERMISSION_CODES);

/** Expand wildcard permissions like `patients:*` into concrete codes. */
export function expandPermissionWildcards(permissions: string[]): string[] {
  const expanded = new Set<string>();

  for (const perm of permissions) {
    if (perm.endsWith(':*')) {
      const resource = perm.slice(0, -2);
      for (const code of PERMISSION_CODES) {
        if (code.startsWith(`${resource}:`)) {
          expanded.add(code);
        }
      }
    } else {
      expanded.add(perm);
    }
  }

  return [...expanded];
}

/** Default permissions assigned to each system role at seed time. */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ['*:*'],
  admin: [
    'patients:*',
    'appointments:*',
    'visits:*',
    'consultation:*',
    'prescriptions:*',
    'tooth-chart:*',
    'xrays:*',
    'billing:*',
    'payments:*',
    'queue:*',
    'reports:*',
    'export:*',
    'settings:*',
    'users:manage',
    'audit:read',
    'files:*',
  ],
  doctor: [
    'patients:*',
    'appointments:*',
    'visits:*',
    'consultation:*',
    'prescriptions:*',
    'tooth-chart:*',
    'xrays:*',
    'billing:*',
    'payments:*',
    'queue:*',
    'reports:read',
    'files:*',
  ],
  receptionist: [
    'patients:*',
    'appointments:*',
    'visits:read',
    'visits:create',
    'prescriptions:read',
    'xrays:read',
    'billing:*',
    'payments:*',
    'queue:*',
    'files:*',
  ],
  support: ['patients:read', 'appointments:read', 'visits:read', 'billing:read'],
  patient: ['appointments:read', 'billing:read', 'files:read'],
};
