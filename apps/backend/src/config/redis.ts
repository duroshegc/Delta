import { Redis } from "@upstash/redis";
import { env } from "./env";
import { logger } from "./logger";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    logger.info("Initializing Upstash Redis connection...");

    redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });

    logger.info("Upstash Redis initialized");
  }

  return redis;
}

// Helper functions for common Redis operations
export const redisHelpers = {
  // Presence management
  async setUserPresence(userId: string, status: string, ttl: number = 60) {
    const key = `presence:user:${userId}`;
    await getRedis().setex(
      key,
      ttl,
      JSON.stringify({
        status,
        timestamp: Date.now(),
      }),
    );
  },

  async getUserPresence(userId: string) {
    const key = `presence:user:${userId}`;
    const data = await getRedis().get(key);
    return data ? JSON.parse(data as string) : null;
  },

  // Lock management
  async acquireLock(lockKey: string, ttl: number = 10): Promise<boolean> {
    const result = await getRedis().set(lockKey, "1", {
      ex: ttl,
      nx: true,
    });
    return result === "OK";
  },

  async releaseLock(lockKey: string): Promise<void> {
    await getRedis().del(lockKey);
  },

  // Rate limiting helper
  async checkRateLimit(
    key: string,
    limit: number,
    window: number,
  ): Promise<boolean> {
    const current = await getRedis().incr(key);

    if (current === 1) {
      await getRedis().expire(key, window);
    }

    return current <= limit;
  },
};

// Made with Bob
