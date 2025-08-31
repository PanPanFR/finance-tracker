import { supabase } from "./supabaseClient";

export async function getTransactions() {
  if (!supabase) {
    console.error("Supabase client not initialized");
    return [];
  }
  
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }

  return data || [];
}

export async function askReport(question: string): Promise<string> {
  const transactions = await getTransactions();
  
  // Filter transactions based on question context
  let relevantTransactions = transactions;
  
  // Check if user is asking about specific time period
  if (question.toLowerCase().includes('hari ini') || question.toLowerCase().includes('sekarang')) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    relevantTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.created_at);
      return transactionDate >= today && transactionDate < tomorrow;
    });
  } else if (question.toLowerCase().includes('bulan lalu') || question.toLowerCase().includes('bulan kemarin')) {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const startOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const endOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
    
    relevantTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.created_at);
      return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
    });
  } else if (question.toLowerCase().includes('bulan ini')) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    relevantTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.created_at);
      return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
    });
  } else if (question.toLowerCase().includes('minggu ini')) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    relevantTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.created_at);
      return transactionDate >= startOfWeek;
    });
  } else if (question.toLowerCase().includes('hari yang lalu') || question.toLowerCase().includes('kemarin')) {
    // Handle "2 hari yang lalu", "3 hari yang lalu", etc.
    const daysAgo = question.match(/(\d+)\s*hari\s*yang\s*lalu/);
    const days = daysAgo ? parseInt(daysAgo[1]) : 1;
    
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - days);
    targetDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    relevantTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.created_at);
      return transactionDate >= targetDate && transactionDate < nextDay;
    });
  } else if (question.toLowerCase().includes('kemarin')) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    relevantTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.created_at);
      return transactionDate >= yesterday && transactionDate < today;
    });
  }

  // If no relevant transactions found, inform the user
  if (relevantTransactions.length === 0) {
    if (question.toLowerCase().includes('hari ini') || question.toLowerCase().includes('sekarang')) {
      return "TIDAK ADA TRANSAKSI HARI INI\n\nHari ini belum ada transaksi yang tercatat dalam sistem.";
    } else if (question.toLowerCase().includes('bulan lalu') || question.toLowerCase().includes('bulan kemarin')) {
      return "TIDAK ADA TRANSAKSI BULAN LALU\n\nBulan lalu tidak ada transaksi yang tercatat dalam sistem.";
    } else if (question.toLowerCase().includes('bulan ini')) {
      return "TIDAK ADA TRANSAKSI BULAN INI\n\nBulan ini belum ada transaksi yang tercatat dalam sistem.";
    } else if (question.toLowerCase().includes('minggu ini')) {
      return "TIDAK ADA TRANSAKSI MINGGU INI\n\nMinggu ini belum ada transaksi yang tercatat dalam sistem.";
    } else if (question.toLowerCase().includes('hari yang lalu') || question.toLowerCase().includes('kemarin')) {
      const daysAgo = question.match(/(\d+)\s*hari\s*yang\s*lalu/);
      const days = daysAgo ? parseInt(daysAgo[1]) : 1;
      return `TIDAK ADA TRANSAKSI ${days} HARI YANG LALU\n\n${days} hari yang lalu tidak ada transaksi yang tercatat dalam sistem.`;
    }
    return "TIDAK ADA TRANSAKSI\n\nTidak ada transaksi yang ditemukan untuk pertanyaan Anda.";
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Kamu adalah asisten keuangan yang profesional.
          
          INSTRUKSI FORMAT OUTPUT:
          1. JANGAN gunakan markdown (#, ##, **, *) atau simbol aneh
          2. Gunakan judul sederhana dalam huruf besar
          3. Berikan spacing yang baik antar bagian
          4. Format angka Rupiah dengan pemisah ribuan (contoh: Rp 1.000.000)
          5. Gunakan bullet (-) untuk daftar item
          6. Berikan ringkasan yang jelas dan informatif
          7. Gunakan bahasa Indonesia yang baik dan benar
          8. Jika ada pemasukan, tampilkan dengan jelas
          9. JANGAN tampilkan "Saldo Bersih" kecuali diminta
          
          FORMAT OUTPUT YANG DIMINTA:
          - Setiap item transaksi harus dalam baris terpisah
          - Gunakan format: "- [Nama Transaksi]: Rp [Jumlah]"
          - Berikan jarak antar kategori (PENDAPATAN, PENGELUARAN)
          - Total harus dalam baris terpisah dan jelas
          - JANGAN buat kalimat panjang ke kanan
          - Buat format LIST yang rapi ke bawah
          
          Berikan jawaban yang RAPI dan MUDAH DIBACA dalam format LIST.`,
        },
        {
          role: "user",
          content: `Data transaksi yang relevan (${relevantTransactions.length} item): ${JSON.stringify(relevantTransactions, null, 2)}`,
        },
        {
          role: "user",
          content: question,
        },
      ],
    }),
  });

  const data = await res.json();
  return data.choices[0].message.content;
}
