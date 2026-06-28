import { DEFAULT_ROLE_PERMISSIONS, PERMISSION_CATALOG } from '@/constants/permissions';
import { expandPermissionWildcards } from '@/constants/permissions';
import { connectToDatabase } from '@/lib/db';
import { logger } from '@/lib/logger';
import { RoleModel } from '@/models/role.model';
import { UserModel } from '@/models/user.model';
import { hashPassword } from '@/services/auth/password.service';
import { UserRole, UserStatus } from '@/types/enums';

let seedPromise: Promise<void> | null = null;

const SYSTEM_ROLES: Array<{
  name: UserRole;
  displayName: string;
  description: string;
}> = [
  {
    name: UserRole.SuperAdmin,
    displayName: 'Super Administrator',
    description: 'Full system access across all clinics',
  },
  {
    name: UserRole.Admin,
    displayName: 'Administrator',
    description: 'Clinic administrator with full operational access',
  },
  {
    name: UserRole.Doctor,
    displayName: 'Doctor',
    description: 'Clinical staff with consultation access',
  },
  {
    name: UserRole.Receptionist,
    displayName: 'Receptionist',
    description: 'Front desk and billing operations',
  },
  {
    name: UserRole.Support,
    displayName: 'Support',
    description: 'Read-only support access for troubleshooting',
  },
  {
    name: UserRole.Patient,
    displayName: 'Patient',
    description: 'Patient portal access',
  },
];

export async function ensureAuthSeed(): Promise<void> {
  if (seedPromise) {
    await seedPromise;
    return;
  }

  seedPromise = runSeed();
  await seedPromise;
}

async function runSeed(): Promise<void> {
  await connectToDatabase();

  for (const roleDef of SYSTEM_ROLES) {
    const permissions = DEFAULT_ROLE_PERMISSIONS[roleDef.name] ?? [];
    const expandedPermissions = expandPermissionWildcards(permissions);

    await RoleModel.findOneAndUpdate(
      { name: roleDef.name },
      {
        $set: {
          displayName: roleDef.displayName,
          description: roleDef.description,
          permissions: expandedPermissions,
          isSystem: true,
          isDeleted: false,
        },
        $setOnInsert: { name: roleDef.name },
      },
      { upsert: true, new: true },
    ).exec();
  }

  const adminRole = await RoleModel.findOne({ name: UserRole.Admin }).exec();
  const adminExists = await UserModel.exists({ email: 'admin@clinic.com' });

  if (!adminExists && adminRole) {
    const adminPermissions = expandPermissionWildcards(
      DEFAULT_ROLE_PERMISSIONS[UserRole.Admin] ?? [],
    );
    const passwordHash = await hashPassword('Admin@123456');

    await UserModel.create({
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@clinic.com',
      passwordHash,
      role: UserRole.Admin,
      roleId: adminRole._id,
      status: UserStatus.Active,
      permissions: adminPermissions,
      tokenVersion: 0,
    });

    logger.info('Default admin user seeded', { email: 'admin@clinic.com' });
  }

  const { ensureDemoSeed } = await import('@/lib/db/seed-demo');
  await ensureDemoSeed();

  void PERMISSION_CATALOG;
}

export function resetAuthSeedCache(): void {
  seedPromise = null;
}
