import type { ObjectId } from "mongodb";

export type ReportCategory =
  | "harassment"
  | "spam"
  | "fake_profile"
  | "inappropriate_content"
  | "scam"
  | "underage"
  | "other";

export type ReportSeverity = "low" | "medium" | "high" | "critical";
export type ReportStatus = "open" | "in_review" | "resolved" | "dismissed";
export type ModerationCaseStatus = "open" | "assigned" | "resolved" | "closed";
export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface Report {
  _id: ObjectId;
  reporterUserId: ObjectId;
  reportedUserId: ObjectId;
  category: ReportCategory;
  severity: ReportSeverity;
  status: ReportStatus;
  description: string;
  evidenceMediaIds: ObjectId[];
  context?: {
    matchId?: ObjectId;
    conversationId?: ObjectId;
    messageId?: ObjectId;
    liveSessionId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Block {
  _id: ObjectId;
  blockerUserId: ObjectId;
  blockedUserId: ObjectId;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModerationCase {
  _id: ObjectId;
  reportId: ObjectId;
  targetUserId: ObjectId;
  reporterUserId: ObjectId;
  category: ReportCategory;
  severity: ReportSeverity;
  status: ModerationCaseStatus;
  assignedTo?: ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrustScore {
  _id: ObjectId;
  userId: ObjectId;
  score: number;
  riskLevel: RiskLevel;
  restrictions: {
    canLiveMatch: boolean;
    canMessage: boolean;
    canLike: boolean;
    requiresReview: boolean;
  };
  factors: {
    verificationStatus: number;
    reportCount: number;
    highSeverityReports: number;
    blockCount: number;
    accountAge: number;
  };
  lastCalculatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  _id: ObjectId;
  actorId: ObjectId;
  targetUserId?: ObjectId;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface AnalyticsEvent {
  _id: ObjectId;
  eventName: string;
  userId?: ObjectId;
  sessionId?: string;
  properties?: Record<string, unknown>;
  createdAt: Date;
}

// Made with Bob
