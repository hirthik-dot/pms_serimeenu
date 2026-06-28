import { Types } from 'mongoose';

import { sanitizeString } from '@/lib/auth/sanitize';
import { connectToDatabase, nextVisitCode, nextVisitNumberForPatient } from '@/lib/db';
import { withTransaction } from '@/lib/db/utils/transaction';
import {
  ConflictError,
  NotFoundError,
  UnprocessableError,
  ValidationError,
} from '@/lib/errors';
import { AppointmentModel } from '@/models/appointment.model';
import { BillModel } from '@/models/bill.model';
import { FileModel } from '@/models/file.model';
import { NotificationModel } from '@/models/notification.model';
import { PrescriptionModel } from '@/models/prescription.model';
import { TreatmentPlanModel } from '@/models/treatment-plan.model';
import { TreatmentModel } from '@/models/treatment.model';
import { UserModel } from '@/models/user.model';
import { VisitModel } from '@/models/visit.model';
import { XrayRequestModel } from '@/models/xray-request.model';
import { XRayModel } from '@/models/xray.model';
import { appointmentRepository } from '@/repositories/appointment.repository';
import {
  prescriptionRepository,
  treatmentPlanRepository,
} from '@/repositories/consultation.repository';
import { medicineRepository } from '@/repositories/medicine.repository';
import { patientRepository } from '@/repositories/patient.repository';
import { queueTokenRepository } from '@/repositories/queue-token.repository';
import { visitRepository } from '@/repositories/visit.repository';
import { xrayRequestRepository } from '@/repositories/xray-request.repository';
import { billService } from '@/services/bill.service';
import {
  buildWorkspaceData,
  mapConsultationRecord,
  mapMedicine,
  mapPrescription,
  mapTreatmentPlan,
  mapTreatmentSearch,
  mapVisitFile,
  mapVisitPatient,
  mapVisitSummary,
  mapXrayRequest,
} from '@/services/consultation.mapper';
import type { AuthContext } from '@/types/auth';
import type {
  ClinicalHistorySearchResult,
  ConsultationRecord,
  ConsultationWorkspaceData,
  DoctorDashboardData,
  MedicineSearchResult,
  PrescriptionDto,
  TreatmentPlanDto,
  TreatmentSearchResult,
  VisitSummary,
  XrayRequestDto,
} from '@/types/consultation';
import {
  AppointmentStatus,
  BillStatus,
  NotificationPriority,
  NotificationStatus,
  NotificationType,
  PatientStatus,
  PrescriptionStatus,
  QueueTokenStatus,
  UserRole,
  UserStatus,
  VisitStatus,
  XrayRequestStatus,
} from '@/types/enums';
import type { IVisit } from '@/types/models';
import { toISODateString } from '@/utils/date';
import { getDocumentId } from '@/utils/mongoose';
import type {
  ConsultationDraftInput,
  CreatePrescriptionInput,
  CreateTreatmentPlanInput,
  CreateVisitInput,
  ListVisitsInput,
  UpdateTreatmentPlanInput,
  XrayRequestInput,
} from '@/validators/consultation.validator';

export class VisitService {
  private assertCanAccessVisit(): void {
    // Relying on RBAC permissions for authorization.
    // In a small clinic, any doctor can view/modify visits.
  }

  private async getVisitOrThrow(id: string): Promise<IVisit> {
    const visit = await visitRepository.findByIdWithDetails(id);
    if (!visit || visit.isDeleted) {
      throw new NotFoundError('Visit');
    }
    return visit;
  }

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

  private async enrichVisitSummary(visit: IVisit): Promise<VisitSummary> {
    const patientId = String(visit.patientId);
    const extras = await this.getPatientExtras(
      typeof visit.patientId === 'object' && '_id' in visit.patientId
        ? getDocumentId(visit.patientId)
        : patientId,
    );

    const today = toISODateString(new Date());
    const token = await queueTokenRepository.findTodayByPatient(
      typeof visit.patientId === 'object' && '_id' in visit.patientId
        ? getDocumentId(visit.patientId)
        : patientId,
      today,
    );

    return mapVisitSummary(visit, {
      outstandingDue: extras.outstandingDue,
      lastVisit: extras.lastVisit,
      tokenNumber: token?.tokenNumber,
    });
  }

  async listVisits(input: ListVisitsInput, auth: AuthContext) {
    await connectToDatabase();

    let dateFrom = input.dateFrom;
    let dateTo = input.dateTo;

    if (input.today) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      dateFrom = start.toISOString();
      dateTo = end.toISOString();
    }

    const doctorId =
      auth.role === UserRole.Doctor && !input.doctorId ? auth.userId : input.doctorId;

    const result = await visitRepository.searchVisits({
      ...input,
      doctorId,
      dateFrom,
      dateTo,
    });

    const data = await Promise.all(result.data.map((v) => this.enrichVisitSummary(v)));

    return {
      data,
      total: result.meta.total,
      page: result.meta.page,
      limit: result.meta.limit,
    };
  }

  async getVisit(id: string): Promise<VisitSummary> {
    await connectToDatabase();
    const visit = await this.getVisitOrThrow(id);
    return this.enrichVisitSummary(visit);
  }

  async createVisit(input: CreateVisitInput, auth: AuthContext) {
    await connectToDatabase();

    const patient = await patientRepository.findByIdOrThrow(input.patientId, 'Patient');
    const doctor = await UserModel.findOne({
      _id: input.doctorId,
      role: UserRole.Doctor,
      status: UserStatus.Active,
      isDeleted: false,
    }).lean();

    if (!doctor) {
      throw new ValidationError('Invalid doctor');
    }

    if (input.appointmentId) {
      const appointment = await AppointmentModel.findOne({
        _id: input.appointmentId,
        patientId: getDocumentId(patient),
        isDeleted: false,
      }).lean();

      if (!appointment) {
        throw new NotFoundError('Appointment');
      }
    }

    return withTransaction(async (session) => {
      const [visitNumber, visitCode] = await Promise.all([
        nextVisitNumberForPatient(input.patientId, session),
        nextVisitCode(session),
      ]);

      const visit = await visitRepository.createVisit(
        {
          patientId: new Types.ObjectId(input.patientId),
          doctorId: new Types.ObjectId(input.doctorId),
          appointmentId: input.appointmentId
            ? new Types.ObjectId(input.appointmentId)
            : undefined,
          visitNumber,
          visitCode,
          date: new Date(),
          status: VisitStatus.WaitingRoom,
          chiefComplaint: input.chiefComplaint,
          isDeleted: false,
          createdBy: new Types.ObjectId(auth.userId),
        },
        session,
      );

      if (input.appointmentId) {
        await AppointmentModel.updateOne(
          { _id: input.appointmentId },
          { $set: { status: AppointmentStatus.CheckedIn, updatedBy: auth.userId } },
          { session },
        ).exec();
      }

      return {
        id: getDocumentId(visit),
        visitNumber: visit.visitNumber,
        status: visit.status,
        date: visit.date.toISOString(),
      };
    });
  }

  async startVisit(id: string, auth: AuthContext): Promise<VisitSummary> {
    await connectToDatabase();
    const visit = await this.getVisitOrThrow(id);
    this.assertCanAccessVisit();

    if (![VisitStatus.WaitingRoom, VisitStatus.WithDoctor].includes(visit.status)) {
      throw new ConflictError('Visit cannot be started in current status');
    }

    const updated = await visitRepository.updateWithAudit(
      id,
      {
        $set: {
          status: VisitStatus.WithDoctor,
          startedAt: visit.startedAt ?? new Date(),
        },
      },
      auth.userId,
      'Visit',
    );

    const patientId =
      typeof visit.patientId === 'object' && '_id' in visit.patientId
        ? getDocumentId(visit.patientId)
        : String(visit.patientId);

    await patientRepository.updateWithAudit(
      patientId,
      { $set: { status: PatientStatus.InConsultation } },
      auth.userId,
      'Patient',
    );

    const today = toISODateString(new Date());
    const token = await queueTokenRepository.findTodayByPatient(patientId, today);
    if (token && token.status === QueueTokenStatus.Waiting) {
      await queueTokenRepository.updateWithAudit(
        getDocumentId(token),
        { $set: { status: QueueTokenStatus.InProgress } },
        auth.userId,
        'QueueToken',
      );
    }

    return this.enrichVisitSummary(updated ?? visit);
  }

  async saveDraft(id: string, input: ConsultationDraftInput, auth: AuthContext): Promise<ConsultationRecord> {
    await connectToDatabase();
    const visit = await this.getVisitOrThrow(id);
    this.assertCanAccessVisit();

    if ([VisitStatus.Completed, VisitStatus.Cancelled].includes(visit.status)) {
      throw new ConflictError('Cannot update a completed or cancelled visit');
    }

    const consultationUpdate: Record<string, unknown> = {};

    if (input.chiefComplaint !== undefined) {
      consultationUpdate.chiefComplaint = sanitizeString(input.chiefComplaint);
    }
    if (input.presentIllness !== undefined) {
      consultationUpdate['consultation.presentIllness'] = sanitizeString(input.presentIllness);
    }
    if (input.clinicalFindings !== undefined) {
      consultationUpdate['consultation.clinicalFindings'] = sanitizeString(input.clinicalFindings);
    }
    if (input.diagnosis !== undefined) {
      consultationUpdate['consultation.diagnosis'] = sanitizeString(input.diagnosis);
    }
    if (input.clinicalNotes !== undefined) {
      consultationUpdate['consultation.clinicalNotes'] = sanitizeString(input.clinicalNotes);
    }
    if (input.additionalNotes !== undefined) {
      consultationUpdate['consultation.additionalNotes'] = sanitizeString(input.additionalNotes);
    }
    if (input.treatmentRecommendation !== undefined) {
      consultationUpdate['consultation.treatmentRecommendation'] = sanitizeString(
        input.treatmentRecommendation,
      );
    }
    if (input.advice !== undefined) {
      consultationUpdate['consultation.advice'] = sanitizeString(input.advice);
    }
    if (input.followUpDate !== undefined) {
      consultationUpdate['consultation.followUpDate'] = input.followUpDate
        ? new Date(input.followUpDate)
        : null;
    }
    if (input.followUpTime !== undefined) {
      consultationUpdate['consultation.followUpTime'] = input.followUpTime;
    }
    if (input.followUpPurpose !== undefined) {
      consultationUpdate['consultation.followUpPurpose'] = sanitizeString(input.followUpPurpose);
    }
    if (input.followUpReminder !== undefined) {
      consultationUpdate['consultation.followUpReminder'] = input.followUpReminder;
    }
    if (input.followUpNotes !== undefined) {
      consultationUpdate['consultation.followUpNotes'] = sanitizeString(input.followUpNotes);
    }

    const topLevel: Record<string, unknown> = { ...consultationUpdate };
    if (input.chiefComplaint !== undefined) {
      topLevel.chiefComplaint = sanitizeString(input.chiefComplaint);
      delete topLevel['consultation.chiefComplaint'];
    }

    const updated = await visitRepository.updateWithAudit(
      id,
      { $set: topLevel },
      auth.userId,
      'Visit',
    );

    return mapConsultationRecord(updated ?? visit);
  }

  async completeVisit(id: string, auth: AuthContext): Promise<VisitSummary> {
    await connectToDatabase();
    const visit = await this.getVisitOrThrow(id);
    this.assertCanAccessVisit();

    if (visit.status === VisitStatus.Cancelled) {
      throw new ConflictError('Cannot complete a cancelled visit');
    }

    const hasClinicalData =
      visit.consultation?.diagnosis?.trim() ||
      visit.consultation?.clinicalNotes?.trim() ||
      visit.consultation?.clinicalFindings?.trim();
    if (!hasClinicalData) {
      throw new UnprocessableError('Diagnosis or clinical notes are required to complete the visit');
    }

    let bill = await BillModel.findOne({
      visitId: new Types.ObjectId(id),
      isDeleted: false,
      status: { $ne: BillStatus.Cancelled },
    })
      .select('status')
      .lean<{ status: string }>()
      .exec();

    if (!bill) {
      bill = await billService.createBillFromVisit(id, auth);
    }

    const nextStatus =
      bill && bill.status !== 'finalized' && bill.status !== 'paid'
        ? VisitStatus.BillingPending
        : VisitStatus.Completed;

    const updated = await visitRepository.updateWithAudit(
      id,
      {
        $set: {
          status: nextStatus,
          completedAt: new Date(),
        },
      },
      auth.userId,
      'Visit',
    );

    const patientId =
      typeof visit.patientId === 'object' && '_id' in visit.patientId
        ? getDocumentId(visit.patientId)
        : String(visit.patientId);

    await patientRepository.updateWithAudit(
      patientId,
      {
        $set: {
          status:
            nextStatus === VisitStatus.BillingPending
              ? PatientStatus.BillingPending
              : PatientStatus.Completed,
        },
      },
      auth.userId,
      'Patient',
    );

    if (visit.appointmentId) {
      const appointmentId =
        typeof visit.appointmentId === 'object' && '_id' in visit.appointmentId
          ? getDocumentId(visit.appointmentId)
          : String(visit.appointmentId);
      
      await appointmentRepository.updateWithAudit(
        appointmentId,
        { $set: { status: AppointmentStatus.Completed } },
        auth.userId,
        'Appointment',
      );
    }

    return this.enrichVisitSummary(updated ?? visit);
  }

  async cancelVisit(id: string, reason: string, auth: AuthContext): Promise<VisitSummary> {
    await connectToDatabase();
    const visit = await this.getVisitOrThrow(id);
    this.assertCanAccessVisit();

    if (visit.status === VisitStatus.Completed) {
      throw new ConflictError('Cannot cancel a completed visit');
    }

    const updated = await visitRepository.updateWithAudit(
      id,
      {
        $set: {
          status: VisitStatus.Cancelled,
          cancelledAt: new Date(),
          cancelReason: sanitizeString(reason),
        },
      },
      auth.userId,
      'Visit',
    );

    return this.enrichVisitSummary(updated ?? visit);
  }

  async getConsultation(visitId: string): Promise<ConsultationRecord> {
    await connectToDatabase();
    const visit = await this.getVisitOrThrow(visitId);
    return mapConsultationRecord(visit);
  }

  async getWorkspace(visitId: string): Promise<ConsultationWorkspaceData> {
    await connectToDatabase();
    const visit = await this.getVisitOrThrow(visitId);
    const visitSummary = await this.enrichVisitSummary(visit);
    const patientId =
      typeof visit.patientId === 'object' && '_id' in visit.patientId
        ? getDocumentId(visit.patientId)
        : String(visit.patientId);

    const doctorId =
      typeof visit.doctorId === 'object' && '_id' in visit.doctorId
        ? getDocumentId(visit.doctorId)
        : String(visit.doctorId);

    const [treatmentPlan, prescription, xrayRequests, files, upcoming] = await Promise.all([
      treatmentPlanRepository.findByVisitId(visitId),
      prescriptionRepository.findByVisitId(visitId),
      xrayRequestRepository.findByVisitId(visitId),
      FileModel.find({ visitId, isDeleted: false }).sort({ createdAt: -1 }).lean().exec(),
      appointmentRepository.findUpcoming(30, doctorId, patientId),
    ]);

    const nextAppointment = upcoming[0]
      ? {
          id: getDocumentId(upcoming[0]),
          patientId,
          patientName: visitSummary.patient.fullName,
          hospitalId: visitSummary.patient.patientId,
          date: toISODateString(upcoming[0].date),
          startTime: upcoming[0].startTime,
          endTime: upcoming[0].endTime,
          type: upcoming[0].type,
          status: upcoming[0].status,
          chiefComplaint: upcoming[0].chiefComplaint,
        }
      : null;

    return buildWorkspaceData(
      visitSummary,
      mapConsultationRecord(visit),
      treatmentPlan ? mapTreatmentPlan(treatmentPlan) : null,
      prescription ? mapPrescription(prescription) : null,
      xrayRequests.map(mapXrayRequest),
      files.map(mapVisitFile),
      nextAppointment,
    );
  }

  async updateDiagnosis(visitId: string, diagnosis: string, auth: AuthContext) {
    return this.saveDraft(visitId, { diagnosis }, auth);
  }

  async updateFindings(
    visitId: string,
    data: {
      clinicalFindings: string;
      presentIllness?: string;
      treatmentRecommendation?: string;
      additionalNotes?: string;
    },
    auth: AuthContext,
  ) {
    return this.saveDraft(visitId, data, auth);
  }

  async updateNotes(visitId: string, clinicalNotes: string, auth: AuthContext) {
    return this.saveDraft(visitId, { clinicalNotes }, auth);
  }

  async updateAdvice(visitId: string, advice: string, auth: AuthContext) {
    return this.saveDraft(visitId, { advice }, auth);
  }

  async updateFollowUp(
    visitId: string,
    data: ConsultationDraftInput,
    auth: AuthContext,
  ) {
    return this.saveDraft(visitId, data, auth);
  }

  async getTreatmentPlan(visitId: string): Promise<TreatmentPlanDto | null> {
    await connectToDatabase();
    await this.getVisitOrThrow(visitId);
    const plan = await treatmentPlanRepository.findByVisitId(visitId);
    return plan ? mapTreatmentPlan(plan) : null;
  }

  async createTreatmentPlan(
    visitId: string,
    input: CreateTreatmentPlanInput,
    auth: AuthContext,
  ): Promise<TreatmentPlanDto> {
    await connectToDatabase();
    const visit = await this.getVisitOrThrow(visitId);
    this.assertCanAccessVisit();

    const existing = await treatmentPlanRepository.findByVisitId(visitId);
    if (existing) {
      throw new ConflictError('Treatment plan already exists for this visit');
    }

    const totalEstimatedCost = input.treatments.reduce((sum, t) => sum + t.estimatedCost, 0);
    const patientId =
      typeof visit.patientId === 'object' && '_id' in visit.patientId
        ? getDocumentId(visit.patientId)
        : String(visit.patientId);

    const doc = await TreatmentPlanModel.create({
      visitId: new Types.ObjectId(visitId),
      patientId: new Types.ObjectId(patientId),
      doctorId: new Types.ObjectId(auth.userId),
      name: input.name,
      description: input.description,
      treatments: input.treatments,
      totalEstimatedCost,
      validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
      createdBy: new Types.ObjectId(auth.userId),
      isDeleted: false,
    });

    return mapTreatmentPlan(doc.toObject());
  }

  async updateTreatmentPlan(
    visitId: string,
    input: UpdateTreatmentPlanInput,
    auth: AuthContext,
  ): Promise<TreatmentPlanDto> {
    await connectToDatabase();
    await this.getVisitOrThrow(visitId);
    this.assertCanAccessVisit();

    const plan = await treatmentPlanRepository.findByVisitId(visitId);
    if (!plan) {
      throw new NotFoundError('Treatment plan');
    }

    const update: Record<string, unknown> = { updatedBy: auth.userId };
    if (input.name) update.name = input.name;
    if (input.description !== undefined) update.description = input.description;
    if (input.status) update.status = input.status;
    if (input.validUntil) update.validUntil = new Date(input.validUntil);
    if (input.treatments) {
      update.treatments = input.treatments;
      update.totalEstimatedCost = input.treatments.reduce((sum, t) => sum + t.estimatedCost, 0);
    }

    const updated = await treatmentPlanRepository.updateWithAudit(
      getDocumentId(plan),
      { $set: update },
      auth.userId,
      'TreatmentPlan',
    );

    return mapTreatmentPlan(updated ?? plan);
  }

  async getPrescription(visitId: string): Promise<PrescriptionDto | null> {
    await connectToDatabase();
    const prescription = await prescriptionRepository.findByVisitId(visitId);
    return prescription ? mapPrescription(prescription) : null;
  }

  async savePrescription(
    visitId: string,
    input: CreatePrescriptionInput,
    auth: AuthContext,
  ): Promise<PrescriptionDto> {
    await connectToDatabase();
    const visit = await this.getVisitOrThrow(visitId);
    this.assertCanAccessVisit();

    if (
      ![VisitStatus.WithDoctor, VisitStatus.TreatmentInProgress, VisitStatus.BillingPending].includes(
        visit.status,
      )
    ) {
      throw new ConflictError('Prescription can only be saved during an active visit');
    }

    const patientId =
      typeof visit.patientId === 'object' && '_id' in visit.patientId
        ? getDocumentId(visit.patientId)
        : String(visit.patientId);

    const existing = await prescriptionRepository.findByVisitId(visitId);

    if (existing) {
      const updated = await prescriptionRepository.updateWithAudit(
        getDocumentId(existing),
        {
          $set: {
            medications: input.medications,
            generalInstructions: input.generalInstructions,
            followUpDate: input.followUpDate ? new Date(input.followUpDate) : undefined,
            updatedBy: auth.userId,
          },
        },
        auth.userId,
        'Prescription',
      );
      return mapPrescription(updated ?? existing);
    }

    const doc = await PrescriptionModel.create({
      visitId: new Types.ObjectId(visitId),
      patientId: new Types.ObjectId(patientId),
      doctorId: new Types.ObjectId(auth.userId),
      medications: input.medications,
      generalInstructions: input.generalInstructions,
      followUpDate: input.followUpDate ? new Date(input.followUpDate) : undefined,
      status: PrescriptionStatus.Active,
      createdBy: new Types.ObjectId(auth.userId),
      isDeleted: false,
    });

    return mapPrescription(doc.toObject());
  }

  async getXrayRequests(visitId: string): Promise<XrayRequestDto[]> {
    await connectToDatabase();
    const requests = await xrayRequestRepository.findByVisitId(visitId);
    return requests.map(mapXrayRequest);
  }

  async createXrayRequest(
    visitId: string,
    input: XrayRequestInput,
    auth: AuthContext,
  ): Promise<XrayRequestDto> {
    await connectToDatabase();
    const visit = await this.getVisitOrThrow(visitId);
    this.assertCanAccessVisit();

    const patientId =
      typeof visit.patientId === 'object' && '_id' in visit.patientId
        ? getDocumentId(visit.patientId)
        : String(visit.patientId);

    const doc = await XrayRequestModel.create({
      visitId: new Types.ObjectId(visitId),
      patientId: new Types.ObjectId(patientId),
      doctorId: new Types.ObjectId(auth.userId),
      type: input.type,
      customType: input.customType,
      toothNumbers: input.toothNumbers,
      notes: input.notes,
      status: XrayRequestStatus.Pending,
      requestedAt: new Date(),
      createdBy: new Types.ObjectId(auth.userId),
      isDeleted: false,
    });

    const receptionists = await UserModel.find({
      role: UserRole.Receptionist,
      status: UserStatus.Active,
      isDeleted: false,
    })
      .select('_id')
      .lean<{ _id: Types.ObjectId }[]>()
      .exec();

    const patientName = await patientRepository.findById(patientId);
    const label = patientName
      ? `${patientName.firstName} ${patientName.lastName}`
      : 'Patient';

    await NotificationModel.insertMany(
      receptionists.map((r) => ({
        userId: r._id,
        type: NotificationType.XrayRequest,
        priority: NotificationPriority.High,
        status: NotificationStatus.Unread,
        title: 'X-ray Request',
        message: `Dr. requested ${input.type.replace('_', ' ')} for ${label}`,
        resource: 'visits',
        resourceId: visitId,
        isDeleted: false,
      })),
    );

    return mapXrayRequest(doc.toObject());
  }

  async searchMedicines(query: string, limit = 20): Promise<MedicineSearchResult[]> {
    await connectToDatabase();
    const medicines = await medicineRepository.search(query, limit);
    return medicines.map(mapMedicine);
  }

  async searchTreatments(query: string, limit = 20): Promise<TreatmentSearchResult[]> {
    await connectToDatabase();
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const treatments = await TreatmentModel.find({
      isDeleted: false,
      isActive: true,
      $or: [{ procedureName: regex }, { procedureCode: regex }],
    })
      .limit(limit)
      .lean()
      .exec();

    return treatments.map(mapTreatmentSearch);
  }

  async getDoctorDashboard(doctorId: string): Promise<DoctorDashboardData> {
    await connectToDatabase();

    const [waiting, inConsultation, completed, upcoming, recentVisits] = await Promise.all([
      visitRepository.findTodayByDoctor(doctorId, VisitStatus.WaitingRoom),
      visitRepository.findTodayByDoctor(doctorId, [
        VisitStatus.WithDoctor,
        VisitStatus.TreatmentInProgress,
      ]),
      visitRepository.findTodayByDoctor(doctorId, [
        VisitStatus.Completed,
        VisitStatus.BillingPending,
      ]),
      appointmentRepository.findUpcoming(7, doctorId),
      VisitModel.find({ doctorId, isDeleted: false })
        .populate('patientId')
        .sort({ date: -1 })
        .limit(8)
        .lean<IVisit[]>()
        .exec(),
    ]);

    const waitingPatients = await Promise.all(waiting.map((v) => this.enrichVisitSummary(v)));
    const inConsultationPatients = await Promise.all(
      inConsultation.map((v) => this.enrichVisitSummary(v)),
    );
    const completedToday = await Promise.all(completed.map((v) => this.enrichVisitSummary(v)));

    const upcomingAppointments = upcoming.map((a) => {
      const patient = a.patientId as unknown as { patientId: string; firstName: string; lastName: string };
      return {
        id: getDocumentId(a),
        patientId: String(a.patientId),
        patientName: patient?.firstName ? `${patient.firstName} ${patient.lastName}` : 'Patient',
        hospitalId: patient?.patientId ?? '',
        date: toISODateString(a.date),
        startTime: a.startTime,
        endTime: a.endTime,
        type: a.type,
        status: a.status,
        chiefComplaint: a.chiefComplaint,
      };
    });

    const seenPatients = new Set<string>();
    const recentPatients = [];
    for (const visit of recentVisits) {
      const patient = visit.patientId as unknown as Parameters<typeof mapVisitPatient>[0];
      if (!patient || !('_id' in patient)) continue;
      const pid = getDocumentId(patient);
      if (seenPatients.has(pid)) continue;
      seenPatients.add(pid);
      recentPatients.push(mapVisitPatient(patient));
      if (recentPatients.length >= 6) break;
    }

    return {
      stats: {
        todayTotal: waiting.length + inConsultation.length + completed.length,
        waiting: waiting.length,
        inConsultation: inConsultation.length,
        completed: completed.length,
      },
      waitingPatients,
      inConsultation: inConsultationPatients,
      completedToday,
      upcomingAppointments,
      recentPatients,
    };
  }

  async searchClinicalHistory(
    patientId: string,
    query?: string,
    type?: string,
  ): Promise<ClinicalHistorySearchResult> {
    await connectToDatabase();
    await patientRepository.findByIdOrThrow(patientId, 'Patient');

    const q = query?.toLowerCase().trim();
    const match = (text: string) => !q || text.toLowerCase().includes(q);

    const [visits, prescriptions, xrays, bills] = await Promise.all([
      VisitModel.find({ patientId, isDeleted: false }).sort({ date: -1 }).limit(50).lean().exec(),
      PrescriptionModel.find({ patientId, isDeleted: false }).sort({ createdAt: -1 }).limit(50).lean().exec(),
      XRayModel.find({ patientId, isDeleted: false }).sort({ createdAt: -1 }).limit(50).lean().exec(),
      BillModel.find({ patientId, isDeleted: false }).sort({ createdAt: -1 }).limit(50).lean().exec(),
    ]);

    const result: ClinicalHistorySearchResult = {
      diagnoses: [],
      prescriptions: [],
      treatments: [],
      xrays: [],
      bills: [],
      notes: [],
      procedures: [],
    };

    for (const visit of visits) {
      const date = toISODateString(visit.date);
      const id = getDocumentId(visit);

      if (visit.consultation?.diagnosis && match(visit.consultation.diagnosis)) {
        result.diagnoses.push({
          id,
          date,
          summary: visit.consultation.diagnosis,
          type: 'diagnosis',
        });
      }

      if (visit.consultation?.clinicalNotes && match(visit.consultation.clinicalNotes)) {
        result.notes.push({
          id,
          date,
          summary: visit.consultation.clinicalNotes.slice(0, 120),
          details: visit.consultation.clinicalNotes,
          type: 'note',
        });
      }

      if (visit.chiefComplaint && match(visit.chiefComplaint)) {
        result.procedures.push({
          id,
          date,
          summary: visit.chiefComplaint,
          type: 'procedure',
        });
      }
    }

    for (const rx of prescriptions) {
      const summary = rx.medications.map((m) => m.name).join(', ');
      if (match(summary)) {
        result.prescriptions.push({
          id: getDocumentId(rx),
          date: toISODateString(rx.createdAt),
          summary,
          type: 'prescription',
        });
      }
    }

    for (const xray of xrays) {
      const summary = `${xray.type}${xray.findings ? `: ${xray.findings}` : ''}`;
      if (match(summary)) {
        result.xrays.push({
          id: getDocumentId(xray),
          date: toISODateString(xray.createdAt),
          summary,
          type: 'xray',
        });
      }
    }

    for (const bill of bills) {
      const summary = `Bill ${bill.billNumber} — ₹${bill.totalAmount}`;
      if (match(summary)) {
        result.bills.push({
          id: getDocumentId(bill),
          date: toISODateString(bill.createdAt),
          summary,
          type: 'bill',
        });
      }
    }

    const plans = await TreatmentPlanModel.find({ patientId, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
      .exec();

    for (const plan of plans) {
      for (const t of plan.treatments) {
        if (match(t.procedureName)) {
          result.treatments.push({
            id: getDocumentId(plan),
            date: toISODateString(plan.createdAt),
            summary: t.procedureName,
            type: 'treatment',
          });
        }
      }
    }

    if (type && type in result) {
      const filtered = { ...result };
      for (const key of Object.keys(filtered) as (keyof ClinicalHistorySearchResult)[]) {
        if (key !== type) {
          filtered[key] = [];
        }
      }
      return filtered;
    }

    return result;
  }
}

export const visitService = new VisitService();
