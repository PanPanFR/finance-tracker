"use client";

import React, { useEffect, useState, type ChangeEvent } from "react";
import { supabase } from "../lib/supabaseClient";
import { parseTransaction } from "../lib/aiParser";
import { scanReceipt } from "../lib/ocr";
import { askReport } from "../lib/aiReport";
import { useAuth } from "../contexts/AuthContext";
import AuthForm from "../components/AuthForm";
import UserProfile from "../components/UserProfile";
import TransactionForm from "../components/TransactionForm";

type Transaction = {
  id: string;
  description: string;
  amount: number;
  created_at: string;
  quantity?: number;
  unit_price?: number;
  category?: string;
  type: "income" | "expense";
  user_id?: string;
};

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [input, setInput] = useState("");
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<string>("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loadingReport, setLoadingReport] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [optimistic, setOptimistic] = useState<Transaction[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

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
    if (!user) {
      console.error("User not authenticated");
      return;
    }
    setIsLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
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
    if (!user) return;
    
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
          user_id: user.id,
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
        user_id: user.id,
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

  // Handler buka edit modal
  const openEditModal = (t: Transaction) => {
    setEditTransaction(t);
    setIsEditModalOpen(true);
  };

  // Handler tutup edit modal
  const closeEditModal = () => {
    setEditTransaction(null);
    setIsEditModalOpen(false);
  };

  // Handler simpan edit
  const handleEditSave = async (transactionData: Omit<Transaction, 'id' | 'created_at'>) => {
    if (!editTransaction) return;
    if (!supabase) {
      console.error("Supabase client not initialized");
      return;
    }
    
    const { error } = await supabase.from("transactions").update({
      description: transactionData.description,
      amount: transactionData.amount,
      category: transactionData.category || "Lainnya",
      type: transactionData.type || "expense",
      quantity: transactionData.quantity,
    }).eq("id", editTransaction.id);
    
    if (error) {
      alert("Gagal update transaksi: " + error.message);
      return;
    }
    
    closeEditModal();
    await fetchTransactions();
  };

  // Handler buka add modal
  const openAddModal = () => {
    setIsAddModalOpen(true);
  };

  // Handler tutup add modal
  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  // Handler tambah transaksi
  const handleAddTransaction = async (transactionData: Omit<Transaction, 'id' | 'created_at'>) => {
    if (!user) return;
    
    const { error } = await supabase.from("transactions").insert({
      ...transactionData,
      user_id: user.id,
      created_at: new Date().toISOString(),
    });
    
    if (error) {
      alert("Gagal menambah transaksi: " + error.message);
      return;
    }
    
    closeAddModal();
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

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="app-loading-container">
        <div className="app-loading-content">
          <div className="app-loading-logo">
            <div className="logo-icon">💰</div>
            <h1 className="logo-title">Finance Tracker</h1>
          </div>
          
          <div className="app-loading-animation">
            <div className="loading-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          </div>
          
          <p className="app-loading-text">Memuat aplikasi...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!user) {
    return <AuthForm onAuthSuccess={() => {}} />;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header-row">
        <h1 className="dashboard-title">AI Finance Tracker</h1>
        <UserProfile user={user} onLogout={() => {}} />
      </div>
      <div className="dashboard-grid">
        {/* Left: Summary & Transactions */}
        <section className="dashboard-main-left">
          <div className="spending-income-blue-box">
            <div className="spending-income-inner">
              <div className="spending-box blue-box-item">
                <div className="spending-label">Pengeluaran Hari Ini</div>
                <div className="spending-amount">Rp {todaySpending.toLocaleString('id-ID')}</div>
              </div>
              <div className="income-box blue-box-item">
                <div className="income-label">Pendapatan Hari Ini</div>
                <div className="income-amount">Rp {transactions.filter(t => t.type === 'income' && t.created_at.startsWith(today)).reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString('id-ID')}</div>
              </div>
            </div>
          </div>
          {/* Recent Transactions Section */}
          <div className="transactions-section card-hover">
            <h3 className="transactions-title">Transaksi Terbaru</h3>
            {isLoading ? (
              <div className="transactions-loading">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="transaction-item card-hover animate-pulse">
                    <div className="transaction-icon bg-gray-200"></div>
                    <div className="transaction-info">
                      <div className="transaction-name bg-gray-200 h-4 rounded w-24"></div>
                      <div className="transaction-category bg-gray-200 h-3 rounded w-16"></div>
                    </div>
                    <div className="transaction-amount bg-gray-200 h-4 rounded w-20"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
              {transactions.length === 0 ? (
                <div className="transactions-empty">
                  <h3>Belum ada transaksi hari ini</h3>
                  <p>Yuk, catat transaksi pertamamu dengan AI Assistant!</p>
                </div>
              ) : (
                <>
                <div className="transactions-list">
                    {transactions.slice(0, 5).map((t) => (
                      <div key={t.id} className="transaction-item-compact card-hover">
                        <div className="transaction-icon-compact" style={{
                        background: t.type === 'income' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: t.type === 'income' ? '#10b981' : '#ef4444'
                      }}>
                        {t.type === 'income' ? '💰' : '💸'}
                      </div>
                        <div className="transaction-info-compact">
                          <div className="transaction-name-compact">{t.description}</div>
                          <div className="transaction-category-compact">
                            {t.category || 'Lainnya'} • {new Date(t.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </div>
                      </div>
                        <div className={`transaction-amount-compact ${t.type === 'income' ? 'income' : 'expense'}`}>
                        {t.type === 'income' ? '+' : '-'}Rp {(t.amount || 0).toLocaleString('id-ID')}
                      </div>
                    </div>
                  ))}
                </div>
                  <div className="transactions-see-all-wrapper">
                    <a href="/transactions" className="btn-secondary transactions-see-all-btn">Lihat Semua Transaksi →</a>
                  </div>
                </>
              )}
              </>
            )}
          </div>
        </section>
        {/* Right: AI Assistant */}
        <section className="dashboard-main-right">
        <div className="ai-assistant-card card-hover">
          <h3 className="ai-assistant-title">AI Assistant</h3>
          <div className="ai-assistant-content">
            {/* AI Text Input */}
            <div className="ai-input-section card-hover">
              <h4 className="ai-section-title">Ketik dengan AI</h4>
              <div className="ai-input-group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="e.g., makan bakso 20rb, beli bensin 50rb"
                  className="ai-text-input"
                  onKeyPress={(e) => e.key === 'Enter' && handleManualAdd()}
                />
                <button
                  onClick={handleManualAdd}
                  disabled={loadingAdd}
                  className="ai-send-button"
                >
                  {loadingAdd ? "Memproses..." : "Kirim"}
                </button>
              </div>
            </div>
            
            {/* Upload Receipt */}
            <div className="ai-upload-section card-hover">
              <h4 className="ai-section-title">Upload Struk</h4>
              <div className="ai-upload-group">
                <label htmlFor="receipt-upload" className="ai-upload-label">
                  <div className="ai-upload-icon">📷</div>
                  <div className="ai-upload-text">
                    <span className="ai-upload-title">Klik untuk upload struk</span>
                    <span className="ai-upload-subtitle">atau drag & drop gambar</span>
                  </div>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="ai-file-input"
                  id="receipt-upload"
                />
                {ocrProgress && (
                  <div className="ai-upload-progress">
                    <div className="ai-upload-progress-text">{ocrProgress}</div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Report Section */}
            <div className="ai-report-section card-hover">
              <h4 className="ai-section-title">Tanya AI Report</h4>
              <div className="ai-report-group">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., berapa pengeluaran bulan ini?, kategori mana yang paling besar?"
                  className="ai-report-input"
                  onKeyPress={(e) => e.key === 'Enter' && handleAskReport()}
                />
                <button
                  onClick={handleAskReport}
                  disabled={loadingReport}
                  className="ai-report-button"
                >
                  {loadingReport ? "Memproses..." : "Tanya"}
                </button>
              </div>
              {answer && (
                <div className="ai-report-answer">
                  <div className="ai-report-answer-content">{answer}</div>
                </div>
              )}
            </div>
          </div>
        </div>
        </section>
      </div>
      {/* Modal Add/Edit Transaction */}
      <TransactionForm
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        onSubmit={handleAddTransaction}
        mode="add"
      />
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
