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

    expenses.push({
      description: description || typeLabel,
      amount: Math.abs(amount),
      category: "other",
      date,
      type: getExpenseType(amount),
      paymentMethod: getPaymentMethod(typeLabel),
    });

    i = endIndex;
  }

  return expenses;
};
