import "./helpers/env.ts";

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ObjectId } from "mongodb";
import { InMemoryDb } from "./helpers/in-memory-db.ts";
import { COLLECTIONS } from "../src/types/database.ts";
import { LiveMatchService } from "../src/lib/live-match-service.ts";
import { liveMatchEvents } from "../src/lib/live-match-events.ts";
import { WalletService } from "../src/lib/wallet-service.ts";

describe("live match integration", () => {
  it("reserves tokens, pairs compatible users, creates a session, and settles on joins", async () => {
    const { db, users } = await seedLiveMatchDb();
    const service = new LiveMatchService(db as any);
    const aliceEvents: any[] = [];
    const bobEvents: any[] = [];
    liveMatchEvents.reset();
    const unsubscribeAlice = liveMatchEvents.subscribe(
      liveMatchEvents.topicForUser(users.alice),
      (event) => aliceEvents.push(event),
    );
    const unsubscribeBob = liveMatchEvents.subscribe(
      liveMatchEvents.topicForUser(users.bob),
      (event) => bobEvents.push(event),
    );

    const first = await service.search({
      userId: users.alice,
      region: "us-central",
      intent: "serious",
      interests: ["music", "travel"],
      idempotencyKey: "alice-live-search",
    });
    assert.equal(first.ticket.status, "searching");
    assert.equal(first.session, undefined);

    const second = await service.search({
      userId: users.bob,
      region: "us-central",
      intent: "serious",
      interests: ["music", "food"],
      idempotencyKey: "bob-live-search",
    });

    assert.equal(second.ticket.status, "matched");
    assert.equal(second.session?.status, "created");
    assert.equal(second.session?.billingStatus, "reserved");
    assert.equal(second.session?.interest, "music");
    assert.equal(aliceEvents.some((event) => event.type === "session_update"), true);
    assert.equal(bobEvents.some((event) => event.type === "ticket_update"), true);

    const token = await service.createParticipantToken(
      users.alice,
      second.session!.sessionId,
    );
    assert.equal(token.provider, "development");
    assert.match(token.token, /^dev-livekit-token:/);

    const waiting = await service.handleParticipantJoined({
      sessionId: second.session!.sessionId,
      userId: users.alice,
    });
    assert.equal(waiting.status, "waiting");
    assert.equal(waiting.billingStatus, "reserved");

    const active = await service.handleParticipantJoined({
      sessionId: second.session!.sessionId,
      userId: users.bob,
    });
    assert.equal(active.status, "active");
    assert.equal(active.billingStatus, "settled");
    assert.equal(
      aliceEvents.some(
        (event) =>
          event.type === "session_update" &&
          event.session?.status === "active" &&
          event.session?.billingStatus === "settled",
      ),
      true,
    );

    const walletService = new WalletService(db as any);
    const aliceWallet = await walletService.getWallet(users.alice);
    const bobWallet = await walletService.getWallet(users.bob);
    assert.equal(aliceWallet.wallet.balance, 90);
    assert.equal(aliceWallet.wallet.reservedBalance, 0);
    assert.equal(aliceWallet.wallet.lifetimeSpent, 10);
    assert.equal(bobWallet.wallet.balance, 90);
    assert.equal(bobWallet.wallet.lifetimeSpent, 10);

    unsubscribeAlice();
    unsubscribeBob();
  });

  it("cancels a searching ticket and refunds the reservation", async () => {
    const { db, users } = await seedLiveMatchDb();
    const service = new LiveMatchService(db as any);
    const ticket = await service.search({
      userId: users.alice,
      region: "us-central",
      intent: "friendship",
      interests: ["gaming"],
      idempotencyKey: "alice-cancel-search",
    });

    const cancelled = await service.cancel({
      userId: users.alice,
      ticketId: ticket.ticket._id,
      idempotencyKey: "alice-cancel-key",
    });
    const wallet = await new WalletService(db as any).getWallet(users.alice);

    assert.equal(cancelled.status, "cancelled");
    assert.equal(wallet.wallet.balance, 100);
    assert.equal(wallet.wallet.reservedBalance, 0);
  });
});

async function seedLiveMatchDb() {
  const db = new InMemoryDb();
  const users = {
    alice: new ObjectId(),
    bob: new ObjectId(),
  };
  const walletService = new WalletService(db as any);

  await db.collection(COLLECTIONS.PROFILES).insertMany([
    createProfile(users.alice, "Alice", "serious", ["music", "travel"]),
    createProfile(users.bob, "Bob", "serious", ["music", "food"]),
  ]);

  for (const [name, userId] of Object.entries(users)) {
    await walletService.creditPurchase({
      userId,
      platform: "ios",
      productId: "com.delta.tokens.100",
      transactionId: `txn-${name}`,
      receipt: "receipt",
      idempotencyKey: `purchase-${name}`,
    });
  }

  return { db, users };
}

function createProfile(
  userId: ObjectId,
  displayName: string,
  intent: string,
  interests: string[],
) {
  const now = new Date();
  return {
    _id: new ObjectId(),
    userId,
    displayName,
    dateOfBirth: new Date("1995-01-01"),
    age: 31,
    gender: "female",
    bio: `${displayName} profile`,
    location: { type: "Point", coordinates: [-97.7431, 30.2672] },
    country: "US",
    intent,
    lookingFor: ["male"],
    ageRange: { min: 18, max: 40 },
    maxDistance: 50,
    interests,
    prompts: [],
    photos: [],
    videos: [],
    verificationStatus: "verified",
    visibility: "active",
    completionScore: 80,
    createdAt: now,
    updatedAt: now,
    lastActiveAt: now,
  };
}

// Made with Bob
