import { format, formatDistanceToNow } from "date-fns";

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

export function formatCurrency(
  amount: number,
  currencyCode = "INR",
  showCents = true,
  numberFormat: "indian" | "international" = "indian"
): string {
  const symbolMap: Record<string, string> = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
  };
  const symbol = symbolMap[currencyCode] ?? currencyCode;

  if (numberFormat === "indian") {
    const parts = Math.abs(amount).toFixed(showCents ? 2 : 0).split(".");
    const intPart = parts[0];
    const lastThree = intPart.slice(-3);
    const rest = intPart.slice(0, -3);
    const formatted = rest
      ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree
      : lastThree;
    const result = `${symbol}${formatted}${showCents && parts[1] ? "." + parts[1] : ""}`;
    return amount < 0 ? `-${result}` : result;
  }

  return `${symbol}${Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  })}`;
}

export function formatDate(date: Date | string, pattern = "MMM d, yyyy"): string {
  return format(new Date(date), pattern);
}

export function formatRelativeDate(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}
