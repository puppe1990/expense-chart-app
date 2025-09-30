import { useState } from "react";
import { ExpenseForm, Category, Expense } from "@/components/ExpenseForm";
import { ExpenseList } from "@/components/ExpenseList";
import { SummaryCards } from "@/components/SummaryCards";
import { ExpenseCharts } from "@/components/ExpenseCharts";
import { Wallet } from "lucide-react";
import { toast } from "sonner";

const defaultCategories: Category[] = [
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

const Index = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories] = useState<Category[]>(defaultCategories);

  const handleAddExpense = (expense: Omit<Expense, "id">) => {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(),
    };
    setExpenses([newExpense, ...expenses]);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter((expense) => expense.id !== id));
    toast.success("Despesa removida com sucesso!");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-primary rounded-full">
              <Wallet className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-3">
            Controle Financeiro
          </h1>
          <p className="text-muted-foreground text-lg">
            Gerencie suas despesas de forma inteligente e visual
          </p>
        </header>

        <SummaryCards expenses={expenses} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <ExpenseForm categories={categories} onAddExpense={handleAddExpense} />
          </div>
          <div className="lg:col-span-2">
            <ExpenseList
              expenses={expenses}
              categories={categories}
              onDeleteExpense={handleDeleteExpense}
            />
          </div>
        </div>

        <ExpenseCharts expenses={expenses} categories={categories} />
      </div>
    </div>
  );
};

export default Index;
