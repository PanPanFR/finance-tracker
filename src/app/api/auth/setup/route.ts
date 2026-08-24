import { NextRequest, NextResponse } from "next/server";
import {
  hashPassword,
  createSessionToken,
  getSessionSecret,
  SESSION_COOKIE_NAME,
  SESSION_EXPIRY_MS,
} from "../../../../lib/auth";
import { getDB, getSetting, setSetting } from "../../../../lib/db";
import { validateCsrfToken, csrfErrorResponse } from "../../../../lib/csrf";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    if (!validateCsrfToken(request)) {
      return csrfErrorResponse();
    }

    const { password } = await request.json();

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    const sessionSecret = getSessionSecret();
    const db = getDB();
    
    // Check if password already exists
    const existingHash = await getSetting(db, "master_password_hash");
    if (existingHash) {
      return NextResponse.json(
        { error: "Master password is already set. Please log in." },
        { status: 403 }
      );
    }

    // Hash and save new password
    const hashed = await hashPassword(password);
    await setSetting(db, "master_password_hash", hashed);

    // Auto login
    const token = await createSessionToken(sessionSecret);

    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(SESSION_EXPIRY_MS / 1000),
    });

    return response;
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json({ error: "Failed to configure master password" }, { status: 500 });
  }
}
