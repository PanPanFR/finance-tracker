import { getRequestContext } from "@cloudflare/next-on-pages";

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  type: "income" | "expense";
  created_at: string;
  updated_at: string;
}

export type NewTransaction = Omit<Transaction, "id" | "updated_at">;

/** Get the D1 database binding from Cloudflare request context */
export function getDB(): D1Database {
  const { env } = getRequestContext();
  return (env as Record<string, unknown>).DB as D1Database;
}

/** Fetch all transactions, newest first */
export async function getAllTransactions(db: D1Database): Promise<Transaction[]> {
  const { results } = await db
    .prepare("SELECT * FROM transactions ORDER BY created_at DESC")
    .all<Transaction>();
  return results ?? [];
}

/** Insert a single transaction, returns the created row */
export async function insertTransaction(
  db: D1Database,
  data: Omit<NewTransaction, "created_at"> & { created_at?: string }
): Promise<void> {
  const id = crypto.randomUUID().replace(/-/g, "");
  const createdAt = data.created_at || new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO transactions (id, description, amount, category, type, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      data.description,
      data.amount,
      data.category || "Other",
      data.type || "expense",
      createdAt
    )
    .run();
}

/** Batch insert multiple transactions */
export async function insertTransactions(
  db: D1Database,
  items: Array<Omit<NewTransaction, "created_at"> & { created_at?: string }>
): Promise<number> {
  const stmts = items.map((data) => {
    const id = crypto.randomUUID().replace(/-/g, "");
    const createdAt = data.created_at || new Date().toISOString();
    return db
      .prepare(
        `INSERT INTO transactions (id, description, amount, category, type, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        data.description,
        data.amount,
        data.category || "Other",
        data.type || "expense",
        createdAt
      );
  });

  await db.batch(stmts);
  return items.length;
}

/** Update a transaction by ID */
export async function updateTransaction(
  db: D1Database,
  id: string,
  data: Partial<Pick<Transaction, "description" | "amount" | "category" | "type">>
): Promise<boolean> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.description !== undefined) {
    fields.push("description = ?");
    values.push(data.description);
  }
  if (data.amount !== undefined) {
    fields.push("amount = ?");
    values.push(data.amount);
  }
  if (data.category !== undefined) {
    fields.push("category = ?");
    values.push(data.category);
  }
  if (data.type !== undefined) {
    fields.push("type = ?");
    values.push(data.type);
  }

  if (fields.length === 0) return false;

  fields.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  const result = await db
    .prepare(`UPDATE transactions SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  return (result.meta?.changes ?? 0) > 0;
}

/** Delete a transaction by ID */
export async function deleteTransaction(
  db: D1Database,
  id: string
): Promise<boolean> {
  const result = await db
    .prepare("DELETE FROM transactions WHERE id = ?")
    .bind(id)
    .run();

  return (result.meta?.changes ?? 0) > 0;
}

/** Get an app setting by key */
export async function getSetting(db: D1Database, key: string): Promise<string | null> {
  const result = await db
    .prepare("SELECT value FROM app_settings WHERE key = ?")
    .bind(key)
    .first<{ value: string }>();
  return result?.value ?? null;
}

/** Set or update an app setting */
export async function setSetting(db: D1Database, key: string, value: string): Promise<boolean> {
  const result = await db
    .prepare(`
      INSERT INTO app_settings (key, value, updated_at) 
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `)
    .bind(key, value, new Date().toISOString())
    .run();
  
  return (result.meta?.changes ?? 0) > 0;
}
