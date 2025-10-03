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
 * Formata uma data para o formato YYYY-MM-DD sem problemas de fuso horário
 * @param date - Data a ser formatada
 * @returns String no formato YYYY-MM-DD
 */
export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Obtém a data atual no formato YYYY-MM-DD sem problemas de fuso horário
 * @returns String no formato YYYY-MM-DD
 */
export function getCurrentDateString(): string {
  return formatDateToISO(new Date());
}

/**
 * Converte uma string de data YYYY-MM-DD para um objeto Date sem problemas de fuso horário
 * @param dateString - String no formato YYYY-MM-DD
 * @returns Objeto Date
 */
export function parseDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formata uma string de data YYYY-MM-DD para exibição em português brasileiro
 * @param dateString - String no formato YYYY-MM-DD
 * @returns String formatada para exibição
 */
export function formatDateStringForDisplay(dateString: string): string {
  const date = parseDateString(dateString);
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Filtra transações para incluir apenas as do dia atual ou anteriores
 * @param expenses - Array de despesas
 * @returns Array filtrado de despesas
 */
export function filterNonFutureExpenses<T extends { date: string }>(expenses: T[]): T[] {
  return expenses.filter(expense => !isFutureDate(expense.date));
}
