"use client";

import React, { useEffect, useState, useCallback } from "react";
import Navigation from "../../components/Navigation";
import { useAuth } from "../../contexts/AuthContext";
import PasswordGate from "../../components/PasswordGate";
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

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-app)", color: "var(--text-muted)", fontSize: "0.875rem" }}>
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                <div className="icon-badge icon-badge-primary" style={{ width: "2rem", height: "2rem" }}>
                  <TrendingUpIcon size={16} />
                </div>
                <h1 style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
                  Financial Analytics &amp; Breakdown
                </h1>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Track your savings performance, category distributions, and expense ratios.
              </p>
            </div>

            <div className="segmented-group">
              <button
                onClick={() => setPeriod("this-month")}
                className={`segmented-btn ${period === "this-month" ? "active" : ""}`}
              >
                This Month
              </button>
              <button
                onClick={() => setPeriod("all")}
                className={`segmented-btn ${period === "all" ? "active" : ""}`}
              >
                All Time
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Top KPI Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          <div className="panel" style={{ padding: "1.25rem" }}>
            <span className="card-eyebrow">Total Inflow</span>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#34d399", marginTop: "0.35rem" }}>
              +Rp {totalIncome.toLocaleString("id-ID")}
            </div>
            <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              {filteredTransactions.filter((t) => t.type === "income").length} income entries
            </div>
          </div>

          <div className="panel" style={{ padding: "1.25rem" }}>
            <span className="card-eyebrow">Total Outflow</span>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#fb7185", marginTop: "0.35rem" }}>
              -Rp {totalExpense.toLocaleString("id-ID")}
            </div>
            <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              {filteredTransactions.filter((t) => t.type === "expense").length} expense records
            </div>
          </div>

          <div className="panel" style={{ padding: "1.25rem" }}>
            <span className="card-eyebrow">Net Savings</span>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: netSavings >= 0 ? "var(--color-primary)" : "#fb7185", marginTop: "0.35rem" }}>
              {netSavings >= 0 ? "+" : ""}Rp {netSavings.toLocaleString("id-ID")}
            </div>
            <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              Savings Rate: <strong style={{ color: "var(--text-primary)" }}>{savingsRate}%</strong>
            </div>
          </div>
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
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8125rem" }}>
                Calculating category metrics...
              </div>
            ) : categoryList.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-desc">No expense records found for the selected period.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {categoryList.map((item, idx) => {
                  const colors = [
                    "#6366f1",
                    "#f43f5e",
                    "#10b981",
                    "#f59e0b",
                    "#8b5cf6",
                    "#ec4899",
                    "#06b6d4",
                    "#84cc16",
                  ];
                  const barColor = colors[idx % colors.length];

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

                      <div className="analytics-bar-track">
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
