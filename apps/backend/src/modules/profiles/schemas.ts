import { z } from "zod";
import {
  genderSchema,
  datingIntentSchema,
  ageSchema,
  bioSchema,
  countryCodeSchema,
  coordinatesSchema,
  tagsSchema,
} from "../../schemas/common";
import { PROMPT_QUESTIONS } from "../../types/profile";

/**
 * Validation schemas for profile endpoints
 */

// Display name validation
export const displayNameSchema = z
  .string()
  .min(2, "Display name must be at least 2 characters")
  .max(50, "Display name must not exceed 50 characters")
  .trim();

// Date of birth validation (must be 18+)
export const dateOfBirthSchema = z
  .string()
  .datetime()
  .refine(
    (date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();

      // Adjust age if birthday hasn't occurred this year
      const actualAge =
        monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

      return actualAge >= 18 && actualAge <= 100;
    },
    { message: "You must be between 18 and 100 years old" },
  );

// Profile prompt validation
export const profilePromptSchema = z.object({
  question: z.enum(PROMPT_QUESTIONS as any),
  answer: z
    .string()
    .min(10, "Prompt answer must be at least 10 characters")
    .max(300, "Prompt answer must not exceed 300 characters")
    .trim(),
});

// Location validation
export const locationSchema = z.object({
  longitude: z.number().min(-180).max(180),
  latitude: z.number().min(-90).max(90),
});

// Age range validation
export const ageRangeSchema = z
  .object({
    min: ageSchema,
    max: ageSchema,
  })
  .refine((data) => data.min <= data.max, {
    message: "Minimum age must be less than or equal to maximum age",
  });

// Create/Update profile request schema
export const profileUpdateSchema = z.object({
  displayName: displayNameSchema.optional(),
  dateOfBirth: dateOfBirthSchema.optional(),
  gender: genderSchema.optional(),
  bio: bioSchema.optional(),
  location: locationSchema.optional(),
  city: z.string().min(1).max(100).trim().optional(),
  country: countryCodeSchema.optional(),
  intent: datingIntentSchema.optional(),
  lookingFor: z
    .array(genderSchema)
    .min(1, "Must select at least one gender preference")
    .max(5, "Cannot select more than 5 gender preferences")
    .optional(),
  ageRange: ageRangeSchema.optional(),
  maxDistance: z
    .number()
    .int()
    .min(1, "Distance must be at least 1km")
    .max(500, "Distance cannot exceed 500km")
    .optional(),
  interests: z
    .array(z.string().min(1).max(50).trim())
    .min(3, "Must have at least 3 interests")
    .max(10, "Cannot have more than 10 interests")
    .optional(),
  prompts: z
    .array(profilePromptSchema)
    .length(3, "Must have exactly 3 prompts")
    .optional(),
});

// Profile visibility update schema
export const visibilityUpdateSchema = z.object({
  visibility: z.enum(["active", "paused", "hidden"]),
});

// Made with Bob
