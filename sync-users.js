const mongoose = require('mongoose');

const ALL_PERMISSIONS = [
  'patients:read',
  'patients:write',
  'patients:delete',
  'visits:read',
  'visits:write',
  'visits:delete',
  'billing:read',
  'billing:write',
  'billing:delete',
  'payments:create',
  'payments:read',
  'payments:update',
  'payments:delete',
  'reports:read',
  'reports:export',
  'users:manage',
  'audit:read',
  'settings:manage',
];

function expandPermissionWildcards(permissions) {
  const expanded = new Set();
  permissions.forEach(permission => {
    if (permission.endsWith(':*')) {
      const resource = permission.split(':')[0];
      ALL_PERMISSIONS.forEach(p => {
        if (p.startsWith(`${resource}:`)) {
          expanded.add(p);
        }
      });
    } else {
      expanded.add(permission);
    }
  });
  return Array.from(expanded);
}

async function sync() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const roleDb = mongoose.connection.collection('roles');
  const userDb = mongoose.connection.collection('users');

  const roles = await roleDb.find({}).toArray();
  const roleMap = {};
  for (const r of roles) {
    roleMap[r._id.toString()] = r.permissions;
    roleMap[r.name] = r.permissions; // Just in case
  }

  const users = await userDb.find({}).toArray();
  let updated = 0;
  for (const u of users) {
    const roleId = u.roleId ? u.roleId.toString() : null;
    if (roleId && roleMap[roleId]) {
      const expanded = expandPermissionWildcards(roleMap[roleId]);
      await userDb.updateOne({ _id: u._id }, { $set: { permissions: expanded } });
      updated++;
    }
  }
  console.log('Updated ' + updated + ' users.');
  process.exit(0);
}
sync().catch(console.error);
