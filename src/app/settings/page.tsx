"use client";

import React, { useState } from "react";
import Navigation from "../../components/Navigation";
import { useAuth } from "../../contexts/AuthContext";
import PasswordGate from "../../components/PasswordGate";
import { useToast } from "../../components/Toast";
import {
  SettingsIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeOffIcon,
  RefreshCwIcon,
  LockIcon,
} from "../../components/Icons";

export default function SettingsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { success } = useToast();

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
        credentials: "include",
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
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-app)", color: "var(--text-muted)", fontSize: "0.875rem" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
            <div className="icon-badge icon-badge-primary" style={{ width: "2rem", height: "2rem" }}>
              <SettingsIcon size={16} />
            </div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
              Vault Security &amp; Settings
            </h1>
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
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
                <label className="form-label">Current Master Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showOld ? "text" : "password"}
                    className="input-text"
                    style={{ paddingRight: "2.5rem" }}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(!showOld)}
                    style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}
                    aria-label={showOld ? "Hide password" : "Show password"}
                  >
                    {showOld ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">New Master Password (Min. 4 chars)</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showNew ? "text" : "password"}
                    className="input-text"
                    style={{ paddingRight: "2.5rem" }}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    minLength={4}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}
                    aria-label={showNew ? "Hide password" : "Show password"}
                  >
                    {showNew ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ padding: "0.6rem 0.75rem", background: "var(--color-expense-bg)", border: "1px solid var(--color-expense-border)", borderRadius: "var(--radius-md)", color: "var(--color-expense)", fontSize: "0.75rem", marginBottom: "1rem" }}>
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
                      <RefreshCwIcon size={14} className="icon-wrap" />
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

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <div style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "0.875rem" }}>
                <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", display: "block" }}>Vault Status</span>
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#34d399", display: "inline-flex", alignItems: "center", gap: "0.35rem", marginTop: "0.2rem" }}>
                  Active &amp; Locked
                </span>
              </div>

              <div style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "0.875rem" }}>
                <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", display: "block" }}>Encryption Type</span>
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)", display: "block", marginTop: "0.2rem" }}>
                  PBKDF2 / SHA-256
                </span>
              </div>

              <div style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "0.875rem" }}>
                <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", display: "block" }}>Storage Engine</span>
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)", display: "block", marginTop: "0.2rem" }}>
                  Cloudflare D1 SQL
                </span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>End active session on this device</span>
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
