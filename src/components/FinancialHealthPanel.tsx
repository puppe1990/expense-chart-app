import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, User, AlertTriangle, ShieldCheck } from "lucide-react";
import type { Expense } from "@/components/ExpenseForm";
import { AccountType, filterExpensesByAccount, getTransferImpact } from "@/lib/accounts";
import { getCurrentDateString } from "@/lib/utils";

interface FinancialHealthPanelProps {
  expenses: Expense[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const getMonthStart = (date: string) => `${date.slice(0, 7)}-01`;

const isInCurrentMonth = (date: string, today: string) => {
  const monthStart = getMonthStart(today);
  return date >= monthStart && date <= today;
};

const getMonthBalanceByAccount = (expenses: Expense[], account: AccountType, today: string) => {
  const monthExpenses = filterExpensesByAccount(expenses, account).filter((expense) =>
    isInCurrentMonth(expense.date, today)
  );

  const totalIncome = monthExpenses
    .filter((e) => e.type === "income")
    .reduce((sum, expense) => sum + expense.amount, 0);

  const totalExpenses = monthExpenses
    .filter((e) => e.type === "expense")
    .reduce((sum, expense) => sum + expense.amount, 0);

  const totalInvestments = monthExpenses
    .filter((e) => e.type === "investment")
    .reduce((sum, expense) => sum + expense.amount, 0);

  const totalProfit = monthExpenses
    .filter((e) => e.type === "investment_profit")
    .reduce((sum, expense) => sum + expense.amount, 0);

  const transferImpact = monthExpenses.reduce(
    (sum, expense) => sum + getTransferImpact(expense, account),
    0
  );

  return totalIncome + totalProfit - totalExpenses - totalInvestments + transferImpact;
};

export const FinancialHealthPanel = ({ expenses }: FinancialHealthPanelProps) => {
  const today = getCurrentDateString();
  const pfBalance = getMonthBalanceByAccount(expenses, "pf", today);
  const pjBalance = getMonthBalanceByAccount(expenses, "pj", today);

  const uncategorizedCount = expenses.filter(
    (expense) => expense.category === "other" && expense.type !== "transfer"
  ).length;

  const missingPaymentMethodCount = expenses.filter(
    (expense) =>
      (expense.type === "expense" || expense.type === "income") &&
      !expense.paymentMethod
  ).length;

  const inconsistentTransfersCount = expenses.filter(
    (expense) =>
      expense.type === "transfer" && (!expense.fromAccount || !expense.toAccount)
  ).length;

  const hasIssues =
    uncategorizedCount > 0 || missingPaymentMethodCount > 0 || inconsistentTransfersCount > 0;

  return (
    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">PF (mês)</p>
              <p className="text-2xl font-bold">{formatCurrency(pfBalance)}</p>
            </div>
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">PJ (mês)</p>
              <p className="text-2xl font-bold">{formatCurrency(pjBalance)}</p>
            </div>
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Lançamentos pendentes</p>
              <p className="text-2xl font-bold">{uncategorizedCount + missingPaymentMethodCount}</p>
              <p className="text-xs text-muted-foreground">
                {uncategorizedCount} sem categoria, {missingPaymentMethodCount} sem método
              </p>
            </div>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Saúde da base</p>
              <Badge variant={hasIssues ? "secondary" : "default"}>
                {hasIssues ? "Revisar dados" : "OK"}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                {inconsistentTransfersCount} transferências inconsistentes
              </p>
            </div>
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
