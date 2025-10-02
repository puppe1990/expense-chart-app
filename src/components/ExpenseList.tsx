import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Receipt, CreditCard, FileText, Tag, RotateCcw, ArrowRightLeft, Edit, Search, X, ChevronLeft, ChevronRight, Copy } from "lucide-react";
import { Category, Expense } from "./ExpenseForm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";

interface ExpenseListProps {
  expenses: Expense[];
  categories: Category[];
  onDeleteExpense: (id: string) => void;
  onEditExpense: (expense: Expense) => void;
  onDuplicateExpense: (expense: Expense) => void;
}

const ITEMS_PER_PAGE = 5;

export const ExpenseList = ({ expenses, categories, onDeleteExpense, onEditExpense, onDuplicateExpense }: ExpenseListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

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
    };
    return icons[type] || "📝";
  };

  const getPaymentMethodIcon = (method?: Expense["paymentMethod"]) => {
    const icons = {
      cash: "💵",
      card: "💳",
      bank_transfer: "🏦",
      pix: "⚡",
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
    };
    return colors[type] || "text-gray-600 dark:text-gray-400";
  };

  // Filter expenses based on search query
  const filteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) {
      return expenses;
    }

    const query = searchQuery.toLowerCase().trim();
    return expenses.filter((expense) => {
      const category = getCategoryInfo(expense.category);
      const categoryName = category?.name?.toLowerCase() || "";
      
      return (
        expense.description.toLowerCase().includes(query) ||
        categoryName.includes(query) ||
        expense.notes?.toLowerCase().includes(query) ||
        expense.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        expense.fromAccount?.toLowerCase().includes(query) ||
        expense.toAccount?.toLowerCase().includes(query) ||
        format(new Date(expense.date + 'T00:00:00'), "dd MMM yyyy", { locale: ptBR }).toLowerCase().includes(query)
      );
    });
  }, [expenses, searchQuery, categories]);

  // Pagination logic
  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex);

  // Reset to first page when search query changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <Card className="group relative overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/10 to-transparent rounded-full -translate-y-20 translate-x-20"></div>
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-bold">
            <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            Transações Recentes
            {searchQuery && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({filteredExpenses.length} de {expenses.length})
              </span>
            )}
          </CardTitle>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar transações..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSearchChange("")}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="relative">
        {expenses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center">
              <Receipt className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-base font-medium">Nenhuma transação registrada ainda.</p>
            <p className="text-xs mt-2 text-gray-500">Adicione sua primeira transação acima!</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-base font-medium">Nenhuma transação encontrada.</p>
            <p className="text-xs mt-2 text-gray-500">Tente ajustar os termos de busca.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedExpenses.map((expense) => {
              const category = getCategoryInfo(expense.category);
              const isIncome = expense.type === "income";
              const isTransfer = expense.type === "transfer";
              
              return (
                <div
                  key={expense.id}
                  className="group/item relative p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:scale-[1.02] hover:border-primary/20"
                >
                  {/* Main transaction info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-3xl p-3 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl group-hover/item:scale-110 transition-transform duration-300">
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
                        <p className="font-semibold text-base truncate text-gray-900 dark:text-gray-100">{expense.description}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge
                            variant="secondary"
                            className="text-xs font-medium px-3 py-1 rounded-full"
                            style={{
                              backgroundColor: category?.color + "20",
                              color: category?.color,
                              border: `1px solid ${category?.color}40`,
                            }}
                          >
                            {category?.name}
                          </Badge>
                          <Badge variant="outline" className="text-xs font-medium px-3 py-1 rounded-full border-gray-300 dark:border-gray-600">
                            {getPaymentMethodIcon(expense.paymentMethod)}
                          </Badge>
                          {expense.isRecurring && (
                            <Badge variant="outline" className="text-xs font-medium px-3 py-1 rounded-full text-purple-600 border-purple-600 bg-purple-50 dark:bg-purple-950/20">
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Recorrente
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {format(new Date(expense.date + 'T00:00:00'), "dd MMM yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-lg font-black ${getTransactionTypeColor(expense.type)}`}>
                        {isIncome ? "+" : isTransfer ? "" : "-"}{formatCurrency(expense.amount)}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditExpense(expense)}
                          className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-300 hover:scale-110"
                          title="Editar transação"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDuplicateExpense(expense)}
                          className="h-10 w-10 rounded-xl hover:bg-blue-500/10 hover:text-blue-500 transition-all duration-300 hover:scale-110"
                          title="Duplicar transação"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteExpense(expense.id)}
                          className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all duration-300 hover:scale-110"
                          title="Excluir transação"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
                          até {format(new Date(expense.recurringEndDate + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Mostrando {startIndex + 1}-{Math.min(endIndex, filteredExpenses.length)} de {filteredExpenses.length} transações
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {(() => {
                      const maxVisiblePages = 5;
                      const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                      const pages = [];
                      
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(i);
                      }
                      
                      return pages.map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(page)}
                          className="h-8 w-8 p-0 text-xs"
                        >
                          {page}
                        </Button>
                      ));
                    })()}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
