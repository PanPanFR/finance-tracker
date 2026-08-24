"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingDownIcon,
  TrendingUpIcon,
  XIcon,
  PlusIcon,
  EditIcon,
  RefreshCwIcon,
  CategoryIcon,
} from "./Icons";
import { useModalAccessibility } from "../hooks/useModalAccessibility";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category?: string;
  created_at: string;
}

interface FormErrors {
  description?: string;
  amount?: string;
}

interface TransactionFormProps {
  transaction?: Transaction;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: Omit<Transaction, "id" | "created_at">) => void | Promise<void>;
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
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const dialogRef = useModalAccessibility<HTMLDivElement>(isOpen, onClose);

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
    setErrors({});
    setSubmitting(false);
  }, [transaction, mode, isOpen]);

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!formData.description.trim()) {
      next.description = "Description is required.";
    }
    if (formData.amount.trim() === "" || isNaN(parseFloat(formData.amount))) {
      next.amount = "Amount is required.";
    } else if (parseFloat(formData.amount) <= 0) {
      next.amount = "Amount must be greater than 0.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category || "Other",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const addPreset = (val: number) => {
    const current = parseFloat(formData.amount) || 0;
    setFormData((prev) => ({ ...prev, amount: (current + val).toString() }));
    setErrors((prev) => ({ ...prev, amount: undefined }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-form-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "520px" }}
      >
        <div className="modal-header-row">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              className={`icon-badge ${mode === "add" ? "icon-badge-primary" : "icon-badge-neutral"}`}
              style={{ width: "2.25rem", height: "2.25rem" }}
            >
              {mode === "add" ? <PlusIcon size={18} /> : <EditIcon size={18} />}
            </div>
            <div>
              <h2 id="transaction-form-title" className="modal-title-text" style={{ fontSize: "1rem" }}>
                {mode === "add" ? "Record Transaction" : "Edit Transaction"}
              </h2>
              <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                {mode === "add" ? "Add an expense or income entry" : "Modify existing record details"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="toast-close" aria-label="Close dialog" disabled={submitting}>
            <XIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Type Toggle */}
          <div className="form-group">
            <label className="form-label">Type</label>
            <div className="segmented-group" style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "expense" })}
                className={`segmented-btn ${formData.type === "expense" ? "active" : ""}`}
                aria-pressed={formData.type === "expense"}
                style={formData.type === "expense" ? { color: "var(--expense-text)" } : {}}
              >
                <TrendingDownIcon size={14} className="icon-wrap" />
                <span>Expense</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "income" })}
                className={`segmented-btn ${formData.type === "income" ? "active" : ""}`}
                aria-pressed={formData.type === "income"}
                style={formData.type === "income" ? { color: "var(--income-text)" } : {}}
              >
                <TrendingUpIcon size={14} className="icon-wrap" />
                <span>Income</span>
              </button>
            </div>
          </div>

          {/* Amount Field & Presets */}
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
              <label htmlFor="transaction-amount" className="form-label" style={{ marginBottom: 0 }}>Amount (IDR)</label>
              {formData.amount && !isNaN(Number(formData.amount)) && Number(formData.amount) > 0 && (
                <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--color-primary)", fontWeight: 700 }}>
                  Rp {Number(formData.amount).toLocaleString("id-ID")}
                </span>
              )}
            </div>
            <input
              id="transaction-amount"
              type="number"
              value={formData.amount}
              onChange={(e) => {
                setFormData({ ...formData, amount: e.target.value });
                if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }));
              }}
              className={`input-text ${errors.amount ? "invalid" : ""}`}
              style={{ fontSize: "1rem", fontWeight: 700, fontFamily: "var(--font-mono)" }}
              placeholder="0"
              min="1"
              step="any"
              autoFocus={mode === "add"}
              aria-invalid={Boolean(errors.amount)}
              aria-describedby={errors.amount ? "transaction-amount-error" : undefined}
            />
            {errors.amount && (
              <p id="transaction-amount-error" className="field-error">{errors.amount}</p>
            )}

            <div className="preset-pills">
              {AMOUNT_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => addPreset(p.value)}
                  className="preset-pill-btn"
                  aria-label={`Add ${p.value.toLocaleString("id-ID")} to amount`}
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
                  aria-label="Clear amount"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="transaction-description" className="form-label">Description / Note</label>
            <input
              id="transaction-description"
              type="text"
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
              }}
              className={`input-text ${errors.description ? "invalid" : ""}`}
              placeholder="e.g. Starbucks Latte, KRL Ticket, Freelance Fee"
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? "transaction-description-error" : undefined}
            />
            {errors.description && (
              <p id="transaction-description-error" className="field-error">{errors.description}</p>
            )}
          </div>

          {/* Category Selector with Category SVG Icons */}
          <div className="form-group">
            <label className="form-label">Category</label>
            <div className="category-select-grid" role="radiogroup" aria-label="Transaction category">
              {CATEGORIES.map((cat) => {
                const isSelected = formData.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat })}
                    className={`category-select-btn ${isSelected ? "active" : ""}`}
                    role="radio"
                    aria-checked={isSelected}
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
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <RefreshCwIcon size={14} className="icon-wrap spin-animation" />
                  <span>Saving...</span>
                </>
              ) : mode === "add" ? (
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
