/**
 * Wallet Routes
 * Delt token wallet, purchases, reservations, and adjustments.
 */

import { Elysia, t } from "elysia";
import { ObjectId } from "mongodb";
import { getDatabase } from "../../config/database";
import { logger } from "../../config/logger";
import { RATE_LIMITS } from "../../config/rate-limits";
import { requireAuth, requireRole } from "../../middleware/auth";
import { userRateLimit } from "../../middleware/rate-limit";
import { WalletService } from "../../lib/wallet-service";
import {
  adminAdjustmentSchema,
  androidPurchaseVerificationSchema,
  createReservationSchema,
  iosPurchaseVerificationSchema,
  reservationActionSchema,
  walletQuerySchema,
} from "./schemas";
import { ValidationError } from "../../utils/errors";

export const walletRoutes = new Elysia({ prefix: "/wallet" })
  .use(requireAuth)
  .get(
    "/",
    async (context) => {
      const { user, query } = context as any;
      const validatedQuery = walletQuerySchema.parse(query);
      const walletService = new WalletService(getDatabase());
      const result = await walletService.getWallet(
        new ObjectId(user.userId),
        validatedQuery.historyLimit,
      );

      return {
        success: true,
        data: {
          wallet: serializeWallet(result.wallet),
          ledgerBalance: result.ledgerBalance,
          transactions: result.transactions.map(serializeTransaction),
        },
      };
    },
    {
      beforeHandle: userRateLimit(RATE_LIMITS.API),
      query: t.Object({
        historyLimit: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Wallet"],
        summary: "Get wallet",
        description: "Get wallet balances and recent immutable ledger entries",
      },
    },
  )
  .get(
    "/packages",
    async () => {
      const walletService = new WalletService(getDatabase());
      return {
        success: true,
        data: walletService.getPackages(),
      };
    },
    {
      beforeHandle: userRateLimit(RATE_LIMITS.API),
      detail: {
        tags: ["Wallet"],
        summary: "List token packages",
        description: "List purchasable Delt token packages",
      },
    },
  )
  .post(
    "/purchase/ios/verify",
    async (context) => {
      const { user, body } = context as any;
      const validatedBody = iosPurchaseVerificationSchema.parse(body);
      const walletService = new WalletService(getDatabase());
      const result = await walletService.creditPurchase({
        userId: new ObjectId(user.userId),
        platform: "ios",
        productId: validatedBody.productId,
        transactionId: validatedBody.transactionId,
        receipt: validatedBody.receipt,
        idempotencyKey: validatedBody.idempotencyKey,
        metadata: {
          originalTransactionId: validatedBody.originalTransactionId,
        },
      });

      logger.info(
        {
          userId: user.userId,
          transactionId: validatedBody.transactionId,
          productId: validatedBody.productId,
        },
        "iOS purchase credited",
      );

      return {
        success: true,
        message: "Purchase verified successfully",
        data: {
          wallet: serializeWallet(result.wallet),
          transaction: serializeTransaction(result.transaction),
          package: result.package,
        },
      };
    },
    {
      beforeHandle: userRateLimit(RATE_LIMITS.API),
      body: t.Object({
        productId: t.String(),
        transactionId: t.String(),
        originalTransactionId: t.Optional(t.String()),
        receipt: t.String(),
        idempotencyKey: t.String(),
      }),
      detail: {
        tags: ["Wallet"],
        summary: "Verify iOS purchase",
        description: "Verify and credit an iOS in-app purchase",
      },
    },
  )
  .post(
    "/purchase/android/verify",
    async (context) => {
      const { user, body } = context as any;
      const validatedBody = androidPurchaseVerificationSchema.parse(body);
      const walletService = new WalletService(getDatabase());
      const result = await walletService.creditPurchase({
        userId: new ObjectId(user.userId),
        platform: "android",
        productId: validatedBody.productId,
        transactionId: validatedBody.transactionId,
        receipt: validatedBody.receipt,
        idempotencyKey: validatedBody.idempotencyKey,
        metadata: {
          purchaseToken: validatedBody.purchaseToken,
          packageName: validatedBody.packageName,
        },
      });

      logger.info(
        {
          userId: user.userId,
          transactionId: validatedBody.transactionId,
          productId: validatedBody.productId,
        },
        "Android purchase credited",
      );

      return {
        success: true,
        message: "Purchase verified successfully",
        data: {
          wallet: serializeWallet(result.wallet),
          transaction: serializeTransaction(result.transaction),
          package: result.package,
        },
      };
    },
    {
      beforeHandle: userRateLimit(RATE_LIMITS.API),
      body: t.Object({
        productId: t.String(),
        transactionId: t.String(),
        purchaseToken: t.String(),
        packageName: t.Optional(t.String()),
        receipt: t.String(),
        idempotencyKey: t.String(),
      }),
      detail: {
        tags: ["Wallet"],
        summary: "Verify Android purchase",
        description: "Verify and credit an Android in-app purchase",
      },
    },
  )
  .post(
    "/reservations",
    async (context) => {
      const { user, body } = context as any;
      const validatedBody = createReservationSchema.parse(body);
      const walletService = new WalletService(getDatabase());
      const result = await walletService.createReservation({
        userId: new ObjectId(user.userId),
        amount: validatedBody.amount,
        action: validatedBody.action,
        sessionId: validatedBody.sessionId,
        idempotencyKey: validatedBody.idempotencyKey,
        ttlSeconds: validatedBody.ttlSeconds,
      });

      return {
        success: true,
        message: "Tokens reserved successfully",
        data: {
          wallet: serializeWallet(result.wallet),
          reservation: serializeReservation(result.reservation),
          transaction: serializeTransaction(result.transaction),
        },
      };
    },
    {
      beforeHandle: userRateLimit(RATE_LIMITS.API),
      body: t.Object({
        amount: t.Number({ minimum: 1 }),
        action: t.Optional(
          t.Union([
            t.Literal("super_like"),
            t.Literal("profile_boost"),
            t.Literal("live_match"),
            t.Literal("custom"),
          ]),
        ),
        sessionId: t.Optional(t.String()),
        idempotencyKey: t.String(),
        ttlSeconds: t.Optional(t.Number({ minimum: 60, maximum: 3600 })),
      }),
      detail: {
        tags: ["Wallet"],
        summary: "Reserve tokens",
        description: "Hold tokens for an operation that may settle or refund",
      },
    },
  )
  .post(
    "/reservations/:reservationId/settle",
    async (context) => {
      const { user, params, body } = context as any;

      if (!ObjectId.isValid(params.reservationId)) {
        throw new ValidationError("Invalid reservation ID");
      }

      const validatedBody = reservationActionSchema.parse(body);
      const walletService = new WalletService(getDatabase());
      const result = await walletService.settleReservation(
        new ObjectId(user.userId),
        new ObjectId(params.reservationId),
        validatedBody.idempotencyKey,
      );

      return {
        success: true,
        message: "Reservation settled successfully",
        data: {
          wallet: serializeWallet(result.wallet),
          reservation: serializeReservation(result.reservation),
          transaction: serializeTransaction(result.transaction),
        },
      };
    },
    {
      beforeHandle: userRateLimit(RATE_LIMITS.API),
      params: t.Object({ reservationId: t.String() }),
      body: t.Object({ idempotencyKey: t.String() }),
      detail: {
        tags: ["Wallet"],
        summary: "Settle reservation",
        description: "Settle reserved tokens after a successful operation",
      },
    },
  )
  .post(
    "/reservations/:reservationId/refund",
    async (context) => {
      const { user, params, body } = context as any;

      if (!ObjectId.isValid(params.reservationId)) {
        throw new ValidationError("Invalid reservation ID");
      }

      const validatedBody = reservationActionSchema.parse(body);
      const walletService = new WalletService(getDatabase());
      const result = await walletService.releaseReservation(
        new ObjectId(user.userId),
        new ObjectId(params.reservationId),
        validatedBody.idempotencyKey,
      );

      return {
        success: true,
        message: "Reservation refunded successfully",
        data: {
          wallet: serializeWallet(result.wallet),
          reservation: serializeReservation(result.reservation),
          transaction: serializeTransaction(result.transaction),
        },
      };
    },
    {
      beforeHandle: userRateLimit(RATE_LIMITS.API),
      params: t.Object({ reservationId: t.String() }),
      body: t.Object({ idempotencyKey: t.String() }),
      detail: {
        tags: ["Wallet"],
        summary: "Refund reservation",
        description: "Release reserved tokens back to the wallet",
      },
    },
  )
  .use(requireRole("admin"))
  .post(
    "/admin/adjust",
    async (context) => {
      const { user, body } = context as any;
      const validatedBody = adminAdjustmentSchema.parse(body);

      if (!ObjectId.isValid(validatedBody.userId)) {
        throw new ValidationError("Invalid user ID");
      }

      const walletService = new WalletService(getDatabase());
      const result = await walletService.adminAdjustBalance({
        userId: new ObjectId(validatedBody.userId),
        amount: validatedBody.amount,
        reason: validatedBody.reason,
        actorId: new ObjectId(user.userId),
        idempotencyKey: validatedBody.idempotencyKey,
      });

      logger.info(
        {
          actorId: user.userId,
          targetUserId: validatedBody.userId,
          amount: validatedBody.amount,
        },
        "Wallet admin adjustment applied",
      );

      return {
        success: true,
        message: "Wallet adjusted successfully",
        data: {
          wallet: serializeWallet(result.wallet),
          transaction: serializeTransaction(result.transaction),
        },
      };
    },
    {
      beforeHandle: userRateLimit(RATE_LIMITS.ADMIN),
      body: t.Object({
        userId: t.String(),
        amount: t.Number(),
        reason: t.String(),
        idempotencyKey: t.String(),
      }),
      detail: {
        tags: ["Wallet"],
        summary: "Admin wallet adjustment",
        description: "Adjust a user's wallet balance with an audit trail",
      },
    },
  );

function serializeWallet(wallet: any) {
  return {
    id: wallet._id.toString(),
    userId: wallet.userId.toString(),
    balance: wallet.balance,
    paidBalance: wallet.paidBalance,
    bonusBalance: wallet.bonusBalance,
    reservedBalance: wallet.reservedBalance,
    lifetimePurchased: wallet.lifetimePurchased,
    lifetimeSpent: wallet.lifetimeSpent,
    lastRechargeAt: wallet.lastRechargeAt,
    createdAt: wallet.createdAt,
    updatedAt: wallet.updatedAt,
  };
}

function serializeTransaction(transaction: any) {
  return {
    id: transaction._id.toString(),
    userId: transaction.userId.toString(),
    type: transaction.type,
    status: transaction.status,
    amount: transaction.amount,
    paidAmount: transaction.paidAmount,
    bonusAmount: transaction.bonusAmount,
    balanceAfter: transaction.balanceAfter,
    idempotencyKey: transaction.idempotencyKey,
    referenceId: transaction.referenceId,
    reservationId: transaction.reservationId?.toString(),
    platform: transaction.platform,
    productId: transaction.productId,
    metadata: transaction.metadata,
    createdAt: transaction.createdAt,
  };
}

function serializeReservation(reservation: any) {
  return {
    id: reservation._id.toString(),
    userId: reservation.userId.toString(),
    amount: reservation.amount,
    status: reservation.status,
    sessionId: reservation.sessionId,
    action: reservation.action,
    expiresAt: reservation.expiresAt,
    settledAt: reservation.settledAt,
    releasedAt: reservation.releasedAt,
    createdAt: reservation.createdAt,
    updatedAt: reservation.updatedAt,
  };
}

// Made with Bob
