export type ExpenseType =
  | "income"
  | "expense"
  | "transfer"
  | "investment"
  | "investment_profit"
  | "loan";

export type AccountType = "pf" | "pj" | "card";

export type PaymentMethod =
  | "cash"
  | "card"
  | "bank_transfer"
  | "digital_wallet"
  | "check"
  | "pix"
  | "boleto"
  | "other";

export interface ExpenseRecord {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: ExpenseType;
  account?: AccountType;
  paymentMethod?: PaymentMethod;
  notes?: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringFrequency?: "daily" | "weekly" | "monthly" | "yearly";
  recurringEndDate?: string;
  fromAccount?: AccountType;
  toAccount?: AccountType;
  isLoanPayment?: boolean;
  relatedLoanId?: string;
  originalLoanAmount?: number;
}

export interface AuthInfo {
  userId: string;
  email?: string;
}
