import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Wallet, TrendingUp as InvestmentIcon, PiggyBank, CreditCard } from "lucide-react";
import { Expense } from "./ExpenseForm";
import { filterNonFutureExpenses } from "@/lib/utils";

interface SummaryCardsProps {
  expenses: Expense[];
}

export const SummaryCards = ({ expenses }: SummaryCardsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Filtrar apenas transações do dia atual ou anteriores
  const currentAndPastExpenses = filterNonFutureExpenses(expenses);

  const totalIncome = currentAndPastExpenses
    .filter((e) => e.type === "income")
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  const totalExpenses = currentAndPastExpenses
    .filter((e) => e.type === "expense")
    .reduce((sum, expense) => sum + expense.amount, 0);

  const totalInvestments = currentAndPastExpenses
    .filter((e) => e.type === "investment")
    .reduce((sum, expense) => sum + expense.amount, 0);

  const totalInvestmentProfits = currentAndPastExpenses
    .filter((e) => e.type === "investment_profit")
    .reduce((sum, expense) => sum + expense.amount, 0);

  const totalSavings = currentAndPastExpenses
    .filter((e) => e.type === "savings")
    .reduce((sum, expense) => sum + expense.amount, 0);

  const totalLoans = currentAndPastExpenses
    .filter((e) => e.type === "loan")
    .reduce((sum, expense) => sum + expense.amount, 0);

  // Calculate loan payments
  const totalLoanPayments = currentAndPastExpenses
    .filter((e) => e.type === "expense" && e.isLoanPayment)
    .reduce((sum, expense) => sum + expense.amount, 0);

  // Calculate remaining loan balance
  const remainingLoanBalance = totalLoans - totalLoanPayments;

  // Transfers don't affect the balance as they're just moving money between accounts
  // Investment profits are considered income for balance calculation
  const balance = totalIncome + totalInvestmentProfits - totalExpenses;

  return (
    <div className="space-y-6 mb-8">
      {/* Main financial overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-success bg-gradient-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Entradas</p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
              <div className="p-3 bg-success/10 rounded-full">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-destructive bg-gradient-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Despesas</p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
              <div className="p-3 bg-destructive/10 rounded-full">
                <TrendingDown className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary bg-gradient-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Saldo</p>
                <p className={`text-3xl font-bold mt-2 ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(balance)}
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional transaction types */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-purple-500 bg-gradient-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Investimentos</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {formatCurrency(totalInvestments)}
                </p>
              </div>
              <div className="p-2 bg-purple-500/10 rounded-full">
                <InvestmentIcon className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-emerald-500 bg-gradient-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Poupança</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {formatCurrency(totalSavings)}
                </p>
              </div>
              <div className="p-2 bg-emerald-500/10 rounded-full">
                <PiggyBank className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-orange-500 bg-gradient-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Empréstimos</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {formatCurrency(totalLoans)}
                </p>
                <div className="text-xs text-muted-foreground mt-1 space-y-1">
                  <p>Saldo Restante: <span className={remainingLoanBalance > 0 ? 'text-destructive' : 'text-success'}>
                    {formatCurrency(remainingLoanBalance)}
                  </span></p>
                  {totalLoanPayments > 0 && (
                    <p>Pago: <span className="text-success">{formatCurrency(totalLoanPayments)}</span></p>
                  )}
                </div>
              </div>
              <div className="p-2 bg-orange-500/10 rounded-full">
                <CreditCard className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-emerald-600 bg-gradient-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lucros de Investimento</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {formatCurrency(totalInvestmentProfits)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentAndPastExpenses.filter((e) => e.type === "investment_profit").length} transações
                </p>
              </div>
              <div className="p-2 bg-emerald-600/10 rounded-full">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
