import { useState } from "react";
import { ExpenseCharts } from "@/components/ExpenseCharts";
import { Category, Expense } from "@/components/ExpenseForm";
import { useExpensesStorage } from "@/hooks/use-local-storage";
import { ArrowLeft, BarChart3, TrendingUp, DollarSign, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { filterNonFutureExpenses } from "@/lib/utils";

const defaultCategories: Category[] = [
  { id: "salary", name: "Salário", icon: "💰", color: "#10b981" },
  { id: "freelance", name: "Freelance", icon: "💼", color: "#3b82f6" },
  { id: "investment", name: "Investimentos", icon: "📈", color: "#8b5cf6" },
  { id: "investment_profit", name: "Lucros de Investimento", icon: "💎", color: "#059669" },
  { id: "food", name: "Alimentação", icon: "🍔", color: "#ef4444" },
  { id: "transport", name: "Transporte", icon: "🚗", color: "#f59e0b" },
  { id: "housing", name: "Moradia", icon: "🏠", color: "#8b5cf6" },
  { id: "entertainment", name: "Entretenimento", icon: "🎮", color: "#ec4899" },
  { id: "health", name: "Saúde", icon: "💊", color: "#10b981" },
  { id: "education", name: "Educação", icon: "📚", color: "#3b82f6" },
  { id: "shopping", name: "Compras", icon: "🛍️", color: "#f97316" },
  { id: "bills", name: "Contas", icon: "📄", color: "#6366f1" },
  { id: "other", name: "Outros", icon: "📌", color: "#64748b" },
];

const Charts = () => {
  const { expenses } = useExpensesStorage();
  const [timeFilter, setTimeFilter] = useState("all");
  const [chartType, setChartType] = useState("all");

  const currentAndPastExpenses = filterNonFutureExpenses(expenses);

  const getFilteredExpenses = () => {
    let filtered = currentAndPastExpenses;
    
    if (timeFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch (timeFilter) {
        case "30days":
          filterDate.setDate(now.getDate() - 30);
          break;
        case "90days":
          filterDate.setDate(now.getDate() - 90);
          break;
        case "1year":
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(expense => new Date(expense.date) >= filterDate);
    }
    
    if (chartType !== "all") {
      filtered = filtered.filter(expense => expense.type === chartType);
    }
    
    return filtered;
  };

  const filteredExpenses = getFilteredExpenses();

  const getFinancialSummary = () => {
    let totalIncome = 0;
    let totalExpense = 0;
    let totalInvestment = 0;
    let totalProfit = 0;
    
    filteredExpenses.forEach((expense) => {
      switch (expense.type) {
        case "income":
          totalIncome += expense.amount;
          break;
        case "expense":
          totalExpense += expense.amount;
          break;
        case "investment":
          totalInvestment += expense.amount;
          break;
        case "investment_profit":
          totalProfit += expense.amount;
          break;
      }
    });

    const netWorth = totalIncome + totalProfit - totalExpense - totalInvestment;
    const totalTransactions = filteredExpenses.length;
    const averageTransaction = totalTransactions > 0 ? (totalIncome + totalExpense + totalInvestment + totalProfit) / totalTransactions : 0;

    return {
      totalIncome,
      totalExpense,
      totalInvestment,
      totalProfit,
      netWorth,
      totalTransactions,
      averageTransaction
    };
  };

  const getTopCategory = () => {
    const categoryTotals: { [key: string]: number } = {};
    
    filteredExpenses.forEach((expense) => {
      if (categoryTotals[expense.category]) {
        categoryTotals[expense.category] += expense.amount;
      } else {
        categoryTotals[expense.category] = expense.amount;
      }
    });

    const topCategory = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topCategory) {
      const category = defaultCategories.find(cat => cat.id === topCategory[0]);
      return {
        name: category?.name || "Outros",
        amount: topCategory[1],
        icon: category?.icon || "📌"
      };
    }
    
    return null;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const financialSummary = getFinancialSummary();
  const topCategory = getTopCategory();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Dashboard Financeiro
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Análises detalhadas e insights dos seus dados
                </p>
              </div>
            </div>
            
            {/* Navigation Button */}
            <div className="flex items-center gap-3">
              <Link to="/">
                <Button variant="outline" size="sm" className="flex items-center gap-2 hover:bg-gray-50">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao Início
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Filters */}
        <div className="mb-8">
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5" />
                Filtros e Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os períodos</SelectItem>
                      <SelectItem value="30days">Últimos 30 dias</SelectItem>
                      <SelectItem value="90days">Últimos 90 dias</SelectItem>
                      <SelectItem value="1year">Último ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                  <Select value={chartType} onValueChange={setChartType}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tipo de dados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="expense">Apenas despesas</SelectItem>
                      <SelectItem value="income">Apenas receitas</SelectItem>
                      <SelectItem value="investment">Investimentos</SelectItem>
                      <SelectItem value="investment_profit">Lucros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Receitas Totais</p>
                  <p className="text-2xl font-bold">{formatCurrency(financialSummary.totalIncome + financialSummary.totalProfit)}</p>
                  <p className="text-xs text-emerald-200 mt-1">
                    {formatCurrency(financialSummary.totalIncome)} + {formatCurrency(financialSummary.totalProfit)} lucros
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Despesas Totais</p>
                  <p className="text-2xl font-bold">{formatCurrency(financialSummary.totalExpense + financialSummary.totalInvestment)}</p>
                  <p className="text-xs text-red-200 mt-1">
                    {formatCurrency(financialSummary.totalExpense)} + {formatCurrency(financialSummary.totalInvestment)} investimentos
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>

          <Card className={`border-0 shadow-lg text-white ${financialSummary.netWorth >= 0 
            ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
            : 'bg-gradient-to-br from-orange-500 to-orange-600'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${financialSummary.netWorth >= 0 ? 'text-blue-100' : 'text-orange-100'}`}>
                    Saldo Líquido
                  </p>
                  <p className="text-2xl font-bold">{formatCurrency(financialSummary.netWorth)}</p>
                  <p className={`text-xs mt-1 ${financialSummary.netWorth >= 0 ? 'text-blue-200' : 'text-orange-200'}`}>
                    {financialSummary.netWorth >= 0 ? '💰 Positivo' : '⚠️ Negativo'}
                  </p>
                </div>
                <BarChart3 className={`h-8 w-8 ${financialSummary.netWorth >= 0 ? 'text-blue-200' : 'text-orange-200'}`} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Transações</p>
                  <p className="text-2xl font-bold">{financialSummary.totalTransactions}</p>
                  <p className="text-xs text-purple-200 mt-1">
                    Média: {formatCurrency(financialSummary.averageTransaction)}
                  </p>
                </div>
                <div className="text-2xl">{topCategory?.icon || "📊"}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <ExpenseCharts expenses={filteredExpenses} categories={defaultCategories} />
      </div>
    </div>
  );
};

export default Charts;
