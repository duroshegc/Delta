import type { ObjectId } from "mongodb";
import type { DatingIntent } from "./database";

export type LiveMatchTicketStatus =
  | "searching"
  | "matched"
  | "cancelled"
  | "expired";

export type LiveSessionStatus =
  | "created"
  | "waiting"
  | "active"
  | "completed"
  | "cancelled"
  | "timeout";

export type LiveSessionBillingStatus =
  | "reserved"
  | "settled"
  | "refunded"
  | "failed";

export interface LiveMatchTicket {
  _id: ObjectId;
  userId: ObjectId;
  status: LiveMatchTicketStatus;
  region: string;
  intent: DatingIntent;
  interests: string[];
  poolKeys: string[];
  reservationId: ObjectId;
  matchedTicketId?: ObjectId;
  sessionId?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LiveSession {
  _id: ObjectId;
  sessionId: string;
  roomName: string;
  participants: ObjectId[];
  ticketIds: ObjectId[];
  reservationIds: ObjectId[];
  status: LiveSessionStatus;
  billingStatus: LiveSessionBillingStatus;
  region: string;
  intent: DatingIntent;
  interest?: string;
  joinedParticipants: ObjectId[];
  startedAt?: Date;
  endedAt?: Date;
  durationSeconds?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LiveSessionEvent {
  _id: ObjectId;
  sessionId: string;
  type: string;
  userId?: ObjectId;
  payload?: Record<string, unknown>;
  createdAt: Date;
}

// Made with Bob
