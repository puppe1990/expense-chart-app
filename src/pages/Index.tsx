import { useState } from "react";
import { ExpenseForm, Category, Expense } from "@/components/ExpenseForm";
import { ExpenseList } from "@/components/ExpenseList";
import { SummaryCards } from "@/components/SummaryCards";
import { ExpenseCharts } from "@/components/ExpenseCharts";
import { EditTransactionDialog } from "@/components/EditTransactionDialog";
import { Wallet, Download, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useExpensesStorage } from "@/hooks/use-local-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

const Index = () => {
  const { expenses, addExpense, updateExpense, deleteExpense, clearExpenses, exportExpenses, importExpenses } = useExpensesStorage();
  const [categories] = useState<Category[]>(defaultCategories);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleAddExpense = (expense: Omit<Expense, "id">) => {
    addExpense(expense);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditDialogOpen(true);
  };

  const handleUpdateExpense = (updatedExpense: Omit<Expense, "id">) => {
    if (editingExpense) {
      updateExpense(editingExpense.id, updatedExpense);
      toast.success("Transação atualizada com sucesso!");
    }
  };

  const handleDeleteExpense = (id: string) => {
    deleteExpense(id);
    toast.success("Despesa removida com sucesso!");
  };

  const handleClearExpenses = () => {
    clearExpenses();
    toast.success("Todos os dados foram removidos!");
  };

  const handleExportExpenses = () => {
    exportExpenses();
    toast.success("Dados exportados com sucesso!");
  };

  const handleImportExpenses = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importExpenses(file);
      toast.success("Dados importados com sucesso!");
      setIsImportDialogOpen(false);
    } catch (error) {
      toast.error("Erro ao importar dados. Verifique o formato do arquivo.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-12 text-center relative">
          {/* Background decoration */}
          <div className="absolute inset-0 -top-8 -left-4 -right-4 h-32 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-3xl blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/60 rounded-full blur-lg opacity-30"></div>
                <div className="relative p-4 bg-gradient-to-br from-primary to-primary/80 rounded-full shadow-2xl">
                  <Wallet className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent mb-3 tracking-tight">
              Controle Financeiro
            </h1>
            <p className="text-muted-foreground text-base mb-6 max-w-2xl mx-auto leading-relaxed">
              Gerencie suas despesas de forma inteligente e visual com insights poderosos
            </p>
          </div>
          
          {/* Data Management Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Button
              onClick={handleExportExpenses}
              variant="outline"
              className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Download className="h-4 w-4" />
              Exportar Dados
            </Button>
            
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
                  <Upload className="h-4 w-4" />
                  Importar Dados
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Importar Dados</DialogTitle>
                  <DialogDescription>
                    Selecione um arquivo JSON com seus dados de despesas para importar.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="file" className="text-right">
                      Arquivo
                    </Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".json"
                      onChange={handleImportExpenses}
                      ref={setFileInputRef}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsImportDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 hover:border-destructive/50 hover:bg-destructive/5 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
                  <Trash2 className="h-4 w-4" />
                  Limpar Dados
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Limpar Todos os Dados</DialogTitle>
                  <DialogDescription>
                    Esta ação irá remover permanentemente todos os dados de despesas. 
                    Esta ação não pode ser desfeita.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {}}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleClearExpenses}
                  >
                    Confirmar Limpeza
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <SummaryCards expenses={expenses} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <div className="xl:col-span-1">
            <ExpenseForm 
              categories={categories} 
              onAddExpense={handleAddExpense} 
              existingLoans={expenses.filter(e => e.type === "loan")}
            />
          </div>
          <div className="xl:col-span-2">
            <ExpenseList
              expenses={expenses}
              categories={categories}
              onDeleteExpense={handleDeleteExpense}
              onEditExpense={handleEditExpense}
            />
          </div>
        </div>

        <ExpenseCharts expenses={expenses} categories={categories} />
      </div>

      {/* Edit Transaction Dialog */}
      <EditTransactionDialog
        expense={editingExpense}
        categories={categories}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleUpdateExpense}
        existingLoans={expenses.filter(e => e.type === "loan")}
      />
    </div>
  );
};

export default Index;
