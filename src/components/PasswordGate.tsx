"use client";

import React, { useState } from "react";
import { LockIcon, UnlockIcon, SparklesIcon, EyeIcon, EyeOffIcon, RefreshCwIcon, ShieldCheckIcon } from "./Icons";

interface PasswordGateProps {
  onSuccess: () => void;
}

export default function PasswordGate({ onSuccess }: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSetupMode, setIsSetupMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError("");

    try {
      if (isSetupMode) {
        // Setup Mode (First Time)
        const res = await fetch("/api/auth/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to configure master password");
        }
      } else {
        // Login Mode
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.error === "SETUP_REQUIRED") {
            setIsSetupMode(true);
            throw new Error("Master password not set yet. Please create a new password.");
          }
          throw new Error(data.error || "Invalid master password. Please try again.");
        }
      }

      onSuccess();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", background: "var(--bg-app)" }}>
      <div style={{ width: "100%", maxWidth: "420px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-2xl)", padding: "2.25rem", boxShadow: "0 24px 48px rgba(0,0,0,0.65)" }}>
        {/* Top Vault Icon */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div className="icon-badge icon-badge-primary" style={{ width: "3.5rem", height: "3.5rem", margin: "0 auto 1rem auto" }}>
            {isSetupMode ? <SparklesIcon size={24} /> : <LockIcon size={24} />}
          </div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
            {isSetupMode ? "Initialize Master Vault" : "Vault Access"}
          </h1>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.35rem", lineHeight: 1.5 }}>
            {isSetupMode
              ? "Create a secure master password to encrypt your personal finance records"
              : "Enter master password to unlock your AI Finance Tracker"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
              <label className="form-label" htmlFor="master-password" style={{ marginBottom: 0 }}>
                {isSetupMode ? "Create Password" : "Password"}
              </label>
              {isSetupMode && <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Min. 4 chars</span>}
            </div>

            <div style={{ position: "relative" }}>
              <input
                id="master-password"
                type={showPassword ? "text" : "password"}
                className="input-text"
                style={{ paddingRight: "2.5rem" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding: "0.6rem 0.75rem", background: "var(--color-expense-bg)", border: "1px solid var(--color-expense-border)", borderRadius: "var(--radius-md)", color: "var(--color-expense)", fontSize: "0.75rem", marginBottom: "1rem" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.75rem", fontSize: "0.875rem" }}
          >
            {loading ? (
              <>
                <RefreshCwIcon size={16} className="icon-wrap" />
                <span>Verifying...</span>
              </>
            ) : isSetupMode ? (
              <>
                <SparklesIcon size={16} className="icon-wrap" />
                <span>Set Password &amp; Continue</span>
              </>
            ) : (
              <>
                <UnlockIcon size={16} className="icon-wrap" />
                <span>Unlock Ledger</span>
              </>
            )}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", marginTop: "1.75rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border-subtle)", fontSize: "0.6875rem", color: "var(--text-dim)" }}>
          <ShieldCheckIcon size={14} color="#10b981" />
          <span>Local session encryption</span>
        </div>
      </div>
    </div>
  );
}
