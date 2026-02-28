import { createClient } from "@libsql/client/web";

export const getDbClient = () => {
  const url = Netlify.env.get("TURSO_DATABASE_URL");
  const authToken = Netlify.env.get("TURSO_AUTH_TOKEN");

  if (!url) {
    throw new Error("Missing TURSO_DATABASE_URL environment variable");
  }

  return createClient({ url, authToken: authToken || undefined });
};

type Migration = {
  id: string;
  statements: string[];
};

const MIGRATIONS: Migration[] = [
  {
    id: "001_init_users_expenses",
    statements: [
      `
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `,
      `
        CREATE TABLE IF NOT EXISTS expenses (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
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
      `,
      "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
      "CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date)",
    ],
  },
  {
    id: "002_rate_limits",
    statements: [
      `
        CREATE TABLE IF NOT EXISTS rate_limits (
          key TEXT PRIMARY KEY,
          count INTEGER NOT NULL,
          reset_at INTEGER NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `,
      "CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON rate_limits(reset_at)",
    ],
  },
  {
    id: "003_expense_versions",
    statements: [
      `
        CREATE TABLE IF NOT EXISTS expense_versions (
          user_id TEXT PRIMARY KEY,
          version INTEGER NOT NULL DEFAULT 0,
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `,
    ],
  },
];

let schemaReadyPromise: Promise<void> | null = null;

const applyMigrations = async () => {
  const db = getDbClient();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const existing = await db.execute("SELECT id FROM schema_migrations");
  const applied = new Set(existing.rows.map((row) => String((row as Record<string, unknown>).id)));

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.id)) {
      continue;
    }

    for (const statement of migration.statements) {
      await db.execute(statement);
    }

    try {
      await db.execute({
        sql: "INSERT INTO schema_migrations (id) VALUES (?)",
        args: [migration.id],
      });
    } catch (_error) {
      // Another concurrent invocation may have registered this migration first.
    }
  }
};

export const ensureSchema = async () => {
  if (!schemaReadyPromise) {
    schemaReadyPromise = applyMigrations();
  }

  return schemaReadyPromise;
};
