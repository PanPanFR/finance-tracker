import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function validateUser(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return { token, userId: user.id };
}

export async function POST(request: NextRequest) {
  try {
    const { question, userId } = await request.json();

    // Validate auth via Supabase JWT so we can query with RLS
    const authHeader = request.headers.get('authorization');
    const auth = await validateUser(authHeader);
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (userId !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!question || !userId) {
      return NextResponse.json(
        { error: 'Question and userId are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client with JWT so RLS allows reading own rows
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${auth.token}` } } as any }
    );

    // Fetch recent transactions for this user
    const { data, error } = await supabase
      .from("transactions")
      .select("description, amount, created_at, category, type")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("AI Report - Supabase error:", error);
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    const transactions = (data || []).map((t: any) => ({
      description: t.description || "",
      amount: Number(t.amount) || 0,
      created_at: t.created_at,
      category: t.category || undefined,
      type: t.type === "income" ? "income" : "expense",
    }));

    // If there is no AI key, return a simple computed summary as fallback
    if (!process.env.GOOGLE_API_KEY) {
      const totalIncome = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalExpense = transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const balance = totalIncome - totalExpense;
      return NextResponse.json({
        result: [
          "AI is disabled (GOOGLE_API_KEY not set). Simple summary:",
          `- Total pemasukan: Rp ${totalIncome.toLocaleString("id-ID")}`,
          `- Total pengeluaran: Rp ${totalExpense.toLocaleString("id-ID")}`,
          `- Saldo bersih: Rp ${balance.toLocaleString("id-ID")}`,
        ].join("\n")
      });
    }

    // Ask Gemini to analyze transactions and answer
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(process.env.GOOGLE_API_KEY)}`;
    const sys = `Kamu adalah asisten analis keuangan pribadi berbahasa Indonesia. Jawab ringkas, jelas, dan ramah dibaca tanpa bullet (*) atau markdown list. Gunakan baris baru, judul singkat, dan opsional tabel sederhana (tanpa karakter ASCII art).`;
    const nowWIB = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    const prompt = `${sys}\nTanggal/jam saat ini (WIB): ${nowWIB}\n\nData transaksi JSON (maks 200):\n${JSON.stringify(transactions)}\n\nPertanyaan pengguna: "${question}"\n\nFORMAT WAJIB (tanpa list/bullet):\nLaporan <rentang/tanggal> (<tanggal WIB>):\nTotal Pengeluaran: Rp xxx\nTotal Pemasukan: Rp xxx\nSaldo Bersih: Rp xxx\n\nPengeluaran per Kategori:\nKategori A: Rp xxx\nKategori B: Rp xxx\n\nCatatan (opsional jika perlu, maksimal 2 baris).\n\nJANGAN gunakan *, -, atau numbering. Hanya teks baris demi baris. Jika tidak ada data, tulis: Tidak ada data yang relevan.`;

    let res: Response;
    try {
      res = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [ { role: 'user', parts: [{ text: prompt }] } ],
          generationConfig: { temperature: 0.2, maxOutputTokens: 512 }
        })
      });
    } catch (e) {
      console.error('AI Report - Gemini network error:', e);
      return NextResponse.json(
        { error: 'Gemini request failed (network)', details: e instanceof Error ? e.message : String(e) },
        { status: 502 }
      );
    }

    if (!res.ok) {
      const text = await res.text();
      console.error('AI Report - Gemini error:', res.status, text);
      return NextResponse.json(
        { error: 'Failed to get AI response', status: res.status, details: text },
        { status: res.status }
      );
    }

    const dataJson = await res.json();
    let reply: string = dataJson?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Tidak ada jawaban.";
    // Sanitize: remove bullet markers and excessive bold markers
    reply = reply
      .split('\n')
      .map((line: string) => line.replace(/^\s*[*\-•]+\s*/g, '').replace(/^\s*\d+\.?\s+/,'').replace(/\*\*(.*?)\*\*/g, '$1'))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    return NextResponse.json({ result: reply });
  } catch (error) {
    console.error("AI Report - Error:", error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
