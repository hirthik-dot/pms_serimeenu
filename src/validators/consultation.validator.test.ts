import { describe, expect, it } from 'vitest';

import {
  ConsultationDisplayStatus,
  VisitStatus,
  XrayRequestType,
} from '@/types/enums';
import { mapVisitToConsultationStatus } from '@/utils/consultation-status';
import {
  createPrescriptionSchema,
  diagnosisSchema,
  followUpSchema,
  xrayRequestSchema,
} from '@/validators/consultation.validator';

describe('consultation.validator', () => {
  it('validates diagnosis', () => {
    const result = diagnosisSchema.safeParse({ diagnosis: 'Dental caries #36' });
    expect(result.success).toBe(true);
  });

  it('rejects empty diagnosis', () => {
    const result = diagnosisSchema.safeParse({ diagnosis: '' });
    expect(result.success).toBe(false);
  });

  it('validates prescription medications', () => {
    const result = createPrescriptionSchema.safeParse({
      medications: [
        {
          name: 'Amoxicillin',
          dosage: '500mg',
          frequency: 'thrice_daily',
          duration: 5,
          durationUnit: 'days',
          route: 'oral',
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('requires custom type for custom x-ray request', () => {
    const invalid = xrayRequestSchema.safeParse({ type: XrayRequestType.Custom });
    expect(invalid.success).toBe(false);

    const valid = xrayRequestSchema.safeParse({
      type: XrayRequestType.Custom,
      customType: 'Lateral cephalogram',
    });
    expect(valid.success).toBe(true);
  });

  it('validates follow-up with date', () => {
    const result = followUpSchema.safeParse({
      followUpDate: '2026-07-04',
      followUpTime: '10:30',
    });
    expect(result.success).toBe(true);
  });
});

describe('consultation-status', () => {
  it('maps waiting room to draft', () => {
    expect(mapVisitToConsultationStatus(VisitStatus.WaitingRoom)).toBe(
      ConsultationDisplayStatus.Draft,
    );
  });

  it('maps with doctor to in progress', () => {
    expect(mapVisitToConsultationStatus(VisitStatus.WithDoctor, new Date())).toBe(
      ConsultationDisplayStatus.InProgress,
    );
  });

  it('maps completed to completed', () => {
    expect(mapVisitToConsultationStatus(VisitStatus.Completed)).toBe(
      ConsultationDisplayStatus.Completed,
    );
  });

  it('maps cancelled to cancelled', () => {
    expect(mapVisitToConsultationStatus(VisitStatus.Cancelled)).toBe(
      ConsultationDisplayStatus.Cancelled,
    );
  });
});

describe('formToDraftInput', () => {
  it('exports draft fields from form state', async () => {
    const { formToDraftInput } = await import(
      '@/features/consultation/components/consultation-center-tabs'
    );
    const draft = formToDraftInput({
      chiefComplaint: 'Pain',
      presentIllness: '2 days',
      clinicalFindings: 'Caries',
      diagnosis: 'Caries #36',
      clinicalNotes: 'Notes',
      additionalNotes: '',
      treatmentRecommendation: 'Filling',
      advice: 'Soft diet',
      followUpDate: '2026-07-01',
      followUpTime: '10:00',
      followUpPurpose: 'Review',
      followUpReminder: true,
      followUpNotes: 'Call patient',
    });

    expect(draft.diagnosis).toBe('Caries #36');
    expect(draft.followUpReminder).toBe(true);
  });
});
