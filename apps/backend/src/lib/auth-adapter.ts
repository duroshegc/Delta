import { getDatabase } from "../config/database";
import { COLLECTIONS } from "../types/database";
import { logger } from "../config/logger";
import type { ObjectId } from "mongodb";

/**
 * MongoDB adapter for Better-auth
 * Handles user and session persistence
 */

export interface BetterAuthUser {
  id: string;
  email?: string;
  emailVerified: boolean;
  name?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BetterAuthSession {
  id: string;
  userId: string;
  expiresAt: Date;
  token: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface BetterAuthAccount {
  id: string;
  userId: string;
  accountId: string;
  providerId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface BetterAuthVerification {
  id: string;
  identifier: string;
  value: string;
  expiresAt: Date;
}

export const mongoAdapter = {
  /**
   * User operations
   */
  async createUser(user: Omit<BetterAuthUser, "id">): Promise<BetterAuthUser> {
    try {
      const db = getDatabase();
      const result = await db.collection(COLLECTIONS.USERS).insertOne({
        email: user.email,
        emailVerified: user.emailVerified,
        name: user.name,
        image: user.image,
        status: "active",
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });

      logger.info({ userId: result.insertedId }, "User created");

      return {
        id: result.insertedId.toString(),
        ...user,
      };
    } catch (error) {
      logger.error({ error }, "Failed to create user");
      throw error;
    }
  },

  async getUser(userId: string): Promise<BetterAuthUser | null> {
    try {
      const db = getDatabase();
      const user = await db.collection(COLLECTIONS.USERS).findOne({
        _id: userId as any,
      });

      if (!user) return null;

      return {
        id: user._id.toString(),
        email: user.email,
        emailVerified: user.emailVerified || false,
        name: user.name,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      logger.error({ error, userId }, "Failed to get user");
      return null;
    }
  },

  async getUserByEmail(email: string): Promise<BetterAuthUser | null> {
    try {
      const db = getDatabase();
      const user = await db.collection(COLLECTIONS.USERS).findOne({
        email: email.toLowerCase(),
      });

      if (!user) return null;

      return {
        id: user._id.toString(),
        email: user.email,
        emailVerified: user.emailVerified || false,
        name: user.name,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      logger.error({ error, email }, "Failed to get user by email");
      return null;
    }
  },

  async updateUser(
    userId: string,
    data: Partial<BetterAuthUser>,
  ): Promise<BetterAuthUser | null> {
    try {
      const db = getDatabase();
      const result = await db.collection(COLLECTIONS.USERS).findOneAndUpdate(
        { _id: userId as any },
        {
          $set: {
            ...data,
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after" },
      );

      if (!result) return null;

      return {
        id: result._id.toString(),
        email: result.email,
        emailVerified: result.emailVerified || false,
        name: result.name,
        image: result.image,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };
    } catch (error) {
      logger.error({ error, userId }, "Failed to update user");
      return null;
    }
  },

  async deleteUser(userId: string): Promise<boolean> {
    try {
      const db = getDatabase();
      const result = await db.collection(COLLECTIONS.USERS).deleteOne({
        _id: userId as any,
      });

      logger.info({ userId }, "User deleted");
      return result.deletedCount > 0;
    } catch (error) {
      logger.error({ error, userId }, "Failed to delete user");
      return false;
    }
  },

  /**
   * Session operations
   */
  async createSession(
    session: Omit<BetterAuthSession, "id">,
  ): Promise<BetterAuthSession> {
    try {
      const db = getDatabase();
      const result = await db.collection(COLLECTIONS.SESSIONS).insertOne({
        userId: session.userId as any,
        token: session.token,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      logger.info({ sessionId: result.insertedId }, "Session created");

      return {
        id: result.insertedId.toString(),
        ...session,
      };
    } catch (error) {
      logger.error({ error }, "Failed to create session");
      throw error;
    }
  },

  async getSession(sessionToken: string): Promise<BetterAuthSession | null> {
    try {
      const db = getDatabase();
      const session = await db.collection(COLLECTIONS.SESSIONS).findOne({
        token: sessionToken,
      });

      if (!session) return null;

      // Check if session is expired
      if (session.expiresAt < new Date()) {
        await this.deleteSession(sessionToken);
        return null;
      }

      return {
        id: session._id.toString(),
        userId: session.userId.toString(),
        token: session.token,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      };
    } catch (error) {
      logger.error({ error }, "Failed to get session");
      return null;
    }
  },

  async updateSession(
    sessionToken: string,
    data: Partial<BetterAuthSession>,
  ): Promise<BetterAuthSession | null> {
    try {
      const db = getDatabase();
      const result = await db.collection(COLLECTIONS.SESSIONS).findOneAndUpdate(
        { token: sessionToken },
        {
          $set: {
            ...data,
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after" },
      );

      if (!result) return null;

      return {
        id: result._id.toString(),
        userId: result.userId.toString(),
        token: result.token,
        expiresAt: result.expiresAt,
        ipAddress: result.ipAddress,
        userAgent: result.userAgent,
      };
    } catch (error) {
      logger.error({ error }, "Failed to update session");
      return null;
    }
  },

  async deleteSession(sessionToken: string): Promise<boolean> {
    try {
      const db = getDatabase();
      const result = await db.collection(COLLECTIONS.SESSIONS).deleteOne({
        token: sessionToken,
      });

      return result.deletedCount > 0;
    } catch (error) {
      logger.error({ error }, "Failed to delete session");
      return false;
    }
  },

  async deleteUserSessions(userId: string): Promise<boolean> {
    try {
      const db = getDatabase();
      await db.collection(COLLECTIONS.SESSIONS).deleteMany({
        userId: userId as any,
      });

      logger.info({ userId }, "User sessions deleted");
      return true;
    } catch (error) {
      logger.error({ error, userId }, "Failed to delete user sessions");
      return false;
    }
  },

  /**
   * Verification token operations
   */
  async createVerificationToken(
    verification: Omit<BetterAuthVerification, "id">,
  ): Promise<BetterAuthVerification> {
    try {
      const db = getDatabase();
      const result = await db
        .collection(COLLECTIONS.VERIFICATION_TOKENS)
        .insertOne({
          identifier: verification.identifier,
          token: verification.value,
          type: "email",
          expiresAt: verification.expiresAt,
          createdAt: new Date(),
        });

      return {
        id: result.insertedId.toString(),
        ...verification,
      };
    } catch (error) {
      logger.error({ error }, "Failed to create verification token");
      throw error;
    }
  },

  async useVerificationToken(
    identifier: string,
    token: string,
  ): Promise<BetterAuthVerification | null> {
    try {
      const db = getDatabase();
      const verification = await db
        .collection(COLLECTIONS.VERIFICATION_TOKENS)
        .findOneAndDelete({
          identifier,
          token,
          expiresAt: { $gt: new Date() },
        });

      if (!verification) return null;

      return {
        id: verification._id.toString(),
        identifier: verification.identifier,
        value: verification.token,
        expiresAt: verification.expiresAt,
      };
    } catch (error) {
      logger.error({ error }, "Failed to use verification token");
      return null;
    }
  },
};

// Made with Bob
