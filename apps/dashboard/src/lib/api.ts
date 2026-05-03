import type { AdminDataset, AdminReport, AdminUser, Analytics, LiveSession } from "@/types/admin";
import { mockAnalytics, mockDashboardData, mockReports, mockSessions, mockUsers } from "./mock-data";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
};

type SignInResponse = {
  user: {
    id?: string;
    email: string;
    role?: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
};

type BackendUser = Partial<AdminUser> & {
  id: string;
  email: string;
};

type BackendReport = Partial<AdminReport> & {
  id: string;
  reporterUserId: string;
  reportedUserId: string;
  category: string;
  severity: AdminReport["severity"];
  status: AdminReport["status"];
  createdAt: string;
};

type BackendSession = Partial<LiveSession> & {
  sessionId?: string;
  _id?: string;
  status: LiveSession["status"];
  createdAt: string;
};

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend-teal-one-10.vercel.app";
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

function getStoredToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("delta_admin_token") || "";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const errorPayload = (await response.json()) as Partial<ApiEnvelope<unknown>>;
      message = errorPayload.message || errorPayload.error || message;
    } catch {
      // Keep the status-based message when the backend does not return JSON.
    }
    throw new Error(message);
  }

  const payload = (await response.json()) as ApiEnvelope<T>;
  return payload.data;
}

async function withFallback<T>(fetcher: () => Promise<T>, fallback: T) {
  if (USE_MOCKS) {
    try {
      return await fetcher();
    } catch {
      return fallback;
    }
  }

  return fetcher();
}

function mergeAnalytics(value: Partial<Analytics>): Analytics {
  return {
    ...mockAnalytics,
    ...value,
    growth: { ...mockAnalytics.growth, ...value.growth },
    datingFunnel: { ...mockAnalytics.datingFunnel, ...value.datingFunnel },
    liveMatchFunnel: { ...mockAnalytics.liveMatchFunnel, ...value.liveMatchFunnel },
    revenue: { ...mockAnalytics.revenue, ...value.revenue },
    safety: { ...mockAnalytics.safety, ...value.safety },
    operational: { ...mockAnalytics.operational, ...value.operational },
    topInterests: value.topInterests || mockAnalytics.topInterests,
  };
}

function normalizeUser(user: BackendUser, index: number): AdminUser {
  const fallback = mockUsers[index % mockUsers.length];
  return {
    ...fallback,
    ...user,
    id: user.id,
    email: user.email,
    phone: user.phone || fallback.phone,
    name: user.name || user.email.split("@")[0],
    emailVerified: user.emailVerified ?? fallback.emailVerified,
    phoneVerified: user.phoneVerified ?? fallback.phoneVerified,
    createdAt: user.createdAt || fallback.createdAt,
    updatedAt: user.updatedAt || fallback.updatedAt,
    profile: { ...fallback.profile, ...user.profile },
    restrictions: { ...fallback.restrictions, ...user.restrictions },
    wallet: { ...fallback.wallet, ...user.wallet },
    reportsFiled: user.reportsFiled || fallback.reportsFiled,
    reportsAgainst: user.reportsAgainst || fallback.reportsAgainst,
    matches: user.matches || fallback.matches,
    liveSessions: user.liveSessions || fallback.liveSessions,
    blocks: user.blocks || fallback.blocks,
    devices: user.devices || fallback.devices,
    notes: user.notes || fallback.notes,
  };
}

function normalizeReport(report: BackendReport, index: number): AdminReport {
  const fallback = mockReports[index % mockReports.length];
  return {
    ...fallback,
    ...report,
    id: report.id,
    reporterUserId: report.reporterUserId,
    reportedUserId: report.reportedUserId,
    category: report.category,
    severity: report.severity,
    status: report.status,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt || report.createdAt,
    evidenceMediaIds: report.evidenceMediaIds || fallback.evidenceMediaIds,
    context: { ...fallback.context, ...report.context },
    timeline: report.timeline || fallback.timeline,
    notes: report.notes || fallback.notes,
  };
}

function normalizeSession(session: BackendSession, index: number): LiveSession {
  const fallback = mockSessions[index % mockSessions.length];
  return {
    ...fallback,
    ...session,
    sessionId: session.sessionId || session._id || fallback.sessionId,
    roomName: session.roomName || fallback.roomName,
    status: session.status,
    createdAt: session.createdAt,
    participants: session.participants || fallback.participants,
    participantNames: session.participantNames || fallback.participantNames,
    billingStatus: session.billingStatus || fallback.billingStatus,
    connectionQuality: session.connectionQuality || fallback.connectionQuality,
    reports: session.reports || fallback.reports,
    events: session.events || fallback.events,
    notes: session.notes || fallback.notes,
  };
}

export const adminApi = {
  signIn: (body: { email: string; password: string }) =>
    request<SignInResponse>("/auth/signin", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  analytics: () => withFallback(async () => mergeAnalytics(await request<Partial<Analytics>>("/admin/analytics")), mockAnalytics),
  users: (status = "") => {
    const query = new URLSearchParams({ limit: "100" });
    if (status) query.set("status", status);
    return withFallback(async () => (await request<BackendUser[]>(`/admin/users?${query}`)).map(normalizeUser), mockUsers);
  },
  reports: (status = "") => {
    const query = new URLSearchParams({ limit: "100" });
    if (status) query.set("status", status);
    return withFallback(async () => (await request<BackendReport[]>(`/admin/reports?${query}`)).map(normalizeReport), mockReports);
  },
  sessions: (status = "") => {
    const query = new URLSearchParams({ limit: "100" });
    if (status) query.set("status", status);
    return withFallback(async () => (await request<BackendSession[]>(`/admin/sessions?${query}`)).map(normalizeSession), mockSessions);
  },
  dashboard: async (): Promise<AdminDataset> => {
    const [analytics, users, reports, sessions] = await Promise.all([
      adminApi.analytics(),
      adminApi.users(),
      adminApi.reports(),
      adminApi.sessions(),
    ]);

    return {
      ...mockDashboardData,
      analytics,
      users,
      reports,
      sessions,
    };
  },
  updateUser: (id: string, body: { status?: AdminUser["status"]; verificationStatus?: string; reason: string }) =>
    request<AdminUser>(`/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};
