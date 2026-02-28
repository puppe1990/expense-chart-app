import React, { useState } from 'react';
import { DailyExpenses } from '@/components/DailyExpenses';
import { Category, Expense } from '@/components/ExpenseForm';
import { useExpensesStorage, useLocalStorage } from '@/hooks/use-local-storage';
import { defaultCategories } from '@/data/categories';
import { ACCOUNT_OPTIONS, AccountType, filterExpensesByAccount } from '@/lib/accounts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DailyExpensesPage = () => {
  const { expenses, updateExpense, bulkDuplicateExpenses, deleteExpense } = useExpensesStorage();
  const [activeAccount, setActiveAccount] = useLocalStorage<AccountType>('expense-chart-account', 'pf');
  const [categories] = useState<Category[]>(defaultCategories);
  const accountExpenses = filterExpensesByAccount(expenses, activeAccount);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground">Gastos Diários</h1>
          <p className="text-sm text-muted-foreground">Visualize seus gastos organizados por dia</p>
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
      <DailyExpenses 
        expenses={accountExpenses} 
        categories={categories} 
        account={activeAccount}
        onUpdateExpense={updateExpense}
        onBulkDuplicate={bulkDuplicateExpenses}
        onDeleteExpense={deleteExpense}
      />
    </div>
  );
};

export default DailyExpensesPage;
