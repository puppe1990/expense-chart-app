import { createClient } from "@libsql/client";

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl) {
  throw new Error("Missing TURSO_DATABASE_URL environment variable");
}

export const db = createClient({
  url: tursoUrl,
  authToken: tursoAuthToken,
});

export const ensureSchema = async () => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      account TEXT,
      payment_method TEXT,
      notes TEXT,
      tags_json TEXT,
      is_recurring INTEGER DEFAULT 0,
      recurring_frequency TEXT,
      recurring_end_date TEXT,
      from_account TEXT,
      to_account TEXT,
      is_loan_payment INTEGER DEFAULT 0,
      related_loan_id TEXT,
      original_loan_amount REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await db.execute("CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)");
  await db.execute("CREATE INDEX IF NOT EXISTS idx_expenses_account ON expenses(account)");
  await db.execute("CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(type)");

  const columnsResult = await db.execute("PRAGMA table_info(expenses)");
  const hasUserId = columnsResult.rows.some((row) => String(row.name) === "user_id");
  if (!hasUserId) {
    await db.execute("ALTER TABLE expenses ADD COLUMN user_id TEXT");
  }

  await db.execute("CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id)");
  await db.execute("CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date)");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await db.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)");
};
