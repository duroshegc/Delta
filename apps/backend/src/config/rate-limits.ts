import { env } from "./env";

/**
 * Rate limit configurations for different endpoint types
 * All windows are in seconds
 */

export interface RateLimitConfig {
  max: number; // Maximum requests
  window: number; // Time window in seconds
  message?: string; // Custom error message
}

export const RATE_LIMITS = {
  // Global rate limit for all requests
  GLOBAL: {
    max: 1000,
    window: 3600, // 1 hour
    message: "Too many requests from this IP, please try again later",
  },

  // Authentication endpoints (stricter limits)
  AUTH: {
    max: env.AUTH_RATE_LIMIT_MAX,
    window: env.AUTH_RATE_LIMIT_WINDOW_SECONDS,
    message: "Too many authentication attempts, please try again later",
  },

  // Password reset (very strict)
  PASSWORD_RESET: {
    max: 3,
    window: 3600, // 1 hour
    message: "Too many password reset attempts, please try again later",
  },

  // Email verification
  EMAIL_VERIFICATION: {
    max: 5,
    window: 3600, // 1 hour
    message: "Too many verification attempts, please try again later",
  },

  // Standard API endpoints (per user)
  API: {
    max: 100,
    window: 900, // 15 minutes
    message: "Rate limit exceeded, please slow down",
  },

  // Media upload endpoints
  MEDIA_UPLOAD: {
    max: 20,
    window: 3600, // 1 hour
    message: "Too many upload attempts, please try again later",
  },

  // Live matching endpoints
  LIVE_MATCH: {
    max: 50,
    window: 3600, // 1 hour
    message: "Too many live match requests, please try again later",
  },

  // Messaging endpoints
  MESSAGING: {
    max: 200,
    window: 3600, // 1 hour
    message: "Too many messages sent, please slow down",
  },

  // Profile discovery/swiping
  DISCOVERY: {
    max: 500,
    window: 3600, // 1 hour
    message: "Too many profile views, please take a break",
  },

  // Admin endpoints (higher limits)
  ADMIN: {
    max: 500,
    window: 3600, // 1 hour
    message: "Admin rate limit exceeded",
  },

  // Report submission
  REPORTS: {
    max: 10,
    window: 3600, // 1 hour
    message: "Too many reports submitted, please try again later",
  },
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

// Made with Bob
