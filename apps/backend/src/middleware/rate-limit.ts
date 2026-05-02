import type { Elysia } from "elysia";
import { rateLimiter } from "../lib/rate-limiter";
import { RateLimitError } from "../utils/errors";
import { RATE_LIMITS, type RateLimitConfig } from "../config/rate-limits";
import { logger } from "../config/logger";

/**
 * Rate limiting middleware for Elysia
 * Protects endpoints from abuse using Redis-backed rate limiting
 */

interface RateLimitOptions {
  config: RateLimitConfig;
  keyGenerator?: (context: any) => string;
  skip?: (context: any) => boolean;
}

/**
 * Get client IP address from request
 */
function getClientIp(request: Request): string {
  // Check common headers for real IP (when behind proxy)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0];
    return firstIp ? firstIp.trim() : "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback to connection IP (not available in all environments)
  return "unknown";
}

/**
 * Create rate limit middleware
 */
export function rateLimit(options: RateLimitOptions) {
  return async (context: any) => {
    const { request, set } = context;

    // Skip rate limiting if condition is met
    if (options.skip && options.skip(context)) {
      return;
    }

    // Generate rate limit key
    let key: string;
    if (options.keyGenerator) {
      key = options.keyGenerator(context);
    } else {
      // Default: use IP address
      const ip = getClientIp(request);
      key = `ip:${ip}`;
    }

    // Check rate limit
    const result = await rateLimiter.check(key, options.config);

    // Set rate limit headers
    set.headers["X-RateLimit-Limit"] = result.limit.toString();
    set.headers["X-RateLimit-Remaining"] = result.remaining.toString();
    set.headers["X-RateLimit-Reset"] = result.reset.toString();

    if (!result.success) {
      // Set retry-after header
      if (result.retryAfter) {
        set.headers["Retry-After"] = result.retryAfter.toString();
      }

      throw new RateLimitError(
        options.config.message || "Rate limit exceeded",
        result.retryAfter,
      );
    }
  };
}

/**
 * Global rate limit middleware (IP-based)
 */
export function globalRateLimit() {
  return rateLimit({
    config: RATE_LIMITS.GLOBAL,
    keyGenerator: (context) => {
      const ip = getClientIp(context.request);
      return `global:ip:${ip}`;
    },
  });
}

/**
 * User-based rate limit middleware
 * Requires authentication context with userId
 */
export function userRateLimit(config: RateLimitConfig) {
  return rateLimit({
    config,
    keyGenerator: (context) => {
      // Assumes auth middleware has set context.user
      const userId = context.user?.id || context.userId;
      if (!userId) {
        // Fallback to IP if no user
        const ip = getClientIp(context.request);
        return `ip:${ip}`;
      }
      return `user:${userId}`;
    },
  });
}

/**
 * Endpoint-specific rate limit middleware
 */
export function endpointRateLimit(endpoint: string, config: RateLimitConfig) {
  return rateLimit({
    config,
    keyGenerator: (context) => {
      const userId = context.user?.id || context.userId;
      if (userId) {
        return `endpoint:${endpoint}:user:${userId}`;
      }
      const ip = getClientIp(context.request);
      return `endpoint:${endpoint}:ip:${ip}`;
    },
  });
}

/**
 * Convenience middleware for common rate limit types
 */
export const rateLimitMiddleware = {
  global: () => globalRateLimit(),

  auth: () =>
    rateLimit({
      config: RATE_LIMITS.AUTH,
      keyGenerator: (context) => {
        const ip = getClientIp(context.request);
        return `auth:ip:${ip}`;
      },
    }),

  passwordReset: () =>
    rateLimit({
      config: RATE_LIMITS.PASSWORD_RESET,
      keyGenerator: (context) => {
        const ip = getClientIp(context.request);
        return `password-reset:ip:${ip}`;
      },
    }),

  emailVerification: () =>
    rateLimit({
      config: RATE_LIMITS.EMAIL_VERIFICATION,
      keyGenerator: (context) => {
        const ip = getClientIp(context.request);
        return `email-verification:ip:${ip}`;
      },
    }),

  api: () => userRateLimit(RATE_LIMITS.API),

  mediaUpload: () => userRateLimit(RATE_LIMITS.MEDIA_UPLOAD),

  liveMatch: () => userRateLimit(RATE_LIMITS.LIVE_MATCH),

  messaging: () => userRateLimit(RATE_LIMITS.MESSAGING),

  discovery: () => userRateLimit(RATE_LIMITS.DISCOVERY),

  admin: () => userRateLimit(RATE_LIMITS.ADMIN),

  reports: () => userRateLimit(RATE_LIMITS.REPORTS),
};

// Made with Bob
