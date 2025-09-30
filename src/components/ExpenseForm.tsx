import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Calendar, CreditCard, FileText, Tag, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: "income" | "expense" | "transfer" | "investment" | "loan" | "savings";
  paymentMethod?: "cash" | "card" | "bank_transfer" | "digital_wallet" | "check" | "other";
  notes?: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringFrequency?: "daily" | "weekly" | "monthly" | "yearly";
  recurringEndDate?: string;
  fromAccount?: string;
  toAccount?: string;
  // New fields for loan payments
  isLoanPayment?: boolean;
  relatedLoanId?: string;
  originalLoanAmount?: number;
}

interface ExpenseFormProps {
  categories: Category[];
  onAddExpense: (expense: Omit<Expense, "id">) => void;
  existingLoans?: Expense[];
}

export const ExpenseForm = ({ categories, onAddExpense, existingLoans = [] }: ExpenseFormProps) => {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<Expense["type"]>("expense");
  const [paymentMethod, setPaymentMethod] = useState<Expense["paymentMethod"]>("cash");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<Expense["recurringFrequency"]>("monthly");
  const [recurringEndDate, setRecurringEndDate] = useState("");
  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [isLoanPayment, setIsLoanPayment] = useState(false);
  const [relatedLoanId, setRelatedLoanId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description || !amount || !category) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    // Special validation for transfers
    if (type === "transfer" && (!fromAccount || !toAccount)) {
      toast.error("Para transferências, preencha as contas de origem e destino");
      return;
    }

    // Special validation for loan payments
    if (isLoanPayment && !relatedLoanId) {
      toast.error("Para pagamentos de empréstimo, selecione o empréstimo relacionado");
      return;
    }

    const expense: Omit<Expense, "id"> = {
      description,
      amount: parseFloat(amount),
      category,
      date,
      type,
      paymentMethod,
      notes: notes.trim() || undefined,
      tags: tags.trim() ? tags.split(",").map(tag => tag.trim()).filter(Boolean) : undefined,
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : undefined,
      recurringEndDate: isRecurring && recurringEndDate ? recurringEndDate : undefined,
      fromAccount: type === "transfer" ? fromAccount : undefined,
      toAccount: type === "transfer" ? toAccount : undefined,
      isLoanPayment: isLoanPayment || undefined,
      relatedLoanId: isLoanPayment ? relatedLoanId : undefined,
    };

    onAddExpense(expense);
    
    // Reset form
    setDescription("");
    setAmount("");
    setCategory("");
    setDate(new Date().toISOString().split("T")[0]);
    setType("expense");
    setPaymentMethod("cash");
    setNotes("");
    setTags("");
    setIsRecurring(false);
    setRecurringFrequency("monthly");
    setRecurringEndDate("");
    setFromAccount("");
    setToAccount("");
    setIsLoanPayment(false);
    setRelatedLoanId("");
    
    const typeMessages = {
      income: "Entrada adicionada com sucesso!",
      expense: "Despesa adicionada com sucesso!",
      transfer: "Transferência adicionada com sucesso!",
      investment: "Investimento adicionado com sucesso!",
      loan: "Empréstimo adicionado com sucesso!",
      savings: "Poupança adicionada com sucesso!",
    };
    
    toast.success(typeMessages[type]);
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-primary" />
          Nova Transação
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Transação</Label>
            <Select value={type} onValueChange={(value: Expense["type"]) => setType(value)}>
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="transition-all duration-200 focus:scale-[1.02]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="transition-all duration-200 focus:scale-[1.02]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
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
            <Select value={paymentMethod} onValueChange={(value: Expense["paymentMethod"]) => setPaymentMethod(value)}>
              <SelectTrigger className="transition-all duration-200 focus:scale-[1.02]">
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">💵 Dinheiro</SelectItem>
                <SelectItem value="card">💳 Cartão</SelectItem>
                <SelectItem value="bank_transfer">🏦 Transferência Bancária</SelectItem>
                <SelectItem value="digital_wallet">📱 Carteira Digital</SelectItem>
                <SelectItem value="check">📝 Cheque</SelectItem>
                <SelectItem value="other">🔧 Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transfer Accounts (only for transfer type) */}
          {type === "transfer" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="space-y-2">
                <Label htmlFor="fromAccount">Conta de Origem</Label>
                <Input
                  id="fromAccount"
                  placeholder="Ex: Conta Corrente"
                  value={fromAccount}
                  onChange={(e) => setFromAccount(e.target.value)}
                  className="transition-all duration-200 focus:scale-[1.02]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toAccount">Conta de Destino</Label>
                <Input
                  id="toAccount"
                  placeholder="Ex: Poupança"
                  value={toAccount}
                  onChange={(e) => setToAccount(e.target.value)}
                  className="transition-all duration-200 focus:scale-[1.02]"
                />
              </div>
            </div>
          )}

          {/* Loan Payment Section (only for expense type) */}
          {type === "expense" && (
            <div className="space-y-3 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isLoanPayment"
                  checked={isLoanPayment}
                  onCheckedChange={setIsLoanPayment}
                />
                <Label htmlFor="isLoanPayment" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Esta é um pagamento de empréstimo
                </Label>
              </div>
              
              {isLoanPayment && (
                <div className="space-y-2">
                  <Label htmlFor="relatedLoanId">Selecionar Empréstimo</Label>
                  <Select value={relatedLoanId} onValueChange={setRelatedLoanId}>
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
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="transition-all duration-200 focus:scale-[1.02]"
            />
          </div>

          {/* Recurring Transaction */}
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRecurring"
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
              <Label htmlFor="isRecurring" className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Transação Recorrente
              </Label>
            </div>
            
            {isRecurring && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recurringFrequency">Frequência</Label>
                  <Select value={recurringFrequency} onValueChange={(value: Expense["recurringFrequency"]) => setRecurringFrequency(value)}>
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
                    value={recurringEndDate}
                    onChange={(e) => setRecurringEndDate(e.target.value)}
                    className="transition-all duration-200 focus:scale-[1.02]"
                  />
                </div>
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-primary hover:opacity-90 transition-all duration-200 hover:scale-[1.02]"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            {type === "income" ? "Adicionar Entrada" : 
             type === "expense" ? "Adicionar Despesa" :
             type === "transfer" ? "Adicionar Transferência" :
             type === "investment" ? "Adicionar Investimento" :
             type === "loan" ? "Adicionar Empréstimo" :
             "Adicionar Poupança"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
