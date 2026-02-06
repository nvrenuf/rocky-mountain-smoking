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
let warnedMissingEnv = false;

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
    return { allowed: true, disabled: true };
  }

  const result = await limiter.limit(identifier);
  return {
    allowed: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}
