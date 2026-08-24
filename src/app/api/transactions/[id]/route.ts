import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, getSessionSecret, SESSION_COOKIE_NAME } from "../../../../lib/auth";
import { getDB, updateTransaction, deleteTransaction } from "../../../../lib/db";
import { validateCsrfToken, csrfErrorResponse } from "../../../../lib/csrf";

export const runtime = "edge";

async function requireAuth(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;
  const secret = getSessionSecret();
  return verifySessionToken(token, secret);
}

/** PUT /api/transactions/[id] — update a transaction */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!validateCsrfToken(request)) {
    return csrfErrorResponse();
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { description, amount, category, type } = body;

    const db = getDB();
    const updated = await updateTransaction(db, id, {
      description,
      amount,
      category,
      type,
    });

    if (!updated) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/transactions/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}

/** DELETE /api/transactions/[id] — delete a transaction */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAuth(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!validateCsrfToken(request)) {
    return csrfErrorResponse();
  }

  try {
    const { id } = await params;
    const db = getDB();
    const deleted = await deleteTransaction(db, id);

    if (!deleted) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/transactions/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}
