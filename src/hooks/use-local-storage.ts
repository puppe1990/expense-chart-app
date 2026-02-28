import { useState, useEffect, useCallback, useRef } from "react";
import { getCurrentDateString } from "@/lib/utils";
import { Expense } from "@/components/ExpenseForm";
import { AccountType, filterExpensesByAccount } from "@/lib/accounts";
import { useAuth } from "@/hooks/use-auth";
import { applyAutoCategory } from "@/lib/category-rules";

/**
 * Custom hook for managing local storage with TypeScript support
 * @param key - The key to store the data under in localStorage
 * @param initialValue - The initial value if no data exists in localStorage
 * @returns [storedValue, setValue] - The current value and a function to update it
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
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

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        setStoredValue((previousValue) => {
          const valueToStore = value instanceof Function ? value(previousValue) : value;

          if (typeof window !== "undefined") {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          }

          return valueToStore;
        });
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Error parsing localStorage key "${key}":`, error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key]);

  return [storedValue, setValue] as const;
}

type ExpenseInput = Omit<Expense, "id">;
type BatchImportResult = {
  received: number;
  valid: number;
  invalid: number;
  duplicates: number;
  added: number;
  autoCategorized: number;
};
type SyncState = "idle" | "syncing" | "error";
type ExpensesApiResponse = {
  items: Expense[];
  version: number;
};
type ExpenseMutationResponse = {
  ok: boolean;
  version: number;
  count?: number;
};

const MAX_AMOUNT = 1_000_000_000;
const EXPENSES_API_BASE = "/api/expenses";
const USE_REMOTE_STORAGE = import.meta.env.VITE_USE_TURSO !== "false";

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

const isAccountType = (value: unknown): value is AccountType =>
  value === "pf" || value === "pj" || value === "card";

const hasValidTransactionShape = (expense: Partial<ExpenseInput>): boolean => {
  if (expense.type === "transfer") {
    return (
      isAccountType(expense.fromAccount) &&
      isAccountType(expense.toAccount) &&
      expense.fromAccount !== expense.toAccount
    );
  }

  if (expense.account !== undefined && !isAccountType(expense.account)) {
    return false;
  }

  if (expense.isLoanPayment && !expense.relatedLoanId) {
    return false;
  }

  return true;
};

const apiRequest = async <T>(path = "", init?: RequestInit): Promise<T> => {
  const response = await fetch(`${EXPENSES_API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
    ...init,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new Error(body.error?.message ?? `API request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

export function useExpensesStorage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const expensesStorageKey = `expense-chart-expenses-${user?.id ?? "anonymous"}`;
  const [localExpenses, setLocalExpenses] = useLocalStorage<Expense[]>(expensesStorageKey, []);
  const [expenses, setExpenses] = useState<Expense[]>(localExpenses);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [lastSyncedVersion, setLastSyncedVersion] = useState(0);
  const pendingSyncOpsRef = useRef(0);
  const lastSyncedVersionRef = useRef(0);
  const localExpensesRef = useRef(localExpenses);
  const validTypes: Expense["type"][] = [
    "income",
    "expense",
    "transfer",
    "investment",
    "investment_profit",
    "loan",
  ];
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  const markSyncStart = () => {
    pendingSyncOpsRef.current += 1;
    setSyncState("syncing");
  };

  const markSyncEnd = (failed = false) => {
    pendingSyncOpsRef.current = Math.max(0, pendingSyncOpsRef.current - 1);
    if (failed) {
      setSyncState("error");
      return;
    }
    if (pendingSyncOpsRef.current === 0) {
      setSyncState("idle");
    }
  };

  const mergeVersion = (version: number) => {
    if (!Number.isFinite(version)) return;
    setLastSyncedVersion((previous) => (version > previous ? version : previous));
  };

  useEffect(() => {
    lastSyncedVersionRef.current = lastSyncedVersion;
  }, [lastSyncedVersion]);

  useEffect(() => {
    localExpensesRef.current = localExpenses;
  }, [localExpenses]);

  useEffect(() => {
    setLastSyncedVersion(0);
    setSyncState("idle");
    pendingSyncOpsRef.current = 0;
  }, [user?.id]);

  useEffect(() => {
    setExpenses(localExpenses);
  }, [localExpenses]);

  useEffect(() => {
    setLocalExpenses(expenses);
  }, [expenses, setLocalExpenses]);

  useEffect(() => {
    if (!USE_REMOTE_STORAGE) return;
    if (authLoading || !isAuthenticated) return;

    let canceled = false;

    const loadRemoteExpenses = async () => {
      markSyncStart();
      let failed = false;
      try {
        const remotePayload = await apiRequest<ExpensesApiResponse>("");
        if (canceled) return;

        if (remotePayload.version < lastSyncedVersionRef.current) {
          return;
        }

        if (remotePayload.items.length === 0 && localExpensesRef.current.length > 0) {
          const uploadPayload = await apiRequest<ExpenseMutationResponse>("/batch", {
            method: "POST",
            body: JSON.stringify(localExpensesRef.current),
          });
          if (canceled) return;
          setExpenses(localExpensesRef.current);
          mergeVersion(uploadPayload.version);
          return;
        }

        setExpenses(remotePayload.items);
        mergeVersion(remotePayload.version);
      } catch (error) {
        failed = true;
        console.error("Failed to load remote expenses. Using local data.", error);
      } finally {
        if (!canceled) {
          markSyncEnd(failed);
        }
      }
    };

    void loadRemoteExpenses();

    return () => {
      canceled = true;
    };
  }, [authLoading, isAuthenticated, user?.id]);

  const syncMutationVersion = (request: Promise<ExpenseMutationResponse>) => {
    markSyncStart();
    let failed = false;
    void request
      .then((payload) => {
        mergeVersion(payload.version);
      })
      .catch((error) => {
        failed = true;
        console.error("Failed to sync expenses with Turso", error);
      })
      .finally(() => {
        markSyncEnd(failed);
      });
  };

  const isExpenseRecord = (value: unknown): value is Expense => {
    if (!value || typeof value !== "object") return false;
    const record = value as Record<string, unknown>;
    const mappedRecord = {
      type: record.type as Expense["type"],
      account: record.account as AccountType | undefined,
      fromAccount: record.fromAccount as AccountType | undefined,
      toAccount: record.toAccount as AccountType | undefined,
      isLoanPayment: Boolean(record.isLoanPayment),
      relatedLoanId: record.relatedLoanId as string | undefined,
    };
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
      hasValidTransactionShape(mappedRecord)
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
    if (!hasValidTransactionShape(normalizedExpense)) {
      console.error("Invalid expense transaction shape:", normalizedExpense);
      return;
    }

    const newExpense = {
      ...normalizedExpense,
      id: generateId(),
    };
    setExpenses((previous) => [newExpense, ...(previous || [])]);

    if (USE_REMOTE_STORAGE && isAuthenticated) {
      syncMutationVersion(
        apiRequest<ExpenseMutationResponse>("", {
          method: "POST",
          body: JSON.stringify(newExpense),
        })
      );
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
    if (!hasValidTransactionShape(updatedExpense)) {
      console.error("Invalid expense transaction shape:", updatedExpense);
      return;
    }

    setExpenses((previous) =>
      previous.map((expense) => (expense.id === id ? { ...updatedExpense, id } : expense))
    );

    if (USE_REMOTE_STORAGE && isAuthenticated) {
      syncMutationVersion(
        apiRequest<ExpenseMutationResponse>(`/${id}`, {
          method: "PUT",
          body: JSON.stringify({ ...updatedExpense, id }),
        })
      );
    }
  };

  const deleteExpense = (id: string) => {
    setExpenses((previous) => previous.filter((expense) => expense.id !== id));

    if (USE_REMOTE_STORAGE && isAuthenticated) {
      syncMutationVersion(
        apiRequest<ExpenseMutationResponse>(`/${id}`, {
          method: "DELETE",
        })
      );
    }
  };

  const clearExpenses = () => {
    setExpenses([]);

    if (USE_REMOTE_STORAGE && isAuthenticated) {
      syncMutationVersion(
        apiRequest<ExpenseMutationResponse>("", {
          method: "DELETE",
        })
      );
    }
  };

  const exportExpenses = (account?: AccountType) => {
    const dataToExport = account ? filterExpensesByAccount(expenses, account) : expenses;
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
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
            if (USE_REMOTE_STORAGE && isAuthenticated) {
              syncMutationVersion(
                apiRequest<ExpenseMutationResponse>("/replace", {
                  method: "PUT",
                  body: JSON.stringify(importedData),
                })
              );
            }
            resolve();
          } else {
            reject(new Error("Invalid file format"));
          }
        } catch (_error) {
          reject(new Error("Error parsing file"));
        }
      };
      reader.onerror = () => reject(new Error("Error reading file"));
      reader.readAsText(file);
    });
  };

  const duplicateExpense = (expense: Expense) => {
    const duplicatedExpense = {
      ...expense,
      id: generateId(),
      description: `${expense.description} (Cópia)`,
      date: getCurrentDateString(),
    };
    setExpenses((previous) => [duplicatedExpense, ...previous]);

    if (USE_REMOTE_STORAGE && isAuthenticated) {
      syncMutationVersion(
        apiRequest<ExpenseMutationResponse>("", {
          method: "POST",
          body: JSON.stringify(duplicatedExpense),
        })
      );
    }
  };

  const bulkDuplicateExpenses = (
    expensesToDuplicate: Expense[],
    targetDate?: string,
    keepSameDay = false
  ) => {
    const duplicatedExpenses = expensesToDuplicate.map((expense, index) => {
      let dateToUse;

      if (keepSameDay && targetDate) {
        const originalDate = new Date(`${expense.date}T00:00:00`);
        const targetDateObj = new Date(`${targetDate}T00:00:00`);

        let newDate = new Date(
          targetDateObj.getFullYear(),
          targetDateObj.getMonth(),
          originalDate.getDate()
        );

        const lastDay = new Date(
          targetDateObj.getFullYear(),
          targetDateObj.getMonth() + 1,
          0
        ).getDate();
        if (originalDate.getDate() > lastDay) {
          newDate = new Date(targetDateObj.getFullYear(), targetDateObj.getMonth(), lastDay);
        }

        dateToUse = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, "0")}-${String(
          newDate.getDate()
        ).padStart(2, "0")}`;
      } else {
        dateToUse = targetDate || getCurrentDateString();
      }

      return {
        ...expense,
        id: `${generateId()}-${index}`,
        description: `${expense.description} (Cópia)`,
        date: dateToUse,
      };
    });

    setExpenses((previous) => [...duplicatedExpenses, ...previous]);

    if (USE_REMOTE_STORAGE && isAuthenticated && duplicatedExpenses.length > 0) {
      syncMutationVersion(
        apiRequest<ExpenseMutationResponse>("/batch", {
          method: "POST",
          body: JSON.stringify(duplicatedExpenses),
        })
      );
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
      return (
        dateRegex.test(expense.date) &&
        isNonFutureDateString(expense.date) &&
        hasValidTransactionShape(expense)
      );
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

      setExpenses((previous) => [...expensesWithIds, ...(previous || [])]);

      if (USE_REMOTE_STORAGE && isAuthenticated) {
        syncMutationVersion(
          apiRequest<ExpenseMutationResponse>("/batch", {
            method: "POST",
            body: JSON.stringify(expensesWithIds),
          })
        );
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
    syncState,
    lastSyncedVersion,
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
