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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="group relative overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
          <CardContent className="relative pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Total de Entradas</p>
                <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100">
                  {formatCurrency(totalIncome)}
                </p>
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-xs font-medium">Crescimento</span>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-400/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
          <CardContent className="relative pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wide">Total de Despesas</p>
                <p className="text-2xl font-black text-red-900 dark:text-red-100">
                  {formatCurrency(totalExpenses)}
                </p>
                <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                  <TrendingDown className="h-3 w-3" />
                  <span className="text-xs font-medium">Gastos</span>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <TrendingDown className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`group relative overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border-0 hover:scale-105 ${
          balance >= 0 
            ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30' 
            : 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/30'
        }`}>
          <div className={`absolute inset-0 ${
            balance >= 0 
              ? 'bg-gradient-to-br from-blue-500/10 to-transparent' 
              : 'bg-gradient-to-br from-orange-500/10 to-transparent'
          }`}></div>
          <div className={`absolute top-0 right-0 w-32 h-32 ${
            balance >= 0 
              ? 'bg-gradient-to-br from-blue-400/20 to-transparent' 
              : 'bg-gradient-to-br from-orange-400/20 to-transparent'
          } rounded-full -translate-y-16 translate-x-16`}></div>
          <CardContent className="relative pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className={`text-xs font-semibold uppercase tracking-wide ${
                  balance >= 0 
                    ? 'text-blue-700 dark:text-blue-300' 
                    : 'text-orange-700 dark:text-orange-300'
                }`}>Saldo Atual</p>
                <p className={`text-2xl font-black ${
                  balance >= 0 
                    ? 'text-blue-900 dark:text-blue-100' 
                    : 'text-orange-900 dark:text-orange-100'
                }`}>
                  {formatCurrency(balance)}
                </p>
                <div className={`flex items-center gap-1 ${
                  balance >= 0 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-orange-600 dark:text-orange-400'
                }`}>
                  <Wallet className="h-3 w-3" />
                  <span className="text-xs font-medium">
                    {balance >= 0 ? 'Positivo' : 'Negativo'}
                  </span>
                </div>
              </div>
              <div className={`p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300 ${
                balance >= 0 
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                  : 'bg-gradient-to-br from-orange-500 to-orange-600'
              }`}>
                <Wallet className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional transaction types */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="group relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/30 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent"></div>
          <CardContent className="relative pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">Investimentos</p>
                <p className="text-lg font-black text-purple-900 dark:text-purple-100">
                  {formatCurrency(totalInvestments)}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                <InvestmentIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent"></div>
          <CardContent className="relative pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Poupança</p>
                <p className="text-lg font-black text-emerald-900 dark:text-emerald-100">
                  {formatCurrency(totalSavings)}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                <PiggyBank className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/30 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent"></div>
          <CardContent className="relative pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wide">Empréstimos</p>
                <p className="text-lg font-black text-orange-900 dark:text-orange-100">
                  {formatCurrency(totalLoans)}
                </p>
                <div className="text-xs space-y-1">
                  <p className="text-orange-600 dark:text-orange-400">
                    Saldo: <span className={remainingLoanBalance > 0 ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-emerald-600 dark:text-emerald-400 font-semibold'}>
                      {formatCurrency(remainingLoanBalance)}
                    </span>
                  </p>
                  {totalLoanPayments > 0 && (
                    <p className="text-emerald-600 dark:text-emerald-400">
                      Pago: <span className="font-semibold">{formatCurrency(totalLoanPayments)}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950/50 dark:to-teal-900/30 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent"></div>
          <CardContent className="relative pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wide">Lucros de Investimento</p>
                <p className="text-lg font-black text-teal-900 dark:text-teal-100">
                  {formatCurrency(totalInvestmentProfits)}
                </p>
                <p className="text-xs text-teal-600 dark:text-teal-400">
                  {currentAndPastExpenses.filter((e) => e.type === "investment_profit").length} transações
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
