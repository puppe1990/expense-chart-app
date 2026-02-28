import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreditCard, CheckCircle2, Clock3 } from "lucide-react";
import type { Expense } from "./ExpenseForm";
import { parseDateString } from "@/lib/utils";

interface LoansSectionProps {
  expenses: Expense[];
}

type LoanWithSummary = {
  loan: Expense;
  paidAmount: number;
  remainingAmount: number;
  progress: number;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export const LoansSection = ({ expenses }: LoansSectionProps) => {
  const { loansWithSummary, totalLoans, totalPaid, totalRemaining } = useMemo(() => {
    const loans = expenses
      .filter((expense) => expense.type === "loan")
      .sort((a, b) => parseDateString(b.date).getTime() - parseDateString(a.date).getTime());

    const loanPayments = expenses.filter(
      (expense) => expense.type === "expense" && expense.isLoanPayment && expense.relatedLoanId
    );

    const summary = loans.map((loan): LoanWithSummary => {
      const paidAmount = loanPayments
        .filter((payment) => payment.relatedLoanId === loan.id)
        .reduce((sum, payment) => sum + payment.amount, 0);
      const remainingAmount = Math.max(loan.amount - paidAmount, 0);
      const progress = loan.amount > 0 ? Math.min((paidAmount / loan.amount) * 100, 100) : 0;

      return {
        loan,
        paidAmount,
        remainingAmount,
        progress,
      };
    });

    const totals = summary.reduce(
      (acc, item) => ({
        totalLoans: acc.totalLoans + item.loan.amount,
        totalPaid: acc.totalPaid + item.paidAmount,
        totalRemaining: acc.totalRemaining + item.remainingAmount,
      }),
      { totalLoans: 0, totalPaid: 0, totalRemaining: 0 }
    );

    return {
      loansWithSummary: summary,
      ...totals,
    };
  }, [expenses]);

  if (loansWithSummary.length === 0) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Empréstimos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhum empréstimo cadastrado nesta conta.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Empréstimos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Tomado</p>
            <p className="text-lg font-semibold">{formatCurrency(totalLoans)}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Pago</p>
            <p className="text-lg font-semibold text-emerald-600">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Saldo Devedor</p>
            <p className="text-lg font-semibold text-orange-600">{formatCurrency(totalRemaining)}</p>
          </div>
        </div>

        <div className="space-y-3">
          {loansWithSummary.map((item) => {
            const isPaid = item.remainingAmount <= 0;
            return (
              <div key={item.loan.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{item.loan.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {parseDateString(item.loan.date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Badge variant={isPaid ? "default" : "secondary"} className="whitespace-nowrap">
                    {isPaid ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Quitado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        Em aberto
                      </span>
                    )}
                  </Badge>
                </div>

                <Progress value={item.progress} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <p>
                    Original: <span className="font-medium">{formatCurrency(item.loan.amount)}</span>
                  </p>
                  <p>
                    Pago: <span className="font-medium text-emerald-600">{formatCurrency(item.paidAmount)}</span>
                  </p>
                  <p>
                    Saldo: <span className="font-medium text-orange-600">{formatCurrency(item.remainingAmount)}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
