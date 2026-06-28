import { describe, expect, it } from 'vitest';

import { PatientType } from '@/types/enums';
import {
  buildConditionsFromFlags,
  checkinLookupSchema,
  checkinSubmitSchema,
  createPatientSchema,
  formValuesToCreatePatientInput,
  patientFormSchema,
  splitFullName,
} from '@/validators/patient.validator';

const validAddress = {
  street: '123 MG Road',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
  country: 'India',
};

const validEmergency = {
  name: 'Priya Kumar',
  relationship: 'spouse',
  phone: '9876543211',
};

describe('patient.validator', () => {
  it('validates adult patient registration', () => {
    const result = createPatientSchema.safeParse({
      firstName: 'Raj',
      lastName: 'Kumar',
      dateOfBirth: '1985-03-15',
      gender: 'male',
      phone: '9876543210',
      email: 'raj@email.com',
      address: validAddress,
      emergencyContact: validEmergency,
      consentGiven: true,
      patientType: PatientType.Adult,
    });
    expect(result.success).toBe(true);
  });

  it('rejects future date of birth', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const result = createPatientSchema.safeParse({
      firstName: 'Raj',
      lastName: 'Kumar',
      dateOfBirth: future.toISOString(),
      gender: 'male',
      phone: '9876543210',
      address: validAddress,
      emergencyContact: validEmergency,
      consentGiven: true,
    });
    expect(result.success).toBe(false);
  });

  it('requires consent checkbox', () => {
    const result = createPatientSchema.safeParse({
      firstName: 'Raj',
      lastName: 'Kumar',
      dateOfBirth: '1985-03-15',
      gender: 'male',
      phone: '9876543210',
      address: validAddress,
      emergencyContact: validEmergency,
      consentGiven: false,
    });
    expect(result.success).toBe(false);
  });

  it('requires guardian for pediatric patients', () => {
    const result = createPatientSchema.safeParse({
      firstName: 'Aarav',
      lastName: 'Sharma',
      dateOfBirth: '2018-06-10',
      gender: 'male',
      phone: '9876543212',
      address: validAddress,
      emergencyContact: validEmergency,
      consentGiven: true,
      patientType: PatientType.Pediatric,
      pediatricInfo: {},
    });
    expect(result.success).toBe(false);
  });

  it('validates check-in phone lookup', () => {
    const result = checkinLookupSchema.safeParse({ phone: '9876543210' });
    expect(result.success).toBe(true);
    expect(result.data?.phone).toBe('9876543210');
  });

  it('validates returning patient check-in', () => {
    const result = checkinSubmitSchema.safeParse({
      mode: 'returning',
      phone: '9876543210',
      chiefComplaint: 'Tooth pain',
    });
    expect(result.success).toBe(true);
  });

  it('splits full name correctly', () => {
    expect(splitFullName('Raj Kumar')).toEqual({ firstName: 'Raj', lastName: 'Kumar' });
    expect(splitFullName('Madonna')).toEqual({ firstName: 'Madonna', lastName: '.' });
  });

  it('validates patient form schema with fullName', () => {
    const result = patientFormSchema.safeParse({
      fullName: 'Raj Kumar',
      dateOfBirth: new Date('1990-01-15'),
      gender: 'male',
      phone: '9876543210',
      address: {
        street: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India',
      },
      consentGiven: true,
      patientType: 'adult',
      allergies: [],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const input = formValuesToCreatePatientInput(result.data);
      expect(input.firstName).toBe('Raj');
      expect(input.lastName).toBe('Kumar');
    }
  });

  it('builds medical conditions from flags', () => {
    const conditions = buildConditionsFromFlags({
      diabetes: true,
      hypertension: true,
      heartDisease: false,
      pregnancy: false,
    });
    expect(conditions).toHaveLength(2);
    expect(conditions[0]?.name).toBe('Diabetes');
  });
});

describe('splitFullName and phone validation', () => {
  it('rejects invalid phone numbers', () => {
    const result = checkinLookupSchema.safeParse({ phone: '12345' });
    expect(result.success).toBe(false);
  });
});
