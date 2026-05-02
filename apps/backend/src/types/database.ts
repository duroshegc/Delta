import type { ObjectId } from "mongodb";

// ============================================================================
// Collection Names
// ============================================================================

export const COLLECTIONS = {
  USERS: "users",
  PROFILES: "profiles",
  MEDIA: "media",
  LIKES: "likes",
  MATCHES: "matches",
  CONVERSATIONS: "conversations",
  MESSAGES: "messages",
  WALLETS: "wallets",
  WALLET_TRANSACTIONS: "wallet_transactions",
  TOKEN_RESERVATIONS: "token_reservations",
  LIVE_MATCH_TICKETS: "live_match_tickets",
  LIVE_SESSIONS: "live_sessions",
  LIVE_SESSION_EVENTS: "live_session_events",
  REPORTS: "reports",
  MODERATION_CASES: "moderation_cases",
  TRUST_SCORES: "trust_scores",
  AUDIT_LOGS: "audit_logs",
  ANALYTICS_EVENTS: "analytics_events",
  DASHBOARD_METRICS: "dashboard_metrics",
} as const;

// ============================================================================
// Base Types
// ============================================================================

export interface BaseDocument {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Common Enums
// ============================================================================

export type AccountStatus = "active" | "suspended" | "banned" | "deleted";
export type DatingIntent = "serious" | "casual" | "friendship" | "networking";
export type Gender =
  | "male"
  | "female"
  | "non-binary"
  | "other"
  | "prefer-not-to-say";
export type VerificationStatus = "none" | "pending" | "verified" | "rejected";
export type ProfileVisibility = "active" | "paused" | "hidden" | "restricted";
export type ModerationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "flagged"
  | "under_review";
export type MediaType =
  | "profile_image"
  | "profile_video"
  | "verification_selfie"
  | "verification_video"
  | "chat_image"
  | "chat_video"
  | "report_evidence";

// ============================================================================
// GeoJSON Types
// ============================================================================

export interface GeoLocation {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

// Made with Bob
