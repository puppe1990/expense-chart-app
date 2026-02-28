import type { Expense } from "@/components/ExpenseForm";
import { AccountType, getTransferImpact } from "@/lib/accounts";

export type FinancialTotals = {
  totalIncome: number;
  totalExpenses: number;
  totalInvestments: number;
  totalInvestmentProfits: number;
  totalLoans: number;
  totalLoanPayments: number;
  transferImpact: number;
  cashIn: number;
  cashOut: number;
  netCashflow: number;
  operatingResult: number;
  remainingLoanBalance: number;
};

export const calculateFinancialTotals = (
  expenses: Expense[],
  account?: AccountType
): FinancialTotals => {
  const totals: FinancialTotals = {
    totalIncome: 0,
    totalExpenses: 0,
    totalInvestments: 0,
    totalInvestmentProfits: 0,
    totalLoans: 0,
    totalLoanPayments: 0,
    transferImpact: 0,
    cashIn: 0,
    cashOut: 0,
    netCashflow: 0,
    operatingResult: 0,
    remainingLoanBalance: 0,
  };

  for (const expense of expenses) {
    switch (expense.type) {
      case "income":
        totals.totalIncome += expense.amount;
        totals.cashIn += expense.amount;
        break;
      case "expense":
        totals.totalExpenses += expense.amount;
        totals.cashOut += expense.amount;
        if (expense.isLoanPayment) {
          totals.totalLoanPayments += expense.amount;
        }
        break;
      case "investment":
        totals.totalInvestments += expense.amount;
        totals.cashOut += expense.amount;
        break;
      case "investment_profit":
        totals.totalInvestmentProfits += expense.amount;
        totals.cashIn += expense.amount;
        break;
      case "loan":
        totals.totalLoans += expense.amount;
        totals.cashIn += expense.amount;
        break;
      case "transfer":
        if (account) {
          const impact = getTransferImpact(expense, account);
          totals.transferImpact += impact;
          if (impact > 0) totals.cashIn += impact;
          if (impact < 0) totals.cashOut += Math.abs(impact);
        }
        break;
    }
  }

  totals.netCashflow = totals.cashIn - totals.cashOut;
  totals.operatingResult =
    totals.totalIncome +
    totals.totalInvestmentProfits -
    totals.totalExpenses -
    totals.totalInvestments;
  totals.remainingLoanBalance = totals.totalLoans - totals.totalLoanPayments;

  return totals;
};
