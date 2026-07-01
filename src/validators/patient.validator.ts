// =============================================================================
// Patient Validators (Zod)
// =============================================================================

import { z } from 'zod';

import {
  BloodGroup,
  Gender,
  MaritalStatus,
  PatientStatus,
  PatientType,
  ReferralSource,
} from '@/types/enums';
import {
  addressSchema,
  emailSchema,
  objectIdSchema,
  optionalPhoneSchema,
  paginationSchema,
  phoneSchema,
  registrationAddressSchema,
  requiredStringSchema,
} from '@/validators/common.validator';
import { emergencyContactSchema, medicalHistorySchema } from '@/validators/models.validator';

const enumSchema = <T extends Record<string, string>>(enumObj: T) => z.nativeEnum(enumObj);

const dateOfBirthSchema = z.coerce
  .date()
  .max(new Date(), 'Date of birth cannot be in the future')
  .refine((date) => {
    const age = new Date().getFullYear() - date.getFullYear();
    return age >= 0 && age <= 120;
  }, 'Age must be between 0 and 120 years');

export const pediatricInfoSchema = z.object({
  parentName: requiredStringSchema.max(100).optional(),
  guardianName: requiredStringSchema.max(100).optional(),
  schoolName: z.string().trim().max(150).optional(),
  pediatrician: z.string().trim().max(100).optional(),
  height: z.number().min(0).max(300).optional(),
  weight: z.number().min(0).max(500).optional(),
  guardianSignatureUrl: z.string().url().optional(),
});

export const medicalFlagsSchema = z.object({
  diabetes: z.boolean().default(false),
  hypertension: z.boolean().default(false),
  heartDisease: z.boolean().default(false),
  pregnancy: z.boolean().default(false),
  otherConditions: z.string().trim().max(1000).optional(),
});

const basePatientSchema = z.object({
  firstName: requiredStringSchema.max(100),
  lastName: requiredStringSchema.max(100),
  dateOfBirth: dateOfBirthSchema,
  gender: enumSchema(Gender).default(Gender.PreferNotToSay),
  phone: optionalPhoneSchema,
  email: emailSchema.optional(),
  address: addressSchema,
  bloodGroup: enumSchema(BloodGroup).optional(),
  maritalStatus: enumSchema(MaritalStatus).optional(),
  occupation: z.string().trim().max(100).optional(),
  emergencyContact: emergencyContactSchema.optional(),
  allergies: z.array(z.string().trim()).max(50).default([]),
  notes: requiredStringSchema.max(2000),
  patientType: enumSchema(PatientType).default(PatientType.Adult),
  pediatricInfo: pediatricInfoSchema.optional(),
  consentGiven: z.boolean().default(false),
  referredBy: enumSchema(ReferralSource).optional(),
  medicalFlags: medicalFlagsSchema.optional(),
  medicalHistory: medicalHistorySchema.optional(),
});

export const createPatientSchema = basePatientSchema;

/** Client form schema — uses fullName instead of separate first/last name fields */
export const patientFormSchema = z.object({
  fullName: requiredStringSchema.max(200),
  dateOfBirth: dateOfBirthSchema,
  gender: enumSchema(Gender).optional(),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^(\+91)?[6-9]\d{9}$/.test(v), 'Invalid phone number'),
  email: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, 'Invalid email address'),
  address: registrationAddressSchema,
  bloodGroup: enumSchema(BloodGroup).optional(),
  maritalStatus: enumSchema(MaritalStatus).optional(),
  occupation: z.string().trim().max(100).optional(),
  emergencyContact: z
    .object({
      name: z.string().trim().optional(),
      relationship: z.string().trim().optional(),
      phone: z.string().trim().optional(),
    })
    .optional(),
  allergies: z.array(z.string().trim()).max(50).default([]),
  notes: requiredStringSchema.max(2000),
  patientType: enumSchema(PatientType).default(PatientType.Adult),
  pediatricInfo: z
    .object({
      parentName: z.string().trim().max(100).optional(),
      guardianName: z.string().trim().max(100).optional(),
      schoolName: z.string().trim().max(150).optional(),
      pediatrician: z.string().trim().max(100).optional(),
      height: z.union([z.number().min(0).max(300), z.nan()]).optional(),
      weight: z.union([z.number().min(0).max(500), z.nan()]).optional(),
    })
    .optional(),
  consentGiven: z.boolean().default(false),
  referredBy: enumSchema(ReferralSource).optional(),
  medicalFlags: medicalFlagsSchema.optional(),
});

export type PatientFormInput = z.infer<typeof patientFormSchema>;

function normalizeRegistrationAddress(
  address: z.infer<typeof registrationAddressSchema>,
): z.infer<typeof addressSchema> {
  return {
    street: address.street,
    city: address.city?.trim() || '-',
    state: address.state?.trim() || '-',
    pincode: address.pincode?.trim() || '000000',
    country: address.country?.trim() || 'India',
  };
}

function normalizePhone(phone?: string): string | undefined {
  if (!phone?.trim()) return undefined;
  return phone.replace(/^\+91/, '');
}

export function formValuesToCreatePatientInput(values: PatientFormInput): CreatePatientInput {
  const { firstName, lastName } = splitFullName(values.fullName);
  const phone = normalizePhone(values.phone);

  const emergencyContact = (() => {
    const name = values.emergencyContact?.name?.trim();
    if (!name) return undefined;

    const ecPhone = values.emergencyContact?.phone?.replace(/\D/g, '').slice(-10);
    const validEcPhone = ecPhone && /^[6-9]\d{9}$/.test(ecPhone) ? ecPhone : undefined;
    const fallbackPhone = phone && /^[6-9]\d{9}$/.test(phone) ? phone : undefined;

    if (!validEcPhone && !fallbackPhone) return undefined;

    return {
      name,
      relationship: values.emergencyContact?.relationship?.trim() || 'Contact',
      phone: validEcPhone || fallbackPhone!,
    };
  })();

  const pediatricInfo =
    values.patientType === PatientType.Pediatric && values.pediatricInfo
      ? {
          ...values.pediatricInfo,
          height: Number.isNaN(values.pediatricInfo.height) ? undefined : values.pediatricInfo.height,
          weight: Number.isNaN(values.pediatricInfo.weight) ? undefined : values.pediatricInfo.weight,
        }
      : undefined;

  return {
    firstName,
    lastName,
    dateOfBirth: values.dateOfBirth,
    gender: values.gender ?? Gender.PreferNotToSay,
    phone,
    email: values.email || undefined,
    address: normalizeRegistrationAddress(values.address),
    bloodGroup: values.bloodGroup,
    maritalStatus: values.maritalStatus,
    occupation: values.occupation || undefined,
    emergencyContact,
    allergies: values.allergies ?? [],
    notes: values.notes,
    patientType: values.patientType,
    pediatricInfo,
    consentGiven: values.consentGiven ?? false,
    referredBy: values.referredBy,
    medicalFlags: values.medicalFlags,
  };
}

export const updatePatientSchema = basePatientSchema
  .partial()
  .extend({
    status: enumSchema(PatientStatus).optional(),
    consentGiven: z.boolean().optional(),
    emergencyContact: emergencyContactSchema.optional(),
  });

export const listPatientsSchema = paginationSchema.extend({
  status: enumSchema(PatientStatus).optional(),
  patientType: enumSchema(PatientType).optional(),
  includeDeleted: z.coerce.boolean().optional(),
});

export const patientSearchSchema = z.object({
  q: z.string().trim().min(2, 'Search query must be at least 2 characters'),
  limit: z.coerce.number().int().positive().max(25).default(10),
});

export const patientTimelineSchema = paginationSchema.extend({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  type: z.enum(['visit', 'appointment', 'bill', 'prescription', 'payment', 'file']).optional(),
});

export const mergePatientsSchema = z.object({
  primaryPatientId: objectIdSchema,
  duplicatePatientId: objectIdSchema,
});

export const checkinLookupSchema = z.object({
  phone: phoneSchema,
});

export const checkinSubmitSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('returning'),
    phone: phoneSchema,
    chiefComplaint: requiredStringSchema.max(500),
    currentIssue: z.string().trim().max(1000).optional(),
  }),
  z.object({
    mode: z.literal('new'),
    phone: phoneSchema,
    firstName: requiredStringSchema.max(100),
    lastName: requiredStringSchema.max(100),
    dateOfBirth: dateOfBirthSchema,
    gender: enumSchema(Gender),
    email: emailSchema.optional(),
    address: addressSchema,
    bloodGroup: enumSchema(BloodGroup).optional(),
    maritalStatus: enumSchema(MaritalStatus).optional(),
    occupation: z.string().trim().max(100).optional(),
    emergencyContact: emergencyContactSchema,
    allergies: z.array(z.string().trim()).max(50).default([]),
    patientType: enumSchema(PatientType).default(PatientType.Adult),
    pediatricInfo: pediatricInfoSchema.optional(),
    consentGiven: z.boolean().refine((val) => val === true, 'Consent is required'),
    medicalFlags: medicalFlagsSchema.optional(),
    chiefComplaint: requiredStringSchema.max(500),
    currentIssue: z.string().trim().max(1000).optional(),
  }),
]);

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type ListPatientsInput = z.infer<typeof listPatientsSchema>;
export type CheckinSubmitInput = z.infer<typeof checkinSubmitSchema>;
export type MedicalFlagsInput = z.infer<typeof medicalFlagsSchema>;

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  const spaceIndex = trimmed.indexOf(' ');
  if (spaceIndex === -1) {
    return { firstName: trimmed, lastName: '.' };
  }
  return {
    firstName: trimmed.slice(0, spaceIndex),
    lastName: trimmed.slice(spaceIndex + 1).trim() || '.',
  };
}

export function buildConditionsFromFlags(flags?: MedicalFlagsInput) {
  if (!flags) return [];
  const conditions = [];
  if (flags.diabetes) conditions.push({ name: 'Diabetes', isActive: true });
  if (flags.hypertension) conditions.push({ name: 'Hypertension', isActive: true });
  if (flags.heartDisease) conditions.push({ name: 'Heart Disease', isActive: true });
  if (flags.pregnancy) conditions.push({ name: 'Pregnancy', isActive: true });
  if (flags.otherConditions) {
    conditions.push({ name: flags.otherConditions, isActive: true });
  }
  return conditions;
}
