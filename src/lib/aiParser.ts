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
    
    console.log("AI Parser - Making API call to backend...");
    
    const res = await fetch("/api/ai/parse", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("AI Parser - API response not ok:", res.status, errorData);
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
