"use client";

import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { useState } from "react";

const sessionDurationSeconds = 60 * 60 * 8;
const mockLoginEnabled = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";

const adminRoles = [
  ["super_admin", "Super admin"],
  ["admin", "Admin"],
  ["trust_safety_manager", "Trust & Safety Manager"],
  ["moderator", "Moderator"],
  ["support", "Support"],
  ["finance", "Finance"],
  ["analyst", "Analyst"],
] as const;

export default function LoginPage() {
  const [token, setToken] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [role, setRole] = useState("super_admin");

  function createSession(nextToken: string, reason: string) {
    const expiresAt = Date.now() + sessionDurationSeconds * 1000;
    const loginAudit = {
      id: `audit_login_${Date.now()}`,
      actor: adminRoles.find(([value]) => value === role)?.[1] || "Admin",
      target: "Delta admin",
      action: "admin.login",
      resourceType: "auth",
      reason,
      ip: "local-session",
      device: window.navigator.userAgent,
      createdAt: new Date().toISOString(),
    };

    window.localStorage.setItem("delta_admin_token", nextToken);
    window.localStorage.setItem("delta_admin_role", role);
    window.localStorage.setItem("delta_admin_mfa", "verified");
    window.localStorage.setItem("delta_admin_session_expires_at", String(expiresAt));
    window.localStorage.setItem("delta_admin_login_audit", JSON.stringify(loginAudit));
    document.cookie = `delta_admin_session=1; path=/; max-age=${sessionDurationSeconds}; SameSite=Lax`;
    document.cookie = `delta_admin_role=${role}; path=/; max-age=${sessionDurationSeconds}; SameSite=Lax`;
    window.location.href = "/";
  }

  function saveToken() {
    createSession(token.trim(), "MFA session created");
  }

  function useDemoSession() {
    createSession(`delta_mock_admin_${crypto.randomUUID()}`, "Mock admin session created");
  }

  const canSubmit = token.trim().length > 20 && mfaCode.trim().length >= 6;

  return (
    <main className="login-screen">
      <section className="login-panel">
        <div className="brand-mark" aria-hidden="true">
          <span>Δ</span>
        </div>
        <p className="eyebrow">Delta internal</p>
        <h1>Admin access</h1>
        <p className="login-copy">
          Use a mock admin session for local dashboard work, or paste a backend admin JWT to connect to the protected admin API.
        </p>
        <label className="field">
          <span>Admin role</span>
          <select value={role} onChange={(event) => setRole(event.target.value)}>
            {adminRoles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        {mockLoginEnabled && (
          <button className="primary-action" type="button" onClick={useDemoSession}>
            <KeyRound size={18} />
            Continue with mock admin
            <ArrowRight size={18} />
          </button>
        )}
        <div className="login-divider"><span>Backend token</span></div>
        <label className="field">
          <span>Admin token</span>
          <textarea
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Bearer token"
            rows={5}
          />
        </label>
        <label className="field">
          <span>MFA code</span>
          <input
            value={mfaCode}
            onChange={(event) => setMfaCode(event.target.value)}
            inputMode="numeric"
            placeholder="6-digit code"
          />
        </label>
        <button className="primary-action" type="button" onClick={saveToken} disabled={!canSubmit}>
          <ShieldCheck size={18} />
          Continue with JWT
          <ArrowRight size={18} />
        </button>
      </section>
    </main>
  );
}
