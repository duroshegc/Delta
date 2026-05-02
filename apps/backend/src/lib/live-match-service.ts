/**
 * Live Match Service
 * Creates live match tickets, pairs compatible users, and manages session state.
 */

import { ObjectId, type Collection, type Db } from "mongodb";
import { COLLECTIONS } from "../types/database";
import type { Profile } from "../types/profile";
import type {
  LiveMatchTicket,
  LiveSession,
  LiveSessionEvent,
} from "../types/live-match";
import { WalletService } from "./wallet-service";
import { LiveKitService } from "./livekit-service";
import { liveMatchEvents } from "./live-match-events";
import { SafetyService } from "./safety-service";
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../utils/errors";

const LIVE_MATCH_COST = 10;
const TICKET_TTL_SECONDS = 120;

interface SearchInput {
  userId: ObjectId;
  region: string;
  intent: Profile["intent"];
  interests: string[];
  idempotencyKey: string;
}

export class LiveMatchService {
  private ticketsCollection: Collection<LiveMatchTicket>;
  private sessionsCollection: Collection<LiveSession>;
  private eventsCollection: Collection<LiveSessionEvent>;
  private profilesCollection: Collection<Profile>;
  private walletService: WalletService;
  private liveKitService: LiveKitService;

  constructor(private db: Db) {
    this.ticketsCollection = db.collection<LiveMatchTicket>(
      COLLECTIONS.LIVE_MATCH_TICKETS,
    );
    this.sessionsCollection = db.collection<LiveSession>(COLLECTIONS.LIVE_SESSIONS);
    this.eventsCollection = db.collection<LiveSessionEvent>(
      COLLECTIONS.LIVE_SESSION_EVENTS,
    );
    this.profilesCollection = db.collection<Profile>(COLLECTIONS.PROFILES);
    this.walletService = new WalletService(db);
    this.liveKitService = new LiveKitService();
  }

  async search(input: SearchInput): Promise<{
    ticket: LiveMatchTicket;
    session?: LiveSession;
  }> {
    const existingTicket = await this.ticketsCollection.findOne({
      userId: input.userId,
      status: "searching",
    });

    if (existingTicket) {
      const session = existingTicket.sessionId
        ? await this.sessionsCollection.findOne({ sessionId: existingTicket.sessionId })
        : undefined;
      return {
        ticket: existingTicket,
        session: session || undefined,
      };
    }

    const profile = await this.profilesCollection.findOne({
      userId: input.userId,
      visibility: "active",
    });

    if (!profile) {
      throw new ValidationError("Please complete your profile before live matching");
    }
    await new SafetyService(this.db).assertCanLiveMatch(input.userId);

    const reservation = await this.walletService.createReservation({
      userId: input.userId,
      amount: LIVE_MATCH_COST,
      action: "live_match",
      idempotencyKey: `live-match:${input.idempotencyKey}`,
      ttlSeconds: TICKET_TTL_SECONDS + 60,
    });
    const now = new Date();
    const ticket: Omit<LiveMatchTicket, "_id"> = {
      userId: input.userId,
      status: "searching",
      region: input.region,
      intent: input.intent,
      interests: input.interests,
      poolKeys: buildPoolKeys(input.region, input.intent, input.interests),
      reservationId: reservation.reservation._id,
      expiresAt: new Date(now.getTime() + TICKET_TTL_SECONDS * 1000),
      createdAt: now,
      updatedAt: now,
    };
    const ticketResult = await this.ticketsCollection.insertOne(ticket as LiveMatchTicket);
    const createdTicket = (await this.ticketsCollection.findOne({
      _id: ticketResult.insertedId,
    }))!;
    const candidate = await this.findCompatibleTicket(createdTicket);

    if (!candidate) {
      liveMatchEvents.publishTicket(createdTicket);
      return { ticket: createdTicket };
    }

    const session = await this.createSession(createdTicket, candidate);
    const updatedTicket = (await this.ticketsCollection.findOne({
      _id: createdTicket._id,
    }))!;

    liveMatchEvents.publishTicket(updatedTicket, session);
    const matchedTicket = await this.ticketsCollection.findOne({
      _id: candidate._id,
    });
    if (matchedTicket) {
      liveMatchEvents.publishTicket(matchedTicket, session);
    }
    liveMatchEvents.publishSession(session);

    return { ticket: updatedTicket, session };
  }

  async cancel(input: {
    userId: ObjectId;
    ticketId: ObjectId;
    idempotencyKey: string;
  }): Promise<LiveMatchTicket> {
    const ticket = await this.ticketsCollection.findOne({ _id: input.ticketId });

    if (!ticket) {
      throw new NotFoundError("Live match ticket");
    }

    if (!ticket.userId.equals(input.userId)) {
      throw new AuthorizationError("You can only cancel your own live match ticket");
    }

    if (ticket.status !== "searching") {
      throw new ConflictError(`Ticket is already ${ticket.status}`);
    }

    await this.walletService.releaseReservation(
      input.userId,
      ticket.reservationId,
      `live-match-cancel:${input.idempotencyKey}`,
    );

    const now = new Date();
    await this.ticketsCollection.updateOne(
      { _id: ticket._id },
      { $set: { status: "cancelled", updatedAt: now } },
    );

    const updatedTicket = (await this.ticketsCollection.findOne({ _id: ticket._id }))!;
    liveMatchEvents.publishTicket(updatedTicket);
    return updatedTicket;
  }

  async getStatus(userId: ObjectId, ticketId: ObjectId): Promise<{
    ticket: LiveMatchTicket;
    session?: LiveSession;
  }> {
    const ticket = await this.ticketsCollection.findOne({ _id: ticketId });

    if (!ticket) {
      throw new NotFoundError("Live match ticket");
    }

    if (!ticket.userId.equals(userId)) {
      throw new AuthorizationError("You can only view your own live match ticket");
    }

    const session = ticket.sessionId
      ? await this.sessionsCollection.findOne({ sessionId: ticket.sessionId })
      : undefined;

    return { ticket, session: session || undefined };
  }

  async createParticipantToken(userId: ObjectId, sessionId: string) {
    const session = await this.sessionsCollection.findOne({ sessionId });

    if (!session) {
      throw new NotFoundError("Live session");
    }

    if (!session.participants.some((participant) => participant.equals(userId))) {
      throw new AuthorizationError("You can only join your own live session");
    }

    return this.liveKitService.createParticipantToken({
      roomName: session.roomName,
      userId: userId.toString(),
    });
  }

  async handleParticipantJoined(input: {
    sessionId: string;
    userId: ObjectId;
    payload?: Record<string, unknown>;
  }): Promise<LiveSession> {
    const session = await this.sessionsCollection.findOne({
      sessionId: input.sessionId,
    });

    if (!session) {
      throw new NotFoundError("Live session");
    }

    if (!session.participants.some((participant) => participant.equals(input.userId))) {
      throw new AuthorizationError("Participant is not part of this session");
    }

    const now = new Date();
    const joined = dedupeObjectIds([...session.joinedParticipants, input.userId]);
    const nextStatus = joined.length === session.participants.length ? "active" : "waiting";

    await this.sessionsCollection.updateOne(
      { _id: session._id },
      {
        $set: {
          joinedParticipants: joined,
          status: nextStatus,
          startedAt: nextStatus === "active" ? session.startedAt || now : session.startedAt,
          updatedAt: now,
        },
      },
    );
    await this.recordEvent(input.sessionId, "participant_joined", input.userId, input.payload);

    const updated = (await this.sessionsCollection.findOne({ _id: session._id }))!;
    if (updated.status === "active" && updated.billingStatus === "reserved") {
      await this.settleSessionReservations(updated);
      const settled = (await this.sessionsCollection.findOne({ _id: session._id }))!;
      liveMatchEvents.publishSession(settled);
      return settled;
    }

    liveMatchEvents.publishSession(updated);
    return updated;
  }

  async handleParticipantLeft(input: {
    sessionId: string;
    userId: ObjectId;
    payload?: Record<string, unknown>;
  }): Promise<LiveSession> {
    const session = await this.sessionsCollection.findOne({
      sessionId: input.sessionId,
    });

    if (!session) {
      throw new NotFoundError("Live session");
    }

    const now = new Date();
    await this.recordEvent(input.sessionId, "participant_left", input.userId, input.payload);

    if (session.status === "completed" || session.status === "cancelled") {
      return session;
    }

    const durationSeconds = session.startedAt
      ? Math.max(0, Math.round((now.getTime() - session.startedAt.getTime()) / 1000))
      : 0;
    await this.sessionsCollection.updateOne(
      { _id: session._id },
      {
        $set: {
          status: "completed",
          endedAt: now,
          durationSeconds,
          updatedAt: now,
        },
      },
    );

    const updated = (await this.sessionsCollection.findOne({ _id: session._id }))!;
    liveMatchEvents.publishSession(updated);
    return updated;
  }

  private async findCompatibleTicket(
    ticket: LiveMatchTicket,
  ): Promise<LiveMatchTicket | null> {
    const activeTickets = await this.ticketsCollection
      .find({
        status: "searching",
        region: ticket.region,
        intent: ticket.intent,
      })
      .sort({ createdAt: 1 })
      .toArray();

    return (
      activeTickets.find(
        (candidate) =>
          !candidate._id.equals(ticket._id) &&
          !candidate.userId.equals(ticket.userId) &&
          candidate.poolKeys.some((poolKey) => ticket.poolKeys.includes(poolKey)),
      ) || null
    );
  }

  private async createSession(
    ticketA: LiveMatchTicket,
    ticketB: LiveMatchTicket,
  ): Promise<LiveSession> {
    const now = new Date();
    const sessionId = new ObjectId().toString();
    const commonInterest = ticketA.interests.find((interest) =>
      ticketB.interests.includes(interest),
    );
    const roomName = `delta-live-${sessionId}`;
    await this.liveKitService.ensureRoom(roomName);

    const session: Omit<LiveSession, "_id"> = {
      sessionId,
      roomName,
      participants: [ticketA.userId, ticketB.userId],
      ticketIds: [ticketA._id, ticketB._id],
      reservationIds: [ticketA.reservationId, ticketB.reservationId],
      status: "created",
      billingStatus: "reserved",
      region: ticketA.region,
      intent: ticketA.intent,
      interest: commonInterest,
      joinedParticipants: [],
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.sessionsCollection.insertOne(session as LiveSession);
    await this.ticketsCollection.updateMany(
      { _id: { $in: [ticketA._id, ticketB._id] } },
      {
        $set: {
          status: "matched",
          sessionId,
          updatedAt: now,
        },
      },
    );
    await this.ticketsCollection.updateOne(
      { _id: ticketA._id },
      { $set: { matchedTicketId: ticketB._id } },
    );
    await this.ticketsCollection.updateOne(
      { _id: ticketB._id },
      { $set: { matchedTicketId: ticketA._id } },
    );
    await this.recordEvent(sessionId, "session_created", undefined, {
      ticketIds: [ticketA._id.toString(), ticketB._id.toString()],
    });

    return (await this.sessionsCollection.findOne({ _id: result.insertedId }))!;
  }

  private async settleSessionReservations(session: LiveSession): Promise<void> {
    for (const reservationId of session.reservationIds) {
      const userId = session.participants[session.reservationIds.indexOf(reservationId)]!;
      await this.walletService.settleReservation(
        userId,
        reservationId,
        `live-session-settle:${session.sessionId}:${reservationId.toString()}`,
      );
    }

    await this.sessionsCollection.updateOne(
      { _id: session._id },
      {
        $set: {
          billingStatus: "settled",
          updatedAt: new Date(),
        },
      },
    );
  }

  private async recordEvent(
    sessionId: string,
    type: string,
    userId?: ObjectId,
    payload?: Record<string, unknown>,
  ): Promise<void> {
    await this.eventsCollection.insertOne({
      sessionId,
      type,
      userId,
      payload,
      createdAt: new Date(),
    } as LiveSessionEvent);
  }
}

export function buildPoolKeys(
  region: string,
  intent: string,
  interests: string[],
): string[] {
  return interests.map(
    (interest) =>
      `pool:${region.toLowerCase()}:${intent}:${interest.trim().toLowerCase()}`,
  );
}

function dedupeObjectIds(ids: ObjectId[]): ObjectId[] {
  const map = new Map<string, ObjectId>();
  for (const id of ids) {
    map.set(id.toString(), id);
  }
  return Array.from(map.values());
}

// Made with Bob
