import { useState, useEffect } from 'react';
import { getCurrentDateString } from '@/lib/utils';
import { Expense } from '@/components/ExpenseForm';

/**
 * Custom hook for managing local storage with TypeScript support
 * @param key - The key to store the data under in localStorage
 * @param initialValue - The initial value if no data exists in localStorage
 * @returns [storedValue, setValue] - The current value and a function to update it
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Get from local storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Listen for changes to this localStorage key from other tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Error parsing localStorage key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue] as const;
}

/**
 * Hook specifically for managing expenses in localStorage
 */
type ExpenseInput = Omit<Expense, "id">;
const MAX_AMOUNT = 1_000_000_000;

const isValidAmount = (amount: unknown): amount is number => {
  return (
    typeof amount === "number" &&
    Number.isFinite(amount) &&
    amount > 0 &&
    amount <= MAX_AMOUNT
  );
};

const isNonFutureDateString = (dateString: string): boolean => {
  return dateString <= getCurrentDateString();
};

export function useExpensesStorage() {
  const [expenses, setExpenses] = useLocalStorage('expense-chart-expenses', []);
  const validTypes: Expense["type"][] = [
    "income",
    "expense",
    "transfer",
    "investment",
    "investment_profit",
    "loan",
  ];
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  const isExpenseRecord = (value: unknown): value is Expense => {
    if (!value || typeof value !== "object") return false;
    const record = value as Record<string, unknown>;
    const account = record.account as string | undefined;
    return (
      typeof record.id === "string" &&
      typeof record.description === "string" &&
      isValidAmount(record.amount) &&
      typeof record.category === "string" &&
      typeof record.date === "string" &&
      dateRegex.test(record.date) &&
      isNonFutureDateString(record.date as string) &&
      typeof record.type === "string" &&
      validTypes.includes(record.type as Expense["type"]) &&
      (account === undefined || account === "pf" || account === "pj" || account === "card")
    );
  };

  const addExpense = (expense: ExpenseInput) => {
    if (!isValidAmount(expense.amount)) {
      console.error("Invalid expense amount:", expense.amount);
      return;
    }
    if (!dateRegex.test(expense.date) || !isNonFutureDateString(expense.date)) {
      console.error("Invalid expense date:", expense.date);
      return;
    }
    const newExpense = {
      ...expense,
      id: Date.now().toString(),
    };
    setExpenses((prev: Expense[]) => {
      // Sempre criar um novo array para garantir que o React detecte a mudança
      const newArray = [newExpense, ...(prev || [])];
      console.log('🔄 Adicionando despesa:', newExpense);
      console.log('📊 Nova lista de despesas:', newArray);
      return newArray;
    });
  };

  const updateExpense = (id: string, updatedExpense: ExpenseInput) => {
    if (!isValidAmount(updatedExpense.amount)) {
      console.error("Invalid expense amount:", updatedExpense.amount);
      return;
    }
    if (!dateRegex.test(updatedExpense.date) || !isNonFutureDateString(updatedExpense.date)) {
      console.error("Invalid expense date:", updatedExpense.date);
      return;
    }
    setExpenses((prev: Expense[]) => 
      prev.map((expense: Expense) => 
        expense.id === id ? { ...updatedExpense, id } : expense
      )
    );
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev: Expense[]) => prev.filter((expense: Expense) => expense.id !== id));
  };

  const clearExpenses = () => {
    setExpenses([]);
  };

  const exportExpenses = () => {
    const dataStr = JSON.stringify(expenses, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expenses-${getCurrentDateString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importExpenses = (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          if (Array.isArray(importedData) && importedData.every(isExpenseRecord)) {
            setExpenses(importedData);
            resolve();
          } else {
            reject(new Error('Invalid file format'));
          }
        } catch (error) {
          reject(new Error('Error parsing file'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsText(file);
    });
  };

  const duplicateExpense = (expense: Expense) => {
    const duplicatedExpense = {
      ...expense,
      id: Date.now().toString(),
      description: `${expense.description} (Cópia)`,
      date: getCurrentDateString(), // Set to today's date
    };
    setExpenses((prev: Expense[]) => [duplicatedExpense, ...prev]);
  };

  const bulkDuplicateExpenses = (expensesToDuplicate: Expense[], targetDate?: string, keepSameDay = false) => {
    const duplicatedExpenses = expensesToDuplicate.map((expense, index) => {
      let dateToUse;
      
      if (keepSameDay && targetDate) {
        // Manter o mesmo dia do mês
        const originalDate = new Date(expense.date + 'T00:00:00');
        const targetDateObj = new Date(targetDate + 'T00:00:00');
        
        // Usar o mesmo dia do mês da transação original no mês de destino
        let newDate = new Date(
          targetDateObj.getFullYear(),
          targetDateObj.getMonth(),
          originalDate.getDate()
        );
        
        // Se o dia não existe no mês (ex: 31 de fevereiro), usar o último dia do mês
        const lastDay = new Date(targetDateObj.getFullYear(), targetDateObj.getMonth() + 1, 0).getDate();
        if (originalDate.getDate() > lastDay) {
          newDate = new Date(
            targetDateObj.getFullYear(),
            targetDateObj.getMonth(),
            lastDay
          );
        }
        
        dateToUse = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`;
      } else {
        // Usar a data de destino fornecida ou data atual
        dateToUse = targetDate || getCurrentDateString();
      }
      
      return {
        ...expense,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`,
        description: `${expense.description} (Cópia)`,
        date: dateToUse,
      };
    });
    setExpenses((prev: Expense[]) => [...duplicatedExpenses, ...prev]);
  };

  const addExpensesBatch = (expensesToAdd: ExpenseInput[]) => {
    if (!Array.isArray(expensesToAdd) || expensesToAdd.length === 0) return;
    const now = Date.now();
    const normalizeKey = (expense: ExpenseInput) => {
      const description = expense.description.trim().toLowerCase();
      const accountKey = expense.account ?? "";
      const transferKey = `${expense.fromAccount ?? ""}|${expense.toAccount ?? ""}`;
      return `${expense.date}|${expense.amount}|${expense.type}|${accountKey}|${transferKey}|${description}`;
    };
    const validExpenses = expensesToAdd.filter((expense) => {
      if (!isValidAmount(expense.amount)) return false;
      return dateRegex.test(expense.date) && isNonFutureDateString(expense.date);
    });
    if (validExpenses.length === 0) return;
    setExpenses((prev: Expense[]) => {
      const existingKeys = new Set(
        (prev || []).map((expense) =>
          normalizeKey({
            description: expense.description,
            amount: expense.amount,
            category: expense.category,
            date: expense.date,
            type: expense.type,
            paymentMethod: expense.paymentMethod,
            notes: expense.notes,
            tags: expense.tags,
            isRecurring: expense.isRecurring,
            recurringFrequency: expense.recurringFrequency,
            recurringEndDate: expense.recurringEndDate,
            fromAccount: expense.fromAccount,
            toAccount: expense.toAccount,
            isLoanPayment: expense.isLoanPayment,
            relatedLoanId: expense.relatedLoanId,
            originalLoanAmount: expense.originalLoanAmount,
          })
        )
      );
      const uniqueExpenses = validExpenses.filter((expense) => {
        const key = normalizeKey(expense);
        if (existingKeys.has(key)) return false;
        existingKeys.add(key);
        return true;
      });
      if (uniqueExpenses.length === 0) return prev;
      const expensesWithIds = uniqueExpenses.map((expense, index) => ({
        ...expense,
        id: `${now}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      }));
      return [...expensesWithIds, ...(prev || [])];
    });
  };

  return {
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    clearExpenses,
    exportExpenses,
    importExpenses,
    duplicateExpense,
    bulkDuplicateExpenses,
    addExpensesBatch,
  };
}
