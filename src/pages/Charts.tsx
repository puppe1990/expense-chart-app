import { ExpenseCharts } from "@/components/ExpenseCharts";
import { Category, Expense } from "@/components/ExpenseForm";
import { useExpensesStorage } from "@/hooks/use-local-storage";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Gráficos e Análises</h1>
                <p className="text-sm text-gray-600">Visualize seus dados financeiros</p>
              </div>
            </div>
            
            {/* Navigation Button */}
            <div className="flex items-center gap-2">
              <Link to="/">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao Início
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <ExpenseCharts expenses={expenses} categories={defaultCategories} />
      </div>
    </div>
  );
};

export default Charts;
