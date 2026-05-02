import "./helpers/env.ts";

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ObjectId } from "mongodb";
import { InMemoryDb } from "./helpers/in-memory-db.ts";
import { WalletService } from "../src/lib/wallet-service.ts";

describe("wallet", () => {
  it("credits purchases idempotently and reports ledger balance", async () => {
    const db = new InMemoryDb();
    const userId = new ObjectId();
    const walletService = new WalletService(db as any);

    const first = await walletService.creditPurchase({
      userId,
      platform: "ios",
      productId: "com.delta.tokens.100",
      transactionId: "txn-1",
      receipt: "receipt",
      idempotencyKey: "purchase-key-1",
    });
    const second = await walletService.creditPurchase({
      userId,
      platform: "ios",
      productId: "com.delta.tokens.100",
      transactionId: "txn-1",
      receipt: "receipt",
      idempotencyKey: "purchase-key-1",
    });
    const summary = await walletService.getWallet(userId);

    assert.equal(first.wallet.balance, 100);
    assert.equal(second.wallet.balance, 100);
    assert.equal(summary.transactions.length, 1);
    assert.equal(summary.ledgerBalance, 100);
  });

  it("reserves, settles, and refunds tokens with idempotent ledger entries", async () => {
    const db = new InMemoryDb();
    const userId = new ObjectId();
    const walletService = new WalletService(db as any);

    await walletService.creditPurchase({
      userId,
      platform: "android",
      productId: "delta_tokens_250",
      transactionId: "txn-2",
      receipt: "receipt",
      idempotencyKey: "purchase-key-2",
    });

    const reservation = await walletService.createReservation({
      userId,
      amount: 10,
      action: "live_match",
      sessionId: "session-1",
      idempotencyKey: "reserve-key-1",
      ttlSeconds: 900,
    });

    assert.equal(reservation.wallet.balance, 265);
    assert.equal(reservation.wallet.reservedBalance, 10);

    const settled = await walletService.settleReservation(
      userId,
      reservation.reservation._id,
      "settle-key-1",
    );
    const settledAgain = await walletService.settleReservation(
      userId,
      reservation.reservation._id,
      "settle-key-1",
    );

    assert.equal(settled.wallet.balance, 265);
    assert.equal(settled.wallet.reservedBalance, 0);
    assert.equal(settled.wallet.lifetimeSpent, 10);
    assert.equal(settledAgain.wallet.balance, 265);

    const secondReservation = await walletService.createReservation({
      userId,
      amount: 5,
      action: "super_like",
      idempotencyKey: "reserve-key-2",
      ttlSeconds: 900,
    });
    const refunded = await walletService.releaseReservation(
      userId,
      secondReservation.reservation._id,
      "refund-key-1",
    );

    assert.equal(refunded.wallet.balance, 265);
    assert.equal(refunded.wallet.reservedBalance, 0);

    const summary = await walletService.getWallet(userId, 20);
    assert.equal(summary.wallet.balance, 265);
    assert.equal(summary.ledgerBalance, 265);
  });
});

// Made with Bob
