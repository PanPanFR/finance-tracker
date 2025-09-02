import { z } from "zod";
import { supabase } from "./supabaseClient";

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
    // Build yesterday date in Asia/Jakarta, set to 12:00 local
    const now = new Date();
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' });
    const [y, m, d] = fmt.format(now).split('-').map(Number);
    const jkt = new Date(Date.UTC(y, m - 1, d));
    jkt.setUTCDate(jkt.getUTCDate() - 1);
    // 12:00 WIB equals 05:00 UTC (WIB=UTC+7). Use 05:00Z to avoid TZ inversion
    const isoYesterday = new Date(Date.UTC(jkt.getUTCFullYear(), jkt.getUTCMonth(), jkt.getUTCDate(), 5, 0, 0)).toISOString();

    // Extract quantity and unit price if said like "2" and "harganya 20 ribu"
    const qtyMatch = lowerInput.match(/\b(\d+(?:[.,]\d+)?)\b(?=[^\d]*,|[^\d]*\s*beli|[^\d]*\s*bola|[^\d]*\s*$)/);
    const priceMatch = lowerInput.match(/harganya\s*([\d.,]+\s*(rb|ribu|k|juta|jt)?)/) || lowerInput.match(/seharga\s*([\d.,]+\s*(rb|ribu|k|juta|jt)?)/);

    function parseIndoNumber(txt: string): number {
      const t = txt.toLowerCase().trim();
      const m = t.match(/([\d.,]+)\s*(rb|ribu|k|juta|jt)?/);
      if (!m) return NaN;
      const base = Number(m[1].replace(/\./g, '').replace(',', '.'));
      const unit = (m[2] || '').toLowerCase();
      if (unit === 'rb' || unit === 'ribu' || unit === 'k') return base * 1000;
      if (unit === 'juta' || unit === 'jt') return base * 1_000_000;
      return base;
    }

    const qty = qtyMatch ? Number(qtyMatch[1].replace(',', '.')) : 1;
    const unitPrice = priceMatch ? parseIndoNumber(priceMatch[1]) : NaN;

    // Fallback amount if unit price not captured: any number with ribu
    let amount = !isNaN(unitPrice) ? Math.round(unitPrice * (qty || 1)) : 0;
    if (amount === 0) {
      const anyAmount = lowerInput.match(/([\d.,]+)\s*(rb|ribu|k|juta|jt)/);
      if (anyAmount) amount = Math.round(parseIndoNumber(anyAmount[0]) * (qty || 1));
    }

    // Extract description by removing time/price words
    let description = input
      .replace(/kemarin\s*/i, '')
      .replace(/harganya\s*[\d.,]+\s*(rb|ribu|k|juta|jt)?/gi, '')
      .replace(/seharga\s*[\d.,]+\s*(rb|ribu|k|juta|jt)?/gi, '')
      .replace(/\b\d+(?:[.,]\d+)?\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (description && amount > 0) {
      return [{
        description,
        amount,
        quantity: qty || 1,
        created_at: isoYesterday,
        category: 'Lainnya',
        type: 'expense'
      }];
    }
  }
  
  return null;
}

export async function parseTransaction(input: string): Promise<ParsedTransaction[] | null> {
  try {
    console.log("AI Parser - Input:", input);
    
    // Get current session token for authentication
    console.log("AI Parser - Getting session token...");
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("AI Parser - Session error:", sessionError);
      throw new Error(`Session error: ${sessionError.message}`);
    }
    
    if (!session) {
      console.error("AI Parser - No session found");
      throw new Error("Authentication required. Please login first.");
    }
    
    if (!session.access_token) {
      console.error("AI Parser - No access token in session");
      throw new Error("Authentication required. Please login first.");
    }
    
    // Log token info for debugging (without exposing full token)
    console.log("AI Parser - Session found:", {
      hasToken: !!session.access_token,
      tokenLength: session.access_token?.length || 0,
      tokenPrefix: session.access_token?.substring(0, 10) || 'N/A',
      expiresAt: session.expires_at,
      userId: session.user?.id
    });
    
    console.log("AI Parser - Making authenticated API call to backend...");
    
    const res = await fetch("/api/ai/parse", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ input }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("AI Parser - API response not ok:", res.status, errorData);
      
      // Handle authentication errors specifically
      if (res.status === 401) {
        console.error("AI Parser - 401 Unauthorized - Possible causes:");
        console.error("1. Token expired");
        console.error("2. Token format invalid");
        console.error("3. Server-side validation failed");
        throw new Error("Authentication failed. Please login again.");
      }
      
      throw new Error(`Backend API error: ${res.status} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await res.json();
    console.log("AI Parser - API response data:", data);
    
    if (!data.result) {
      console.error("AI Parser - Invalid API response format:", data);
      throw new Error("Invalid API response format");
    }
    
    const result = TransactionsSchema.parse(data.result);
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
