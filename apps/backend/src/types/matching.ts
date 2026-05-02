import type { ObjectId } from "mongodb";
import type { Gender, DatingIntent } from "./database";

/**
 * Likes and matches domain types.
 */

export type LikeType = "like" | "super_like";
export type LikeStatus = "active" | "withdrawn";
export type MatchStatus = "active" | "unmatched";

export interface Like {
  _id: ObjectId;
  fromUserId: ObjectId;
  toUserId: ObjectId;
  type: LikeType;
  status: LikeStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Match {
  _id: ObjectId;
  participants: ObjectId[];
  participantKey: string;
  likeIds: ObjectId[];
  status: MatchStatus;
  matchedAt: Date;
  unmatchedAt?: Date;
  unmatchedBy?: ObjectId;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MatchProfileSummary {
  userId: string;
  displayName: string;
  age: number;
  gender: Gender;
  intent: DatingIntent;
  bio?: string;
  city?: string;
  country: string;
  interests: string[];
  verificationStatus: string;
  media: {
    id: string;
    url: string;
    type: "profile_image" | "profile_video";
    order: number;
  }[];
}

export interface MatchListItem {
  id: string;
  matchedAt: Date;
  lastMessageAt?: Date;
  status: MatchStatus;
  otherUser: MatchProfileSummary | null;
}

export interface MatchesFeed {
  matches: MatchListItem[];
  cursor?: string;
  hasMore: boolean;
}

// Made with Bob
