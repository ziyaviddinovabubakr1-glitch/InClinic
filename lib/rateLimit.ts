import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { hasUpstashRedis } from "@/lib/env";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

interface MemoryEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();

const limiters = new Map<string, Ratelimit>();

function getUpstashLimiter(
  keyPrefix: string,
  limit: number,
  windowSec: number
): Ratelimit | null {
  if (!hasUpstashRedis()) return null;
  const cacheKey = `${keyPrefix}:${limit}:${windowSec}`;
  if (limiters.has(cacheKey)) return limiters.get(cacheKey)!;

  const redis = Redis.fromEnv();
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
    prefix: `clinic:rl:${keyPrefix}`,
  });
  limiters.set(cacheKey, limiter);
  return limiter;
}

function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt < now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  entry.count += 1;
  if (entry.count > limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  };
}

export async function rateLimit(
  routeKey: string,
  identifier: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const upstash = getUpstashLimiter(routeKey, limit, windowSec);

  if (upstash) {
    const result = await upstash.limit(`${routeKey}:${identifier}`);
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetAt: result.reset,
    };
  }

  if (process.env.NODE_ENV === "production") {
    console.warn(
      `[security] UPSTASH_REDIS not configured — using in-memory rate limit for ${routeKey}`
    );
  }

  return memoryRateLimit(`${routeKey}:${identifier}`, limit, windowMs);
}

export const RATE_LIMITS = {
  login: { limit: 5, windowMs: 15 * 60 * 1000 },
  bookings: { limit: 3, windowMs: 60 * 60 * 1000 },
  slots: { limit: 60, windowMs: 60 * 1000 },
  admin: { limit: 300, windowMs: 60 * 1000 },
} as const;
