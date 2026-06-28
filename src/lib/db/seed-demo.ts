import { expandPermissionWildcards, DEFAULT_ROLE_PERMISSIONS } from '@/constants/permissions';
import { connectToDatabase } from '@/lib/db';
import { logger } from '@/lib/logger';
import { ClinicSettingsModel } from '@/models/clinic-settings.model';
import { MedicineModel } from '@/models/medicine.model';
import { RoleModel } from '@/models/role.model';
import { TreatmentModel } from '@/models/treatment.model';
import { UserModel } from '@/models/user.model';
import { hashPassword } from '@/services/auth/password.service';
import { TreatmentCategory, UserRole, UserStatus } from '@/types/enums';

const DEMO_USERS = [
  {
    email: 'doctor@clinic.com',
    password: 'Doctor@123456',
    firstName: 'Rajesh',
    lastName: 'Kumar',
    role: UserRole.Doctor,
  },
  {
    email: 'reception@clinic.com',
    password: 'Reception@123456',
    firstName: 'Priya',
    lastName: 'Sharma',
    role: UserRole.Receptionist,
  },
];

const DEMO_TREATMENTS = [
  { procedureName: 'Consultation', procedureCode: 'CONS', category: TreatmentCategory.Diagnostic, defaultCost: 500, duration: 30 },
  { procedureName: 'Composite Filling', procedureCode: 'FILL', category: TreatmentCategory.Restorative, defaultCost: 2500, duration: 45 },
  { procedureName: 'Root Canal Treatment', procedureCode: 'RCT', category: TreatmentCategory.Endodontic, defaultCost: 8000, duration: 90 },
  { procedureName: 'Crown (PFM)', procedureCode: 'CRWN', category: TreatmentCategory.Prosthodontic, defaultCost: 12000, duration: 60 },
  { procedureName: 'Scaling & Polishing', procedureCode: 'SCAL', category: TreatmentCategory.Periodontic, defaultCost: 1500, duration: 45 },
  { procedureName: 'Tooth Extraction', procedureCode: 'EXTR', category: TreatmentCategory.OralSurgery, defaultCost: 2000, duration: 30 },
];

export async function ensureDemoSeed(): Promise<void> {
  await connectToDatabase();

  const clinicExists = await ClinicSettingsModel.exists({ isDeleted: false });
  if (!clinicExists) {
    await ClinicSettingsModel.create({
      clinicName: 'Smile Dental Hospital',
      phone: '+91 9876543210',
      email: 'info@smiledental.com',
      address: {
        street: '123 Health Street, Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050',
        country: 'India',
      },
      workingHours: { start: '09:00', end: '18:00' },
      workingDays: [1, 2, 3, 4, 5, 6],
      gstEnabled: true,
      gstNumber: '27AABCS1429B1Z5',
      gstRate: 18,
      invoiceHeader: 'Smile Dental Hospital — Tax Invoice',
      invoiceFooter: 'Thank you for choosing Smile Dental Hospital',
      departments: ['General Dentistry', 'Orthodontics', 'Oral Surgery', 'Pediatric Dentistry'],
      isDeleted: false,
    });
    logger.info('Demo clinic settings seeded');
  }

  for (const userDef of DEMO_USERS) {
    const exists = await UserModel.exists({ email: userDef.email });
    if (exists) continue;

    const roleDoc = await RoleModel.findOne({ name: userDef.role }).exec();
    if (!roleDoc) continue;

    const permissions = expandPermissionWildcards(
      DEFAULT_ROLE_PERMISSIONS[userDef.role] ?? [],
    );

    await UserModel.create({
      firstName: userDef.firstName,
      lastName: userDef.lastName,
      email: userDef.email,
      passwordHash: await hashPassword(userDef.password),
      role: userDef.role,
      roleId: roleDoc._id,
      status: UserStatus.Active,
      permissions,
      tokenVersion: 0,
    });
    logger.info('Demo user seeded', { email: userDef.email });
  }

  const treatmentCount = await TreatmentModel.countDocuments({ isDeleted: false });
  if (treatmentCount === 0) {
    await TreatmentModel.insertMany(
      DEMO_TREATMENTS.map((t) => ({ ...t, isActive: true, isDeleted: false })),
    );
    logger.info('Demo treatments seeded');
  }

  const medicineCount = await MedicineModel.countDocuments({ isDeleted: false });
  if (medicineCount === 0) {
    await MedicineModel.insertMany([
      { name: 'Amoxicillin 500mg', genericName: 'Amoxicillin', defaultDosage: '500mg', isActive: true, isDeleted: false },
      { name: 'Ibuprofen 400mg', genericName: 'Ibuprofen', defaultDosage: '400mg', isActive: true, isDeleted: false },
      { name: 'Paracetamol 650mg', genericName: 'Paracetamol', defaultDosage: '650mg', isActive: true, isDeleted: false },
    ]);
    logger.info('Demo medicines seeded');
  }
}
