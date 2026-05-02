import { z } from "zod";
import { emailSchema, passwordSchema, phoneSchema } from "../../schemas/common";

/**
 * Authentication validation schemas
 */

// Sign up with email
export const signUpEmailSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1).max(100).optional(),
});

// Sign up with phone
export const signUpPhoneSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
  name: z.string().min(1).max(100).optional(),
});

// Sign in with email
export const signInEmailSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

// Sign in with phone
export const signInPhoneSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1),
});

// Password reset request
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

// Password reset
export const passwordResetSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

// Email verification
export const emailVerificationSchema = z.object({
  token: z.string().min(1),
});

// Change password
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

// Refresh token
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

// Made with Bob
