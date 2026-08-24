"use client";

import React, { useEffect, useState, useCallback } from "react";
import Navigation from "../../components/Navigation";
import { useAuth } from "../../contexts/AuthContext";
import PasswordGate from "../../components/PasswordGate";
import TransactionForm from "../../components/TransactionForm";
import ConfirmModal from "../../components/ConfirmModal";
import { SkeletonList } from "../../components/Skeleton";
import { useToast } from "../../components/Toast";
import { apiFetch } from "../../lib/client-api";
import {
  SearchIcon,
  DownloadIcon,
  EditIcon,
  TrashIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  CategoryIcon,
  ReceiptIcon,
  RefreshCwIcon,
} from "../../components/Icons";

type Transaction = {
  id: string;
  description: string;
  amount: number;
  created_at: string;
  category?: string;
  type: "income" | "expense";
};

const PAGE_SIZE = 50;

/** Neutralize CSV formula injection (=, +, -, @, tab prefixes) */
const sanitizeCsvValue = (value: string) => value.replace(/^([=+\-@\t\r])/, "'$1");

export default function TransactionsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState<"all" | "expense" | "income">("all");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");

  // Pagination (render window)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Modals
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
      toastError("Failed to fetch transactions list");
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    if (isAuthenticated) fetchTransactions();
  }, [isAuthenticated, fetchTransactions]);

  useEffect(() => {
    const handleRefresh = () => fetchTransactions();
    window.addEventListener("transaction-added", handleRefresh);
    return () => window.removeEventListener("transaction-added", handleRefresh);
  }, [fetchTransactions]);

  // Reset the render window whenever filters or sorting change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, selectedCategory, selectedType, sortBy]);

  const formatDateLiteral = (iso: string) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "";
      return new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Jakarta",
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(d);
    } catch {
      return "";
    }
  };

  const formatTimeLiteral = (iso: string) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "";
      return new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(d);
    } catch {
      return "";
    }
  };

  const filtered = transactions
    .filter((t) => {
      const matchSearch =
        searchQuery === "" ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.category && t.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory = selectedCategory === "All" || t.category === selectedCategory;

      const matchType =
        selectedType === "all" ||
        (selectedType === "expense" && t.type === "expense") ||
        (selectedType === "income" && t.type === "income");

      return matchSearch && matchCategory && matchType;
    })
    .sort((a, b) => {
      if (sortBy === "date-desc") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "date-asc") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === "amount-desc") {
        return b.amount - a.amount;
      }
      if (sortBy === "amount-asc") {
        return a.amount - b.amount;
      }
      return 0;
    });

  const visibleTransactions = filtered.slice(0, visibleCount);

  const filteredIncome = filtered
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const filteredExpense = filtered
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const filteredNet = filteredIncome - filteredExpense;

  const uniqueCategories = [
    "All",
    ...Array.from(new Set(transactions.map((t) => t.category).filter((cat): cat is string => Boolean(cat)))),
  ];

  const exportToCSV = () => {
    if (filtered.length === 0) {
      toastError("No data available to export");
      return;
    }

    const headers = ["ID", "Date (Jakarta)", "Time", "Description", "Category", "Type", "Amount (IDR)"];
    const rows = filtered.map((t) => [
      `"${sanitizeCsvValue(t.id)}"`,
      `"${sanitizeCsvValue(formatDateLiteral(t.created_at))}"`,
      `"${sanitizeCsvValue(formatTimeLiteral(t.created_at))}"`,
      `"${sanitizeCsvValue(t.description.replace(/"/g, '""'))}"`,
      `"${sanitizeCsvValue((t.category || "Other").replace(/"/g, '""'))}"`,
      `"${sanitizeCsvValue(t.type)}"`,
      t.amount,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transactions_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success("CSV export downloaded!");
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

  if (authLoading) {
    return (
      <div className="auth-loading-screen">
        Loading ledger...
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
        {/* Page Header */}
        <div className="page-header-row">
          <div>
            <div className="page-title-group">
              <div className="icon-badge icon-badge-primary" style={{ width: "2rem", height: "2rem" }}>
                <ReceiptIcon size={16} />
              </div>
              <h1 className="page-title">
                Transaction Ledger ({filtered.length})
              </h1>
            </div>
            <p className="page-subtitle">
              Complete record of all income and expenses with filtering and export.
            </p>
          </div>

          <button
            onClick={exportToCSV}
            className="btn btn-secondary btn-sm"
          >
            <DownloadIcon size={14} className="icon-wrap" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Summary Filter Strip */}
        <section className="stat-strip">
          <div className="panel stat-card">
            <div className="stat-card-head">
              <span className="card-eyebrow" style={{ marginBottom: 0 }}>Filtered Outflow</span>
              <TrendingDownIcon size={16} color="var(--expense-text)" />
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--expense-text)", marginTop: "0.35rem" }}>
              -Rp {filteredExpense.toLocaleString("id-ID")}
            </div>
          </div>

          <div className="panel stat-card">
            <div className="stat-card-head">
              <span className="card-eyebrow" style={{ marginBottom: 0 }}>Filtered Inflow</span>
              <TrendingUpIcon size={16} color="var(--income-text)" />
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--income-text)", marginTop: "0.35rem" }}>
              +Rp {filteredIncome.toLocaleString("id-ID")}
            </div>
          </div>

          <div className="panel stat-card">
            <div className="stat-card-head">
              <span className="card-eyebrow" style={{ marginBottom: 0 }}>Filtered Net</span>
              <ReceiptIcon size={16} color="#818cf8" />
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: filteredNet >= 0 ? "#818cf8" : "var(--expense-text)", marginTop: "0.35rem" }}>
              {filteredNet >= 0 ? "+" : ""}Rp {filteredNet.toLocaleString("id-ID")}
            </div>
          </div>
        </section>

        {/* Filters Toolbar */}
        <section className="panel" style={{ marginBottom: "1.5rem" }}>
          <div className="toolbar-row">
            <div className="search-input-wrap">
              <div className="search-icon-inside">
                <SearchIcon size={15} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or category..."
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
                Expenses
              </button>
              <button
                onClick={() => setSelectedType("income")}
                className={`segmented-btn ${selectedType === "income" ? "active" : ""}`}
                aria-pressed={selectedType === "income"}
                style={selectedType === "income" ? { color: "var(--income-text)" } : {}}
              >
                Income
              </button>
            </div>

            <div style={{ minWidth: "140px" }}>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as "date-desc" | "date-asc" | "amount-desc" | "amount-asc"
                  )
                }
                className="input-text"
                style={{ padding: "0.55rem 0.85rem", cursor: "pointer" }}
                aria-label="Sort transactions"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-desc">Highest Amount</option>
                <option value="amount-asc">Lowest Amount</option>
              </select>
            </div>
          </div>

          {/* Category Chips Bar */}
          <div className="category-pills-bar" style={{ marginBottom: 0 }}>
            {uniqueCategories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`category-pill ${isSelected ? "active" : ""}`}
                  aria-pressed={isSelected}
                >
                  {cat !== "All" && <CategoryIcon category={cat} size={12} />}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Ledger List */}
        <section>
          {isLoading ? (
            <SkeletonList count={6} label="Loading transactions..." />
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="icon-badge icon-badge-neutral" style={{ width: "3.5rem", height: "3.5rem", margin: "0 auto 1rem auto" }}>
                <ReceiptIcon size={24} />
              </div>
              <h3 className="empty-state-title">No transactions found</h3>
              <p className="empty-state-desc">
                {searchQuery || selectedCategory !== "All" || selectedType !== "all"
                  ? "No transactions match the selected filter criteria."
                  : "No transactions recorded yet in your account."}
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setSelectedType("all");
                }}
                className="btn btn-secondary btn-sm"
              >
                <RefreshCwIcon size={12} />
                <span>Reset Filters</span>
              </button>
            </div>
          ) : (
            <>
              <div className="transaction-list">
                {visibleTransactions.map((t) => (
                  <div key={t.id} className="transaction-card">
                    <div className="transaction-info-main">
                      <div
                        className={`icon-badge ${t.type === "income" ? "icon-badge-income" : "icon-badge-neutral"}`}
                        style={{ width: "2.5rem", height: "2.5rem" }}
                      >
                        <CategoryIcon category={t.category} size={18} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="transaction-desc" style={{ fontSize: "0.875rem" }}>
                          {t.description}
                        </div>
                        <div className="transaction-meta">
                          <span className="category-tag">{t.category || "Other"}</span>
                          <span>•</span>
                          <span>{formatDateLiteral(t.created_at)}</span>
                          <span>•</span>
                          <span>{formatTimeLiteral(t.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="transaction-amount-side">
                      <div className={`amount-display ${t.type === "income" ? "amount-income" : "amount-expense"}`} style={{ fontSize: "0.9375rem" }}>
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

              {/* Pagination controls */}
              <div className="load-more-row">
                {filtered.length > visibleTransactions.length && (
                  <button
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="btn btn-secondary btn-sm"
                  >
                    Load More ({filtered.length - visibleTransactions.length} remaining)
                  </button>
                )}
                <span className="load-more-note">
                  Showing {visibleTransactions.length} of {filtered.length} transactions
                </span>
              </div>
            </>
          )}
        </section>
      </main>

      {/* Modals */}
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
