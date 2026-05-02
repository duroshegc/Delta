import "./helpers/env.ts";

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ObjectId } from "mongodb";
import { InMemoryDb } from "./helpers/in-memory-db.ts";
import { COLLECTIONS } from "../src/types/database.ts";
import { ChatService } from "../src/lib/chat-service.ts";
import { AuthorizationError, ValidationError } from "../src/utils/errors.ts";

describe("chat", () => {
  it("sends messages only inside active matched conversations and tracks unread state", async () => {
    const { db, users, conversationId } = await seedChatDb();
    const chatService = new ChatService(db as any);

    const message = await chatService.sendMessage(users.alice, conversationId, {
      text: "Hey Bob",
      mediaIds: [],
    });

    assert.equal(message.text, "Hey Bob");
    assert.equal(message.type, "text");

    const conversations = await chatService.listConversations(users.bob, 10);
    assert.equal(conversations.conversations[0]?.unreadCount, 1);

    const messages = await chatService.listMessages(users.bob, conversationId, 20);
    assert.equal(messages.messages.length, 1);
    assert.equal(messages.messages[0]?.readBy.includes(users.bob.toString()), false);

    const afterRead = await chatService.listConversations(users.bob, 10);
    assert.equal(afterRead.conversations[0]?.unreadCount, 0);

    await assert.rejects(
      () =>
        chatService.sendMessage(users.mallory, conversationId, {
          text: "Let me in",
          mediaIds: [],
        }),
      AuthorizationError,
    );
  });

  it("authorizes chat media ownership and media type", async () => {
    const { db, users, conversationId } = await seedChatDb();
    const ownedChatImage = new ObjectId();
    const wrongOwnerImage = new ObjectId();
    const profileImage = new ObjectId();
    const now = new Date();

    await db.collection(COLLECTIONS.MEDIA).insertMany([
      createMedia(ownedChatImage, users.alice, "chat_image", now),
      createMedia(wrongOwnerImage, users.bob, "chat_image", now),
      createMedia(profileImage, users.alice, "profile_image", now),
    ]);

    const chatService = new ChatService(db as any);
    const message = await chatService.sendMessage(users.alice, conversationId, {
      text: "Photo",
      mediaIds: [ownedChatImage],
    });

    assert.equal(message.type, "mixed");
    assert.equal(message.media[0]?.id, ownedChatImage.toString());

    await assert.rejects(
      () =>
        chatService.sendMessage(users.alice, conversationId, {
          mediaIds: [wrongOwnerImage],
        }),
      AuthorizationError,
    );

    await assert.rejects(
      () =>
        chatService.sendMessage(users.alice, conversationId, {
          mediaIds: [profileImage],
        }),
      ValidationError,
    );
  });
});

async function seedChatDb() {
  const db = new InMemoryDb();
  const users = {
    alice: new ObjectId(),
    bob: new ObjectId(),
    mallory: new ObjectId(),
  };
  const matchId = new ObjectId();
  const conversationId = new ObjectId();
  const now = new Date();

  await db.collection(COLLECTIONS.PROFILES).insertMany([
    createProfile(users.alice, "Alice"),
    createProfile(users.bob, "Bob"),
  ]);
  await db.collection(COLLECTIONS.MATCHES).insertOne({
    _id: matchId,
    participants: [users.alice, users.bob],
    participantKey: [users.alice.toString(), users.bob.toString()].sort().join(":"),
    likeIds: [],
    status: "active",
    matchedAt: now,
    createdAt: now,
    updatedAt: now,
  });
  await db.collection(COLLECTIONS.CONVERSATIONS).insertOne({
    _id: conversationId,
    matchId,
    participants: [users.alice, users.bob],
    status: "active",
    unreadCounts: {
      [users.alice.toString()]: 0,
      [users.bob.toString()]: 0,
    },
    createdAt: now,
    updatedAt: now,
  });

  return { db, users, conversationId };
}

function createProfile(userId: ObjectId, displayName: string) {
  const now = new Date();
  return {
    _id: new ObjectId(),
    userId,
    displayName,
    dateOfBirth: new Date("1995-01-01"),
    age: 31,
    gender: "female",
    bio: `${displayName} bio`,
    location: { type: "Point", coordinates: [-97.7431, 30.2672] },
    country: "US",
    intent: "serious",
    lookingFor: ["male"],
    ageRange: { min: 18, max: 40 },
    maxDistance: 50,
    interests: ["music"],
    prompts: [],
    photos: [],
    videos: [],
    verificationStatus: "verified",
    visibility: "active",
    completionScore: 80,
    createdAt: now,
    updatedAt: now,
    lastActiveAt: now,
  };
}

function createMedia(
  _id: ObjectId,
  userId: ObjectId,
  mediaType: string,
  now: Date,
) {
  return {
    _id,
    userId,
    fileId: _id.toString(),
    url: `https://cdn.example.com/${_id.toString()}`,
    thumbnailUrl: `https://cdn.example.com/${_id.toString()}/thumb`,
    mediaType,
    mimeType: "image/jpeg",
    size: 100,
    moderationStatus: "approved",
    createdAt: now,
    updatedAt: now,
  };
}

// Made with Bob
