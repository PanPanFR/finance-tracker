import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, getSessionSecret, SESSION_COOKIE_NAME } from "../../../lib/auth";
import { getDB, getAllTransactions, insertTransaction } from "../../../lib/db";
import { validateCsrfToken, csrfErrorResponse } from "../../../lib/csrf";

export const runtime = "edge";

/** Verify session or return 401 */
async function requireAuth(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;
  const secret = getSessionSecret();
  return verifySessionToken(token, secret);
}

/** GET /api/transactions — list all transactions */
export async function GET(request: NextRequest) {
  if (!(await requireAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDB();
    const transactions = await getAllTransactions(db);
    return NextResponse.json({ data: transactions });
  } catch (error) {
    console.error("GET /api/transactions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

/** POST /api/transactions — create new transaction */
export async function POST(request: NextRequest) {
  if (!(await requireAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!validateCsrfToken(request)) {
    return csrfErrorResponse();
  }

  try {
    const body = await request.json();
    const { description, amount, category, type, created_at } = body;

    if (!description || typeof amount !== "number") {
      return NextResponse.json(
        { error: "Description and amount are required" },
        { status: 400 }
      );
    }

    const db = getDB();
    await insertTransaction(db, {
      description,
      amount,
      category: category || "Other",
      type: type || "expense",
      created_at,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/transactions error:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
