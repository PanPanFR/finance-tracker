"use client";

export const CSRF_COOKIE_NAME = "ft_csrf";
const CSRF_HEADER_NAME = "x-csrf-token";

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/** Read the CSRF cookie, requesting one from the server if it does not exist yet */
async function ensureCsrfToken(): Promise<string> {
  const existing = readCookie(CSRF_COOKIE_NAME);
  if (existing && existing.length >= 32) return existing;

  try {
    await fetch("/api/csrf", { credentials: "include" });
  } catch {
    // Server will reject the mutating call with 403 and the UI surfaces the error
  }
  return readCookie(CSRF_COOKIE_NAME) ?? "";
}

/**
 * fetch wrapper for this app: attaches credentials and, on mutating requests,
 * the double-submit CSRF header required by all POST/PUT/PATCH/DELETE endpoints.
 */
export async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers: Record<string, string> = {
    ...((init.headers as Record<string, string>) || {}),
  };

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    headers[CSRF_HEADER_NAME] = await ensureCsrfToken();
  }

  return fetch(url, { ...init, headers, credentials: "include" });
}
