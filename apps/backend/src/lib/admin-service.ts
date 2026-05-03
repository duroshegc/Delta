import { ObjectId, type Db } from "mongodb";
import { COLLECTIONS } from "../types/database";
import type { AuditLog } from "../types/safety";
import { hashPassword } from "./password";
import { ConflictError } from "../utils/errors";

export type AdminRole =
  | "super_admin"
  | "admin"
  | "trust_safety_manager"
  | "moderator"
  | "support"
  | "finance"
  | "analyst";

export class AdminService {
  constructor(private db: Db) {}

  async listUsers(query: { q?: string; status?: string; limit: number }) {
    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.q) filter.email = { $regex: query.q, $options: "i" };
    return this.db.collection(COLLECTIONS.USERS).find(filter).sort({ createdAt: -1 }).limit(query.limit).toArray();
  }

  async listReports(query: { status?: string; severity?: string; limit: number }) {
    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.severity) filter.severity = query.severity;
    return this.db.collection(COLLECTIONS.REPORTS).find(filter).sort({ createdAt: -1 }).limit(query.limit).toArray();
  }

  async listSessions(query: { status?: string; limit: number }) {
    const filter: any = {};
    if (query.status) filter.status = query.status;
    return this.db.collection(COLLECTIONS.LIVE_SESSIONS).find(filter).sort({ createdAt: -1 }).limit(query.limit).toArray();
  }

  async updateUser(input: {
    actorId: ObjectId;
    targetUserId: ObjectId;
    status?: string;
    verificationStatus?: string;
    reason: string;
  }) {
    const now = new Date();
    if (input.status) {
      await this.db.collection(COLLECTIONS.USERS).updateOne(
        { _id: input.targetUserId },
        { $set: { status: input.status, updatedAt: now } },
      );
    }
    if (input.verificationStatus) {
      await this.db.collection(COLLECTIONS.PROFILES).updateOne(
        { userId: input.targetUserId },
        { $set: { verificationStatus: input.verificationStatus, updatedAt: now } },
      );
    }
    await this.createAuditLog({
      actorId: input.actorId,
      targetUserId: input.targetUserId,
      action: "admin.user.update",
      resourceType: "user",
      resourceId: input.targetUserId.toString(),
      metadata: {
        status: input.status,
        verificationStatus: input.verificationStatus,
        reason: input.reason,
      },
    });
    return this.db.collection(COLLECTIONS.USERS).findOne({ _id: input.targetUserId });
  }

  async createAdminAccount(input: {
    actorId: ObjectId;
    email: string;
    password: string;
    name?: string;
    role: AdminRole;
    reason: string;
  }) {
    const email = input.email.toLowerCase();
    const existing = await this.db.collection(COLLECTIONS.USERS).findOne({ email });
    if (existing) {
      throw new ConflictError("Email already registered");
    }

    const now = new Date();
    const userId = new ObjectId();
    const passwordHash = await hashPassword(input.password);

    const user = {
      _id: userId,
      email,
      name: input.name,
      passwordHash,
      emailVerified: true,
      phoneVerified: false,
      status: "active",
      role: input.role,
      accountType: "admin",
      createdAt: now,
      updatedAt: now,
    };

    await this.db.collection(COLLECTIONS.USERS).insertOne(user);
    await this.createAuditLog({
      actorId: input.actorId,
      targetUserId: userId,
      action: "admin.account.create",
      resourceType: "admin",
      resourceId: userId.toString(),
      metadata: {
        email,
        role: input.role,
        reason: input.reason,
      },
    });

    return user;
  }

  async getAnalytics() {
    const [
      users,
      profiles,
      likes,
      matches,
      liveTickets,
      liveSessions,
      walletTransactions,
      reports,
      openReports,
    ] = await Promise.all([
      this.db.collection(COLLECTIONS.USERS).countDocuments(),
      this.db.collection(COLLECTIONS.PROFILES).countDocuments(),
      this.db.collection(COLLECTIONS.LIKES).countDocuments(),
      this.db.collection(COLLECTIONS.MATCHES).countDocuments(),
      this.db.collection(COLLECTIONS.LIVE_MATCH_TICKETS).countDocuments(),
      this.db.collection(COLLECTIONS.LIVE_SESSIONS).countDocuments(),
      this.db.collection(COLLECTIONS.WALLET_TRANSACTIONS).find({ status: "completed" }).toArray(),
      this.db.collection(COLLECTIONS.REPORTS).countDocuments(),
      this.db.collection(COLLECTIONS.REPORTS).countDocuments({ status: "open" }),
    ]);
    const revenueTokens = walletTransactions
      .filter((transaction: any) => transaction.type === "purchase")
      .reduce((sum: number, transaction: any) => sum + (transaction.amount || 0), 0);

    return {
      growth: { users, profiles },
      datingFunnel: { likes, matches, matchRate: likes ? matches / likes : 0 },
      liveMatchFunnel: { tickets: liveTickets, sessions: liveSessions },
      revenue: { completedTransactions: walletTransactions.length, purchasedTokens: revenueTokens },
      safety: { reports, openReports },
    };
  }

  async createAuditLog(input: Omit<AuditLog, "_id" | "createdAt">) {
    const result = await this.db.collection(COLLECTIONS.AUDIT_LOGS).insertOne({
      ...input,
      createdAt: new Date(),
    } as AuditLog);
    return this.db.collection(COLLECTIONS.AUDIT_LOGS).findOne({ _id: result.insertedId });
  }
}

// Made with Bob
