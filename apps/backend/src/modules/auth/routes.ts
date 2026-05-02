import { Elysia, t } from "elysia";
import { logger } from "../../config/logger";
import { requireAuth } from "../../middleware/auth";
import { rateLimitMiddleware } from "../../middleware/rate-limit";
import {
  signup,
  signin,
  signout,
  refreshAccessToken,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
} from "../../lib/auth-service";
import { validatePasswordStrength } from "../../lib/password";
import { ConflictError } from "../../utils/errors";

/**
 * Authentication routes
 *
 * Endpoints:
 * - POST /signup - Register new user
 * - POST /signin - Sign in user
 * - POST /signout - Sign out user
 * - POST /refresh - Refresh access token
 * - POST /verify-email - Verify email with token
 * - POST /password/reset-request - Request password reset
 * - POST /password/reset - Reset password with token
 * - GET /session - Get current session
 */

export const authRoutes = new Elysia({ prefix: "/auth" })
  // Sign up with email
  .onBeforeHandle(rateLimitMiddleware.auth())
  .post(
    "/signup",
    async ({ body }) => {
      logger.info({ email: body.email }, "User signup attempt");

      // Validate password strength
      const validation = validatePasswordStrength(body.password);
      if (!validation.isValid) {
        throw new ConflictError(validation.error || "Invalid password");
      }

      const result = await signup({
        email: body.email,
        password: body.password,
        name: body.name,
      });

      return {
        success: true,
        message: "Signup successful. Please verify your email.",
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          expiresAt: result.tokens.accessTokenExpiresAt,
        },
      };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 8 }),
        name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
      }),
      detail: {
        tags: ["Auth"],
        summary: "Sign up with email",
        description:
          "Create a new account using email and password. Returns access and refresh tokens.",
      },
    },
  )

  // Sign in with email
  .post(
    "/signin",
    async ({ body }) => {
      logger.info({ email: body.email }, "User signin attempt");

      const result = await signin({
        email: body.email,
        password: body.password,
      });

      return {
        success: true,
        message: "Sign in successful",
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          expiresAt: result.tokens.accessTokenExpiresAt,
        },
      };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 1 }),
      }),
      detail: {
        tags: ["Auth"],
        summary: "Sign in with email",
        description:
          "Authenticate using email and password. Returns access and refresh tokens.",
      },
    },
  )

  // Sign out
  .use(requireAuth)
  .post(
    "/signout",
    async (context) => {
      const { user } = context as any;

      if (user.sessionId) {
        await signout(user.sessionId);
      }

      logger.info({ userId: user.userId }, "User signed out");

      return {
        success: true,
        message: "Signed out successfully",
      };
    },
    {
      detail: {
        tags: ["Auth"],
        summary: "Sign out",
        description: "End the current session and invalidate tokens",
      },
    },
  )

  // Refresh access token
  .post(
    "/refresh",
    async ({ body }) => {
      logger.debug("Token refresh attempt");

      const tokens = await refreshAccessToken(body.refreshToken);

      return {
        success: true,
        message: "Token refreshed successfully",
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.accessTokenExpiresAt,
        },
      };
    },
    {
      body: t.Object({
        refreshToken: t.String({ minLength: 1 }),
      }),
      detail: {
        tags: ["Auth"],
        summary: "Refresh access token",
        description:
          "Get a new access token using a refresh token. Implements token rotation for security.",
      },
    },
  )

  // Verify email
  .onBeforeHandle(rateLimitMiddleware.emailVerification())
  .post(
    "/verify-email",
    async ({ body }) => {
      logger.info("Email verification attempt");

      await verifyEmail(body.token);

      return {
        success: true,
        message: "Email verified successfully",
      };
    },
    {
      body: t.Object({
        token: t.String({ minLength: 1 }),
      }),
      detail: {
        tags: ["Auth"],
        summary: "Verify email",
        description: "Verify email address using the token sent via email",
      },
    },
  )

  // Request password reset
  .onBeforeHandle(rateLimitMiddleware.passwordReset())
  .post(
    "/password/reset-request",
    async ({ body }) => {
      logger.info({ email: body.email }, "Password reset requested");

      await requestPasswordReset(body.email);

      return {
        success: true,
        message: "If the email exists, a password reset link has been sent",
      };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
      }),
      detail: {
        tags: ["Auth"],
        summary: "Request password reset",
        description:
          "Request a password reset link via email. Always returns success to prevent email enumeration.",
      },
    },
  )

  // Reset password
  .post(
    "/password/reset",
    async ({ body }) => {
      logger.info("Password reset attempt");

      // Validate new password strength
      const validation = validatePasswordStrength(body.newPassword);
      if (!validation.isValid) {
        throw new ConflictError(validation.error || "Invalid password");
      }

      await resetPassword(body.token, body.newPassword);

      return {
        success: true,
        message:
          "Password reset successful. Please sign in with your new password.",
      };
    },
    {
      body: t.Object({
        token: t.String({ minLength: 1 }),
        newPassword: t.String({ minLength: 8 }),
      }),
      detail: {
        tags: ["Auth"],
        summary: "Reset password",
        description:
          "Reset password using the token sent via email. All existing sessions will be revoked.",
      },
    },
  )

  // Get current session
  .use(requireAuth)
  .get(
    "/session",
    async (context) => {
      const { user } = context as any;

      return {
        success: true,
        data: {
          user: {
            id: user.userId,
            email: user.email,
            role: user.role || "user",
          },
          sessionId: user.sessionId,
        },
      };
    },
    {
      detail: {
        tags: ["Auth"],
        summary: "Get current session",
        description: "Retrieve the current authenticated session information",
      },
    },
  );

// Made with Bob
