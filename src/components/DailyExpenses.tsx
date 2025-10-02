import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, TrendingDown, TrendingUp, DollarSign, RefreshCw } from 'lucide-react';
import { Expense, Category } from './ExpenseForm';
import { useForceUpdate } from '@/hooks/use-force-update';

interface DailyExpensesProps {
  expenses: Expense[];
  categories: Category[];
}

interface DailyExpenseData {
  date: string;
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  transactions: Expense[];
}

export const DailyExpenses = ({ expenses, categories }: DailyExpensesProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const forceUpdate = useForceUpdate();

  // Forçar atualização quando as despesas mudarem
  useEffect(() => {
    forceUpdate();
  }, [expenses, forceUpdate]);

  // Função para formatar data
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Função para formatar data para exibição
  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Função para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Agrupar despesas por dia
  const dailyExpenses = useMemo(() => {
    const grouped = expenses.reduce((acc, expense) => {
      const date = expense.date;
      
      if (!acc[date]) {
        acc[date] = {
          date,
          totalIncome: 0,
          totalExpense: 0,
          netAmount: 0,
          transactions: []
        };
      }
      
      acc[date].transactions.push(expense);
      
      if (expense.type === 'income' || expense.type === 'investment_profit') {
        acc[date].totalIncome += expense.amount;
      } else {
        acc[date].totalExpense += expense.amount;
      }
      
      acc[date].netAmount = acc[date].totalIncome - acc[date].totalExpense;
      
      return acc;
    }, {} as Record<string, DailyExpenseData>);

    return Object.values(grouped).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses]);

  // Filtrar despesas do mês atual e criar dias vazios
  const currentMonthExpenses = useMemo(() => {
    const currentMonth = currentDate.getMonth() + 1; // +1 porque getMonth() retorna 0-11
    const currentYear = currentDate.getFullYear();
    
    // Criar string de referência do mês (YYYY-MM)
    const monthString = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    
    // Filtrar despesas do mês atual usando comparação de string
    const monthExpenses = dailyExpenses.filter(day => {
      return day.date.startsWith(monthString);
    });

    // Criar um mapa de despesas por data para facilitar a busca
    const expensesByDate = monthExpenses.reduce((acc, day) => {
      acc[day.date] = day;
      return acc;
    }, {} as Record<string, DailyExpenseData>);

    // Gerar todos os dias do mês
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const allDays: DailyExpenseData[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      if (expensesByDate[dateString]) {
        allDays.push(expensesByDate[dateString]);
      } else {
        // Criar um dia vazio
        allDays.push({
          date: dateString,
          totalIncome: 0,
          totalExpense: 0,
          netAmount: 0,
          transactions: []
        });
      }
    }

    // Ordenar por data (mais recente primeiro)
    return allDays.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [dailyExpenses, currentDate]);

  // Navegar para o mês anterior
  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  // Navegar para o próximo mês
  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  // Calcular totais do mês
  const monthTotals = useMemo(() => {
    return currentMonthExpenses.reduce(
      (totals, day) => ({
        totalIncome: totals.totalIncome + day.totalIncome,
        totalExpense: totals.totalExpense + day.totalExpense,
        netAmount: totals.netAmount + day.netAmount,
      }),
      { totalIncome: 0, totalExpense: 0, netAmount: 0 }
    );
  }, [currentMonthExpenses]);

  // Obter categoria por ID
  const getCategoryById = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId);
  };

  return (
    <div className="space-y-6">
      {/* Header com navegação do mês */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Gastos Diários
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold min-w-[200px] text-center">
                {currentDate.toLocaleDateString('pt-BR', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={forceUpdate}
                className="ml-2"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Resumo do mês */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Entradas</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(monthTotals.totalIncome)}
              </div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">Saídas</span>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(monthTotals.totalExpense)}
              </div>
            </div>
            <div className={`text-center p-4 rounded-lg ${
              monthTotals.netAmount >= 0 
                ? 'bg-blue-50 dark:bg-blue-950/20' 
                : 'bg-orange-50 dark:bg-orange-950/20'
            }`}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className={`h-4 w-4 ${
                  monthTotals.netAmount >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`} />
                <span className={`text-sm font-medium ${
                  monthTotals.netAmount >= 0 
                    ? 'text-blue-700 dark:text-blue-300' 
                    : 'text-orange-700 dark:text-orange-300'
                }`}>
                  Saldo
                </span>
              </div>
              <div className={`text-2xl font-bold ${
                monthTotals.netAmount >= 0 ? 'text-blue-600' : 'text-orange-600'
              }`}>
                {formatCurrency(monthTotals.netAmount)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de gastos diários */}
      <div className="space-y-4">
        {currentMonthExpenses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma transação encontrada para este mês</p>
            </CardContent>
          </Card>
        ) : (
          currentMonthExpenses.map((day) => {
            const hasTransactions = day.transactions.length > 0;
            
            return (
              <Card 
                key={day.date} 
                className={`transition-all duration-200 ${
                  hasTransactions 
                    ? `cursor-pointer hover:shadow-md ${selectedDate === day.date ? 'ring-2 ring-primary' : ''}` 
                    : 'opacity-60'
                }`}
                onClick={() => hasTransactions && setSelectedDate(selectedDate === day.date ? null : day.date)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className={`text-lg ${!hasTransactions ? 'text-gray-400' : ''}`}>
                        {formatDisplayDate(day.date)}
                      </CardTitle>
                      <p className={`text-sm ${!hasTransactions ? 'text-gray-400' : 'text-gray-500'}`}>
                        {hasTransactions 
                          ? `${day.transactions.length} transação${day.transactions.length !== 1 ? 'ões' : ''}`
                          : 'Nenhuma transação'
                        }
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${
                        !hasTransactions 
                          ? 'text-gray-400' 
                          : day.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {hasTransactions ? formatCurrency(day.netAmount) : 'R$ 0,00'}
                      </div>
                      {hasTransactions && (
                        <div className="text-sm text-gray-500">
                          {formatCurrency(day.totalIncome)} - {formatCurrency(day.totalExpense)}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                {hasTransactions && selectedDate === day.date && (
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {day.transactions.map((transaction) => {
                        const category = getCategoryById(transaction.category);
                        return (
                          <div 
                            key={transaction.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: category?.color || '#64748b' }}
                              />
                              <div>
                                <div className="font-medium">{transaction.description}</div>
                                <div className="text-sm text-gray-500 flex items-center gap-2">
                                  <span>{category?.icon} {category?.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {transaction.type === 'income' ? 'Entrada' :
                                     transaction.type === 'expense' ? 'Despesa' :
                                     transaction.type === 'transfer' ? 'Transferência' :
                                     transaction.type === 'investment' ? 'Investimento' :
                                     transaction.type === 'investment_profit' ? 'Lucro' :
                                     transaction.type === 'loan' ? 'Empréstimo' : 'Outro'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className={`font-semibold ${
                              transaction.type === 'income' || transaction.type === 'investment_profit'
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {transaction.type === 'income' || transaction.type === 'investment_profit' ? '+' : '-'}
                              {formatCurrency(transaction.amount)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
