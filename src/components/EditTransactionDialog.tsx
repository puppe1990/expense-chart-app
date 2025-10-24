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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Edit, Calendar, CreditCard, FileText, Tag, RotateCcw, Calculator } from "lucide-react";
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

  // Calculator states
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState("0");
  const [calcPreviousValue, setCalcPreviousValue] = useState<string | null>(null);
  const [calcOperation, setCalcOperation] = useState<string | null>(null);

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

  // Initialize calculator with current amount when opening
  useEffect(() => {
    if (calculatorOpen) {
      if (formData.amount) {
        setCalcDisplay(formData.amount);
      } else {
        setCalcDisplay("0");
      }
      // Clear previous operation when opening calculator
      setCalcPreviousValue(null);
      setCalcOperation(null);
    }
  }, [calculatorOpen, formData.amount]);

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
    };
    
    toast.success(typeMessages[formData.type]);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Calculator handler functions
  const handleCalcNumber = (num: string) => {
    if (calcDisplay === "0") {
      setCalcDisplay(num);
    } else {
      setCalcDisplay(calcDisplay + num);
    }
  };

  const handleCalcOperation = (op: string) => {
    if (calcPreviousValue === null) {
      setCalcPreviousValue(calcDisplay);
      setCalcDisplay("0");
      setCalcOperation(op);
    } else {
      handleCalcEquals();
      setCalcOperation(op);
    }
  };

  const handleCalcEquals = () => {
    if (calcPreviousValue && calcOperation) {
      const prev = parseFloat(calcPreviousValue);
      const current = parseFloat(calcDisplay);
      let result = 0;

      switch (calcOperation) {
        case "+":
          result = prev + current;
          break;
        case "-":
          result = prev - current;
          break;
        case "*":
          result = prev * current;
          break;
        case "/":
          result = current !== 0 ? prev / current : 0;
          break;
        default:
          result = current;
      }

      setCalcDisplay(result.toString());
      setCalcPreviousValue(null);
      setCalcOperation(null);
    }
  };

  const handleCalcClear = () => {
    setCalcDisplay("0");
    setCalcPreviousValue(null);
    setCalcOperation(null);
  };

  const handleCalcDecimal = () => {
    if (!calcDisplay.includes(".")) {
      setCalcDisplay(calcDisplay + ".");
    }
  };

  const handleApplyCalcResult = () => {
    handleInputChange("amount", calcDisplay);
    setCalculatorOpen(false);
    handleCalcClear();
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
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                  className="transition-all duration-200 focus:scale-[1.02]"
                />
                <Popover open={calculatorOpen} onOpenChange={setCalculatorOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 border-2 hover:border-primary transition-all duration-300"
                    >
                      <Calculator className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-3" align="start">
                    <div className="space-y-3">
                      <div className="text-right text-2xl font-bold p-3 bg-gray-100 dark:bg-gray-800 rounded-lg min-h-[50px] flex items-center justify-end">
                        {calcDisplay}
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCalcClear}
                          className="h-12 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800"
                        >
                          C
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleCalcOperation("/")}
                          className="h-12"
                        >
                          ÷
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleCalcOperation("*")}
                          className="h-12"
                        >
                          ×
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleCalcOperation("-")}
                          className="h-12"
                        >
                          −
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleCalcNumber("7")}
                          className="h-12"
                        >
                          7
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleCalcNumber("8")}
                          className="h-12"
                        >
                          8
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleCalcNumber("9")}
                          className="h-12"
                        >
                          9
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleCalcOperation("+")}
                          className="h-12 row-span-2"
                        >
                          +
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleCalcNumber("4")}
                          className="h-12"
                        >
                          4
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleCalcNumber("5")}
                          className="h-12"
                        >
                          5
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleCalcNumber("6")}
                          className="h-12"
                        >
                          6
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleCalcNumber("1")}
                          className="h-12"
                        >
                          1
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleCalcNumber("2")}
                          className="h-12"
                        >
                          2
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleCalcNumber("3")}
                          className="h-12"
                        >
                          3
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCalcEquals}
                          className="h-12 row-span-2 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          =
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleCalcNumber("0")}
                          className="h-12 col-span-2"
                        >
                          0
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCalcDecimal}
                          className="h-12"
                        >
                          .
                        </Button>
                      </div>
                      <Button
                        type="button"
                        onClick={handleApplyCalcResult}
                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                      >
                        Usar Resultado
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
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
                <SelectItem value="pix">⚡ PIX</SelectItem>
                <SelectItem value="bank_transfer">🏦 Transferência Bancária</SelectItem>
                <SelectItem value="cash">💵 Dinheiro</SelectItem>
                <SelectItem value="card">💳 Cartão</SelectItem>
                <SelectItem value="digital_wallet">📱 Carteira Digital</SelectItem>
                <SelectItem value="check">📝 Cheque</SelectItem>
                <SelectItem value="boleto">📄 Boleto</SelectItem>
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

            {/* Loan Payment Option */}
            <div className="flex items-center space-x-2 pt-2 border-t border-gray-200 dark:border-gray-700">
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
