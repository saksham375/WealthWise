"use client";

import { useFormatCurrency } from "@/hooks/use-format-currency";

interface Balance {
  userId: string;
  name: string;
  email: string;
  balance: number;
}

interface Props {
  balances: Balance[];
  currentUserId: string;
  onSettle?: (target: { userId: string; name: string; balance: number }) => void;
}

export default function BalanceSummary({ balances, currentUserId, onSettle }: Props) {
  const fmt = useFormatCurrency();

  if (balances.length === 0) return null;

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-monochrome-900 mb-3">Balance Summary</h3>
      <div className="space-y-2">
        {balances.map((b) => {
          const isMe = b.userId === currentUserId;
          const isPositive = b.balance > 0.01;
          const isNegative = b.balance < -0.01;
          const canSettle = !isMe && (isPositive || isNegative) && onSettle;

          return (
            <div
              key={b.userId}
              className={`flex items-center justify-between py-2 px-2.5 rounded-lg transition-all duration-200 ${
                isMe
                  ? "bg-monochrome-100"
                  : canSettle
                  ? "hover:bg-monochrome-50 cursor-pointer group"
                  : ""
              }`}
              onClick={() => canSettle && onSettle({ userId: b.userId, name: b.name, balance: b.balance })}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-full text-xs flex items-center justify-center font-bold shrink-0 ${
                    isMe ? "bg-monochrome-900 text-white" : "bg-monochrome-200 text-monochrome-700"
                  }`}
                >
                  {b.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="text-sm text-monochrome-800 font-medium">
                    {b.name}{isMe ? " (you)" : ""}
                  </span>
                  {canSettle && (
                    <span className="text-[10px] text-monochrome-400 block group-hover:text-accent-500 transition-colors">
                      Tap to settle
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`font-mono text-sm font-semibold ${
                  isPositive ? "text-emerald-600" : isNegative ? "text-red-500" : "text-monochrome-400"
                }`}
              >
                {isPositive ? "+" : isNegative ? "-" : ""}
                {fmt(Math.abs(b.balance))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
