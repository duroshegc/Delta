"use client";

import { ArrowRight, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { API_URL, adminApi } from "@/lib/api";

const sessionDurationSeconds = 60 * 60 * 8;

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  function createSession(nextToken: string, reason: string, nextRole: string, expiresAtValue?: string) {
    const backendExpiresAt = expiresAtValue ? new Date(expiresAtValue).getTime() : 0;
    const expiresAt = Date.now() + sessionDurationSeconds * 1000;
    const sessionExpiresAt = Number.isFinite(backendExpiresAt) && backendExpiresAt > Date.now() ? backendExpiresAt : expiresAt;
    const loginAudit = {
      id: `audit_login_${Date.now()}`,
      actor: roleLabel(nextRole),
      target: "Delta admin",
      action: "admin.login",
      resourceType: "auth",
      reason,
      ip: "local-session",
      device: window.navigator.userAgent,
      createdAt: new Date().toISOString(),
    };

    window.localStorage.setItem("delta_admin_token", nextToken);
    window.localStorage.setItem("delta_admin_role", nextRole);
    window.localStorage.setItem("delta_admin_mfa", "verified");
    window.localStorage.setItem("delta_admin_session_expires_at", String(sessionExpiresAt));
    window.localStorage.setItem("delta_admin_login_audit", JSON.stringify(loginAudit));
    document.cookie = `delta_admin_session=1; path=/; max-age=${sessionDurationSeconds}; SameSite=Lax`;
    document.cookie = `delta_admin_role=${nextRole}; path=/; max-age=${sessionDurationSeconds}; SameSite=Lax`;
    window.location.href = "/";
  }

  async function signInWithBackend() {
    setStatus("");
    setIsSigningIn(true);
    try {
      const result = await adminApi.signIn({ email: email.trim(), password });
      window.localStorage.setItem("delta_admin_refresh_token", result.refreshToken);
      createSession(result.accessToken, "Backend admin sign in", normalizeRole(result.user.role), result.expiresAt);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to sign in");
    } finally {
      setIsSigningIn(false);
    }
  }

  function saveToken() {
    createSession(token.trim(), "Manual admin token session", roleFromToken(token.trim()));
  }

  const canSignIn = email.trim().length > 3 && password.length > 0 && !isSigningIn;
  const canUseToken = token.trim().length > 20;

  return (
    <main className="login-screen">
      <section className="login-panel">
        <div className="brand-mark" aria-hidden="true">
          <span>Δ</span>
        </div>
        <p className="eyebrow">Delta internal</p>
        <h1>Admin access</h1>
        <p className="login-copy">
          Sign in with a backend admin account connected to {API_URL}.
        </p>
        <label className="field">
          <span>Email</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            inputMode="email"
            placeholder="admin@delta.app"
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="Password"
            type="password"
          />
        </label>
        <button className="primary-action" type="button" onClick={signInWithBackend} disabled={!canSignIn}>
          <ShieldCheck size={18} />
          {isSigningIn ? "Signing in" : "Sign in"}
          <ArrowRight size={18} />
        </button>
        {status && <p className="login-error" role="alert">{status}</p>}
        <div className="login-divider"><span>Access token</span></div>
        <label className="field">
          <span>Admin token</span>
          <textarea
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Bearer token"
            rows={5}
          />
        </label>
        <button className="secondary-action login-secondary" type="button" onClick={saveToken} disabled={!canUseToken}>
          <ShieldCheck size={18} />
          Continue with token
          <ArrowRight size={18} />
        </button>
      </section>
    </main>
  );
}

function normalizeRole(role?: string) {
  return adminRoles.some(([value]) => value === role) ? role! : "analyst";
}

function roleLabel(role: string) {
  return adminRoles.find(([value]) => value === role)?.[1] || "Admin";
}

function roleFromToken(token: string) {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = JSON.parse(window.atob(padded)) as { role?: string };
    return normalizeRole(decoded.role);
  } catch {
    return "analyst";
  }
}
