import "./helpers/env.ts";

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ObjectId } from "mongodb";
import { InMemoryDb } from "./helpers/in-memory-db.ts";
import { COLLECTIONS } from "../src/types/database.ts";
import { SafetyService } from "../src/lib/safety-service.ts";
import { MatchingService } from "../src/lib/matching-service.ts";
import { LiveMatchService } from "../src/lib/live-match-service.ts";
import { WalletService } from "../src/lib/wallet-service.ts";
import { AdminService } from "../src/lib/admin-service.ts";
import { AuthorizationError } from "../src/utils/errors.ts";

describe("safety and admin", () => {
  it("creates reports, moderation cases, and trust score restrictions", async () => {
    const { db, users } = await seedSafetyDb();
    const service = new SafetyService(db as any);

    const result = await service.submitReport({
      reporterUserId: users.alice,
      reportedUserId: users.bob,
      category: "underage",
      description: "Profile appears to be underage",
      evidenceMediaIds: [],
    });

    assert.equal(result.report.severity, "critical");
    assert.equal(result.case.status, "open");
    assert.equal(result.trustScore.riskLevel, "high");
    assert.equal(result.trustScore.restrictions.canLiveMatch, false);
    assert.equal(await db.collection(COLLECTIONS.REPORTS).countDocuments(), 1);
    assert.equal(await db.collection(COLLECTIONS.MODERATION_CASES).countDocuments(), 1);

    await assert.rejects(
      () =>
        new LiveMatchService(db as any).search({
          userId: users.bob,
          region: "us-central",
          intent: "serious",
          interests: ["music"],
          idempotencyKey: "blocked-live-search",
        }),
      AuthorizationError,
    );
  });

  it("blocks users and prevents matching interactions", async () => {
    const { db, users } = await seedSafetyDb();
    await new SafetyService(db as any).blockUser({
      blockerUserId: users.alice,
      blockedUserId: users.bob,
      reason: "No contact",
    });

    await assert.rejects(
      () => new MatchingService(db as any).sendLike(users.bob, users.alice, "like"),
      AuthorizationError,
    );

    const blockedIds = await new SafetyService(db as any).getBlockedUserIds(users.alice);
    assert.deepEqual(blockedIds.map((id) => id.toString()), [users.bob.toString()]);
  });

  it("admin lists queues, updates users, creates audit logs, and returns analytics", async () => {
    const { db, users } = await seedSafetyDb();
    const safety = new SafetyService(db as any);
    await safety.submitReport({
      reporterUserId: users.alice,
      reportedUserId: users.bob,
      category: "spam",
      description: "Spam profile",
      evidenceMediaIds: [],
    });

    const admin = new AdminService(db as any);
    const reports = await admin.listReports({ status: "open", limit: 10 });
    assert.equal(reports.length, 1);

    const updated = await admin.updateUser({
      actorId: users.admin,
      targetUserId: users.bob,
      status: "suspended",
      verificationStatus: "rejected",
      reason: "Safety review",
    });
    assert.equal(updated?.status, "suspended");
    assert.equal(await db.collection(COLLECTIONS.AUDIT_LOGS).countDocuments(), 1);

    const analytics = await admin.getAnalytics();
    assert.equal(analytics.growth.users, 3);
    assert.equal(analytics.safety.reports, 1);
    assert.equal(analytics.safety.openReports, 1);
  });
});

async function seedSafetyDb() {
  const db = new InMemoryDb();
  const users = {
    alice: new ObjectId(),
    bob: new ObjectId(),
    admin: new ObjectId(),
  };
  const now = new Date();

  await db.collection(COLLECTIONS.USERS).insertMany([
    createUser(users.alice, "alice@example.com", "active", now),
    createUser(users.bob, "bob@example.com", "active", now),
    createUser(users.admin, "admin@example.com", "active", now),
  ]);
  await db.collection(COLLECTIONS.PROFILES).insertMany([
    createProfile(users.alice, "Alice"),
    createProfile(users.bob, "Bob"),
  ]);

  const wallet = new WalletService(db as any);
  for (const [name, userId] of Object.entries(users)) {
    await wallet.creditPurchase({
      userId,
      platform: "ios",
      productId: "com.delta.tokens.100",
      transactionId: `safety-${name}`,
      receipt: "receipt",
      idempotencyKey: `safety-purchase-${name}`,
    });
  }

  return { db, users };
}

function createUser(_id: ObjectId, email: string, status: string, now: Date) {
  return {
    _id,
    email,
    emailVerified: true,
    phoneVerified: false,
    status,
    createdAt: now,
    updatedAt: now,
  };
}

function createProfile(userId: ObjectId, displayName: string) {
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
    intent: "serious",
    lookingFor: ["male"],
    ageRange: { min: 18, max: 40 },
    maxDistance: 50,
    interests: ["music"],
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
