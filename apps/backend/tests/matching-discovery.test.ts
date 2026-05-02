import "./helpers/env.ts";

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ObjectId } from "mongodb";
import { InMemoryDb } from "./helpers/in-memory-db.ts";
import { COLLECTIONS } from "../src/types/database.ts";
import { MatchingService } from "../src/lib/matching-service.ts";
import { DiscoveryService } from "../src/lib/discovery-service.ts";

describe("matching and discovery", () => {
  it("creates a mutual match and conversation when both users like each other", async () => {
    const { db, users } = await seedMatchingDb();
    const matchingService = new MatchingService(db as any);

    const firstLike = await matchingService.sendLike(users.alice, users.bob, "like");
    assert.equal(firstLike.matched, false);

    const mutualLike = await matchingService.sendLike(users.bob, users.alice, "super_like");
    assert.equal(mutualLike.matched, true);
    assert.ok(mutualLike.match?.id);

    assert.equal(await db.collection(COLLECTIONS.LIKES).countDocuments(), 2);
    assert.equal(await db.collection(COLLECTIONS.MATCHES).countDocuments(), 1);
    assert.equal(await db.collection(COLLECTIONS.CONVERSATIONS).countDocuments(), 1);
  });

  it("excludes already liked and actively matched profiles from discovery feed", async () => {
    const { db, users } = await seedMatchingDb();
    const matchingService = new MatchingService(db as any);

    await matchingService.sendLike(users.alice, users.bob, "like");
    await matchingService.sendLike(users.alice, users.charlie, "like");
    await matchingService.sendLike(users.charlie, users.alice, "like");

    const discoveryService = new DiscoveryService(
      db.collection(COLLECTIONS.PROFILES) as any,
      db.collection(COLLECTIONS.MEDIA) as any,
      db.collection(COLLECTIONS.LIKES) as any,
      db.collection(COLLECTIONS.MATCHES) as any,
    );
    const feed = await discoveryService.getDiscoveryFeed(
      users.alice,
      {
        location: { type: "Point", coordinates: [-97.7431, 30.2672] },
        maxDistance: 50,
        minAge: 18,
        maxAge: 40,
      },
      10,
    );

    assert.deepEqual(
      feed.candidates.map((candidate) => candidate.userId),
      [users.dana.toString()],
    );
  });
});

async function seedMatchingDb() {
  const db = new InMemoryDb();
  const users = {
    alice: new ObjectId(),
    bob: new ObjectId(),
    charlie: new ObjectId(),
    dana: new ObjectId(),
  };

  await db.collection(COLLECTIONS.PROFILES).insertMany([
    createProfile(users.alice, "Alice", "female", ["male"], ["music", "travel"]),
    createProfile(users.bob, "Bob", "male", ["female"], ["music", "fitness"]),
    createProfile(users.charlie, "Charlie", "male", ["female"], ["art", "travel"]),
    createProfile(users.dana, "Dana", "female", ["male"], ["music", "food"]),
  ]);

  return { db, users };
}

function createProfile(
  userId: ObjectId,
  displayName: string,
  gender: string,
  lookingFor: string[],
  interests: string[],
) {
  const now = new Date();
  return {
    _id: new ObjectId(),
    userId,
    displayName,
    dateOfBirth: new Date("1995-01-01"),
    age: 31,
    gender,
    bio: `${displayName} bio is long enough`,
    location: { type: "Point", coordinates: [-97.7431, 30.2672] },
    city: "Austin",
    country: "US",
    intent: "serious",
    lookingFor,
    ageRange: { min: 18, max: 40 },
    maxDistance: 50,
    interests,
    prompts: [{ question: "My ideal first date", answer: "Coffee and a walk" }],
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
