#!/usr/bin/env bun

/**
 * Database Initialization Script
 *
 * Run this script to initialize MongoDB collections and indexes
 * Usage: bun run src/scripts/init-db.ts
 */

import { connectDatabase, disconnectDatabase } from "../config/database";
import { logger } from "../config/logger";

async function main() {
  try {
    logger.info("Starting database initialization...");

    // Connect and initialize database
    await connectDatabase();

    logger.info("✅ Database initialization completed successfully!");

    // Disconnect
    await disconnectDatabase();

    process.exit(0);
  } catch (error) {
    logger.error({ error }, "❌ Database initialization failed");
    process.exit(1);
  }
}

main();

// Made with Bob
