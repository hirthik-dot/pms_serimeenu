import { Types, type ClientSession } from 'mongoose';

import {
  buildBillSearchFilter,
  combineFilters,
  type RepositoryPaginatedResult,
  type RepositoryPaginationOptions,
} from '@/lib/db/utils';
import { BillModel, BILL_POPULATE } from '@/models/bill.model';
import { BaseRepository } from '@/repositories/base.repository';
import type { BillStatus } from '@/types/enums';
import type { IBill } from '@/types/models';

export interface BillFilterOptions extends RepositoryPaginationOptions {
  patientId?: string;
  status?: string;
  search?: string;
  outstandingOnly?: boolean;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  includeDeleted?: boolean;
}

const BILL_SORT_FIELDS = ['createdAt', 'totalAmount', 'dueDate', 'status'];

export class BillRepository extends BaseRepository<IBill> {
  constructor() {
    super(BillModel);
  }

  async findByBillNumber(billNumber: string): Promise<IBill | null> {
    return this.findOne({
      billNumber: billNumber.toUpperCase(),
      isDeleted: false,
    } as never);
  }

  async findByVisitId(visitId: string): Promise<IBill | null> {
    return this.findOne({
      visitId: new Types.ObjectId(visitId),
      isDeleted: false,
    } as never);
  }

  async search(options: BillFilterOptions): Promise<RepositoryPaginatedResult<IBill>> {
    const filter = combineFilters<IBill>(
      options.patientId ? { patientId: new Types.ObjectId(options.patientId) } : null,
      options.status ? ({ status: options.status } as never) : null,
      options.outstandingOnly ? { balanceAmount: { $gt: 0 } } : null,
      options.search ? buildBillSearchFilter<IBill>(options.search) : null,
    );

    return this.findWithFilters(filter as never, {
      ...options,
      allowedSortFields: BILL_SORT_FIELDS,
      populate: BILL_POPULATE.list,
    });
  }

  async findOutstanding(
    options: BillFilterOptions = {},
  ): Promise<RepositoryPaginatedResult<IBill>> {
    return this.search({
      ...options,
      outstandingOnly: true,
      status: options.status,
    });
  }

  async findByIdWithDetails(id: string): Promise<IBill | null> {
    return BillModel.findById(id)
      .populate(BILL_POPULATE.detail)
      .lean<IBill>()
      .exec();
  }

  async createBill(data: Partial<IBill>, session?: ClientSession): Promise<IBill> {
    const doc = await BillModel.create([data], { session });
    return doc[0]!.toObject() as IBill;
  }

  async updatePaymentAmounts(
    billId: string,
    paidAmount: number,
    balanceAmount: number,
    status: BillStatus,
    session?: ClientSession,
  ): Promise<IBill> {
    return this.updateWithAudit(
      billId,
      {
        $set: { paidAmount, balanceAmount, status },
      },
      undefined,
      'Bill',
      session,
    );
  }
}

export const billRepository = new BillRepository();
