import { Types } from 'mongoose';

import { connectToDatabase, nextInvoiceNumber } from '@/lib/db';
import {
  ConflictError,
  NotFoundError,
  UnprocessableError,
  ValidationError,
} from '@/lib/errors';
import { ClinicSettingsModel } from '@/models/clinic-settings.model';
import { PaymentModel } from '@/models/payment.model';
import { VisitModel } from '@/models/visit.model';
import { billRepository } from '@/repositories/bill.repository';
import { prescriptionRepository, treatmentPlanRepository } from '@/repositories/consultation.repository';
import { paymentRepository } from '@/repositories/payment.repository';
import type { AuthContext } from '@/types/auth';
import { BillStatus, PaymentMethod, PaymentStatus } from '@/types/enums';
import type { IBill, IBillLineItem, IClinicSettings, IPayment } from '@/types/models';
import { getDocumentId } from '@/utils/mongoose';
import type {
  CreateBillInput,
  CreatePaymentInput,
  ListBillsInput,
  RefundPaymentInput,
  SplitPaymentInput,
  UpdateBillInput,
} from '@/validators/billing.validator';

export interface BillDto {
  id: string;
  billNumber: string;
  visitId: string;
  patientId: string;
  patientName?: string;
  lineItems: Array<{
    treatmentId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
  }>;
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: BillStatus;
  notes?: string;
  dueDate?: string;
  createdAt: string;
}

export interface PaymentDto {
  id: string;
  receiptNumber: string;
  billId: string;
  billNumber?: string;
  patientId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  referenceNumber?: string;
  notes?: string;
  isRefund: boolean;
  receivedByName?: string;
  createdAt: string;
}

function roundCurrency(n: number): number {
  return Math.round(n * 100) / 100;
}

function computeLineTotal(item: { quantity: number; unitPrice: number; discount: number }): number {
  return roundCurrency(item.quantity * item.unitPrice - item.discount);
}

async function getClinicSettings(): Promise<IClinicSettings | null> {
  return ClinicSettingsModel.findOne({ isDeleted: false }).lean<IClinicSettings>().exec();
}

function calculateBillTotals(
  lineItems: IBillLineItem[],
  discountPercentage: number,
  discountAmount: number,
  gstEnabled: boolean,
  gstRate: number,
) {
  const subtotal = roundCurrency(
    lineItems.reduce((sum, item) => sum + item.total, 0),
  );

  const pctDiscount = roundCurrency(subtotal * (discountPercentage / 100));
  const totalDiscount = roundCurrency(pctDiscount + discountAmount);
  const afterDiscount = roundCurrency(Math.max(0, subtotal - totalDiscount));

  const taxAmount = gstEnabled ? roundCurrency(afterDiscount * (gstRate / 100)) : 0;
  const totalAmount = roundCurrency(afterDiscount + taxAmount);

  return { subtotal, discountAmount: totalDiscount, taxRate: gstEnabled ? gstRate : 0, taxAmount, totalAmount };
}

function mapBill(bill: IBill): BillDto {
  const patient =
    typeof bill.patientId === 'object' && bill.patientId && '_id' in bill.patientId
      ? bill.patientId as { firstName?: string; lastName?: string }
      : null;

  return {
    id: getDocumentId(bill),
    billNumber: bill.billNumber,
    visitId: String(bill.visitId),
    patientId:
      typeof bill.patientId === 'object' && bill.patientId && '_id' in bill.patientId
        ? getDocumentId(bill.patientId)
        : String(bill.patientId),
    patientName: patient ? `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim() : undefined,
    lineItems: bill.lineItems.map((li) => ({
      treatmentId: li.treatmentId ? String(li.treatmentId) : undefined,
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      discount: li.discount,
      total: li.total,
    })),
    subtotal: bill.subtotal,
    discountPercentage: bill.discountPercentage,
    discountAmount: bill.discountAmount,
    taxRate: bill.taxRate,
    taxAmount: bill.taxAmount,
    totalAmount: bill.totalAmount,
    paidAmount: bill.paidAmount,
    balanceAmount: bill.balanceAmount,
    status: bill.status,
    notes: bill.notes,
    dueDate: bill.dueDate ? new Date(bill.dueDate).toISOString().split('T')[0] : undefined,
    createdAt: new Date(bill.createdAt).toISOString(),
  };
}

function mapPayment(payment: IPayment): PaymentDto {
  const receivedBy =
    typeof payment.receivedBy === 'object' && payment.receivedBy && '_id' in payment.receivedBy
      ? payment.receivedBy as { firstName?: string; lastName?: string }
      : null;

  return {
    id: getDocumentId(payment),
    receiptNumber: payment.receiptNumber,
    billId: String(payment.billId),
    patientId: String(payment.patientId),
    amount: payment.amount,
    method: payment.method,
    status: payment.status,
    referenceNumber: payment.referenceNumber,
    notes: payment.notes,
    isRefund: payment.isRefund,
    receivedByName: receivedBy
      ? `${receivedBy.firstName ?? ''} ${receivedBy.lastName ?? ''}`.trim()
      : undefined,
    createdAt: new Date(payment.createdAt).toISOString(),
  };
}

class BillService {
  async listBills(input: ListBillsInput) {
    await connectToDatabase();
    const result = await billRepository.search({
      page: input.page,
      limit: input.limit,
      sortBy: input.sortBy,
      sortOrder: input.sortOrder,
      patientId: input.patientId,
      status: input.status,
      search: input.search,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
    });
    return {
      data: result.data.map(mapBill),
      total: result.meta.total,
      page: result.meta.page,
      limit: result.meta.limit,
    };
  }

  async getOutstanding(input: ListBillsInput) {
    await connectToDatabase();
    const result = await billRepository.findOutstanding({
      page: input.page,
      limit: input.limit,
      patientId: input.patientId,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
    });
    return {
      data: result.data.map(mapBill),
      total: result.meta.total,
      page: result.meta.page,
      limit: result.meta.limit,
    };
  }

  async getBill(id: string): Promise<BillDto> {
    await connectToDatabase();
    const bill = await billRepository.findByIdWithDetails(id);
    if (!bill) throw new NotFoundError('Bill');
    return mapBill(bill);
  }

  async createBill(input: CreateBillInput, auth: AuthContext): Promise<BillDto> {
    await connectToDatabase();

    const visit = await VisitModel.findById(input.visitId).lean();
    if (!visit || visit.isDeleted) throw new NotFoundError('Visit');

    const existing = await billRepository.findByVisitId(input.visitId);
    if (existing) throw new ConflictError('Bill already exists for this visit');

    const settings = await getClinicSettings();
    const lineItems: IBillLineItem[] = input.lineItems.map((item) => ({
      treatmentId: item.treatmentId ? new Types.ObjectId(item.treatmentId) : undefined,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      total: computeLineTotal(item),
    }));

    const totals = calculateBillTotals(
      lineItems,
      input.discountPercentage,
      input.discountAmount,
      settings?.gstEnabled ?? false,
      settings?.gstRate ?? 18,
    );

    const billNumber = await nextInvoiceNumber();

    const doc = await billRepository.createBill({
      billNumber,
      visitId: new Types.ObjectId(input.visitId),
      patientId: visit.patientId,
      lineItems,
      subtotal: totals.subtotal,
      discountPercentage: input.discountPercentage,
      discountAmount: totals.discountAmount,
      taxRate: totals.taxRate,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      paidAmount: 0,
      balanceAmount: totals.totalAmount,
      status: BillStatus.Draft,
      notes: input.notes,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      createdBy: new Types.ObjectId(auth.userId),
      isDeleted: false,
    });

    return mapBill(doc);
  }

  async createBillFromVisit(visitId: string, auth: AuthContext): Promise<BillDto> {
    await connectToDatabase();

    const visit = await VisitModel.findById(visitId).lean();
    if (!visit || visit.isDeleted) throw new NotFoundError('Visit');

    const [treatmentPlan, prescription, settings] = await Promise.all([
      treatmentPlanRepository.findByVisitId(visitId),
      prescriptionRepository.findByVisitId(visitId),
      getClinicSettings(),
    ]);

    const lineItems: CreateBillInput['lineItems'] = [];

    lineItems.push({
      description: 'Consultation Fee',
      quantity: 1,
      unitPrice: 500,
      discount: 0,
    });

    if (treatmentPlan?.treatments) {
      for (const t of treatmentPlan.treatments) {
        lineItems.push({
          description: t.procedureName,
          quantity: 1,
          unitPrice: t.estimatedCost,
          discount: 0,
        });
      }
    }

    if (prescription?.medications?.length) {
      lineItems.push({
        description: `Prescription (${prescription.medications.length} medicines)`,
        quantity: 1,
        unitPrice: prescription.medications.length * 50,
        discount: 0,
      });
    }

    return this.createBill(
      {
        visitId,
        lineItems,
        discountPercentage: 0,
        discountAmount: 0,
        notes: settings?.invoiceFooter,
      },
      auth,
    );
  }

  async updateBill(id: string, input: UpdateBillInput, auth: AuthContext): Promise<BillDto> {
    await connectToDatabase();
    const bill = await billRepository.findByIdOrThrow(id, 'Bill');

    if (bill.status !== BillStatus.Draft) {
      throw new ConflictError('Only draft bills can be edited');
    }

    const settings = await getClinicSettings();
    const lineItems: IBillLineItem[] = input.lineItems
      ? input.lineItems.map((item) => ({
          treatmentId: item.treatmentId ? new Types.ObjectId(item.treatmentId) : undefined,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          total: computeLineTotal(item),
        }))
      : bill.lineItems;

    const discountPercentage = input.discountPercentage ?? bill.discountPercentage;
    const discountAmtInput = input.discountAmount ?? bill.discountAmount;

    const totals = calculateBillTotals(
      lineItems,
      discountPercentage,
      discountAmtInput,
      settings?.gstEnabled ?? false,
      settings?.gstRate ?? 18,
    );

    const updated = await billRepository.updateWithAudit(
      id,
      {
        $set: {
          lineItems,
          subtotal: totals.subtotal,
          discountPercentage,
          discountAmount: totals.discountAmount,
          taxRate: totals.taxRate,
          taxAmount: totals.taxAmount,
          totalAmount: totals.totalAmount,
          balanceAmount: roundCurrency(totals.totalAmount - bill.paidAmount),
          notes: input.notes ?? bill.notes,
          dueDate: input.dueDate ? new Date(input.dueDate) : bill.dueDate,
          updatedBy: auth.userId,
        },
      },
      auth.userId,
      'Bill',
    );

    return mapBill(updated);
  }

  async finalizeBill(id: string, auth: AuthContext): Promise<BillDto> {
    await connectToDatabase();
    const bill = await billRepository.findByIdOrThrow(id, 'Bill');
    if (bill.status !== BillStatus.Draft) {
      throw new ConflictError('Bill is already finalized');
    }

    const updated = await billRepository.updateWithAudit(
      id,
      {
        $set: {
          status: BillStatus.Finalized,
          finalizedAt: new Date(),
          updatedBy: auth.userId,
        },
      },
      auth.userId,
      'Bill',
    );

    return mapBill(updated);
  }

  async getInvoice(id: string) {
    await connectToDatabase();
    const bill = await billRepository.findByIdWithDetails(id);
    if (!bill) throw new NotFoundError('Bill');

    const settings = await getClinicSettings();
    const payments = await paymentRepository.findByBillId(id);

    return {
      clinic: {
        name: settings?.clinicName ?? 'Dental Clinic',
        phone: settings?.phone,
        email: settings?.email,
        address: settings?.address,
        gstNumber: settings?.gstNumber,
        logo: settings?.logo,
        header: settings?.invoiceHeader,
        footer: settings?.invoiceFooter,
        currencySymbol: settings?.currencySymbol ?? '₹',
      },
      bill: mapBill(bill),
      payments: payments.map(mapPayment),
    };
  }

  async recordPayment(input: CreatePaymentInput, auth: AuthContext): Promise<PaymentDto> {
    await connectToDatabase();

    if (input.idempotencyKey) {
      const existing = await paymentRepository.findByIdempotencyKey(input.idempotencyKey);
      if (existing) return mapPayment(existing);
    }

    const bill = await billRepository.findByIdOrThrow(input.billId, 'Bill');

    if (bill.balanceAmount <= 0) {
      throw new UnprocessableError('Bill is already fully paid');
    }

    if (input.amount > bill.balanceAmount) {
      throw new ValidationError('Payment amount exceeds bill balance');
    }

    if (
      [PaymentMethod.Card, PaymentMethod.UPI, PaymentMethod.BankTransfer].includes(input.method) &&
      !input.referenceNumber
    ) {
      throw new ValidationError('Reference number required for this payment method');
    }

    const { nextReceiptNumber } = await import('@/lib/db');
    const receiptNumber = await nextReceiptNumber();

    const payment = await PaymentModel.create({
      receiptNumber,
      billId: new Types.ObjectId(input.billId),
      patientId: bill.patientId,
      amount: input.amount,
      method: input.method,
      status: PaymentStatus.Success,
      referenceNumber: input.referenceNumber,
      notes: input.notes,
      receivedBy: new Types.ObjectId(auth.userId),
      isRefund: false,
      idempotencyKey: input.idempotencyKey,
      createdBy: new Types.ObjectId(auth.userId),
      isDeleted: false,
    });

    const newPaid = roundCurrency(bill.paidAmount + input.amount);
    const newBalance = roundCurrency(bill.totalAmount - newPaid);
    const newStatus =
      newBalance <= 0
        ? BillStatus.Paid
        : newPaid > 0
          ? BillStatus.PartiallyPaid
          : bill.status;

    await billRepository.updatePaymentAmounts(
      input.billId,
      newPaid,
      Math.max(0, newBalance),
      newStatus,
    );

    return mapPayment(payment.toObject());
  }

  async splitPayment(input: SplitPaymentInput, auth: AuthContext): Promise<PaymentDto[]> {
    const total = roundCurrency(input.payments.reduce((s, p) => s + p.amount, 0));
    const bill = await billRepository.findByIdOrThrow(input.billId, 'Bill');

    if (total > bill.balanceAmount) {
      throw new ValidationError('Split payment total exceeds bill balance');
    }

    const results: PaymentDto[] = [];
    for (const p of input.payments) {
      const result = await this.recordPayment(
        {
          billId: input.billId,
          amount: p.amount,
          method: p.method,
          referenceNumber: p.referenceNumber,
          notes: p.notes,
        },
        auth,
      );
      results.push(result);
    }
    return results;
  }

  async refundPayment(paymentId: string, input: RefundPaymentInput, auth: AuthContext): Promise<PaymentDto> {
    await connectToDatabase();
    const payment = await paymentRepository.findByIdOrThrow(paymentId, 'Payment');

    if (payment.isRefund) throw new ConflictError('Cannot refund a refund record');

    const bill = await billRepository.findByIdOrThrow(String(payment.billId), 'Bill');
    const refundAmount = input.amount ?? payment.amount;

    if (refundAmount > payment.amount) {
      throw new ValidationError('Refund amount cannot exceed original payment');
    }

    const { nextReceiptNumber } = await import('@/lib/db');
    const receiptNumber = await nextReceiptNumber();

    const refund = await PaymentModel.create({
      receiptNumber,
      billId: payment.billId,
      patientId: payment.patientId,
      amount: -refundAmount,
      method: payment.method,
      status: PaymentStatus.Refunded,
      notes: input.reason,
      receivedBy: new Types.ObjectId(auth.userId),
      isRefund: true,
      refundReason: input.reason,
      refundedPaymentId: new Types.ObjectId(paymentId),
      createdBy: new Types.ObjectId(auth.userId),
      isDeleted: false,
    });

    const newPaid = roundCurrency(bill.paidAmount - refundAmount);
    const newBalance = roundCurrency(bill.totalAmount - newPaid);

    await billRepository.updatePaymentAmounts(
      getDocumentId(bill),
      Math.max(0, newPaid),
      newBalance,
      newBalance <= 0 ? BillStatus.Paid : BillStatus.PartiallyPaid,
    );

    return mapPayment(refund.toObject());
  }

  async getReceipt(paymentId: string) {
    await connectToDatabase();
    const payment = await paymentRepository.findByIdWithDetails(paymentId);
    if (!payment) throw new NotFoundError('Payment');

    const settings = await getClinicSettings();
    const bill = await billRepository.findByIdWithDetails(String(payment.billId));

    return {
      clinic: {
        name: settings?.clinicName ?? 'Dental Clinic',
        phone: settings?.phone,
        address: settings?.address,
        currencySymbol: settings?.currencySymbol ?? '₹',
      },
      payment: mapPayment(payment),
      bill: bill ? mapBill(bill) : undefined,
    };
  }
}

export const billService = new BillService();
