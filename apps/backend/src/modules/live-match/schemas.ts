import { z } from "zod";

export const liveMatchSearchSchema = z.object({
  region: z.string().min(2).max(64),
  intent: z.enum(["serious", "casual", "friendship", "networking"]),
  interests: z.array(z.string().min(1).max(50)).min(1).max(10),
  idempotencyKey: z.string().min(8).max(128),
});

export const liveMatchCancelSchema = z.object({
  ticketId: z.string().min(1),
  idempotencyKey: z.string().min(8).max(128),
});

export const liveKitTokenSchema = z.object({
  sessionId: z.string().min(1),
});

export const liveKitWebhookSchema = z.object({
  event: z.string().min(1),
  room: z
    .object({
      name: z.string().optional(),
    })
    .optional(),
  participant: z
    .object({
      identity: z.string().optional(),
    })
    .optional(),
  roomName: z.string().optional(),
  participantIdentity: z.string().optional(),
});

export type LiveMatchSearchRequest = z.infer<typeof liveMatchSearchSchema>;
export type LiveMatchCancelRequest = z.infer<typeof liveMatchCancelSchema>;

// Made with Bob
