import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import type { Expense } from "@/components/ExpenseForm";

const MONTHS: Record<string, string> = {
  janeiro: "01",
  fevereiro: "02",
  marco: "03",
  abril: "04",
  maio: "05",
  junho: "06",
  julho: "07",
  agosto: "08",
  setembro: "09",
  outubro: "10",
  novembro: "11",
  dezembro: "12",
};

const normalizeLine = (line: string) =>
  line
    .replace(/\s+/g, " ")
    .replace(/\u0000/g, "")
    .trim();

const isDateLine = (line: string) => /^\d{2}\/\d{2}$/.test(line);

const isValueLine = (line: string) => /-?\s*R\$\s*\d/.test(line);

const parseAmount = (line: string) => {
  const isNegative = /-\s*R\$/u.test(line) || line.trim().startsWith("-");
  const cleaned = line
    .replace(/[^0-9,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return null;
  return isNegative ? -Math.abs(parsed) : Math.abs(parsed);
};

const getPaymentMethod = (typeLabel: string): Expense["paymentMethod"] => {
  const normalized = typeLabel.toLowerCase();
  if (normalized.includes("pix")) return "pix";
  if (normalized.includes("cartão") || normalized.includes("cartao")) return "card";
  if (normalized.includes("pagamento")) return "card";
  return "other";
};

const getExpenseType = (amount: number): Expense["type"] =>
  amount < 0 ? "expense" : "income";

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();

const normalizeCategoryLabel = (value: string) => normalizeText(value);

const C6_CATEGORY_MAP: Record<string, string> = {
  "supermercados / mercearia / padarias / lojas de conveniencia": "food",
  "restaurante / lanchonete / bar": "food",
  transporte: "transport",
  "assistencia medica e odontologica": "health",
  "vestuario / roupas": "shopping",
  entretenimento: "entertainment",
  "servicos profissionais": "business",
  "empresa para empresa": "business",
  "empresa servicos": "business",
  "servicos de telecomunicacoes": "bills",
  associacao: "bills",
  "departamento / desconto": "shopping",
  "especialidade varejo": "shopping",
  "casa / escritorio mobiliario": "housing",
  "marketing direto": "business",
  eletrico: "bills",
};

const parseCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ";" && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
};

const parseBrazilianDate = (value: string): string | null => {
  const [day, month, year] = value.split("/");
  if (!day || !month || !year) return null;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

const parseBrazilianNumber = (value: string): number | null => {
  const cleaned = value.replace(/\s/g, "");
  if (!cleaned) return null;
  let normalized = cleaned;
  if (cleaned.includes(",") && cleaned.includes(".")) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = cleaned.replace(",", ".");
  }
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
};

const buildDescription = (description: string, installment?: string): string => {
  const trimmed = description.replace(/\s+/g, " ").trim();
  if (!installment || installment === "Única") return trimmed;
  return trimmed ? `${trimmed} (${installment})` : installment;
};

const parseMonthHeader = (line: string) => {
  const normalizedLine = line
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const match = normalizedLine.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (!match) return null;
  const monthName = match[1].toLowerCase();
  const month = MONTHS[monthName];
  if (!month) return null;
  return { month, year: match[2] };
};

const extractTextLines = async (file: File, password?: string) => {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjsLib.getDocument({ data, password });
  const pdf = await loadingTask.promise;
  const lines: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    for (const item of content.items as Array<{ str: string }>) {
      const normalized = normalizeLine(item.str);
      if (normalized) {
        lines.push(normalized);
      }
    }
  }

  return lines;
};

export const parseC6BankStatement = async (
  file: File,
  password?: string
): Promise<Array<Omit<Expense, "id">>> => {
  const lines = await extractTextLines(file, password);
  const expenses: Array<Omit<Expense, "id">> = [];
  let currentYear: string | null = null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const monthHeader = parseMonthHeader(line);
    if (monthHeader) {
      currentYear = monthHeader.year;
      continue;
    }

    if (!isDateLine(line) || !isDateLine(lines[i + 1] ?? "")) continue;
    if (!currentYear) continue;

    const typeLabel = lines[i + 2] ?? "";
    const descriptionParts: string[] = [];
    let valueLine = "";
    let endIndex = i + 2;

    for (let j = i + 3; j < lines.length; j += 1) {
      const candidate = lines[j];
      if (candidate.startsWith("Saldo do dia")) break;
      if (isDateLine(candidate) && isDateLine(lines[j + 1] ?? "")) break;
      if (isValueLine(candidate)) {
        valueLine = candidate;
        endIndex = j;
        break;
      }
      descriptionParts.push(candidate);
    }

    if (!valueLine) continue;

    const amount = parseAmount(valueLine);
    if (amount === null) continue;

    const [day, month] = line.split("/");
    const date = `${currentYear}-${month}-${day}`;
    const description = descriptionParts.join(" ").replace(/\s+/g, " ").trim();
    const normalizedDescription = normalizeText(description || typeLabel);
    const isCardPayment = normalizedDescription.includes("pgto fat cartao c6");
    const amountValue = Math.abs(amount);

    expenses.push({
      description: description || typeLabel,
      amount: amountValue,
      category: "other",
      date,
      type: isCardPayment ? "transfer" : getExpenseType(amount),
      account: isCardPayment ? undefined : "pf",
      fromAccount: isCardPayment ? "pf" : undefined,
      toAccount: isCardPayment ? "card" : undefined,
      paymentMethod: getPaymentMethod(typeLabel),
    });

    i = endIndex;
  }

  return expenses;
};

export const parseC6CardStatementCsv = async (
  file: File
): Promise<Array<Omit<Expense, "id">>> => {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length <= 1) return [];

  const headerCells = parseCsvLine(lines[0]).map((cell, index) =>
    index === 0 ? cell.replace(/^\uFEFF/, "") : cell
  );
  const headerIndex = new Map(headerCells.map((cell, index) => [cell, index]));

  const getCell = (cells: string[], key: string) => {
    const index = headerIndex.get(key);
    if (index === undefined) return "";
    return cells[index] ?? "";
  };

  const expenses: Array<Omit<Expense, "id">> = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i]);
    const dateValue = getCell(cells, "Data de Compra");
    const descriptionValue = getCell(cells, "Descrição");
    const categoryValue = getCell(cells, "Categoria");
    const installmentValue = getCell(cells, "Parcela");
    const amountValue = getCell(cells, "Valor (em R$)");
    const cardSuffix = getCell(cells, "Final do Cartão");

    const parsedDate = parseBrazilianDate(dateValue);
    const parsedAmount = parseBrazilianNumber(amountValue);
    if (!parsedDate || parsedAmount === null || parsedAmount === 0) continue;

    const normalizedDescription = normalizeText(descriptionValue);
    if (normalizedDescription.includes("inclusao de pagamento")) {
      continue;
    }

    const normalizedCategory = normalizeCategoryLabel(categoryValue);
    const mappedCategory = C6_CATEGORY_MAP[normalizedCategory] ?? "other";
    const isNegative = parsedAmount < 0;
    const description = buildDescription(descriptionValue, installmentValue);
    const category = mappedCategory;
    const type: Expense["type"] = isNegative ? "income" : "expense";
    const notes = cardSuffix ? `Cartão final ${cardSuffix}` : "";

    expenses.push({
      description: description || "Transação cartão",
      amount: Math.abs(parsedAmount),
      category,
      date: parsedDate,
      type,
      account: "card",
      paymentMethod: "card",
      notes: notes || undefined,
    });
  }

  return expenses;
};
