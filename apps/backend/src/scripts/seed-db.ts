#!/usr/bin/env bun

/**
 * Database Seed Script
 *
 * Seeds the database with sample data for development
 * Usage: bun run src/scripts/seed-db.ts
 */

import { ObjectId } from "mongodb";
import {
  connectDatabase,
  disconnectDatabase,
  getDatabase,
} from "../config/database";
import { logger } from "../config/logger";
import { COLLECTIONS } from "../types/database";

async function main() {
  try {
    logger.info("Starting database seeding...");

    // Connect to database
    await connectDatabase();
    const db = getDatabase();

    // Clear existing data (development only!)
    logger.info("Clearing existing data...");
    const collections = [
      COLLECTIONS.USERS,
      COLLECTIONS.PROFILES,
      COLLECTIONS.WALLETS,
      COLLECTIONS.TRUST_SCORES,
    ];

    for (const collection of collections) {
      await db.collection(collection).deleteMany({});
    }

    // Create sample users
    logger.info("Creating sample users...");
    const users = [
      {
        _id: new ObjectId(),
        email: "alice@example.com",
        emailVerified: true,
        phoneVerified: false,
        status: "active" as const,
        accountType: "free" as const,
        lastActiveAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        email: "bob@example.com",
        emailVerified: true,
        phoneVerified: false,
        status: "active" as const,
        accountType: "premium" as const,
        lastActiveAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        email: "charlie@example.com",
        emailVerified: true,
        phoneVerified: true,
        status: "active" as const,
        accountType: "free" as const,
        lastActiveAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection(COLLECTIONS.USERS).insertMany(users);
    logger.info(`Created ${users.length} users`);

    // Create sample profiles
    logger.info("Creating sample profiles...");
    const profiles = [
      {
        _id: new ObjectId(),
        userId: users[0]!._id,
        displayName: "Alice",
        birthDate: new Date("1995-06-15"),
        ageVisibility: "visible" as const,
        datingIntent: "serious" as const,
        gender: "female" as const,
        interestedIn: ["male" as const],
        location: {
          type: "Point" as const,
          coordinates: [-97.7431, 30.2672], // Austin, TX
        },
        city: "Austin",
        state: "Texas",
        country: "United States",
        interests: ["music", "travel", "technology"],
        prompts: [
          { promptId: "p1", answer: "I love exploring new coffee shops!" },
        ],
        mediaIds: [],
        verificationStatus: "verified" as const,
        visibility: "active" as const,
        bio: "Software engineer who loves music and travel",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        userId: users[1]!._id,
        displayName: "Bob",
        birthDate: new Date("1992-03-22"),
        ageVisibility: "visible" as const,
        datingIntent: "casual" as const,
        gender: "male" as const,
        interestedIn: ["female" as const],
        location: {
          type: "Point" as const,
          coordinates: [-97.7431, 30.2672], // Austin, TX
        },
        city: "Austin",
        state: "Texas",
        country: "United States",
        interests: ["fitness", "movies", "food"],
        prompts: [
          { promptId: "p1", answer: "Always up for trying new restaurants" },
        ],
        mediaIds: [],
        verificationStatus: "verified" as const,
        visibility: "active" as const,
        bio: "Fitness enthusiast and foodie",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        userId: users[2]!._id,
        displayName: "Charlie",
        birthDate: new Date("1998-11-08"),
        ageVisibility: "visible" as const,
        datingIntent: "friendship" as const,
        gender: "non-binary" as const,
        interestedIn: [
          "male" as const,
          "female" as const,
          "non-binary" as const,
        ],
        location: {
          type: "Point" as const,
          coordinates: [-97.7431, 30.2672], // Austin, TX
        },
        city: "Austin",
        state: "Texas",
        country: "United States",
        interests: ["art", "gaming", "music"],
        prompts: [
          { promptId: "p1", answer: "Looking for friends to game with!" },
        ],
        mediaIds: [],
        verificationStatus: "pending" as const,
        visibility: "active" as const,
        bio: "Artist and gamer",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection(COLLECTIONS.PROFILES).insertMany(profiles);
    logger.info(`Created ${profiles.length} profiles`);

    // Create sample wallets
    logger.info("Creating sample wallets...");
    const wallets = users.map((user) => ({
      _id: new ObjectId(),
      userId: user._id,
      balance: 100,
      paidBalance: 100,
      bonusBalance: 0,
      reservedBalance: 0,
      lifetimePurchased: 100,
      lifetimeSpent: 0,
      lastRechargeAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.collection(COLLECTIONS.WALLETS).insertMany(wallets);
    logger.info(`Created ${wallets.length} wallets`);

    // Create sample trust scores
    logger.info("Creating sample trust scores...");
    const trustScores = users.map((user) => ({
      _id: new ObjectId(),
      userId: user._id,
      score: 75,
      riskLevel: "low" as const,
      restrictions: {
        canLiveMatch: true,
        canMessage: true,
        canLike: true,
        requiresReview: false,
      },
      factors: {
        verificationStatus: 20,
        reportCount: 0,
        positiveInteractions: 15,
        accountAge: 20,
        deviceTrust: 20,
      },
      lastCalculatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.collection(COLLECTIONS.TRUST_SCORES).insertMany(trustScores);
    logger.info(`Created ${trustScores.length} trust scores`);

    logger.info("✅ Database seeding completed successfully!");
    logger.info(`
Sample Users:
- alice@example.com (Free, Verified)
- bob@example.com (Premium, Verified)
- charlie@example.com (Free, Pending Verification)

All users have 100 delt tokens and trust score of 75.
    `);

    // Disconnect
    await disconnectDatabase();

    process.exit(0);
  } catch (error) {
    logger.error({ error }, "❌ Database seeding failed");
    process.exit(1);
  }
}

main();

// Made with Bob
