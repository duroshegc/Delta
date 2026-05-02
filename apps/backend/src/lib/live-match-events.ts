/**
 * Live Match Event Bus
 * In-process fanout for WebSocket delivery. This can be mirrored to Redis later.
 */

import type { ObjectId } from "mongodb";
import type { LiveMatchTicket, LiveSession } from "../types/live-match";

export type LiveMatchEventType =
  | "connected"
  | "ticket_update"
  | "session_update";

export interface LiveMatchEvent {
  type: LiveMatchEventType;
  ticket?: ReturnType<typeof serializeTicket>;
  session?: ReturnType<typeof serializeSession>;
  timestamp: string;
}

type Subscriber = (event: LiveMatchEvent) => void;

const subscribers = new Map<string, Set<Subscriber>>();

export const liveMatchEvents = {
  topicForUser(userId: ObjectId | string): string {
    return `live-match:user:${userId.toString()}`;
  },

  topicForTicket(ticketId: ObjectId | string): string {
    return `live-match:ticket:${ticketId.toString()}`;
  },

  topicForSession(sessionId: string): string {
    return `live-match:session:${sessionId}`;
  },

  subscribe(topic: string, subscriber: Subscriber): () => void {
    if (!subscribers.has(topic)) {
      subscribers.set(topic, new Set());
    }
    subscribers.get(topic)!.add(subscriber);

    return () => {
      subscribers.get(topic)?.delete(subscriber);
      if (subscribers.get(topic)?.size === 0) {
        subscribers.delete(topic);
      }
    };
  },

  publish(topic: string, event: LiveMatchEvent): void {
    const topicSubscribers = subscribers.get(topic);
    if (!topicSubscribers) {
      return;
    }

    for (const subscriber of topicSubscribers) {
      subscriber(event);
    }
  },

  publishTicket(ticket: LiveMatchTicket, session?: LiveSession): void {
    const event = {
      type: "ticket_update" as const,
      ticket: serializeTicket(ticket),
      session: session ? serializeSession(session) : undefined,
      timestamp: new Date().toISOString(),
    };

    this.publish(this.topicForUser(ticket.userId), event);
    this.publish(this.topicForTicket(ticket._id), event);
    if (ticket.sessionId) {
      this.publish(this.topicForSession(ticket.sessionId), event);
    }
  },

  publishSession(session: LiveSession): void {
    const event = {
      type: "session_update" as const,
      session: serializeSession(session),
      timestamp: new Date().toISOString(),
    };

    for (const participant of session.participants) {
      this.publish(this.topicForUser(participant), event);
    }
    this.publish(this.topicForSession(session.sessionId), event);
  },

  reset(): void {
    subscribers.clear();
  },
};

export function serializeTicket(ticket: LiveMatchTicket) {
  return {
    id: ticket._id.toString(),
    userId: ticket.userId.toString(),
    status: ticket.status,
    region: ticket.region,
    intent: ticket.intent,
    interests: ticket.interests,
    poolKeys: ticket.poolKeys,
    reservationId: ticket.reservationId.toString(),
    matchedTicketId: ticket.matchedTicketId?.toString(),
    sessionId: ticket.sessionId,
    expiresAt: ticket.expiresAt,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
}

export function serializeSession(session: LiveSession) {
  return {
    id: session._id.toString(),
    sessionId: session.sessionId,
    roomName: session.roomName,
    participants: session.participants.map((id) => id.toString()),
    ticketIds: session.ticketIds.map((id) => id.toString()),
    reservationIds: session.reservationIds.map((id) => id.toString()),
    status: session.status,
    billingStatus: session.billingStatus,
    region: session.region,
    intent: session.intent,
    interest: session.interest,
    joinedParticipants: session.joinedParticipants.map((id) => id.toString()),
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    durationSeconds: session.durationSeconds,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

// Made with Bob
