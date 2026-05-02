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
} from "./schemas";
import { ValidationError } from "../../utils/errors";

export const adminRoutes = new Elysia({ prefix: "/admin" })
  .use(requireAuth)
  .use(requireRole("admin", "super_admin", "moderator", "support"))
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
    status: user.status,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
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
