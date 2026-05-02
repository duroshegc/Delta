/**
 * Wallet Validation Schemas
 */

import { z } from "zod";

export const walletQuerySchema = z.object({
  historyLimit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1).max(100)),
});

const purchaseVerificationBaseSchema = z.object({
  productId: z.string().min(1),
  transactionId: z.string().min(1),
  receipt: z.string().min(1),
  idempotencyKey: z.string().min(8).max(128),
});

export const iosPurchaseVerificationSchema =
  purchaseVerificationBaseSchema.extend({
    originalTransactionId: z.string().min(1).optional(),
  });

export const androidPurchaseVerificationSchema =
  purchaseVerificationBaseSchema.extend({
    purchaseToken: z.string().min(1),
    packageName: z.string().min(1).optional(),
  });

export const createReservationSchema = z.object({
  amount: z.number().int().positive().max(10000),
  action: z
    .enum(["super_like", "profile_boost", "live_match", "custom"])
    .default("custom"),
  sessionId: z.string().min(1).max(128).optional(),
  idempotencyKey: z.string().min(8).max(128),
  ttlSeconds: z.number().int().min(60).max(3600).optional().default(900),
});

export const reservationActionSchema = z.object({
  idempotencyKey: z.string().min(8).max(128),
});

export const adminAdjustmentSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().int().min(-100000).max(100000).refine((val) => val !== 0, {
    message: "Amount cannot be zero",
  }),
  reason: z.string().min(3).max(500),
  idempotencyKey: z.string().min(8).max(128),
});

export type WalletQuery = z.infer<typeof walletQuerySchema>;
export type IosPurchaseVerification = z.infer<
  typeof iosPurchaseVerificationSchema
>;
export type AndroidPurchaseVerification = z.infer<
  typeof androidPurchaseVerificationSchema
>;
export type CreateReservationRequest = z.infer<typeof createReservationSchema>;
export type ReservationActionRequest = z.infer<typeof reservationActionSchema>;
export type AdminAdjustmentRequest = z.infer<typeof adminAdjustmentSchema>;

// Made with Bob
