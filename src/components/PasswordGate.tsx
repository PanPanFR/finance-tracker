"use client";

import React, { useState } from "react";
import { LockIcon, UnlockIcon, SparklesIcon, EyeIcon, EyeOffIcon, RefreshCwIcon, ShieldCheckIcon } from "./Icons";
import { apiFetch } from "../lib/client-api";

interface PasswordGateProps {
  onSuccess: () => void;
}

const MIN_PASSWORD_LENGTH = 8;

/** 0 (empty) … 4 (strong) */
function getPasswordScore(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

const STRENGTH_LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"];

export default function PasswordGate({ onSuccess }: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSetupMode, setIsSetupMode] = useState(false);

  const strengthScore = getPasswordScore(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError("");

    try {
      if (isSetupMode) {
        // Setup Mode (First Time)
        const res = await apiFetch("/api/auth/setup", {
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
        const res = await apiFetch("/api/auth/login", {
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
    <div className="auth-loading-screen" style={{ padding: "1.5rem" }}>
      <div style={{ width: "100%", maxWidth: "420px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-2xl)", padding: "2.25rem", boxShadow: "0 24px 48px rgba(0,0,0,0.65)" }}>
        {/* Top Vault Icon */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div className="icon-badge icon-badge-primary" style={{ width: "3.5rem", height: "3.5rem", margin: "0 auto 1rem auto" }}>
            {isSetupMode ? <SparklesIcon size={24} /> : <LockIcon size={24} />}
          </div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
            {isSetupMode ? "Initialize Master Vault" : "Vault Access"}
          </h1>
          <p className="page-subtitle" style={{ marginTop: "0.35rem", lineHeight: 1.5 }}>
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
              {isSetupMode && (
                <span className="page-subtitle" style={{ fontSize: "0.6875rem" }}>
                  Min. {MIN_PASSWORD_LENGTH} chars
                </span>
              )}
            </div>

            <div style={{ position: "relative" }}>
              <input
                id="master-password"
                type={showPassword ? "text" : "password"}
                className="input-text"
                style={{ paddingRight: "2.75rem" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={MIN_PASSWORD_LENGTH}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="input-visibility-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
              </button>
            </div>

            {/* Password strength meter (setup mode only) */}
            {isSetupMode && (
              <div style={{ marginTop: "0.6rem" }} aria-live="polite">
                <div style={{ display: "flex", gap: "0.25rem" }} aria-hidden="true">
                  {[1, 2, 3, 4].map((seg) => (
                    <span
                      key={seg}
                      style={{
                        flex: 1,
                        height: "0.25rem",
                        borderRadius: "var(--radius-full)",
                        background:
                          strengthScore >= seg
                            ? seg <= 1
                              ? "var(--color-expense)"
                              : seg === 2
                                ? "#f59e0b"
                                : "var(--income-text)"
                            : "var(--bg-card-hover)",
                        transition: "background 0.2s ease",
                      }}
                    />
                  ))}
                </div>
                <span className="page-subtitle" style={{ fontSize: "0.6875rem", display: "block", marginTop: "0.25rem" }}>
                  Strength: {STRENGTH_LABELS[strengthScore]}
                </span>
              </div>
            )}
          </div>

          {error && (
            <div className="form-error-box">
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
                <RefreshCwIcon size={16} className="icon-wrap spin-animation" />
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
                <span>Unlock Records</span>
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
