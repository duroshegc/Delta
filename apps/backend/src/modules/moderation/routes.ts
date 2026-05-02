import { Elysia, t } from "elysia";
import { ObjectId } from "mongodb";
import { getDatabase } from "../../config/database";
import { RATE_LIMITS } from "../../config/rate-limits";
import { requireAuth } from "../../middleware/auth";
import { userRateLimit } from "../../middleware/rate-limit";
import { SafetyService } from "../../lib/safety-service";
import { blockUserSchema, submitReportSchema } from "./schemas";

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
