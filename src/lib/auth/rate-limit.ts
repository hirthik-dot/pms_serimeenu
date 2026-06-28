export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export const RATE_LIMIT = {
  API: { limit: 100, windowMs: 60 * 1000 },
  AUTH: { limit: 5, windowMs: 60 * 1000 }, // Stricter limit for auth routes
};

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

// In-memory store (Note: In a multi-instance production environment, use Redis)
const store = new Map<string, RateLimitInfo>();

/**
 * Basic in-memory sliding window rate limiter
 */
export function rateLimit(
  key: string,
  config: RateLimitConfig = RATE_LIMIT.API,
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const info = store.get(key) ?? { count: 0, resetTime: now + config.windowMs };

  // Reset window if passed
  if (now > info.resetTime) {
    info.count = 0;
    info.resetTime = now + config.windowMs;
  }

  info.count += 1;
  store.set(key, info);

  return {
    success: info.count <= config.limit,
    limit: config.limit,
    remaining: Math.max(0, config.limit - info.count),
    reset: info.resetTime,
  };
}

/**
 * Clean up expired entries periodically to prevent memory leaks
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, info] of store.entries()) {
    if (now > info.resetTime) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes
