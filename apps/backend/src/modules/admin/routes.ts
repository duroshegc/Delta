import { Elysia, t } from "elysia";
import { ObjectId } from "mongodb";
import { getDatabase } from "../../config/database";
import { RATE_LIMITS } from "../../config/rate-limits";
import { requireAuth, requireRole } from "../../middleware/auth";
import { userRateLimit } from "../../middleware/rate-limit";
import { AdminService } from "../../lib/admin-service";
import {
  adminReportsQuerySchema,
  adminSessionsQuerySchema,
  adminUserActionSchema,
  adminUsersQuerySchema,
  createAdminAccountSchema,
} from "./schemas";
import { AuthorizationError, ValidationError } from "../../utils/errors";
import { validatePasswordStrength } from "../../lib/password";

export const adminRoutes = new Elysia({ prefix: "/admin" })
  .use(requireAuth)
  .use(requireRole("admin", "super_admin", "trust_safety_manager", "moderator", "support", "finance", "analyst"))
  .get(
    "/users",
    async ({ query }) => {
      const validated = adminUsersQuerySchema.parse(query);
      const users = await new AdminService(getDatabase()).listUsers(validated);
      return { success: true, data: users.map(serializeUser) };
    },
    {
      beforeHandle: userRateLimit(RATE_LIMITS.ADMIN),
      query: t.Object({
        q: t.Optional(t.String()),
        status: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: { tags: ["Admin"], summary: "List users" },
    },
  )
  .get(
    "/reports",
    async ({ query }) => {
      const validated = adminReportsQuerySchema.parse(query);
      const reports = await new AdminService(getDatabase()).listReports(validated);
      return { success: true, data: reports.map(serializeReport) };
    },
    {
      beforeHandle: userRateLimit(RATE_LIMITS.ADMIN),
      query: t.Object({
        status: t.Optional(t.String()),
        severity: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: { tags: ["Admin"], summary: "List reports" },
    },
  )
  .get(
    "/sessions",
    async ({ query }) => {
      const validated = adminSessionsQuerySchema.parse(query);
      const sessions = await new AdminService(getDatabase()).listSessions(validated);
      return { success: true, data: sessions };
    },
    {
      beforeHandle: userRateLimit(RATE_LIMITS.ADMIN),
      query: t.Object({
        status: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: { tags: ["Admin"], summary: "List live sessions" },
    },
  )
  .patch(
    "/users/:id",
    async (context) => {
      const { user, params, body } = context as any;
      if (!ObjectId.isValid(params.id)) throw new ValidationError("Invalid user ID");
      const validated = adminUserActionSchema.parse(body);
      const updated = await new AdminService(getDatabase()).updateUser({
        actorId: new ObjectId(user.userId),
        targetUserId: new ObjectId(params.id),
        status: validated.status,
        verificationStatus: validated.verificationStatus,
        reason: validated.reason,
      });
      return { success: true, data: serializeUser(updated) };
    },
    {
      beforeHandle: userRateLimit(RATE_LIMITS.ADMIN),
      params: t.Object({ id: t.String() }),
      body: t.Object({
        status: t.Optional(
          t.Union([
            t.Literal("active"),
            t.Literal("suspended"),
            t.Literal("banned"),
            t.Literal("deleted"),
          ]),
        ),
        verificationStatus: t.Optional(
          t.Union([
            t.Literal("none"),
            t.Literal("pending"),
            t.Literal("verified"),
            t.Literal("rejected"),
          ]),
        ),
        reason: t.String(),
      }),
      detail: { tags: ["Admin"], summary: "Update user" },
    },
  )
  .post(
    "/admins",
    async (context) => {
      const { user, body } = context as any;
      if (user.role !== "super_admin") {
        throw new AuthorizationError("Only a super admin can create admin accounts");
      }

      const validated = createAdminAccountSchema.parse(body);
      const passwordValidation = validatePasswordStrength(validated.password);
      if (!passwordValidation.isValid) {
        throw new ValidationError(passwordValidation.error || "Invalid password");
      }

      const created = await new AdminService(getDatabase()).createAdminAccount({
        actorId: new ObjectId(user.userId),
        email: validated.email,
        password: validated.password,
        name: validated.name,
        role: validated.role,
        reason: validated.reason,
      });

      return { success: true, data: serializeAdminAccount(created) };
    },
    {
      beforeHandle: userRateLimit(RATE_LIMITS.ADMIN),
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 8, maxLength: 128 }),
        name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
        role: t.Optional(
          t.Union([
            t.Literal("super_admin"),
            t.Literal("admin"),
            t.Literal("trust_safety_manager"),
            t.Literal("moderator"),
            t.Literal("support"),
            t.Literal("finance"),
            t.Literal("analyst"),
          ]),
        ),
        reason: t.String({ minLength: 3, maxLength: 500 }),
      }),
      detail: { tags: ["Admin"], summary: "Create admin account" },
    },
  )
  .get(
    "/analytics",
    async () => {
      const analytics = await new AdminService(getDatabase()).getAnalytics();
      return { success: true, data: analytics };
    },
    {
      beforeHandle: userRateLimit(RATE_LIMITS.ADMIN),
      detail: { tags: ["Admin"], summary: "Get dashboard analytics" },
    },
  );

function serializeUser(user: any) {
  if (!user) return null;
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role || "user",
    status: user.status,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function serializeAdminAccount(user: any) {
  return {
    id: user._id.toString(),
    name: user.name || user.email.split("@")[0],
    email: user.email,
    role: user.role,
    status: user.status,
    mfaEnabled: false,
    lastActiveAt: user.lastActiveAt || user.updatedAt || user.createdAt,
  };
}

function serializeReport(report: any) {
  return {
    id: report._id.toString(),
    reporterUserId: report.reporterUserId.toString(),
    reportedUserId: report.reportedUserId.toString(),
    category: report.category,
    severity: report.severity,
    status: report.status,
    createdAt: report.createdAt,
  };
}

// Made with Bob
