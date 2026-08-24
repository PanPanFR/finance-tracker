"use client";

import React, { useState, type ChangeEvent } from "react";
import Navigation from "../../components/Navigation";
import { useAuth } from "../../contexts/AuthContext";
import PasswordGate from "../../components/PasswordGate";
import { scanReceipt } from "../../lib/ocr";
import { askReport } from "../../lib/aiReport";
import { useToast } from "../../components/Toast";
import { apiFetch } from "../../lib/client-api";
import {
  SparklesIcon,
  SendIcon,
  UploadCloudIcon,
  MessageSquareIcon,
  RefreshCwIcon,
  ReceiptIcon,
  ShieldCheckIcon,
} from "../../components/Icons";

export default function AiCopilotPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { success, error: toastError } = useToast();

  // Smart Parser
  const [input, setInput] = useState("");
  const [loadingAdd, setLoadingAdd] = useState(false);

  // OCR
  const [ocrProgress, setOcrProgress] = useState<string>("");
  const [ocrImagePreview, setOcrImagePreview] = useState<string | null>(null);

  // Q&A
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loadingReport, setLoadingReport] = useState(false);

  const handleAiTextSubmit = async (customPrompt?: string) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend) return;

    setLoadingAdd(true);
    try {
      const res = await apiFetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: textToSend, insert: true }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Failed to process (status ${res.status})`);
      }

      const data = await res.json();
      const count = data.inserted || (data.result ? data.result.length : 1);
      success(`Successfully recorded ${count} transaction${count > 1 ? "s" : ""} to your ledger!`);
      setInput("");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("transaction-added"));
      }
    } catch (err) {
      console.error(err);
      toastError(err instanceof Error ? err.message : "Failed to process AI input");
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setOcrImagePreview(previewUrl);
    setOcrProgress("Extracting text from receipt image...");

    try {
      const text = await scanReceipt(file);
      setOcrProgress("Parsing line items and amounts with AI...");
      const res = await apiFetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: text, insert: true, ocrNow: true }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Failed to parse/insert (status ${res.status})`);
      }

      const data = await res.json();
      const count = data.inserted || (data.result ? data.result.length : 1);
      setOcrProgress("Receipt processed successfully!");
      success(`Receipt scanned! Recorded ${count} item${count > 1 ? "s" : ""}.`);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("transaction-added"));
      }
    } catch (err) {
      console.error(err);
      setOcrProgress("Scan failed");
      toastError("Failed to scan receipt. Please provide a clearer photo.");
    } finally {
      e.target.value = "";
      setTimeout(() => {
        setOcrProgress("");
        setOcrImagePreview(null);
      }, 3500);
    }
  };

  const handleAskReport = async (customQ?: string) => {
    const query = (customQ || question).trim();
    if (!query) return;

    setLoadingReport(true);
    try {
      const reply = await askReport(query);
      setAnswer(reply);
      setQuestion(query);
    } catch (err) {
      console.error(err);
      toastError("Failed to generate AI financial analysis");
    } finally {
      setLoadingReport(false);
    }
  };

  if (authLoading) {
    return (
      <div className="auth-loading-screen">
        Loading session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PasswordGate onSuccess={() => {}} />;
  }

  return (
    <div className="page-wrapper">
      <Navigation />

      <main className="app-container" style={{ marginTop: "1.5rem" }}>
        {/* Page Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <div className="icon-badge icon-badge-primary" style={{ width: "2rem", height: "2rem" }}>
              <SparklesIcon size={16} />
            </div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
              AI Financial Copilot
            </h1>
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", maxWidth: "600px" }}>
            Record expenses via natural language, scan receipts with optical character recognition, and ask questions about your financial habits.
          </p>
        </div>

        <div className="copilot-workspace">
          {/* LEFT: Text & OCR Entry */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* 1. Natural Language Entry Card */}
            <div className="panel">
              <div className="panel-header" style={{ marginBottom: "1rem" }}>
                <div>
                  <h2 className="panel-title">
                    <SendIcon size={16} color="#818cf8" />
                    <span>Type in Natural Language</span>
                  </h2>
                  <p className="panel-subtitle">AI extracts descriptions, amounts, and dates automatically</p>
                </div>
              </div>

              <div className="input-with-button">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="e.g. coffee 25k, lunch 45k yesterday, salary 5jt"
                  className="input-text"
                  aria-label="Describe a transaction in natural language"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && input.trim()) handleAiTextSubmit();
                  }}
                />
                <button
                  onClick={() => handleAiTextSubmit()}
                  disabled={loadingAdd || !input.trim()}
                  className="btn btn-primary btn-sm"
                >
                  {loadingAdd ? (
                    <RefreshCwIcon size={14} className="icon-wrap" />
                  ) : (
                    <SendIcon size={14} className="icon-wrap" />
                  )}
                  <span>Parse</span>
                </button>
              </div>

              <div className="prompt-chips-wrap">
                {[
                  "Kopi 25rb",
                  "Bensin 50k kemarin",
                  "Gaji freelance 2.5jt",
                  "Makan siang 35k",
                  "Listrik PLN 200k",
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleAiTextSubmit(chip)}
                    disabled={loadingAdd}
                    className="prompt-chip"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. OCR Receipt Scanner Card */}
            <div className="panel" id="ocr-scanner">
              <div className="panel-header" style={{ marginBottom: "1rem" }}>
                <div>
                  <h2 className="panel-title">
                    <ReceiptIcon size={16} color="#818cf8" />
                    <span>Optical Receipt Scanner (OCR)</span>
                  </h2>
                  <p className="panel-subtitle">Upload or snap a photo of any receipt</p>
                </div>
              </div>

              <label htmlFor="receipt-upload-page" className="dropzone">
                <div className="icon-badge icon-badge-primary" style={{ width: "3rem", height: "3rem" }}>
                  <UploadCloudIcon size={22} />
                </div>
                <div>
                  <span className="dropzone-title">Upload receipt photo</span>
                  <span className="dropzone-sub">Supports PNG, JPG, JPEG, and HEIC up to 10MB</span>
                </div>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: "none" }}
                id="receipt-upload-page"
              />

              {ocrProgress && (
                <div style={{ marginTop: "0.75rem", padding: "0.75rem 1rem", background: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: "var(--radius-md)", fontSize: "0.75rem", color: "#a5b4fc", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <RefreshCwIcon size={15} className="icon-wrap" />
                  <span style={{ flex: 1, fontWeight: 500 }}>{ocrProgress}</span>
                  {ocrImagePreview && (
                    <div style={{ width: "2rem", height: "2rem", borderRadius: "4px", overflow: "hidden", border: "1px solid rgba(99,102,241,0.4)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ocrImagePreview} alt="Receipt" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Financial Q&A Advisory */}
          <div className="panel" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div className="panel-header" style={{ marginBottom: "1rem" }}>
              <div>
                <h2 className="panel-title">
                  <MessageSquareIcon size={16} color="#818cf8" />
                  <span>Financial Advisory Q&amp;A</span>
                </h2>
                <p className="panel-subtitle">Ask questions about your budget, totals, or trends</p>
              </div>
            </div>

            <div className="input-with-button">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. Total expense this month? Where do I spend the most?"
                className="input-text"
                aria-label="Ask a financial question"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && question.trim()) handleAskReport();
                }}
              />
              <button
                onClick={() => handleAskReport()}
                disabled={loadingReport || !question.trim()}
                className="btn btn-secondary btn-sm"
              >
                {loadingReport ? (
                  <RefreshCwIcon size={14} className="icon-wrap" />
                ) : (
                  <MessageSquareIcon size={14} className="icon-wrap" />
                )}
                <span>Ask</span>
              </button>
            </div>

            <div className="prompt-chips-wrap">
              {[
                "Total pengeluaran bulan ini?",
                "Kategori paling boros?",
                "Berapa sisa budget?",
                "Saran penghematan?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => handleAskReport(q)}
                  disabled={loadingReport}
                  className="prompt-chip"
                >
                  {q}
                </button>
              ))}
            </div>

            {answer ? (
              <div className="ai-answer-card" style={{ marginTop: "1rem", flex: 1 }}>
                <span className="ai-answer-title">
                  <SparklesIcon size={14} />
                  <span>Financial Advisor Response:</span>
                </span>
                <div style={{ whiteSpace: "pre-wrap", marginTop: "0.5rem" }}>{answer}</div>
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2.5rem 1rem", textAlign: "center", color: "var(--text-muted)", border: "1px dashed var(--border-subtle)", borderRadius: "var(--radius-lg)", marginTop: "1rem" }}>
                <SparklesIcon size={24} color="#6366f1" style={{ marginBottom: "0.5rem" }} />
                <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)" }}>Ask any financial question</span>
                <span style={{ fontSize: "0.6875rem", marginTop: "0.25rem" }}>AI analyzes your active transactions to generate customized insights</span>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "1.25rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-subtle)", fontSize: "0.6875rem", color: "var(--text-dim)" }}>
              <ShieldCheckIcon size={12} color="#10b981" />
              <span>Responses generated from your encrypted local ledger</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
