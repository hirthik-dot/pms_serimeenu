import { describe, expect, it } from 'vitest';

import { calculateAge } from '@/utils/date';
import { buildConditionsFromFlags, splitFullName } from '@/validators/patient.validator';

describe('patient utilities', () => {
  it('calculates age from date of birth', () => {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 30);
    expect(calculateAge(dob)).toBe(30);
  });

  it('builds all medical flag conditions', () => {
    const conditions = buildConditionsFromFlags({
      diabetes: false,
      hypertension: false,
      heartDisease: true,
      pregnancy: true,
      otherConditions: 'Asthma',
    });
    expect(conditions.map((c) => c.name)).toEqual(['Heart Disease', 'Pregnancy', 'Asthma']);
  });

  it('handles multi-part names', () => {
    const result = splitFullName('Mary Jane Watson');
    expect(result.firstName).toBe('Mary');
    expect(result.lastName).toBe('Jane Watson');
  });
});
