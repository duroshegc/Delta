import { ObjectId, type Collection, type Db } from "mongodb";
import { COLLECTIONS } from "../types/database";
import type { Profile } from "../types/profile";
import type {
  Block,
  ModerationCase,
  Report,
  ReportCategory,
  ReportSeverity,
  TrustScore,
} from "../types/safety";
import { AuthorizationError, ConflictError, NotFoundError, ValidationError } from "../utils/errors";

const SEVERITY_BY_CATEGORY: Record<ReportCategory, ReportSeverity> = {
  harassment: "medium",
  spam: "low",
  fake_profile: "medium",
  inappropriate_content: "medium",
  scam: "high",
  underage: "critical",
  other: "low",
};

export class SafetyService {
  private reports: Collection<Report>;
  private blocks: Collection<Block>;
  private cases: Collection<ModerationCase>;
  private trustScores: Collection<TrustScore>;
  private profiles: Collection<Profile>;

  constructor(private db: Db) {
    this.reports = db.collection<Report>(COLLECTIONS.REPORTS);
    this.blocks = db.collection<Block>(COLLECTIONS.BLOCKS);
    this.cases = db.collection<ModerationCase>(COLLECTIONS.MODERATION_CASES);
    this.trustScores = db.collection<TrustScore>(COLLECTIONS.TRUST_SCORES);
    this.profiles = db.collection<Profile>(COLLECTIONS.PROFILES);
  }

  async submitReport(input: {
    reporterUserId: ObjectId;
    reportedUserId: ObjectId;
    category: ReportCategory;
    description: string;
    evidenceMediaIds: ObjectId[];
    context?: Report["context"];
  }): Promise<{ report: Report; case: ModerationCase; trustScore: TrustScore }> {
    if (input.reporterUserId.equals(input.reportedUserId)) {
      throw new ValidationError("You cannot report yourself");
    }

    const target = await this.profiles.findOne({ userId: input.reportedUserId });
    if (!target) {
      throw new NotFoundError("Reported user profile");
    }

    const now = new Date();
    const severity = SEVERITY_BY_CATEGORY[input.category];
    const reportResult = await this.reports.insertOne({
      reporterUserId: input.reporterUserId,
      reportedUserId: input.reportedUserId,
      category: input.category,
      severity,
      status: "open",
      description: input.description,
      evidenceMediaIds: input.evidenceMediaIds,
      context: input.context,
      createdAt: now,
      updatedAt: now,
    } as Report);
    const report = (await this.reports.findOne({ _id: reportResult.insertedId }))!;
    const caseResult = await this.cases.insertOne({
      reportId: report._id,
      targetUserId: input.reportedUserId,
      reporterUserId: input.reporterUserId,
      category: input.category,
      severity,
      status: "open",
      createdAt: now,
      updatedAt: now,
    } as ModerationCase);
    const moderationCase = (await this.cases.findOne({ _id: caseResult.insertedId }))!;
    const trustScore = await this.recalculateTrustScore(input.reportedUserId);

    return { report, case: moderationCase, trustScore };
  }

  async blockUser(input: {
    blockerUserId: ObjectId;
    blockedUserId: ObjectId;
    reason?: string;
  }): Promise<Block> {
    if (input.blockerUserId.equals(input.blockedUserId)) {
      throw new ValidationError("You cannot block yourself");
    }

    const existing = await this.blocks.findOne({
      blockerUserId: input.blockerUserId,
      blockedUserId: input.blockedUserId,
    });
    if (existing) {
      return existing;
    }

    const now = new Date();
    const result = await this.blocks.insertOne({
      blockerUserId: input.blockerUserId,
      blockedUserId: input.blockedUserId,
      reason: input.reason,
      createdAt: now,
      updatedAt: now,
    } as Block);
    await this.recalculateTrustScore(input.blockedUserId);

    return (await this.blocks.findOne({ _id: result.insertedId }))!;
  }

  async assertUsersCanInteract(userA: ObjectId, userB: ObjectId): Promise<void> {
    const blocked = await this.blocks.findOne({
      $or: [
        { blockerUserId: userA, blockedUserId: userB },
        { blockerUserId: userB, blockedUserId: userA },
      ],
    } as any);
    if (blocked) {
      throw new AuthorizationError("This interaction is blocked");
    }

    const [scoreA, scoreB] = await Promise.all([
      this.getTrustScore(userA),
      this.getTrustScore(userB),
    ]);
    if (!scoreA.restrictions.canLike || !scoreB.restrictions.canLike) {
      throw new AuthorizationError("Matching is restricted for this interaction");
    }
  }

  async assertCanLiveMatch(userId: ObjectId): Promise<void> {
    const trustScore = await this.getTrustScore(userId);
    if (!trustScore.restrictions.canLiveMatch) {
      throw new AuthorizationError("Live matching is restricted for this account");
    }
  }

  async getBlockedUserIds(userId: ObjectId): Promise<ObjectId[]> {
    const blocks = await this.blocks
      .find({ $or: [{ blockerUserId: userId }, { blockedUserId: userId }] } as any)
      .toArray();
    const blockedIds = new Map<string, ObjectId>();
    for (const block of blocks) {
      const other = block.blockerUserId.equals(userId)
        ? block.blockedUserId
        : block.blockerUserId;
      blockedIds.set(other.toString(), other);
    }
    return Array.from(blockedIds.values());
  }

  async getTrustScore(userId: ObjectId): Promise<TrustScore> {
    return (await this.trustScores.findOne({ userId })) || this.recalculateTrustScore(userId);
  }

  async recalculateTrustScore(userId: ObjectId): Promise<TrustScore> {
    const [reports, blocks, profile] = await Promise.all([
      this.reports.find({ reportedUserId: userId }).toArray(),
      this.blocks.find({ blockedUserId: userId }).toArray(),
      this.profiles.findOne({ userId }),
    ]);
    const highSeverityReports = reports.filter((report) =>
      ["high", "critical"].includes(report.severity),
    ).length;
    const verificationPoints = profile?.verificationStatus === "verified" ? 20 : 0;
    const reportPenalty = Math.min(75, reports.length * 8 + highSeverityReports * 52);
    const blockPenalty = Math.min(20, blocks.length * 5);
    const score = Math.max(0, Math.min(100, 80 + verificationPoints - reportPenalty - blockPenalty));
    const riskLevel =
      score < 30 ? "critical" : score < 50 ? "high" : score < 70 ? "medium" : "low";
    const now = new Date();
    const restrictions = {
      canLiveMatch: score >= 50,
      canMessage: score >= 40,
      canLike: score >= 40,
      requiresReview: score < 70 || highSeverityReports > 0,
    };

    const result = await this.trustScores.findOneAndUpdate(
      { userId },
      {
        $set: {
          userId,
          score,
          riskLevel,
          restrictions,
          factors: {
            verificationStatus: verificationPoints,
            reportCount: reports.length,
            highSeverityReports,
            blockCount: blocks.length,
            accountAge: 0,
          },
          lastCalculatedAt: now,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true, returnDocument: "after" },
    );

    if (riskLevel === "critical") {
      await this.profiles.updateOne(
        { userId },
        { $set: { visibility: "restricted", updatedAt: now } },
      );
    }

    return result!;
  }
}

// Made with Bob
