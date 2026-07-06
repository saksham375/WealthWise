"use client";

import { useFormatCurrency } from "@/hooks/use-format-currency";

interface Contribution {
  amount: number;
  createdAt: string;
  note?: string;
}

interface Props {
  contributions: Contribution[];
  maxVisible?: number;
}

export default function ContributionHistory({ contributions, maxVisible = 5 }: Props) {
  const fmt = useFormatCurrency();

  const sorted = [...contributions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const visible = sorted.slice(0, maxVisible);

  if (sorted.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-monochrome-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-monochrome-500">
          Recent Contributions ({sorted.length} total)
        </span>
      </div>
      <div className="space-y-2">
        {visible.map((c, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span className="text-monochrome-600">
                {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
            <span className="font-mono font-medium text-emerald-600">
              +{fmt(c.amount)}
            </span>
          </div>
        ))}
      </div>
      {sorted.length > maxVisible && (
        <p className="text-xs text-monochrome-400 mt-2">
          +{sorted.length - maxVisible} earlier contribution{sorted.length - maxVisible > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
