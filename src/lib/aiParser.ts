import { z } from "zod";

const TransactionSchema = z.object({
  description: z.string(),
  amount: z.number(),
  created_at: z.string().optional(),
  category: z.string().optional(),
  type: z.enum(["income", "expense"]).optional(),
});

const TransactionsSchema = z.array(TransactionSchema);

export type ParsedTransaction = z.infer<typeof TransactionSchema>;

// Fallback manual parser for common patterns
function manualParseFallback(input: string): ParsedTransaction[] | null {
  const lowerInput = input.toLowerCase();

  if (lowerInput.includes("kemarin")) {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const [y, m, d] = fmt.format(now).split("-").map(Number);
    const jkt = new Date(Date.UTC(y, m - 1, d));
    jkt.setUTCDate(jkt.getUTCDate() - 1);
    const isoYesterday = new Date(
      Date.UTC(jkt.getUTCFullYear(), jkt.getUTCMonth(), jkt.getUTCDate(), 5, 0, 0)
    ).toISOString();

    const priceMatch =
      lowerInput.match(/harganya\s*([\d.,]+\s*(rb|ribu|k|juta|jt)?)/) ||
      lowerInput.match(/seharga\s*([\d.,]+\s*(rb|ribu|k|juta|jt)?)/);

    function parseIndoNumber(txt: string): number {
      const t = txt.toLowerCase().trim();
      const m = t.match(/([\d.,]+)\s*(rb|ribu|k|juta|jt)?/);
      if (!m) return NaN;
      const base = Number(m[1].replace(/\./g, "").replace(",", "."));
      const unit = (m[2] || "").toLowerCase();
      if (unit === "rb" || unit === "ribu" || unit === "k") return base * 1000;
      if (unit === "juta" || unit === "jt") return base * 1_000_000;
      return base;
    }

    let amount = priceMatch ? Math.round(parseIndoNumber(priceMatch[1])) : 0;
    if (amount === 0) {
      const anyAmount = lowerInput.match(/([\d.,]+)\s*(rb|ribu|k|juta|jt)/);
      if (anyAmount) amount = Math.round(parseIndoNumber(anyAmount[0]));
    }

    const description = input
      .replace(/kemarin\s*/i, "")
      .replace(/harganya\s*[\d.,]+\s*(rb|ribu|k|juta|jt)?/gi, "")
      .replace(/seharga\s*[\d.,]+\s*(rb|ribu|k|juta|jt)?/gi, "")
      .replace(/\b\d+(?:[.,]\d+)?\b/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (description && amount > 0) {
      return [
        {
          description,
          amount,
          created_at: isoYesterday,
          category: "Other",
          type: "expense",
        },
      ];
    }
  }

  return null;
}

export async function parseTransaction(input: string): Promise<ParsedTransaction[] | null> {
  try {
    const res = await fetch("/api/ai/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
      credentials: "include",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("AI Parser - API error:", res.status, errorData);

      if (res.status === 401) {
        throw new Error("Authentication failed. Please login again.");
      }

      throw new Error(`Backend API error: ${res.status} - ${errorData.error || "Unknown error"}`);
    }

    const data = await res.json();

    if (!data.result) {
      throw new Error("Invalid API response format");
    }

    return TransactionsSchema.parse(data.result);
  } catch (err) {
    console.error("AI Parser - Parse error:", err);

    // Try manual fallback
    const fallbackResult = manualParseFallback(input);
    if (fallbackResult) {
      return fallbackResult;
    }

    console.error("AI Parser - Both AI and manual fallback failed");
    return null;
  }
}
