/**
 * Chat Service
 * Business logic for conversations, messages, and media authorization.
 */

import { ObjectId, type Collection, type Db } from "mongodb";
import { COLLECTIONS, type ModerationStatus } from "../types/database";
import type {
  Conversation,
  ConversationFeed,
  ConversationListItem,
  Message,
  MessageListItem,
  MessagesFeed,
  MessageType,
} from "../types/chat";
import type { Match } from "../types/matching";
import type { Media } from "../types/media";
import type { Profile } from "../types/profile";
import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "../utils/errors";

interface SendMessageInput {
  text?: string;
  mediaIds: ObjectId[];
  metadata?: Record<string, unknown>;
}

const FLAGGED_TEXT_PATTERNS = [
  /\b(?:kill yourself|kys)\b/i,
  /\b(?:nude|nudes)\b/i,
  /\b(?:cashapp|wire transfer)\b/i,
];

export class ChatService {
  private conversationsCollection: Collection<Conversation>;
  private messagesCollection: Collection<Message>;
  private matchesCollection: Collection<Match>;
  private mediaCollection: Collection<Media>;
  private profilesCollection: Collection<Profile>;

  constructor(private db: Db) {
    this.conversationsCollection = db.collection<Conversation>(
      COLLECTIONS.CONVERSATIONS,
    );
    this.messagesCollection = db.collection<Message>(COLLECTIONS.MESSAGES);
    this.matchesCollection = db.collection<Match>(COLLECTIONS.MATCHES);
    this.mediaCollection = db.collection<Media>(COLLECTIONS.MEDIA);
    this.profilesCollection = db.collection<Profile>(COLLECTIONS.PROFILES);
  }

  async ensureConversationForMatch(match: Match): Promise<Conversation> {
    const now = new Date();
    const unreadCounts = Object.fromEntries(
      match.participants.map((participant) => [participant.toString(), 0]),
    );

    const conversation = await this.conversationsCollection.findOneAndUpdate(
      { matchId: match._id },
      {
        $setOnInsert: {
          matchId: match._id,
          participants: match.participants,
          status: "active",
          unreadCounts,
          createdAt: now,
        },
        $set: {
          updatedAt: now,
        },
      },
      { upsert: true, returnDocument: "after" },
    );

    if (!conversation) {
      throw new ValidationError("Unable to create conversation");
    }

    return conversation;
  }

  async listConversations(
    userId: ObjectId,
    limit: number,
    cursor?: string,
  ): Promise<ConversationFeed> {
    const query: any = {
      participants: userId,
      status: "active",
    };

    if (cursor) {
      query._id = { $lt: new ObjectId(cursor) };
    }

    const conversations = await this.conversationsCollection
      .find(query)
      .sort({ lastMessageAt: -1, updatedAt: -1, _id: -1 })
      .limit(limit + 1)
      .toArray();

    const hasMore = conversations.length > limit;
    const page = hasMore ? conversations.slice(0, limit) : conversations;
    const items = await Promise.all(
      page.map((conversation) => this.conversationToListItem(conversation, userId)),
    );

    return {
      conversations: items,
      cursor:
        hasMore && page.length > 0
          ? page[page.length - 1]!._id.toString()
          : undefined,
      hasMore,
    };
  }

  async listMessages(
    userId: ObjectId,
    conversationId: ObjectId,
    limit: number,
    cursor?: string,
  ): Promise<MessagesFeed> {
    const conversation = await this.getConversationForParticipant(
      conversationId,
      userId,
    );

    const query: any = { conversationId: conversation._id };
    if (cursor) {
      query._id = { $lt: new ObjectId(cursor) };
    }

    const messages = await this.messagesCollection
      .find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .toArray();

    const hasMore = messages.length > limit;
    const page = hasMore ? messages.slice(0, limit) : messages;
    const items = await Promise.all(
      page.map((message) => this.messageToListItem(message)),
    );

    await this.markConversationRead(conversation._id, userId);

    return {
      messages: items.reverse(),
      cursor:
        hasMore && page.length > 0
          ? page[page.length - 1]!._id.toString()
          : undefined,
      hasMore,
    };
  }

  async sendMessage(
    senderId: ObjectId,
    conversationId: ObjectId,
    input: SendMessageInput,
  ): Promise<MessageListItem> {
    const conversation = await this.getConversationForParticipant(
      conversationId,
      senderId,
    );

    const match = await this.matchesCollection.findOne({
      _id: conversation.matchId,
      status: "active",
      participants: senderId,
    });

    if (!match) {
      throw new AuthorizationError("You can only message active matches");
    }

    const mediaIds = await this.validateMessageMedia(senderId, input.mediaIds);
    const moderation = moderateMessageText(input.text);
    const recipientIds = conversation.participants.filter(
      (participant) => !participant.equals(senderId),
    );
    const now = new Date();
    const message: Omit<Message, "_id"> = {
      conversationId: conversation._id,
      matchId: conversation.matchId,
      senderId,
      recipientIds,
      type: getMessageType(input.text, mediaIds),
      text: input.text,
      mediaIds,
      metadata: input.metadata,
      moderationStatus: moderation.status,
      moderationReasons: moderation.reasons,
      deliveryStatus: "sent",
      readBy: [senderId],
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.messagesCollection.insertOne(message as Message);
    await this.updateConversationAfterMessage(
      conversation,
      result.insertedId,
      senderId,
      recipientIds,
      input.text,
      mediaIds.length,
      now,
    );

    const created = await this.messagesCollection.findOne({
      _id: result.insertedId,
    });

    if (!created) {
      throw new ValidationError("Unable to create message");
    }

    return this.messageToListItem(created);
  }

  private async getConversationForParticipant(
    conversationId: ObjectId,
    userId: ObjectId,
  ): Promise<Conversation> {
    const conversation = await this.conversationsCollection.findOne({
      _id: conversationId,
    });

    if (!conversation) {
      throw new NotFoundError("Conversation");
    }

    if (!conversation.participants.some((participant) => participant.equals(userId))) {
      throw new AuthorizationError("You can only access your conversations");
    }

    if (conversation.status !== "active") {
      throw new AuthorizationError("Conversation is not active");
    }

    return conversation;
  }

  private async validateMessageMedia(
    senderId: ObjectId,
    mediaIds: ObjectId[],
  ): Promise<ObjectId[]> {
    if (mediaIds.length === 0) {
      return [];
    }

    const media = await this.mediaCollection
      .find({ _id: { $in: mediaIds } })
      .toArray();

    if (media.length !== mediaIds.length) {
      throw new NotFoundError("Media");
    }

    for (const item of media) {
      if (!item.userId.equals(senderId)) {
        throw new AuthorizationError("You can only send media you uploaded");
      }

      if (!["chat_image", "chat_video"].includes(item.mediaType)) {
        throw new ValidationError("Only chat media can be sent in messages");
      }

      if (["rejected", "flagged"].includes(item.moderationStatus)) {
        throw new ValidationError("This media cannot be sent");
      }
    }

    return mediaIds;
  }

  private async updateConversationAfterMessage(
    conversation: Conversation,
    messageId: ObjectId,
    senderId: ObjectId,
    recipientIds: ObjectId[],
    text: string | undefined,
    mediaCount: number,
    now: Date,
  ): Promise<void> {
    const unreadIncrements = Object.fromEntries(
      recipientIds.map((recipientId) => [
        `unreadCounts.${recipientId.toString()}`,
        1,
      ]),
    );

    await this.conversationsCollection.updateOne(
      { _id: conversation._id },
      {
        $set: {
          lastMessageId: messageId,
          lastMessageAt: now,
          lastMessagePreview: createMessagePreview(text, mediaCount),
          updatedAt: now,
          [`unreadCounts.${senderId.toString()}`]: 0,
        },
        $inc: unreadIncrements,
      },
    );

    await this.matchesCollection.updateOne(
      { _id: conversation.matchId },
      { $set: { lastMessageAt: now, updatedAt: now } },
    );
  }

  private async markConversationRead(
    conversationId: ObjectId,
    userId: ObjectId,
  ): Promise<void> {
    await Promise.all([
      this.conversationsCollection.updateOne(
        { _id: conversationId },
        {
          $set: {
            [`unreadCounts.${userId.toString()}`]: 0,
            updatedAt: new Date(),
          },
        },
      ),
      this.messagesCollection.updateMany(
        {
          conversationId,
          recipientIds: userId,
          readBy: { $ne: userId },
        },
        {
          $addToSet: { readBy: userId },
          $set: { deliveryStatus: "read", updatedAt: new Date() },
        },
      ),
    ]);
  }

  private async conversationToListItem(
    conversation: Conversation,
    viewerUserId: ObjectId,
  ): Promise<ConversationListItem> {
    const otherUserId = conversation.participants.find(
      (participant) => !participant.equals(viewerUserId),
    );
    const otherUser = otherUserId
      ? await this.getConversationProfileSummary(otherUserId)
      : null;

    return {
      id: conversation._id.toString(),
      matchId: conversation.matchId.toString(),
      participants: conversation.participants.map((id) => id.toString()),
      status: conversation.status,
      lastMessageAt: conversation.lastMessageAt,
      lastMessagePreview: conversation.lastMessagePreview,
      unreadCount: conversation.unreadCounts[viewerUserId.toString()] || 0,
      otherUser,
    };
  }

  private async messageToListItem(message: Message): Promise<MessageListItem> {
    const media = message.mediaIds.length
      ? await this.mediaCollection
          .find({ _id: { $in: message.mediaIds } })
          .toArray()
      : [];
    const mediaById = new Map(media.map((item) => [item._id.toString(), item]));

    return {
      id: message._id.toString(),
      conversationId: message.conversationId.toString(),
      senderId: message.senderId.toString(),
      recipientIds: message.recipientIds.map((id) => id.toString()),
      type: message.type,
      text: message.text,
      media: message.mediaIds
        .map((id) => mediaById.get(id.toString()))
        .filter((item): item is Media => Boolean(item))
        .map((item) => ({
          id: item._id.toString(),
          url: item.url,
          thumbnailUrl: item.thumbnailUrl,
          mediaType: item.mediaType,
          mimeType: item.mimeType,
        })),
      metadata: message.metadata,
      moderationStatus: message.moderationStatus,
      deliveryStatus: message.deliveryStatus,
      readBy: message.readBy.map((id) => id.toString()),
      createdAt: message.createdAt,
    };
  }

  private async getConversationProfileSummary(userId: ObjectId) {
    const profile = await this.profilesCollection.findOne({ userId });

    if (!profile) {
      return null;
    }

    const photo = await this.mediaCollection.findOne(
      {
        userId,
        mediaType: "profile_image",
        moderationStatus: "approved",
      },
      { sort: { createdAt: 1 } },
    );

    return {
      userId: userId.toString(),
      displayName: profile.displayName,
      age: profile.age,
      city: profile.city,
      country: profile.country,
      photoUrl: photo?.url,
    };
  }
}

function getMessageType(text: string | undefined, mediaIds: ObjectId[]): MessageType {
  if (text && mediaIds.length > 0) {
    return "mixed";
  }
  return mediaIds.length > 0 ? "media" : "text";
}

function createMessagePreview(
  text: string | undefined,
  mediaCount: number,
): string {
  if (text) {
    return text.length > 120 ? `${text.slice(0, 117)}...` : text;
  }
  return mediaCount === 1 ? "Sent media" : `Sent ${mediaCount} media items`;
}

function moderateMessageText(text?: string): {
  status: ModerationStatus;
  reasons?: string[];
} {
  if (!text) {
    return { status: "approved" };
  }

  const reasons = FLAGGED_TEXT_PATTERNS.filter((pattern) =>
    pattern.test(text),
  ).map((pattern) => pattern.source);

  return reasons.length > 0
    ? { status: "flagged", reasons }
    : { status: "approved" };
}

// Made with Bob
