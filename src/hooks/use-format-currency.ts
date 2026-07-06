import { useUserStore } from "@/store/userStore";
import { formatCurrency } from "@/lib/utils";

export function useFormatCurrency() {
  const currencyCode = useUserStore((s) => s.currencyCode);
  const showCents = useUserStore((s) => s.showCents);
  const numberFormat = useUserStore((s) => s.numberFormat);

  return (amount: number, overrides?: { currencyCode?: string; showCents?: boolean }) =>
    formatCurrency(
      amount,
      overrides?.currencyCode ?? currencyCode,
      overrides?.showCents ?? showCents,
      numberFormat as "indian" | "international",
    );
}
