import type { ObjectId } from "mongodb";

/**
 * Wallet and token economy domain types.
 */

export type WalletTransactionType =
  | "purchase"
  | "bonus"
  | "reservation"
  | "settlement"
  | "refund"
  | "admin_adjustment";

export type WalletTransactionStatus =
  | "pending"
  | "completed"
  | "failed"
  | "refunded";

export type TokenReservationStatus = "active" | "settled" | "released" | "expired";
export type PurchasePlatform = "ios" | "android";

export interface Wallet {
  _id: ObjectId;
  userId: ObjectId;
  balance: number;
  paidBalance: number;
  bonusBalance: number;
  reservedBalance: number;
  lifetimePurchased: number;
  lifetimeSpent: number;
  lastRechargeAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletTransaction {
  _id: ObjectId;
  userId: ObjectId;
  type: WalletTransactionType;
  status: WalletTransactionStatus;
  amount: number;
  paidAmount?: number;
  bonusAmount?: number;
  balanceAfter: number;
  idempotencyKey: string;
  referenceId?: string;
  reservationId?: ObjectId;
  platform?: PurchasePlatform;
  productId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenReservation {
  _id: ObjectId;
  userId: ObjectId;
  amount: number;
  status: TokenReservationStatus;
  sessionId?: string;
  action: "super_like" | "profile_boost" | "live_match" | "custom";
  idempotencyKey: string;
  expiresAt: Date;
  settledAt?: Date;
  releasedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenPackage {
  id: string;
  productId: string;
  platformProductIds: {
    ios: string;
    android: string;
  };
  name: string;
  tokens: number;
  bonusTokens: number;
  priceCents: number;
  currency: "USD";
}

export const TOKEN_PACKAGES: TokenPackage[] = [
  {
    id: "starter_100",
    productId: "delta_tokens_100",
    platformProductIds: {
      ios: "com.delta.tokens.100",
      android: "delta_tokens_100",
    },
    name: "Starter",
    tokens: 100,
    bonusTokens: 0,
    priceCents: 499,
    currency: "USD",
  },
  {
    id: "plus_250",
    productId: "delta_tokens_250",
    platformProductIds: {
      ios: "com.delta.tokens.250",
      android: "delta_tokens_250",
    },
    name: "Plus",
    tokens: 250,
    bonusTokens: 25,
    priceCents: 999,
    currency: "USD",
  },
  {
    id: "pro_600",
    productId: "delta_tokens_600",
    platformProductIds: {
      ios: "com.delta.tokens.600",
      android: "delta_tokens_600",
    },
    name: "Pro",
    tokens: 600,
    bonusTokens: 100,
    priceCents: 1999,
    currency: "USD",
  },
];

// Made with Bob
