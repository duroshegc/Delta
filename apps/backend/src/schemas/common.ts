import { z } from "zod";
import { ObjectId } from "mongodb";

/**
 * Common validation schemas used across the application
 */

// MongoDB ObjectId validation
export const objectIdSchema = z
  .string()
  .refine((val) => ObjectId.isValid(val), {
    message: "Invalid ObjectId format",
  })
  .transform((val) => new ObjectId(val));

// Email validation
export const emailSchema = z
  .string()
  .email("Invalid email address")
  .toLowerCase()
  .trim();

// Phone number validation (international format)
export const phoneSchema = z
  .string()
  .regex(
    /^\+[1-9]\d{1,14}$/,
    "Invalid phone number format (use E.164 format: +1234567890)",
  );

// Password validation
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must not exceed 128 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

// URL validation
export const urlSchema = z.string().url("Invalid URL format");

// Pagination schemas
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform(Number)
    .pipe(z.number().int().positive()),
  limit: z
    .string()
    .optional()
    .default("20")
    .transform(Number)
    .pipe(z.number().int().positive().max(100)),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Date range validation
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Coordinates validation (longitude, latitude)
export const coordinatesSchema = z.object({
  longitude: z.number().min(-180).max(180),
  latitude: z.number().min(-90).max(90),
});

// GeoJSON Point validation
export const geoPointSchema = z.object({
  type: z.literal("Point"),
  coordinates: z.tuple([
    z.number().min(-180).max(180), // longitude
    z.number().min(-90).max(90), // latitude
  ]),
});

// File upload validation
export const fileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mimetype: z.string().regex(/^[a-z]+\/[a-z0-9\-\+\.]+$/i),
  size: z
    .number()
    .positive()
    .max(50 * 1024 * 1024), // 50MB max
});

// Image file validation
export const imageFileSchema = fileUploadSchema.extend({
  mimetype: z.enum([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ]),
  size: z
    .number()
    .positive()
    .max(10 * 1024 * 1024), // 10MB max for images
});

// Video file validation
export const videoFileSchema = fileUploadSchema.extend({
  mimetype: z.enum([
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
  ]),
  size: z
    .number()
    .positive()
    .max(100 * 1024 * 1024), // 100MB max for videos
});

// Search query validation
export const searchQuerySchema = z.object({
  q: z.string().min(1).max(100).trim(),
  ...paginationSchema.shape,
});

// ID parameter validation
export const idParamSchema = z.object({
  id: objectIdSchema,
});

// UUID validation
export const uuidSchema = z.string().uuid("Invalid UUID format");

// ISO date string validation
export const isoDateSchema = z.string().datetime();

// Age validation (18-100)
export const ageSchema = z.number().int().min(18).max(100);

// Gender validation
export const genderSchema = z.enum([
  "male",
  "female",
  "non-binary",
  "other",
  "prefer-not-to-say",
]);

// Dating intent validation
export const datingIntentSchema = z.enum([
  "serious",
  "casual",
  "friendship",
  "networking",
]);

// Language code validation (ISO 639-1)
export const languageCodeSchema = z
  .string()
  .length(2)
  .regex(/^[a-z]{2}$/, "Invalid language code");

// Country code validation (ISO 3166-1 alpha-2)
export const countryCodeSchema = z
  .string()
  .length(2)
  .regex(/^[A-Z]{2}$/, "Invalid country code");

// Timezone validation
export const timezoneSchema = z.string().refine(
  (tz) => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  },
  { message: "Invalid timezone" },
);

// Color hex validation
export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-F]{6}$/i, "Invalid hex color format");

// Percentage validation (0-100)
export const percentageSchema = z.number().min(0).max(100);

// Rating validation (1-5)
export const ratingSchema = z.number().int().min(1).max(5);

// Bio/description validation
export const bioSchema = z.string().min(1).max(500).trim();

// Username validation
export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must not exceed 30 characters")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username can only contain letters, numbers, and underscores",
  )
  .toLowerCase();

// Tags/interests validation
export const tagsSchema = z.array(z.string().min(1).max(50)).min(1).max(20);

// Made with Bob
