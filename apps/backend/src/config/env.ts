import { z } from "zod";

const envSchema = z.object({
  // Application
  APP_ENV: z
    .enum(["development", "staging", "production"])
    .default("development"),
  PORT: z.string().default("3000").transform(Number),
  API_PUBLIC_URL: z.string().url(),

  // Database
  MONGODB_URI: z.string().min(1),
  MONGODB_DB_NAME: z.string().default("delta"),

  // Redis
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

  // ImageKit
  IMAGEKIT_PUBLIC_KEY: z.string().optional().or(z.literal("")),
  IMAGEKIT_PRIVATE_KEY: z.string().optional().or(z.literal("")),
  IMAGEKIT_URL_ENDPOINT: z.string().url().optional().or(z.literal("")),

  // LiveKit
  LIVEKIT_URL: z.string().optional().or(z.literal("")),
  LIVEKIT_API_KEY: z.string().optional().or(z.literal("")),
  LIVEKIT_API_SECRET: z.string().optional().or(z.literal("")),

  // Better Auth
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  // Email (Zoho SMTP)
  SMTP_HOST: z.string().default("smtp.zoho.com"),
  SMTP_PORT: z.string().default("465").transform(Number),
  SMTP_SECURE: z
    .string()
    .default("true")
    .transform((val) => val === "true"),
  SMTP_USER: z.string().email(),
  SMTP_PASSWORD: z.string().min(1),
  SMTP_FROM_NAME: z.string().default("Delta"),
  SMTP_FROM_EMAIL: z.string().email(),

  // In-App Purchases
  APPLE_IAP_SHARED_SECRET: z.string().optional().or(z.literal("")),
  GOOGLE_PLAY_PACKAGE_NAME: z.string().optional().or(z.literal("")),

  // Push Notifications
  PUSH_FCM_SERVER_KEY: z.string().optional().or(z.literal("")),

  // Logging
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  try {
    const parsed = envSchema.parse(process.env);
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Invalid environment variables:");
      error.issues.forEach((issue) => {
        console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

export const env = loadEnv();

// Made with Bob
