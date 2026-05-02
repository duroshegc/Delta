/**
 * Live Match and LiveKit Routes
 */

import { Elysia, t } from "elysia";
import { ObjectId } from "mongodb";
import { getDatabase } from "../../config/database";
import { logger } from "../../config/logger";
import { RATE_LIMITS } from "../../config/rate-limits";
import { requireAuth } from "../../middleware/auth";
import { userRateLimit } from "../../middleware/rate-limit";
import { LiveMatchService } from "../../lib/live-match-service";
import {
  liveMatchEvents,
  serializeSession as serializeSessionEvent,
  serializeTicket as serializeTicketEvent,
} from "../../lib/live-match-events";
import { verifyAccessToken } from "../../lib/jwt";
import {
  liveKitTokenSchema,
  liveKitWebhookSchema,
  liveMatchCancelSchema,
  liveMatchSearchSchema,
} from "./schemas";
import { ValidationError } from "../../utils/errors";

export const liveMatchRoutes = new Elysia({ prefix: "/live-match" })
  .use(requireAuth)
  .post(
    "/search",
    async (context) => {
      const { user, body } = context as any;
      const validatedBody = liveMatchSearchSchema.parse(body);
      const service = new LiveMatchService(getDatabase());
      const result = await service.search({
        userId: new ObjectId(user.userId),
        region: validatedBody.region,
        intent: validatedBody.intent,
        interests: validatedBody.interests,
        idempotencyKey: validatedBody.idempotencyKey,
      });

      logger.info(
        {
          userId: user.userId,
          ticketId: result.ticket._id.toString(),
          matched: Boolean(result.session),
        },
        "Live match search updated",
      );

      return {
        success: true,
        data: serializeLiveMatchResult(result),
      };
    },
    {
      beforeHandle: userRateLimit(RATE_LIMITS.LIVE_MATCH),
      body: t.Object({
        region: t.String(),
        intent: t.Union([
          t.Literal("serious"),
          t.Literal("casual"),
          t.Literal("friendship"),
          t.Literal("networking"),
        ]),
        interests: t.Array(t.String()),
        idempotencyKey: t.String(),
      }),
      detail: {
        tags: ["Live Match"],
        summary: "Start live match search",
        description: "Reserve tokens and search for a compatible live match",
      },
    },
  )
  .post(
    "/cancel",
    async (context) => {
      const { user, body } = context as any;
      const validatedBody = liveMatchCancelSchema.parse(body);

      if (!ObjectId.isValid(validatedBody.ticketId)) {
        throw new ValidationError("Invalid ticket ID");
      }

      const service = new LiveMatchService(getDatabase());
      const ticket = await service.cancel({
        userId: new ObjectId(user.userId),
        ticketId: new ObjectId(validatedBody.ticketId),
        idempotencyKey: validatedBody.idempotencyKey,
      });

      return {
        success: true,
        message: "Live match search cancelled",
        data: serializeTicket(ticket),
      };
    },
    {
      beforeHandle: userRateLimit(RATE_LIMITS.LIVE_MATCH),
      body: t.Object({
        ticketId: t.String(),
        idempotencyKey: t.String(),
      }),
      detail: {
        tags: ["Live Match"],
        summary: "Cancel live match search",
        description: "Cancel a search ticket and refund reserved tokens",
      },
    },
  )
  .get(
    "/status/:ticketId",
    async (context) => {
      const { user, params } = context as any;

      if (!ObjectId.isValid(params.ticketId)) {
        throw new ValidationError("Invalid ticket ID");
      }

      const service = new LiveMatchService(getDatabase());
      const result = await service.getStatus(
        new ObjectId(user.userId),
        new ObjectId(params.ticketId),
      );

      return {
        success: true,
        data: serializeLiveMatchResult(result),
      };
    },
    {
      beforeHandle: userRateLimit(RATE_LIMITS.API),
      params: t.Object({ ticketId: t.String() }),
      detail: {
        tags: ["Live Match"],
        summary: "Get live match status",
        description: "Poll live match ticket/session status",
      },
    },
  );

export const liveKitRoutes = new Elysia({ prefix: "/livekit" })
  .use(requireAuth)
  .post(
    "/token",
    async (context) => {
      const { user, body } = context as any;
      const validatedBody = liveKitTokenSchema.parse(body);
      const service = new LiveMatchService(getDatabase());
      const token = await service.createParticipantToken(
        new ObjectId(user.userId),
        validatedBody.sessionId,
      );

      return {
        success: true,
        data: token,
      };
    },
    {
      beforeHandle: userRateLimit(RATE_LIMITS.API),
      body: t.Object({ sessionId: t.String() }),
      detail: {
        tags: ["Live Match"],
        summary: "Create LiveKit participant token",
        description: "Create a LiveKit token for a matched live session",
      },
    },
  )
  .post(
    "/webhook",
    async (context) => {
      const { body } = context as any;
      const validatedBody = liveKitWebhookSchema.parse(body);
      const service = new LiveMatchService(getDatabase());
      const sessionId = validatedBody.room?.name || validatedBody.roomName;
      const participantIdentity =
        validatedBody.participant?.identity || validatedBody.participantIdentity;

      if (!sessionId) {
        throw new ValidationError("Missing LiveKit room/session ID");
      }

      if (!participantIdentity || !ObjectId.isValid(participantIdentity)) {
        return {
          success: true,
          message: "Webhook ignored",
        };
      }

      const userId = new ObjectId(participantIdentity);
      const event = validatedBody.event.toLowerCase();
      const session =
        event.includes("left") || event.includes("disconnected")
          ? await service.handleParticipantLeft({
              sessionId,
              userId,
              payload: body,
            })
          : await service.handleParticipantJoined({
              sessionId,
              userId,
              payload: body,
            });

      return {
        success: true,
        data: serializeSession(session),
      };
    },
    {
      body: t.Object({
        event: t.String(),
        room: t.Optional(t.Object({ name: t.Optional(t.String()) })),
        participant: t.Optional(
          t.Object({ identity: t.Optional(t.String()) }),
        ),
        roomName: t.Optional(t.String()),
        participantIdentity: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Live Match"],
        summary: "LiveKit webhook",
        description: "Handle LiveKit participant events",
      },
    },
  );

export const liveMatchWebSocketRoutes = new Elysia()
  .ws("/live-match/events", {
    query: t.Object({
      token: t.String(),
      ticketId: t.Optional(t.String()),
      sessionId: t.Optional(t.String()),
    }),
    open(ws) {
      const query = (ws.data as any).query;
      let userId: string;

      try {
        userId = verifyAccessToken(query.token).userId;
      } catch {
        ws.send({
          type: "error",
          message: "Authentication required",
          timestamp: new Date().toISOString(),
        });
        ws.close();
        return;
      }

      const unsubscribers: Array<() => void> = [];
      const subscriber = (event: any) => ws.send(event);

      unsubscribers.push(
        liveMatchEvents.subscribe(liveMatchEvents.topicForUser(userId), subscriber),
      );

      if (query.ticketId) {
        unsubscribers.push(
          liveMatchEvents.subscribe(
            liveMatchEvents.topicForTicket(query.ticketId),
            subscriber,
          ),
        );
      }

      if (query.sessionId) {
        unsubscribers.push(
          liveMatchEvents.subscribe(
            liveMatchEvents.topicForSession(query.sessionId),
            subscriber,
          ),
        );
      }

      (ws.data as any).liveMatchUnsubscribers = unsubscribers;
      (ws.data as any).liveMatchUserId = userId;
      ws.send({
        type: "connected",
        timestamp: new Date().toISOString(),
      });
    },
    message(ws, message) {
      const data = typeof message === "object" && message ? (message as any) : {};
      const unsubscribers = ((ws.data as any).liveMatchUnsubscribers || []) as Array<
        () => void
      >;
      const subscriber = (event: any) => ws.send(event);

      if (data.type === "subscribe" && data.ticketId) {
        unsubscribers.push(
          liveMatchEvents.subscribe(
            liveMatchEvents.topicForTicket(String(data.ticketId)),
            subscriber,
          ),
        );
      }

      if (data.type === "subscribe" && data.sessionId) {
        unsubscribers.push(
          liveMatchEvents.subscribe(
            liveMatchEvents.topicForSession(String(data.sessionId)),
            subscriber,
          ),
        );
      }

      (ws.data as any).liveMatchUnsubscribers = unsubscribers;
    },
    close(ws) {
      const unsubscribers = ((ws.data as any).liveMatchUnsubscribers || []) as Array<
        () => void
      >;
      for (const unsubscribe of unsubscribers) {
        unsubscribe();
      }
    },
    detail: {
      tags: ["Live Match"],
      summary: "Live match event stream",
      description:
        "Authenticated WebSocket stream for live match ticket and session updates",
    },
  });

function serializeLiveMatchResult(result: any) {
  return {
    ticket: serializeTicket(result.ticket),
    session: result.session ? serializeSession(result.session) : undefined,
  };
}

function serializeTicket(ticket: any) {
  return serializeTicketEvent(ticket);
}

function serializeSession(session: any) {
  return serializeSessionEvent(session);
}

// Made with Bob
