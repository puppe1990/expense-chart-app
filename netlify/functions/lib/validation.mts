import { z } from "zod";

const MAX_AMOUNT = 1_000_000_000;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const authSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
});

export const expenseSchema = z.object({
  id: z.string().min(1).max(120),
  description: z.string().min(1).max(300),
  amount: z.number().finite().positive().max(MAX_AMOUNT),
  category: z.string().min(1).max(80),
  date: z.string().regex(dateRegex),
  type: z.enum(["income", "expense", "transfer", "investment", "investment_profit", "loan"]),
  account: z.enum(["pf", "pj", "card"]).optional(),
  paymentMethod: z
    .enum(["cash", "card", "bank_transfer", "digital_wallet", "check", "pix", "boleto", "other"])
    .optional(),
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string().min(1).max(50)).max(30).optional(),
  isRecurring: z.boolean().optional(),
  recurringFrequency: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
  recurringEndDate: z.string().regex(dateRegex).optional(),
  fromAccount: z.enum(["pf", "pj", "card"]).optional(),
  toAccount: z.enum(["pf", "pj", "card"]).optional(),
  isLoanPayment: z.boolean().optional(),
  relatedLoanId: z.string().max(120).optional(),
  originalLoanAmount: z.number().finite().positive().max(MAX_AMOUNT).optional(),
});

export const expenseUpdateSchema = expenseSchema.omit({ id: true });
export const expenseBatchSchema = z.array(expenseSchema).min(1).max(5000);

const assistantMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(5000),
});

export const assistantRequestSchema = z.object({
  message: z.string().min(1).max(5000),
  history: z.array(assistantMessageSchema).max(20).optional(),
});
