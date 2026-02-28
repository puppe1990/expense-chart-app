import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Expense } from "@/components/ExpenseForm";
import { AccountType, filterExpensesByAccount } from "@/lib/accounts";
import { getCurrentDateString } from "@/lib/utils";
import { calculateFinancialTotals } from "@/lib/financial-metrics";

interface MonthlyDrePanelProps {
  expenses: Expense[];
}

type DreRow = {
  account: AccountType;
  income: number;
  expenses: number;
  investments: number;
  loans: number;
  transferImpact: number;
  operatingResult: number;
  cashflowResult: number;
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

  const totals = calculateFinancialTotals(monthExpenses, account);

  return {
    account,
    income: totals.totalIncome + totals.totalInvestmentProfits,
    expenses: totals.totalExpenses,
    investments: totals.totalInvestments,
    loans: totals.totalLoans,
    transferImpact: totals.transferImpact,
    operatingResult: totals.operatingResult,
    cashflowResult: totals.netCashflow,
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
        <CardTitle>Resultado Mensal PF x PJ</CardTitle>
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
                <th className="py-2 pr-4">Empréstimos (entrada)</th>
                <th className="py-2 pr-4">Impacto Transferências</th>
                <th className="py-2 pr-4">Resultado Operacional</th>
                <th className="py-2 pr-4">Fluxo de Caixa</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.account} className="border-b last:border-b-0">
                  <td className="py-2 pr-4 font-medium">{labelByAccount[row.account]}</td>
                  <td className="py-2 pr-4">{formatCurrency(row.income)}</td>
                  <td className="py-2 pr-4">{formatCurrency(row.expenses)}</td>
                  <td className="py-2 pr-4">{formatCurrency(row.investments)}</td>
                  <td className="py-2 pr-4">{formatCurrency(row.loans)}</td>
                  <td className="py-2 pr-4">{formatCurrency(row.transferImpact)}</td>
                  <td
                    className={`py-2 pr-4 font-semibold ${
                      row.operatingResult >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(row.operatingResult)}
                  </td>
                  <td
                    className={`py-2 pr-4 font-semibold ${
                      row.cashflowResult >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(row.cashflowResult)}
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
