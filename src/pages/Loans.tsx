import { LoansSection } from "@/components/LoansSection";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useExpensesStorage, useLocalStorage } from "@/hooks/use-local-storage";
import { ACCOUNT_OPTIONS, AccountType, filterExpensesByAccount } from "@/lib/accounts";

const LoansPage = () => {
  const { expenses } = useExpensesStorage();
  const [activeAccount, setActiveAccount] = useLocalStorage<AccountType>("expense-chart-account", "pf");
  const accountExpenses = filterExpensesByAccount(expenses, activeAccount);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Empréstimos</h1>
          <p className="text-sm text-muted-foreground">Acompanhe saldo devedor, pagamentos e progresso.</p>
        </div>
        <Select value={activeAccount} onValueChange={(value: AccountType) => setActiveAccount(value)}>
          <SelectTrigger className="w-full sm:w-[120px]" aria-label="Conta">
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
      </div>

      <LoansSection expenses={accountExpenses} />
    </div>
  );
};

export default LoansPage;
