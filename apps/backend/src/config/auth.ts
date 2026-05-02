import { env } from "./env";
import { logger } from "./logger";
import { mongoAdapter } from "../lib/auth-adapter";

/**
 * Authentication configuration
 * Custom implementation with MongoDB persistence
 */

export const authConfig = {
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
    updateAge: 60 * 60 * 24, // Update session every 24 hours
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
  },

  // Social OAuth providers (prepared for future implementation)
  socialProviders: {
    google: {
      enabled: false,
      clientId: "",
      clientSecret: "",
    },
    apple: {
      enabled: false,
      clientId: "",
      clientSecret: "",
    },
  },

  advanced: {
    cookieSameSite: "lax" as const,
    useSecureCookies: env.APP_ENV === "production",
  },
};

export { mongoAdapter };

// Made with Bob
