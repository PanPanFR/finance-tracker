"use client";

import React, { useEffect, useState, useCallback } from "react";
import Navigation from "../../components/Navigation";
import { useAuth } from "../../contexts/AuthContext";
import PasswordGate from "../../components/PasswordGate";
import { SkeletonList } from "../../components/Skeleton";
import { useToast } from "../../components/Toast";
import {
  TrendingUpIcon,
  CategoryIcon,
  ReceiptIcon,
} from "../../components/Icons";

type Transaction = {
  id: string;
  description: string;
  amount: number;
  created_at: string;
  category?: string;
  type: "income" | "expense";
};

const BAR_COLORS = [
  "#6366f1",
  "#f43f5e",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

export default function AnalyticsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<"this-month" | "all">("this-month");
  const { error: toastError } = useToast();

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/transactions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTransactions((data.data || []) as Transaction[]);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      toastError("Failed to sync latest analytics data");
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    if (isAuthenticated) fetchTransactions();
  }, [isAuthenticated, fetchTransactions]);

  const formatYmdJakarta = (date: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(date);

  const todayJakarta = formatYmdJakarta(new Date());
  const currentYm = todayJakarta.substring(0, 7);

  const isCurrentMonthInJakarta = (isoString?: string) => {
    if (!isoString) return false;
    const parsed = new Date(isoString);
    if (isNaN(parsed.getTime())) return false;
    return formatYmdJakarta(parsed).substring(0, 7) === currentYm;
  };

  const filteredTransactions = transactions.filter((t) => {
    if (period === "this-month") {
      return isCurrentMonthInJakarta(t.created_at);
    }
    return true;
  });

  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Category Breakdown Map
  const categoryMap: Record<string, number> = {};
  filteredTransactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const cat = t.category || "Other";
      categoryMap[cat] = (categoryMap[cat] || 0) + t.amount;
    });

  const categoryList = Object.entries(categoryMap)
    .map(([cat, amt]) => ({
      category: cat,
      amount: amt,
      percentage: totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Daily expense totals for the last 30 days (trend chart)
  const TREND_DAYS = 30;
  const dailyTotals: { ymd: string; label: string; total: number }[] = [];
  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(d);
    dailyTotals.push({
      ymd,
      label: new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", month: "short", day: "numeric" }).format(d),
      total: 0,
    });
  }
  const ymdIndex = new Map(dailyTotals.map((d, idx) => [d.ymd, idx]));
  transactions
    .filter((t) => t.type === "expense" && !isLoading)
    .forEach((t) => {
      if (!t.created_at) return;
      const parsed = new Date(t.created_at);
      if (isNaN(parsed.getTime())) return;
      const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(parsed);
      const idx = ymdIndex.get(ymd);
      if (idx !== undefined) dailyTotals[idx].total += t.amount || 0;
    });

  const trendMax = Math.max(...dailyTotals.map((d) => d.total), 1);
  const trendTotal = dailyTotals.reduce((sum, d) => sum + d.total, 0);
  const peakDay = dailyTotals.reduce((peak, d) => (d.total > peak.total ? d : peak), dailyTotals[0]);

  // SVG geometry (viewBox 600x160, padding 6/10)
  const CHART_W = 600;
  const CHART_H = 160;
  const chartPoints = dailyTotals.map((d, idx) => {
    const x = (idx / Math.max(TREND_DAYS - 1, 1)) * (CHART_W - 12) + 6;
    const y = CHART_H - 10 - (d.total / trendMax) * (CHART_H - 24);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const trendLinePoints = chartPoints.join(" ");
  const trendAreaPath =
    `M ${chartPoints[0] ?? `6,${CHART_H - 10}`} L ` +
    chartPoints.join(" L ") +
    ` L ${(CHART_W - 6).toFixed(1)},${CHART_H - 10} L 6,${CHART_H - 10} Z`;

  if (authLoading) {
    return (
      <div className="auth-loading-screen">
        Loading analytics...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PasswordGate onSuccess={() => {}} />;
  }

  return (
    <div className="page-wrapper">
      <Navigation />

      <main className="app-container" style={{ marginTop: "1.5rem" }}>
        {/* Page Header with Time Range Switcher */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
          <div className="page-header-row" style={{ marginBottom: 0 }}>
            <div>
              <div className="page-title-group">
                <div className="icon-badge icon-badge-primary" style={{ width: "2rem", height: "2rem" }}>
                  <TrendingUpIcon size={16} />
                </div>
                <h1 className="page-title">
                  Financial Analytics &amp; Breakdown
                </h1>
              </div>
              <p className="page-subtitle">
                Track your savings performance, category distributions, and expense ratios.
              </p>
            </div>

            <div className="segmented-group">
              <button
                onClick={() => setPeriod("this-month")}
                className={`segmented-btn ${period === "this-month" ? "active" : ""}`}
                aria-pressed={period === "this-month"}
              >
                This Month
              </button>
              <button
                onClick={() => setPeriod("all")}
                className={`segmented-btn ${period === "all" ? "active" : ""}`}
                aria-pressed={period === "all"}
              >
                All Time
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Top KPI Grid */}
        <div className="kpi-grid">
          <div className="panel stat-card">
            <span className="card-eyebrow">Total Inflow</span>
            <div className="stat-card-value" style={{ color: "var(--income-text)" }}>
              +Rp {totalIncome.toLocaleString("id-ID")}
            </div>
            <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              {filteredTransactions.filter((t) => t.type === "income").length} income entries
            </div>
          </div>

          <div className="panel stat-card">
            <span className="card-eyebrow">Total Outflow</span>
            <div className="stat-card-value" style={{ color: "var(--expense-text)" }}>
              -Rp {totalExpense.toLocaleString("id-ID")}
            </div>
            <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              {filteredTransactions.filter((t) => t.type === "expense").length} expense records
            </div>
          </div>

          <div className="panel stat-card">
            <span className="card-eyebrow">Net Savings</span>
            <div className="stat-card-value" style={{ color: netSavings >= 0 ? "var(--color-primary)" : "var(--expense-text)" }}>
              {netSavings >= 0 ? "+" : ""}Rp {netSavings.toLocaleString("id-ID")}
            </div>
            <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              Savings Rate: <strong style={{ color: "var(--text-primary)" }}>{savingsRate}%</strong>
            </div>
          </div>
        </div>

        {/* Daily Expense Trend Chart */}
        <div className="panel" style={{ marginBottom: "1.5rem" }}>
          <div className="panel-header">
            <div>
              <h2 className="panel-title">
                <TrendingUpIcon size={16} color="#818cf8" />
                <span>Daily Expense Trend</span>
              </h2>
              <p className="panel-subtitle">Spending per day over the last 30 days</p>
            </div>
          </div>

          {isLoading ? (
            <SkeletonList count={3} label="Calculating expense trends..." />
          ) : trendTotal === 0 ? (
            <p className="empty-state-desc" style={{ margin: 0 }}>
              No expenses recorded in the last 30 days.
            </p>
          ) : (
            <>
              <svg
                className="chart-svg"
                viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                role="img"
                aria-label={`Daily expenses for the last 30 days, totaling Rp ${trendTotal.toLocaleString("id-ID")}. Peak day was ${peakDay.label} at Rp ${peakDay.total.toLocaleString("id-ID")}.`}
              >
                {/* horizontal grid lines */}
                {[0.25, 0.5, 0.75].map((frac) => (
                  <line
                    key={frac}
                    x1="6"
                    x2={CHART_W - 6}
                    y1={CHART_H - 10 - frac * (CHART_H - 24)}
                    y2={CHART_H - 10 - frac * (CHART_H - 24)}
                    stroke="var(--border-subtle)"
                    strokeDasharray="4 4"
                  />
                ))}
                {/* baseline */}
                <line x1="6" x2={CHART_W - 6} y1={CHART_H - 10} y2={CHART_H - 10} stroke="var(--border-medium)" />
                {/* area + line */}
                <path d={trendAreaPath} fill="rgba(99, 102, 241, 0.15)" stroke="none" />
                <polyline points={trendLinePoints} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
              <div className="chart-footer-note">
                <span>{dailyTotals[0]?.label}</span>
                <span>Peak: {peakDay.label} · Rp {peakDay.total.toLocaleString("id-ID")}</span>
                <span>{dailyTotals[dailyTotals.length - 1]?.label}</span>
              </div>
            </>
          )}
        </div>

        {/* Analytics Breakdown Workspace Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "1.5rem" }}>
          {/* Category Breakdown (7 cols on desktop) */}
          <div style={{ gridColumn: "span 12" }} className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">
                  <ReceiptIcon size={16} color="#818cf8" />
                  <span>Expense Distribution by Category</span>
                </h2>
                <p className="panel-subtitle">Ranked by highest expense category</p>
              </div>
            </div>

            {isLoading ? (
              <SkeletonList count={4} label="Calculating category metrics..." />
            ) : categoryList.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-desc">No expense records found for the selected period.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {categoryList.map((item, idx) => {
                  const barColor = BAR_COLORS[idx % BAR_COLORS.length];

                  return (
                    <div key={item.category} className="analytics-bar-row">
                      <div className="analytics-bar-label-line">
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <CategoryIcon category={item.category} size={15} />
                          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{item.category}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", fontWeight: 600 }}>{item.percentage}%</span>
                          <span style={{ fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                            Rp {item.amount.toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>

                      <div
                        className="analytics-bar-track"
                        role="progressbar"
                        aria-valuenow={item.percentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${item.category}: ${item.percentage}% of expenses`}
                      >
                        <div
                          className="analytics-bar-fill"
                          style={{
                            width: `${item.percentage}%`,
                            background: barColor,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
