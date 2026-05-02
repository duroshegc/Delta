import type { ObjectId } from "mongodb";
import type { ModerationStatus } from "./database";

/**
 * Chat and conversation domain types.
 */

export type ConversationStatus = "active" | "archived" | "closed";
export type MessageType = "text" | "media" | "mixed";
export type MessageDeliveryStatus = "sent" | "delivered" | "read";

export interface Conversation {
  _id: ObjectId;
  matchId: ObjectId;
  participants: ObjectId[];
  status: ConversationStatus;
  lastMessageId?: ObjectId;
  lastMessageAt?: Date;
  lastMessagePreview?: string;
  unreadCounts: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  _id: ObjectId;
  conversationId: ObjectId;
  matchId: ObjectId;
  senderId: ObjectId;
  recipientIds: ObjectId[];
  type: MessageType;
  text?: string;
  mediaIds: ObjectId[];
  metadata?: Record<string, unknown>;
  moderationStatus: ModerationStatus;
  moderationReasons?: string[];
  deliveryStatus: MessageDeliveryStatus;
  readBy: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationListItem {
  id: string;
  matchId: string;
  participants: string[];
  status: ConversationStatus;
  lastMessageAt?: Date;
  lastMessagePreview?: string;
  unreadCount: number;
  otherUser: {
    userId: string;
    displayName: string;
    age: number;
    city?: string;
    country: string;
    photoUrl?: string;
  } | null;
}

export interface ConversationFeed {
  conversations: ConversationListItem[];
  cursor?: string;
  hasMore: boolean;
}

export interface MessageListItem {
  id: string;
  conversationId: string;
  senderId: string;
  recipientIds: string[];
  type: MessageType;
  text?: string;
  media: {
    id: string;
    url: string;
    thumbnailUrl: string;
    mediaType: string;
    mimeType: string;
  }[];
  metadata?: Record<string, unknown>;
  moderationStatus: ModerationStatus;
  deliveryStatus: MessageDeliveryStatus;
  readBy: string[];
  createdAt: Date;
}

export interface MessagesFeed {
  messages: MessageListItem[];
  cursor?: string;
  hasMore: boolean;
}

// Made with Bob
