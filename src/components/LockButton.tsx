"use client";

import React, { useState } from "react";
import { LockIcon, RefreshCwIcon } from "./Icons";

interface LockButtonProps {
  onLogout?: () => void;
}

export default function LockButton({ onLogout }: LockButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      onLogout?.();
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="btn btn-secondary btn-sm"
      title="Lock / Logout"
      aria-label="Lock application"
    >
      {loading ? (
        <RefreshCwIcon className="icon-wrap" size={14} style={{ animation: "spin 1s linear infinite" }} />
      ) : (
        <LockIcon className="icon-wrap" size={14} />
      )}
      <span>Lock</span>
    </button>
  );
}
