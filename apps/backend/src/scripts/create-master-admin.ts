#!/usr/bin/env bun

/**
 * Creates or updates the first master admin account.
 *
 * Required env or flags:
 *   MASTER_ADMIN_EMAIL / --email
 *   MASTER_ADMIN_PASSWORD / --password
 *
 * Optional env or flags:
 *   MASTER_ADMIN_NAME / --name
 *
 * Usage:
 *   MASTER_ADMIN_EMAIL=owner@example.com MASTER_ADMIN_PASSWORD='StrongPassw0rd!' bun run admin:create-master
 *   bun run admin:create-master --email owner@example.com --password 'StrongPassw0rd!' --name 'Owner'
 */

import { ObjectId } from "mongodb";
import {
  connectDatabase,
  disconnectDatabase,
  getDatabase,
} from "../config/database";
import { logger } from "../config/logger";
import { hashPassword, validatePasswordStrength } from "../lib/password";
import { COLLECTIONS } from "../types/database";

type CliOptions = {
  email?: string;
  password?: string;
  name?: string;
};

async function main() {
  const options = parseArgs(Bun.argv.slice(2));
  const email = (options.email || process.env.MASTER_ADMIN_EMAIL)?.trim().toLowerCase();
  const password = options.password || process.env.MASTER_ADMIN_PASSWORD || "";
  const name = (options.name || process.env.MASTER_ADMIN_NAME)?.trim() || "Master admin";

  if (!email) {
    throw new Error(`MASTER_ADMIN_EMAIL or --email is required\n\n${usage()}`);
  }

  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    throw new Error(`${passwordValidation.error || "MASTER_ADMIN_PASSWORD is invalid"}\n\n${usage()}`);
  }

  await connectDatabase();
  const db = getDatabase();
  const now = new Date();
  const passwordHash = await hashPassword(password);

  const existing = await db.collection(COLLECTIONS.USERS).findOne({ email });
  if (existing) {
    await db.collection(COLLECTIONS.USERS).updateOne(
      { _id: existing._id },
      {
        $set: {
          name: existing.name || name,
          passwordHash,
          emailVerified: true,
          status: "active",
          role: "super_admin",
          accountType: "admin",
          updatedAt: now,
        },
      },
    );
    logger.info({ email }, "Master admin updated");
    return;
  }

  await db.collection(COLLECTIONS.USERS).insertOne({
    _id: new ObjectId(),
    email,
    name,
    passwordHash,
    emailVerified: true,
    phoneVerified: false,
    status: "active",
    role: "super_admin",
    accountType: "admin",
    createdAt: now,
    updatedAt: now,
  });

  logger.info({ email }, "Master admin created");
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === "--email" && next) {
      options.email = next;
      index += 1;
    }
    if (arg === "--password" && next) {
      options.password = next;
      index += 1;
    }
    if (arg === "--name" && next) {
      options.name = next;
      index += 1;
    }
  }
  return options;
}

function usage() {
  return [
    "Usage:",
    "  MASTER_ADMIN_EMAIL=owner@example.com MASTER_ADMIN_PASSWORD='StrongPassw0rd!' bun run admin:create-master",
    "  bun run admin:create-master --email owner@example.com --password 'StrongPassw0rd!' --name 'Owner'",
  ].join("\n");
}

main()
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ message }, "Failed to create master admin");
    console.error(`\nFailed to create master admin:\n${message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
