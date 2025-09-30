import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Receipt, CreditCard, FileText, Tag, RotateCcw, ArrowRightLeft } from "lucide-react";
import { Category, Expense } from "./ExpenseForm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ExpenseListProps {
  expenses: Expense[];
  categories: Category[];
  onDeleteExpense: (id: string) => void;
}

export const ExpenseList = ({ expenses, categories, onDeleteExpense }: ExpenseListProps) => {
  const getCategoryInfo = (categoryId: string) => {
    return categories.find((cat) => cat.id === categoryId);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getTransactionTypeIcon = (type: Expense["type"]) => {
    const icons = {
      income: "💰",
      expense: "💸",
      transfer: "🔄",
      investment: "📈",
      loan: "🏦",
      savings: "💎",
    };
    return icons[type] || "📝";
  };

  const getPaymentMethodIcon = (method?: Expense["paymentMethod"]) => {
    const icons = {
      cash: "💵",
      card: "💳",
      bank_transfer: "🏦",
      digital_wallet: "📱",
      check: "📝",
      other: "🔧",
    };
    return icons[method || "cash"] || "💵";
  };

  const getTransactionTypeColor = (type: Expense["type"]) => {
    const colors = {
      income: "text-green-600 dark:text-green-400",
      expense: "text-red-600 dark:text-red-400",
      transfer: "text-blue-600 dark:text-blue-400",
      investment: "text-purple-600 dark:text-purple-400",
      loan: "text-orange-600 dark:text-orange-400",
      savings: "text-emerald-600 dark:text-emerald-400",
    };
    return colors[type] || "text-gray-600 dark:text-gray-400";
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          Transações Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma transação registrada ainda.</p>
            <p className="text-sm mt-2">Adicione sua primeira transação acima!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => {
              const category = getCategoryInfo(expense.category);
              const isIncome = expense.type === "income";
              const isTransfer = expense.type === "transfer";
              
              return (
                <div
                  key={expense.id}
                  className="p-4 rounded-lg border bg-gradient-card hover:shadow-md transition-all duration-200 hover:scale-[1.01]"
                >
                  {/* Main transaction info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-2xl">
                        {isTransfer ? (
                          <div className="flex items-center gap-1">
                            <span>{getTransactionTypeIcon(expense.type)}</span>
                            <ArrowRightLeft className="h-4 w-4 text-blue-500" />
                          </div>
                        ) : (
                          getTransactionTypeIcon(expense.type)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{expense.description}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge
                            variant="secondary"
                            className="text-xs"
                            style={{
                              backgroundColor: category?.color + "20",
                              color: category?.color,
                            }}
                          >
                            {category?.name}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getPaymentMethodIcon(expense.paymentMethod)}
                          </Badge>
                          {expense.isRecurring && (
                            <Badge variant="outline" className="text-xs text-purple-600 border-purple-600">
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Recorrente
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(expense.date), "dd MMM yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${getTransactionTypeColor(expense.type)}`}>
                        {isIncome ? "+" : isTransfer ? "" : "-"}{formatCurrency(expense.amount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteExpense(expense.id)}
                        className="hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Transfer details */}
                  {isTransfer && expense.fromAccount && expense.toAccount && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600 dark:text-blue-400 font-medium">De:</span>
                          <span>{expense.fromAccount}</span>
                        </div>
                        <ArrowRightLeft className="h-4 w-4 text-blue-500" />
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600 dark:text-blue-400 font-medium">Para:</span>
                          <span>{expense.toAccount}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {expense.notes && (
                    <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{expense.notes}</span>
                    </div>
                  )}

                  {/* Tags */}
                  {expense.tags && expense.tags.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      {expense.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Recurring info */}
                  {expense.isRecurring && expense.recurringFrequency && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                      <RotateCcw className="h-4 w-4" />
                      <span>
                        Repetir {expense.recurringFrequency === "daily" ? "diariamente" :
                                 expense.recurringFrequency === "weekly" ? "semanalmente" :
                                 expense.recurringFrequency === "monthly" ? "mensalmente" : "anualmente"}
                      </span>
                      {expense.recurringEndDate && (
                        <span className="text-muted-foreground">
                          até {format(new Date(expense.recurringEndDate), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
