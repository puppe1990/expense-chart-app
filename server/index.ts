import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { db, ensureSchema } from "./db";

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

interface AuthenticatedRequest extends express.Request {
  userId: string;
  userEmail?: string;
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "2mb" }));

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET environment variable");
}

const generateId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const createToken = (userId: string, email: string) =>
  jwt.sign({ sub: userId, email }, JWT_SECRET, { expiresIn: "7d" });

const verifyToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (typeof decoded === "string") {
    throw new Error("Invalid token payload");
  }
  return decoded as JwtPayload;
};

const requireAuth: express.RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    if (!payload.sub || typeof payload.sub !== "string") {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const authReq = req as AuthenticatedRequest;
    authReq.userId = payload.sub;
    authReq.userEmail = typeof payload.email === "string" ? payload.email : undefined;
    next();
  } catch (_error) {
    res.status(401).json({ error: "Unauthorized" });
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
  await db.execute({
    sql: `INSERT OR REPLACE INTO expenses (
      id, description, amount, category, date, type, account, payment_method, notes, tags_json,
      is_recurring, recurring_frequency, recurring_end_date, from_account, to_account,
      is_loan_payment, related_loan_id, original_loan_amount, user_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      expense.id,
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
      userId,
    ],
  });
};

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");

    if (!email || !password || password.length < 8) {
      res.status(400).json({ error: "Invalid email or password" });
      return;
    }

    const existing = await db.execute({
      sql: "SELECT id FROM users WHERE email = ? LIMIT 1",
      args: [email],
    });

    if (existing.rows.length > 0) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const userId = generateId();
    const passwordHash = await bcrypt.hash(password, 10);

    await db.execute({
      sql: "INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)",
      args: [userId, email, passwordHash],
    });

    const token = createToken(userId, email);
    res.status(201).json({ token, user: { id: userId, email } });
  } catch (_error) {
    res.status(500).json({ error: "Failed to sign up" });
  }
});

app.post("/api/auth/signin", async (req, res) => {
  try {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");

    if (!email || !password) {
      res.status(400).json({ error: "Invalid credentials" });
      return;
    }

    const result = await db.execute({
      sql: "SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1",
      args: [email],
    });

    if (result.rows.length === 0) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const user = result.rows[0] as Record<string, unknown>;
    const passwordHash = String(user.password_hash ?? "");
    const passwordOk = await bcrypt.compare(password, passwordHash);

    if (!passwordOk) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const userId = String(user.id);
    const userEmail = String(user.email);
    const token = createToken(userId, userEmail);

    res.json({ token, user: { id: userId, email: userEmail } });
  } catch (_error) {
    res.status(500).json({ error: "Failed to sign in" });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  res.json({ user: { id: authReq.userId, email: authReq.userEmail } });
});

app.get("/api/expenses", requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const account = req.query.account ? String(req.query.account) : undefined;
    const dateFrom = req.query.dateFrom ? String(req.query.dateFrom) : undefined;
    const dateTo = req.query.dateTo ? String(req.query.dateTo) : undefined;

    const result = await db.execute({
      sql: "SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, created_at DESC",
      args: [authReq.userId],
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

    res.json(expenses);
  } catch (_error) {
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

app.post("/api/expenses", requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const expense = req.body as ExpenseRecord;
    await upsertExpense(expense, authReq.userId);
    res.status(201).json({ ok: true });
  } catch (_error) {
    res.status(500).json({ error: "Failed to create expense" });
  }
});

app.post("/api/expenses/batch", requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const expenses = req.body as ExpenseRecord[];
    if (!Array.isArray(expenses)) {
      res.status(400).json({ error: "Invalid payload" });
      return;
    }

    for (const expense of expenses) {
      await upsertExpense(expense, authReq.userId);
    }

    res.status(201).json({ ok: true, count: expenses.length });
  } catch (_error) {
    res.status(500).json({ error: "Failed to insert expenses batch" });
  }
});

app.put("/api/expenses/:id", requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const id = req.params.id;
    const expense = { ...(req.body as ExpenseRecord), id };
    await upsertExpense(expense, authReq.userId);
    res.json({ ok: true });
  } catch (_error) {
    res.status(500).json({ error: "Failed to update expense" });
  }
});

app.put("/api/expenses/replace", requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const expenses = req.body as ExpenseRecord[];
    if (!Array.isArray(expenses)) {
      res.status(400).json({ error: "Invalid payload" });
      return;
    }

    await db.execute({
      sql: "DELETE FROM expenses WHERE user_id = ?",
      args: [authReq.userId],
    });

    for (const expense of expenses) {
      await upsertExpense(expense, authReq.userId);
    }

    res.json({ ok: true, count: expenses.length });
  } catch (_error) {
    res.status(500).json({ error: "Failed to replace expenses" });
  }
});

app.delete("/api/expenses/:id", requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    await db.execute({
      sql: "DELETE FROM expenses WHERE id = ? AND user_id = ?",
      args: [req.params.id, authReq.userId],
    });
    res.json({ ok: true });
  } catch (_error) {
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

app.delete("/api/expenses", requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    await db.execute({
      sql: "DELETE FROM expenses WHERE user_id = ?",
      args: [authReq.userId],
    });
    res.json({ ok: true });
  } catch (_error) {
    res.status(500).json({ error: "Failed to clear expenses" });
  }
});

const start = async () => {
  await ensureSchema();
  const port = Number(process.env.API_PORT ?? 8787);
  app.listen(port, () => {
    console.log(`API server running on http://localhost:${port}`);
  });
};

start().catch((error) => {
  console.error("Failed to start API server", error);
  process.exit(1);
});
