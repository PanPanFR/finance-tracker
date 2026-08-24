"use client";

import React, { useState } from "react";
import Navigation from "../../components/Navigation";
import { useAuth } from "../../contexts/AuthContext";
import PasswordGate from "../../components/PasswordGate";
import ThemeToggle from "../../components/ThemeToggle";
import { useToast } from "../../components/Toast";
import { apiFetch } from "../../lib/client-api";
import {
  SettingsIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeOffIcon,
  RefreshCwIcon,
  LockIcon,
  SunIcon,
} from "../../components/Icons";

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

export default function SettingsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { success } = useToast();

  const strengthScore = getPasswordScore(newPassword);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;

    setLoading(true);
    setError("");

    try {
      const res = await apiFetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update master password");
      }

      success("Master password updated successfully!");
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (authLoading) {
    return (
      <div className="auth-loading-screen">
        Loading settings...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PasswordGate onSuccess={() => {}} />;
  }

  return (
    <div className="page-wrapper">
      <Navigation />

      <main className="app-container" style={{ marginTop: "1.5rem", maxWidth: "800px" }}>
        {/* Page Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div className="page-title-group">
            <div className="icon-badge icon-badge-primary" style={{ width: "2rem", height: "2rem" }}>
              <SettingsIcon size={16} />
            </div>
            <h1 className="page-title">
              Vault Security &amp; Settings
            </h1>
          </div>
          <p className="page-subtitle">
            Configure your master access password and manage local session encryption.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Password Change Panel */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">
                  <ShieldCheckIcon size={16} color="#818cf8" />
                  <span>Update Master Password</span>
                </h2>
                <p className="panel-subtitle">Change the password required to unlock your finance ledger</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="current-password">Current Master Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    id="current-password"
                    type={showOld ? "text" : "password"}
                    className="input-text"
                    style={{ paddingRight: "2.75rem" }}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(!showOld)}
                    className="input-visibility-toggle"
                    aria-label={showOld ? "Hide current password" : "Show current password"}
                  >
                    {showOld ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-password">New Master Password (Min. {MIN_PASSWORD_LENGTH} chars)</label>
                <div style={{ position: "relative" }}>
                  <input
                    id="new-password"
                    type={showNew ? "text" : "password"}
                    className="input-text"
                    style={{ paddingRight: "2.75rem" }}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="input-visibility-toggle"
                    aria-label={showNew ? "Hide new password" : "Show new password"}
                  >
                    {showNew ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
                  </button>
                </div>

                {/* Password strength meter */}
                {newPassword && (
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

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCwIcon size={14} className="icon-wrap spin-animation" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheckIcon size={14} className="icon-wrap" />
                      <span>Save New Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Appearance Panel */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">
                  <SunIcon size={16} color="#818cf8" />
                  <span>Appearance</span>
                </h2>
                <p className="panel-subtitle">Choose between light and dark theme</p>
              </div>
              <ThemeToggle />
            </div>
            <p className="page-subtitle">
              Your preference is saved on this device. When no choice is stored, the app follows your system setting.
            </p>
          </div>

          {/* System & Vault Status Panel */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">
                  <LockIcon size={16} color="#818cf8" />
                  <span>Session &amp; Security Status</span>
                </h2>
                <p className="panel-subtitle">Your active vault encryption parameters</p>
              </div>
            </div>

            <div className="info-grid">
              <div className="info-tile">
                <span className="info-tile-label">Vault Status</span>
                <span className="info-tile-value" style={{ color: "var(--income-text)", display: "inline-flex", alignItems: "center", gap: "0.35rem", marginTop: "0.2rem" }}>
                  Active &amp; Locked
                </span>
              </div>

              <div className="info-tile">
                <span className="info-tile-label">Encryption Type</span>
                <span className="info-tile-value">
                  PBKDF2 / SHA-256
                </span>
              </div>

              <div className="info-tile">
                <span className="info-tile-label">Storage Engine</span>
                <span className="info-tile-value">
                  Cloudflare D1 SQL
                </span>
              </div>
            </div>

            <div className="vault-footer-row">
              <span className="page-subtitle">End active session on this device</span>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-danger btn-sm"
              >
                <LockIcon size={13} className="icon-wrap" />
                <span>Lock Vault Now</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
