const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://720824103065_db_user:bo0MinWGltEkdFeZ@meenu.8hts0pn.mongodb.net/dental_pms_dev';

const DEFAULT_ROLES = {
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
};

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');
  
  const rolesCollection = mongoose.connection.collection('roles');
  
  await rolesCollection.updateOne({ name: 'doctor' }, { $set: { permissions: DEFAULT_ROLES.doctor } });
  await rolesCollection.updateOne({ name: 'receptionist' }, { $set: { permissions: DEFAULT_ROLES.receptionist } });
  
  console.log('Roles updated successfully!');
  process.exit(0);
}

run().catch(console.error);
