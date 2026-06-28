// =============================================================================
// MongoDB Transaction Helper
// =============================================================================

import mongoose, { type ClientSession } from 'mongoose';

import { connectToDatabase } from '@/lib/db/connection';

export type TransactionCallback<T> = (session: ClientSession) => Promise<T>;

export async function withTransaction<T>(callback: TransactionCallback<T>): Promise<T> {
  await connectToDatabase();
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
}

export async function startSession(): Promise<ClientSession> {
  await connectToDatabase();
  return mongoose.startSession();
}
