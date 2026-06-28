import mongoose from 'mongoose';

import { getEnv } from '@/config/env';
import { logger } from '@/lib/logger';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  const { MONGODB_URI, DATABASE_NAME } = getEnv();

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      dbName: DATABASE_NAME,
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((instance) => {
      logger.info('MongoDB connected', { database: DATABASE_NAME });
      return instance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    logger.error('MongoDB connection failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }

  return cached.conn;
}

export async function disconnectFromDatabase(): Promise<void> {
  if (cached.conn) {
    await cached.conn.disconnect();
    cached.conn = null;
    cached.promise = null;
    logger.info('MongoDB disconnected');
  }
}
