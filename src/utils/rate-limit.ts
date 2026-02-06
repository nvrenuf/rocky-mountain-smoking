import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RateLimitOptions = {
  limit: number;
  window: `${number} s` | `${number} m` | `${number} h` | `${number} d`;
  prefix: string;
};

type RateLimitResult = {
  allowed: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
  disabled?: boolean;
};

const limiters = new Map<string, Ratelimit>();
const memoryLimiters = new Map<string, Map<string, { count: number; resetAt: number }>>();
let warnedMissingEnv = false;
let warnedMemoryFallback = false;

const parseWindowMs = (window: RateLimitOptions["window"]) => {
  const [rawValue, unit] = window.split(" ") as [string, string];
  const value = Number(rawValue);
  if (!Number.isFinite(value) || value <= 0) return 0;
  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
};

const getRedis = () => {
  const url = import.meta.env.UPSTASH_REDIS_REST_URL as string | undefined;
  const token = import.meta.env.UPSTASH_REDIS_REST_TOKEN as string | undefined;
  if (!url || !token) {
    if (!warnedMissingEnv) {
      console.warn("[newsletter] UPSTASH_REDIS_REST_URL/TOKEN not set; rate limiting disabled.");
      warnedMissingEnv = true;
    }
    return null;
  }
  return new Redis({ url, token });
};

const getLimiter = (options: RateLimitOptions) => {
  const cacheKey = `${options.prefix}:${options.limit}:${options.window}`;
  if (limiters.has(cacheKey)) {
    return limiters.get(cacheKey) ?? null;
  }

  const redis = getRedis();
  if (!redis) {
    limiters.set(cacheKey, null as unknown as Ratelimit);
    return null;
  }

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(options.limit, options.window),
    prefix: options.prefix,
    analytics: false,
  });

  limiters.set(cacheKey, limiter);
  return limiter;
};

export async function rateLimitNewsletter(identifier: string, options: RateLimitOptions): Promise<RateLimitResult> {
  const limiter = getLimiter(options);
  if (!limiter) {
    if (!warnedMemoryFallback) {
      console.warn("[newsletter] Using in-memory rate limiter fallback. Configure Upstash for shared limits.");
      warnedMemoryFallback = true;
    }

    const windowMs = parseWindowMs(options.window);
    if (!windowMs) {
      return { allowed: true, disabled: true };
    }

    const cacheKey = `${options.prefix}:${options.limit}:${options.window}`;
    const store = memoryLimiters.get(cacheKey) ?? new Map<string, { count: number; resetAt: number }>();
    if (!memoryLimiters.has(cacheKey)) memoryLimiters.set(cacheKey, store);

    const now = Date.now();
    const entry = store.get(identifier);
    if (!entry || entry.resetAt <= now) {
      const resetAt = now + windowMs;
      store.set(identifier, { count: 1, resetAt });
      return { allowed: true, limit: options.limit, remaining: options.limit - 1, reset: Math.floor(resetAt / 1000) };
    }

    const nextCount = entry.count + 1;
    entry.count = nextCount;
    const remaining = Math.max(0, options.limit - nextCount);

    // Cleanup expired entries opportunistically.
    if (store.size > 5000) {
      for (const [key, value] of store.entries()) {
        if (value.resetAt <= now) store.delete(key);
      }
    }

    return {
      allowed: nextCount <= options.limit,
      limit: options.limit,
      remaining,
      reset: Math.floor(entry.resetAt / 1000),
    };
  }

  const result = await limiter.limit(identifier);
  return {
    allowed: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}
