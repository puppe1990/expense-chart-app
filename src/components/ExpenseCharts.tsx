import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, AreaChart, Area, ComposedChart } from "recharts";
import { Category, Expense } from "./ExpenseForm";
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Activity, DollarSign, Calendar, Tag } from "lucide-react";
import { filterNonFutureExpenses, parseDateString } from "@/lib/utils";

interface ExpenseChartsProps {
  expenses: Expense[];
  categories: Category[];
}

export const ExpenseCharts = ({ expenses, categories }: ExpenseChartsProps) => {
  // Usar os dados já filtrados que vêm da página
  const currentAndPastExpenses = expenses;

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
    const monthlyData: { [key: string]: { income: number; expense: number; investment: number; profit: number; net: number } } = {};
    
    currentAndPastExpenses.forEach((expense) => {
      const date = parseDateString(expense.date);
      const monthKey = date.toLocaleString("pt-BR", { month: "short", year: "numeric" });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0, investment: 0, profit: 0, net: 0 };
      }
      
      switch (expense.type) {
        case "income":
          monthlyData[monthKey].income += expense.amount;
          break;
        case "expense":
          monthlyData[monthKey].expense += expense.amount;
          break;
        case "investment":
          monthlyData[monthKey].investment += expense.amount;
          break;
        case "investment_profit":
          monthlyData[monthKey].profit += expense.amount;
          break;
      }
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expense: data.expense,
        investment: data.investment,
        profit: data.profit,
        net: data.income + data.profit - data.expense - data.investment,
        total: data.income + data.expense + data.investment + data.profit,
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

  const getWeeklyData = () => {
    const weeklyTotals: { [key: string]: { income: number; expense: number; net: number } } = {};
    
    currentAndPastExpenses.forEach((expense) => {
      const date = parseDateString(expense.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toLocaleDateString("pt-BR", { month: "short", day: "numeric" });
      
      if (!weeklyTotals[weekKey]) {
        weeklyTotals[weekKey] = { income: 0, expense: 0, net: 0 };
      }
      
      if (expense.type === "income" || expense.type === "investment_profit") {
        weeklyTotals[weekKey].income += expense.amount;
      } else {
        weeklyTotals[weekKey].expense += expense.amount;
      }
    });

    return Object.entries(weeklyTotals)
      .map(([week, totals]) => ({
        week,
        income: totals.income,
        expense: totals.expense,
        net: totals.income - totals.expense,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.week);
        const dateB = new Date(b.week);
        return dateA.getTime() - dateB.getTime();
      });
  };

  const getTypeDistribution = () => {
    const typeTotals: { [key: string]: number } = {};
    
    currentAndPastExpenses.forEach((expense) => {
      const typeName = expense.type === "income" ? "Receitas" : 
                      expense.type === "expense" ? "Despesas" :
                      expense.type === "investment" ? "Investimentos" :
                      expense.type === "investment_profit" ? "Lucros" : "Outros";
      
      if (typeTotals[typeName]) {
        typeTotals[typeName] += expense.amount;
      } else {
        typeTotals[typeName] = expense.amount;
      }
    });

    return Object.entries(typeTotals).map(([type, total]) => ({
      name: type,
      value: total,
      color: type === "Receitas" ? "#10b981" :
             type === "Despesas" ? "#ef4444" :
             type === "Investimentos" ? "#8b5cf6" :
             type === "Lucros" ? "#059669" : "#64748b"
    }));
  };

  const getTagsData = () => {
    const tagTotals: { [key: string]: number } = {};
    
    currentAndPastExpenses.forEach((expense) => {
      if (expense.tags && expense.tags.length > 0) {
        expense.tags.forEach((tag) => {
          if (tagTotals[tag]) {
            tagTotals[tag] += expense.amount;
          } else {
            tagTotals[tag] = expense.amount;
          }
        });
      }
    });

    // Gerar cores dinâmicas para cada tag
    const colors = [
      "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", 
      "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
      "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
      "#ec4899", "#f43f5e", "#64748b", "#71717a", "#78716c"
    ];

    return Object.entries(tagTotals)
      .map(([tag, total], index) => ({
        name: tag,
        value: total,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value); // Ordenar por valor decrescente
  };

  const categoryData = getCategoryData();
  const monthlyData = getMonthlyData();
  const investmentProfitData = getInvestmentProfitData();
  const weeklyData = getWeeklyData();
  const typeDistributionData = getTypeDistribution();
  const tagsData = getTagsData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (currentAndPastExpenses.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
          <BarChart3 className="h-12 w-12 text-blue-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum dado para exibir</h3>
        <p className="text-gray-600 mb-6">Adicione algumas transações para ver os gráficos e análises</p>
        <div className="inline-flex items-center gap-2 text-sm text-blue-600">
          <Activity className="h-4 w-4" />
          Volte à página principal para adicionar dados
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Primeira linha - Gráficos principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Pizza - Categorias */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <PieChartIcon className="h-5 w-5 text-white" />
              </div>
              Distribuição por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
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

        {/* Gráfico de Barras - Análise Mensal Detalhada */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              Análise Mensal Detalhada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#dc2626" />
                  </linearGradient>
                  <linearGradient id="investmentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                  <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip 
                  formatter={(value, name) => [
                    formatCurrency(value as number), 
                    name === 'income' ? 'Receitas' :
                    name === 'expense' ? 'Despesas' :
                    name === 'investment' ? 'Investimentos' :
                    name === 'profit' ? 'Lucros' :
                    name === 'net' ? 'Saldo Líquido' : name
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="income" name="Receitas" fill="url(#incomeGradient)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expense" name="Despesas" fill="url(#expenseGradient)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="investment" name="Investimentos" fill="url(#investmentGradient)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="profit" name="Lucros" fill="url(#profitGradient)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="net" name="Saldo Líquido" fill="url(#netGradient)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Segunda linha - Análises avançadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Área - Receitas vs Despesas */}
        {weeklyData.length > 0 && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                Receitas vs Despesas (Semanal)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={weeklyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip 
                    formatter={(value, name) => [
                      formatCurrency(value as number), 
                      name === 'income' ? 'Receitas' : name === 'expense' ? 'Despesas' : 'Saldo'
                    ]}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area type="monotone" dataKey="income" stackId="1" stroke="#10b981" fill="url(#incomeGradient)" />
                  <Area type="monotone" dataKey="expense" stackId="2" stroke="#ef4444" fill="url(#expenseGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Gráfico de Pizza - Tipos de Transação */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              Distribuição por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={typeDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Terceira linha - Gráficos de tendência */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Saldo Líquido Mensal */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              Saldo Líquido Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="netBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip 
                  formatter={(value) => [
                    formatCurrency(value as number), 
                    'Saldo Líquido'
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="net" 
                  fill="url(#netBarGradient)" 
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de investimentos (se houver dados) */}
        {investmentProfitData.length > 0 && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                Evolução dos Lucros de Investimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={investmentProfitData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value as number), 'Lucros']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#059669" 
                    strokeWidth={3}
                    dot={{ fill: '#059669', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: '#059669', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quarta linha - Gráfico de Tags */}
      {tagsData.length > 0 && (
        <div className="grid grid-cols-1 gap-8">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                <div className="p-3 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg">
                  <Tag className="h-5 w-5 text-white" />
                </div>
                Distribuição por Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Gráfico de Pizza */}
                <div>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={tagsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {tagsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Gráfico de Barras */}
                <div>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={tagsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="tagsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ec4899" />
                          <stop offset="100%" stopColor="#be185d" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value as number), 'Total']}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="url(#tagsGradient)" 
                        radius={[6, 6, 0, 0]}
                      >
                        {tagsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
