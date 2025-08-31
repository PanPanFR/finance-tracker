"use client";

import React, { useEffect, useState, type ChangeEvent } from "react";
import { supabase } from "../lib/supabaseClient";
import { parseTransaction } from "../lib/aiParser";
import { scanReceipt } from "../lib/ocr";
import { askReport } from "../lib/aiReport";

type Transaction = {
  id: string;
  description: string;
  amount: number;
  created_at: string;
  quantity?: number;
  unit_price?: number;
  category?: string;
  type?: "income" | "expense";
};

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [input, setInput] = useState("");
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<string>("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loadingReport, setLoadingReport] = useState(false);
  // const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editAmount, setEditAmount] = useState(0);
  const [editQuantity, setEditQuantity] = useState<number | undefined>(undefined);
  const [editLoading, setEditLoading] = useState(false);
  const [editCategory, setEditCategory] = useState("");
  const [editType, setEditType] = useState("expense");
  const [optimistic, setOptimistic] = useState<Transaction[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Filter transactions by category
  const filteredTransactions = selectedCategory === "All" 
    ? transactions 
    : transactions.filter(t => t.category === selectedCategory);

  // Get unique categories for filter buttons
  const uniqueCategories = ["All", ...Array.from(new Set(transactions.map(t => t.category).filter(Boolean)))].filter((cat): cat is string => cat !== undefined);

  // Calculate today's spending
  const today = new Date().toISOString().split('T')[0];
  const todaySpending = transactions
    .filter(t => t.type === 'expense' && t.created_at.startsWith(today))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const fetchTransactions = async () => {
    if (!supabase) {
      console.error("Supabase client not initialized");
      return;
    }
    setIsLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }
    setTransactions((data || []) as Transaction[]);
    setOptimistic([]);
    setIsLoading(false);
  };

  const addTransactionFromText = async (text: string) => {
    setLoadingAdd(true);
    try {
      const parsedItems = await parseTransaction(text);
      if (!parsedItems || parsedItems.length === 0) {
        alert("Gagal parsing transaksi. Coba perjelas teksnya, misal: 'beli bakso 20000'.");
        return;
      }

      const nowIso = new Date().toISOString();
      const transactionsToInsert = parsedItems.map(item => {
        const { description, amount, quantity, category, type } = item;
        const unitPrice = (quantity && amount && quantity > 0) ? amount / quantity : undefined;
        const transactionData = {
          description: description || "",
          amount,
          quantity,
          unit_price: unitPrice,
          category: category || "Lainnya",
          type: type || "expense",
          created_at: nowIso,
        };
        return transactionData;
      });

      // Optimistic UI
      const optimisticItems: Transaction[] = transactionsToInsert.map((t) => ({
        id: `temp-${Math.random().toString(36).slice(2)}`,
        description: t.description,
        amount: t.amount,
        created_at: nowIso,
        quantity: t.quantity,
        unit_price: t.unit_price,
        category: t.category,
        type: t.type,
      }));
      setOptimistic(prev => [...optimisticItems, ...prev]);

      if (!supabase) {
        console.error("Supabase client not initialized");
        return;
      }
      const { error } = await supabase.from("transactions").insert(transactionsToInsert);

      if (error) {
        console.error(error);
        alert("Gagal menyimpan ke database.");
        setOptimistic(prev => prev.filter(x => !x.id.startsWith("temp-")));
        return;
      }

      await fetchTransactions();
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleManualAdd = async () => {
    if (!input.trim()) return;
    await addTransactionFromText(input.trim());
    setInput("");
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrProgress("Memindai struk…");
    try {
      const text = await scanReceipt(file);
      setOcrProgress("Struk terbaca. Memproses dengan AI…");
      await addTransactionFromText(text);
      setOcrProgress("Selesai ✅");
    } catch (err) {
      console.error(err);
      setOcrProgress("Gagal memindai.");
      alert("Gagal memindai struk. Coba foto yang lebih jelas/terang.");
    } finally {
      e.target.value = "";
      setTimeout(() => setOcrProgress(""), 1200);
    }
  };

  const handleAskReport = async () => {
    if (!question.trim()) return;
    setLoadingReport(true);
    try {
      const reply = await askReport(question.trim());
      setAnswer(reply);
    } catch (err) {
      console.error(err);
      alert("Gagal menghasilkan laporan.");
    } finally {
      setLoadingReport(false);
    }
  };

  // Handler hapus transaksi
  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus transaksi ini?")) return;
    if (!supabase) {
      console.error("Supabase client not initialized");
      return;
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
    setOptimistic(prev => prev.filter(t => t.id !== id));
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      alert("Gagal menghapus transaksi di database: " + error.message);
      await fetchTransactions();
      return;
    }
    await fetchTransactions();
  };

  // Handler buka inline edit
  const openEditInline = (t: Transaction) => {
    setEditTransaction(t);
    setEditDesc(t.description);
    setEditAmount(t.amount);
    setEditQuantity(t.quantity);
    setEditCategory(t.category || "");
    setEditType(t.type || "expense");
  };

  // Handler batal inline edit
  const cancelEditInline = () => {
    setEditTransaction(null);
    setEditDesc("");
    setEditAmount(0);
    setEditQuantity(undefined);
    setEditCategory("");
    setEditType("expense");
  };

  // Handler simpan edit
  const handleEditSave = async () => {
    if (!editTransaction) return;
    if (!supabase) {
      console.error("Supabase client not initialized");
      return;
    }
    setEditLoading(true);
    const { error } = await supabase.from("transactions").update({
      description: editDesc,
      amount: editAmount,
      quantity: editQuantity,
      category: editCategory || "Lainnya",
      type: editType || "expense",
    }).eq("id", editTransaction.id);
    setEditLoading(false);
    if (error) {
      alert("Gagal update transaksi: " + error.message);
      return;
    }
    setEditTransaction(null);
    setEditDesc("");
    setEditAmount(0);
    setEditQuantity(undefined);
    setEditCategory("");
    setEditType("expense");
    await fetchTransactions();
  };

  const CATEGORY_OPTIONS = [
    "Makanan & Minuman",
    "Transportasi",
    "Tagihan",
    "Hiburan",
    "Belanja",
    "Kesehatan",
    "Pendidikan",
    "Lainnya",
  ];

  const TYPE_OPTIONS = [
    { label: "Pemasukan", value: "income" },
    { label: "Pengeluaran", value: "expense" },
  ];

  return (
    <div className="dashboard-container">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">AI Finance Tracker</h1>
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Today's Spending Card */}
        <div className="balance-card">
          <div className="balance-label">Pengeluaran Hari Ini</div>
          <div className="balance-amount">
            Rp {todaySpending.toLocaleString('id-ID')}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="transaction-card">
          <h3 className="chart-title">Transaksi Terbaru</h3>
          {isLoading ? (
            <div className="space-y-3">
              <div className="transaction-item animate-pulse">
                <div className="transaction-icon bg-gray-200"></div>
                <div className="transaction-info">
                  <div className="transaction-name bg-gray-200 h-4 rounded w-24"></div>
                  <div className="transaction-category bg-gray-200 h-3 rounded w-16"></div>
                </div>
                <div className="transaction-amount bg-gray-200 h-4 rounded w-20"></div>
              </div>
              <div className="transaction-item animate-pulse">
                <div className="transaction-icon bg-gray-200"></div>
                <div className="transaction-info">
                  <div className="transaction-name bg-gray-200 h-4 rounded w-20"></div>
                  <div className="transaction-category bg-gray-200 h-3 rounded w-20"></div>
                </div>
                <div className="transaction-amount bg-gray-200 h-4 rounded w-16"></div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 4).map((t) => (
                <div key={t.id} className="transaction-item">
                  <div className="transaction-icon" style={{
                    background: t.type === 'income' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: t.type === 'income' ? '#10b981' : '#ef4444'
                  }}>
                    {t.type === 'income' ? '💰' : '💸'}
                  </div>
                  <div className="transaction-info">
                    <div className="transaction-name">{t.description}</div>
                    <div className="transaction-category">{t.category || 'Lainnya'}</div>
                  </div>
                  <div className={`transaction-amount ${t.type === 'income' ? 'income' : 'expense'}`}>
                    {t.type === 'income' ? '+' : '-'}Rp {(t.amount || 0).toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Input Section */}
      <div className="dashboard-grid-full">
        <div className="glass-card">
          <h3 className="section-title">AI Assistant</h3>
          <div className="transaction-forms">
            {/* AI Text Input */}
            <div className="form-section">
              <h4 className="form-subtitle">Ketik dengan AI</h4>
              <div className="input-group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="e.g., makan bakso 20rb, beli bensin 50rb, atau tanya laporan"
                  className="form-input"
                  onKeyPress={(e) => e.key === 'Enter' && handleManualAdd()}
                />
                <button
                  onClick={handleManualAdd}
                  disabled={loadingAdd}
                  className="btn-primary"
                >
                  {loadingAdd ? "Memproses..." : "Kirim"}
                </button>
              </div>
            </div>
            
            {/* Upload Receipt */}
            <div className="form-section">
              <h4 className="form-subtitle">Upload Struk</h4>
              <div className="file-upload-group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="file-input"
                  id="receipt-upload"
                />
                <label htmlFor="receipt-upload" className="file-upload-label">
                  <span className="upload-icon">📷</span>
                  <span className="upload-text">Pilih Foto Struk</span>
                </label>
                {ocrProgress && (
                  <div className="ocr-progress">
                    <span className="progress-icon">⏳</span>
                    <span className="progress-text">{ocrProgress}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Report Section */}
      <div className="dashboard-grid-full">
        <div className="glass-card">
          <h3 className="section-title">Tanya AI</h3>
          <div className="ai-report-form">
            <div className="input-group">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Tanya tentang keuanganmu... (misal: 'berapa pengeluaran bulan ini?', 'kategori apa yang paling besar?')"
                className="form-input"
                onKeyPress={(e) => e.key === 'Enter' && handleAskReport()}
              />
              <button
                onClick={handleAskReport}
                disabled={loadingReport}
                className="btn-primary"
              >
                {loadingReport ? "Memproses..." : "Tanya AI"}
              </button>
            </div>
            {answer && (
              <div className="report-box">
                <div dangerouslySetInnerHTML={{ __html: answer }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All Transactions */}
      <div className="dashboard-grid-full">
        <div className="glass-card">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Semua Transaksi</h3>
          {/* Category Filter Buttons */}
          <div className="category-filters mb-4">
            {uniqueCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`category-filter-btn ${selectedCategory === category ? 'active' : ''}`}
              >
                {category}
              </button>
            ))}
          </div>
          {filteredTransactions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Belum ada transaksi.</p>
          ) : (
            <ul>
              {[...optimistic, ...filteredTransactions].map((t) => (
                <React.Fragment key={t.id}>
                  <li className="transaction-item">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-800">{t.description}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(t.created_at).toLocaleString('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </span>
                      <div className="flex gap-2 mt-2 items-center flex-wrap">
                        {t.category && (
                          <span className="badge badge-category">
                            {t.category}
                          </span>
                        )}
                        {t.type && (
                          <span className={`badge ${t.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                            {t.type === 'income' ? 'Income' : 'Expense'}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="transaction-amount text-center">
                      Rp {Number(t.unit_price || t.amount || 0).toLocaleString("id-ID")}
                    </span>
                    {t.type === 'expense' ? (
                      t.quantity ? (
                        <span className="text-sm text-gray-600" style={{ minWidth: 40, textAlign: 'center' }}>
                          x{t.quantity}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-600" style={{ minWidth: 40, textAlign: 'center', visibility: 'hidden' }}>
                          x1
                        </span>
                      )
                    ) : (
                      <span className="text-sm text-gray-600" style={{ minWidth: 40, textAlign: 'center', visibility: 'hidden' }}>
                        x
                      </span>
                    )}
                    <div className="flex gap-2 ml-2">
                      <button 
                        className="btn-edit" 
                        onClick={() => editTransaction && editTransaction.id === t.id ? cancelEditInline() : openEditInline(t)} 
                        disabled={!!editTransaction && editTransaction.id !== t.id}
                      >
                        {editTransaction && editTransaction.id === t.id ? 'Cancel' : 'Edit'}
                      </button>
                      <button 
                        className="btn-delete" 
                        onClick={() => handleDelete(t.id)} 
                        disabled={!!editTransaction && editTransaction.id !== t.id}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                  {/* Inline edit form */}
                  {editTransaction && editTransaction.id === t.id && (
                    <li className="edit-form-container">
                      <div className="edit-form-header">
                        <div className="edit-form-title">{t.description}</div>
                        <div className="edit-form-subtitle">
                          {new Date(t.created_at).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </div>
                        <div className="edit-form-badges">
                          <span className="edit-form-badge category">{t.category || 'Lainnya'}</span>
                          <span className={`edit-form-badge type ${t.type === 'income' ? 'income' : ''}`}>
                            {t.type === 'income' ? 'Income' : 'Expense'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="edit-form-fields">
                        <div className="edit-form-field">
                          <label className="edit-form-label">Description</label>
                          <input
                            type="text"
                            value={editDesc}
                            onChange={e => setEditDesc(e.target.value)}
                            className="edit-form-input"
                            placeholder="Transaction description"
                          />
                        </div>
                        
                        <div className="edit-form-field">
                          <label className="edit-form-label">Amount (Rp)</label>
                          <input
                            type="number"
                            value={editAmount === undefined || editAmount === null ? "" : editAmount}
                            onChange={e => setEditAmount(e.target.value === "" ? 0 : Number(e.target.value))}
                            className="edit-form-input"
                            placeholder="Amount"
                          />
                        </div>
                        
                        <div className="edit-form-field">
                          <label className="edit-form-label">Quantity (optional)</label>
                          <input
                            type="number"
                            value={editQuantity === undefined || editQuantity === null ? "" : editQuantity}
                            onChange={e => setEditQuantity(e.target.value === "" ? undefined : Number(e.target.value))}
                            className="edit-form-input"
                            placeholder="Quantity"
                          />
                        </div>
                        
                        <div className="edit-form-field">
                          <label className="edit-form-label">Category</label>
                          <select
                            value={editCategory}
                            onChange={e => setEditCategory(e.target.value)}
                            className="edit-form-select"
                          >
                            {CATEGORY_OPTIONS.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="edit-form-field">
                          <label className="edit-form-label">Type</label>
                          <div className="edit-form-radio-group">
                            {TYPE_OPTIONS.map(option => (
                              <label key={option.value} className="edit-form-radio-option">
                                <input
                                  type="radio"
                                  name="editType"
                                  value={option.value}
                                  checked={editType === option.value}
                                  onChange={e => setEditType(e.target.value)}
                                />
                                <span>{option.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="edit-form-actions">
                        <button
                          onClick={handleEditSave}
                          disabled={editLoading}
                          className="edit-form-btn edit-form-btn-primary"
                        >
                          {editLoading ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                          onClick={cancelEditInline}
                          className="edit-form-btn edit-form-btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </li>
                  )}
                </React.Fragment>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
