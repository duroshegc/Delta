import jwt from "jsonwebtoken";
import { logger } from "../config/logger";
import { AuthenticationError } from "../utils/errors";
import crypto from "crypto";

/**
 * JWT token generation and validation utilities
 *
 * Implements:
 * - Access token generation (short-lived)
 * - Refresh token generation (long-lived)
 * - Token validation and verification
 * - Refresh token rotation for enhanced security
 */

// Token configuration
const ACCESS_TOKEN_SECRET =
  process.env.JWT_ACCESS_SECRET || "your-access-secret-change-in-production";
const REFRESH_TOKEN_SECRET =
  process.env.JWT_REFRESH_SECRET || "your-refresh-secret-change-in-production";

const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days

export interface TokenPayload {
  userId: string;
  email: string;
  role?: string;
  sessionId?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
  jti?: string; // JWT ID for refresh token tracking
}

/**
 * Generate an access token
 * @param payload - User data to encode in token
 * @returns Signed JWT access token
 */
export function generateAccessToken(payload: TokenPayload): string {
  try {
    const token = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: "delta-api",
      audience: "delta-app",
    });
    return token;
  } catch (error) {
    logger.error({ error }, "Failed to generate access token");
    throw new Error("Token generation failed");
  }
}

/**
 * Generate a refresh token with unique identifier
 * @param payload - User data to encode in token
 * @returns Object with signed JWT refresh token and token ID
 */
export function generateRefreshToken(payload: TokenPayload): {
  token: string;
  tokenId: string;
} {
  try {
    // Generate unique token ID for tracking and rotation
    const tokenId = crypto.randomBytes(32).toString("hex");

    const token = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: "delta-api",
      audience: "delta-app",
      jwtid: tokenId,
    });

    return { token, tokenId };
  } catch (error) {
    logger.error({ error }, "Failed to generate refresh token");
    throw new Error("Token generation failed");
  }
}

/**
 * Generate both access and refresh tokens
 * @param payload - User data to encode in tokens
 * @returns Token pair with expiry dates
 */
export function generateTokenPair(payload: TokenPayload): TokenPair {
  const accessToken = generateAccessToken(payload);
  const { token: refreshToken, tokenId } = generateRefreshToken(payload);

  // Calculate expiry dates
  const now = new Date();
  const accessTokenExpiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes
  const refreshTokenExpiresAt = new Date(
    now.getTime() + 7 * 24 * 60 * 60 * 1000,
  ); // 7 days

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
  };
}

/**
 * Verify and decode an access token
 * @param token - JWT access token to verify
 * @returns Decoded token payload
 * @throws AuthenticationError if token is invalid or expired
 */
export function verifyAccessToken(token: string): DecodedToken {
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET, {
      issuer: "delta-api",
      audience: "delta-app",
    }) as DecodedToken;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError("Access token has expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError("Invalid access token");
    }
    logger.error({ error }, "Failed to verify access token");
    throw new AuthenticationError("Token verification failed");
  }
}

/**
 * Verify and decode a refresh token
 * @param token - JWT refresh token to verify
 * @returns Decoded token payload
 * @throws AuthenticationError if token is invalid or expired
 */
export function verifyRefreshToken(token: string): DecodedToken {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET, {
      issuer: "delta-api",
      audience: "delta-app",
    }) as DecodedToken;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError("Refresh token has expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError("Invalid refresh token");
    }
    logger.error({ error }, "Failed to verify refresh token");
    throw new AuthenticationError("Token verification failed");
  }
}

/**
 * Decode a token without verification (for debugging/logging)
 * @param token - JWT token to decode
 * @returns Decoded token payload or null if invalid
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.decode(token) as DecodedToken;
    return decoded;
  } catch (error) {
    logger.error({ error }, "Failed to decode token");
    return null;
  }
}

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value
 * @returns Token string or null if not found
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1] || null;
}

/**
 * Check if a token is expired (without throwing error)
 * @param token - JWT token to check
 * @returns True if token is expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
  } catch (error) {
    return true;
  }
}

/**
 * Get token expiry time in seconds
 * @param token - JWT token
 * @returns Seconds until expiry, or 0 if expired/invalid
 */
export function getTokenExpirySeconds(token: string): number {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return 0;
    }

    const now = Math.floor(Date.now() / 1000);
    const expirySeconds = decoded.exp - now;
    return expirySeconds > 0 ? expirySeconds : 0;
  } catch (error) {
    return 0;
  }
}

// Made with Bob
