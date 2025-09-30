import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Receipt } from "lucide-react";
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
            <p>Nenhuma despesa registrada ainda.</p>
            <p className="text-sm mt-2">Adicione sua primeira despesa acima!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => {
              const category = getCategoryInfo(expense.category);
              return (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-gradient-card hover:shadow-md transition-all duration-200 hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-2xl">{category?.icon || "📝"}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{expense.description}</p>
                      <div className="flex items-center gap-2 mt-1">
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
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(expense.date), "dd MMM yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-destructive">
                      {formatCurrency(expense.amount)}
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
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
