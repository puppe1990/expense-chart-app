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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Calendar, CreditCard, FileText, Tag, RotateCcw, Search, Check, Calculator } from "lucide-react";
import { toast } from "sonner";
import { getCurrentDateString, cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

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
  type: "income" | "expense" | "transfer" | "investment" | "investment_profit" | "loan";
  paymentMethod?: "cash" | "card" | "bank_transfer" | "digital_wallet" | "check" | "pix" | "boleto" | "other";
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

const MAX_AMOUNT = 1_000_000_000;

export const ExpenseForm = ({ categories, onAddExpense, existingLoans = [] }: ExpenseFormProps) => {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(getCurrentDateString());
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
  
  // Popover states for searchable dropdowns
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [paymentMethodPopoverOpen, setPaymentMethodPopoverOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState("0");
  const [calcPreviousValue, setCalcPreviousValue] = useState<string | null>(null);
  const [calcOperation, setCalcOperation] = useState<string | null>(null);

  // Initialize calculator with current amount when opening
  useEffect(() => {
    if (calculatorOpen) {
      if (amount) {
        setCalcDisplay(amount);
      } else {
        setCalcDisplay("0");
      }
      // Clear previous operation when opening calculator
      setCalcPreviousValue(null);
      setCalcOperation(null);
    }
  }, [calculatorOpen, amount]);

  const getCategoryLabel = () => {
    if (!category) return "Selecione uma categoria";
    const cat = categories.find(c => c.id === category);
    return cat ? `${cat.icon} ${cat.name}` : "Selecione uma categoria";
  };

  const getPaymentMethodLabel = () => {
    const labels: Record<string, string> = {
      cash: "💵 Dinheiro",
      card: "💳 Cartão",
      bank_transfer: "🏦 Transferência Bancária",
      pix: "⚡ PIX",
      digital_wallet: "📱 Carteira Digital",
      check: "📝 Cheque",
      boleto: "📄 Boleto",
      other: "🔧 Outro",
    };
    return labels[paymentMethod] || "Selecione o método";
  };

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
    setAmount(calcDisplay);
    setCalculatorOpen(false);
    handleCalcClear();
  };

  const getOperationSymbol = (op: string | null) => {
    if (!op) return "";
    const symbols: Record<string, string> = {
      "+": "+",
      "-": "−",
      "*": "×",
      "/": "÷",
    };
    return symbols[op] || op;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description || !amount || !category) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > MAX_AMOUNT) {
      toast.error("Informe um valor positivo válido");
      return;
    }

    if (date > getCurrentDateString()) {
      toast.error("A data não pode ser futura");
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
      amount: parsedAmount,
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
    setDate(getCurrentDateString());
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
      investment_profit: "Lucro de investimento adicionado com sucesso!",
      loan: "Empréstimo adicionado com sucesso!",
    };
    
    toast.success(typeMessages[type]);
  };

  return (
    <Card className="group relative overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/10 to-transparent rounded-full -translate-y-20 translate-x-20"></div>
      
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-3 text-lg font-bold">
          <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg">
            <PlusCircle className="h-5 w-5 text-white" />
          </div>
          Nova Transação
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="type" className="text-xs font-semibold text-gray-700 dark:text-gray-300">Tipo de Transação</Label>
            <Select value={type} onValueChange={(value: Expense["type"]) => setType(value)}>
              <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-primary transition-all duration-300 focus:scale-[1.02] shadow-sm hover:shadow-md">
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
                <SelectItem value="investment_profit">
                  <span className="flex items-center gap-2">
                    <span>💰</span>
                    <span>Lucro de Investimento</span>
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

          <div className="space-y-3">
            <Label htmlFor="description" className="text-xs font-semibold text-gray-700 dark:text-gray-300">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: Supermercado"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-primary transition-all duration-300 focus:scale-[1.02] shadow-sm hover:shadow-md"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="amount" className="text-xs font-semibold text-gray-700 dark:text-gray-300">Valor (R$)</Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-primary transition-all duration-300 focus:scale-[1.02] shadow-sm hover:shadow-md"
                />
                <Popover open={calculatorOpen} onOpenChange={setCalculatorOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      <Calculator className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-3" align="start">
                    <div className="space-y-3">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 min-h-[80px] flex flex-col justify-end">
                        {calcPreviousValue && calcOperation && (
                          <div className="text-right text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {calcPreviousValue} {getOperationSymbol(calcOperation)}
                          </div>
                        )}
                        <div className="text-right text-2xl font-bold">
                          {calcDisplay}
                        </div>
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

            <div className="space-y-3">
              <Label htmlFor="date" className="text-xs font-semibold text-gray-700 dark:text-gray-300">Data</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-primary transition-all duration-300 focus:scale-[1.02] shadow-sm hover:shadow-md"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="category" className="text-xs font-semibold text-gray-700 dark:text-gray-300">Categoria</Label>
            <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={categoryPopoverOpen}
                  className="h-12 w-full justify-between rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-primary transition-all duration-300 focus:scale-[1.02] shadow-sm hover:shadow-md"
                >
                  <span className="truncate">{getCategoryLabel()}</span>
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar categoria..." />
                  <CommandList>
                    <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                    <CommandGroup>
                      {categories.map((cat) => (
                        <CommandItem
                          key={cat.id}
                          value={`${cat.name} ${cat.id}`}
                          onSelect={() => {
                            setCategory(cat.id);
                            setCategoryPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              category === cat.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="mr-2">{cat.icon}</span>
                          {cat.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Método de Pagamento
            </Label>
            <Popover open={paymentMethodPopoverOpen} onOpenChange={setPaymentMethodPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={paymentMethodPopoverOpen}
                  className="w-full justify-between transition-all duration-200 focus:scale-[1.02]"
                >
                  <span className="truncate">{getPaymentMethodLabel()}</span>
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar método de pagamento..." />
                  <CommandList>
                    <CommandEmpty>Nenhum método encontrado.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="pix"
                        onSelect={() => {
                          setPaymentMethod("pix");
                          setPaymentMethodPopoverOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            paymentMethod === "pix" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        ⚡ PIX
                      </CommandItem>
                      <CommandItem
                        value="transferência bancária bank"
                        onSelect={() => {
                          setPaymentMethod("bank_transfer");
                          setPaymentMethodPopoverOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            paymentMethod === "bank_transfer" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        🏦 Transferência Bancária
                      </CommandItem>
                      <CommandItem
                        value="dinheiro cash"
                        onSelect={() => {
                          setPaymentMethod("cash");
                          setPaymentMethodPopoverOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            paymentMethod === "cash" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        💵 Dinheiro
                      </CommandItem>
                      <CommandItem
                        value="cartão card"
                        onSelect={() => {
                          setPaymentMethod("card");
                          setPaymentMethodPopoverOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            paymentMethod === "card" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        💳 Cartão
                      </CommandItem>
                      <CommandItem
                        value="carteira digital wallet"
                        onSelect={() => {
                          setPaymentMethod("digital_wallet");
                          setPaymentMethodPopoverOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            paymentMethod === "digital_wallet" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        📱 Carteira Digital
                      </CommandItem>
                      <CommandItem
                        value="cheque check"
                        onSelect={() => {
                          setPaymentMethod("check");
                          setPaymentMethodPopoverOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            paymentMethod === "check" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        📝 Cheque
                      </CommandItem>
                      <CommandItem
                        value="boleto"
                        onSelect={() => {
                          setPaymentMethod("boleto");
                          setPaymentMethodPopoverOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            paymentMethod === "boleto" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        📄 Boleto
                      </CommandItem>
                      <CommandItem
                        value="outro other"
                        onSelect={() => {
                          setPaymentMethod("other");
                          setPaymentMethodPopoverOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            paymentMethod === "other" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        🔧 Outro
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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

            {/* Loan Payment Option */}
            <div className="flex items-center space-x-2 pt-2 border-t border-gray-200 dark:border-gray-700">
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

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group"
          >
            <PlusCircle className="mr-3 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            {type === "income" ? "Adicionar Entrada" : 
             type === "expense" ? "Adicionar Despesa" :
             type === "transfer" ? "Adicionar Transferência" :
             type === "investment" ? "Adicionar Investimento" :
             type === "investment_profit" ? "Adicionar Lucro de Investimento" :
             type === "loan" ? "Adicionar Empréstimo" :
             "Adicionar Poupança"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
