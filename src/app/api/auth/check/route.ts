import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, getSessionSecret, SESSION_COOKIE_NAME } from "../../../../lib/auth";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const sessionSecret = getSessionSecret();
    const valid = await verifySessionToken(token, sessionSecret);
    if (!valid) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
