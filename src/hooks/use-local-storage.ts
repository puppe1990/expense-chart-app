import { useState, useEffect } from 'react';

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
export function useExpensesStorage() {
  const [expenses, setExpenses] = useLocalStorage('expense-chart-expenses', []);

  const addExpense = (expense: any) => {
    const newExpense = {
      ...expense,
      id: Date.now().toString(),
    };
    setExpenses((prev: any[]) => {
      // Sempre criar um novo array para garantir que o React detecte a mudança
      const newArray = [newExpense, ...(prev || [])];
      console.log('🔄 Adicionando despesa:', newExpense);
      console.log('📊 Nova lista de despesas:', newArray);
      return newArray;
    });
  };

  const updateExpense = (id: string, updatedExpense: any) => {
    setExpenses((prev: any[]) => 
      prev.map((expense: any) => 
        expense.id === id ? { ...updatedExpense, id } : expense
      )
    );
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev: any[]) => prev.filter((expense: any) => expense.id !== id));
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
    link.download = `expenses-${new Date().toISOString().split('T')[0]}.json`;
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
          if (Array.isArray(importedData)) {
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

  const duplicateExpense = (expense: any) => {
    const duplicatedExpense = {
      ...expense,
      id: Date.now().toString(),
      description: `${expense.description} (Cópia)`,
      date: new Date().toISOString().split('T')[0], // Set to today's date
    };
    setExpenses((prev: any[]) => [duplicatedExpense, ...prev]);
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
  };
}
