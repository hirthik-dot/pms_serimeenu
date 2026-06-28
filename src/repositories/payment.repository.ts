import { Types } from 'mongoose';

import { PaymentModel, PAYMENT_POPULATE } from '@/models/payment.model';
import { BaseRepository } from '@/repositories/base.repository';
import type { IPayment } from '@/types/models';

export class PaymentRepository extends BaseRepository<IPayment> {
  constructor() {
    super(PaymentModel);
  }

  async findByBillId(billId: string): Promise<IPayment[]> {
    return PaymentModel.find({
      billId: new Types.ObjectId(billId),
      isDeleted: false,
    })
      .populate([...PAYMENT_POPULATE.list])
      .sort({ createdAt: -1 })
      .lean<IPayment[]>()
      .exec();
  }

  async findByIdempotencyKey(key: string): Promise<IPayment | null> {
    return this.findOne({ idempotencyKey: key, isDeleted: false } as never);
  }

  async findByIdWithDetails(id: string): Promise<IPayment | null> {
    return PaymentModel.findById(id)
      .populate([...PAYMENT_POPULATE.detail])
      .lean<IPayment>()
      .exec();
  }
}

export const paymentRepository = new PaymentRepository();
