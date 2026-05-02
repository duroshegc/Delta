/**
 * Matching Service
 * Business logic for likes, mutual matches, and match lists
 */

import { ObjectId, type Collection, type Db } from "mongodb";
import { logger } from "../config/logger";
import { COLLECTIONS } from "../types/database";
import type { Media } from "../types/media";
import type { Profile } from "../types/profile";
import type {
  Like,
  LikeType,
  Match,
  MatchListItem,
  MatchesFeed,
} from "../types/matching";
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../utils/errors";
import { ChatService } from "./chat-service";
import { SafetyService } from "./safety-service";

export interface SendLikeResult {
  like: {
    id: string;
    type: LikeType;
    targetUserId: string;
    createdAt: Date;
  };
  matched: boolean;
  match?: MatchListItem;
}

export class MatchingService {
  private likesCollection: Collection<Like>;
  private matchesCollection: Collection<Match>;
  private profilesCollection: Collection<Profile>;
  private mediaCollection: Collection<Media>;

  constructor(private db: Db) {
    this.likesCollection = db.collection<Like>(COLLECTIONS.LIKES);
    this.matchesCollection = db.collection<Match>(COLLECTIONS.MATCHES);
    this.profilesCollection = db.collection<Profile>(COLLECTIONS.PROFILES);
    this.mediaCollection = db.collection<Media>(COLLECTIONS.MEDIA);
  }

  async sendLike(
    fromUserId: ObjectId,
    toUserId: ObjectId,
    type: LikeType,
  ): Promise<SendLikeResult> {
    if (fromUserId.equals(toUserId)) {
      throw new ValidationError("You cannot like your own profile");
    }

    const [fromProfile, targetProfile] = await Promise.all([
      this.profilesCollection.findOne({ userId: fromUserId }),
      this.profilesCollection.findOne({
        userId: toUserId,
        visibility: "active",
      }),
    ]);

    if (!fromProfile) {
      throw new ValidationError("Please complete your profile before liking");
    }

    if (!targetProfile) {
      throw new NotFoundError("Profile");
    }
    await new SafetyService(this.db).assertUsersCanInteract(fromUserId, toUserId);

    const existingMatch = await this.matchesCollection.findOne({
      participantKey: buildParticipantKey(fromUserId, toUserId),
      status: "active",
    });

    if (existingMatch) {
      throw new ConflictError("You are already matched with this user");
    }

    const existingLike = await this.likesCollection.findOne({
      fromUserId,
      toUserId,
      status: "active",
    });

    if (existingLike) {
      throw new ConflictError("You have already liked this profile");
    }

    const now = new Date();
    const like: Omit<Like, "_id"> = {
      fromUserId,
      toUserId,
      type,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    const likeResult = await this.likesCollection.insertOne(like as Like);

    const reverseLike = await this.likesCollection.findOne({
      fromUserId: toUserId,
      toUserId: fromUserId,
      status: "active",
    });

    let matched = false;
    let matchItem: MatchListItem | undefined;

    if (reverseLike) {
      const match = await this.createMutualMatch(
        fromUserId,
        toUserId,
        likeResult.insertedId,
        reverseLike._id,
        now,
      );
      await new ChatService(this.db).ensureConversationForMatch(match);

      matched = true;
      matchItem = await this.matchToListItem(match, fromUserId);

      logger.info(
        {
          matchId: match._id.toString(),
          participants: match.participants.map((id) => id.toString()),
        },
        "Mutual match created",
      );
    }

    return {
      like: {
        id: likeResult.insertedId.toString(),
        type,
        targetUserId: toUserId.toString(),
        createdAt: now,
      },
      matched,
      match: matchItem,
    };
  }

  async listMatches(
    userId: ObjectId,
    limit: number,
    cursor?: string,
  ): Promise<MatchesFeed> {
    const query: any = {
      participants: userId,
      status: "active",
    };

    if (cursor) {
      if (!ObjectId.isValid(cursor)) {
        throw new ValidationError("Invalid cursor");
      }
      query._id = { $lt: new ObjectId(cursor) };
    }

    const matches = await this.matchesCollection
      .find(query)
      .sort({ matchedAt: -1, _id: -1 })
      .limit(limit + 1)
      .toArray();

    const hasMore = matches.length > limit;
    const page = hasMore ? matches.slice(0, limit) : matches;
    const items = await Promise.all(
      page.map((match) => this.matchToListItem(match, userId)),
    );

    return {
      matches: items,
      cursor:
        hasMore && page.length > 0
          ? page[page.length - 1]!._id.toString()
          : undefined,
      hasMore,
    };
  }

  async unmatch(
    userId: ObjectId,
    matchId: ObjectId,
  ): Promise<{ id: string; status: "unmatched"; unmatchedAt: Date }> {
    const match = await this.matchesCollection.findOne({ _id: matchId });

    if (!match) {
      throw new NotFoundError("Match");
    }

    if (!match.participants.some((participant) => participant.equals(userId))) {
      throw new AuthorizationError("You can only unmatch your own matches");
    }

    if (match.status === "unmatched") {
      throw new ConflictError("Match is already unmatched");
    }

    const unmatchedAt = new Date();
    await this.matchesCollection.updateOne(
      { _id: matchId },
      {
        $set: {
          status: "unmatched",
          unmatchedAt,
          unmatchedBy: userId,
          updatedAt: unmatchedAt,
        },
      },
    );

    return {
      id: matchId.toString(),
      status: "unmatched",
      unmatchedAt,
    };
  }

  private async createMutualMatch(
    userA: ObjectId,
    userB: ObjectId,
    likeAId: ObjectId,
    likeBId: ObjectId,
    now: Date,
  ): Promise<Match> {
    const participantKey = buildParticipantKey(userA, userB);
    const participants = [userA, userB].sort((a, b) =>
      a.toString().localeCompare(b.toString()),
    );

    const result = await this.matchesCollection.findOneAndUpdate(
      { participantKey },
      {
        $setOnInsert: {
          participants,
          participantKey,
          likeIds: [likeAId, likeBId],
          status: "active",
          matchedAt: now,
          createdAt: now,
        },
        $set: {
          updatedAt: now,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      },
    );

    if (!result) {
      throw new ConflictError("Unable to create match");
    }

    return result;
  }

  private async matchToListItem(
    match: Match,
    viewerUserId: ObjectId,
  ): Promise<MatchListItem> {
    const otherUserId = match.participants.find(
      (participant) => !participant.equals(viewerUserId),
    );

    const otherUser = otherUserId
      ? await this.getProfileSummary(otherUserId)
      : null;

    return {
      id: match._id.toString(),
      matchedAt: match.matchedAt,
      lastMessageAt: match.lastMessageAt,
      status: match.status,
      otherUser,
    };
  }

  private async getProfileSummary(userId: ObjectId) {
    const profile = await this.profilesCollection.findOne({ userId });

    if (!profile) {
      return null;
    }

    const media = await this.mediaCollection
      .find({
        userId,
        mediaType: { $in: ["profile_image", "profile_video"] },
        moderationStatus: "approved",
      })
      .sort({ createdAt: 1 })
      .toArray();

    return {
      userId: userId.toString(),
      displayName: profile.displayName,
      age: profile.age,
      gender: profile.gender,
      intent: profile.intent,
      bio: profile.bio,
      city: profile.city,
      country: profile.country,
      interests: profile.interests,
      verificationStatus: profile.verificationStatus,
      media: media.map((item, index) => ({
        id: item._id.toString(),
        url: item.url,
        type: item.mediaType as "profile_image" | "profile_video",
        order: index,
      })),
    };
  }
}

export function buildParticipantKey(userA: ObjectId, userB: ObjectId): string {
  return [userA.toString(), userB.toString()].sort().join(":");
}

// Made with Bob
