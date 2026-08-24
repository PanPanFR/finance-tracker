"use client";

import React from "react";

/** Pulsing placeholder mirroring the transaction-card layout (reduces layout shift) */
export function TransactionCardSkeleton() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <span className="skeleton-badge" />
      <div className="skeleton-line-group">
        <span className="skeleton-line w-45" />
        <span className="skeleton-line w-30" />
      </div>
      <span className="skeleton-amount" />
    </div>
  );
}

/**
 * Accessible loading region: announced politely by screen readers via the
 * sr-only label, with `aria-busy` set while data is being fetched.
 */
export function SkeletonList({ count = 5, label }: { count?: number; label: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="transaction-list">
      <span className="sr-only">{label}</span>
      {Array.from({ length: count }).map((_, i) => (
        <TransactionCardSkeleton key={i} />
      ))}
    </div>
  );
}
