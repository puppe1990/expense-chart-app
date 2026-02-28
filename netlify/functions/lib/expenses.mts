import type { AuthInfo, ExpenseRecord, AccountType, PaymentMethod, ExpenseType } from "./types.mts";
import { getDbClient } from "./db.mts";
import { jsonResponse, parseBody } from "./response.mts";
import { expenseBatchSchema, expenseSchema, expenseUpdateSchema } from "./validation.mts";

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
    paymentMethod: row.payment_method ? (String(row.payment_method) as PaymentMethod) : undefined,
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

export const upsertExpense = async (expense: ExpenseRecord, userId: string) => {
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

const ensureUserVersionRow = async (userId: string) => {
  const db = getDbClient();
  await db.execute({
    sql: `
      INSERT INTO expense_versions (user_id, version, updated_at)
      VALUES (?, 0, datetime('now'))
      ON CONFLICT(user_id) DO NOTHING
    `,
    args: [userId],
  });
};

const getUserVersion = async (userId: string) => {
  await ensureUserVersionRow(userId);
  const db = getDbClient();
  const result = await db.execute({
    sql: "SELECT version FROM expense_versions WHERE user_id = ? LIMIT 1",
    args: [userId],
  });
  const row = result.rows[0] as Record<string, unknown> | undefined;
  return row ? Number(row.version) : 0;
};

const bumpUserVersion = async (userId: string) => {
  const db = getDbClient();
  await db.execute({
    sql: `
      INSERT INTO expense_versions (user_id, version, updated_at)
      VALUES (?, 1, datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET
        version = version + 1,
        updated_at = datetime('now')
    `,
    args: [userId],
  });
  return await getUserVersion(userId);
};

export const handleGetExpenses = async (url: URL, auth: AuthInfo) => {
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

  const version = await getUserVersion(auth.userId);
  return jsonResponse({ items: expenses, version });
};

export const handleCreateExpense = async (req: Request, auth: AuthInfo, requestId: string) => {
  const parsed = await parseBody(req, expenseSchema, requestId);
  if ("error" in parsed) return parsed.error;
  await upsertExpense(parsed.data, auth.userId);
  const version = await bumpUserVersion(auth.userId);
  return jsonResponse({ ok: true, version }, 201);
};

export const handleBatchExpense = async (req: Request, auth: AuthInfo, requestId: string) => {
  const parsed = await parseBody(req, expenseBatchSchema, requestId);
  if ("error" in parsed) return parsed.error;
  const expenses = parsed.data;

  for (const expense of expenses) {
    await upsertExpense(expense, auth.userId);
  }

  const version = await bumpUserVersion(auth.userId);
  return jsonResponse({ ok: true, count: expenses.length, version }, 201);
};

export const handleReplaceExpenses = async (req: Request, auth: AuthInfo, requestId: string) => {
  const parsed = await parseBody(req, expenseBatchSchema, requestId);
  if ("error" in parsed) return parsed.error;
  const expenses = parsed.data;

  const db = getDbClient();
  await db.execute({
    sql: "DELETE FROM expenses WHERE user_id = ?",
    args: [auth.userId],
  });

  for (const expense of expenses) {
    await upsertExpense(expense, auth.userId);
  }

  const version = await bumpUserVersion(auth.userId);
  return jsonResponse({ ok: true, count: expenses.length, version });
};

export const handleUpdateOneExpense = async (
  req: Request,
  id: string,
  auth: AuthInfo,
  requestId: string
) => {
  const parsed = await parseBody(req, expenseUpdateSchema, requestId);
  if ("error" in parsed) return parsed.error;
  await upsertExpense({ ...parsed.data, id }, auth.userId);
  const version = await bumpUserVersion(auth.userId);
  return jsonResponse({ ok: true, version });
};

export const handleDeleteOneExpense = async (id: string, auth: AuthInfo) => {
  const db = getDbClient();
  await db.execute({
    sql: "DELETE FROM expenses WHERE id = ? AND user_id = ?",
    args: [id, auth.userId],
  });

  const version = await bumpUserVersion(auth.userId);
  return jsonResponse({ ok: true, version });
};

export const handleDeleteAllExpenses = async (auth: AuthInfo) => {
  const db = getDbClient();
  await db.execute({
    sql: "DELETE FROM expenses WHERE user_id = ?",
    args: [auth.userId],
  });

  const version = await bumpUserVersion(auth.userId);
  return jsonResponse({ ok: true, version });
};
