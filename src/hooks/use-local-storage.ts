import { useState, useEffect, useCallback } from 'react';
import { getCurrentDateString } from '@/lib/utils';
import { Expense } from '@/components/ExpenseForm';
import { AccountType, filterExpensesByAccount } from '@/lib/accounts';
import { getAuthToken } from '@/hooks/use-auth';
import { useAuth } from '@/hooks/use-auth';
import { applyAutoCategory } from '@/lib/category-rules';

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
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      setStoredValue((previousValue) => {
        const valueToStore =
          value instanceof Function ? value(previousValue) : value;

        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }

        return valueToStore;
      });
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

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
type BatchImportResult = {
  received: number;
  valid: number;
  invalid: number;
  duplicates: number;
  added: number;
  autoCategorized: number;
};
const MAX_AMOUNT = 1_000_000_000;
const generateId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

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

const EXPENSES_API_BASE = "/api/expenses";
const USE_REMOTE_STORAGE = import.meta.env.VITE_USE_TURSO !== "false";

const apiRequest = async <T>(path = "", init?: RequestInit): Promise<T> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${EXPENSES_API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    ...init,
  });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
};

export function useExpensesStorage() {
  const { user } = useAuth();
  const expensesStorageKey = `expense-chart-expenses-${user?.id ?? "anonymous"}`;
  const [localExpenses, setLocalExpenses] = useLocalStorage<Expense[]>(expensesStorageKey, []);
  const [expenses, setExpenses] = useState<Expense[]>(localExpenses);
  const validTypes: Expense["type"][] = [
    "income",
    "expense",
    "transfer",
    "investment",
    "investment_profit",
    "loan",
  ];
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  useEffect(() => {
    setExpenses(localExpenses);
  }, [localExpenses]);

  useEffect(() => {
    setLocalExpenses(expenses);
  }, [expenses, setLocalExpenses]);

  useEffect(() => {
    if (!USE_REMOTE_STORAGE) return;
    if (!getAuthToken()) return;

    const loadRemoteExpenses = async () => {
      try {
        const remoteExpenses = await apiRequest<Expense[]>("");
        if (Array.isArray(remoteExpenses) && remoteExpenses.length === 0 && localExpenses.length > 0) {
          await apiRequest("/batch", {
            method: "POST",
            body: JSON.stringify(localExpenses),
          });
          setExpenses(localExpenses);
          return;
        }
        if (Array.isArray(remoteExpenses)) {
          setExpenses(remoteExpenses);
        }
      } catch (error) {
        console.error("Failed to load remote expenses. Using local data.", error);
      }
    };

    void loadRemoteExpenses();
  }, [localExpenses]);

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
    const normalizedExpense = applyAutoCategory(expense);
    if (!isValidAmount(normalizedExpense.amount)) {
      console.error("Invalid expense amount:", normalizedExpense.amount);
      return;
    }
    if (!dateRegex.test(normalizedExpense.date) || !isNonFutureDateString(normalizedExpense.date)) {
      console.error("Invalid expense date:", normalizedExpense.date);
      return;
    }
    const newExpense = {
      ...normalizedExpense,
      id: generateId(),
    };
    setExpenses((prev: Expense[]) => {
      // Sempre criar um novo array para garantir que o React detecte a mudança
      const newArray = [newExpense, ...(prev || [])];
      console.log('🔄 Adicionando despesa:', newExpense);
      console.log('📊 Nova lista de despesas:', newArray);
      return newArray;
    });

    if (USE_REMOTE_STORAGE) {
      void apiRequest("", {
        method: "POST",
        body: JSON.stringify(newExpense),
      }).catch((error) => {
        console.error("Failed to persist expense in Turso", error);
      });
    }
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

    if (USE_REMOTE_STORAGE) {
      void apiRequest(`/${id}`, {
        method: "PUT",
        body: JSON.stringify({ ...updatedExpense, id }),
      }).catch((error) => {
        console.error("Failed to update expense in Turso", error);
      });
    }
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev: Expense[]) => prev.filter((expense: Expense) => expense.id !== id));

    if (USE_REMOTE_STORAGE) {
      void apiRequest(`/${id}`, {
        method: "DELETE",
      }).catch((error) => {
        console.error("Failed to delete expense in Turso", error);
      });
    }
  };

  const clearExpenses = () => {
    setExpenses([]);

    if (USE_REMOTE_STORAGE) {
      void apiRequest("", {
        method: "DELETE",
      }).catch((error) => {
        console.error("Failed to clear expenses in Turso", error);
      });
    }
  };

  const exportExpenses = (account?: AccountType) => {
    const dataToExport = account ? filterExpensesByAccount(expenses, account) : expenses;
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = account
      ? `expenses-${account}-${getCurrentDateString()}.json`
      : `expenses-${getCurrentDateString()}.json`;
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
            if (USE_REMOTE_STORAGE) {
              void apiRequest("/replace", {
                method: "PUT",
                body: JSON.stringify(importedData),
              }).catch((error) => {
                console.error("Failed to replace expenses in Turso", error);
              });
            }
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
      id: generateId(),
      description: `${expense.description} (Cópia)`,
      date: getCurrentDateString(), // Set to today's date
    };
    setExpenses((prev: Expense[]) => [duplicatedExpense, ...prev]);

    if (USE_REMOTE_STORAGE) {
      void apiRequest("", {
        method: "POST",
        body: JSON.stringify(duplicatedExpense),
      }).catch((error) => {
        console.error("Failed to duplicate expense in Turso", error);
      });
    }
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
        id: `${generateId()}-${index}`,
        description: `${expense.description} (Cópia)`,
        date: dateToUse,
      };
    });
    setExpenses((prev: Expense[]) => [...duplicatedExpenses, ...prev]);

    if (USE_REMOTE_STORAGE && duplicatedExpenses.length > 0) {
      void apiRequest("/batch", {
        method: "POST",
        body: JSON.stringify(duplicatedExpenses),
      }).catch((error) => {
        console.error("Failed to duplicate expenses in Turso", error);
      });
    }
  };

  const addExpensesBatch = (expensesToAdd: ExpenseInput[]): BatchImportResult => {
    if (!Array.isArray(expensesToAdd) || expensesToAdd.length === 0) {
      return { received: 0, valid: 0, invalid: 0, duplicates: 0, added: 0, autoCategorized: 0 };
    }
    const now = Date.now();
    const received = expensesToAdd.length;
    const normalizedExpenses = expensesToAdd.map((expense) => applyAutoCategory(expense));
    const autoCategorized = expensesToAdd.reduce((count, expense, index) => {
      const next = normalizedExpenses[index];
      return count + (expense.category === "other" && next.category !== "other" ? 1 : 0);
    }, 0);

    const normalizeKey = (expense: ExpenseInput) => {
      const description = expense.description.trim().toLowerCase();
      const accountKey = expense.account ?? "";
      const transferKey = `${expense.fromAccount ?? ""}|${expense.toAccount ?? ""}`;
      return `${expense.date}|${expense.amount}|${expense.type}|${accountKey}|${transferKey}|${description}`;
    };
    const validExpenses = normalizedExpenses.filter((expense) => {
      if (!isValidAmount(expense.amount)) return false;
      return dateRegex.test(expense.date) && isNonFutureDateString(expense.date);
    });
    if (validExpenses.length === 0) {
      return {
        received,
        valid: 0,
        invalid: received,
        duplicates: 0,
        added: 0,
        autoCategorized,
      };
    }

    const existingKeys = new Set(
      (expenses || []).map((expense) =>
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

    if (uniqueExpenses.length > 0) {
      const expensesWithIds = uniqueExpenses.map((expense, index) => ({
        ...expense,
        id: `${generateId()}-${now}-${index}`,
      }));

      setExpenses((prev: Expense[]) => [...expensesWithIds, ...(prev || [])]);

      if (USE_REMOTE_STORAGE) {
        void apiRequest("/batch", {
          method: "POST",
          body: JSON.stringify(expensesWithIds),
        }).catch((error) => {
          console.error("Failed to insert expenses batch in Turso", error);
        });
      }
    }

    return {
      received,
      valid: validExpenses.length,
      invalid: received - validExpenses.length,
      duplicates: validExpenses.length - uniqueExpenses.length,
      added: uniqueExpenses.length,
      autoCategorized,
    };
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
