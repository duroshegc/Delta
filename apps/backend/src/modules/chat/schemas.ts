/**
 * Chat Validation Schemas
 * Zod schemas for conversations and messages endpoints
 */

import { ObjectId } from "mongodb";
import { z } from "zod";

const cursorSchema = z
  .string()
  .optional()
  .refine((val) => !val || ObjectId.isValid(val), {
    message: "Invalid cursor",
  });

export const conversationsQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1).max(50)),
  cursor: cursorSchema,
});

export const messagesQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 30))
    .pipe(z.number().int().min(1).max(100)),
  cursor: cursorSchema,
});

export const sendMessageSchema = z
  .object({
    text: z.string().trim().min(1).max(2000).optional(),
    mediaIds: z
      .array(
        z.string().refine((val) => ObjectId.isValid(val), {
          message: "Invalid media ID",
        }),
      )
      .max(6)
      .optional()
      .default([]),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((data) => data.text || data.mediaIds.length > 0, {
    message: "Message must include text or media",
  });

export type ConversationsQuery = z.infer<typeof conversationsQuerySchema>;
export type MessagesQuery = z.infer<typeof messagesQuerySchema>;
export type SendMessageRequest = z.infer<typeof sendMessageSchema>;

// Made with Bob
