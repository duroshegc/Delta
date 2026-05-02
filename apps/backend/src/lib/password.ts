import bcrypt from "bcrypt";
import { logger } from "../config/logger";

/**
 * Password hashing and verification utilities using bcrypt
 *
 * Bcrypt is chosen for its:
 * - Industry-standard security
 * - Built-in salt generation
 * - Configurable work factor (cost)
 * - Resistance to rainbow table attacks
 */

const SALT_ROUNDS = 12; // Higher = more secure but slower (10-12 recommended)

/**
 * Hash a plain text password
 * @param password - Plain text password to hash
 * @returns Promise resolving to hashed password
 * @throws Error if hashing fails
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
    logger.error({ error }, "Failed to hash password");
    throw new Error("Password hashing failed");
  }
}

/**
 * Verify a plain text password against a hash
 * @param password - Plain text password to verify
 * @param hash - Hashed password to compare against
 * @returns Promise resolving to true if password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    logger.error({ error }, "Failed to verify password");
    return false;
  }
}

/**
 * Check if a password hash needs to be rehashed
 * (e.g., if SALT_ROUNDS has been increased)
 * @param hash - Hashed password to check
 * @returns Promise resolving to true if rehash is needed
 */
export async function needsRehash(hash: string): Promise<boolean> {
  try {
    const rounds = await bcrypt.getRounds(hash);
    return rounds < SALT_ROUNDS;
  } catch (error) {
    logger.error({ error }, "Failed to check hash rounds");
    return false;
  }
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  error?: string;
} {
  if (password.length < 8) {
    return {
      isValid: false,
      error: "Password must be at least 8 characters long",
    };
  }

  if (password.length > 128) {
    return {
      isValid: false,
      error: "Password must be less than 128 characters",
    };
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one uppercase letter",
    };
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one lowercase letter",
    };
  }

  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one number",
    };
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one special character",
    };
  }

  return { isValid: true };
}

// Made with Bob
