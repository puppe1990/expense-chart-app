import type { Config, Context } from "@netlify/functions";
import { createClient } from "@libsql/client/web";
import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";

type ExpenseType =
  | "income"
  | "expense"
  | "transfer"
  | "investment"
  | "investment_profit"
  | "loan";
type AccountType = "pf" | "pj" | "card";
type PaymentMethod =
  | "cash"
  | "card"
  | "bank_transfer"
  | "digital_wallet"
  | "check"
  | "pix"
  | "boleto"
  | "other";

interface ExpenseRecord {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: ExpenseType;
  account?: AccountType;
  paymentMethod?: PaymentMethod;
  notes?: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringFrequency?: "daily" | "weekly" | "monthly" | "yearly";
  recurringEndDate?: string;
  fromAccount?: AccountType;
  toAccount?: AccountType;
  isLoanPayment?: boolean;
  relatedLoanId?: string;
  originalLoanAmount?: number;
}

interface AuthInfo {
  userId: string;
  email?: string;
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const getDbClient = () => {
  const url = Netlify.env.get("TURSO_DATABASE_URL");
  const authToken = Netlify.env.get("TURSO_AUTH_TOKEN");

  if (!url) {
    throw new Error("Missing TURSO_DATABASE_URL environment variable");
  }

  return createClient({ url, authToken: authToken || undefined });
};

const getJwtSecret = () => {
  const secret = Netlify.env.get("JWT_SECRET");
  if (!secret) {
    throw new Error("Missing JWT_SECRET environment variable");
  }
  return secret;
};

const ensureSchema = async () => {
  const db = getDbClient();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
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
  `);

  await db.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)");
  await db.execute("CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id)");
  await db.execute("CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date)");
};

const generateId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const createToken = (userId: string, email: string) =>
  jwt.sign({ sub: userId, email }, getJwtSecret(), { expiresIn: "7d" });

const verifyAuth = (req: Request): AuthInfo | null => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const payload = jwt.verify(authHeader.slice(7), getJwtSecret());
    if (typeof payload === "string") return null;
    const jwtPayload = payload as JwtPayload;
    if (!jwtPayload.sub || typeof jwtPayload.sub !== "string") return null;
    return {
      userId: jwtPayload.sub,
      email: typeof jwtPayload.email === "string" ? jwtPayload.email : undefined,
    };
  } catch (_error) {
    return null;
  }
};

const parseExpense = (row: Record<string, unknown>): ExpenseRecord => {
  const tagsRaw = row.tags_json;
  const tags =
    typeof tagsRaw === "string" && tagsRaw.length > 0
      ? (JSON.parse(tagsRaw) as string[])
      : undefined;

  return {
    id: String(row.id),
    description: String(row.description),
    amount: Number(row.amount),
    category: String(row.category),
    date: String(row.date),
    type: String(row.type) as ExpenseType,
    account: row.account ? (String(row.account) as AccountType) : undefined,
    paymentMethod: row.payment_method
      ? (String(row.payment_method) as PaymentMethod)
      : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    tags,
    isRecurring: Number(row.is_recurring) === 1 ? true : undefined,
    recurringFrequency: row.recurring_frequency
      ? (String(row.recurring_frequency) as ExpenseRecord["recurringFrequency"])
      : undefined,
    recurringEndDate: row.recurring_end_date ? String(row.recurring_end_date) : undefined,
    fromAccount: row.from_account ? (String(row.from_account) as AccountType) : undefined,
    toAccount: row.to_account ? (String(row.to_account) as AccountType) : undefined,
    isLoanPayment: Number(row.is_loan_payment) === 1 ? true : undefined,
    relatedLoanId: row.related_loan_id ? String(row.related_loan_id) : undefined,
    originalLoanAmount:
      row.original_loan_amount !== null && row.original_loan_amount !== undefined
        ? Number(row.original_loan_amount)
        : undefined,
  };
};

const upsertExpense = async (expense: ExpenseRecord, userId: string) => {
  const db = getDbClient();

  await db.execute({
    sql: `INSERT OR REPLACE INTO expenses (
      id, user_id, description, amount, category, date, type, account, payment_method, notes, tags_json,
      is_recurring, recurring_frequency, recurring_end_date, from_account, to_account,
      is_loan_payment, related_loan_id, original_loan_amount
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      expense.id,
      userId,
      expense.description,
      expense.amount,
      expense.category,
      expense.date,
      expense.type,
      expense.account ?? null,
      expense.paymentMethod ?? null,
      expense.notes ?? null,
      expense.tags ? JSON.stringify(expense.tags) : null,
      expense.isRecurring ? 1 : 0,
      expense.recurringFrequency ?? null,
      expense.recurringEndDate ?? null,
      expense.fromAccount ?? null,
      expense.toAccount ?? null,
      expense.isLoanPayment ? 1 : 0,
      expense.relatedLoanId ?? null,
      expense.originalLoanAmount ?? null,
    ],
  });
};

const handleSignUp = async (req: Request) => {
  const body = (await req.json()) as { email?: string; password?: string };
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password || password.length < 8) {
    return jsonResponse({ error: "Invalid email or password" }, 400);
  }

  const db = getDbClient();
  const existing = await db.execute({
    sql: "SELECT id FROM users WHERE email = ? LIMIT 1",
    args: [email],
  });

  if (existing.rows.length > 0) {
    return jsonResponse({ error: "Email already registered" }, 409);
  }

  const userId = generateId();
  const passwordHash = await bcrypt.hash(password, 10);

  await db.execute({
    sql: "INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)",
    args: [userId, email, passwordHash],
  });

  const token = createToken(userId, email);
  return jsonResponse({ token, user: { id: userId, email } }, 201);
};

const handleSignIn = async (req: Request) => {
  const body = (await req.json()) as { email?: string; password?: string };
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return jsonResponse({ error: "Invalid credentials" }, 400);
  }

  const db = getDbClient();
  const result = await db.execute({
    sql: "SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1",
    args: [email],
  });

  if (result.rows.length === 0) {
    return jsonResponse({ error: "Invalid credentials" }, 401);
  }

  const user = result.rows[0] as Record<string, unknown>;
  const passwordHash = String(user.password_hash ?? "");
  const passwordOk = await bcrypt.compare(password, passwordHash);

  if (!passwordOk) {
    return jsonResponse({ error: "Invalid credentials" }, 401);
  }

  const userId = String(user.id);
  const userEmail = String(user.email);
  const token = createToken(userId, userEmail);

  return jsonResponse({ token, user: { id: userId, email: userEmail } });
};

const handleGetExpenses = async (url: URL, auth: AuthInfo) => {
  const account = url.searchParams.get("account") ?? undefined;
  const dateFrom = url.searchParams.get("dateFrom") ?? undefined;
  const dateTo = url.searchParams.get("dateTo") ?? undefined;

  const db = getDbClient();
  const result = await db.execute({
    sql: "SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, created_at DESC",
    args: [auth.userId],
  });

  let expenses = result.rows.map((row) => parseExpense(row as Record<string, unknown>));

  if (account === "pf" || account === "pj" || account === "card") {
    expenses = expenses.filter((expense) =>
      expense.type === "transfer"
        ? expense.fromAccount === account || expense.toAccount === account
        : (expense.account ?? "pf") === account
    );
  }

  if (dateFrom) {
    expenses = expenses.filter((expense) => expense.date >= dateFrom);
  }
  if (dateTo) {
    expenses = expenses.filter((expense) => expense.date <= dateTo);
  }

  return jsonResponse(expenses);
};

const handleCreateExpense = async (req: Request, auth: AuthInfo) => {
  const expense = (await req.json()) as ExpenseRecord;
  await upsertExpense(expense, auth.userId);
  return jsonResponse({ ok: true }, 201);
};

const handleBatchExpense = async (req: Request, auth: AuthInfo) => {
  const expenses = (await req.json()) as ExpenseRecord[];
  if (!Array.isArray(expenses)) {
    return jsonResponse({ error: "Invalid payload" }, 400);
  }

  for (const expense of expenses) {
    await upsertExpense(expense, auth.userId);
  }

  return jsonResponse({ ok: true, count: expenses.length }, 201);
};

const handleReplaceExpenses = async (req: Request, auth: AuthInfo) => {
  const expenses = (await req.json()) as ExpenseRecord[];
  if (!Array.isArray(expenses)) {
    return jsonResponse({ error: "Invalid payload" }, 400);
  }

  const db = getDbClient();
  await db.execute({
    sql: "DELETE FROM expenses WHERE user_id = ?",
    args: [auth.userId],
  });

  for (const expense of expenses) {
    await upsertExpense(expense, auth.userId);
  }

  return jsonResponse({ ok: true, count: expenses.length });
};

const handleDeleteOneExpense = async (id: string, auth: AuthInfo) => {
  const db = getDbClient();
  await db.execute({
    sql: "DELETE FROM expenses WHERE id = ? AND user_id = ?",
    args: [id, auth.userId],
  });

  return jsonResponse({ ok: true });
};

const handleDeleteAllExpenses = async (auth: AuthInfo) => {
  const db = getDbClient();
  await db.execute({
    sql: "DELETE FROM expenses WHERE user_id = ?",
    args: [auth.userId],
  });

  return jsonResponse({ ok: true });
};

const getApiPath = (url: URL) => {
  const path = url.pathname;
  return path.startsWith("/api") ? path : "/api";
};

export default async (req: Request, _context: Context) => {
  try {
    await ensureSchema();

    const url = new URL(req.url);
    const path = getApiPath(url);
    const method = req.method.toUpperCase();

    if (path === "/api/health" && method === "GET") {
      return jsonResponse({ ok: true });
    }

    if (path === "/api/auth/signup" && method === "POST") {
      return await handleSignUp(req);
    }

    if (path === "/api/auth/signin" && method === "POST") {
      return await handleSignIn(req);
    }

    const auth = verifyAuth(req);
    if (!auth) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    if (path === "/api/auth/me" && method === "GET") {
      return jsonResponse({ user: { id: auth.userId, email: auth.email } });
    }

    if (path === "/api/expenses" && method === "GET") {
      return await handleGetExpenses(url, auth);
    }

    if (path === "/api/expenses" && method === "POST") {
      return await handleCreateExpense(req, auth);
    }

    if (path === "/api/expenses/batch" && method === "POST") {
      return await handleBatchExpense(req, auth);
    }

    if (path === "/api/expenses/replace" && method === "PUT") {
      return await handleReplaceExpenses(req, auth);
    }

    if (path === "/api/expenses" && method === "DELETE") {
      return await handleDeleteAllExpenses(auth);
    }

    if (path.startsWith("/api/expenses/") && method === "PUT") {
      const id = path.replace("/api/expenses/", "");
      const expense = (await req.json()) as ExpenseRecord;
      await upsertExpense({ ...expense, id }, auth.userId);
      return jsonResponse({ ok: true });
    }

    if (path.startsWith("/api/expenses/") && method === "DELETE") {
      const id = path.replace("/api/expenses/", "");
      return await handleDeleteOneExpense(id, auth);
    }

    return jsonResponse({ error: "Not Found" }, 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return jsonResponse({ error: message }, 500);
  }
};

export const config: Config = {
  path: "/api/*",
};
