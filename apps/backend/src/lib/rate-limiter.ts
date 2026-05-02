import { getRedis } from "../config/redis";
import { logger } from "../config/logger";
import type { RateLimitConfig } from "../config/rate-limits";

/**
 * Rate limiter implementation using Upstash Redis
 * Uses sliding window algorithm for accurate rate limiting
 */

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp when the limit resets
  retryAfter?: number; // Seconds until retry is allowed
}

export class RateLimiter {
  private redis = getRedis();

  /**
   * Check if a request should be rate limited
   * @param key - Unique identifier for the rate limit (e.g., "ip:127.0.0.1" or "user:123")
   * @param config - Rate limit configuration
   * @returns Rate limit result
   */
  async check(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now();
    const window = config.window * 1000; // Convert to milliseconds
    const windowStart = now - window;

    try {
      // Use Redis sorted set for sliding window
      const redisKey = `ratelimit:${key}`;

      // Remove old entries outside the window
      await this.redis.zremrangebyscore(redisKey, 0, windowStart);

      // Count requests in current window
      const count = await this.redis.zcard(redisKey);

      // Calculate reset time (end of current window)
      const reset = Math.ceil((now + window) / 1000);

      if (count >= config.max) {
        // Rate limit exceeded
        const oldestEntry = await this.redis.zrange(redisKey, 0, 0, {
          withScores: true,
        });

        let retryAfter = config.window;
        if (oldestEntry && oldestEntry.length > 0) {
          const oldestTimestamp = Number(oldestEntry[1]);
          retryAfter = Math.ceil((oldestTimestamp + window - now) / 1000);
        }

        logger.warn(
          {
            key,
            count,
            limit: config.max,
            window: config.window,
          },
          "Rate limit exceeded",
        );

        return {
          success: false,
          limit: config.max,
          remaining: 0,
          reset,
          retryAfter: Math.max(1, retryAfter),
        };
      }

      // Add current request to the window
      await this.redis.zadd(redisKey, {
        score: now,
        member: `${now}:${Math.random()}`, // Unique member
      });

      // Set expiry on the key (cleanup)
      await this.redis.expire(redisKey, config.window + 60);

      return {
        success: true,
        limit: config.max,
        remaining: config.max - count - 1,
        reset,
      };
    } catch (error) {
      logger.error(
        {
          error,
          key,
        },
        "Rate limiter error",
      );

      // On error, allow the request (fail open)
      return {
        success: true,
        limit: config.max,
        remaining: config.max,
        reset: Math.ceil((now + window) / 1000),
      };
    }
  }

  /**
   * Reset rate limit for a specific key
   * Useful for testing or manual intervention
   */
  async reset(key: string): Promise<void> {
    try {
      const redisKey = `ratelimit:${key}`;
      await this.redis.del(redisKey);
      logger.info({ key }, "Rate limit reset");
    } catch (error) {
      logger.error({ error, key }, "Failed to reset rate limit");
    }
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getStatus(
    key: string,
    config: RateLimitConfig,
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const window = config.window * 1000;
    const windowStart = now - window;

    try {
      const redisKey = `ratelimit:${key}`;

      // Remove old entries
      await this.redis.zremrangebyscore(redisKey, 0, windowStart);

      // Count requests
      const count = await this.redis.zcard(redisKey);

      const reset = Math.ceil((now + window) / 1000);

      return {
        success: count < config.max,
        limit: config.max,
        remaining: Math.max(0, config.max - count),
        reset,
      };
    } catch (error) {
      logger.error({ error, key }, "Failed to get rate limit status");

      return {
        success: true,
        limit: config.max,
        remaining: config.max,
        reset: Math.ceil((now + window) / 1000),
      };
    }
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Made with Bob
