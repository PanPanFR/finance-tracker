import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { verifySessionToken, getSessionSecret, SESSION_COOKIE_NAME } from "../../../../lib/auth";
import { getDB, getAllTransactions } from "../../../../lib/db";
import { validateCsrfToken, csrfErrorResponse } from "../../../../lib/csrf";

export const runtime = "edge";

async function requireAuth(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;
  const secret = getSessionSecret();
  return verifySessionToken(token, secret);
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireAuth(request))) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!validateCsrfToken(request)) {
      return csrfErrorResponse();
    }

    const { question } = await request.json();

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    // Fetch transactions from D1
    const db = getDB();
    const allTransactions = await getAllTransactions(db);

    const transactions = allTransactions.slice(0, 200).map((t) => ({
      description: t.description || "",
      amount: Number(t.amount) || 0,
      created_at: t.created_at,
      category: t.category || undefined,
      type: t.type === "income" ? "income" : "expense",
    }));

    // Check for Gemini API key
    let googleApiKey = process.env.GOOGLE_API_KEY;
    try {
      const { env } = getRequestContext();
      if ((env as Record<string, string>)?.GOOGLE_API_KEY) {
        googleApiKey = (env as Record<string, string>).GOOGLE_API_KEY;
      }
    } catch {
      // Fallback
    }

    if (!googleApiKey) {
      // Fallback: simple computed summary
      const totalIncome = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalExpense = transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const balance = totalIncome - totalExpense;
      return NextResponse.json({
        result: [
          "AI is disabled (GOOGLE_API_KEY not set). Summary:",
          `- Total Income: Rp ${totalIncome.toLocaleString("id-ID")}`,
          `- Total Expense: Rp ${totalExpense.toLocaleString("id-ID")}`,
          `- Net Balance: Rp ${balance.toLocaleString("id-ID")}`,
        ].join("\n"),
      });
    }

    // Ask Gemini
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(googleApiKey)}`;
    const sys = `You are a personal financial analyst assistant. Provide clear, concise, well-structured financial insights without markdown bullets (*) or list decorators. Use line breaks, clean headers, and simple summaries.`;
    const nowWIB = new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
    const prompt = `${sys}\nCurrent date/time (WIB): ${nowWIB}\n\nTransaction JSON Data (up to 200 items):\n${JSON.stringify(transactions)}\n\nUser Question: "${question}"\n\nREQUIRED FORMAT (no bullets or asterisks):\nReport for <period/date>:\nTotal Expenses: Rp xxx\nTotal Income: Rp xxx\nNet Balance: Rp xxx\n\nExpenses by Category:\nCategory A: Rp xxx\nCategory B: Rp xxx\n\nNotes (optional, max 2 lines).\n\nDo not use *, -, or bullet numbers. Plain readable text. If no relevant data, respond with: No relevant data found.`;

    let res: Response;
    try {
      res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
        }),
      });
    } catch (e) {
      console.error("AI Report - Gemini network error:", e);
      return NextResponse.json(
        { error: "Gemini request failed", details: e instanceof Error ? e.message : String(e) },
        { status: 502 }
      );
    }

    if (!res.ok) {
      const text = await res.text();
      console.error("AI Report - Gemini error:", res.status, text);
      return NextResponse.json(
        { error: "Failed to get AI response", status: res.status, details: text },
        { status: res.status }
      );
    }

    const dataJson = await res.json();
    let reply: string = dataJson?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "No response generated.";
    // Sanitize
    reply = reply
      .split("\n")
      .map((line: string) =>
        line
          .replace(/^\s*[*\-•]+\s*/g, "")
          .replace(/^\s*\d+\.?\s+/, "")
          .replace(/\*\*(.*?)\*\*/g, "$1")
      )
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return NextResponse.json({ result: reply });
  } catch (error) {
    console.error("AI Report - Error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
