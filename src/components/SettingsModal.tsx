"use client";

import React, { useState } from "react";
import { SettingsIcon, XIcon, ShieldCheckIcon, EyeIcon, EyeOffIcon, RefreshCwIcon } from "./Icons";
import { useToast } from "./Toast";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { success } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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
      setTimeout(() => {
        onClose();
      }, 400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div className="icon-badge icon-badge-primary" style={{ width: "2.25rem", height: "2.25rem" }}>
              <SettingsIcon size={18} />
            </div>
            <div>
              <h3 className="modal-title-text" style={{ fontSize: "1rem" }}>Security Settings</h3>
              <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                Update master vault credentials
              </p>
            </div>
          </div>
          <button onClick={onClose} className="toast-close" aria-label="Close modal">
            <XIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
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

          <div className="modal-actions-row">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCwIcon size={14} className="icon-wrap" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <ShieldCheckIcon size={14} className="icon-wrap" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
