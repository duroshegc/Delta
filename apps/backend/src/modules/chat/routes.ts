/**
 * Chat Routes
 * Conversation and messaging endpoints for matched users
 */

import { Elysia, t } from "elysia";
import { ObjectId } from "mongodb";
import { getDatabase } from "../../config/database";
import { logger } from "../../config/logger";
import { RATE_LIMITS } from "../../config/rate-limits";
import { requireAuth } from "../../middleware/auth";
import { userRateLimit } from "../../middleware/rate-limit";
import { ChatService } from "../../lib/chat-service";
import {
  conversationsQuerySchema,
  messagesQuerySchema,
  sendMessageSchema,
} from "./schemas";
import { ValidationError } from "../../utils/errors";

export const chatRoutes = new Elysia()
  .use(requireAuth)
  .get(
    "/conversations",
    async (context) => {
      const { user, query } = context as any;
      const validatedQuery = conversationsQuerySchema.parse(query);

      const chatService = new ChatService(getDatabase());
      const conversations = await chatService.listConversations(
        new ObjectId(user.userId),
        validatedQuery.limit,
        validatedQuery.cursor,
      );

      logger.debug(
        { userId: user.userId, count: conversations.conversations.length },
        "Conversations retrieved",
      );

      return {
        success: true,
        data: conversations,
      };
    },
    {
      beforeHandle: userRateLimit(RATE_LIMITS.API),
      query: t.Object({
        limit: t.Optional(t.String()),
        cursor: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Chat"],
        summary: "List conversations",
        description: "List active conversations for the authenticated user",
      },
    },
  )
  .get(
    "/conversations/:conversationId/messages",
    async (context) => {
      const { user, params, query } = context as any;

      if (!ObjectId.isValid(params.conversationId)) {
        throw new ValidationError("Invalid conversation ID");
      }

      const validatedQuery = messagesQuerySchema.parse(query);
      const chatService = new ChatService(getDatabase());
      const messages = await chatService.listMessages(
        new ObjectId(user.userId),
        new ObjectId(params.conversationId),
        validatedQuery.limit,
        validatedQuery.cursor,
      );

      logger.debug(
        {
          userId: user.userId,
          conversationId: params.conversationId,
          count: messages.messages.length,
        },
        "Conversation messages retrieved",
      );

      return {
        success: true,
        data: messages,
      };
    },
    {
      beforeHandle: userRateLimit(RATE_LIMITS.API),
      params: t.Object({
        conversationId: t.String(),
      }),
      query: t.Object({
        limit: t.Optional(t.String()),
        cursor: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Chat"],
        summary: "Get conversation messages",
        description: "Get paginated messages for a conversation",
      },
    },
  )
  .post(
    "/conversations/:conversationId/messages",
    async (context) => {
      const { user, params, body } = context as any;

      if (!ObjectId.isValid(params.conversationId)) {
        throw new ValidationError("Invalid conversation ID");
      }

      const validatedBody = sendMessageSchema.parse(body);
      const chatService = new ChatService(getDatabase());
      const message = await chatService.sendMessage(
        new ObjectId(user.userId),
        new ObjectId(params.conversationId),
        {
          text: validatedBody.text,
          mediaIds: validatedBody.mediaIds.map((id) => new ObjectId(id)),
          metadata: validatedBody.metadata,
        },
      );

      logger.info(
        {
          userId: user.userId,
          conversationId: params.conversationId,
          messageId: message.id,
          type: message.type,
        },
        "Message sent",
      );

      return {
        success: true,
        message: "Message sent successfully",
        data: message,
      };
    },
    {
      beforeHandle: userRateLimit(RATE_LIMITS.MESSAGING),
      params: t.Object({
        conversationId: t.String(),
      }),
      body: t.Object({
        text: t.Optional(t.String()),
        mediaIds: t.Optional(t.Array(t.String())),
        metadata: t.Optional(t.Record(t.String(), t.Unknown())),
      }),
      detail: {
        tags: ["Chat"],
        summary: "Send message",
        description:
          "Send a text and/or media message to an active matched conversation",
      },
    },
  );

// Made with Bob
