import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit, Calendar, CreditCard, FileText, Tag, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Category, Expense } from "./ExpenseForm";

interface EditTransactionDialogProps {
  expense: Expense | null;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<Expense, "id">) => void;
  existingLoans?: Expense[];
}

export const EditTransactionDialog = ({ 
  expense, 
  categories, 
  isOpen, 
  onClose, 
  onSave,
  existingLoans = []
}: EditTransactionDialogProps) => {
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    date: "",
    type: "expense" as Expense["type"],
    paymentMethod: "cash" as Expense["paymentMethod"],
    notes: "",
    tags: "",
    isRecurring: false,
    recurringFrequency: "monthly" as Expense["recurringFrequency"],
    recurringEndDate: "",
    fromAccount: "",
    toAccount: "",
    isLoanPayment: false,
    relatedLoanId: "",
  });

  // Update form data when expense changes
  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description,
        amount: expense.amount.toString(),
        category: expense.category,
        date: expense.date,
        type: expense.type,
        paymentMethod: expense.paymentMethod || "cash",
        notes: expense.notes || "",
        tags: expense.tags ? expense.tags.join(", ") : "",
        isRecurring: expense.isRecurring || false,
        recurringFrequency: expense.recurringFrequency || "monthly",
        recurringEndDate: expense.recurringEndDate || "",
        fromAccount: expense.fromAccount || "",
        toAccount: expense.toAccount || "",
        isLoanPayment: expense.isLoanPayment || false,
        relatedLoanId: expense.relatedLoanId || "",
      });
    }
  }, [expense]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description || !formData.amount || !formData.category) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    // Special validation for transfers
    if (formData.type === "transfer" && (!formData.fromAccount || !formData.toAccount)) {
      toast.error("Para transferências, preencha as contas de origem e destino");
      return;
    }

    // Special validation for loan payments
    if (formData.isLoanPayment && !formData.relatedLoanId) {
      toast.error("Para pagamentos de empréstimo, selecione o empréstimo relacionado");
      return;
    }

    const updatedExpense: Omit<Expense, "id"> = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category,
      date: formData.date,
      type: formData.type,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes.trim() || undefined,
      tags: formData.tags.trim() ? formData.tags.split(",").map(tag => tag.trim()).filter(Boolean) : undefined,
      isRecurring: formData.isRecurring,
      recurringFrequency: formData.isRecurring ? formData.recurringFrequency : undefined,
      recurringEndDate: formData.isRecurring && formData.recurringEndDate ? formData.recurringEndDate : undefined,
      fromAccount: formData.type === "transfer" ? formData.fromAccount : undefined,
      toAccount: formData.type === "transfer" ? formData.toAccount : undefined,
      isLoanPayment: formData.isLoanPayment || undefined,
      relatedLoanId: formData.isLoanPayment ? formData.relatedLoanId : undefined,
    };

    onSave(updatedExpense);
    onClose();
    
    const typeMessages = {
      income: "Entrada atualizada com sucesso!",
      expense: "Despesa atualizada com sucesso!",
      transfer: "Transferência atualizada com sucesso!",
      investment: "Investimento atualizado com sucesso!",
      loan: "Empréstimo atualizado com sucesso!",
      savings: "Poupança atualizada com sucesso!",
    };
    
    toast.success(typeMessages[formData.type]);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!expense) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            Editar Transação
          </DialogTitle>
          <DialogDescription>
            Modifique os detalhes da transação selecionada.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Transação</Label>
            <Select value={formData.type} onValueChange={(value: Expense["type"]) => handleInputChange("type", value)}>
              <SelectTrigger className="transition-all duration-200 focus:scale-[1.02]">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">
                  <span className="flex items-center gap-2">
                    <span>💰</span>
                    <span>Entrada</span>
                  </span>
                </SelectItem>
                <SelectItem value="expense">
                  <span className="flex items-center gap-2">
                    <span>💸</span>
                    <span>Despesa</span>
                  </span>
                </SelectItem>
                <SelectItem value="transfer">
                  <span className="flex items-center gap-2">
                    <span>🔄</span>
                    <span>Transferência</span>
                  </span>
                </SelectItem>
                <SelectItem value="investment">
                  <span className="flex items-center gap-2">
                    <span>📈</span>
                    <span>Investimento</span>
                  </span>
                </SelectItem>
                <SelectItem value="loan">
                  <span className="flex items-center gap-2">
                    <span>🏦</span>
                    <span>Empréstimo</span>
                  </span>
                </SelectItem>
                <SelectItem value="savings">
                  <span className="flex items-center gap-2">
                    <span>💎</span>
                    <span>Poupança</span>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: Supermercado"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="transition-all duration-200 focus:scale-[1.02]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                className="transition-all duration-200 focus:scale-[1.02]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                className="transition-all duration-200 focus:scale-[1.02]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
              <SelectTrigger className="transition-all duration-200 focus:scale-[1.02]">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Método de Pagamento
            </Label>
            <Select value={formData.paymentMethod} onValueChange={(value: Expense["paymentMethod"]) => handleInputChange("paymentMethod", value)}>
              <SelectTrigger className="transition-all duration-200 focus:scale-[1.02]">
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">💵 Dinheiro</SelectItem>
                <SelectItem value="card">💳 Cartão</SelectItem>
                <SelectItem value="bank_transfer">🏦 Transferência Bancária</SelectItem>
                <SelectItem value="pix">⚡ PIX</SelectItem>
                <SelectItem value="digital_wallet">📱 Carteira Digital</SelectItem>
                <SelectItem value="check">📝 Cheque</SelectItem>
                <SelectItem value="other">🔧 Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transfer Accounts (only for transfer type) */}
          {formData.type === "transfer" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="space-y-2">
                <Label htmlFor="fromAccount">Conta de Origem</Label>
                <Input
                  id="fromAccount"
                  placeholder="Ex: Conta Corrente"
                  value={formData.fromAccount}
                  onChange={(e) => handleInputChange("fromAccount", e.target.value)}
                  className="transition-all duration-200 focus:scale-[1.02]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toAccount">Conta de Destino</Label>
                <Input
                  id="toAccount"
                  placeholder="Ex: Poupança"
                  value={formData.toAccount}
                  onChange={(e) => handleInputChange("toAccount", e.target.value)}
                  className="transition-all duration-200 focus:scale-[1.02]"
                />
              </div>
            </div>
          )}

          {/* Loan Payment Section (only for expense type) */}
          {formData.type === "expense" && (
            <div className="space-y-3 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isLoanPayment"
                  checked={formData.isLoanPayment}
                  onCheckedChange={(checked) => handleInputChange("isLoanPayment", checked)}
                />
                <Label htmlFor="isLoanPayment" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Esta é um pagamento de empréstimo
                </Label>
              </div>
              
              {formData.isLoanPayment && (
                <div className="space-y-2">
                  <Label htmlFor="relatedLoanId">Selecionar Empréstimo</Label>
                  <Select value={formData.relatedLoanId} onValueChange={(value) => handleInputChange("relatedLoanId", value)}>
                    <SelectTrigger className="transition-all duration-200 focus:scale-[1.02]">
                      <SelectValue placeholder="Selecione o empréstimo que está sendo pago" />
                    </SelectTrigger>
                    <SelectContent>
                      {existingLoans.length > 0 ? (
                        existingLoans.map((loan) => {
                          const formatCurrency = (value: number) => {
                            return new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(value);
                          };
                          
                          return (
                            <SelectItem key={loan.id} value={loan.id}>
                              <span className="flex items-center gap-2">
                                <span>🏦</span>
                                <span>{loan.description}</span>
                                <span className="text-muted-foreground">
                                  ({formatCurrency(loan.amount)})
                                </span>
                              </span>
                            </SelectItem>
                          );
                        })
                      ) : (
                        <SelectItem value="placeholder" disabled>
                          <span className="text-muted-foreground">
                            Nenhum empréstimo disponível
                          </span>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Selecione o empréstimo que está sendo pago para rastrear o saldo restante
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Observações
            </Label>
            <Textarea
              id="notes"
              placeholder="Adicione observações sobre esta transação..."
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              className="transition-all duration-200 focus:scale-[1.02] min-h-[80px]"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </Label>
            <Input
              id="tags"
              placeholder="Ex: urgente, trabalho, viagem (separadas por vírgula)"
              value={formData.tags}
              onChange={(e) => handleInputChange("tags", e.target.value)}
              className="transition-all duration-200 focus:scale-[1.02]"
            />
          </div>

          {/* Recurring Transaction */}
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRecurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) => handleInputChange("isRecurring", checked)}
              />
              <Label htmlFor="isRecurring" className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Transação Recorrente
              </Label>
            </div>
            
            {formData.isRecurring && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recurringFrequency">Frequência</Label>
                  <Select value={formData.recurringFrequency} onValueChange={(value: Expense["recurringFrequency"]) => handleInputChange("recurringFrequency", value)}>
                    <SelectTrigger className="transition-all duration-200 focus:scale-[1.02]">
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">📅 Diário</SelectItem>
                      <SelectItem value="weekly">📅 Semanal</SelectItem>
                      <SelectItem value="monthly">📅 Mensal</SelectItem>
                      <SelectItem value="yearly">📅 Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recurringEndDate">Data Final (opcional)</Label>
                  <Input
                    id="recurringEndDate"
                    type="date"
                    value={formData.recurringEndDate}
                    onChange={(e) => handleInputChange("recurringEndDate", e.target.value)}
                    className="transition-all duration-200 focus:scale-[1.02]"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-gradient-primary hover:opacity-90">
              <Edit className="mr-2 h-4 w-4" />
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
