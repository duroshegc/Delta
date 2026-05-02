import { ObjectId } from "mongodb";
import { z } from "zod";

const objectIdString = z.string().refine((value) => ObjectId.isValid(value), {
  message: "Invalid ObjectId",
});

export const submitReportSchema = z.object({
  reportedUserId: objectIdString,
  category: z.enum([
    "harassment",
    "spam",
    "fake_profile",
    "inappropriate_content",
    "scam",
    "underage",
    "other",
  ]),
  description: z.string().trim().min(5).max(2000),
  evidenceMediaIds: z.array(objectIdString).max(10).optional().default([]),
  context: z
    .object({
      matchId: objectIdString.optional(),
      conversationId: objectIdString.optional(),
      messageId: objectIdString.optional(),
      liveSessionId: z.string().optional(),
    })
    .optional(),
});

export const blockUserSchema = z.object({
  blockedUserId: objectIdString,
  reason: z.string().trim().max(500).optional(),
});

// Made with Bob
