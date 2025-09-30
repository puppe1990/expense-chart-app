import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Category, Expense } from "./ExpenseForm";
import { BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { filterNonFutureExpenses } from "@/lib/utils";

interface ExpenseChartsProps {
  expenses: Expense[];
  categories: Category[];
}

export const ExpenseCharts = ({ expenses, categories }: ExpenseChartsProps) => {
  // Filtrar apenas transações do dia atual ou anteriores
  const currentAndPastExpenses = filterNonFutureExpenses(expenses);

  const getCategoryData = () => {
    const categoryTotals: { [key: string]: number } = {};
    
    currentAndPastExpenses.forEach((expense) => {
      if (categoryTotals[expense.category]) {
        categoryTotals[expense.category] += expense.amount;
      } else {
        categoryTotals[expense.category] = expense.amount;
      }
    });

    return Object.entries(categoryTotals).map(([categoryId, total]) => {
      const category = categories.find((cat) => cat.id === categoryId);
      return {
        name: category?.name || "Outros",
        value: total,
        color: category?.color || "#8884d8",
      };
    });
  };

  const getMonthlyData = () => {
    const monthlyTotals: { [key: string]: number } = {};
    
    currentAndPastExpenses.forEach((expense) => {
      const date = new Date(expense.date + 'T00:00:00');
      const monthKey = date.toLocaleString("pt-BR", { month: "short", year: "numeric" });
      
      if (monthlyTotals[monthKey]) {
        monthlyTotals[monthKey] += expense.amount;
      } else {
        monthlyTotals[monthKey] = expense.amount;
      }
    });

    return Object.entries(monthlyTotals)
      .map(([month, total]) => ({
        month,
        total,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });
  };

  const getInvestmentProfitData = () => {
    const monthlyProfits: { [key: string]: number } = {};
    
    currentAndPastExpenses
      .filter((expense) => expense.type === "investment_profit")
      .forEach((expense) => {
        const date = new Date(expense.date + 'T00:00:00');
        const monthKey = date.toLocaleString("pt-BR", { month: "short", year: "numeric" });
        
        if (monthlyProfits[monthKey]) {
          monthlyProfits[monthKey] += expense.amount;
        } else {
          monthlyProfits[monthKey] = expense.amount;
        }
      });

    return Object.entries(monthlyProfits)
      .map(([month, total]) => ({
        month,
        profit: total,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });
  };

  const categoryData = getCategoryData();
  const monthlyData = getMonthlyData();
  const investmentProfitData = getInvestmentProfitData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (currentAndPastExpenses.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            <p>Adicione algumas despesas para ver os gráficos!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      <Card className="group relative overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 hover:scale-105">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
        
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-3 text-lg font-bold">
            <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg">
              <PieChartIcon className="h-4 w-4 text-white" />
            </div>
            Despesas por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="group relative overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 hover:scale-105">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
        
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-3 text-lg font-bold">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            Tendência Mensal
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <defs>
                <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--primary) / 0.7)" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Bar dataKey="total" fill="url(#primaryGradient)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {investmentProfitData.length > 0 && (
        <Card className="group relative overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
          
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3 text-lg font-bold">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              Lucros de Investimento
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={investmentProfitData}>
                <defs>
                  <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Bar dataKey="profit" fill="url(#emeraldGradient)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
