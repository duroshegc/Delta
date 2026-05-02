import { Elysia, t } from "elysia";
import { ObjectId } from "mongodb";
import { getDatabase } from "../../config/database";
import { logger } from "../../config/logger";
import { requireAuth } from "../../middleware/auth";
import { NotFoundError, ConflictError } from "../../utils/errors";
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
} from "../../lib/password";
import { revokeAllUserSessions } from "../../lib/auth-service";

/**
 * User management routes
 *
 * Endpoints:
 * - GET /me - Get current user profile
 * - PATCH /me - Update current user
 * - DELETE /me - Delete current user account
 * - PATCH /me/password - Change password
 * - PATCH /me/email - Change email (requires verification)
 */

export const userRoutes = new Elysia({ prefix: "/users" })
  .use(requireAuth)

  // Get current user profile
  .get(
    "/me",
    async (context) => {
      const { user } = context as any;
      const db = getDatabase();

      const userDoc = await db.collection("users").findOne({
        _id: new ObjectId(user.userId),
      });

      if (!userDoc) {
        throw new NotFoundError("User not found");
      }

      logger.debug({ userId: user.userId }, "User profile retrieved");

      return {
        success: true,
        data: {
          id: userDoc._id.toString(),
          email: userDoc.email,
          name: userDoc.name,
          emailVerified: userDoc.emailVerified || false,
          status: userDoc.status,
          role: userDoc.role || "user",
          createdAt: userDoc.createdAt,
          updatedAt: userDoc.updatedAt,
        },
      };
    },
    {
      detail: {
        tags: ["Users"],
        summary: "Get current user profile",
        description: "Retrieve the authenticated user's profile information",
      },
    },
  )

  // Update current user profile
  .patch(
    "/me",
    async (context) => {
      const { user, body } = context as any;
      const db = getDatabase();

      const updateData: any = {
        updatedAt: new Date(),
      };

      if (body.name !== undefined) {
        updateData.name = body.name;
      }

      const result = await db
        .collection("users")
        .findOneAndUpdate(
          { _id: new ObjectId(user.userId) },
          { $set: updateData },
          { returnDocument: "after" },
        );

      if (!result) {
        throw new NotFoundError("User not found");
      }

      logger.info({ userId: user.userId }, "User profile updated");

      return {
        success: true,
        message: "Profile updated successfully",
        data: {
          id: result._id.toString(),
          email: result.email,
          name: result.name,
          emailVerified: result.emailVerified || false,
          status: result.status,
          role: result.role || "user",
          updatedAt: result.updatedAt,
        },
      };
    },
    {
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
      }),
      detail: {
        tags: ["Users"],
        summary: "Update current user profile",
        description: "Update the authenticated user's profile information",
      },
    },
  )

  // Change password
  .patch(
    "/me/password",
    async (context) => {
      const { user, body } = context as any;
      const db = getDatabase();

      // Get current user
      const userDoc = await db.collection("users").findOne({
        _id: new ObjectId(user.userId),
      });

      if (!userDoc) {
        throw new NotFoundError("User not found");
      }

      // Verify current password
      const isValidPassword = await verifyPassword(
        body.currentPassword,
        userDoc.passwordHash,
      );

      if (!isValidPassword) {
        throw new ConflictError("Current password is incorrect");
      }

      // Validate new password strength
      const validation = validatePasswordStrength(body.newPassword);
      if (!validation.isValid) {
        throw new ConflictError(validation.error || "Invalid password");
      }

      // Hash new password
      const newPasswordHash = await hashPassword(body.newPassword);

      // Update password
      await db.collection("users").updateOne(
        { _id: new ObjectId(user.userId) },
        {
          $set: {
            passwordHash: newPasswordHash,
            updatedAt: new Date(),
          },
        },
      );

      // Revoke all sessions for security (user will need to log in again)
      await revokeAllUserSessions(user.userId);

      logger.info({ userId: user.userId }, "Password changed successfully");

      return {
        success: true,
        message: "Password changed successfully. Please log in again.",
      };
    },
    {
      body: t.Object({
        currentPassword: t.String({ minLength: 1 }),
        newPassword: t.String({ minLength: 8 }),
      }),
      detail: {
        tags: ["Users"],
        summary: "Change password",
        description:
          "Change the authenticated user's password. All sessions will be revoked.",
      },
    },
  )

  // Request email change (sends verification to new email)
  .patch(
    "/me/email",
    async (context) => {
      const { user, body } = context as any;
      const db = getDatabase();

      // Check if new email is already in use
      const existingUser = await db.collection("users").findOne({
        email: body.newEmail.toLowerCase(),
        _id: { $ne: new ObjectId(user.userId) },
      });

      if (existingUser) {
        throw new ConflictError("Email already in use");
      }

      // Get current user
      const userDoc = await db.collection("users").findOne({
        _id: new ObjectId(user.userId),
      });

      if (!userDoc) {
        throw new NotFoundError("User not found");
      }

      // Verify password
      const isValidPassword = await verifyPassword(
        body.password,
        userDoc.passwordHash,
      );

      if (!isValidPassword) {
        throw new ConflictError("Password is incorrect");
      }

      // TODO: Generate email change verification token and send email
      // For now, just update the email directly
      await db.collection("users").updateOne(
        { _id: new ObjectId(user.userId) },
        {
          $set: {
            email: body.newEmail.toLowerCase(),
            emailVerified: false, // Require re-verification
            updatedAt: new Date(),
          },
        },
      );

      logger.info(
        { userId: user.userId, newEmail: body.newEmail },
        "Email changed",
      );

      return {
        success: true,
        message:
          "Email changed successfully. Please verify your new email address.",
      };
    },
    {
      body: t.Object({
        newEmail: t.String({ format: "email" }),
        password: t.String({ minLength: 1 }),
      }),
      detail: {
        tags: ["Users"],
        summary: "Change email",
        description:
          "Change the authenticated user's email address. Requires password confirmation.",
      },
    },
  )

  // Delete user account
  .delete(
    "/me",
    async (context) => {
      const { user, body } = context as any;
      const db = getDatabase();

      // Get user
      const userDoc = await db.collection("users").findOne({
        _id: new ObjectId(user.userId),
      });

      if (!userDoc) {
        throw new NotFoundError("User not found");
      }

      // Verify password
      const isValidPassword = await verifyPassword(
        body.password,
        userDoc.passwordHash,
      );

      if (!isValidPassword) {
        throw new ConflictError("Password is incorrect");
      }

      // Soft delete: mark as deleted instead of removing
      await db.collection("users").updateOne(
        { _id: new ObjectId(user.userId) },
        {
          $set: {
            status: "deleted",
            deletedAt: new Date(),
            updatedAt: new Date(),
          },
        },
      );

      // Revoke all sessions
      await revokeAllUserSessions(user.userId);

      // TODO: Clean up user data (profiles, media, etc.) in background job

      logger.info({ userId: user.userId }, "User account deleted");

      return {
        success: true,
        message: "Account deleted successfully",
      };
    },
    {
      body: t.Object({
        password: t.String({ minLength: 1 }),
        confirmation: t.Literal("DELETE_MY_ACCOUNT"),
      }),
      detail: {
        tags: ["Users"],
        summary: "Delete account",
        description:
          "Permanently delete the authenticated user's account. Requires password and confirmation.",
      },
    },
  )

  // Get user statistics
  .get(
    "/me/stats",
    async (context) => {
      const { user } = context as any;
      const db = getDatabase();

      // TODO: Implement actual statistics from various collections
      // For now, return placeholder data

      logger.debug({ userId: user.userId }, "User statistics retrieved");

      return {
        success: true,
        data: {
          profileViews: 0,
          matches: 0,
          likes: 0,
          superLikes: 0,
          conversations: 0,
          liveMatches: 0,
          tokensBalance: 0,
        },
      };
    },
    {
      detail: {
        tags: ["Users"],
        summary: "Get user statistics",
        description: "Retrieve statistics for the authenticated user",
      },
    },
  );

// Made with Bob
