export type AdminRole =
  | "super_admin"
  | "admin"
  | "trust_safety_manager"
  | "moderator"
  | "support"
  | "finance"
  | "analyst";

export type Tone = "accent" | "live" | "success" | "danger" | "warning" | "delt" | "neutral" | "info";

export type MetricBreakdown = {
  label: string;
  value: number;
  detail?: string;
};

export type TrendPoint = {
  label: string;
  users: number;
  reports: number;
  sessions: number;
  revenue: number;
  safety: number;
};

export type Analytics = {
  growth: {
    users: number;
    profiles: number;
    dau: number;
    wau: number;
    mau: number;
    signupsToday: number;
    signupsWeek: number;
    profileCompletionRate: number;
    verificationRate: number;
    retentionD1: number;
    retentionD7: number;
    retentionD30: number;
    churnRate: number;
    regions: MetricBreakdown[];
  };
  datingFunnel: {
    profilesViewed: number;
    likes: number;
    matches: number;
    chatsStarted: number;
    replies: number;
    videoDateConversion: number;
    likeRate: number;
    matchRate: number;
    replyRate: number;
    dropoff: MetricBreakdown[];
  };
  liveMatchFunnel: {
    tickets: number;
    poolEntries: number;
    sessions: number;
    activeSessions: number;
    averageWaitSeconds: number;
    matchSuccessRate: number;
    joinFailureRate: number;
    averageDurationSeconds: number;
    skipRate: number;
    postCallMatchRate: number;
    reportRate: number;
  };
  revenue: {
    today: number;
    week: number;
    month: number;
    year: number;
    completedTransactions: number;
    purchasedTokens: number;
    circulationIssued: number;
    circulationSpent: number;
    circulationReserved: number;
    purchaseConversionRate: number;
    refundRate: number;
    failedPaymentRate: number;
    chargebackRate: number;
    byRegion: MetricBreakdown[];
    byPackage: MetricBreakdown[];
    topSpenders: MetricBreakdown[];
    usagePatterns: MetricBreakdown[];
  };
  safety: {
    reports: number;
    openReports: number;
    safetyAlerts: number;
    reportsPerThousandUsers: number;
    reportsPerThousandSessions: number;
    repeatOffenders: number;
    banRate: number;
    falsePositiveRate: number;
    categoryBreakdown: MetricBreakdown[];
    moderatorPerformance: MetricBreakdown[];
  };
  operational: {
    apiLatencyP50: number;
    apiLatencyP95: number;
    apiLatencyP99: number;
    errorRate: number;
    workerLagSeconds: number;
    redisQueueDepth: number;
    mongoSlowQueries: number;
    liveKitRoomFailures: number;
    webhookRetryRate: number;
    endpointErrors: MetricBreakdown[];
  };
  topInterests: MetricBreakdown[];
};

export type UserStatus = "active" | "suspended" | "banned" | "deleted";
export type VerificationStatus = "none" | "pending" | "verified" | "rejected";
export type RiskLevel = "new" | "trusted" | "verified" | "restricted" | "low" | "medium" | "high" | "critical";

export type InternalNote = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

export type AdminUser = {
  id: string;
  email: string;
  phone: string;
  name: string;
  age: number;
  location: string;
  region: string;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  verificationStatus: VerificationStatus;
  trustScore: number;
  riskLevel: RiskLevel;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  subscription: "free" | "plus" | "premium";
  profile: {
    bio: string;
    intent: string;
    interests: string[];
    media: string[];
    prompts: Array<{ prompt: string; answer: string }>;
  };
  restrictions: {
    shadowRestricted: boolean;
    canLiveMatch: boolean;
    canMessage: boolean;
    canLike: boolean;
    requiresVerification: boolean;
  };
  wallet: {
    balance: number;
    paidBalance: number;
    bonusBalance: number;
    reservedBalance: number;
    lifetimePurchased: number;
    lifetimeSpent: number;
  };
  reportsFiled: string[];
  reportsAgainst: string[];
  matches: Array<{ id: string; partnerName: string; createdAt: string; status: string }>;
  liveSessions: string[];
  blocks: Array<{ userId: string; reason: string; createdAt: string }>;
  devices: Array<{ id: string; platform: string; ip: string; location: string; lastSeenAt: string; risk: RiskLevel }>;
  notes: InternalNote[];
};

export type ReportSeverity = "low" | "medium" | "high" | "critical";
export type ReportStatus = "open" | "in_review" | "resolved" | "dismissed";

export type AdminReport = {
  id: string;
  reporterUserId: string;
  reportedUserId: string;
  reporterName: string;
  reportedName: string;
  category: string;
  severity: ReportSeverity;
  status: ReportStatus;
  priority: number;
  assignedTo: string;
  description: string;
  evidenceMediaIds: string[];
  context: {
    liveSessionId?: string;
    conversationId?: string;
    messages: Array<{ author: string; body: string; createdAt: string }>;
  };
  timeline: Array<{ label: string; actor: string; createdAt: string }>;
  notes: InternalNote[];
  slaDueAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ModerationCase = {
  id: string;
  reportId: string;
  targetUserId: string;
  reporterUserId: string;
  category: string;
  severity: ReportSeverity;
  status: "new" | "assigned" | "under_review" | "resolved" | "appeal";
  assignedTo: string;
  slaDueAt: string;
  template: string;
  appealStatus: "none" | "requested" | "approved" | "rejected";
  history: Array<{ label: string; actor: string; createdAt: string }>;
  notes: InternalNote[];
  createdAt: string;
  updatedAt: string;
};

export type LiveSession = {
  _id?: string;
  sessionId: string;
  roomName: string;
  participants: string[];
  participantNames: string[];
  status: "created" | "waiting" | "active" | "completed" | "cancelled" | "timeout";
  billingStatus: "reserved" | "settled" | "refunded" | "failed";
  region: string;
  intent: string;
  interest: string;
  durationSeconds: number;
  chargeDelt: number;
  reported: boolean;
  disconnectReason: string;
  connectionQuality: Array<{ userId: string; score: number; packetLoss: number; jitterMs: number }>;
  reports: string[];
  events: Array<{ type: string; actor?: string; createdAt: string; detail: string }>;
  notes: InternalNote[];
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
};

export type MediaReviewItem = {
  id: string;
  userId: string;
  userName: string;
  mediaType: "profile_image" | "profile_video" | "verification_selfie" | "verification_video" | "chat_media" | "report_evidence";
  status: "pending" | "approved" | "rejected" | "flagged" | "escalated";
  source: string;
  thumbnail: string;
  submittedAt: string;
  notes: InternalNote[];
  relatedMediaIds: string[];
  guideline: string;
};

export type TrustScoreRecord = {
  userId: string;
  userName: string;
  score: number;
  riskLevel: RiskLevel;
  restrictions: AdminUser["restrictions"];
  factors: Array<{ label: string; impact: number; detail: string }>;
  history: Array<{ label: string; delta: number; createdAt: string }>;
  triggers: Array<{ label: string; enabled: boolean; threshold: number }>;
};

export type WalletSummary = {
  userId: string;
  userName: string;
  balance: number;
  paidBalance: number;
  bonusBalance: number;
  reservedBalance: number;
  lifetimePurchased: number;
  lifetimeSpent: number;
  failedSettlements: number;
  disputedCharges: number;
  transactions: WalletTransaction[];
};

export type WalletTransaction = {
  id: string;
  userId: string;
  type: string;
  amount: number;
  status: "completed" | "pending" | "failed" | "disputed" | "refunded";
  feature: string;
  createdAt: string;
};

export type AuditLog = {
  id: string;
  actor: string;
  target: string;
  action: string;
  resourceType: string;
  reason: string;
  ip: string;
  device: string;
  createdAt: string;
};

export type AdminAccount = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: "active" | "revoked" | "invited";
  mfaEnabled: boolean;
  lastActiveAt: string;
};

export type MonitoringSnapshot = {
  poolDepths: MetricBreakdown[];
  workers: Array<{ name: string; status: "healthy" | "degraded" | "down"; lagSeconds: number; queueDepth: number }>;
  api: Array<{ endpoint: string; p95Ms: number; errorRate: number }>;
  alerts: Array<{ id: string; label: string; severity: Tone; detail: string }>;
};

export type SystemSettings = {
  featureFlags: Array<{ key: string; label: string; enabled: boolean }>;
  rateLimits: Array<{ key: string; label: string; value: number; unit: string }>;
  tokenPricing: Array<{ package: string; delt: number; priceUsd: number; active: boolean }>;
  moderationPolicies: Array<{ key: string; label: string; value: string }>;
  poolExpansionRules: Array<{ waitSeconds: number; behavior: string }>;
  trustThresholds: Array<{ level: string; min: number; max: number }>;
  notificationTemplates: Array<{ key: string; label: string; channel: string; enabled: boolean }>;
};

export type AdminDataset = {
  analytics: Analytics;
  trends: TrendPoint[];
  users: AdminUser[];
  reports: AdminReport[];
  cases: ModerationCase[];
  sessions: LiveSession[];
  media: MediaReviewItem[];
  trustScores: TrustScoreRecord[];
  wallets: WalletSummary[];
  auditLogs: AuditLog[];
  adminAccounts: AdminAccount[];
  monitoring: MonitoringSnapshot;
  settings: SystemSettings;
};
