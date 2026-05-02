import { ObjectId } from "mongodb";
import { getDatabase } from "../config/database";
import { getRedis } from "../config/redis";
import { logger } from "../config/logger";
import {
  generateTokenPair,
  verifyRefreshToken,
  type TokenPayload,
  type TokenPair,
} from "./jwt";
import { hashPassword, verifyPassword } from "./password";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from "./email";
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
} from "../utils/errors";
import crypto from "crypto";

/**
 * Authentication service
 *
 * Handles:
 * - User registration and login
 * - Token generation and refresh with rotation
 * - Email verification
 * - Password reset
 * - Session management
 */

export interface SignupData {
  email: string;
  password: string;
  name?: string;
}

export interface SigninData {
  email: string;
  password: string;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    name?: string;
    emailVerified: boolean;
    role: string;
  };
  tokens: TokenPair;
  session: {
    id: string;
    expiresAt: Date;
  };
}

/**
 * Register a new user
 */
export async function signup(data: SignupData): Promise<AuthResult> {
  const db = getDatabase();

  // Check if user already exists
  const existingUser = await db.collection("users").findOne({
    email: data.email.toLowerCase(),
  });

  if (existingUser) {
    throw new ConflictError("Email already registered");
  }

  // Hash password
  const passwordHash = await hashPassword(data.password);

  // Create user
  const now = new Date();
  const userId = new ObjectId();

  const user = {
    _id: userId,
    email: data.email.toLowerCase(),
    name: data.name,
    passwordHash,
    emailVerified: false,
    status: "active",
    role: "user",
    createdAt: now,
    updatedAt: now,
  };

  await db.collection("users").insertOne(user);

  logger.info(
    { userId: userId.toString(), email: data.email },
    "User registered",
  );

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

  await db.collection("verification_tokens").insertOne({
    _id: new ObjectId(),
    userId: userId,
    token: verificationToken,
    type: "email_verification",
    expiresAt: verificationExpiry,
    createdAt: now,
  });

  // Send verification email (don't wait for it)
  sendVerificationEmail(data.email, verificationToken, data.name).catch(
    (error) => {
      logger.error(
        { error, userId: userId.toString() },
        "Failed to send verification email",
      );
    },
  );

  // Create session and generate tokens
  const session = await createSession(userId.toString(), data.email, user.role);

  return {
    user: {
      id: userId.toString(),
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      role: user.role,
    },
    tokens: session.tokens,
    session: {
      id: session.id,
      expiresAt: session.expiresAt,
    },
  };
}

/**
 * Sign in an existing user
 */
export async function signin(data: SigninData): Promise<AuthResult> {
  const db = getDatabase();

  // Find user
  const user = await db.collection("users").findOne({
    email: data.email.toLowerCase(),
  });

  if (!user) {
    throw new AuthenticationError("Invalid email or password");
  }

  // Check if account is banned or suspended
  if (user.status === "banned") {
    throw new AuthenticationError("Your account has been banned");
  }

  if (user.status === "suspended") {
    throw new AuthenticationError("Your account has been suspended");
  }

  // Verify password
  const isValidPassword = await verifyPassword(
    data.password,
    user.passwordHash,
  );

  if (!isValidPassword) {
    throw new AuthenticationError("Invalid email or password");
  }

  logger.info(
    { userId: user._id.toString(), email: data.email },
    "User signed in",
  );

  // Create session and generate tokens
  const session = await createSession(
    user._id.toString(),
    user.email,
    user.role,
  );

  return {
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified || false,
      role: user.role || "user",
    },
    tokens: session.tokens,
    session: {
      id: session.id,
      expiresAt: session.expiresAt,
    },
  };
}

/**
 * Create a new session for a user
 */
async function createSession(
  userId: string,
  email: string,
  role?: string,
): Promise<{
  id: string;
  tokens: TokenPair;
  expiresAt: Date;
}> {
  const db = getDatabase();
  const sessionId = new ObjectId();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Generate tokens
  const payload: TokenPayload = {
    userId,
    email,
    role,
    sessionId: sessionId.toString(),
  };

  const tokens = generateTokenPair(payload);

  // Store session in MongoDB
  await db.collection("sessions").insertOne({
    _id: sessionId,
    userId: new ObjectId(userId),
    refreshTokenId: tokens.refreshToken.substring(0, 32), // Store token prefix for tracking
    expiresAt,
    createdAt: now,
    lastActivityAt: now,
  });

  // Store refresh token in Redis for fast lookup (with rotation tracking)
  const redis = getRedis();
  await redis.setex(
    `refresh_token:${sessionId.toString()}`,
    7 * 24 * 60 * 60, // 7 days in seconds
    tokens.refreshToken,
  );

  logger.debug({ userId, sessionId: sessionId.toString() }, "Session created");

  return {
    id: sessionId.toString(),
    tokens,
    expiresAt,
  };
}

/**
 * Refresh access token using refresh token (with rotation)
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<TokenPair> {
  const db = getDatabase();

  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);

  if (!decoded.sessionId) {
    throw new AuthenticationError("Invalid refresh token");
  }

  // Check if session exists and is valid
  const session = await db.collection("sessions").findOne({
    _id: new ObjectId(decoded.sessionId),
    userId: new ObjectId(decoded.userId),
    expiresAt: { $gt: new Date() },
  });

  if (!session) {
    throw new AuthenticationError("Session expired or invalid");
  }

  // Verify refresh token in Redis (rotation check)
  const redis = getRedis();
  const storedToken = await redis.get(`refresh_token:${decoded.sessionId}`);

  if (storedToken !== refreshToken) {
    // Token has been rotated or is invalid - possible token theft
    logger.warn(
      { userId: decoded.userId, sessionId: decoded.sessionId },
      "Refresh token mismatch - possible token theft",
    );

    // Invalidate all sessions for this user as a security measure
    await revokeAllUserSessions(decoded.userId);

    throw new AuthenticationError(
      "Invalid refresh token - all sessions revoked",
    );
  }

  // Generate new token pair (rotation)
  const payload: TokenPayload = {
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role,
    sessionId: decoded.sessionId,
  };

  const newTokens = generateTokenPair(payload);

  // Update refresh token in Redis (rotation)
  await redis.setex(
    `refresh_token:${decoded.sessionId}`,
    7 * 24 * 60 * 60, // 7 days
    newTokens.refreshToken,
  );

  // Update session last activity
  await db.collection("sessions").updateOne(
    { _id: new ObjectId(decoded.sessionId) },
    {
      $set: {
        lastActivityAt: new Date(),
        refreshTokenId: newTokens.refreshToken.substring(0, 32),
      },
    },
  );

  logger.debug(
    { userId: decoded.userId, sessionId: decoded.sessionId },
    "Access token refreshed with rotation",
  );

  return newTokens;
}

/**
 * Sign out a user (revoke session)
 */
export async function signout(sessionId: string): Promise<void> {
  const db = getDatabase();

  // Delete session from MongoDB
  await db.collection("sessions").deleteOne({
    _id: new ObjectId(sessionId),
  });

  // Delete refresh token from Redis
  const redis = getRedis();
  await redis.del(`refresh_token:${sessionId}`);

  logger.info({ sessionId }, "User signed out");
}

/**
 * Revoke all sessions for a user
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  const db = getDatabase();

  // Get all sessions for user
  const sessions = await db
    .collection("sessions")
    .find({ userId: new ObjectId(userId) })
    .toArray();

  // Delete all sessions
  await db.collection("sessions").deleteMany({
    userId: new ObjectId(userId),
  });

  // Delete all refresh tokens from Redis
  const redis = getRedis();
  const deletePromises = sessions.map((session) =>
    redis.del(`refresh_token:${session._id.toString()}`),
  );

  await Promise.all(deletePromises);

  logger.info(
    { userId, sessionCount: sessions.length },
    "All user sessions revoked",
  );
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<void> {
  const db = getDatabase();

  // Find verification token
  const verificationToken = await db.collection("verification_tokens").findOne({
    token,
    type: "email_verification",
    expiresAt: { $gt: new Date() },
  });

  if (!verificationToken) {
    throw new NotFoundError("Invalid or expired verification token");
  }

  // Update user
  const result = await db.collection("users").updateOne(
    { _id: verificationToken.userId },
    {
      $set: {
        emailVerified: true,
        status: "verified",
        updatedAt: new Date(),
      },
    },
  );

  if (result.matchedCount === 0) {
    throw new NotFoundError("User not found");
  }

  // Delete verification token
  await db.collection("verification_tokens").deleteOne({
    _id: verificationToken._id,
  });

  // Get user for welcome email
  const user = await db.collection("users").findOne({
    _id: verificationToken.userId,
  });

  if (user) {
    // Send welcome email (don't wait for it)
    sendWelcomeEmail(user.email, user.name || "").catch((error) => {
      logger.error(
        { error, userId: user._id.toString() },
        "Failed to send welcome email",
      );
    });
  }

  logger.info(
    { userId: verificationToken.userId.toString() },
    "Email verified",
  );
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const db = getDatabase();

  // Find user (but don't reveal if user exists)
  const user = await db.collection("users").findOne({
    email: email.toLowerCase(),
  });

  if (!user) {
    // Don't reveal that user doesn't exist
    logger.info({ email }, "Password reset requested for non-existent user");
    return;
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour

  // Store reset token
  await db.collection("verification_tokens").insertOne({
    _id: new ObjectId(),
    userId: user._id,
    token: resetToken,
    type: "password_reset",
    expiresAt,
    createdAt: now,
  });

  // Send reset email (don't wait for it)
  sendPasswordResetEmail(email, resetToken, user.name).catch((error) => {
    logger.error(
      { error, userId: user._id.toString() },
      "Failed to send password reset email",
    );
  });

  logger.info(
    { userId: user._id.toString(), email },
    "Password reset requested",
  );
}

/**
 * Reset password with token
 */
export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  const db = getDatabase();

  // Find reset token
  const resetToken = await db.collection("verification_tokens").findOne({
    token,
    type: "password_reset",
    expiresAt: { $gt: new Date() },
  });

  if (!resetToken) {
    throw new NotFoundError("Invalid or expired reset token");
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update user password
  const result = await db.collection("users").updateOne(
    { _id: resetToken.userId },
    {
      $set: {
        passwordHash,
        updatedAt: new Date(),
      },
    },
  );

  if (result.matchedCount === 0) {
    throw new NotFoundError("User not found");
  }

  // Delete reset token
  await db.collection("verification_tokens").deleteOne({
    _id: resetToken._id,
  });

  // Revoke all existing sessions for security
  await revokeAllUserSessions(resetToken.userId.toString());

  logger.info(
    { userId: resetToken.userId.toString() },
    "Password reset successful",
  );
}

// Made with Bob
