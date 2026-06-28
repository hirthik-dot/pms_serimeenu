require('tsconfig-paths/register');
const { connectToDatabase } = require('./src/lib/db/connection');
const { RoleModel } = require('./src/models/role.model');
const { DEFAULT_ROLES } = require('./src/constants/permissions');

async function run() {
  await connectToDatabase();
  await RoleModel.updateOne({ name: 'doctor' }, { $set: { permissions: DEFAULT_ROLES.doctor } });
  await RoleModel.updateOne({ name: 'receptionist' }, { $set: { permissions: DEFAULT_ROLES.receptionist } });
  console.log('Roles updated');
  process.exit(0);
}

run().catch(console.error);
