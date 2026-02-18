import type { Expense } from "@/components/ExpenseForm";

type ExpenseInput = Omit<Expense, "id">;

type CategoryRule = {
  keywords: string[];
  category: string;
};

const RULES: CategoryRule[] = [
  { keywords: ["uber", "99", "combustivel", "posto", "estacionamento", "pedagio"], category: "transport" },
  { keywords: ["mercado", "supermercado", "padaria", "ifood", "restaurante", "lanchonete"], category: "food" },
  { keywords: ["aluguel", "condominio", "energia", "agua", "internet", "gas"], category: "housing" },
  { keywords: ["netflix", "spotify", "cinema", "jogo", "steam"], category: "entertainment" },
  { keywords: ["farmacia", "medico", "consulta", "clinica", "hospital"], category: "health" },
  { keywords: ["curso", "faculdade", "udemy", "alura", "livro"], category: "education" },
  { keywords: ["fornecedor", "cliente", "nota fiscal", "contabilidade"], category: "business" },
  { keywords: ["fatura", "telefone", "boleto", "imposto"], category: "bills" },
];

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export const suggestCategoryFromDescription = (description: string): string | null => {
  const normalized = normalizeText(description);
  if (!normalized) return null;

  for (const rule of RULES) {
    if (rule.keywords.some((keyword) => normalized.includes(normalizeText(keyword)))) {
      return rule.category;
    }
  }

  return null;
};

export const applyAutoCategory = (expense: ExpenseInput): ExpenseInput => {
  if (expense.category && expense.category !== "other") {
    return expense;
  }

  const suggested = suggestCategoryFromDescription(expense.description);
  if (!suggested) return expense;

  return {
    ...expense,
    category: suggested,
  };
};
