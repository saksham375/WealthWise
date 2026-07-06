export type InternalField =
  | "date"
  | "amount"
  | "type"
  | "description"
  | "category"
  | "income_amount"
  | "expense_amount"
  | "skip";

export type ColumnMap = Record<string, InternalField>;
export type DateFormat = string;

const COLUMN_PATTERNS: Record<InternalField, RegExp[]> = {
  date: [/^date$/i, /transaction.?date/i, /posting.?date/i, /trans.?date/i, /trxn.?date/i, /txn.?date/i],
  amount: [/^amount$/i, /^sum$/i, /^value$/i, /transaction.?amount/i, /trxn.?amount/i],
  type: [/^type$/i, /transaction.?type/i, /debit.?credit/i, /dr.?cr/i, /^side$/i],
  description: [/^description$/i, /^desc$/i, /^memo$/i, /^payee$/i, /^merchant$/i, /^details$/i, /^narrative$/i, /^note$/i],
  category: [/^category$/i, /^category.?name$/i],
  income_amount: [/^income$/i, /^credit$/i, /^deposit$/i, /^inflow$/i, /^cr$/i, /credit.?amount/i],
  expense_amount: [/^expense$/i, /^debit$/i, /^withdrawal$/i, /^outflow$/i, /^dr$/i, /debit.?amount/i, /^amount$/i],
  skip: [/^check.?number$/i, /^ref(erence)?/i, /^balance$/i, /^status$/i, /^id$/i, /^sr.?no/i, /^s\.?no/i, /^running.?balance/i],
};

const KNOWN_DATE_FORMATS = [
  { pattern: /^\d{4}-\d{2}-\d{2}$/, format: "yyyy-MM-dd" },
  { pattern: /^\d{2}\/\d{2}\/\d{4}$/, format: "MM/dd/yyyy" },
  { pattern: /^\d{2}-\d{2}-\d{4}$/, format: "MM-dd-yyyy" },
  { pattern: /^\d{4}\/\d{2}\/\d{2}$/, format: "yyyy/MM/dd" },
  { pattern: /^\d{2}-\w{3}-\d{4}$/, format: "dd-MMM-yyyy" },
  { pattern: /^\d{2}\/\d{2}\/\d{2}$/, format: "MM/dd/yy" },
  { pattern: /^\d{2}-\d{2}-\d{2}$/, format: "MM-dd-yy" },
  { pattern: /^\d{2}\.\d{2}\.\d{4}$/, format: "dd.MM.yyyy" },
  { pattern: /^\d{2}\.\d{2}\.\d{2}$/, format: "dd.MM.yy" },
  { pattern: /^\d{4}\d{2}\d{2}$/, format: "yyyyMMdd" },
];

const TYPE_KEYWORD_MAP: Record<string, "income" | "expense"> = {
  income: "income",
  credit: "income",
  deposit: "income",
  inflow: "income",
  cr: "income",
  expense: "expense",
  debit: "expense",
  withdrawal: "expense",
  outflow: "expense",
  dr: "expense",
  payment: "expense",
  spent: "expense",
};

export function detectColumnMapping(headers: string[]): ColumnMap {
  const mapping: ColumnMap = {};
  const used: Set<string> = new Set();

  const assigned = new Set<InternalField>();

  for (const header of headers) {
    const trimmed = header.trim();
    if (!trimmed) {
      mapping[header] = "skip";
      continue;
    }

    let best: InternalField | null = null;
    let bestScore = 0;

    for (const [field, patterns] of Object.entries(COLUMN_PATTERNS)) {
      if (field === "skip") continue;
      if (assigned.has(field as InternalField)) continue;

      for (const regex of patterns) {
        if (regex.test(trimmed)) {
          const score = regex.source.length;
          if (score > bestScore) {
            bestScore = score;
            best = field as InternalField;
          }
          break;
        }
      }
    }

    if (best) {
      mapping[trimmed] = best;
      assigned.add(best);
      used.add(header);
    } else {
      mapping[trimmed] = "skip";
    }
  }

  for (const header of headers) {
    const trimmed = header.trim();
    if (!used.has(header) && !mapping[trimmed]) {
      for (const [, patterns] of Object.entries({ skip: COLUMN_PATTERNS.skip })) {
        for (const regex of patterns) {
          if (regex.test(trimmed)) {
            mapping[trimmed] = "skip";
            break;
          }
        }
      }
    }
  }

  if (!assigned.has("amount") && assigned.has("income_amount") && assigned.has("expense_amount")) {
  }

  return mapping;
}

export function detectDateFormat(samples: string[]): DateFormat {
  for (const sample of samples) {
    if (!sample || typeof sample !== "string") continue;
    const trimmed = sample.trim();
    for (const { pattern, format } of KNOWN_DATE_FORMATS) {
      if (pattern.test(trimmed)) return format;
    }
  }
  return "yyyy-MM-dd";
}

export function inferTypeFromAmount(
  amount: number,
  incomeCol?: string,
  expenseCol?: string,
  incomeVal?: number | string,
  expenseVal?: number | string
): "income" | "expense" {
  if (incomeCol && expenseVal == null && incomeVal != null) return "income";
  if (expenseCol && incomeVal == null && expenseVal != null) return "expense";
  if (amount >= 0) return "income";
  return "expense";
}

export function inferTypeFromString(val: string): "income" | "expense" | null {
  const lower = val.toLowerCase().trim();
  for (const [keyword, t] of Object.entries(TYPE_KEYWORD_MAP)) {
    if (lower === keyword || lower.includes(keyword)) return t;
  }
  return null;
}

export function applyMapping(
  rows: Record<string, unknown>[],
  mapping: ColumnMap
): {
  date: string;
  amount: number;
  type: string;
  description: string;
  category: string;
}[] {
  return rows.map((row) => {
    const reverseMap = new Map<InternalField, string>();
    for (const [header, field] of Object.entries(mapping)) {
      const resolved = Object.keys(row).find(
        (k) => k.trim().toLowerCase() === header.toLowerCase()
      );
      if (resolved && field !== "skip") {
        reverseMap.set(field, resolved);
      }
    }

    const rawDate = row[reverseMap.get("date") ?? ""] as string | undefined;
    const rawAmount = row[reverseMap.get("amount") ?? ""] as string | number | undefined;
    const rawType = row[reverseMap.get("type") ?? ""] as string | undefined;
    const rawDesc = row[reverseMap.get("description") ?? ""] as string | undefined;
    const rawCat = row[reverseMap.get("category") ?? ""] as string | undefined;

    const incomeKey = reverseMap.get("income_amount");
    const expenseKey = reverseMap.get("expense_amount");
    const rawIncome = incomeKey ? (row[incomeKey] as string | number | undefined) : undefined;
    const rawExpense = expenseKey ? (row[expenseKey] as string | number | undefined) : undefined;

    let amount: number;
    let type: string;

    const parsedAmount = typeof rawAmount === "number" ? rawAmount : parseFloat(String(rawAmount ?? ""));
    const parsedIncome = typeof rawIncome === "number" ? rawIncome : parseFloat(String(rawIncome ?? ""));
    const parsedExpense = typeof rawExpense === "number" ? rawExpense : parseFloat(String(rawExpense ?? ""));

    if (!isNaN(parsedIncome) && !isNaN(parsedExpense) && parsedIncome > 0 && parsedExpense > 0) {
      amount = parsedIncome;
      type = "income";
    } else if (!isNaN(parsedIncome) && parsedIncome > 0) {
      amount = parsedIncome;
      type = "income";
    } else if (!isNaN(parsedExpense) && parsedExpense > 0) {
      amount = parsedExpense;
      type = "expense";
    } else if (!isNaN(parsedAmount)) {
      const abs = Math.abs(parsedAmount);
      const inferredType = rawType ? inferTypeFromString(rawType) : null;
      if (inferredType) {
        type = inferredType;
        amount = abs;
      } else if (parsedAmount >= 0) {
        type = "income";
        amount = abs;
      } else {
        type = "expense";
        amount = abs;
      }
    } else {
      amount = 0;
      type = rawType && inferTypeFromString(rawType) ? inferTypeFromString(rawType)! : "expense";
    }

    return {
      date: rawDate ?? "",
      amount,
      type,
      description: rawDesc ?? "",
      category: rawCat ?? "",
    };
  });
}

export function parseAmount(val: string | number | undefined | null): number {
  if (val == null) return 0;
  if (typeof val === "number") return val;
  const cleaned = String(val).replace(/[₹$,€£\s]/g, "").replace(/,/g, "");
  return parseFloat(cleaned);
}

export type { ParsedTransaction } from "@/types";
