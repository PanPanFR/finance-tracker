import { z } from "zod";

const TransactionSchema = z.object({
  description: z.string(),
  amount: z.number(),
  quantity: z.number().optional(),
  created_at: z.string().optional(),
  category: z.string().optional(), // Tambah category
  type: z.enum(["income", "expense"]).optional(),
});

const TransactionsSchema = z.array(TransactionSchema);

export type ParsedTransaction = z.infer<typeof TransactionSchema>;

// Fallback manual parser for common patterns
function manualParseFallback(input: string): ParsedTransaction[] | null {
  const lowerInput = input.toLowerCase();
  
  // Check for "kemarin" pattern
  if (lowerInput.includes('kemarin')) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0); // Set to noon
    
    // Extract amount (look for numbers)
    const amountMatch = input.match(/(\d+)\s*(rb|ribu|k|ratusan|puluhan)/i);
    const amount = amountMatch ? parseInt(amountMatch[1]) * (amountMatch[2].includes('rb') || amountMatch[2].includes('ribu') ? 1000 : 1) : 0;
    
    // Extract description (remove date and amount words)
    let description = input
      .replace(/kemarin\s*/i, '')
      .replace(/\d+\s*(rb|ribu|k|ratusan|puluhan)/gi, '')
      .replace(/\d+\s*gelas/gi, '')
      .replace(/\d+\s*biji/gi, '')
      .trim();
    
    if (description && amount > 0) {
      return [{
        description,
        amount,
        quantity: 1,
        created_at: yesterday.toISOString(),
        category: 'Makanan & Minuman',
        type: 'expense'
      }];
    }
  }
  
  return null;
}

export async function parseTransaction(input: string): Promise<ParsedTransaction[] | null> {
  try {
    console.log("AI Parser - Input:", input);
    
    if (!process.env.NEXT_PUBLIC_OPENROUTER_KEY) {
      console.error("AI Parser - Missing OPENROUTER_KEY");
      throw new Error("OpenRouter API key not configured");
    }
    
    console.log("AI Parser - Making API call to OpenRouter...");
    
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
            content: `Kamu adalah API parser transaksi.
            Output HANYA dalam format JSON array, bahkan jika hanya 1 item.
            Format: [{ description: string, amount: number (selalu TOTAL harga), quantity?: number, created_at?: string (ISO 8601), category?: string, type?: "income" | "expense" }]
            - description: nama barang/aktivitas/merchant, misal "KRL", "Starbucks", "Shopee", "Listrik PLN", "Grab", "Indomaret", "Bensin", "Netflix", "BPJS", dst. Jangan isi dengan kategori.
            - category: salah satu dari: 'Makanan & Minuman', 'Transportasi', 'Tagihan', 'Hiburan', 'Belanja', 'Kesehatan', 'Pendidikan', 'Lainnya'.
            - type: klasifikasikan 'income' (pemasukan) vs 'expense' (pengeluaran). Contoh income: gaji, bonus, refund, transfer masuk, jual barang. Selain itu anggap 'expense'.
            - 'amount' HARUS total harga. JANGAN harga satuan.
            - Jika ada waktu (misal: 'kemarin', 'tadi pagi jam 7'), konversi ke ISO 8601. Zona waktu: Asia/Jakarta (WIB/GMT+7).
              - pagi: 05:00-10:00
              - siang: 11:00-14:00
              - sore: 15:00-18:00
              - malam: 19:00-23:00
            - Jika ada beberapa barang (misal: 'A dan B'), pisahkan jadi beberapa objek dalam array.
            - Jika tidak yakin, gunakan 'Lainnya' untuk category dan 'expense' untuk type.
            - Waktu sekarang (WIB): ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })}`,
          },
          {
            role: "user",
            content: input,
          },
        ],
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("AI Parser - API response not ok:", res.status, errorText);
      throw new Error(`OpenRouter API error: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    console.log("AI Parser - API response data:", data);
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("AI Parser - Invalid API response format:", data);
      throw new Error("Invalid API response format");
    }
    
    const raw = data.choices[0].message.content;
    console.log("AI Parser - Raw response:", raw);

    const parsed = JSON.parse(raw);
    console.log("AI Parser - Parsed JSON:", parsed);
    
    const result = TransactionsSchema.parse(parsed);
    console.log("AI Parser - Final result:", result);
    
    return result;
  } catch (err) {
    console.error("AI Parser - Parse error:", err);
    console.log("AI Parser failed, trying manual fallback...");
    
    // Try manual fallback
    const fallbackResult = manualParseFallback(input);
    if (fallbackResult) {
      console.log("Manual fallback successful:", fallbackResult);
      return fallbackResult;
    }
    
    console.error("AI Parser - Both AI and manual fallback failed");
    return null;
  }
}
