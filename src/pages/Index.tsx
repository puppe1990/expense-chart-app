import { useState } from "react";
import { ExpenseForm, Category, Expense } from "@/components/ExpenseForm";
import { ExpenseList } from "@/components/ExpenseList";
import { SummaryCards } from "@/components/SummaryCards";
import { FinancialHealthPanel } from "@/components/FinancialHealthPanel";
import { MonthlyDrePanel } from "@/components/MonthlyDrePanel";
import { CodexAssistant } from "@/components/CodexAssistant";
import { EditTransactionDialog } from "@/components/EditTransactionDialog";
import { Wallet, Download, Upload, Trash2, BarChart3, Calendar, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useExpensesStorage, useLocalStorage } from "@/hooks/use-local-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultCategories } from "@/data/categories";
import { parseC6BankStatement, parseC6CardStatementCsv } from "@/lib/c6-bank-parser";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACCOUNT_OPTIONS, AccountType, filterExpensesByAccount } from "@/lib/accounts";
import { useAuth } from "@/hooks/use-auth";

const Index = () => {
  const { user, signOut } = useAuth();
  const { expenses, addExpense, updateExpense, deleteExpense, clearExpenses, exportExpenses, importExpenses, duplicateExpense, addExpensesBatch } = useExpensesStorage();
  const [activeAccount, setActiveAccount] = useLocalStorage<AccountType>("expense-chart-account", "pf");
  const [categories] = useState<Category[]>(defaultCategories);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [, setFileInputRef] = useState<HTMLInputElement | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [importBank, setImportBank] = useState("c6");
  const [importPassword, setImportPassword] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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
    const expense = expenses.find(e => e.id === id);
    if (expense) {
      setExpenseToDelete(expense);
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDeleteExpense = () => {
    if (expenseToDelete) {
      deleteExpense(expenseToDelete.id);
      toast.success("Transação removida com sucesso!");
      setExpenseToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const cancelDeleteExpense = () => {
    setExpenseToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const handleDuplicateExpense = (expense: Expense) => {
    duplicateExpense(expense);
    toast.success("Transação duplicada com sucesso!");
  };

  const handleClearExpenses = () => {
    clearExpenses();
    toast.success("Todos os dados foram removidos!");
    setIsClearDialogOpen(false);
  };

  const handleExportExpenses = () => {
    exportExpenses(activeAccount);
    toast.success("Dados exportados com sucesso!");
  };

  const handleImportFile = async (file: File) => {
    try {
      setIsImporting(true);
      if (importBank === "c6") {
        const isCsv = file.name.toLowerCase().endsWith(".csv") || file.type.includes("csv");
        const parsedExpenses = isCsv
          ? await parseC6CardStatementCsv(file)
          : await parseC6BankStatement(file, importPassword);
        if (parsedExpenses.length === 0) {
          throw new Error("Nenhuma transação encontrada no arquivo.");
        }
        const result = addExpensesBatch(parsedExpenses);
        if (result.added === 0) {
          throw new Error("Nenhuma transação nova para importar.");
        }
        toast.success(
          `${isCsv ? "Fatura C6" : "Extrato C6"}: ${result.added} adicionadas, ${result.duplicates} duplicadas, ${result.invalid} inválidas, ${result.autoCategorized} auto-categorizadas.`
        );
      } else {
        await importExpenses(file);
        toast.success("Dados importados com sucesso!");
      }
      setIsImportDialogOpen(false);
    } catch (error) {
      toast.error("Erro ao importar dados. Verifique o formato do arquivo.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportExpenses = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    for (const file of files) {
      await handleImportFile(file);
    }
    event.target.value = "";
  };

  const handleDropFile = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const files = Array.from(event.dataTransfer.files ?? []);
    if (files.length === 0) return;
    for (const file of files) {
      await handleImportFile(file);
    }
  };

  const accountExpenses = filterExpensesByAccount(expenses, activeAccount);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Controle Financeiro</h1>
                <p className="text-sm text-gray-600">Gerencie suas despesas</p>
              </div>
            </div>
            
            {/* Navigation and Data Management Buttons */}
            <div className="flex items-center gap-2">
              <Select value={activeAccount} onValueChange={(value: AccountType) => setActiveAccount(value)}>
                <SelectTrigger className="w-[120px]" aria-label="Conta">
                  <SelectValue placeholder="Conta" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Link to="/charts">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Gráficos
                </Button>
              </Link>
              
              <Link to="/daily">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Diário
                </Button>
              </Link>
              
              <Button
                onClick={handleExportExpenses}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar
              </Button>
              
              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Importar
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Importar Dados</DialogTitle>
                    <DialogDescription>
                      Escolha o banco e selecione o arquivo para importar (C6: PDF ou CSV de fatura).
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="bank" className="text-right">
                        Banco
                      </Label>
                      <Select value={importBank} onValueChange={setImportBank}>
                        <SelectTrigger id="bank" className="col-span-3">
                          <SelectValue placeholder="Selecione o banco" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="c6">C6 Bank</SelectItem>
                          <SelectItem value="json">Arquivo JSON do app</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {importBank === "c6" && (
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">
                          Senha
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={importPassword}
                          onChange={(event) => setImportPassword(event.target.value)}
                          className="col-span-3"
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="file" className="text-right">
                        Arquivo
                      </Label>
                      <div className="col-span-3">
                        <div
                          className={`flex flex-col items-center justify-center rounded-md border border-dashed px-4 py-6 text-center text-sm transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30"}`}
                          onDragOver={(event) => {
                            event.preventDefault();
                            setIsDragging(true);
                          }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={handleDropFile}
                        >
                          <Input
                            id="file"
                            type="file"
                            accept={importBank === "c6" ? ".pdf,.csv" : ".json"}
                            multiple
                            onChange={handleImportExpenses}
                            ref={setFileInputRef}
                            className="hidden"
                            disabled={isImporting}
                          />
                          <p className="text-muted-foreground">
                            Arraste o arquivo aqui ou{" "}
                            <Label htmlFor="file" className="cursor-pointer text-primary underline-offset-4 hover:underline">
                              selecione no computador
                            </Label>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {importBank === "c6" ? "Formatos PDF ou CSV" : "Formato JSON"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsImportDialogOpen(false)}
                      disabled={isImporting}
                    >
                      Cancelar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Limpar
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
                      onClick={() => setIsClearDialogOpen(false)}
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

              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="flex items-center gap-2"
                title={user?.email ?? "Sair"}
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <FinancialHealthPanel expenses={expenses} />
        <MonthlyDrePanel expenses={expenses} />
        <CodexAssistant />

        <SummaryCards expenses={accountExpenses} account={activeAccount} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1">
            <ExpenseForm 
              categories={categories} 
              onAddExpense={handleAddExpense} 
              existingLoans={accountExpenses.filter(e => e.type === "loan")}
              defaultAccount={activeAccount}
            />
          </div>
          <div className="xl:col-span-2">
            <ExpenseList
              expenses={accountExpenses}
              categories={categories}
              onDeleteExpense={handleDeleteExpense}
              onEditExpense={handleEditExpense}
              onDuplicateExpense={handleDuplicateExpense}
              activeAccount={activeAccount}
            />
          </div>
        </div>
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
        existingLoans={accountExpenses.filter(e => e.type === "loan")}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Tem certeza que deseja excluir a transação <strong>"{expenseToDelete?.description}"</strong>?
              <br />
              <span className="text-sm text-muted-foreground mt-2 block">
                Esta ação não pode ser desfeita.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeleteExpense}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteExpense}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
