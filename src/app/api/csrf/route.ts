import { NextRequest, NextResponse } from "next/server";
import { CSRF_COOKIE_NAME, generateCsrfToken } from "../../../lib/csrf";

export const runtime = "edge";

/** GET /api/csrf — issue (or echo) the double-submit CSRF token cookie */
export async function GET(request: NextRequest) {
  const existing = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  // Reuse a valid existing token so multiple tabs stay in sync
  const token = existing && existing.length >= 32 ? existing : generateCsrfToken();

  const response = NextResponse.json({ token });
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    // Must be readable by client JS so it can be echoed in the header
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 24 * 60 * 60,
  });
  return response;
}
