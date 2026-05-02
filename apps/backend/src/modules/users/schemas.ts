import { z } from "zod";
import { datingIntentSchema, ageSchema } from "../../schemas/common";

/**
 * Validation schemas for user management endpoints
 */

// Privacy settings schema
export const privacySettingsSchema = z.object({
  showOnlineStatus: z.boolean().optional(),
  showLastSeen: z.boolean().optional(),
  showDistance: z.boolean().optional(),
  allowProfileViews: z.boolean().optional(),
});

// Notification preferences schema
export const notificationPreferencesSchema = z.object({
  matches: z.boolean().optional(),
  messages: z.boolean().optional(),
  likes: z.boolean().optional(),
  liveMatch: z.boolean().optional(),
  email: z.boolean().optional(),
  push: z.boolean().optional(),
});

// Discovery filters schema
export const discoveryFiltersSchema = z.object({
  showMe: z.boolean().optional(),
  ageRange: z
    .object({
      min: ageSchema,
      max: ageSchema,
    })
    .refine((data) => data.min <= data.max, {
      message: "Minimum age must be less than or equal to maximum age",
    })
    .optional(),
  maxDistance: z
    .number()
    .int()
    .min(1, "Distance must be at least 1km")
    .max(500, "Distance cannot exceed 500km")
    .optional(),
  intents: z.array(datingIntentSchema).min(1).max(4).optional(),
});

// Update preferences request schema
export const updatePreferencesSchema = z.object({
  privacy: privacySettingsSchema.optional(),
  notifications: notificationPreferencesSchema.optional(),
  discovery: discoveryFiltersSchema.optional(),
});

// Made with Bob
