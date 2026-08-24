import { apiFetch } from "./client-api";

export type ReportTransaction = {
  description: string;
  amount: number;
  created_at: string;
  category?: string;
  type: "income" | "expense";
};

export async function askReport(question: string): Promise<string> {
  try {
    const res = await apiFetch("/api/ai/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("AI Report - API error:", res.status, errorData);

      if (res.status === 401) {
        throw new Error("Authentication failed. Please login again.");
      }

      throw new Error(`Backend API error: ${res.status} - ${errorData.error || "Unknown error"}`);
    }

    const data = await res.json();

    if (!data.result) {
      throw new Error("Invalid API response format");
    }

    return data.result;
  } catch (err) {
    console.error("AI Report - Error:", err);
    return "Failed to generate report. Please try again later.";
  }
}