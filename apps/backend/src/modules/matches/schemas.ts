/**
 * Matching Validation Schemas
 * Zod schemas for likes and matches endpoints
 */

import { z } from "zod";
import { ObjectId } from "mongodb";
import { objectIdSchema } from "../../schemas/common";

export const createLikeSchema = z.object({
  targetUserId: objectIdSchema,
  type: z.enum(["like", "super_like"]).optional().default("like"),
});

export const matchesQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1).max(50)),
  cursor: z
    .string()
    .optional()
    .refine((val) => !val || ObjectId.isValid(val), {
      message: "Invalid cursor",
    }),
});

export type CreateLikeRequest = z.infer<typeof createLikeSchema>;
export type MatchesQuery = z.infer<typeof matchesQuerySchema>;

// Made with Bob
