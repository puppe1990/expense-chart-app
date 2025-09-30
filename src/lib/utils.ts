import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Verifica se uma data é futura (após o dia atual)
 * @param dateString - Data no formato YYYY-MM-DD
 * @returns true se a data for futura, false caso contrário
 */
export function isFutureDate(dateString: string): boolean {
  const today = new Date();
  const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD
  
  return dateString > todayString;
}

/**
 * Filtra transações para incluir apenas as do dia atual ou anteriores
 * @param expenses - Array de despesas
 * @returns Array filtrado de despesas
 */
export function filterNonFutureExpenses<T extends { date: string }>(expenses: T[]): T[] {
  return expenses.filter(expense => !isFutureDate(expense.date));
}
