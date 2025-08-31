import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { parseTransaction } from "../lib/aiParser";

interface TransactionFormProps {
  onAdd: () => void;
}

export const TransactionForm = ({ onAdd }: TransactionFormProps) => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("");
  const [type, setType] = useState("expense");

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

  const addTransactionFromText = async (text: string) => {
    setLoading(true);
    try {
      const parsed = await parseTransaction(text);
      if (!parsed) {
        alert("Gagal parsing transaksi. Coba perjelas teksnya, misal: 'beli bakso 20000'.");
        return;
      }
      let aiCategory = parsed[0]?.category || "";
      setCategory(aiCategory);
      const nowIso = new Date().toISOString();
      const transactionsToInsert = parsed.map(item => ({
        ...item,
        category: category || item.category || "Lainnya",
        type: type || item.type || "expense",
        created_at: item.created_at ? new Date(item.created_at).toISOString() : nowIso,
      }));
      const { error } = await supabase.from("transactions").insert(transactionsToInsert);
      if (error) {
        console.error(error);
        alert("Gagal menyimpan ke database.");
        return;
      }
      onAdd();
    } finally {
      setLoading(false);
    }
  };

  const handleManualAdd = async () => {
    if (!input.trim()) return;
    await addTransactionFromText(input.trim());
    setInput("");
    setCategory("");
    setType("expense");
  };

  return (
    <section className="bg-white rounded-2xl shadow p-5 mb-6">
      <h2 className="text-xl font-semibold mb-3">Tambah Transaksi (Teks)</h2>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Contoh: "hari ini beli bakso 20 ribu"'
          className="border rounded-lg px-3 py-2 flex-1"
        />
        <button
          onClick={handleManualAdd}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-60"
        >
          {loading ? "Memproses…" : "Tambah"}
        </button>
      </div>
      <div className="mb-2">
        <label className="block text-xs mb-1 text-gray-700">Kategori</label>
        <select
          className="border rounded-lg px-3 py-2 w-full"
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          <option value="">Pilih kategori</option>
          {CATEGORY_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      <div className="mb-2">
        <label className="block text-xs mb-1 text-gray-700">Tipe Transaksi</label>
        <div className="flex gap-3">
          {TYPE_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-1 text-xs font-medium">
              <input
                type="radio"
                name="type"
                value={opt.value}
                checked={type === opt.value}
                onChange={() => setType(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Tip: sertakan nominal angka, misal 20000 / 20 ribu.
      </p>
    </section>
  );
};
