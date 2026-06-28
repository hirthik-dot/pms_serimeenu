import { describe, expect, it } from 'vitest';

import { mapConsultationRecord, mapMedicine } from '@/services/consultation.mapper';
import { ConsultationDisplayStatus, VisitStatus } from '@/types/enums';
import { mapVisitToConsultationStatus } from '@/utils/consultation-status';

describe('consultation.mapper', () => {
  it('maps consultation record from visit', () => {
    const visit = {
      _id: '665a1b2c3d4e5f6789012345',
      status: VisitStatus.WithDoctor,
      chiefComplaint: 'Tooth pain',
      startedAt: new Date('2026-06-27T10:00:00.000Z'),
      consultation: {
        diagnosis: 'Caries',
        clinicalNotes: 'Sensitive to cold',
      },
    };

    const record = mapConsultationRecord(visit as never);
    expect(record.diagnosis).toBe('Caries');
    expect(record.consultationStatus).toBe(ConsultationDisplayStatus.InProgress);
  });

  it('maps medicine search result', () => {
    const medicine = {
      _id: '665a1b2c3d4e5f6789012345',
      name: 'Amoxicillin',
      genericName: 'Amoxicillin',
      defaultDosage: '500mg',
    };

    const mapped = mapMedicine(medicine as never);
    expect(mapped.name).toBe('Amoxicillin');
    expect(mapped.defaultDosage).toBe('500mg');
  });
});

describe('mapVisitToConsultationStatus integration', () => {
  it('re-exports status utility', () => {
    expect(mapVisitToConsultationStatus(VisitStatus.BillingPending)).toBe(
      ConsultationDisplayStatus.Completed,
    );
  });
});
