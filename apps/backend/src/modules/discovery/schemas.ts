/**
 * Discovery Validation Schemas
 * Zod schemas for discovery endpoints
 */

import { z } from "zod";

/**
 * Discovery feed query parameters schema
 */
export const discoveryFeedQuerySchema = z.object({
  // Pagination
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().min(1).max(50)),
  cursor: z.string().optional(),

  // Location filters
  latitude: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().min(-90).max(90).optional()),
  longitude: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().min(-180).max(180).optional()),
  maxDistance: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().min(1).max(500).optional()),

  // Age filters
  minAge: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().min(18).max(100).optional()),
  maxAge: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().min(18).max(100).optional()),

  // Preference filters
  intent: z.enum(["serious", "casual", "friendship", "networking"]).optional(),
  genderPreference: z
    .enum(["male", "female", "non-binary", "other", "prefer-not-to-say", "all"])
    .optional(),

  // Interest filters
  interests: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(",").map((i) => i.trim()) : undefined))
    .pipe(z.array(z.string()).optional()),

  // Quality filters
  minCompletion: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().min(0).max(100).optional()),
  verifiedOnly: z
    .string()
    .optional()
    .transform((val) => val === "true"),
});

export type DiscoveryFeedQuery = z.infer<typeof discoveryFeedQuerySchema>;

// Made with Bob
