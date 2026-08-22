import { NextRequest, NextResponse } from "next/server";
import {
  verifySessionToken,
  SESSION_COOKIE_NAME,
  verifyPassword,
  hashPassword,
  getSessionSecret,
} from "../../../../lib/auth";
import { getDB, getSetting, setSetting } from "../../../../lib/db";

export const runtime = "edge";

async function requireAuth(request: NextRequest, sessionSecret: string): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;
  return verifySessionToken(token, sessionSecret);
}

export async function POST(request: NextRequest) {
  try {
    const sessionSecret = getSessionSecret();

    if (!(await requireAuth(request, sessionSecret))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { oldPassword, newPassword } = await request.json();

    if (!oldPassword || !newPassword || newPassword.length < 4) {
      return NextResponse.json(
        { error: "New password must be at least 4 characters long" },
        { status: 400 }
      );
    }

    const db = getDB();
    const storedHash = await getSetting(db, "master_password_hash");

    if (!storedHash) {
      return NextResponse.json({ error: "Password has not been initialized" }, { status: 400 });
    }

    // Verify old password
    const valid = await verifyPassword(oldPassword, storedHash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    // Hash and set new password
    const newHash = await hashPassword(newPassword);
    await setSetting(db, "master_password_hash", newHash);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}
