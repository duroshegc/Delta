/**
 * Likes and Matches Routes
 * Endpoints for swiping, mutual matches, and unmatching
 */

import { Elysia, t } from "elysia";
import { ObjectId } from "mongodb";
import { getDatabase } from "../../config/database";
import { logger } from "../../config/logger";
import { requireAuth } from "../../middleware/auth";
import { userRateLimit } from "../../middleware/rate-limit";
import { RATE_LIMITS } from "../../config/rate-limits";
import { MatchingService } from "../../lib/matching-service";
import { createLikeSchema, matchesQuerySchema } from "./schemas";
import { ValidationError } from "../../utils/errors";

export const likeRoutes = new Elysia({ prefix: "/likes" })
  .use(requireAuth)
  .post(
    "/",
    async (context) => {
      const { user, body } = context as any;
      const validatedData = createLikeSchema.parse(body);

      const matchingService = new MatchingService(getDatabase());
      const result = await matchingService.sendLike(
        new ObjectId(user.userId),
        validatedData.targetUserId,
        validatedData.type,
      );

      logger.info(
        {
          userId: user.userId,
          targetUserId: validatedData.targetUserId.toString(),
          likeType: validatedData.type,
          matched: result.matched,
        },
        "Like sent",
      );

      return {
        success: true,
        message: result.matched ? "It's a match!" : "Like sent successfully",
        data: result,
      };
    },
    {
      beforeHandle: userRateLimit(RATE_LIMITS.DISCOVERY),
      body: t.Object({
        targetUserId: t.String(),
        type: t.Optional(t.Union([t.Literal("like"), t.Literal("super_like")])),
      }),
      detail: {
        tags: ["Matches"],
        summary: "Send like",
        description:
          "Send a like or super like to a profile. Creates a match when the like is mutual.",
      },
    },
  );

export const matchRoutes = new Elysia({ prefix: "/matches" })
  .use(requireAuth)
  .get(
    "/",
    async (context) => {
      const { user, query } = context as any;
      const validatedQuery = matchesQuerySchema.parse(query);

      const matchingService = new MatchingService(getDatabase());
      const matches = await matchingService.listMatches(
        new ObjectId(user.userId),
        validatedQuery.limit,
        validatedQuery.cursor,
      );

      logger.debug(
        { userId: user.userId, count: matches.matches.length },
        "Matches retrieved",
      );

      return {
        success: true,
        data: matches,
      };
    },
    {
      beforeHandle: userRateLimit(RATE_LIMITS.API),
      query: t.Object({
        limit: t.Optional(t.String()),
        cursor: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Matches"],
        summary: "List matches",
        description: "List active matches for the authenticated user",
      },
    },
  )
  .delete(
    "/:matchId",
    async (context) => {
      const { user, params } = context as any;

      if (!ObjectId.isValid(params.matchId)) {
        throw new ValidationError("Invalid match ID");
      }

      const matchingService = new MatchingService(getDatabase());
      const result = await matchingService.unmatch(
        new ObjectId(user.userId),
        new ObjectId(params.matchId),
      );

      logger.info(
        { userId: user.userId, matchId: params.matchId },
        "Match unmatched",
      );

      return {
        success: true,
        message: "Unmatched successfully",
        data: result,
      };
    },
    {
      beforeHandle: userRateLimit(RATE_LIMITS.API),
      params: t.Object({
        matchId: t.String(),
      }),
      detail: {
        tags: ["Matches"],
        summary: "Unmatch",
        description: "Unmatch an active match",
      },
    },
  );

// Made with Bob
