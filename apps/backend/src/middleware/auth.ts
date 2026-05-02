import { Elysia } from "elysia";
import { ObjectId } from "mongodb";
import {
  verifyAccessToken,
  extractTokenFromHeader,
  type DecodedToken,
} from "../lib/jwt";
import { AuthenticationError, AuthorizationError } from "../utils/errors";
import { logger } from "../config/logger";
import { getDatabase } from "../config/database";

/**
 * Authentication middleware for protected routes
 *
 * Provides:
 * - JWT token validation
 * - User authentication check
 * - Role-based authorization
 * - Session validation
 */

export interface AuthUser {
  userId: string;
  email: string;
  role?: string;
  sessionId?: string;
}

/**
 * Middleware to require authentication
 * Validates JWT token and attaches user to context
 */
export const requireAuth = new Elysia({ name: "require-auth" }).derive(
  async ({ headers }) => {
    const authHeader = headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      logger.warn("Missing authentication token");
      throw new AuthenticationError("Authentication required");
    }

    try {
      // Verify and decode token
      const decoded = verifyAccessToken(token);

      // Check if user still exists and is active
      const db = getDatabase();
      const user = await db.collection("users").findOne({
        _id: new ObjectId(decoded.userId),
        status: { $in: ["active", "verified"] },
      });

      if (!user) {
        logger.warn({ userId: decoded.userId }, "User not found or inactive");
        throw new AuthenticationError("Invalid authentication token");
      }

      // Check if session is still valid (if sessionId is present)
      if (decoded.sessionId) {
        const session = await db.collection("sessions").findOne({
          _id: new ObjectId(decoded.sessionId),
          userId: new ObjectId(decoded.userId),
          expiresAt: { $gt: new Date() },
        });

        if (!session) {
          logger.warn(
            { userId: decoded.userId, sessionId: decoded.sessionId },
            "Session expired or invalid",
          );
          throw new AuthenticationError("Session expired");
        }
      }

      // Attach user to context
      const authUser: AuthUser = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        sessionId: decoded.sessionId,
      };

      logger.debug({ userId: authUser.userId }, "User authenticated");

      return { user: authUser };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      logger.error({ error }, "Authentication failed");
      throw new AuthenticationError("Invalid authentication token");
    }
  },
);

/**
 * Middleware to require specific role(s)
 * Must be used after requireAuth
 * @param allowedRoles - Array of allowed roles
 */
export function requireRole(...allowedRoles: string[]) {
  return new Elysia({ name: "require-role" }).derive(async ({ headers }) => {
    // Re-authenticate to get user
    const authHeader = headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      throw new AuthenticationError("Authentication required");
    }

    const decoded = verifyAccessToken(token);
    const db = getDatabase();
    const userDoc = await db.collection("users").findOne({
      _id: new ObjectId(decoded.userId),
      status: { $in: ["active", "verified"] },
    });

    if (!userDoc) {
      throw new AuthenticationError("Invalid authentication token");
    }

    const user: AuthUser = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      sessionId: decoded.sessionId,
    };

    const userRole = user.role || "user";

    if (!allowedRoles.includes(userRole)) {
      logger.warn(
        { userId: user.userId, role: userRole, allowedRoles },
        "Insufficient permissions",
      );
      throw new AuthorizationError(
        "You do not have permission to access this resource",
      );
    }

    logger.debug(
      { userId: user.userId, role: userRole },
      "Role authorization successful",
    );

    return { user };
  });
}

/**
 * Middleware for optional authentication
 * Attaches user to context if token is valid, but doesn't require it
 */
export const optionalAuth = new Elysia({ name: "optional-auth" }).derive(
  async ({ headers }) => {
    const authHeader = headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return { user: null };
    }

    try {
      const decoded = verifyAccessToken(token);

      // Check if user exists
      const db = getDatabase();
      const user = await db.collection("users").findOne({
        _id: new ObjectId(decoded.userId),
        status: { $in: ["active", "verified"] },
      });

      if (!user) {
        return { user: null };
      }

      const authUser: AuthUser = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        sessionId: decoded.sessionId,
      };

      return { user: authUser };
    } catch (error) {
      // Silently fail for optional auth
      return { user: null };
    }
  },
);

/**
 * Middleware to check if user is verified
 * Must be used after requireAuth
 */
export const requireVerified = new Elysia({ name: "require-verified" }).derive(
  async ({ headers }) => {
    // Re-authenticate to get user
    const authHeader = headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      throw new AuthenticationError("Authentication required");
    }

    const decoded = verifyAccessToken(token);
    const db = getDatabase();
    const userDoc = await db.collection("users").findOne({
      _id: new ObjectId(decoded.userId),
      status: { $in: ["active", "verified"] },
    });

    if (!userDoc) {
      throw new AuthenticationError("Invalid authentication token");
    }

    const user: AuthUser = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      sessionId: decoded.sessionId,
    };

    if (!userDoc.emailVerified) {
      logger.warn({ userId: user.userId }, "Email not verified");
      throw new AuthorizationError("Email verification required");
    }

    return { user };
  },
);

/**
 * Middleware to check if user account is not banned/suspended
 * Must be used after requireAuth
 */
export const requireActive = new Elysia({ name: "require-active" }).derive(
  async ({ headers }) => {
    // Re-authenticate to get user
    const authHeader = headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      throw new AuthenticationError("Authentication required");
    }

    const decoded = verifyAccessToken(token);
    const db = getDatabase();
    const userDoc = await db.collection("users").findOne({
      _id: new ObjectId(decoded.userId),
    });

    if (!userDoc) {
      throw new AuthenticationError("User not found");
    }

    const user: AuthUser = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      sessionId: decoded.sessionId,
    };

    if (userDoc.status === "banned") {
      logger.warn(
        { userId: userDoc._id.toString() },
        "Banned user attempted access",
      );
      throw new AuthorizationError("Your account has been banned");
    }

    if (userDoc.status === "suspended") {
      logger.warn(
        { userId: userDoc._id.toString() },
        "Suspended user attempted access",
      );
      throw new AuthorizationError("Your account has been suspended");
    }

    return { user };
  },
);

// Made with Bob
