import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Wallet, TrendingUp as InvestmentIcon, PiggyBank, CreditCard } from "lucide-react";
import { Expense } from "./ExpenseForm";

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

  const totalIncome = expenses
    .filter((e) => e.type === "income")
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  const totalExpenses = expenses
    .filter((e) => e.type === "expense")
    .reduce((sum, expense) => sum + expense.amount, 0);

  const totalInvestments = expenses
    .filter((e) => e.type === "investment")
    .reduce((sum, expense) => sum + expense.amount, 0);

  const totalSavings = expenses
    .filter((e) => e.type === "savings")
    .reduce((sum, expense) => sum + expense.amount, 0);

  const totalLoans = expenses
    .filter((e) => e.type === "loan")
    .reduce((sum, expense) => sum + expense.amount, 0);

  // Transfers don't affect the balance as they're just moving money between accounts
  const balance = totalIncome - totalExpenses;

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
              </div>
              <div className="p-2 bg-orange-500/10 rounded-full">
                <CreditCard className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500 bg-gradient-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Transferências</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {expenses.filter((e) => e.type === "transfer").length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">transações</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-full">
                <TrendingUp className="h-5 w-5 text-blue-500 rotate-90" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
