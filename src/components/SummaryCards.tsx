import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, Wallet, Calendar } from "lucide-react";
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

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
  }).reduce((sum, expense) => sum + expense.amount, 0);

  const averageExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <p className="text-sm font-medium text-muted-foreground">Despesas do Mês</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {formatCurrency(monthlyExpenses)}
              </p>
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-success bg-gradient-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Média por Despesa</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {formatCurrency(averageExpense)}
              </p>
            </div>
            <div className="p-3 bg-success/10 rounded-full">
              <Wallet className="h-6 w-6 text-success" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
