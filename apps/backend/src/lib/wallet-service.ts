/**
 * Wallet Service
 * Ledger-backed token wallet operations.
 */

import { ObjectId, type Collection, type Db } from "mongodb";
import { env } from "../config/env";
import { COLLECTIONS } from "../types/database";
import type {
  PurchasePlatform,
  TokenPackage,
  TokenReservation,
  Wallet,
  WalletTransaction,
} from "../types/wallet";
import { TOKEN_PACKAGES } from "../types/wallet";
import {
  ConflictError,
  ExternalServiceError,
  NotFoundError,
  ValidationError,
} from "../utils/errors";

interface CreditPurchaseInput {
  userId: ObjectId;
  platform: PurchasePlatform;
  productId: string;
  transactionId: string;
  receipt: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
}

interface CreateReservationInput {
  userId: ObjectId;
  amount: number;
  action: TokenReservation["action"];
  sessionId?: string;
  idempotencyKey: string;
  ttlSeconds: number;
}

export class WalletService {
  private walletsCollection: Collection<Wallet>;
  private transactionsCollection: Collection<WalletTransaction>;
  private reservationsCollection: Collection<TokenReservation>;

  constructor(private db: Db) {
    this.walletsCollection = db.collection<Wallet>(COLLECTIONS.WALLETS);
    this.transactionsCollection = db.collection<WalletTransaction>(
      COLLECTIONS.WALLET_TRANSACTIONS,
    );
    this.reservationsCollection = db.collection<TokenReservation>(
      COLLECTIONS.TOKEN_RESERVATIONS,
    );
  }

  getPackages(): TokenPackage[] {
    return TOKEN_PACKAGES;
  }

  async getWallet(
    userId: ObjectId,
    historyLimit = 20,
  ): Promise<{
    wallet: Wallet;
    transactions: WalletTransaction[];
    ledgerBalance: number;
  }> {
    const wallet = await this.ensureWallet(userId);
    const transactions = await this.transactionsCollection
      .find({ userId })
      .sort({ createdAt: -1, _id: -1 })
      .limit(historyLimit)
      .toArray();
    const ledgerBalance = await this.calculateLedgerBalance(userId);

    return { wallet, transactions, ledgerBalance };
  }

  async creditPurchase(input: CreditPurchaseInput): Promise<{
    wallet: Wallet;
    transaction: WalletTransaction;
    package: TokenPackage;
  }> {
    const existing = await this.transactionsCollection.findOne({
      idempotencyKey: input.idempotencyKey,
    });

    if (existing) {
      const wallet = await this.ensureWallet(input.userId);
      const tokenPackage = this.getPackageForPlatformProduct(
        input.platform,
        existing.productId || input.productId,
      );
      return { wallet, transaction: existing, package: tokenPackage };
    }

    const tokenPackage = this.getPackageForPlatformProduct(
      input.platform,
      input.productId,
    );
    verifyPurchaseReceipt(input.platform, input.receipt);

    const totalTokens = tokenPackage.tokens + tokenPackage.bonusTokens;
    const now = new Date();
    await this.ensureWallet(input.userId);

    const wallet = await this.walletsCollection.findOneAndUpdate(
      { userId: input.userId },
      {
        $inc: {
          balance: totalTokens,
          paidBalance: tokenPackage.tokens,
          bonusBalance: tokenPackage.bonusTokens,
          lifetimePurchased: totalTokens,
        },
        $set: {
          lastRechargeAt: now,
          updatedAt: now,
        },
      },
      { returnDocument: "after" },
    );

    if (!wallet) {
      throw new NotFoundError("Wallet");
    }

    const transaction = await this.createTransaction({
      userId: input.userId,
      type: "purchase",
      status: "completed",
      amount: totalTokens,
      paidAmount: tokenPackage.tokens,
      bonusAmount: tokenPackage.bonusTokens,
      balanceAfter: wallet.balance,
      idempotencyKey: input.idempotencyKey,
      referenceId: input.transactionId,
      platform: input.platform,
      productId: input.productId,
      metadata: {
        ...input.metadata,
        packageId: tokenPackage.id,
        priceCents: tokenPackage.priceCents,
        currency: tokenPackage.currency,
      },
    });

    return { wallet, transaction, package: tokenPackage };
  }

  async createReservation(input: CreateReservationInput): Promise<{
    wallet: Wallet;
    reservation: TokenReservation;
    transaction: WalletTransaction;
  }> {
    const existingReservation = await this.reservationsCollection.findOne({
      idempotencyKey: input.idempotencyKey,
    });

    if (existingReservation) {
      const wallet = await this.ensureWallet(input.userId);
      const transaction = await this.transactionsCollection.findOne({
        reservationId: existingReservation._id,
        type: "reservation",
      });
      if (!transaction) {
        throw new ConflictError("Reservation exists without ledger transaction");
      }
      return { wallet, reservation: existingReservation, transaction };
    }

    await this.ensureWallet(input.userId);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + input.ttlSeconds * 1000);
    const wallet = await this.walletsCollection.findOneAndUpdate(
      {
        userId: input.userId,
        balance: { $gte: input.amount },
      },
      {
        $inc: {
          balance: -input.amount,
          reservedBalance: input.amount,
        },
        $set: { updatedAt: now },
      },
      { returnDocument: "after" },
    );

    if (!wallet) {
      throw new ConflictError("Insufficient token balance");
    }

    const reservationResult = await this.reservationsCollection.insertOne({
      userId: input.userId,
      amount: input.amount,
      status: "active",
      sessionId: input.sessionId,
      action: input.action,
      idempotencyKey: input.idempotencyKey,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    } as TokenReservation);

    const transaction = await this.createTransaction({
      userId: input.userId,
      type: "reservation",
      status: "completed",
      amount: -input.amount,
      balanceAfter: wallet.balance,
      idempotencyKey: `reservation:${input.idempotencyKey}`,
      reservationId: reservationResult.insertedId,
      referenceId: input.sessionId,
      metadata: { action: input.action },
    });

    const reservation = await this.reservationsCollection.findOne({
      _id: reservationResult.insertedId,
    });

    if (!reservation) {
      throw new ValidationError("Unable to create reservation");
    }

    return { wallet, reservation, transaction };
  }

  async settleReservation(
    userId: ObjectId,
    reservationId: ObjectId,
    idempotencyKey: string,
  ): Promise<{
    wallet: Wallet;
    reservation: TokenReservation;
    transaction: WalletTransaction;
  }> {
    return this.completeReservation(
      userId,
      reservationId,
      idempotencyKey,
      "settled",
    );
  }

  async releaseReservation(
    userId: ObjectId,
    reservationId: ObjectId,
    idempotencyKey: string,
  ): Promise<{
    wallet: Wallet;
    reservation: TokenReservation;
    transaction: WalletTransaction;
  }> {
    return this.completeReservation(
      userId,
      reservationId,
      idempotencyKey,
      "released",
    );
  }

  async adminAdjustBalance(input: {
    userId: ObjectId;
    amount: number;
    reason: string;
    actorId: ObjectId;
    idempotencyKey: string;
  }): Promise<{ wallet: Wallet; transaction: WalletTransaction }> {
    const existing = await this.transactionsCollection.findOne({
      idempotencyKey: input.idempotencyKey,
    });

    if (existing) {
      const wallet = await this.ensureWallet(input.userId);
      return { wallet, transaction: existing };
    }

    await this.ensureWallet(input.userId);
    const now = new Date();
    const wallet = await this.walletsCollection.findOneAndUpdate(
      {
        userId: input.userId,
        ...(input.amount < 0 ? { balance: { $gte: Math.abs(input.amount) } } : {}),
      },
      {
        $inc: {
          balance: input.amount,
          bonusBalance: input.amount > 0 ? input.amount : 0,
        },
        $set: { updatedAt: now },
      },
      { returnDocument: "after" },
    );

    if (!wallet) {
      throw new ConflictError("Insufficient token balance for adjustment");
    }

    const transaction = await this.createTransaction({
      userId: input.userId,
      type: "admin_adjustment",
      status: "completed",
      amount: input.amount,
      balanceAfter: wallet.balance,
      idempotencyKey: input.idempotencyKey,
      referenceId: input.actorId.toString(),
      metadata: { reason: input.reason },
    });

    return { wallet, transaction };
  }

  private async completeReservation(
    userId: ObjectId,
    reservationId: ObjectId,
    idempotencyKey: string,
    nextStatus: "settled" | "released",
  ): Promise<{
    wallet: Wallet;
    reservation: TokenReservation;
    transaction: WalletTransaction;
  }> {
    const existing = await this.transactionsCollection.findOne({
      idempotencyKey,
    });

    if (existing) {
      const wallet = await this.ensureWallet(userId);
      const reservation = await this.reservationsCollection.findOne({
        _id: reservationId,
      });
      if (!reservation) {
        throw new NotFoundError("Reservation");
      }
      return { wallet, reservation, transaction: existing };
    }

    const reservation = await this.reservationsCollection.findOne({
      _id: reservationId,
      userId,
    });

    if (!reservation) {
      throw new NotFoundError("Reservation");
    }

    if (reservation.status !== "active") {
      throw new ConflictError(`Reservation is already ${reservation.status}`);
    }

    const now = new Date();
    const walletUpdate =
      nextStatus === "settled"
        ? {
            $inc: {
              reservedBalance: -reservation.amount,
              lifetimeSpent: reservation.amount,
            },
            $set: { updatedAt: now },
          }
        : {
            $inc: {
              reservedBalance: -reservation.amount,
              balance: reservation.amount,
            },
            $set: { updatedAt: now },
          };

    const wallet = await this.walletsCollection.findOneAndUpdate(
      {
        userId,
        reservedBalance: { $gte: reservation.amount },
      },
      walletUpdate,
      { returnDocument: "after" },
    );

    if (!wallet) {
      throw new ConflictError("Reserved token balance is unavailable");
    }

    const reservationUpdate =
      nextStatus === "settled"
        ? { status: nextStatus, settledAt: now, updatedAt: now }
        : { status: nextStatus, releasedAt: now, updatedAt: now };

    await this.reservationsCollection.updateOne(
      { _id: reservation._id },
      { $set: reservationUpdate },
    );

    const transaction = await this.createTransaction({
      userId,
      type: nextStatus === "settled" ? "settlement" : "refund",
      status: "completed",
      amount: nextStatus === "settled" ? 0 : reservation.amount,
      balanceAfter: wallet.balance,
      idempotencyKey,
      reservationId: reservation._id,
      referenceId: reservation.sessionId,
      metadata: { action: reservation.action },
    });

    const updatedReservation = await this.reservationsCollection.findOne({
      _id: reservation._id,
    });

    if (!updatedReservation) {
      throw new NotFoundError("Reservation");
    }

    return { wallet, reservation: updatedReservation, transaction };
  }

  private async ensureWallet(userId: ObjectId): Promise<Wallet> {
    const now = new Date();
    const wallet = await this.walletsCollection.findOneAndUpdate(
      { userId },
      {
        $setOnInsert: {
          userId,
          balance: 0,
          paidBalance: 0,
          bonusBalance: 0,
          reservedBalance: 0,
          lifetimePurchased: 0,
          lifetimeSpent: 0,
          createdAt: now,
        },
        $set: { updatedAt: now },
      },
      { upsert: true, returnDocument: "after" },
    );

    if (!wallet) {
      throw new ValidationError("Unable to initialize wallet");
    }

    return wallet;
  }

  private async createTransaction(
    transaction: Omit<WalletTransaction, "_id" | "createdAt" | "updatedAt">,
  ): Promise<WalletTransaction> {
    const now = new Date();
    try {
      const result = await this.transactionsCollection.insertOne({
        ...transaction,
        createdAt: now,
        updatedAt: now,
      } as WalletTransaction);

      const created = await this.transactionsCollection.findOne({
        _id: result.insertedId,
      });

      if (!created) {
        throw new ValidationError("Unable to create wallet transaction");
      }

      return created;
    } catch (error: any) {
      if (error?.code === 11000) {
        const existing = await this.transactionsCollection.findOne({
          idempotencyKey: transaction.idempotencyKey,
        });
        if (existing) {
          return existing;
        }
      }
      throw error;
    }
  }

  private async calculateLedgerBalance(userId: ObjectId): Promise<number> {
    const [result] = await this.transactionsCollection
      .aggregate<{ balance: number }>([
        {
          $match: {
            userId,
            status: "completed",
            type: { $ne: "settlement" },
          },
        },
        { $group: { _id: null, balance: { $sum: "$amount" } } },
      ])
      .toArray();

    return result?.balance || 0;
  }

  private getPackageForPlatformProduct(
    platform: PurchasePlatform,
    productId: string,
  ): TokenPackage {
    const tokenPackage = TOKEN_PACKAGES.find(
      (pkg) =>
        pkg.productId === productId || pkg.platformProductIds[platform] === productId,
    );

    if (!tokenPackage) {
      throw new ValidationError("Unknown token package");
    }

    return tokenPackage;
  }
}

function verifyPurchaseReceipt(platform: PurchasePlatform, receipt: string): void {
  const hasPlatformConfig =
    platform === "ios"
      ? Boolean(env.APPLE_IAP_SHARED_SECRET)
      : Boolean(env.GOOGLE_PLAY_PACKAGE_NAME);

  if (!hasPlatformConfig && env.APP_ENV === "production") {
    throw new ExternalServiceError(
      platform === "ios" ? "Apple IAP" : "Google Play Billing",
      "Purchase verification is not configured",
    );
  }

  if (!receipt.trim()) {
    throw new ValidationError("Purchase receipt is required");
  }
}

// Made with Bob
