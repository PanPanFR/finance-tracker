"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Navigation from "../components/Navigation";
import { useAuth } from "../contexts/AuthContext";
import PasswordGate from "../components/PasswordGate";
import TransactionForm from "../components/TransactionForm";
import ConfirmModal from "../components/ConfirmModal";
import { SkeletonList } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import { apiFetch } from "../lib/client-api";
import {
  WalletIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  SparklesIcon,
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  UploadCloudIcon,
  ArrowUpRightIcon,
  CategoryIcon,
  ReceiptIcon,
} from "../components/Icons";

type Transaction = {
  id: string;
  description: string;
  amount: number;
  created_at: string;
  category?: string;
  type: "income" | "expense";
};

export default function Home() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "expense" | "income">("all");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const { success, showToast, error: toastError } = useToast();

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/transactions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTransactions((data.data || []) as Transaction[]);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      toastError("Failed to sync latest transactions");
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactions();
    }
  }, [isAuthenticated, fetchTransactions]);

  useEffect(() => {
    const handleRefresh = () => fetchTransactions();
    window.addEventListener("transaction-added", handleRefresh);
    return () => window.removeEventListener("transaction-added", handleRefresh);
  }, [fetchTransactions]);

  const formatYmdJakarta = (date: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(date);

  const todayJakarta = formatYmdJakarta(new Date());
  const isTodayInJakarta = (isoString?: string) => {
    if (!isoString) return false;
    const parsed = new Date(isoString);
    if (isNaN(parsed.getTime())) return false;
    return formatYmdJakarta(parsed) === todayJakarta;
  };

  const isCurrentMonthInJakarta = (isoString?: string) => {
    if (!isoString) return false;
    const parsed = new Date(isoString);
    if (isNaN(parsed.getTime())) return false;
    const currentYm = todayJakarta.substring(0, 7);
    return formatYmdJakarta(parsed).substring(0, 7) === currentYm;
  };

  const todayExpense = transactions
    .filter((t) => t.type === "expense" && isTodayInJakarta(t.created_at))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const todayIncome = transactions
    .filter((t) => t.type === "income" && isTodayInJakarta(t.created_at))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const monthlyExpense = transactions
    .filter((t) => t.type === "expense" && isCurrentMonthInJakarta(t.created_at))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const monthlyIncome = transactions
    .filter((t) => t.type === "income" && isCurrentMonthInJakarta(t.created_at))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalBalance = transactions.reduce((acc, t) => {
    return t.type === "income" ? acc + t.amount : acc - t.amount;
  }, 0);

  const handleAddTransaction = async (transactionData: Omit<Transaction, "id" | "created_at">) => {
    try {
      const res = await apiFetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...transactionData,
          created_at: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Insert failed");
      success("Transaction recorded!");
      setIsAddModalOpen(false);
      await fetchTransactions();
    } catch {
      toastError("Failed to add transaction");
    }
  };

  const handleEditSave = async (transactionData: Omit<Transaction, "id" | "created_at">) => {
    if (!editTransaction) return;

    try {
      const res = await apiFetch(`/api/transactions/${editTransaction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: transactionData.description,
          amount: transactionData.amount,
          category: transactionData.category || "Other",
          type: transactionData.type || "expense",
        }),
      });

      if (!res.ok) throw new Error("Update failed");
      success("Transaction updated!");
      setEditTransaction(null);
      await fetchTransactions();
    } catch {
      toastError("Failed to update transaction");
    }
  };

  /** Re-insert a deleted transaction with its original data (Undo delete) */
  const restoreTransaction = async (txn: Transaction) => {
    try {
      const res = await apiFetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: txn.description,
          amount: txn.amount,
          category: txn.category || "Other",
          type: txn.type,
          created_at: txn.created_at,
        }),
      });
      if (!res.ok) throw new Error("Restore failed");
      success("Transaction restored");
      await fetchTransactions();
    } catch {
      toastError("Failed to restore transaction");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    const target = transactions.find((t) => t.id === deleteTargetId);
    const id = deleteTargetId;
    setDeleteTargetId(null);
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    try {
      const res = await apiFetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      showToast(
        "Transaction deleted",
        "success",
        undefined,
        7000,
        target ? { label: "Undo", onClick: () => restoreTransaction(target) } : undefined
      );
    } catch {
      toastError("Failed to delete transaction");
      await fetchTransactions();
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchSearch =
      searchQuery === "" ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.category && t.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchType =
      selectedType === "all" ||
      (selectedType === "expense" && t.type === "expense") ||
      (selectedType === "income" && t.type === "income");

    return matchSearch && matchType;
  });

  if (authLoading) {
    return (
      <div className="auth-loading-screen">
        Loading session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PasswordGate onSuccess={() => {}} />;
  }

  const hasNoData = !isLoading && transactions.length === 0;

  return (
    <div className="page-wrapper">
      <Navigation />

      <main className="app-container">
        {/* ONBOARDING STATE for first-time users */}
        {hasNoData ? (
          <section className="panel empty-state empty-state-cta" style={{ marginTop: "1.25rem" }}>
            <div className="icon-badge icon-badge-primary" style={{ width: "3.5rem", height: "3.5rem", margin: "0 auto 1rem auto" }}>
              <WalletIcon size={24} />
            </div>
            <h2 className="empty-state-title" style={{ fontSize: "1rem" }}>
              No data yet — record your first transaction
            </h2>
            <p className="empty-state-desc">
              Track an expense or income and your balance, insights, and analytics will appear here.
            </p>
            <div className="onboarding-actions">
              <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">
                <PlusIcon size={14} />
                <span>Record First Transaction</span>
              </button>
              <Link href="/ai-copilot" className="btn btn-secondary">
                <SparklesIcon size={14} />
                <span>Try AI Copilot</span>
              </Link>
            </div>
          </section>
        ) : (
          <section className="hero-grid">
            {/* Net Balance Card */}
            <div className="hero-card-main">
              <div>
                <div className="card-eyebrow">
                  <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <WalletIcon size={14} color="#818cf8" />
                    <span>Estimated Net Balance</span>
                  </span>
                  <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: totalBalance >= 0 ? "var(--color-income)" : "var(--color-expense)" }}>
                    {totalBalance >= 0 ? "Positive Flow" : "Deficit"}
                  </span>
                </div>
                <div className="card-value">
                  Rp {totalBalance.toLocaleString("id-ID")}
                </div>
              </div>

              <div className="card-footer cashflow-split">
                <div>
                  <span className="cashflow-item-label">Month Inflow</span>
                  <div className="cashflow-item-val" style={{ color: "var(--income-text)" }}>
                    <TrendingUpIcon size={14} />
                    <span>+Rp {monthlyIncome.toLocaleString("id-ID")}</span>
                  </div>
                </div>
                <div>
                  <span className="cashflow-item-label">Month Outflow</span>
                  <div className="cashflow-item-val" style={{ color: "var(--expense-text)" }}>
                    <TrendingDownIcon size={14} />
                    <span>-Rp {monthlyExpense.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Expense */}
            <div className="hero-card-metric">
              <div>
                <div className="card-eyebrow">
                  <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <TrendingDownIcon size={14} color="var(--expense-text)" />
                    <span>{"Today's Expense"}</span>
                  </span>
                </div>
                <div className="card-value card-value-expense">
                  Rp {todayExpense.toLocaleString("id-ID")}
                </div>
              </div>
              <div className="card-footer">
                {transactions.filter((t) => t.type === "expense" && isTodayInJakarta(t.created_at)).length} entries today
              </div>
            </div>

            {/* Today's Income */}
            <div className="hero-card-metric">
              <div>
                <div className="card-eyebrow">
                  <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <TrendingUpIcon size={14} color="var(--income-text)" />
                    <span>{"Today's Income"}</span>
                  </span>
                </div>
                <div className="card-value card-value-income">
                  Rp {todayIncome.toLocaleString("id-ID")}
                </div>
              </div>
              <div className="card-footer">
                {transactions.filter((t) => t.type === "income" && isTodayInJakarta(t.created_at)).length} entries today
              </div>
            </div>
          </section>
        )}

        {/* QUICK ACTION TILES */}
        <section className="quick-actions-grid">
          <Link href="/ai-copilot" className="quick-action-tile">
            <div className="icon-badge icon-badge-primary" style={{ width: "2.5rem", height: "2.5rem" }}>
              <SparklesIcon size={18} />
            </div>
            <div>
              <div className="quick-action-label">AI Copilot</div>
              <div className="quick-action-sub">Natural language parsing</div>
            </div>
          </Link>

          <Link href="/ai-copilot#ocr-scanner" className="quick-action-tile">
            <div className="icon-badge icon-badge-primary" style={{ width: "2.5rem", height: "2.5rem" }}>
              <UploadCloudIcon size={18} />
            </div>
            <div>
              <div className="quick-action-label">Scan Receipt</div>
              <div className="quick-action-sub">OCR photo recognition</div>
            </div>
          </Link>

          <Link href="/transactions" className="quick-action-tile">
            <div className="icon-badge icon-badge-income" style={{ width: "2.5rem", height: "2.5rem" }}>
              <ReceiptIcon size={18} />
            </div>
            <div>
              <div className="quick-action-label">View Records</div>
              <div className="quick-action-sub">All {transactions.length} records</div>
            </div>
          </Link>

          <Link href="/analytics" className="quick-action-tile">
            <div className="icon-badge icon-badge-primary" style={{ width: "2.5rem", height: "2.5rem" }}>
              <TrendingUpIcon size={18} />
            </div>
            <div>
              <div className="quick-action-label">Analytics</div>
              <div className="quick-action-sub">Spending breakdown</div>
            </div>
          </Link>
        </section>

        {/* RECENT TRANSACTIONS PANEL */}
        <section style={{ marginTop: "1.5rem" }}>
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">
                  <ReceiptIcon size={18} color="#818cf8" />
                  <span>Recent Transactions</span>
                </h2>
                <p className="panel-subtitle">Your most recent activity</p>
              </div>
              <Link
                href="/transactions"
                style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-primary)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
              >
                <span>View All Records ({transactions.length})</span>
                <ArrowUpRightIcon size={14} />
              </Link>
            </div>

            {/* Search & Type Toolbar */}
            <div className="toolbar-row">
              <div className="search-input-wrap">
                <div className="search-icon-inside">
                  <SearchIcon size={15} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter recent transactions..."
                  className="input-text has-icon"
                  aria-label="Search transactions"
                />
              </div>

              <div className="segmented-group">
                <button
                  onClick={() => setSelectedType("all")}
                  className={`segmented-btn ${selectedType === "all" ? "active" : ""}`}
                  aria-pressed={selectedType === "all"}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedType("expense")}
                  className={`segmented-btn ${selectedType === "expense" ? "active" : ""}`}
                  aria-pressed={selectedType === "expense"}
                  style={selectedType === "expense" ? { color: "var(--expense-text)" } : {}}
                >
                  <TrendingDownIcon size={12} />
                  <span>Expenses</span>
                </button>
                <button
                  onClick={() => setSelectedType("income")}
                  className={`segmented-btn ${selectedType === "income" ? "active" : ""}`}
                  aria-pressed={selectedType === "income"}
                  style={selectedType === "income" ? { color: "var(--income-text)" } : {}}
                >
                  <TrendingUpIcon size={12} />
                  <span>Income</span>
                </button>
              </div>
            </div>

            {/* Transactions List */}
            {isLoading ? (
              <SkeletonList count={4} label="Loading transactions..." />
            ) : filteredTransactions.length === 0 ? (
              <div className="empty-state">
                <div className="icon-badge icon-badge-neutral" style={{ width: "3rem", height: "3rem", margin: "0 auto 0.75rem auto" }}>
                  <ReceiptIcon size={20} />
                </div>
                <h3 className="empty-state-title">No transactions found</h3>
                <p className="empty-state-desc">
                  {searchQuery || selectedType !== "all"
                    ? "No records matched your search."
                    : "Start tracking by recording your first transaction."}
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="btn btn-primary btn-sm"
                >
                  <PlusIcon size={14} />
                  <span>Record Transaction</span>
                </button>
              </div>
            ) : (
              <div className="transaction-list">
                {filteredTransactions.slice(0, 5).map((t) => (
                  <div key={t.id} className="transaction-card">
                    <div className="transaction-info-main">
                      <div
                        className={`icon-badge ${t.type === "income" ? "icon-badge-income" : "icon-badge-neutral"}`}
                        style={{ width: "2.25rem", height: "2.25rem" }}
                      >
                        <CategoryIcon category={t.category} size={16} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="transaction-desc">{t.description}</div>
                        <div className="transaction-meta">
                          <span className="category-tag">{t.category || "Other"}</span>
                          <span>•</span>
                          <span>
                            {(() => {
                              try {
                                const d = new Date(t.created_at);
                                if (isNaN(d.getTime())) return "";
                                return new Intl.DateTimeFormat("en-US", {
                                  timeZone: "Asia/Jakarta",
                                  month: "short",
                                  day: "numeric",
                                }).format(d);
                              } catch {
                                return "";
                              }
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="transaction-amount-side">
                      <div className={`amount-display ${t.type === "income" ? "amount-income" : "amount-expense"}`}>
                        {t.type === "income" ? "+" : "-"}Rp {t.amount.toLocaleString("id-ID")}
                      </div>

                      <div className="action-links">
                        <button
                          onClick={() => setEditTransaction(t)}
                          className="action-btn-icon"
                          title="Edit transaction"
                          aria-label={`Edit ${t.description}`}
                        >
                          <EditIcon size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(t.id)}
                          className="action-btn-icon delete"
                          title="Delete transaction"
                          aria-label={`Delete ${t.description}`}
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* MODALS */}
      <TransactionForm
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddTransaction}
        mode="add"
      />

      {editTransaction && (
        <TransactionForm
          transaction={editTransaction}
          isOpen={Boolean(editTransaction)}
          onClose={() => setEditTransaction(null)}
          onSubmit={handleEditSave}
          mode="edit"
        />
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        title="Delete Transaction"
        message="Are you sure you want to permanently delete this transaction record?"
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
