import { NextRequest, NextResponse } from "next/server";
import {
  verifyPassword,
  createSessionToken,
  getSessionSecret,
  SESSION_COOKIE_NAME,
  SESSION_EXPIRY_MS,
} from "../../../../lib/auth";
import { getDB, getSetting } from "../../../../lib/db";
import { validateCsrfToken, csrfErrorResponse } from "../../../../lib/csrf";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    if (!validateCsrfToken(request)) {
      return csrfErrorResponse();
    }

    const { password } = await request.json();

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const sessionSecret = getSessionSecret();

    // Get the stored hash from D1 database
    const db = getDB();
    const storedHash = await getSetting(db, "master_password_hash");

    if (!storedHash) {
      return NextResponse.json(
        { error: "SETUP_REQUIRED", message: "Master password has not been set yet." },
        { status: 404 }
      );
    }

    const valid = await verifyPassword(password, storedHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

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
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
