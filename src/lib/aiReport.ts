import { supabase } from "./supabaseClient";

export type ReportTransaction = {
  description: string;
  amount: number;
  created_at: string;
  category?: string;
  type: "income" | "expense";
};

export async function askReport(question: string, userId: string): Promise<string> {
  try {
    // Fetch recent transactions for this user
    const { data, error } = await supabase
      .from("transactions")
      .select("description, amount, created_at, category, type")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("AI Report - Supabase error:", error);
      throw new Error("Gagal mengambil data transaksi.");
    }

    const transactions: ReportTransaction[] = (data || []).map((t: any) => ({
      description: t.description || "",
      amount: Number(t.amount) || 0,
      created_at: t.created_at,
      category: t.category || undefined,
      type: t.type === "income" ? "income" : "expense",
    }));

    // If there is no AI key, return a simple computed summary as fallback
    if (!process.env.NEXT_PUBLIC_OPENROUTER_KEY) {
      const totalIncome = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalExpense = transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const balance = totalIncome - totalExpense;
      return [
        "AI tidak aktif (kunci OpenRouter belum diatur). Berikut ringkasan sederhana:",
        `- Total pemasukan: Rp ${totalIncome.toLocaleString("id-ID")}`,
        `- Total pengeluaran: Rp ${totalExpense.toLocaleString("id-ID")}`,
        `- Saldo bersih: Rp ${balance.toLocaleString("id-ID")}`,
      ].join("\n");
    }

    // Ask OpenRouter to analyze transactions and answer
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-8b-instruct:free",
        messages: [
          {
            role: "system",
            content:
              `Kamu adalah asisten analis keuangan pribadi berbahasa Indonesia. Jawab langsung ke inti, singkat dan praktis. Gunakan poin-poin jika ada beberapa item. Hindari narasi panjang, langsung berikan informasi yang diminta.

PENTING: Untuk perhitungan tanggal, gunakan tanggal saat ini: ${new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })} (${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })})

PERHITUNGAN TANGGAL YANG BENAR:
- "hari ini" = ${new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })}
- "kemarin" = ${new Date(Date.now() - 24*60*60*1000).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })}
- "2 hari yang lalu" = ${new Date(Date.now() - 2*24*60*60*1000).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })}
- "3 hari yang lalu" = ${new Date(Date.now() - 3*24*60*60*1000).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })}
- "6 hari yang lalu" = ${new Date(Date.now() - 6*24*60*60*1000).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })}
- "7 hari yang lalu" = ${new Date(Date.now() - 7*24*60*60*1000).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })}

ATURAN PENTING:
1. "X hari yang lalu" = X hari sebelum hari ini, BUKAN X hari terakhir
2. Jika user minta "6 hari yang lalu", berarti tanggal ${new Date(Date.now() - 6*24*60*60*1000).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })}, bukan range tanggal
3. Jika tidak ada transaksi di tanggal yang diminta, jawab "Tidak ada transaksi pada tanggal [tanggal]"
4. JANGAN memberikan data dari tanggal lain jika user minta tanggal spesifik
5. JANGAN membuat range tanggal yang salah

Selalu gunakan perhitungan tanggal yang benar berdasarkan tanggal saat ini.`,
          },
          {
            role: "user",
            content:
              `Berikut data transaksi terbaru (maks 200 item) dalam JSON:\n` +
              `${JSON.stringify(transactions)}\n\n` +
              `Pertanyaan pengguna: "${question}"\n` +
              `Gunakan data di atas untuk menjawab seakurat mungkin.`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("AI Report - OpenRouter error:", res.status, text);
      throw new Error("Gagal menghubungi AI.");
    }

    const dataJson = await res.json();
    const reply: string =
      dataJson?.choices?.[0]?.message?.content?.trim() || "Tidak ada jawaban.";
    return reply;
  } catch (err) {
    console.error("AI Report - Error:", err);
    return "Gagal menghasilkan laporan. Coba lagi nanti.";
  }
}