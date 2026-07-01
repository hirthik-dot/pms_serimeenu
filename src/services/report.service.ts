import { connectToDatabase } from '@/lib/db';
import { BillModel } from '@/models/bill.model';
import { PatientModel } from '@/models/patient.model';
import { PaymentModel } from '@/models/payment.model';
import { VisitModel } from '@/models/visit.model';
import { appointmentRepository } from '@/repositories/appointment.repository';
import { prescriptionRepository } from '@/repositories/consultation.repository';
import { patientRepository } from '@/repositories/patient.repository';
import { billService } from '@/services/bill.service';
import { patientService } from '@/services/patient.service';
import { BillStatus, PatientStatus, PatientType, VisitStatus } from '@/types/enums';
import type { IPrescription } from '@/types/models';
import { getDocumentId } from '@/utils/mongoose';

export interface ExecutiveDashboardData {
  revenue: {
    today: number;
    month: number;
    outstanding: number;
    pendingBills: number;
  };
  patients: {
    todayVisits: number;
    newPatientsMonth: number;
    totalActive: number;
  };
  appointments: {
    today: number;
    completed: number;
    cancelled: number;
  };
  topTreatments: Array<{ name: string; count: number; revenue: number }>;
  revenueByDay: Array<{ date: string; amount: number }>;
}

class ReportService {
  async getExecutiveDashboard(): Promise<ExecutiveDashboardData> {
    await connectToDatabase();

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayPayments, monthPayments, outstandingAgg, pendingBills, todayVisits, newPatients, activePatients, todayAppointments] =
      await Promise.all([
        PaymentModel.aggregate<{ total: number }>([
          {
            $match: {
              isDeleted: false,
              isRefund: false,
              createdAt: { $gte: todayStart, $lte: todayEnd },
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        PaymentModel.aggregate<{ total: number }>([
          {
            $match: {
              isDeleted: false,
              isRefund: false,
              createdAt: { $gte: monthStart },
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        BillModel.aggregate<{ total: number }>([
          { $match: { isDeleted: false, balanceAmount: { $gt: 0 } } },
          { $group: { _id: null, total: { $sum: '$balanceAmount' } } },
        ]),
        BillModel.countDocuments({
          isDeleted: false,
          status: { $in: [BillStatus.Finalized, BillStatus.PartiallyPaid] },
          balanceAmount: { $gt: 0 },
        }),
        VisitModel.countDocuments({
          isDeleted: false,
          date: { $gte: todayStart, $lte: todayEnd },
        }),
        PatientModel.countDocuments({
          isDeleted: false,
          createdAt: { $gte: monthStart },
        }),
        PatientModel.countDocuments({ isDeleted: false, status: PatientStatus.Active }),
        appointmentRepository.search({
          dateFrom: todayStart.toISOString(),
          dateTo: todayEnd.toISOString(),
          limit: 500,
          page: 1,
        }),
      ]);

    const revenueByDay = await PaymentModel.aggregate<{ date: string; amount: number }>([
      {
        $match: {
          isDeleted: false,
          isRefund: false,
          createdAt: { $gte: monthStart },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          amount: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', amount: 1, _id: 0 } },
    ]);

    const topTreatments = await BillModel.aggregate<{ name: string; count: number; revenue: number }>([
      { $match: { isDeleted: false, createdAt: { $gte: monthStart } } },
      { $unwind: '$lineItems' },
      {
        $group: {
          _id: '$lineItems.description',
          count: { $sum: '$lineItems.quantity' },
          revenue: { $sum: '$lineItems.total' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      { $project: { name: '$_id', count: 1, revenue: 1, _id: 0 } },
    ]);

    const aptData = todayAppointments.data;
    const completedApts = aptData.filter((a) => a.status === 'completed').length;
    const cancelledApts = aptData.filter((a) => a.status === 'cancelled').length;

    return {
      revenue: {
        today: todayPayments[0]?.total ?? 0,
        month: monthPayments[0]?.total ?? 0,
        outstanding: outstandingAgg[0]?.total ?? 0,
        pendingBills,
      },
      patients: {
        todayVisits,
        newPatientsMonth: newPatients,
        totalActive: activePatients,
      },
      appointments: {
        today: aptData.length,
        completed: completedApts,
        cancelled: cancelledApts,
      },
      topTreatments,
      revenueByDay,
    };
  }

  async getRevenueReport(dateFrom?: string, dateTo?: string) {
    await connectToDatabase();
    const match: Record<string, unknown> = { isDeleted: false, isRefund: false };
    if (dateFrom || dateTo) {
      const createdAt: Record<string, Date> = {};
      if (dateFrom) createdAt.$gte = new Date(dateFrom);
      if (dateTo) createdAt.$lte = new Date(dateTo);
      match.createdAt = createdAt;
    }

    const byMethod = await PaymentModel.aggregate([
      { $match: match },
      { $group: { _id: '$method', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    const total = byMethod.reduce((s, m) => s + m.total, 0);

    return { total, byMethod, dateFrom, dateTo };
  }

  async getPatientAnalytics() {
    await connectToDatabase();
    const [total, byGender, pediatric] = await Promise.all([
      PatientModel.countDocuments({ isDeleted: false }),
      PatientModel.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$gender', count: { $sum: 1 } } },
      ]),
      PatientModel.countDocuments({ isDeleted: false, patientType: PatientType.Pediatric }),
    ]);

    return {
      total,
      byGender,
      pediatric,
      adult: total - pediatric,
    };
  }

  async getDoctorPerformance(dateFrom?: string, dateTo?: string) {
    await connectToDatabase();
    const match: Record<string, unknown> = { isDeleted: false };
    if (dateFrom || dateTo) {
      const date: Record<string, Date> = {};
      if (dateFrom) date.$gte = new Date(dateFrom);
      if (dateTo) date.$lte = new Date(dateTo);
      match.date = date;
    }

    const byDoctor = await VisitModel.aggregate([
      { $match: { ...match, status: VisitStatus.Completed } },
      { $group: { _id: '$doctorId', visits: { $sum: 1 } } },
      { $sort: { visits: -1 } },
      { $limit: 10 },
    ]);

    return { byDoctor };
  }

  async getPatientRecords(page = 1, limit = 25, search?: string) {
    await connectToDatabase();
    const result = await patientRepository.search({
      page,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      search,
    });

    return {
      data: result.data.map((p) => ({
        id: getDocumentId(p),
        patientId: p.patientId,
        fullName: `${p.firstName} ${p.lastName}`.trim(),
        phone: p.phone,
        dateOfBirth: new Date(p.dateOfBirth).toISOString(),
        gender: p.gender,
        referredBy: p.referredBy,
        notes: p.notes,
        status: p.status,
        createdAt: new Date(p.createdAt).toISOString(),
      })),
      total: result.meta.total,
      page: result.meta.page,
      limit: result.meta.limit,
    };
  }

  async getPatientRecordDetail(patientId: string) {
    await connectToDatabase();

    const [patient, billsResult, prescriptions] = await Promise.all([
      patientService.getPatient(patientId),
      billService.listBills({ patientId, page: 1, limit: 100, sortOrder: 'desc' }),
      prescriptionRepository.findByPatientId(patientId, 50),
    ]);

    if (!patient) {
      return null;
    }

    return {
      patient,
      bills: billsResult.data,
      prescriptions: prescriptions.map((rx) => mapPrescriptionSummary(rx)),
    };
  }
}

export const reportService = new ReportService();

function mapPrescriptionSummary(rx: IPrescription) {
  const doctor =
    typeof rx.doctorId === 'object' && rx.doctorId && 'firstName' in rx.doctorId
      ? rx.doctorId as { firstName?: string; lastName?: string }
      : null;

  return {
    id: getDocumentId(rx),
    date: new Date(rx.createdAt).toISOString(),
    doctorName: doctor ? `Dr. ${doctor.firstName ?? ''} ${doctor.lastName ?? ''}`.trim() : 'N/A',
    medications: rx.medications.map((m) => ({
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      duration: m.duration,
      durationUnit: m.durationUnit,
      instructions: m.instructions,
    })),
    generalInstructions: rx.generalInstructions,
    followUpDate: rx.followUpDate ? new Date(rx.followUpDate).toISOString() : undefined,
    status: rx.status,
  };
}
