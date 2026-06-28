// =============================================================================
// Domain Model Validators (Zod)
// =============================================================================

import { z } from 'zod';

import {
  AppointmentStatus,
  AppointmentType,
  BillStatus,
  BloodGroup,
  FileCategory,
  Gender,
  MaritalStatus,
  MedicationDuration,
  MedicationFrequency,
  MedicineRoute,
  NotificationPriority,
  NotificationType,
  PaymentMethod,
  PrescriptionStatus,
  QueuePriority,
  ReportType,
  ToothNumberingSystem,
  ToothStatus,
  TreatmentCategory,
  TreatmentPlanStatus,
  UserStatus,
  VisitStatus,
  XrayType,
} from '@/types/enums';
import {
  addressSchema,
  dateSchema,
  emailSchema,
  objectIdSchema,
  paginationSchema,
  phoneSchema,
  requiredStringSchema,
  timeSchema,
} from '@/validators/common.validator';

const enumSchema = <T extends Record<string, string>>(enumObj: T) =>
  z.nativeEnum(enumObj);

export const emergencyContactSchema = z.object({
  name: requiredStringSchema.max(100),
  relationship: requiredStringSchema.max(50),
  phone: phoneSchema,
});

export const medicalConditionSchema = z.object({
  name: requiredStringSchema,
  diagnosedDate: z.coerce.date().optional(),
  isActive: z.boolean().default(true),
  notes: z.string().trim().optional(),
});

export const medicalHabitsSchema = z.object({
  smoking: z.boolean().default(false),
  alcohol: z.boolean().default(false),
  tobacco: z.boolean().default(false),
});

export const createPatientSchema = z.object({
  firstName: requiredStringSchema.max(100),
  lastName: requiredStringSchema.max(100),
  dateOfBirth: z.coerce.date().max(new Date(), 'Date of birth cannot be in the future'),
  gender: enumSchema(Gender),
  phone: phoneSchema,
  email: emailSchema.optional(),
  address: addressSchema,
  bloodGroup: enumSchema(BloodGroup).optional(),
  maritalStatus: enumSchema(MaritalStatus).optional(),
  occupation: z.string().trim().max(100).optional(),
  emergencyContact: emergencyContactSchema.optional(),
  allergies: z.array(z.string().trim()).max(50).default([]),
  notes: z.string().trim().max(2000).optional(),
});

export const updatePatientSchema = createPatientSchema.partial();

export const medicalHistorySchema = z.object({
  conditions: z.array(medicalConditionSchema).default([]),
  pastSurgeries: z.array(z.string().trim()).default([]),
  currentMedications: z.array(z.string().trim()).default([]),
  allergies: z.array(z.string().trim()).default([]),
  familyHistory: z.string().trim().optional(),
  habits: medicalHabitsSchema.default({ smoking: false, alcohol: false, tobacco: false }),
  notes: z.string().trim().max(5000).optional(),
});

export const createVisitSchema = z.object({
  patientId: objectIdSchema,
  doctorId: objectIdSchema,
  appointmentId: objectIdSchema.optional(),
  chiefComplaint: requiredStringSchema.max(500),
});

export const createAppointmentSchema = z.object({
  patientId: objectIdSchema,
  doctorId: objectIdSchema,
  date: z.coerce.date(),
  startTime: timeSchema,
  endTime: timeSchema,
  type: enumSchema(AppointmentType),
  chiefComplaint: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(2000).optional(),
}).refine((data) => data.endTime > data.startTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

export const createBillSchema = z.object({
  visitId: objectIdSchema,
  lineItems: z.array(z.object({
    treatmentId: objectIdSchema.optional(),
    description: requiredStringSchema,
    quantity: z.number().int().min(1).default(1),
    unitPrice: z.number().min(0),
    discount: z.number().min(0).default(0),
  })).min(1),
  discountPercentage: z.number().min(0).max(100).default(0),
  notes: z.string().trim().max(2000).optional(),
  dueDate: z.coerce.date().optional(),
});

export const createPaymentSchema = z.object({
  billId: objectIdSchema,
  amount: z.number().positive(),
  method: enumSchema(PaymentMethod),
  referenceNumber: z.string().trim().optional(),
  notes: z.string().trim().max(500).optional(),
});

export const prescriptionMedicationSchema = z.object({
  medicineId: objectIdSchema.optional(),
  name: requiredStringSchema,
  dosage: requiredStringSchema,
  frequency: enumSchema(MedicationFrequency),
  duration: z.number().int().min(1),
  durationUnit: enumSchema(MedicationDuration),
  route: enumSchema(MedicineRoute).default(MedicineRoute.Oral),
  instructions: z.string().trim().optional(),
});

export const createPrescriptionSchema = z.object({
  medications: z.array(prescriptionMedicationSchema).min(1).max(20),
  generalInstructions: z.string().trim().max(2000).optional(),
  followUpDate: z.coerce.date().optional(),
});

export const createTreatmentSchema = z.object({
  procedureName: requiredStringSchema.max(200),
  procedureCode: z.string().trim().optional(),
  category: enumSchema(TreatmentCategory),
  defaultCost: z.number().min(0),
  duration: z.number().int().min(1).default(30),
  description: z.string().trim().max(2000).optional(),
  isActive: z.boolean().default(true),
});

export const createMedicineSchema = z.object({
  name: requiredStringSchema.max(200),
  genericName: z.string().trim().max(200).optional(),
  defaultDosage: z.string().trim().optional(),
  defaultFrequency: enumSchema(MedicationFrequency).optional(),
  defaultRoute: enumSchema(MedicineRoute).optional(),
  manufacturer: z.string().trim().optional(),
  isActive: z.boolean().default(true),
});

export const createQueueTokenSchema = z.object({
  patientId: objectIdSchema,
  doctorId: objectIdSchema,
  priority: enumSchema(QueuePriority).default(QueuePriority.Normal),
});

export const createXRaySchema = z.object({
  type: enumSchema(XrayType),
  imageUrl: z.string().url(),
  cloudinaryPublicId: requiredStringSchema,
  fileName: z.string().trim().optional(),
  toothNumbers: z.array(z.number().int()).default([]),
  findings: z.string().trim().max(2000).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const createFileSchema = z.object({
  patientId: objectIdSchema,
  visitId: objectIdSchema.optional(),
  fileName: requiredStringSchema,
  originalName: requiredStringSchema,
  mimeType: requiredStringSchema,
  size: z.number().min(0),
  url: z.string().url(),
  cloudinaryPublicId: z.string().trim().optional(),
  category: enumSchema(FileCategory).default(FileCategory.Other),
});

export const clinicSettingsSchema = z.object({
  clinicName: requiredStringSchema,
  phone: requiredStringSchema,
  email: emailSchema,
  address: addressSchema,
  workingHours: z.object({ start: timeSchema, end: timeSchema }),
  workingDays: z.array(z.number().int().min(0).max(6)),
  appointmentDuration: z.number().int().min(5).default(30),
  currency: z.string().default('INR'),
  currencySymbol: z.string().default('₹'),
  patientIdPrefix: z.string().trim().max(10).optional(),
  gstEnabled: z.boolean().default(false),
  gstNumber: z.string().trim().optional(),
  gstRate: z.number().min(0).default(18),
});

export const createNotificationSchema = z.object({
  userId: objectIdSchema,
  type: enumSchema(NotificationType),
  priority: enumSchema(NotificationPriority).default(NotificationPriority.Medium),
  title: requiredStringSchema.max(200),
  message: requiredStringSchema.max(2000),
  resource: z.string().trim().optional(),
  resourceId: z.string().trim().optional(),
});

export const createReportSchema = z.object({
  type: enumSchema(ReportType),
  parameters: z.record(z.unknown()).default({}),
  dateFrom: dateSchema,
  dateTo: dateSchema,
});

export const toothEntrySchema = z.object({
  toothNumber: z.number().int(),
  status: enumSchema(ToothStatus),
  surfaces: z.record(enumSchema(ToothStatus)).optional(),
  notes: z.string().trim().optional(),
});

export const treatmentPlanItemSchema = z.object({
  treatmentId: objectIdSchema.optional(),
  procedureName: requiredStringSchema,
  procedureCode: z.string().trim().optional(),
  toothNumbers: z.array(z.number().int()).default([]),
  estimatedCost: z.number().min(0),
  notes: z.string().trim().optional(),
});

export const createTreatmentPlanSchema = z.object({
  name: requiredStringSchema.max(200),
  description: z.string().trim().max(2000).optional(),
  treatments: z.array(treatmentPlanItemSchema).min(1),
  validUntil: z.coerce.date().optional(),
  status: enumSchema(TreatmentPlanStatus).default(TreatmentPlanStatus.Proposed),
});

export const listFilterSchema = paginationSchema.extend({
  status: z.string().optional(),
  doctorId: objectIdSchema.optional(),
  patientId: objectIdSchema.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type CreateVisitInput = z.infer<typeof createVisitSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type CreateBillInput = z.infer<typeof createBillSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

export {
  AppointmentStatus,
  BillStatus,
  PrescriptionStatus,
  ToothNumberingSystem,
  UserStatus,
  VisitStatus,
};
