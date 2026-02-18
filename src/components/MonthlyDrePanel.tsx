import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Expense } from "@/components/ExpenseForm";
import { AccountType, filterExpensesByAccount, getTransferImpact } from "@/lib/accounts";
import { getCurrentDateString } from "@/lib/utils";

interface MonthlyDrePanelProps {
  expenses: Expense[];
}

type DreRow = {
  account: AccountType;
  income: number;
  expenses: number;
  investments: number;
  transferImpact: number;
  result: number;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const getCurrentMonthRange = () => {
  const today = getCurrentDateString();
  const start = `${today.slice(0, 7)}-01`;
  return { start, end: today };
};

const buildDreForAccount = (expenses: Expense[], account: AccountType): DreRow => {
  const { start, end } = getCurrentMonthRange();
  const monthExpenses = filterExpensesByAccount(expenses, account).filter(
    (expense) => expense.date >= start && expense.date <= end
  );

  const income = monthExpenses
    .filter((expense) => expense.type === "income" || expense.type === "investment_profit")
    .reduce((sum, expense) => sum + expense.amount, 0);

  const expensesTotal = monthExpenses
    .filter((expense) => expense.type === "expense" || expense.type === "loan")
    .reduce((sum, expense) => sum + expense.amount, 0);

  const investments = monthExpenses
    .filter((expense) => expense.type === "investment")
    .reduce((sum, expense) => sum + expense.amount, 0);

  const transferImpact = monthExpenses.reduce(
    (sum, expense) => sum + getTransferImpact(expense, account),
    0
  );

  return {
    account,
    income,
    expenses: expensesTotal,
    investments,
    transferImpact,
    result: income - expensesTotal - investments + transferImpact,
  };
};

const labelByAccount: Record<AccountType, string> = {
  pf: "PF",
  pj: "PJ",
  card: "Cartão",
};

export const MonthlyDrePanel = ({ expenses }: MonthlyDrePanelProps) => {
  const rows: DreRow[] = [
    buildDreForAccount(expenses, "pf"),
    buildDreForAccount(expenses, "pj"),
  ];

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>DRE Mensal PF x PJ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4">Conta</th>
                <th className="py-2 pr-4">Receitas</th>
                <th className="py-2 pr-4">Despesas</th>
                <th className="py-2 pr-4">Investimentos</th>
                <th className="py-2 pr-4">Impacto Transferências</th>
                <th className="py-2 pr-4">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.account} className="border-b last:border-b-0">
                  <td className="py-2 pr-4 font-medium">{labelByAccount[row.account]}</td>
                  <td className="py-2 pr-4">{formatCurrency(row.income)}</td>
                  <td className="py-2 pr-4">{formatCurrency(row.expenses)}</td>
                  <td className="py-2 pr-4">{formatCurrency(row.investments)}</td>
                  <td className="py-2 pr-4">{formatCurrency(row.transferImpact)}</td>
                  <td
                    className={`py-2 pr-4 font-semibold ${
                      row.result >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(row.result)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
