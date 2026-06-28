import { Types } from 'mongoose';

import { PATIENT_ID } from '@/constants/app';
import { connectToDatabase, nextPatientId, nextQueueTokenNumber, nextVisitCode, nextVisitNumberForPatient } from '@/lib/db';
import { withTransaction } from '@/lib/db/utils/transaction';
import { ConflictError, NotFoundError, ValidationError } from '@/lib/errors';
import { AppointmentModel } from '@/models/appointment.model';
import { BillModel } from '@/models/bill.model';
import { FileModel } from '@/models/file.model';
import { PaymentModel } from '@/models/payment.model';
import { PrescriptionModel } from '@/models/prescription.model';
import { VisitModel } from '@/models/visit.model';
import { XRayModel } from '@/models/xray.model';
import { emergencyContactRepository } from '@/repositories/emergency-contact.repository';
import { fileRepository } from '@/repositories/file.repository';
import { medicalHistoryRepository } from '@/repositories/medical-history.repository';
import { patientRepository } from '@/repositories/patient.repository';
import { userRepository } from '@/repositories/user.repository';
import { visitRepository } from '@/repositories/visit.repository';
import { deletePatientPhoto, uploadPatientDocument, uploadPatientPhoto } from '@/services/upload.service';
import { PatientStatus, QueuePriority, QueueTokenStatus, UserRole, UserStatus, VisitStatus } from '@/types/enums';
import type { IMedicalHistory } from '@/types/models';
import type { TimelineEntry } from '@/types/patient';
import {
  mapPatientDetail,
  mapPatientSummary,
  mapTypeahead,
} from '@/types/patient';
import { toISODateString } from '@/utils/date';
import { getDocumentId } from '@/utils/mongoose';
import { medicalHistorySchema } from '@/validators/models.validator';
import type {
  CreatePatientInput,
  ListPatientsInput,
  UpdatePatientInput,
} from '@/validators/patient.validator';
import {
  buildConditionsFromFlags,
  type MedicalFlagsInput,
} from '@/validators/patient.validator';

export class PatientService {
  private async getPatientExtras(patientObjectId: string) {
    const [lastVisit, outstandingAgg] = await Promise.all([
      VisitModel.findOne({ patientId: new Types.ObjectId(patientObjectId), isDeleted: false })
        .sort({ date: -1 })
        .select('date')
        .lean<{ date: Date }>()
        .exec(),
      BillModel.aggregate<{ total: number }>([
        {
          $match: {
            patientId: new Types.ObjectId(patientObjectId),
            isDeleted: false,
            balanceAmount: { $gt: 0 },
          },
        },
        { $group: { _id: null, total: { $sum: '$balanceAmount' } } },
      ]).exec(),
    ]);

    return {
      lastVisit: lastVisit?.date,
      outstandingDue: outstandingAgg[0]?.total ?? 0,
    };
  }

  private async loadPatientDetail(patientId: string, includeDeleted = false) {
    const patient = includeDeleted
      ? await patientRepository.findById(patientId)
      : await patientRepository.findByIdOrThrow(patientId, 'Patient');

    if (!patient || (!includeDeleted && patient.isDeleted)) {
      throw new NotFoundError('Patient');
    }

    const objectId = getDocumentId(patient);
    const [emergencyContact, medicalHistory, extras] = await Promise.all([
      emergencyContactRepository.findByPatientId(objectId),
      medicalHistoryRepository.findByPatientId(objectId),
      this.getPatientExtras(objectId),
    ]);

    return mapPatientDetail(patient, emergencyContact, medicalHistory, extras);
  }

  async listPatients(input: ListPatientsInput) {
    await connectToDatabase();

    const result = await patientRepository.search({
      page: input.page,
      limit: input.limit,
      sortBy: input.sortBy ?? 'createdAt',
      sortOrder: input.sortOrder,
      search: input.search,
      status: input.status,
      patientType: input.patientType,
      includeDeleted: input.includeDeleted,
    });

    const summaries = await Promise.all(
      result.data.map(async (patient) => {
        const extras = await this.getPatientExtras(getDocumentId(patient));
        return mapPatientSummary(patient, extras);
      }),
    );

    return {
      data: summaries,
      total: result.meta.total,
      page: result.meta.page,
      limit: result.meta.limit,
    };
  }

  async searchPatients(query: string, limit = 10) {
    await connectToDatabase();
    const patients = await patientRepository.typeaheadSearch(query, limit);
    return patients.map(mapTypeahead);
  }

  async getPatient(id: string, includeDeleted = false) {
    await connectToDatabase();
    return this.loadPatientDetail(id, includeDeleted);
  }

  async getPatientByPhone(phone: string) {
    await connectToDatabase();
    const patient = await patientRepository.findByPhone(phone);
    if (!patient) return null;
    return this.loadPatientDetail(getDocumentId(patient));
  }

  async createPatient(input: CreatePatientInput, createdBy?: string) {
    await connectToDatabase();

    if (await patientRepository.phoneExists(input.phone)) {
      throw new ConflictError('A patient with this phone number already exists');
    }

    return withTransaction(async (session?) => {
      const hospitalId = await nextPatientId(PATIENT_ID.DEFAULT_PREFIX, session);
      const patient = await patientRepository.createPatient(
        {
          patientId: hospitalId,
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
          allergies: input.allergies,
          notes: input.notes,
          patientType: input.patientType,
          pediatricInfo: input.pediatricInfo,
          consentGiven: input.consentGiven,
          status: PatientStatus.Active,
          isDeleted: false,
          createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined,
        },
        session,
      );

      const patientObjectId = getDocumentId(patient);

      await emergencyContactRepository.upsertForPatient(
        patientObjectId,
        input.emergencyContact,
        session,
      );

      const conditions = buildConditionsFromFlags(input.medicalFlags);
      const historyData: Partial<IMedicalHistory> = {
        conditions,
        allergies: input.allergies,
        ...(input.medicalHistory ?? {}),
      };

      if (input.medicalFlags?.otherConditions && !input.medicalHistory) {
        historyData.notes = input.medicalFlags.otherConditions;
      }

      await medicalHistoryRepository.upsertForPatient(patientObjectId, historyData, session);

      return {
        id: patientObjectId,
        patientId: hospitalId,
        firstName: patient.firstName,
        lastName: patient.lastName,
      };
    });
  }

  async updatePatient(id: string, input: UpdatePatientInput, updatedBy?: string) {
    await connectToDatabase();
    await patientRepository.findByIdOrThrow(id, 'Patient');

    if (input.phone && (await patientRepository.phoneExists(input.phone, id))) {
      throw new ConflictError('A patient with this phone number already exists');
    }

    const { emergencyContact, medicalFlags, medicalHistory, ...patientFields } = input;

    const updatePayload: Record<string, unknown> = { ...patientFields };
    if (updatedBy) {
      updatePayload.updatedBy = new Types.ObjectId(updatedBy);
    }

    const patient = await patientRepository.updateWithAudit(
      id,
      { $set: updatePayload },
      updatedBy,
      'Patient',
    );

    if (emergencyContact) {
      await emergencyContactRepository.upsertForPatient(id, emergencyContact);
    }

    if (medicalFlags || medicalHistory) {
      const existing = await medicalHistoryRepository.findByPatientId(id);
      const conditions = medicalFlags
        ? buildConditionsFromFlags(medicalFlags)
        : (existing?.conditions ?? []);

      await medicalHistoryRepository.upsertForPatient(id, {
        conditions,
        ...(medicalHistory ?? {}),
      });
    }

    return this.loadPatientDetail(getDocumentId(patient));
  }

  async deletePatient(id: string, deletedBy?: string) {
    await connectToDatabase();
    await patientRepository.findByIdOrThrow(id, 'Patient');

    const activeVisit = await visitRepository.findActiveByPatient(id);
    if (activeVisit) {
      throw new ValidationError('Cannot delete patient with an active visit in progress');
    }

    await patientRepository.softDelete(id, 'Patient', { deletedBy });
  }

  async archivePatient(id: string, updatedBy?: string) {
    await connectToDatabase();
    await patientRepository.updateWithAudit(
      id,
      { $set: { status: PatientStatus.Archived } },
      updatedBy,
      'Patient',
    );
    return this.loadPatientDetail(id);
  }

  async restorePatient(id: string, restoredBy?: string) {
    await connectToDatabase();
    await patientRepository.restore(id, 'Patient', restoredBy);
    await patientRepository.updateWithAudit(
      id,
      { $set: { status: PatientStatus.Active } },
      restoredBy,
      'Patient',
    );
    return this.loadPatientDetail(id, true);
  }

  async mergePatients(primaryId: string, duplicateId: string, updatedBy?: string) {
    await connectToDatabase();

    if (primaryId === duplicateId) {
      throw new ValidationError('Cannot merge a patient with itself');
    }

    await patientRepository.findByIdOrThrow(primaryId, 'Patient');
    await patientRepository.findByIdOrThrow(duplicateId, 'Patient');

    return withTransaction(async (session?) => {
      const duplicateObjectId = new Types.ObjectId(duplicateId);

      await Promise.all([
        VisitModel.updateMany(
          { patientId: duplicateObjectId },
          { $set: { patientId: new Types.ObjectId(primaryId) } },
          { session },
        ).exec(),
        BillModel.updateMany(
          { patientId: duplicateObjectId },
          { $set: { patientId: new Types.ObjectId(primaryId) } },
          { session },
        ).exec(),
        PrescriptionModel.updateMany(
          { patientId: duplicateObjectId },
          { $set: { patientId: new Types.ObjectId(primaryId) } },
          { session },
        ).exec(),
        FileModel.updateMany(
          { patientId: duplicateObjectId },
          { $set: { patientId: new Types.ObjectId(primaryId) } },
          { session },
        ).exec(),
        XRayModel.updateMany(
          { patientId: duplicateObjectId },
          { $set: { patientId: new Types.ObjectId(primaryId) } },
          { session },
        ).exec(),
        PaymentModel.updateMany(
          { patientId: duplicateObjectId },
          { $set: { patientId: new Types.ObjectId(primaryId) } },
          { session },
        ).exec(),
        AppointmentModel.updateMany(
          { patientId: duplicateObjectId },
          { $set: { patientId: new Types.ObjectId(primaryId) } },
          { session },
        ).exec(),
      ]);

      await patientRepository.softDelete(duplicateId, 'Patient', {
        deletedBy: updatedBy,
        session,
      });

      await patientRepository.updateWithAudit(
        primaryId,
        {
          $set: {
            notes: `Merged duplicate patient ${duplicateId}`,
            updatedBy: updatedBy ? new Types.ObjectId(updatedBy) : undefined,
          },
        },
        updatedBy,
        'Patient',
        session,
      );

      return this.loadPatientDetail(primaryId);
    });
  }

  async getMedicalHistory(id: string) {
    await connectToDatabase();
    await patientRepository.findByIdOrThrow(id, 'Patient');
    return medicalHistoryRepository.findByPatientId(id);
  }

  async updateMedicalHistory(id: string, input: unknown) {
    await connectToDatabase();
    await patientRepository.findByIdOrThrow(id, 'Patient');
    const parsed = medicalHistorySchema.parse(input);
    return medicalHistoryRepository.upsertForPatient(id, parsed);
  }

  async updateEmergencyContact(
    id: string,
    input: { name: string; relationship: string; phone: string },
  ) {
    await connectToDatabase();
    await patientRepository.findByIdOrThrow(id, 'Patient');
    return emergencyContactRepository.upsertForPatient(id, input);
  }

  async uploadProfilePhoto(id: string, file: File) {
    await connectToDatabase();
    const patient = await patientRepository.findByIdOrThrow(id, 'Patient');
    const url = await uploadPatientPhoto(file, getDocumentId(patient));
    await patientRepository.updateWithAudit(id, { $set: { profileImage: url } }, undefined, 'Patient');
    return { profileImage: url };
  }

  async deleteProfilePhoto(id: string) {
    await connectToDatabase();
    const patient = await patientRepository.findByIdOrThrow(id, 'Patient');
    if (patient.profileImage) {
      await deletePatientPhoto(patient.profileImage);
    }
    await patientRepository.updateWithAudit(id, { $set: { profileImage: null } }, undefined, 'Patient');
    return null;
  }

  async uploadDocument(
    id: string,
    file: File,
    category: string,
    uploadedBy: string,
    visitId?: string,
  ) {
    await connectToDatabase();
    await patientRepository.findByIdOrThrow(id, 'Patient');
    const upload = await uploadPatientDocument(file, id, category);
    return fileRepository.createFile({
      patientId: new Types.ObjectId(id),
      visitId: visitId ? new Types.ObjectId(visitId) : undefined,
      uploadedBy: new Types.ObjectId(uploadedBy),
      fileName: upload.publicId ?? file.name,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      url: upload.url,
      cloudinaryPublicId: upload.publicId,
      category: category as never,
      isDeleted: false,
    });
  }

  async getDocuments(id: string, page = 1, limit = 20) {
    await connectToDatabase();
    await patientRepository.findByIdOrThrow(id, 'Patient');
    return fileRepository.findByPatient(id, { page, limit, sortBy: 'createdAt', sortOrder: 'desc' });
  }

  async getTimeline(id: string, options: { page?: number; limit?: number; type?: string }) {
    await connectToDatabase();
    await patientRepository.findByIdOrThrow(id, 'Patient');
    const patientObjectId = new Types.ObjectId(id);
    const entries: TimelineEntry[] = [];

    const fetches: Promise<void>[] = [];

    if (!options.type || options.type === 'visit') {
      fetches.push(
        VisitModel.find({ patientId: patientObjectId, isDeleted: false })
          .populate('doctorId', 'firstName lastName')
          .sort({ date: -1 })
          .limit(50)
          .lean()
          .exec()
          .then((visits) => {
            for (const visit of visits as Array<{
              _id: Types.ObjectId;
              date: Date;
              status: string;
              chiefComplaint: string;
              doctorId?: { firstName?: string; lastName?: string };
            }>) {
              const doctorName = visit.doctorId
                ? `Dr. ${visit.doctorId.firstName ?? ''} ${visit.doctorId.lastName ?? ''}`.trim()
                : 'Doctor';
              entries.push({
                type: 'visit',
                id: visit._id.toString(),
                date: visit.date.toISOString(),
                summary: `Consultation — ${doctorName}: ${visit.chiefComplaint}`,
                status: visit.status,
              });
            }
          }),
      );
    }

    if (!options.type || options.type === 'appointment') {
      fetches.push(
        AppointmentModel.find({ patientId: patientObjectId, isDeleted: false })
          .sort({ date: -1 })
          .limit(50)
          .lean()
          .exec()
          .then((appointments) => {
            for (const appt of appointments as Array<{ _id: Types.ObjectId; date: Date; status: string }>) {
              entries.push({
                type: 'appointment',
                id: appt._id.toString(),
                date: new Date(appt.date).toISOString(),
                summary: 'Appointment scheduled',
                status: appt.status,
              });
            }
          }),
      );
    }

    if (!options.type || options.type === 'bill') {
      fetches.push(
        BillModel.find({ patientId: patientObjectId, isDeleted: false })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean()
          .exec()
          .then((bills) => {
            for (const bill of bills as Array<{
              _id: Types.ObjectId;
              createdAt: Date;
              billNumber: string;
              totalAmount: number;
              status: string;
            }>) {
              entries.push({
                type: 'bill',
                id: bill._id.toString(),
                date: bill.createdAt.toISOString(),
                summary: `Bill ${bill.billNumber} — ₹${bill.totalAmount}`,
                status: bill.status,
              });
            }
          }),
      );
    }

    if (!options.type || options.type === 'prescription') {
      fetches.push(
        PrescriptionModel.find({ patientId: patientObjectId, isDeleted: false })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean()
          .exec()
          .then((prescriptions) => {
            for (const rx of prescriptions as Array<{
              _id: Types.ObjectId;
              createdAt: Date;
              status: string;
              medications: Array<{ name: string }>;
            }>) {
              entries.push({
                type: 'prescription',
                id: rx._id.toString(),
                date: rx.createdAt.toISOString(),
                summary: `Prescription — ${rx.medications.map((m) => m.name).join(', ')}`,
                status: rx.status,
              });
            }
          }),
      );
    }

    if (!options.type || options.type === 'payment') {
      fetches.push(
        PaymentModel.find({ patientId: patientObjectId, isDeleted: false })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean()
          .exec()
          .then((payments) => {
            for (const payment of payments as Array<{
              _id: Types.ObjectId;
              createdAt: Date;
              amount: number;
              status: string;
              receiptNumber: string;
            }>) {
              entries.push({
                type: 'payment',
                id: payment._id.toString(),
                date: payment.createdAt.toISOString(),
                summary: `Payment ${payment.receiptNumber} — ₹${payment.amount}`,
                status: payment.status,
              });
            }
          }),
      );
    }

    if (!options.type || options.type === 'file') {
      fetches.push(
        FileModel.find({ patientId: patientObjectId, isDeleted: false })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean()
          .exec()
          .then((files) => {
            for (const file of files as Array<{
              _id: Types.ObjectId;
              createdAt: Date;
              originalName: string;
              category: string;
            }>) {
              entries.push({
                type: 'file',
                id: file._id.toString(),
                date: file.createdAt.toISOString(),
                summary: `Document uploaded — ${file.originalName}`,
                status: file.category,
              });
            }
          }),
      );
    }

    await Promise.all(fetches);

    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const start = (page - 1) * limit;
    const paginated = entries.slice(start, start + limit);

    return {
      data: paginated,
      total: entries.length,
      page,
      limit,
    };
  }

  async getClinicalHistory(id: string) {
    await connectToDatabase();
    await patientRepository.findByIdOrThrow(id, 'Patient');

    const [visits, prescriptions, xrays] = await Promise.all([
      visitRepository.findByPatient(id, { limit: 20, sortBy: 'date', sortOrder: 'desc' }),
      PrescriptionModel.find({ patientId: new Types.ObjectId(id), isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()
        .exec(),
      XRayModel.find({ patientId: new Types.ObjectId(id), isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()
        .exec(),
    ]);

    return {
      visits: visits.data,
      prescriptions,
      xrays,
      medicalHistory: await medicalHistoryRepository.findByPatientId(id),
    };
  }

  async exportPatients(input: ListPatientsInput) {
    const result = await this.listPatients({ ...input, limit: 100 });
    const headers = [
      'Hospital ID',
      'First Name',
      'Last Name',
      'Phone',
      'Email',
      'Age',
      'Gender',
      'Status',
      'Outstanding Due',
      'Last Visit',
    ];

    const rows = result.data.map((p) => [
      p.patientId,
      p.firstName,
      p.lastName,
      p.phone,
      p.email ?? '',
      String(p.age),
      p.gender,
      p.status,
      String(p.outstandingDue),
      p.lastVisit ? toISODateString(p.lastVisit) : '',
    ]);

    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }

  async updatePatientStatus(id: string, status: PatientStatus, updatedBy?: string) {
    await connectToDatabase();
    await patientRepository.updateWithAudit(id, { $set: { status } }, updatedBy, 'Patient');
    return this.loadPatientDetail(id);
  }

  private async getDefaultDoctorId(): Promise<string> {
    const doctors = await userRepository.findPaginated(
      { isDeleted: false, role: UserRole.Doctor, status: UserStatus.Active },
      { page: 1, limit: 1 },
    );

    if (doctors.data[0]) {
      return getDocumentId(doctors.data[0]);
    }

    const admins = await userRepository.findPaginated(
      { isDeleted: false, role: { $in: [UserRole.Admin, UserRole.SuperAdmin] } },
      { page: 1, limit: 1 },
    );

    if (admins.data[0]) {
      return getDocumentId(admins.data[0]);
    }

    throw new ValidationError('No doctor available for check-in. Please contact reception.');
  }

  async createCheckinVisit(
    patientObjectId: string,
    chiefComplaint: string,
    currentIssue?: string,
  ) {
    const doctorId = await this.getDefaultDoctorId();
    const today = toISODateString(new Date());

    const activeVisit = await visitRepository.findActiveByPatient(patientObjectId);
    if (activeVisit) {
      throw new ConflictError('An active visit already exists for this patient today');
    }

    return withTransaction(async (session?) => {
      const [visitNumber, visitCode, tokenNumber] = await Promise.all([
        nextVisitNumberForPatient(patientObjectId, session),
        nextVisitCode(session),
        nextQueueTokenNumber(doctorId, today, session),
      ]);

      const complaint = currentIssue
        ? `${chiefComplaint} — ${currentIssue}`
        : chiefComplaint;

      const visit = await visitRepository.createVisit(
        {
          patientId: new Types.ObjectId(patientObjectId),
          doctorId: new Types.ObjectId(doctorId),
          visitNumber,
          visitCode,
          date: new Date(),
          status: VisitStatus.WaitingRoom,
          chiefComplaint: complaint,
          isDeleted: false,
        },
        session,
      );

      const { queueTokenRepository } = await import('@/repositories/queue-token.repository');
      await queueTokenRepository.createToken(
        {
          patientId: new Types.ObjectId(patientObjectId),
          doctorId: new Types.ObjectId(doctorId),
          visitId: new Types.ObjectId(getDocumentId(visit)),
          date: today,
          tokenNumber,
          priority: QueuePriority.Normal,
          status: QueueTokenStatus.Waiting,
          isDeleted: false,
        },
        session,
      );

      await patientRepository.updateWithAudit(
        patientObjectId,
        { $set: { status: PatientStatus.Waiting } },
        undefined,
        'Patient',
        session,
      );

      return {
        visitId: getDocumentId(visit),
        tokenNumber,
        doctorId,
      };
    });
  }
}

export const patientService = new PatientService();

export type { MedicalFlagsInput };
