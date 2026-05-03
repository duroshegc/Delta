"use client";

import {
  Activity,
  AlertTriangle,
  Ban,
  BarChart3,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Coins,
  Compass,
  Database,
  FileText,
  Flag,
  Gauge,
  Heart,
  Image,
  LayoutDashboard,
  ListChecks,
  Lock,
  LogOut,
  MapPin,
  MessageCircle,
  MonitorCog,
  Radio,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
  Users,
  Video,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ElementType, ReactElement, ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { adminApi } from "@/lib/api";
import type {
  AdminAccount,
  AdminDataset,
  AdminReport,
  AdminRole,
  AdminUser,
  AuditLog,
  LiveSession,
  MediaReviewItem,
  ModerationCase,
  Tone,
  TrustScoreRecord,
  WalletSummary,
} from "@/types/admin";

type ViewKey =
  | "overview"
  | "users"
  | "reports"
  | "cases"
  | "sessions"
  | "media"
  | "trust"
  | "wallet"
  | "analytics"
  | "audit"
  | "admins"
  | "settings";

type NavItem = {
  key: ViewKey;
  label: string;
  icon: ElementType;
  roles: AdminRole[] | "all";
};

const roleLabels: Record<AdminRole, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  trust_safety_manager: "Trust & Safety Manager",
  moderator: "Moderator",
  support: "Support",
  finance: "Finance",
  analyst: "Analyst",
};

const navItems: NavItem[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard, roles: "all" },
  { key: "users", label: "Users", icon: Users, roles: "all" },
  { key: "reports", label: "Reports", icon: Flag, roles: ["super_admin", "admin", "trust_safety_manager", "moderator", "support"] },
  { key: "cases", label: "Cases", icon: ListChecks, roles: ["super_admin", "admin", "trust_safety_manager", "moderator"] },
  { key: "sessions", label: "Live sessions", icon: Video, roles: ["super_admin", "admin", "trust_safety_manager", "moderator", "support", "analyst"] },
  { key: "media", label: "Media review", icon: Image, roles: ["super_admin", "admin", "trust_safety_manager", "moderator"] },
  { key: "trust", label: "Trust & safety", icon: ShieldCheck, roles: ["super_admin", "admin", "trust_safety_manager", "moderator"] },
  { key: "wallet", label: "Wallet", icon: Wallet, roles: ["super_admin", "admin", "support", "finance"] },
  { key: "analytics", label: "Analytics", icon: BarChart3, roles: ["super_admin", "admin", "trust_safety_manager", "finance", "analyst"] },
  { key: "audit", label: "Audit logs", icon: FileText, roles: ["super_admin", "admin", "trust_safety_manager"] },
  { key: "admins", label: "Admins", icon: UserCog, roles: ["super_admin", "admin"] },
  { key: "settings", label: "Settings", icon: Settings, roles: ["super_admin", "admin", "trust_safety_manager"] },
];

const pageSize = 5;

export function AdminDashboard() {
  const [activeView, setActiveView] = useState<ViewKey>("overview");
  const [data, setData] = useState<AdminDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [role, setRole] = useState<AdminRole>("super_admin");
  const [toast, setToast] = useState("");
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [userFilters, setUserFilters] = useState({ query: "", status: "all", verification: "all", region: "all", minTrust: "0", sort: "createdAt" });
  const [reportFilters, setReportFilters] = useState({ status: "all", severity: "all", category: "all", sort: "priority" });
  const [caseStatus, setCaseStatus] = useState("all");
  const [sessionFilters, setSessionFilters] = useState({ query: "", status: "all", region: "all", interest: "all", reportedOnly: false });
  const [mediaFilters, setMediaFilters] = useState({ status: "all", type: "all" });
  const [walletQuery, setWalletQuery] = useState("");
  const [auditQuery, setAuditQuery] = useState("");
  const [auditAction, setAuditAction] = useState("all");
  const [transactionFilter, setTransactionFilter] = useState("all");
  const [userPage, setUserPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedReportId, setSelectedReportId] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedMediaId, setSelectedMediaId] = useState("");
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [selectedTrustId, setSelectedTrustId] = useState("");

  useEffect(() => {
    const storedRole = window.localStorage.getItem("delta_admin_role") as AdminRole | null;
    if (storedRole && roleLabels[storedRole]) setRole(storedRole);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setLoading(true);
      const nextData = await adminApi.dashboard();
      if (!mounted) return;
      setData(nextData);
      setSelectedUserId((current) => current || nextData.users[0]?.id || "");
      setSelectedReportId((current) => current || nextData.reports[0]?.id || "");
      setSelectedSessionId((current) => current || nextData.sessions[0]?.sessionId || "");
      setSelectedMediaId((current) => current || nextData.media[0]?.id || "");
      setSelectedWalletId((current) => current || nextData.wallets[0]?.userId || "");
      setSelectedTrustId((current) => current || nextData.trustScores[0]?.userId || "");
      setLastUpdated(new Date());
      setLoading(false);
    }

    loadDashboard();
    const interval = window.setInterval(loadDashboard, 30000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    window.localStorage.setItem("delta_admin_role", role);
  }, [role]);

  const visibleNav = navItems.filter((item) => canAccess(item.roles, role));

  function mutateData(updater: (current: AdminDataset) => AdminDataset) {
    setData((current) => (current ? updater(current) : current));
  }

  function writeAudit(action: string, target: string, resourceType: string, reason: string) {
    const log: AuditLog = {
      id: `audit_${Date.now()}`,
      actor: roleLabels[role],
      target,
      action,
      resourceType,
      reason,
      ip: "local-session",
      device: "Delta admin",
      createdAt: new Date().toISOString(),
    };
    mutateData((current) => ({ ...current, auditLogs: [log, ...current.auditLogs] }));
    setToast(`${humanize(action)} recorded`);
  }

  async function handleUserAction(userId: string, action: string) {
    if (!canTakeUserAction(role)) {
      setToast("This role can review users but cannot change accounts");
      return;
    }

    const user = data?.users.find((item) => item.id === userId);
    if (!user) return;
    const reason = window.prompt(`Reason for ${humanize(action)}`);
    if (!reason) return;
    if (["ban", "delete", "suspend"].includes(action) && !window.confirm(`Confirm ${humanize(action)} for ${user.name}`)) return;

    const statusPatch: Partial<AdminUser> = {};
    const restrictionPatch: Partial<AdminUser["restrictions"]> = {};
    let trustDelta = 0;

    if (action === "suspend") statusPatch.status = "suspended";
    if (action === "ban") statusPatch.status = "banned";
    if (action === "lift_suspension") statusPatch.status = "active";
    if (action === "shadow_restrict") restrictionPatch.shadowRestricted = true;
    if (action === "disable_live") restrictionPatch.canLiveMatch = false;
    if (action === "disable_messages") restrictionPatch.canMessage = false;
    if (action === "require_verification") restrictionPatch.requiresVerification = true;
    if (action === "adjust_trust") trustDelta = Number(window.prompt("Trust score adjustment", "-5") || "0");

    mutateData((current) => ({
      ...current,
      users: current.users.map((item) =>
        item.id === userId
          ? {
              ...item,
              ...statusPatch,
              trustScore: clamp(item.trustScore + trustDelta, 0, 100),
              restrictions: { ...item.restrictions, ...restrictionPatch },
              notes: [{ id: `note_${Date.now()}`, author: roleLabels[role], body: reason, createdAt: new Date().toISOString() }, ...item.notes],
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
      trustScores: current.trustScores.map((item) =>
        item.userId === userId
          ? {
              ...item,
              score: clamp(item.score + trustDelta, 0, 100),
              restrictions: { ...item.restrictions, ...restrictionPatch },
              history: [{ label: humanize(action), delta: trustDelta, createdAt: new Date().toISOString() }, ...item.history],
            }
          : item,
      ),
    }));

    if (statusPatch.status) {
      adminApi.updateUser(userId, { status: statusPatch.status, reason }).catch(() => undefined);
    }
    writeAudit(`admin.user.${action}`, user.name, "user", reason);
  }

  function addUserNote(userId: string) {
    const user = data?.users.find((item) => item.id === userId);
    const body = window.prompt("Internal note");
    if (!user || !body) return;
    mutateData((current) => ({
      ...current,
      users: current.users.map((item) =>
        item.id === userId
          ? { ...item, notes: [{ id: `note_${Date.now()}`, author: roleLabels[role], body, createdAt: new Date().toISOString() }, ...item.notes] }
          : item,
      ),
    }));
    writeAudit("admin.user.note", user.name, "user", body);
  }

  function handleReportAction(reportId: string, action: string) {
    if (!canModerate(role)) {
      setToast("This role can view reports only");
      return;
    }

    const report = data?.reports.find((item) => item.id === reportId);
    if (!report) return;
    const reason = window.prompt(`Reason for ${humanize(action)}`);
    if (!reason) return;
    const assignee = action === "assign" ? window.prompt("Assign to", roleLabels[role]) || roleLabels[role] : report.assignedTo;

    mutateData((current) => ({
      ...current,
      reports: current.reports.map((item) =>
        item.id === reportId
          ? {
              ...item,
              assignedTo: assignee,
              status: action === "dismiss" ? "dismissed" : action === "resolve" ? "resolved" : "in_review",
              severity: action === "escalate" ? "critical" : item.severity,
              notes: [{ id: `rn_${Date.now()}`, author: roleLabels[role], body: reason, createdAt: new Date().toISOString() }, ...item.notes],
              timeline: [{ label: humanize(action), actor: roleLabels[role], createdAt: new Date().toISOString() }, ...item.timeline],
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
      cases: current.cases.map((item) =>
        item.reportId === reportId
          ? {
              ...item,
              assignedTo: assignee,
              status: action === "resolve" ? "resolved" : action === "escalate" ? "under_review" : item.status === "new" ? "assigned" : item.status,
              severity: action === "escalate" ? "critical" : item.severity,
              history: [{ label: humanize(action), actor: roleLabels[role], createdAt: new Date().toISOString() }, ...item.history],
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    }));
    writeAudit(`moderation.report.${action}`, report.reportedName, "report", reason);
  }

  function handleBulkReports(action: "assign" | "dismiss") {
    if (!selectedReportIds.length) return;
    const reason = window.prompt(`Reason for bulk ${action}`);
    if (!reason) return;
    mutateData((current) => ({
      ...current,
      reports: current.reports.map((report) =>
        selectedReportIds.includes(report.id)
          ? {
              ...report,
              assignedTo: action === "assign" ? roleLabels[role] : report.assignedTo,
              status: action === "dismiss" ? "dismissed" : "in_review",
              updatedAt: new Date().toISOString(),
            }
          : report,
      ),
    }));
    writeAudit(`moderation.report.bulk_${action}`, `${selectedReportIds.length} reports`, "report", reason);
    setSelectedReportIds([]);
  }

  function handleCaseAction(caseId: string, action: string) {
    const item = data?.cases.find((entry) => entry.id === caseId);
    if (!item) return;
    const reason = window.prompt(`Reason for ${humanize(action)}`);
    if (!reason) return;
    mutateData((current) => ({
      ...current,
      cases: current.cases.map((entry) =>
        entry.id === caseId
          ? {
              ...entry,
              status: action === "resolve" ? "resolved" : action === "appeal" ? "appeal" : "under_review",
              appealStatus: action === "appeal" ? "requested" : entry.appealStatus,
              assignedTo: action === "assign" ? roleLabels[role] : entry.assignedTo,
              history: [{ label: humanize(action), actor: roleLabels[role], createdAt: new Date().toISOString() }, ...entry.history],
              notes: [{ id: `cn_${Date.now()}`, author: roleLabels[role], body: reason, createdAt: new Date().toISOString() }, ...entry.notes],
              updatedAt: new Date().toISOString(),
            }
          : entry,
      ),
    }));
    writeAudit(`moderation.case.${action}`, item.id, "moderation_case", reason);
  }

  function handleSessionAction(sessionId: string, action: string) {
    const session = data?.sessions.find((item) => item.sessionId === sessionId);
    if (!session) return;
    const reason = window.prompt(`Reason for ${humanize(action)}`);
    if (!reason) return;
    mutateData((current) => ({
      ...current,
      sessions: current.sessions.map((item) =>
        item.sessionId === sessionId
          ? {
              ...item,
              billingStatus: action === "refund" ? "refunded" : item.billingStatus,
              reported: action === "flag" ? true : item.reported,
              notes: [{ id: `sn_${Date.now()}`, author: roleLabels[role], body: reason, createdAt: new Date().toISOString() }, ...item.notes],
              events: [{ type: humanize(action), actor: roleLabels[role], detail: reason, createdAt: new Date().toISOString() }, ...item.events],
            }
          : item,
      ),
    }));
    writeAudit(`live_session.${action}`, sessionId, "live_session", reason);
  }

  function handleMediaAction(mediaId: string, action: MediaReviewItem["status"] | "request_reupload") {
    const item = data?.media.find((entry) => entry.id === mediaId);
    if (!item) return;
    const reason = action === "approved" ? "Approved after review" : window.prompt(`Reason for ${humanize(action)}`);
    if (!reason) return;
    mutateData((current) => ({
      ...current,
      media: current.media.map((entry) =>
        entry.id === mediaId
          ? {
              ...entry,
              status: action === "request_reupload" ? "rejected" : action,
              notes: [{ id: `mn_${Date.now()}`, author: roleLabels[role], body: reason, createdAt: new Date().toISOString() }, ...entry.notes],
            }
          : entry,
      ),
    }));
    writeAudit(`media.${action}`, item.userName, "media", reason);
  }

  function handleBulkMedia(action: "approved" | "rejected") {
    if (!selectedMediaIds.length) return;
    const reason = action === "approved" ? "Bulk approval" : window.prompt("Bulk rejection reason");
    if (!reason) return;
    mutateData((current) => ({
      ...current,
      media: current.media.map((item) =>
        selectedMediaIds.includes(item.id)
          ? {
              ...item,
              status: action,
              notes: [{ id: `mn_${Date.now()}`, author: roleLabels[role], body: reason, createdAt: new Date().toISOString() }, ...item.notes],
            }
          : item,
      ),
    }));
    writeAudit(`media.bulk_${action}`, `${selectedMediaIds.length} items`, "media", reason);
    setSelectedMediaIds([]);
  }

  function handleWalletAction(userId: string, action: string) {
    if (!canUseWallet(role)) {
      setToast("This role cannot change wallet records");
      return;
    }

    const wallet = data?.wallets.find((item) => item.userId === userId);
    if (!wallet) return;
    const reason = window.prompt(`Reason for ${humanize(action)}`);
    if (!reason) return;
    const amount = Number(window.prompt("delt amount", action === "refund" ? "48" : "10") || "0");
    mutateData((current) => ({
      ...current,
      wallets: current.wallets.map((item) =>
        item.userId === userId
          ? {
              ...item,
              balance: action === "refund" || action === "adjust" ? item.balance + amount : item.balance,
              paidBalance: action === "refund" ? item.paidBalance + amount : item.paidBalance,
              transactions: [
                {
                  id: `txn_${Date.now()}`,
                  userId,
                  type: action === "refund" ? "refund" : "admin_adjustment",
                  amount,
                  status: "pending",
                  feature: "Admin review",
                  createdAt: new Date().toISOString(),
                },
                ...item.transactions,
              ],
            }
          : item,
      ),
    }));
    writeAudit(`wallet.${action}`, wallet.userName, "wallet", reason);
  }

  function handleAdminAction(adminId: string, action: string) {
    const account = data?.adminAccounts.find((item) => item.id === adminId);
    if (!account) return;
    const reason = window.prompt(`Reason for ${humanize(action)}`);
    if (!reason) return;
    mutateData((current) => ({
      ...current,
      adminAccounts: current.adminAccounts.map((item) =>
        item.id === adminId
          ? {
              ...item,
              status: action === "revoke" ? "revoked" : item.status,
              mfaEnabled: action === "enforce_mfa" ? true : item.mfaEnabled,
              role: action === "assign_role" ? ((window.prompt("Role", item.role) || item.role) as AdminRole) : item.role,
            }
          : item,
      ),
    }));
    writeAudit(`admin.account.${action}`, account.email, "admin", reason);
  }

  function createAdminAccount() {
    const email = window.prompt("Admin email");
    if (!email) return;
    const name = window.prompt("Admin name", email.split("@")[0]) || email;
    mutateData((current) => ({
      ...current,
      adminAccounts: [
        {
          id: `admin_${Date.now()}`,
          name,
          email,
          role: "moderator",
          status: "invited",
          mfaEnabled: true,
          lastActiveAt: new Date().toISOString(),
        },
        ...current.adminAccounts,
      ],
    }));
    writeAudit("admin.account.create", email, "admin", "New admin invitation");
  }

  function updateFeatureFlag(key: string, enabled: boolean) {
    mutateData((current) => ({
      ...current,
      settings: {
        ...current.settings,
        featureFlags: current.settings.featureFlags.map((flag) => (flag.key === key ? { ...flag, enabled } : flag)),
      },
    }));
    writeAudit("settings.feature_flag.update", key, "settings", enabled ? "Enabled" : "Disabled");
  }

  function exportAuditLogs(logs: AuditLog[]) {
    const csv = ["createdAt,actor,target,action,resourceType,reason,ip,device"]
      .concat(logs.map((log) => [log.createdAt, log.actor, log.target, log.action, log.resourceType, log.reason, log.ip, log.device].map(csvCell).join(",")))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "delta-audit-logs.csv";
    link.click();
    URL.revokeObjectURL(url);
    writeAudit("audit.export", "Audit logs", "audit", "CSV export");
  }

  function clearSession() {
    window.localStorage.removeItem("delta_admin_token");
    window.localStorage.removeItem("delta_admin_role");
    document.cookie = "delta_admin_session=; path=/; max-age=0; SameSite=Lax";
    window.location.href = "/login";
  }

  if (!data) {
    return (
      <main className="admin-shell loading-shell">
        <section className="loading-panel">
          <div className="brand-mark" aria-hidden="true"><span>Δ</span></div>
          <h1>Delta admin</h1>
          <p>{loading ? "Syncing admin data" : "Preparing console"}</p>
        </section>
      </main>
    );
  }

  const resolvedActiveView = visibleNav.some((item) => item.key === activeView) ? activeView : "overview";

  const selectedUser = data.users.find((user) => user.id === selectedUserId) || data.users[0]!;
  const selectedReport = data.reports.find((report) => report.id === selectedReportId) || data.reports[0]!;
  const selectedCase = data.cases.find((entry) => entry.reportId === selectedReport.id) || data.cases[0]!;
  const selectedSession = data.sessions.find((session) => session.sessionId === selectedSessionId) || data.sessions[0]!;
  const selectedMedia = data.media.find((item) => item.id === selectedMediaId) || data.media[0]!;
  const selectedWallet = data.wallets.find((wallet) => wallet.userId === selectedWalletId) || data.wallets[0]!;
  const selectedTrustScore = data.trustScores.find((score) => score.userId === selectedTrustId) || data.trustScores[0]!;

  const userRegions = unique(data.users.map((user) => user.region));
  const reportCategories = unique(data.reports.map((report) => report.category));
  const sessionRegions = unique(data.sessions.map((session) => session.region));
  const sessionInterests = unique(data.sessions.map((session) => session.interest));

  const filteredUsers = filterUsers(data.users, userFilters);
  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const pagedUsers = filteredUsers.slice((userPage - 1) * pageSize, userPage * pageSize);
  const filteredReports = filterReports(data.reports, reportFilters);
  const filteredCases = data.cases.filter((item) => caseStatus === "all" || item.status === caseStatus);
  const filteredSessions = filterSessions(data.sessions, sessionFilters);
  const filteredMedia = data.media.filter((item) => {
    const statusMatch = mediaFilters.status === "all" || item.status === mediaFilters.status;
    const typeMatch = mediaFilters.type === "all" || item.mediaType === mediaFilters.type;
    return statusMatch && typeMatch;
  });
  const filteredWallets = data.wallets.filter((wallet) => `${wallet.userName} ${wallet.userId}`.toLowerCase().includes(walletQuery.toLowerCase()));
  const filteredAudit = data.auditLogs.filter((log) => {
    const needle = `${log.actor} ${log.target} ${log.action} ${log.reason}`.toLowerCase();
    const queryMatch = !auditQuery || needle.includes(auditQuery.toLowerCase());
    const actionMatch = auditAction === "all" || log.action.includes(auditAction);
    return queryMatch && actionMatch;
  });

  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-mark" aria-hidden="true"><span>Δ</span></div>
          <div>
            <strong>Delta</strong>
            <small>Admin console</small>
          </div>
        </div>

        <nav className="nav-list" aria-label="Dashboard sections">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                className={resolvedActiveView === item.key ? "nav-item active" : "nav-item"}
                onClick={() => setActiveView(item.key)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-card">
          <div className="live-dot" />
          <div>
            <strong>{data.analytics.liveMatchFunnel.activeSessions} active calls</strong>
            <small>{data.monitoring.workers.filter((worker) => worker.status !== "healthy").length} worker alerts</small>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Moderation and analytics</p>
            <h1>{titleFor(resolvedActiveView)}</h1>
            <div className="breadcrumb"><span>Admin</span><span>{titleFor(resolvedActiveView)}</span></div>
          </div>
          <div className="topbar-actions">
            <label className="role-switcher">
              <span>Role</span>
              <select value={role} onChange={(event) => setRole(event.target.value as AdminRole)}>
                {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <button className="icon-button" type="button" aria-label="Notifications" title="Notifications">
              <Bell size={18} />
            </button>
            <button className="icon-button" type="button" aria-label="Log out" title="Log out" onClick={clearSession}>
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <section className="status-strip">
          <span>{loading ? "Syncing admin data" : "Admin data ready"}</span>
          <span>{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Waiting for first sync"}</span>
          <span>{roleLabels[role]}</span>
          <span>API: {process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}</span>
        </section>

        {toast && <div className="toast" role="status">{toast}</div>}

        {resolvedActiveView === "overview" && (
          <Overview data={data} />
        )}
        {resolvedActiveView === "users" && (
          <UsersView
            users={pagedUsers}
            allUsers={filteredUsers}
            selectedUser={selectedUser}
            filters={userFilters}
            regions={userRegions}
            page={userPage}
            totalPages={totalUserPages}
            role={role}
            onFilterChange={(key, value) => {
              setUserFilters((current) => ({ ...current, [key]: value }));
              setUserPage(1);
            }}
            onPageChange={setUserPage}
            onSelect={setSelectedUserId}
            onAction={handleUserAction}
            onNote={addUserNote}
          />
        )}
        {resolvedActiveView === "reports" && (
          <ReportsView
            reports={filteredReports}
            selectedReport={selectedReport}
            selectedIds={selectedReportIds}
            filters={reportFilters}
            categories={reportCategories}
            role={role}
            onFilterChange={(key, value) => setReportFilters((current) => ({ ...current, [key]: value }))}
            onSelect={setSelectedReportId}
            onToggle={(id) => setSelectedReportIds((current) => toggleValue(current, id))}
            onBulk={handleBulkReports}
            onAction={handleReportAction}
          />
        )}
        {resolvedActiveView === "cases" && (
          <CasesView
            cases={filteredCases}
            selectedCase={selectedCase}
            status={caseStatus}
            onStatusChange={setCaseStatus}
            onAction={handleCaseAction}
          />
        )}
        {resolvedActiveView === "sessions" && (
          <SessionsView
            sessions={filteredSessions}
            selectedSession={selectedSession}
            filters={sessionFilters}
            regions={sessionRegions}
            interests={sessionInterests}
            onFilterChange={(key, value) => setSessionFilters((current) => ({ ...current, [key]: value } as typeof current))}
            onSelect={setSelectedSessionId}
            onAction={handleSessionAction}
          />
        )}
        {resolvedActiveView === "media" && (
          <MediaView
            media={filteredMedia}
            selectedMedia={selectedMedia}
            filters={mediaFilters}
            selectedIds={selectedMediaIds}
            onFilterChange={(key, value) => setMediaFilters((current) => ({ ...current, [key]: value }))}
            onSelect={setSelectedMediaId}
            onToggle={(id) => setSelectedMediaIds((current) => toggleValue(current, id))}
            onBulk={handleBulkMedia}
            onAction={handleMediaAction}
          />
        )}
        {resolvedActiveView === "trust" && (
          <TrustView
            data={data}
            selectedScore={selectedTrustScore}
            selectedUser={data.users.find((user) => user.id === selectedTrustScore?.userId) || selectedUser}
            onSelect={setSelectedTrustId}
            onUserAction={handleUserAction}
          />
        )}
        {resolvedActiveView === "wallet" && (
          <WalletView
            analytics={data.analytics}
            wallets={filteredWallets}
            selectedWallet={selectedWallet}
            query={walletQuery}
            transactionFilter={transactionFilter}
            role={role}
            onQueryChange={setWalletQuery}
            onTransactionFilterChange={setTransactionFilter}
            onSelect={setSelectedWalletId}
            onAction={handleWalletAction}
          />
        )}
        {resolvedActiveView === "analytics" && (
          <AnalyticsView data={data} />
        )}
        {resolvedActiveView === "audit" && (
          <AuditView
            logs={filteredAudit}
            query={auditQuery}
            action={auditAction}
            onQueryChange={setAuditQuery}
            onActionChange={setAuditAction}
            onExport={() => exportAuditLogs(filteredAudit)}
          />
        )}
        {resolvedActiveView === "admins" && (
          <AdminsView accounts={data.adminAccounts} onAction={handleAdminAction} onCreate={createAdminAccount} />
        )}
        {resolvedActiveView === "settings" && (
          <SettingsView data={data} onFeatureFlagChange={updateFeatureFlag} />
        )}
      </section>
    </main>
  );
}

function Overview({ data }: { data: AdminDataset }) {
  const { analytics } = data;
  return (
    <div className="view-stack">
      <section className="metric-grid overview-grid">
        <Metric icon={Activity} label="DAU" value={formatNumber(analytics.growth.dau)} detail={`${formatNumber(analytics.growth.mau)} MAU`} tone="accent" />
        <Metric icon={Users} label="New signups" value={formatNumber(analytics.growth.signupsToday)} detail={`${formatNumber(analytics.growth.signupsWeek)} this week`} tone="success" />
        <Metric icon={Heart} label="Active matches" value={formatNumber(analytics.datingFunnel.matches)} detail={`${percent(analytics.datingFunnel.matchRate)} match rate`} tone="accent" />
        <Metric icon={Video} label="Live sessions" value={formatNumber(analytics.liveMatchFunnel.activeSessions)} detail={`${formatNumber(analytics.liveMatchFunnel.sessions)} total`} tone="live" />
        <Metric icon={Flag} label="Open reports" value={formatNumber(analytics.safety.openReports)} detail={`${analytics.safety.safetyAlerts} safety alerts`} tone="danger" />
        <Metric icon={Coins} label="Revenue today" value={currency(analytics.revenue.today)} detail={`${formatNumber(analytics.revenue.purchasedTokens)} delt`} tone="delt" />
      </section>

      <section className="content-grid">
        <div className="panel chart-panel">
          <PanelHeader title="Operating trend" subtitle="Growth, reports, live volume, and revenue" icon={BarChart3} />
          <ChartBox>
            <BarChart data={data.trends}>
              <CartesianGrid stroke="rgba(160,160,184,0.12)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#A0A0B8", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#A0A0B8", fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="sessions" fill="#00D4AA" radius={[6, 6, 0, 0]} />
              <Bar dataKey="users" fill="#EC4899" radius={[6, 6, 0, 0]} />
              <Bar dataKey="reports" fill="#F97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartBox>
        </div>

        <div className="panel">
          <PanelHeader title="Real-time monitoring" subtitle="Pools, workers, queues, and alerts" icon={Radio} />
          <div className="stack-list">
            {data.monitoring.alerts.map((alert) => (
              <StatusRow key={alert.id} label={alert.label} value={alert.detail} tone={alert.severity} />
            ))}
            {data.monitoring.workers.map((worker) => (
              <StatusRow key={worker.name} label={worker.name} value={`${worker.lagSeconds}s lag, ${worker.queueDepth} queued`} tone={worker.status === "healthy" ? "success" : worker.status === "degraded" ? "warning" : "danger"} />
            ))}
          </div>
        </div>
      </section>

      <section className="three-column-grid">
        <BreakdownPanel title="Geographic distribution" icon={MapPin} items={analytics.growth.regions} />
        <BreakdownPanel title="Top interests" icon={Compass} items={analytics.topInterests} />
        <BreakdownPanel title="Pool depths" icon={Gauge} items={data.monitoring.poolDepths} />
      </section>
    </div>
  );
}

function UsersView({
  users,
  allUsers,
  selectedUser,
  filters,
  regions,
  page,
  totalPages,
  role,
  onFilterChange,
  onPageChange,
  onSelect,
  onAction,
  onNote,
}: {
  users: AdminUser[];
  allUsers: AdminUser[];
  selectedUser: AdminUser;
  filters: Record<string, string>;
  regions: string[];
  page: number;
  totalPages: number;
  role: AdminRole;
  onFilterChange: (key: string, value: string) => void;
  onPageChange: (page: number) => void;
  onSelect: (id: string) => void;
  onAction: (id: string, action: string) => void;
  onNote: (id: string) => void;
}) {
  return (
    <div className="view-stack">
      <FilterBar>
        <SearchField value={filters.query} onChange={(value) => onFilterChange("query", value)} placeholder="Search ID, email, phone, or name" />
        <Select value={filters.status} onChange={(value) => onFilterChange("status", value)} options={["all", "active", "suspended", "banned", "deleted"]} />
        <Select value={filters.verification} onChange={(value) => onFilterChange("verification", value)} options={["all", "none", "pending", "verified", "rejected"]} />
        <Select value={filters.region} onChange={(value) => onFilterChange("region", value)} options={["all", ...regions]} />
        <Select value={filters.minTrust} onChange={(value) => onFilterChange("minTrust", value)} options={["0", "40", "55", "75", "90"]} label="Trust" />
        <Select value={filters.sort} onChange={(value) => onFilterChange("sort", value)} options={["createdAt", "trustScore", "lastLoginAt"]} label="Sort" />
      </FilterBar>

      <section className="split-grid">
        <div className="panel table-panel">
          <PanelHeader title="User search" subtitle={`${allUsers.length} matching users`} icon={Users} />
          <DataTable
            headers={["User", "Status", "Verification", "Trust", "Region", "Last login"]}
            rows={users.map((user) => [
              <button key="user" className="link-cell" type="button" onClick={() => onSelect(user.id)}><UserCell user={user} /></button>,
              <Badge key="status" label={user.status} tone={user.status === "active" ? "success" : "danger"} />,
              <Badge key="verification" label={user.verificationStatus} tone={user.verificationStatus === "verified" ? "success" : user.verificationStatus === "pending" ? "warning" : "neutral"} />,
              <TrustMeter key="trust" value={user.trustScore} />,
              <span key="region">{user.region}</span>,
              <span key="login">{formatDate(user.lastLoginAt)}</span>,
            ])}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </div>

        <div className="panel detail-panel">
          <PanelHeader title="User detail" subtitle={selectedUser.email} icon={UserCog} />
          <div className="detail-hero">
            <div className="avatar large">{initials(selectedUser.name)}</div>
            <div>
              <h2>{selectedUser.name}, {selectedUser.age}</h2>
              <p>{selectedUser.location}</p>
              <div className="badge-row">
                <Badge label={selectedUser.status} tone={selectedUser.status === "active" ? "success" : "danger"} />
                <Badge label={selectedUser.riskLevel} tone={riskTone(selectedUser.riskLevel)} />
                <Badge label={selectedUser.subscription} tone="delt" />
              </div>
            </div>
          </div>
          <SectionTitle title="Profile" />
          <p className="body-copy">{selectedUser.profile.bio}</p>
          <div className="chip-row">{selectedUser.profile.interests.map((interest) => <span className="chip" key={interest}>{interest}</span>)}</div>

          <SectionTitle title="Restrictions" />
          <div className="mini-grid">
            <BooleanTile label="Live" enabled={selectedUser.restrictions.canLiveMatch} />
            <BooleanTile label="Messaging" enabled={selectedUser.restrictions.canMessage} />
            <BooleanTile label="Likes" enabled={selectedUser.restrictions.canLike} />
            <BooleanTile label="Verification" enabled={!selectedUser.restrictions.requiresVerification} />
          </div>

          <SectionTitle title="Wallet and activity" />
          <div className="mini-grid">
            <InfoTile label="Balance" value={`${formatNumber(selectedUser.wallet.balance)} delt`} />
            <InfoTile label="Reports against" value={String(selectedUser.reportsAgainst.length)} />
            <InfoTile label="Live sessions" value={String(selectedUser.liveSessions.length)} />
            <InfoTile label="Devices" value={String(selectedUser.devices.length)} />
          </div>

          <SectionTitle title="History" />
          <div className="timeline">
            {selectedUser.devices.map((device) => <TimelineItem key={device.id} label={`${device.platform} login`} detail={`${device.location} - ${formatDate(device.lastSeenAt)}`} />)}
            {selectedUser.notes.map((note) => <TimelineItem key={note.id} label={note.author} detail={`${note.body} - ${formatDate(note.createdAt)}`} />)}
          </div>

          <div className="action-grid">
            <ActionButton disabled={!canTakeUserAction(role)} icon={Clock3} label="Suspend" onClick={() => onAction(selectedUser.id, "suspend")} />
            <ActionButton disabled={!canTakeUserAction(role)} icon={Ban} label="Ban" onClick={() => onAction(selectedUser.id, "ban")} tone="danger" />
            <ActionButton disabled={!canTakeUserAction(role)} icon={CheckCircle2} label="Lift" onClick={() => onAction(selectedUser.id, "lift_suspension")} />
            <ActionButton disabled={!canTakeUserAction(role)} icon={ShieldAlert} label="Shadow restrict" onClick={() => onAction(selectedUser.id, "shadow_restrict")} />
            <ActionButton disabled={!canTakeUserAction(role)} icon={Video} label="Disable live" onClick={() => onAction(selectedUser.id, "disable_live")} />
            <ActionButton disabled={!canTakeUserAction(role)} icon={MessageCircle} label="Disable messages" onClick={() => onAction(selectedUser.id, "disable_messages")} />
            <ActionButton disabled={!canTakeUserAction(role)} icon={ShieldCheck} label="Require verification" onClick={() => onAction(selectedUser.id, "require_verification")} />
            <ActionButton disabled={!canTakeUserAction(role)} icon={Gauge} label="Adjust trust" onClick={() => onAction(selectedUser.id, "adjust_trust")} />
            <ActionButton icon={FileText} label="Add note" onClick={() => onNote(selectedUser.id)} />
          </div>
        </div>
      </section>
    </div>
  );
}

function ReportsView({
  reports,
  selectedReport,
  selectedIds,
  filters,
  categories,
  role,
  onFilterChange,
  onSelect,
  onToggle,
  onBulk,
  onAction,
}: {
  reports: AdminReport[];
  selectedReport: AdminReport;
  selectedIds: string[];
  filters: Record<string, string>;
  categories: string[];
  role: AdminRole;
  onFilterChange: (key: string, value: string) => void;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onBulk: (action: "assign" | "dismiss") => void;
  onAction: (id: string, action: string) => void;
}) {
  return (
    <div className="view-stack">
      <section className="metric-grid compact">
        <Metric icon={Flag} label="Open reports" value={String(reports.filter((report) => report.status === "open").length)} detail="Awaiting triage" tone="danger" />
        <Metric icon={AlertTriangle} label="Critical" value={String(reports.filter((report) => report.severity === "critical").length)} detail="Human review" tone="warning" />
        <Metric icon={Clock3} label="Near SLA" value={String(reports.filter((report) => new Date(report.slaDueAt).getTime() < Date.now() + 3600000).length)} detail="Next 60 minutes" tone="live" />
      </section>

      <FilterBar>
        <Select value={filters.status} onChange={(value) => onFilterChange("status", value)} options={["all", "open", "in_review", "resolved", "dismissed"]} />
        <Select value={filters.severity} onChange={(value) => onFilterChange("severity", value)} options={["all", "low", "medium", "high", "critical"]} />
        <Select value={filters.category} onChange={(value) => onFilterChange("category", value)} options={["all", ...categories]} />
        <Select value={filters.sort} onChange={(value) => onFilterChange("sort", value)} options={["priority", "createdAt", "status", "severity"]} label="Sort" />
        <button className="secondary-action" type="button" disabled={!selectedIds.length || !canModerate(role)} onClick={() => onBulk("assign")}><UserCog size={18} />Assign</button>
        <button className="secondary-action" type="button" disabled={!selectedIds.length || !canModerate(role)} onClick={() => onBulk("dismiss")}><XCircle size={18} />Dismiss</button>
      </FilterBar>

      <section className="split-grid">
        <div className="panel table-panel">
          <PanelHeader title="Report queue" subtitle={`${reports.length} visible cases`} icon={Flag} />
          <DataTable
            headers={["", "Category", "Priority", "Severity", "Status", "Assigned", "SLA"]}
            rows={reports.map((report) => [
              <input key="check" type="checkbox" checked={selectedIds.includes(report.id)} onChange={() => onToggle(report.id)} />,
              <button key="category" className="link-cell" type="button" onClick={() => onSelect(report.id)}><strong>{humanize(report.category)}</strong><small>{report.reportedName}</small></button>,
              <strong key="priority">{report.priority}</strong>,
              <Badge key="severity" label={report.severity} tone={severityTone(report.severity)} />,
              <Badge key="status" label={humanize(report.status)} tone={report.status === "open" ? "warning" : report.status === "resolved" ? "success" : "live"} />,
              <span key="assigned">{report.assignedTo}</span>,
              <span key="sla">{formatDate(report.slaDueAt)}</span>,
            ])}
          />
        </div>
        <ReportDetail report={selectedReport} role={role} onAction={onAction} />
      </section>
    </div>
  );
}

function ReportDetail({ report, role, onAction }: { report: AdminReport; role: AdminRole; onAction: (id: string, action: string) => void }) {
  return (
    <div className="panel detail-panel">
      <PanelHeader title="Report detail" subtitle={report.id} icon={ShieldAlert} />
      <div className="badge-row">
        <Badge label={report.severity} tone={severityTone(report.severity)} />
        <Badge label={humanize(report.status)} tone={report.status === "resolved" ? "success" : "warning"} />
        <Badge label={`Priority ${report.priority}`} tone="accent" />
      </div>
      <SectionTitle title="People" />
      <InfoList rows={[["Reporter", report.reporterName], ["Reported user", report.reportedName], ["Assigned", report.assignedTo], ["SLA", formatDate(report.slaDueAt)]]} />
      <SectionTitle title="Description" />
      <p className="body-copy">{report.description}</p>
      <SectionTitle title="Evidence" />
      <div className="chip-row">{report.evidenceMediaIds.length ? report.evidenceMediaIds.map((id) => <span className="chip" key={id}>{id}</span>) : <span className="muted">No evidence media</span>}</div>
      <SectionTitle title="Context" />
      <div className="timeline">
        {report.context.messages.map((message, index) => <TimelineItem key={`${message.createdAt}-${index}`} label={message.author} detail={`${message.body} - ${formatDate(message.createdAt)}`} />)}
        {report.timeline.map((entry, index) => <TimelineItem key={`${entry.createdAt}-${index}`} label={entry.label} detail={`${entry.actor} - ${formatDate(entry.createdAt)}`} />)}
      </div>
      <SectionTitle title="Internal notes" />
      <div className="timeline">
        {report.notes.map((note) => <TimelineItem key={note.id} label={note.author} detail={`${note.body} - ${formatDate(note.createdAt)}`} />)}
      </div>
      <div className="action-grid">
        <ActionButton disabled={!canModerate(role)} icon={UserCog} label="Assign" onClick={() => onAction(report.id, "assign")} />
        <ActionButton disabled={!canModerate(role)} icon={AlertTriangle} label="Escalate" onClick={() => onAction(report.id, "escalate")} />
        <ActionButton disabled={!canModerate(role)} icon={MessageCircle} label="Request info" onClick={() => onAction(report.id, "request_info")} />
        <ActionButton disabled={!canModerate(role)} icon={Clock3} label="Warn" onClick={() => onAction(report.id, "warn_user")} />
        <ActionButton disabled={!canModerate(role)} icon={Ban} label="Suspend" onClick={() => onAction(report.id, "suspend_user")} tone="danger" />
        <ActionButton disabled={!canModerate(role)} icon={CheckCircle2} label="Resolve" onClick={() => onAction(report.id, "resolve")} />
        <ActionButton disabled={!canModerate(role)} icon={XCircle} label="Dismiss" onClick={() => onAction(report.id, "dismiss")} />
      </div>
    </div>
  );
}

function CasesView({
  cases,
  selectedCase,
  status,
  onStatusChange,
  onAction,
}: {
  cases: ModerationCase[];
  selectedCase: ModerationCase;
  status: string;
  onStatusChange: (status: string) => void;
  onAction: (id: string, action: string) => void;
}) {
  return (
    <div className="view-stack">
      <FilterBar>
        <Select value={status} onChange={onStatusChange} options={["all", "new", "assigned", "under_review", "resolved", "appeal"]} />
      </FilterBar>
      <section className="split-grid">
        <div className="panel table-panel">
          <PanelHeader title="Moderation cases" subtitle="Workflow, assignment, SLA, and appeals" icon={ListChecks} />
          <DataTable
            headers={["Case", "Workflow", "Severity", "Assigned", "SLA", "Appeal"]}
            rows={cases.map((item) => [
              <strong key="case">{item.id}</strong>,
              <Badge key="status" label={humanize(item.status)} tone={item.status === "resolved" ? "success" : item.status === "appeal" ? "warning" : "live"} />,
              <Badge key="severity" label={item.severity} tone={severityTone(item.severity)} />,
              <span key="assigned">{item.assignedTo}</span>,
              <span key="sla">{formatDate(item.slaDueAt)}</span>,
              <span key="appeal">{humanize(item.appealStatus)}</span>,
            ])}
          />
        </div>
        <div className="panel detail-panel">
          <PanelHeader title="Case controls" subtitle={selectedCase.id} icon={Shield} />
          <InfoList rows={[["Template", selectedCase.template], ["Report", selectedCase.reportId], ["Target user", selectedCase.targetUserId], ["Appeal", humanize(selectedCase.appealStatus)]]} />
          <SectionTitle title="Workflow timeline" />
          <div className="timeline">
            {selectedCase.history.map((entry, index) => <TimelineItem key={`${entry.createdAt}-${index}`} label={entry.label} detail={`${entry.actor} - ${formatDate(entry.createdAt)}`} />)}
          </div>
          <SectionTitle title="Case templates" />
          <div className="chip-row">
            {["Severe harassment", "Verification mismatch", "Spam or solicitation", "Unsafe live behavior"].map((template) => <span className="chip" key={template}>{template}</span>)}
          </div>
          <div className="action-grid">
            <ActionButton icon={UserCog} label="Assign" onClick={() => onAction(selectedCase.id, "assign")} />
            <ActionButton icon={AlertTriangle} label="Escalate" onClick={() => onAction(selectedCase.id, "escalate")} />
            <ActionButton icon={CheckCircle2} label="Resolve" onClick={() => onAction(selectedCase.id, "resolve")} />
            <ActionButton icon={MessageCircle} label="Appeal" onClick={() => onAction(selectedCase.id, "appeal")} />
          </div>
        </div>
      </section>
    </div>
  );
}

function SessionsView({
  sessions,
  selectedSession,
  filters,
  regions,
  interests,
  onFilterChange,
  onSelect,
  onAction,
}: {
  sessions: LiveSession[];
  selectedSession: LiveSession;
  filters: { query: string; status: string; region: string; interest: string; reportedOnly: boolean };
  regions: string[];
  interests: string[];
  onFilterChange: (key: string, value: string | boolean) => void;
  onSelect: (id: string) => void;
  onAction: (id: string, action: string) => void;
}) {
  return (
    <div className="view-stack">
      <FilterBar>
        <SearchField value={filters.query} onChange={(value) => onFilterChange("query", value)} placeholder="Search session or user ID" />
        <Select value={filters.status} onChange={(value) => onFilterChange("status", value)} options={["all", "active", "completed", "timeout", "cancelled"]} />
        <Select value={filters.region} onChange={(value) => onFilterChange("region", value)} options={["all", ...regions]} />
        <Select value={filters.interest} onChange={(value) => onFilterChange("interest", value)} options={["all", ...interests]} />
        <label className="check-filter"><input type="checkbox" checked={filters.reportedOnly} onChange={(event) => onFilterChange("reportedOnly", event.target.checked)} /> Reported</label>
      </FilterBar>
      <section className="split-grid">
        <div className="panel table-panel">
          <PanelHeader title="Live sessions" subtitle="Active and recent session review" icon={Video} />
          <DataTable
            headers={["Session", "Status", "Region", "Interest", "Billing", "Duration", "Reported"]}
            rows={sessions.map((session) => [
              <button key="session" className="link-cell" type="button" onClick={() => onSelect(session.sessionId)}><strong>{session.sessionId}</strong><small>{session.roomName}</small></button>,
              <Badge key="status" label={session.status} tone={session.status === "active" ? "live" : session.status === "timeout" ? "warning" : "neutral"} />,
              <span key="region">{session.region}</span>,
              <span key="interest">{session.interest}</span>,
              <Badge key="billing" label={session.billingStatus} tone={session.billingStatus === "settled" ? "success" : session.billingStatus === "failed" ? "danger" : "delt"} />,
              <span key="duration">{formatDuration(session.durationSeconds)}</span>,
              <span key="reported">{session.reported ? "Yes" : "No"}</span>,
            ])}
          />
        </div>
        <div className="panel detail-panel">
          <PanelHeader title="Session detail" subtitle={selectedSession.sessionId} icon={Radio} />
          <InfoList rows={[["Room", selectedSession.roomName], ["Participants", selectedSession.participantNames.join(", ")], ["Started", selectedSession.startedAt ? formatDate(selectedSession.startedAt) : "n/a"], ["Ended", selectedSession.endedAt ? formatDate(selectedSession.endedAt) : "n/a"], ["Disconnect", selectedSession.disconnectReason], ["Charge", `${selectedSession.chargeDelt} delt`]]} />
          <SectionTitle title="Connection quality" />
          <div className="mini-grid">
            {selectedSession.connectionQuality.map((quality) => <InfoTile key={quality.userId} label={quality.userId.slice(-6)} value={`${quality.score}/100`} detail={`${quality.packetLoss * 100}% loss, ${quality.jitterMs}ms jitter`} />)}
          </div>
          <SectionTitle title="Session events" />
          <div className="timeline">
            {selectedSession.events.map((event, index) => <TimelineItem key={`${event.createdAt}-${index}`} label={humanize(event.type)} detail={`${event.detail} - ${formatDate(event.createdAt)}`} />)}
          </div>
          <div className="action-grid">
            <ActionButton icon={Users} label="Profiles" onClick={() => onAction(selectedSession.sessionId, "view_profiles")} />
            <ActionButton icon={Flag} label="Reports" onClick={() => onAction(selectedSession.sessionId, "review_reports")} />
            <ActionButton icon={Coins} label="Refund" onClick={() => onAction(selectedSession.sessionId, "refund")} />
            <ActionButton icon={AlertTriangle} label="Flag" onClick={() => onAction(selectedSession.sessionId, "flag")} />
            <ActionButton icon={FileText} label="Note" onClick={() => onAction(selectedSession.sessionId, "note")} />
          </div>
        </div>
      </section>
    </div>
  );
}

function MediaView({
  media,
  selectedMedia,
  filters,
  selectedIds,
  onFilterChange,
  onSelect,
  onToggle,
  onBulk,
  onAction,
}: {
  media: MediaReviewItem[];
  selectedMedia: MediaReviewItem;
  filters: Record<string, string>;
  selectedIds: string[];
  onFilterChange: (key: string, value: string) => void;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onBulk: (action: "approved" | "rejected") => void;
  onAction: (id: string, action: MediaReviewItem["status"] | "request_reupload") => void;
}) {
  return (
    <div className="view-stack">
      <FilterBar>
        <Select value={filters.status} onChange={(value) => onFilterChange("status", value)} options={["all", "pending", "approved", "rejected", "flagged", "escalated"]} />
        <Select value={filters.type} onChange={(value) => onFilterChange("type", value)} options={["all", "profile_image", "profile_video", "verification_selfie", "verification_video", "chat_media", "report_evidence"]} />
        <button className="secondary-action" type="button" disabled={!selectedIds.length} onClick={() => onBulk("approved")}><Check size={18} />Approve</button>
        <button className="secondary-action" type="button" disabled={!selectedIds.length} onClick={() => onBulk("rejected")}><XCircle size={18} />Reject</button>
      </FilterBar>
      <section className="split-grid">
        <div className="panel table-panel">
          <PanelHeader title="Media queue" subtitle="Profile, verification, chat, and evidence media" icon={Image} />
          <div className="media-grid">
            {media.map((item) => (
              <article className={selectedMedia.id === item.id ? "media-card active" : "media-card"} key={item.id}>
                <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => onToggle(item.id)} aria-label={`Select ${item.id}`} />
                <button type="button" onClick={() => onSelect(item.id)}>
                  <span className="media-thumb" style={{ background: item.thumbnail }} />
                  <strong>{humanize(item.mediaType)}</strong>
                  <small>{item.userName}</small>
                  <Badge label={item.status} tone={item.status === "approved" ? "success" : item.status === "rejected" ? "danger" : item.status === "flagged" ? "warning" : "live"} />
                </button>
              </article>
            ))}
          </div>
        </div>
        <div className="panel detail-panel">
          <PanelHeader title="Review media" subtitle={selectedMedia.id} icon={ShieldCheck} />
          <div className="media-viewer" style={{ background: selectedMedia.thumbnail }}>
            <span>{initials(selectedMedia.userName)}</span>
          </div>
          <InfoList rows={[["User", selectedMedia.userName], ["Type", humanize(selectedMedia.mediaType)], ["Source", selectedMedia.source], ["Submitted", formatDate(selectedMedia.submittedAt)], ["Related media", selectedMedia.relatedMediaIds.join(", ") || "None"]]} />
          <SectionTitle title="Guideline" />
          <p className="body-copy">{selectedMedia.guideline}</p>
          <SectionTitle title="Reviewer notes" />
          <div className="timeline">
            {selectedMedia.notes.map((note) => <TimelineItem key={note.id} label={note.author} detail={`${note.body} - ${formatDate(note.createdAt)}`} />)}
          </div>
          <div className="action-grid">
            <ActionButton icon={CheckCircle2} label="Approve" onClick={() => onAction(selectedMedia.id, "approved")} />
            <ActionButton icon={XCircle} label="Reject" onClick={() => onAction(selectedMedia.id, "rejected")} tone="danger" />
            <ActionButton icon={AlertTriangle} label="Escalate" onClick={() => onAction(selectedMedia.id, "escalated")} />
            <ActionButton icon={Image} label="Re-upload" onClick={() => onAction(selectedMedia.id, "request_reupload")} />
          </div>
        </div>
      </section>
    </div>
  );
}

function TrustView({
  data,
  selectedScore,
  selectedUser,
  onSelect,
  onUserAction,
}: {
  data: AdminDataset;
  selectedScore: TrustScoreRecord;
  selectedUser: AdminUser;
  onSelect: (id: string) => void;
  onUserAction: (id: string, action: string) => void;
}) {
  const distribution = [
    { label: "0-39", users: data.trustScores.filter((score) => score.score < 40).length },
    { label: "40-54", users: data.trustScores.filter((score) => score.score >= 40 && score.score < 55).length },
    { label: "55-74", users: data.trustScores.filter((score) => score.score >= 55 && score.score < 75).length },
    { label: "75-100", users: data.trustScores.filter((score) => score.score >= 75).length },
  ];

  return (
    <div className="view-stack">
      <section className="content-grid">
        <div className="panel chart-panel">
          <PanelHeader title="Trust distribution" subtitle="Current user risk bands" icon={ShieldCheck} />
          <ChartBox>
            <BarChart data={distribution}>
              <CartesianGrid stroke="rgba(160,160,184,0.12)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#A0A0B8", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#A0A0B8", fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="users" fill="#EC4899" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartBox>
        </div>
        <BreakdownPanel title="Safety analytics" icon={AlertTriangle} items={data.analytics.safety.categoryBreakdown} />
      </section>

      <section className="split-grid">
        <div className="panel table-panel">
          <PanelHeader title="Trust score management" subtitle="Risk flags, restrictions, and score events" icon={Gauge} />
          <DataTable
            headers={["User", "Score", "Risk", "Live", "Messages", "Review"]}
            rows={data.trustScores.map((score) => [
              <button key="user" className="link-cell" type="button" onClick={() => onSelect(score.userId)}><strong>{score.userName}</strong><small>{score.userId}</small></button>,
              <TrustMeter key="score" value={score.score} />,
              <Badge key="risk" label={score.riskLevel} tone={riskTone(score.riskLevel)} />,
              <span key="live">{score.restrictions.canLiveMatch ? "Allowed" : "Disabled"}</span>,
              <span key="message">{score.restrictions.canMessage ? "Allowed" : "Disabled"}</span>,
              <span key="review">{score.restrictions.requiresVerification ? "Required" : "Clear"}</span>,
            ])}
          />
        </div>
        <div className="panel detail-panel">
          <PanelHeader title="Score detail" subtitle={selectedScore.userName} icon={ShieldAlert} />
          <TrustMeter value={selectedScore.score} large />
          <SectionTitle title="Factors" />
          <div className="timeline">
            {selectedScore.factors.map((factor) => <TimelineItem key={factor.label} label={`${factor.label} ${factor.impact > 0 ? "+" : ""}${factor.impact}`} detail={factor.detail} />)}
          </div>
          <SectionTitle title="Score history" />
          <div className="timeline">
            {selectedScore.history.map((entry) => <TimelineItem key={`${entry.label}-${entry.createdAt}`} label={`${entry.label} ${entry.delta > 0 ? "+" : ""}${entry.delta}`} detail={formatDate(entry.createdAt)} />)}
          </div>
          <SectionTitle title="Automated triggers" />
          <div className="stack-list">
            {selectedScore.triggers.map((trigger) => <StatusRow key={trigger.label} label={trigger.label} value={`Threshold ${trigger.threshold}`} tone={trigger.enabled ? "success" : "neutral"} />)}
          </div>
          <div className="action-grid">
            <ActionButton icon={Gauge} label="Adjust trust" onClick={() => onUserAction(selectedUser.id, "adjust_trust")} />
            <ActionButton icon={Video} label="Disable live" onClick={() => onUserAction(selectedUser.id, "disable_live")} />
            <ActionButton icon={ShieldCheck} label="Require verification" onClick={() => onUserAction(selectedUser.id, "require_verification")} />
          </div>
        </div>
      </section>
    </div>
  );
}

function WalletView({
  analytics,
  wallets,
  selectedWallet,
  query,
  transactionFilter,
  role,
  onQueryChange,
  onTransactionFilterChange,
  onSelect,
  onAction,
}: {
  analytics: AdminDataset["analytics"];
  wallets: WalletSummary[];
  selectedWallet: WalletSummary;
  query: string;
  transactionFilter: string;
  role: AdminRole;
  onQueryChange: (query: string) => void;
  onTransactionFilterChange: (filter: string) => void;
  onSelect: (id: string) => void;
  onAction: (id: string, action: string) => void;
}) {
  const transactions = selectedWallet.transactions.filter((transaction) => transactionFilter === "all" || transaction.status === transactionFilter || transaction.type === transactionFilter);
  return (
    <div className="view-stack">
      <section className="metric-grid compact">
        <Metric icon={Coins} label="delt issued" value={formatNumber(analytics.revenue.circulationIssued)} detail={`${formatNumber(analytics.revenue.circulationReserved)} reserved`} tone="delt" />
        <Metric icon={CircleDollarSign} label="Revenue month" value={currency(analytics.revenue.month)} detail={`${percent(analytics.revenue.purchaseConversionRate)} conversion`} tone="success" />
        <Metric icon={AlertTriangle} label="Refund rate" value={percent(analytics.revenue.refundRate)} detail={`${percent(analytics.revenue.chargebackRate)} chargebacks`} tone="warning" />
      </section>
      <FilterBar>
        <SearchField value={query} onChange={onQueryChange} placeholder="Search wallet by user" />
        <Select value={transactionFilter} onChange={onTransactionFilterChange} options={["all", "completed", "pending", "failed", "disputed", "refunded", "purchase", "live_video_charge"]} />
      </FilterBar>
      <section className="split-grid">
        <div className="panel table-panel">
          <PanelHeader title="Wallet support" subtitle="Balances, settlements, disputes, and adjustments" icon={Wallet} />
          <DataTable
            headers={["User", "Balance", "Paid", "Reserved", "Failed", "Disputed"]}
            rows={wallets.map((wallet) => [
              <button key="user" className="link-cell" type="button" onClick={() => onSelect(wallet.userId)}><strong>{wallet.userName}</strong><small>{wallet.userId}</small></button>,
              <span key="balance">{formatNumber(wallet.balance)} delt</span>,
              <span key="paid">{formatNumber(wallet.paidBalance)}</span>,
              <span key="reserved">{formatNumber(wallet.reservedBalance)}</span>,
              <Badge key="failed" label={String(wallet.failedSettlements)} tone={wallet.failedSettlements ? "warning" : "success"} />,
              <Badge key="disputed" label={String(wallet.disputedCharges)} tone={wallet.disputedCharges ? "danger" : "success"} />,
            ])}
          />
        </div>
        <div className="panel detail-panel">
          <PanelHeader title="Wallet detail" subtitle={selectedWallet.userName} icon={Coins} />
          <div className="mini-grid">
            <InfoTile label="Balance" value={`${formatNumber(selectedWallet.balance)} delt`} />
            <InfoTile label="Paid" value={formatNumber(selectedWallet.paidBalance)} />
            <InfoTile label="Bonus" value={formatNumber(selectedWallet.bonusBalance)} />
            <InfoTile label="Spent" value={formatNumber(selectedWallet.lifetimeSpent)} />
          </div>
          <SectionTitle title="Transactions" />
          <div className="stack-list">
            {transactions.map((transaction) => (
              <StatusRow key={transaction.id} label={`${humanize(transaction.type)} ${transaction.amount > 0 ? "+" : ""}${transaction.amount}`} value={`${humanize(transaction.status)} - ${formatDate(transaction.createdAt)}`} tone={transaction.status === "completed" ? "success" : transaction.status === "failed" || transaction.status === "disputed" ? "danger" : "warning"} />
            ))}
          </div>
          <div className="action-grid">
            <ActionButton disabled={!canUseWallet(role)} icon={Coins} label="Refund" onClick={() => onAction(selectedWallet.userId, "refund")} />
            <ActionButton disabled={!canUseWallet(role)} icon={CircleDollarSign} label="Adjust" onClick={() => onAction(selectedWallet.userId, "adjust")} />
          </div>
        </div>
      </section>
      <section className="three-column-grid">
        <BreakdownPanel title="Revenue by region" icon={MapPin} items={analytics.revenue.byRegion} />
        <BreakdownPanel title="Token packages" icon={Coins} items={analytics.revenue.byPackage} />
        <BreakdownPanel title="Usage patterns" icon={Zap} items={analytics.revenue.usagePatterns} />
      </section>
    </div>
  );
}

function AnalyticsView({ data }: { data: AdminDataset }) {
  const { analytics } = data;
  return (
    <div className="view-stack">
      <section className="metric-grid overview-grid">
        <Metric icon={Users} label="Profile completion" value={percent(analytics.growth.profileCompletionRate)} detail={`${percent(analytics.growth.verificationRate)} verified`} tone="success" />
        <Metric icon={Calendar} label="D7 retention" value={percent(analytics.growth.retentionD7)} detail={`${percent(analytics.growth.retentionD30)} D30`} tone="accent" />
        <Metric icon={Heart} label="Reply rate" value={percent(analytics.datingFunnel.replyRate)} detail={`${formatNumber(analytics.datingFunnel.chatsStarted)} chats`} tone="live" />
        <Metric icon={Video} label="Avg live wait" value={`${analytics.liveMatchFunnel.averageWaitSeconds}s`} detail={`${percent(analytics.liveMatchFunnel.matchSuccessRate)} success`} tone="live" />
        <Metric icon={MonitorCog} label="API p95" value={`${analytics.operational.apiLatencyP95}ms`} detail={`${percent(analytics.operational.errorRate)} errors`} tone="warning" />
        <Metric icon={Database} label="Queue depth" value={formatNumber(analytics.operational.redisQueueDepth)} detail={`${analytics.operational.mongoSlowQueries} slow queries`} tone="delt" />
      </section>
      <section className="content-grid">
        <div className="panel chart-panel">
          <PanelHeader title="Growth and revenue" subtitle="Daily acquisition against purchase activity" icon={BarChart3} />
          <ChartBox>
            <LineChart data={data.trends}>
              <CartesianGrid stroke="rgba(160,160,184,0.12)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#A0A0B8", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#A0A0B8", fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="users" stroke="#EC4899" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="sessions" stroke="#00D4AA" strokeWidth={3} dot={false} />
            </LineChart>
          </ChartBox>
        </div>
        <div className="panel">
          <PanelHeader title="Operational metrics" subtitle="API, workers, queues, and LiveKit" icon={MonitorCog} />
          <InfoList rows={[
            ["p50 / p95 / p99", `${analytics.operational.apiLatencyP50}ms / ${analytics.operational.apiLatencyP95}ms / ${analytics.operational.apiLatencyP99}ms`],
            ["Worker lag", `${analytics.operational.workerLagSeconds}s`],
            ["Webhook retry", percent(analytics.operational.webhookRetryRate)],
            ["LiveKit failures", String(analytics.operational.liveKitRoomFailures)],
          ]} />
        </div>
      </section>
      <section className="three-column-grid">
        <BreakdownPanel title="Acquisition funnel" icon={Users} items={analytics.growth.regions} />
        <BreakdownPanel title="Dating funnel" icon={Heart} items={analytics.datingFunnel.dropoff} />
        <BreakdownPanel title="Endpoint errors" icon={AlertTriangle} items={analytics.operational.endpointErrors} />
      </section>
    </div>
  );
}

function AuditView({
  logs,
  query,
  action,
  onQueryChange,
  onActionChange,
  onExport,
}: {
  logs: AuditLog[];
  query: string;
  action: string;
  onQueryChange: (query: string) => void;
  onActionChange: (action: string) => void;
  onExport: () => void;
}) {
  return (
    <div className="view-stack">
      <FilterBar>
        <SearchField value={query} onChange={onQueryChange} placeholder="Search actor, target, action, or reason" />
        <Select value={action} onChange={onActionChange} options={["all", "admin", "moderation", "wallet", "media", "settings", "audit"]} />
        <button className="secondary-action" type="button" onClick={onExport}><Database size={18} />Export</button>
      </FilterBar>
      <section className="content-grid">
        <div className="panel table-panel">
          <PanelHeader title="Audit logs" subtitle="Actor, target, action, reason, IP, and device" icon={FileText} />
          <DataTable
            headers={["Created", "Actor", "Target", "Action", "Reason", "IP"]}
            rows={logs.map((log) => [
              <span key="created">{formatDate(log.createdAt)}</span>,
              <strong key="actor">{log.actor}</strong>,
              <span key="target">{log.target}</span>,
              <span key="action">{humanize(log.action)}</span>,
              <span key="reason" className="muted">{log.reason}</span>,
              <span key="ip">{log.ip}</span>,
            ])}
          />
        </div>
        <div className="panel">
          <PanelHeader title="Compliance" subtitle="Retention, access review, and reporting" icon={Lock} />
          <div className="stack-list">
            <StatusRow label="Retention policy" value="400 days" tone="success" />
            <StatusRow label="Access review" value="Monthly" tone="live" />
            <StatusRow label="Export format" value="CSV" tone="delt" />
            <StatusRow label="Admin login review" value="Enabled" tone="success" />
          </div>
        </div>
      </section>
    </div>
  );
}

function AdminsView({ accounts, onAction, onCreate }: { accounts: AdminAccount[]; onAction: (id: string, action: string) => void; onCreate: () => void }) {
  return (
    <div className="view-stack">
      <FilterBar>
        <button className="primary-inline" type="button" onClick={onCreate}><UserCog size={18} />Invite admin</button>
      </FilterBar>
      <div className="panel table-panel">
        <PanelHeader title="Admin management" subtitle="Roles, MFA, access status, and recent activity" icon={UserCog} />
        <DataTable
          headers={["Admin", "Role", "Status", "MFA", "Last active", "Actions"]}
          rows={accounts.map((account) => [
            <UserAccount key="admin" account={account} />,
            <span key="role">{roleLabels[account.role]}</span>,
            <Badge key="status" label={account.status} tone={account.status === "active" ? "success" : account.status === "revoked" ? "danger" : "warning"} />,
            <span key="mfa">{account.mfaEnabled ? "Enabled" : "Required"}</span>,
            <span key="active">{formatDate(account.lastActiveAt)}</span>,
            <div className="table-actions" key="actions">
              <button className="table-action" type="button" onClick={() => onAction(account.id, "assign_role")}>Role</button>
              <button className="table-action" type="button" onClick={() => onAction(account.id, "enforce_mfa")}>MFA</button>
              <button className="table-action danger" type="button" onClick={() => onAction(account.id, "revoke")}>Revoke</button>
            </div>,
          ])}
        />
      </div>
    </div>
  );
}

function SettingsView({ data, onFeatureFlagChange }: { data: AdminDataset; onFeatureFlagChange: (key: string, enabled: boolean) => void }) {
  return (
    <div className="view-stack">
      <section className="three-column-grid">
        <div className="panel">
          <PanelHeader title="Feature flags" subtitle="Release and safety switches" icon={SlidersHorizontal} />
          <div className="stack-list">
            {data.settings.featureFlags.map((flag) => (
              <label className="toggle-row" key={flag.key}>
                <span>{flag.label}</span>
                <input type="checkbox" checked={flag.enabled} onChange={(event) => onFeatureFlagChange(flag.key, event.target.checked)} />
              </label>
            ))}
          </div>
        </div>
        <div className="panel">
          <PanelHeader title="Rate limits" subtitle="Admin and product controls" icon={Gauge} />
          <div className="stack-list">
            {data.settings.rateLimits.map((limit) => <StatusRow key={limit.key} label={limit.label} value={`${limit.value} ${limit.unit}`} tone="live" />)}
          </div>
        </div>
        <div className="panel">
          <PanelHeader title="Token pricing" subtitle="Active delt packages" icon={Coins} />
          <div className="stack-list">
            {data.settings.tokenPricing.map((pricing) => <StatusRow key={pricing.package} label={pricing.package} value={`${currency(pricing.priceUsd)} - ${pricing.delt} delt`} tone={pricing.active ? "delt" : "neutral"} />)}
          </div>
        </div>
      </section>
      <section className="three-column-grid">
        <BreakdownPanel title="Moderation policy" icon={Shield} items={data.settings.moderationPolicies.map((item) => ({ label: item.label, value: Number(item.value.replace(/\D/g, "")) || 1, detail: item.value }))} />
        <BreakdownPanel title="Pool expansion" icon={Compass} items={data.settings.poolExpansionRules.map((item) => ({ label: `${item.waitSeconds}s`, value: item.waitSeconds, detail: item.behavior }))} />
        <BreakdownPanel title="Trust thresholds" icon={ShieldCheck} items={data.settings.trustThresholds.map((item) => ({ label: item.level, value: item.min, detail: `${item.min}-${item.max}` }))} />
      </section>
      <div className="panel">
        <PanelHeader title="Notification templates" subtitle="Operational messages by channel" icon={Bell} />
        <DataTable
          headers={["Template", "Channel", "Status"]}
          rows={data.settings.notificationTemplates.map((template) => [
            <strong key="label">{template.label}</strong>,
            <span key="channel">{template.channel}</span>,
            <Badge key="status" label={template.enabled ? "enabled" : "disabled"} tone={template.enabled ? "success" : "neutral"} />,
          ])}
        />
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, detail, tone }: { icon: ElementType; label: string; value: string; detail: string; tone: Tone }) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <div className="metric-icon"><Icon size={20} /></div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function PanelHeader({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon: ElementType }) {
  return (
    <div className="panel-header">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <Icon size={20} />
    </div>
  );
}

function FilterBar({ children }: { children: ReactNode }) {
  return <div className="filter-bar">{children}</div>;
}

function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="search-box">
      <Search size={18} />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function Select({ value, onChange, options, label }: { value: string; onChange: (value: string) => void; options: string[]; label?: string }) {
  return (
    <label className="select-box">
      {label && <span>{label}</span>}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{humanize(option)}</option>)}
      </select>
    </label>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChartBox({ children }: { children: ReactElement }) {
  return <div className="chart-box"><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>;
}

function BreakdownPanel({ title, icon, items }: { title: string; icon: ElementType; items: Array<{ label: string; value: number; detail?: string }> }) {
  const total = Math.max(1, items.reduce((sum, item) => sum + item.value, 0));
  return (
    <div className="panel">
      <PanelHeader title={title} subtitle="Current distribution" icon={icon} />
      <div className="stack-list">
        {items.map((item) => (
          <div className="bar-row" key={item.label}>
            <div><strong>{item.label}</strong><small>{item.detail || formatNumber(item.value)}</small></div>
            <span><i style={{ width: `${Math.max(8, (item.value / total) * 100)}%` }} /></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusRow({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  return (
    <div className="status-row">
      <div>
        <strong>{label}</strong>
        <small>{value}</small>
      </div>
      <Badge label={tone} tone={tone} />
    </div>
  );
}

function UserCell({ user }: { user: AdminUser }) {
  return (
    <div className="user-cell">
      <div className="avatar">{initials(user.name)}</div>
      <div>
        <strong>{user.name}</strong>
        <small>{user.email}</small>
      </div>
    </div>
  );
}

function UserAccount({ account }: { account: AdminAccount }) {
  return (
    <div className="user-cell">
      <div className="avatar">{initials(account.name)}</div>
      <div>
        <strong>{account.name}</strong>
        <small>{account.email}</small>
      </div>
    </div>
  );
}

function Badge({ label, tone }: { label: string; tone: Tone | string }) {
  return <span className={`badge tone-${tone}`}>{label}</span>;
}

function SectionTitle({ title }: { title: string }) {
  return <h3 className="section-title">{title}</h3>;
}

function InfoTile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="info-tile">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}

function BooleanTile({ label, enabled }: { label: string; enabled: boolean }) {
  return <InfoTile label={label} value={enabled ? "Allowed" : "Restricted"} />;
}

function InfoList({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="info-list">
      {rows.map(([label, value]) => (
        <div key={label}><span>{label}</span><strong>{value}</strong></div>
      ))}
    </div>
  );
}

function TimelineItem({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="timeline-item">
      <i />
      <div>
        <strong>{label}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}

function TrustMeter({ value, large = false }: { value: number; large?: boolean }) {
  return (
    <div className={large ? "trust-meter large" : "trust-meter"}>
      <span><i style={{ width: `${clamp(value, 0, 100)}%` }} /></span>
      <strong>{value}</strong>
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick, tone = "neutral", disabled = false }: { icon: ElementType; label: string; onClick: () => void; tone?: Tone; disabled?: boolean }) {
  return (
    <button className={`action-button tone-${tone}`} type="button" onClick={onClick} disabled={disabled}>
      <Icon size={16} />
      {label}
    </button>
  );
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (page: number) => void }) {
  return (
    <div className="pagination">
      <button className="icon-button" type="button" disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))} aria-label="Previous page"><ChevronLeft size={18} /></button>
      <span>Page {page} of {totalPages}</span>
      <button className="icon-button" type="button" disabled={page >= totalPages} onClick={() => onPageChange(Math.min(totalPages, page + 1))} aria-label="Next page"><ChevronRight size={18} /></button>
    </div>
  );
}

const tooltipStyle = {
  background: "#13131A",
  border: "1px solid #28283A",
  color: "#F8F8FC",
  borderRadius: 12,
};

function titleFor(view: ViewKey) {
  return {
    overview: "Overview",
    users: "User management",
    reports: "Report queue",
    cases: "Moderation cases",
    sessions: "Live sessions",
    media: "Media review",
    trust: "Trust & safety",
    wallet: "Wallet and revenue",
    analytics: "Analytics",
    audit: "Audit logs",
    admins: "Admin management",
    settings: "Settings",
  }[view];
}

function canAccess(roles: AdminRole[] | "all", role: AdminRole) {
  return roles === "all" || roles.includes(role);
}

function canModerate(role: AdminRole) {
  return ["super_admin", "admin", "trust_safety_manager", "moderator"].includes(role);
}

function canTakeUserAction(role: AdminRole) {
  return ["super_admin", "admin", "trust_safety_manager", "moderator", "support"].includes(role);
}

function canUseWallet(role: AdminRole) {
  return ["super_admin", "admin", "finance", "support"].includes(role);
}

function filterUsers(users: AdminUser[], filters: Record<string, string>) {
  const needle = filters.query.trim().toLowerCase();
  return [...users]
    .filter((user) => {
      const search = `${user.id} ${user.email} ${user.phone} ${user.name}`.toLowerCase();
      const queryMatch = !needle || search.includes(needle);
      const statusMatch = filters.status === "all" || user.status === filters.status;
      const verificationMatch = filters.verification === "all" || user.verificationStatus === filters.verification;
      const regionMatch = filters.region === "all" || user.region === filters.region;
      const trustMatch = user.trustScore >= Number(filters.minTrust || "0");
      return queryMatch && statusMatch && verificationMatch && regionMatch && trustMatch;
    })
    .sort((a, b) => {
      if (filters.sort === "trustScore") return b.trustScore - a.trustScore;
      return String(b[filters.sort as keyof AdminUser] || "").localeCompare(String(a[filters.sort as keyof AdminUser] || ""));
    });
}

function filterReports(reports: AdminReport[], filters: Record<string, string>) {
  const severityRank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  return [...reports]
    .filter((report) => {
      const statusMatch = filters.status === "all" || report.status === filters.status;
      const severityMatch = filters.severity === "all" || report.severity === filters.severity;
      const categoryMatch = filters.category === "all" || report.category === filters.category;
      return statusMatch && severityMatch && categoryMatch;
    })
    .sort((a, b) => {
      if (filters.sort === "priority") return b.priority - a.priority;
      if (filters.sort === "severity") return severityRank[b.severity] - severityRank[a.severity];
      return String(b[filters.sort as keyof AdminReport] || "").localeCompare(String(a[filters.sort as keyof AdminReport] || ""));
    });
}

function filterSessions(sessions: LiveSession[], filters: { query: string; status: string; region: string; interest: string; reportedOnly: boolean }) {
  const needle = filters.query.trim().toLowerCase();
  return sessions.filter((session) => {
    const search = `${session.sessionId} ${session.roomName} ${session.participants.join(" ")}`.toLowerCase();
    const queryMatch = !needle || search.includes(needle);
    const statusMatch = filters.status === "all" || session.status === filters.status;
    const regionMatch = filters.region === "all" || session.region === filters.region;
    const interestMatch = filters.interest === "all" || session.interest === filters.interest;
    const reportedMatch = !filters.reportedOnly || session.reported;
    return queryMatch && statusMatch && regionMatch && interestMatch && reportedMatch;
  });
}

function severityTone(severity: string): Tone {
  if (severity === "critical" || severity === "high") return "danger";
  if (severity === "medium") return "warning";
  return "neutral";
}

function riskTone(risk: string): Tone {
  if (["critical", "high", "restricted"].includes(risk)) return "danger";
  if (["medium", "new"].includes(risk)) return "warning";
  if (["verified", "trusted", "low"].includes(risk)) return "success";
  return "neutral";
}

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function humanize(value: string) {
  return value.replace(/_/g, " ");
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function currency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function formatDuration(seconds: number) {
  if (!seconds) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

function initials(value: string) {
  return value.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}
