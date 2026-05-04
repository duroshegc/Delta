import { Elysia, t } from "elysia";
import { ObjectId } from "mongodb";
import { getDatabase } from "../../config/database";
import { RATE_LIMITS } from "../../config/rate-limits";
import { requireAuth } from "../../middleware/auth";
import { userRateLimit } from "../../middleware/rate-limit";
import { SafetyService } from "../../lib/safety-service";
import { blockUserSchema, submitReportSchema } from "./schemas";
import { COLLECTIONS } from "../../types/database";
import { ValidationError } from "../../utils/errors";

export const moderationRoutes = new Elysia()
  .use(requireAuth)
  .post(
    "/reports",
    async (context) => {
      const { user, body } = context as any;
      const validated = submitReportSchema.parse(body);
      const result = await new SafetyService(getDatabase()).submitReport({
        reporterUserId: new ObjectId(user.userId),
        reportedUserId: new ObjectId(validated.reportedUserId),
        category: validated.category,
        description: validated.description,
        evidenceMediaIds: validated.evidenceMediaIds.map((id) => new ObjectId(id)),
        context: validated.context
          ? {
              matchId: validated.context.matchId
                ? new ObjectId(validated.context.matchId)
                : undefined,
              conversationId: validated.context.conversationId
                ? new ObjectId(validated.context.conversationId)
                : undefined,
              messageId: validated.context.messageId
                ? new ObjectId(validated.context.messageId)
                : undefined,
              liveSessionId: validated.context.liveSessionId,
            }
          : undefined,
      });

      return {
        success: true,
        message: "Report submitted successfully",
        data: {
          report: serializeReport(result.report),
          moderationCase: serializeCase(result.case),
          trustScore: serializeTrustScore(result.trustScore),
        },
      };
    },
    {
      beforeHandle: userRateLimit(RATE_LIMITS.REPORTS),
      body: t.Object({
        reportedUserId: t.String(),
        category: t.Union([
          t.Literal("harassment"),
          t.Literal("spam"),
          t.Literal("fake_profile"),
          t.Literal("inappropriate_content"),
          t.Literal("scam"),
          t.Literal("underage"),
          t.Literal("other"),
        ]),
        description: t.String(),
        evidenceMediaIds: t.Optional(t.Array(t.String())),
        context: t.Optional(t.Record(t.String(), t.Any())),
      }),
      detail: {
        tags: ["Moderation"],
        summary: "Submit report",
        description: "Report a user and create a moderation case",
      },
    },
  )
  .get(
    "/blocks",
    async (context) => {
      const { user } = context as any;
      const db = getDatabase();
      const blocks = await new SafetyService(db).listBlockedUsers(
        new ObjectId(user.userId),
      );
      const blockedUserIds = blocks.map((block) => block.blockedUserId);
      const profiles = blockedUserIds.length
        ? await db
            .collection(COLLECTIONS.PROFILES)
            .find({ userId: { $in: blockedUserIds } } as any)
            .project({ userId: 1, displayName: 1 })
            .toArray()
        : [];
      const namesByUserId = new Map(
        profiles.map((profile: any) => [
          profile.userId.toString(),
          profile.displayName,
        ]),
      );

      return {
        success: true,
        data: blocks.map((block) => ({
          ...serializeBlock(block),
          userId: block.blockedUserId.toString(),
          displayName:
            namesByUserId.get(block.blockedUserId.toString()) ||
            "Delta member",
          blockedAt: block.createdAt,
        })),
      };
    },
    {
      beforeHandle: userRateLimit(RATE_LIMITS.API),
      detail: {
        tags: ["Moderation"],
        summary: "List blocked users",
        description: "List users blocked by the authenticated user",
      },
    },
  )
  .delete(
    "/blocks/:blockedUserId",
    async (context) => {
      const { user, params } = context as any;

      if (!ObjectId.isValid(params.blockedUserId)) {
        throw new ValidationError("Invalid blocked user ID");
      }

      const result = await new SafetyService(getDatabase()).unblockUser({
        blockerUserId: new ObjectId(user.userId),
        blockedUserId: new ObjectId(params.blockedUserId),
      });

      return {
        success: true,
        message: result.deleted
          ? "User unblocked successfully"
          : "User was not blocked",
        data: result,
      };
    },
    {
      beforeHandle: userRateLimit(RATE_LIMITS.API),
      params: t.Object({
        blockedUserId: t.String(),
      }),
      detail: {
        tags: ["Moderation"],
        summary: "Unblock user",
        description: "Remove a user from the authenticated user's block list",
      },
    },
  )
  .post(
    "/blocks",
    async (context) => {
      const { user, body } = context as any;
      const validated = blockUserSchema.parse(body);
      const block = await new SafetyService(getDatabase()).blockUser({
        blockerUserId: new ObjectId(user.userId),
        blockedUserId: new ObjectId(validated.blockedUserId),
        reason: validated.reason,
      });

      return {
        success: true,
        message: "User blocked successfully",
        data: serializeBlock(block),
      };
    },
    {
      beforeHandle: userRateLimit(RATE_LIMITS.API),
      body: t.Object({
        blockedUserId: t.String(),
        reason: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Moderation"],
        summary: "Block user",
        description: "Block a user from matching and discovery interactions",
      },
    },
  );

function serializeReport(report: any) {
  return {
    id: report._id.toString(),
    reporterUserId: report.reporterUserId.toString(),
    reportedUserId: report.reportedUserId.toString(),
    category: report.category,
    severity: report.severity,
    status: report.status,
    description: report.description,
    evidenceMediaIds: report.evidenceMediaIds.map((id: ObjectId) => id.toString()),
    context: report.context,
    createdAt: report.createdAt,
  };
}

function serializeCase(moderationCase: any) {
  return {
    id: moderationCase._id.toString(),
    reportId: moderationCase.reportId.toString(),
    targetUserId: moderationCase.targetUserId.toString(),
    severity: moderationCase.severity,
    status: moderationCase.status,
    createdAt: moderationCase.createdAt,
  };
}

function serializeBlock(block: any) {
  return {
    id: block._id.toString(),
    blockerUserId: block.blockerUserId.toString(),
    blockedUserId: block.blockedUserId.toString(),
    reason: block.reason,
    createdAt: block.createdAt,
  };
}

function serializeTrustScore(score: any) {
  return {
    userId: score.userId.toString(),
    score: score.score,
    riskLevel: score.riskLevel,
    restrictions: score.restrictions,
    factors: score.factors,
  };
}

// Made with Bob
