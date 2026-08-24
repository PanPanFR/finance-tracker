import { NextRequest, NextResponse } from "next/server";

export const CSRF_COOKIE_NAME = "ft_csrf";
export const CSRF_HEADER_NAME = "x-csrf-token";

/** Generate a random CSRF token (Web Crypto — edge runtime compatible) */
export function generateCsrfToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Double-submit cookie check: the `ft_csrf` cookie value must match the
 * `x-csrf-token` request header. A cross-site attacker can force cookies to
 * be sent but cannot read them, so they cannot set the matching header.
 */
export function validateCsrfToken(request: NextRequest): boolean {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (!cookieToken || !headerToken) return false;
  if (cookieToken.length !== headerToken.length || cookieToken.length < 32) return false;

  // Constant-time comparison
  let diff = 0;
  for (let i = 0; i < cookieToken.length; i++) {
    diff |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i);
  }
  return diff === 0;
}

/** 403 response for missing/invalid CSRF tokens */
export function csrfErrorResponse(): NextResponse {
  return NextResponse.json(
    { error: "Invalid or missing CSRF token" },
    { status: 403 }
  );
}
