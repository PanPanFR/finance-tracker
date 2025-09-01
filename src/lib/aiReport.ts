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
    console.log("AI Report - Making API call to backend...");
    
    const res = await fetch("/api/ai/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question, userId }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("AI Report - API response not ok:", res.status, errorData);
      throw new Error(`Backend API error: ${res.status} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await res.json();
    console.log("AI Report - API response data:", data);
    
    if (!data.result) {
      console.error("AI Report - Invalid API response format:", data);
      throw new Error("Invalid API response format");
    }
    
    return data.result;
  } catch (err) {
    console.error("AI Report - Error:", err);
    return "Gagal menghasilkan laporan. Coba lagi nanti.";
  }
}