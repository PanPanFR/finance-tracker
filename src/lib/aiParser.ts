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

export async function parseTransaction(input: string): Promise<ParsedTransaction[] | null> {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
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

    const data = await res.json();
    const raw = data.choices[0].message.content;

    const parsed = JSON.parse(raw);
    return TransactionsSchema.parse(parsed);
  } catch (err) {
    console.error("Parse error:", err);
    return null;
  }
}
