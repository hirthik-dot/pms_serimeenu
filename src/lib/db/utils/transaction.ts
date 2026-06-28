// =============================================================================
// MongoDB Transaction Helper
// =============================================================================

import mongoose, { type ClientSession } from 'mongoose';

import { connectToDatabase } from '@/lib/db/connection';
import { logger } from '@/lib/logger';

export type TransactionCallback<T> = (session: ClientSession | undefined) => Promise<T>;

export async function withTransaction<T>(callback: TransactionCallback<T>): Promise<T> {
  await connectToDatabase();

  // Attempt to use a real transaction
  try {
    const session = await mongoose.startSession();

    try {
      let result: T;
      await session.withTransaction(async () => {
        result = await callback(session);
      });
      return result!;
    } finally {
      await session.endSession();
    }
  } catch (error: unknown) {
    // If the cluster doesn't support transactions (e.g. M0 free tier),
    // fall back to running without a transaction.
    const message = error instanceof Error ? error.message : String(error);
    const isTransactionUnsupported =
      message.includes('sharded cluster') ||
      message.includes('Transaction') ||
      message.includes('transaction');

    if (isTransactionUnsupported) {
      logger.warn('Transactions not supported on this cluster — running without transaction', {
        error: message,
      });
      return callback(undefined);
    }

    throw error;
  }
}

export async function startSession(): Promise<ClientSession> {
  await connectToDatabase();
  return mongoose.startSession();
}

