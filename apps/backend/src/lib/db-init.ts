import { Db } from "mongodb";
import type { IndexSpecification } from "mongodb";
import { logger } from "../config";
import { COLLECTIONS } from "../types/database";

/**
 * Initialize MongoDB collections and indexes
 * Based on Section 9.1 of Delta Developer Documentation
 */
export async function initializeDatabase(db: Db): Promise<void> {
  logger.info("Initializing database collections and indexes...");

  try {
    // Users Collection
    await ensureCollection(db, COLLECTIONS.USERS);
    await createIndexes(db, COLLECTIONS.USERS, [
      { key: { email: 1 }, unique: true, sparse: true },
      { key: { phone: 1 }, unique: true, sparse: true },
      { key: { status: 1 } },
      { key: { createdAt: 1 } },
    ]);

    // Sessions Collection (for Better-auth)
    await ensureCollection(db, COLLECTIONS.SESSIONS);
    await createIndexes(db, COLLECTIONS.SESSIONS, [
      { key: { token: 1 }, unique: true },
      { key: { userId: 1 } },
      { key: { expiresAt: 1 }, expireAfterSeconds: 0 }, // TTL index
    ]);

    // Verification Tokens Collection (for Better-auth)
    await ensureCollection(db, COLLECTIONS.VERIFICATION_TOKENS);
    await createIndexes(db, COLLECTIONS.VERIFICATION_TOKENS, [
      { key: { identifier: 1, token: 1 } },
      { key: { expiresAt: 1 }, expireAfterSeconds: 0 }, // TTL index
    ]);

    // Profiles Collection
    await ensureCollection(db, COLLECTIONS.PROFILES);
    await createIndexes(db, COLLECTIONS.PROFILES, [
      { key: { userId: 1 }, unique: true },
      { key: { location: "2dsphere" } }, // Geospatial index
      { key: { intent: 1 } },
      { key: { interests: 1 } },
      { key: { visibility: 1 } },
      { key: { updatedAt: 1 } },
      { key: { country: 1, visibility: 1 } },
    ]);

    // Media Collection
    await ensureCollection(db, COLLECTIONS.MEDIA);
    await createIndexes(db, COLLECTIONS.MEDIA, [
      { key: { userId: 1 } },
      { key: { mediaType: 1 } },
      { key: { moderationStatus: 1 } },
      { key: { fileId: 1 }, unique: true },
      { key: { createdAt: 1 } },
      { key: { userId: 1, mediaType: 1, moderationStatus: 1 } },
    ]);

    // Likes Collection
    await ensureCollection(db, COLLECTIONS.LIKES);
    await createIndexes(db, COLLECTIONS.LIKES, [
      { key: { fromUserId: 1, toUserId: 1 }, unique: true },
      { key: { toUserId: 1 } },
      { key: { fromUserId: 1, status: 1 } },
      { key: { createdAt: 1 } },
    ]);

    // Matches Collection
    await ensureCollection(db, COLLECTIONS.MATCHES);
    await createIndexes(db, COLLECTIONS.MATCHES, [
      { key: { participants: 1 } },
      { key: { participantKey: 1 }, unique: true, sparse: true },
      { key: { status: 1 } },
      { key: { participants: 1, status: 1, matchedAt: -1 } },
      { key: { lastMessageAt: 1 } },
      { key: { matchedAt: 1 } },
    ]);

    // Conversations Collection
    await ensureCollection(db, COLLECTIONS.CONVERSATIONS);
    await createIndexes(db, COLLECTIONS.CONVERSATIONS, [
      { key: { matchId: 1 }, unique: true },
      { key: { participants: 1 } },
      { key: { participants: 1, status: 1, lastMessageAt: -1 } },
      { key: { updatedAt: 1 } },
    ]);

    // Messages Collection
    await ensureCollection(db, COLLECTIONS.MESSAGES);
    await createIndexes(db, COLLECTIONS.MESSAGES, [
      { key: { conversationId: 1, createdAt: 1 } },
      { key: { conversationId: 1, _id: -1 } },
      { key: { senderId: 1 } },
      { key: { recipientIds: 1, readBy: 1 } },
      { key: { moderationStatus: 1 } },
    ]);

    // Wallets Collection
    await ensureCollection(db, COLLECTIONS.WALLETS);
    await createIndexes(db, COLLECTIONS.WALLETS, [
      { key: { userId: 1 }, unique: true },
    ]);

    // Wallet Transactions Collection
    await ensureCollection(db, COLLECTIONS.WALLET_TRANSACTIONS);
    await createIndexes(db, COLLECTIONS.WALLET_TRANSACTIONS, [
      { key: { userId: 1, createdAt: 1 } },
      { key: { idempotencyKey: 1 }, unique: true },
      { key: { referenceId: 1 } },
      { key: { type: 1 } },
      { key: { status: 1 } },
      { key: { userId: 1, status: 1 } },
    ]);

    // Token Reservations Collection
    await ensureCollection(db, COLLECTIONS.TOKEN_RESERVATIONS);
    await createIndexes(db, COLLECTIONS.TOKEN_RESERVATIONS, [
      { key: { userId: 1 } },
      { key: { idempotencyKey: 1 }, unique: true },
      { key: { sessionId: 1 } },
      { key: { status: 1 } },
      { key: { userId: 1, status: 1 } },
      { key: { expiresAt: 1 }, expireAfterSeconds: 0 }, // TTL index
    ]);

    // Live Match Tickets Collection
    await ensureCollection(db, COLLECTIONS.LIVE_MATCH_TICKETS);
    await createIndexes(db, COLLECTIONS.LIVE_MATCH_TICKETS, [
      { key: { userId: 1 } },
      { key: { userId: 1, status: 1 } },
      { key: { status: 1 } },
      { key: { region: 1, intent: 1, status: 1, createdAt: 1 } },
      { key: { poolKeys: 1 } },
      { key: { sessionId: 1 } },
      { key: { createdAt: 1 } },
      { key: { expiresAt: 1 }, expireAfterSeconds: 0 }, // TTL index
    ]);

    // Live Sessions Collection
    await ensureCollection(db, COLLECTIONS.LIVE_SESSIONS);
    await createIndexes(db, COLLECTIONS.LIVE_SESSIONS, [
      { key: { participants: 1 } },
      { key: { status: 1 } },
      { key: { billingStatus: 1 } },
      { key: { region: 1 } },
      { key: { interest: 1 } },
      { key: { startedAt: 1 } },
      { key: { sessionId: 1 }, unique: true },
    ]);

    // Live Session Events Collection
    await ensureCollection(db, COLLECTIONS.LIVE_SESSION_EVENTS);
    await createIndexes(db, COLLECTIONS.LIVE_SESSION_EVENTS, [
      { key: { sessionId: 1, createdAt: 1 } },
      { key: { type: 1 } },
    ]);

    // Reports Collection
    await ensureCollection(db, COLLECTIONS.REPORTS);
    await createIndexes(db, COLLECTIONS.REPORTS, [
      { key: { reportedUserId: 1 } },
      { key: { reporterUserId: 1 } },
      { key: { severity: 1 } },
      { key: { status: 1 } },
      { key: { createdAt: 1 } },
      { key: { status: 1, severity: 1 } },
    ]);

    // Blocks Collection
    await ensureCollection(db, COLLECTIONS.BLOCKS);
    await createIndexes(db, COLLECTIONS.BLOCKS, [
      { key: { blockerUserId: 1, blockedUserId: 1 }, unique: true },
      { key: { blockerUserId: 1 } },
      { key: { blockedUserId: 1 } },
      { key: { createdAt: 1 } },
    ]);

    // Moderation Cases Collection
    await ensureCollection(db, COLLECTIONS.MODERATION_CASES);
    await createIndexes(db, COLLECTIONS.MODERATION_CASES, [
      { key: { status: 1 } },
      { key: { severity: 1 } },
      { key: { assignedTo: 1 } },
      { key: { createdAt: 1 } },
      { key: { targetUserId: 1 } },
    ]);

    // Trust Scores Collection
    await ensureCollection(db, COLLECTIONS.TRUST_SCORES);
    await createIndexes(db, COLLECTIONS.TRUST_SCORES, [
      { key: { userId: 1 }, unique: true },
      { key: { score: 1 } },
      { key: { riskLevel: 1 } },
    ]);

    // Audit Logs Collection
    await ensureCollection(db, COLLECTIONS.AUDIT_LOGS);
    await createIndexes(db, COLLECTIONS.AUDIT_LOGS, [
      { key: { actorId: 1 } },
      { key: { targetUserId: 1 } },
      { key: { action: 1 } },
      { key: { createdAt: 1 } },
    ]);

    // Analytics Events Collection
    await ensureCollection(db, COLLECTIONS.ANALYTICS_EVENTS);
    await createIndexes(db, COLLECTIONS.ANALYTICS_EVENTS, [
      { key: { eventName: 1 } },
      { key: { userId: 1 } },
      { key: { sessionId: 1 } },
      { key: { createdAt: 1 } },
      { key: { eventName: 1, createdAt: 1 } },
    ]);

    // Dashboard Metrics Collection
    await ensureCollection(db, COLLECTIONS.DASHBOARD_METRICS);
    await createIndexes(db, COLLECTIONS.DASHBOARD_METRICS, [
      { key: { metricDate: 1 } },
      { key: { metricName: 1 } },
      { key: { metricDate: 1, metricName: 1 } },
      { key: { dimensions: 1 } },
    ]);

    logger.info("✅ Database initialization complete");
  } catch (error) {
    logger.error({ error }, "Failed to initialize database");
    throw error;
  }
}

async function ensureCollection(db: Db, collectionName: string): Promise<void> {
  const collections = await db
    .listCollections({ name: collectionName })
    .toArray();

  if (collections.length === 0) {
    await db.createCollection(collectionName);
    logger.info(`Created collection: ${collectionName}`);
  } else {
    logger.debug(`Collection already exists: ${collectionName}`);
  }
}

interface IndexOptions {
  key: IndexSpecification;
  unique?: boolean;
  sparse?: boolean;
  expireAfterSeconds?: number;
}

async function createIndexes(
  db: Db,
  collectionName: string,
  indexes: IndexOptions[],
): Promise<void> {
  const collection = db.collection(collectionName);

  for (const indexSpec of indexes) {
    try {
      const { key, ...options } = indexSpec;
      await collection.createIndex(key, options);
      logger.debug(
        `Created index on ${collectionName}: ${JSON.stringify(key)}`,
      );
    } catch (error: any) {
      // Ignore duplicate index errors
      if (error.code !== 85 && error.code !== 86) {
        logger.warn(
          { error, collection: collectionName, index: indexSpec.key },
          "Failed to create index",
        );
      }
    }
  }
}

// Made with Bob
