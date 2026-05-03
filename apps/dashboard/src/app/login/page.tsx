"use client";

import { ArrowRight, ShieldCheck } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  const [token, setToken] = useState("");
  const [mfaCode, setMfaCode] = useState("");

  function saveToken() {
    window.localStorage.setItem("delta_admin_token", token.trim());
    window.localStorage.setItem("delta_admin_mfa", "verified");
    document.cookie = "delta_admin_session=1; path=/; max-age=28800; SameSite=Lax";
    window.location.href = "/";
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
          Paste a backend admin JWT to connect this dashboard to the protected admin API.
        </p>
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
          Save session
          <ArrowRight size={18} />
        </button>
      </section>
    </main>
  );
}
