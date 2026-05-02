import { MongoClient, Db } from "mongodb";
import { env } from "./env";
import { logger } from "./logger";
import { initializeDatabase } from "../lib/db-init";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDatabase(skipInit = false): Promise<Db> {
  if (db) {
    return db;
  }

  try {
    logger.info("Connecting to MongoDB...");

    client = new MongoClient(env.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await client.connect();

    db = client.db(env.MONGODB_DB_NAME);

    // Test the connection
    await db.command({ ping: 1 });

    logger.info(
      { database: env.MONGODB_DB_NAME },
      "MongoDB connected successfully",
    );

    // Initialize collections and indexes
    if (!skipInit) {
      await initializeDatabase(db);
    }

    return db;
  } catch (error) {
    logger.error({ error }, "Failed to connect to MongoDB");
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    logger.info("MongoDB disconnected");
  }
}

export function getDatabase(): Db {
  if (!db) {
    throw new Error("Database not initialized. Call connectDatabase() first.");
  }
  return db;
}

// Graceful shutdown
process.on("SIGINT", async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await disconnectDatabase();
  process.exit(0);
});

// Made with Bob
