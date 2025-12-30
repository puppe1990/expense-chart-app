import type { Expense } from "@/components/ExpenseForm";

export type AccountType = "pf" | "pj";

export const ACCOUNT_OPTIONS: Array<{ value: AccountType; label: string }> = [
  { value: "pf", label: "PF" },
  { value: "pj", label: "PJ" },
];

export const normalizeAccount = (account?: string | null): AccountType | null => {
  if (account === "pf" || account === "pj") return account;
  return null;
};

export const getAccountLabel = (account?: string | null): string => {
  if (account === "pf") return "PF";
  if (account === "pj") return "PJ";
  return account ? String(account) : "";
};

export const getExpenseAccount = (expense: Expense): AccountType =>
  normalizeAccount(expense.account) ?? "pf";

export const matchesAccount = (expense: Expense, account: AccountType): boolean => {
  if (expense.type === "transfer") {
    return expense.fromAccount === account || expense.toAccount === account;
  }
  return getExpenseAccount(expense) === account;
};

export const filterExpensesByAccount = (expenses: Expense[], account: AccountType): Expense[] =>
  expenses.filter((expense) => matchesAccount(expense, account));

export const getTransferImpact = (expense: Expense, account: AccountType): number => {
  if (expense.type !== "transfer") return 0;
  if (expense.fromAccount === account) return -expense.amount;
  if (expense.toAccount === account) return expense.amount;
  return 0;
};
