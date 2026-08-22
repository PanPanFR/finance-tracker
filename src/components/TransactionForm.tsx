"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingDownIcon,
  TrendingUpIcon,
  XIcon,
  PlusIcon,
  EditIcon,
  CategoryIcon,
} from "./Icons";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category?: string;
  created_at: string;
}

interface TransactionFormProps {
  transaction?: Transaction;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: Omit<Transaction, "id" | "created_at">) => void;
  mode: "add" | "edit";
}

const CATEGORIES = [
  "Food & Drinks",
  "Transportation",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Health & Medical",
  "Education",
  "Salary & Income",
  "Other",
];

const AMOUNT_PRESETS = [
  { label: "+10k", value: 10000 },
  { label: "+25k", value: 25000 },
  { label: "+50k", value: 50000 },
  { label: "+100k", value: 100000 },
  { label: "+500k", value: 500000 },
  { label: "+1M", value: 1000000 },
];

export default function TransactionForm({
  transaction,
  isOpen,
  onClose,
  onSubmit,
  mode,
}: TransactionFormProps) {
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "expense" as "income" | "expense",
    category: "Food & Drinks",
  });

  useEffect(() => {
    if (transaction && mode === "edit") {
      setFormData({
        description: transaction.description,
        amount: transaction.amount.toString(),
        type: transaction.type,
        category: transaction.category || "Other",
      });
    } else {
      setFormData({
        description: "",
        amount: "",
        type: "expense",
        category: "Food & Drinks",
      });
    }
  }, [transaction, mode, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(formData.amount);
    if (!formData.description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    onSubmit({
      description: formData.description.trim(),
      amount: parsedAmount,
      type: formData.type,
      category: formData.category || "Other",
    });

    onClose();
  };

  const addPreset = (val: number) => {
    const current = parseFloat(formData.amount) || 0;
    setFormData((prev) => ({ ...prev, amount: (current + val).toString() }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
        <div className="modal-header-row">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              className={`icon-badge ${mode === "add" ? "icon-badge-primary" : "icon-badge-neutral"}`}
              style={{ width: "2.25rem", height: "2.25rem" }}
            >
              {mode === "add" ? <PlusIcon size={18} /> : <EditIcon size={18} />}
            </div>
            <div>
              <h2 className="modal-title-text" style={{ fontSize: "1rem" }}>
                {mode === "add" ? "Record Transaction" : "Edit Transaction"}
              </h2>
              <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                {mode === "add" ? "Add an expense or income entry" : "Modify existing record details"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="toast-close" aria-label="Close dialog">
            <XIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Type Toggle */}
          <div className="form-group">
            <label className="form-label">Type</label>
            <div className="segmented-group" style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "expense" })}
                className={`segmented-btn ${formData.type === "expense" ? "active" : ""}`}
                style={formData.type === "expense" ? { color: "#fb7185" } : {}}
              >
                <TrendingDownIcon size={14} className="icon-wrap" />
                <span>Expense</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "income" })}
                className={`segmented-btn ${formData.type === "income" ? "active" : ""}`}
                style={formData.type === "income" ? { color: "#34d399" } : {}}
              >
                <TrendingUpIcon size={14} className="icon-wrap" />
                <span>Income</span>
              </button>
            </div>
          </div>

          {/* Amount Field & Presets */}
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Amount (IDR)</label>
              {formData.amount && !isNaN(Number(formData.amount)) && Number(formData.amount) > 0 && (
                <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--color-primary)", fontWeight: 700 }}>
                  Rp {Number(formData.amount).toLocaleString("id-ID")}
                </span>
              )}
            </div>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="input-text"
              style={{ fontSize: "1rem", fontWeight: 700, fontFamily: "var(--font-mono)" }}
              placeholder="0"
              min="1"
              step="any"
              required
              autoFocus={mode === "add"}
            />

            <div className="preset-pills">
              {AMOUNT_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => addPreset(p.value)}
                  className="preset-pill-btn"
                >
                  {p.label}
                </button>
              ))}
              {formData.amount && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, amount: "" })}
                  className="preset-pill-btn"
                  style={{ color: "var(--text-muted)" }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description / Note</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-text"
              placeholder="e.g. Starbucks Latte, KRL Ticket, Freelance Fee"
              required
            />
          </div>

          {/* Category Selector with Category SVG Icons */}
          <div className="form-group">
            <label className="form-label">Category</label>
            <div className="category-select-grid">
              {CATEGORIES.map((cat) => {
                const isSelected = formData.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat })}
                    className={`category-select-btn ${isSelected ? "active" : ""}`}
                  >
                    <CategoryIcon category={cat} size={15} />
                    <span style={{ fontSize: "0.6875rem" }}>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="modal-actions-row">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              {mode === "add" ? (
                <>
                  <PlusIcon size={14} className="icon-wrap" />
                  <span>Record Entry</span>
                </>
              ) : (
                <>
                  <EditIcon size={14} className="icon-wrap" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
