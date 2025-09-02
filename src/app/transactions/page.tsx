"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";
import TransactionForm from "../../components/TransactionForm";

type Transaction = {
  id: string;
  description: string;
  amount: number;
  created_at: string;
  category?: string;
  type: "income" | "expense";
};

const CATEGORY_OPTIONS = [
  "All",
  "Makanan & Minuman",
  "Transportasi",
  "Tagihan",
  "Hiburan",
  "Belanja",
  "Kesehatan",
  "Pendidikan",
  "Lainnya",
];

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (user) fetchTransactions();
    // eslint-disable-next-line
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) setTransactions(data as Transaction[]);
    setIsLoading(false);
  };

  // Render date/time with Asia/Jakarta timezone to avoid month/day swap
  const formatDateLiteral = (iso: string) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "";
      return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric' })
        .format(d)
        .replace(/\./g, ''); // normalize month abbreviations
    } catch { return ""; }
  };

  const formatTimeLiteral = (iso: string) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "";
      return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false })
        .format(d);
    } catch { return ""; }
  };

  // Filtered transactions
  const filtered = selectedCategory === "All"
    ? transactions
    : transactions.filter(t => t.category === selectedCategory);

  // Unique categories from data
  const uniqueCategories = [
    "All",
    ...Array.from(new Set(transactions.map(t => t.category).filter((cat): cat is string => Boolean(cat))))
  ];

  // Modal handlers
  const openEditModal = (t: Transaction) => {
    setEditTransaction(t);
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => {
    setEditTransaction(null);
    setIsEditModalOpen(false);
  };
  const handleEditSave = async (transactionData: Omit<Transaction, 'id' | 'created_at'>) => {
    if (!editTransaction) return;
    const { error } = await supabase.from("transactions").update({
      description: transactionData.description,
      amount: transactionData.amount,
      category: transactionData.category || "Lainnya",
      type: transactionData.type || "expense",
    }).eq("id", editTransaction.id);
    if (error) {
      alert("Gagal update transaksi: " + error.message);
      return;
    }
    closeEditModal();
    await fetchTransactions();
  };

  // Delete handler
  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus transaksi ini?")) return;
    // Optimistic remove
    setTransactions(prev => prev.filter(t => t.id !== id));
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      alert("Gagal menghapus transaksi di database: " + error.message);
      await fetchTransactions();
      return;
    }
    await fetchTransactions();
  };

  return (
    <div className="transactions-page-container">
      <div className="transactions-header">
        <Link href="/" className="btn-secondary">← Kembali ke Dashboard</Link>
        <h1 className="transactions-title">Semua Transaksi</h1>
      </div>
      {/* Filter kategori */}
      <div className="transactions-filter-row">
        {uniqueCategories.map(cat => (
          <button
            key={cat}
            className={`transactions-filter-btn${selectedCategory === cat ? " active" : ""}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="transactions-loading">Memuat...</div>
      ) : filtered.length === 0 ? (
        <div className="transactions-empty">
          <h3>
            {selectedCategory === "All" 
              ? "Belum ada transaksi" 
              : `Tidak ada transaksi dalam kategori "${selectedCategory}"`
            }
          </h3>
          <p>
            {selectedCategory === "All" 
              ? "Mulai mencatat keuanganmu dengan menambahkan transaksi pertama!" 
              : "Coba pilih kategori lain atau tambahkan transaksi baru."
            }
          </p>
        </div>
      ) : (
        <div className="transactions-card-list">
          {filtered.map((t) => (
            <div key={t.id} className="transaction-card">
              <div className="transaction-card-main">
                <div>
                  <div className="transaction-card-title">{t.description}</div>
                  <div className="transaction-card-date">
                    {formatDateLiteral(t.created_at)} • {formatTimeLiteral(t.created_at)}
                  </div>
                  <div className="transaction-card-badges">
                    {t.category && <span className="badge badge-category">{t.category}</span>}
                    <span className={`badge badge-${t.type}`}>{t.type === "income" ? "Income" : "Expense"}</span>
                  </div>
                </div>
                <div className="transaction-card-amount {t.type}">
                  <span className={t.type === "expense" ? "expense" : "income"}>
                    {t.type === "expense" ? "-" : "+"}Rp {t.amount.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
              <div className="transaction-card-actions">
                <button className="btn-edit" onClick={() => openEditModal(t)}>Edit</button>
                <button className="btn-delete" onClick={() => handleDelete(t.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Modal Edit Transaction */}
      {editTransaction && (
        <TransactionForm
          transaction={editTransaction}
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          onSubmit={handleEditSave}
          mode="edit"
        />
      )}
    </div>
  );
}
