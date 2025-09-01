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
    // Get current session token for authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      console.error("AI Report - No valid session found");
      throw new Error("Authentication required. Please login first.");
    }
    
    console.log("AI Report - Making authenticated API call to backend...");
    
    const res = await fetch("/api/ai/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ question, userId }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("AI Report - API response not ok:", res.status, errorData);
      
      // Handle authentication errors specifically
      if (res.status === 401) {
        throw new Error("Authentication failed. Please login again.");
      }
      
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