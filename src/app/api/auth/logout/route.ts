import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "../../../../lib/auth";
import { validateCsrfToken, csrfErrorResponse } from "../../../../lib/csrf";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  if (!validateCsrfToken(request)) {
    return csrfErrorResponse();
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
