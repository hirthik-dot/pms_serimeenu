import { connectToDatabase } from '@/lib/db';
import { ConflictError, NotFoundError } from '@/lib/errors';
import { patientService } from '@/services/patient.service';
import type { CheckinLookupResult, CheckinSubmitResult } from '@/types/patient';
import type { CheckinSubmitInput } from '@/validators/patient.validator';

export class CheckinService {
  async lookupByPhone(phone: string): Promise<CheckinLookupResult> {
    await connectToDatabase();
    const patient = await patientService.getPatientByPhone(phone);

    if (!patient) {
      return { found: false };
    }

    return { found: true, patient };
  }

  async submitCheckin(input: CheckinSubmitInput): Promise<CheckinSubmitResult> {
    await connectToDatabase();

    if (input.mode === 'returning') {
      const patient = await patientService.getPatientByPhone(input.phone);
      if (!patient) {
        throw new NotFoundError('Patient');
      }

      const checkin = await patientService.createCheckinVisit(
        patient.id,
        input.chiefComplaint,
        input.currentIssue,
      );

      return {
        patientId: patient.id,
        hospitalId: patient.patientId,
        tokenNumber: checkin.tokenNumber,
        visitId: checkin.visitId,
        message: `Check-in successful. Your token number is ${checkin.tokenNumber}.`,
      };
    }

    const existing = await patientService.getPatientByPhone(input.phone);
    if (existing) {
      throw new ConflictError('Patient already exists. Please use returning patient check-in.');
    }

    const created = await patientService.createPatient({
      firstName: input.firstName,
      lastName: input.lastName,
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      phone: input.phone,
      email: input.email,
      address: input.address,
      bloodGroup: input.bloodGroup,
      maritalStatus: input.maritalStatus,
      occupation: input.occupation,
      emergencyContact: input.emergencyContact,
      allergies: input.allergies,
      patientType: input.patientType,
      pediatricInfo: input.pediatricInfo,
      consentGiven: input.consentGiven,
      medicalFlags: input.medicalFlags,
    });

    const checkin = await patientService.createCheckinVisit(
      created.id,
      input.chiefComplaint,
      input.currentIssue,
    );

    return {
      patientId: created.id,
      hospitalId: created.patientId,
      tokenNumber: checkin.tokenNumber,
      visitId: checkin.visitId,
      message: `Registration and check-in successful. Your token number is ${checkin.tokenNumber}.`,
    };
  }
}

export const checkinService = new CheckinService();
