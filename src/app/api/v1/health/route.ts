import mongoose from 'mongoose';

import { withApiHandler } from '@/lib/api-handler';
import { successResponse } from '@/lib/api-response';
import { connectToDatabase } from '@/lib/db';

export const GET = withApiHandler(async () => {
  let dbStatus = 'disconnected';
  try {
    await connectToDatabase();
    dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  } catch {
    dbStatus = 'error';
  }

  const memoryUsage = process.memoryUsage();
  
  return successResponse({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: dbStatus,
    uptime: process.uptime(),
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
    }
  }, 'Healthy');
});
