"use client";

import { memo } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { useFormatCurrency } from "@/hooks/use-format-currency";

interface PeriodStats {
  income: number;
  expense: number;
  events: number;
}

interface Props {
  view: "week" | "month" | "year";
  onViewChange: (view: "week" | "month" | "year") => void;
  stats: PeriodStats;
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

const VIEW_OPTIONS = [
  { label: "Week", value: "week" as const },
  { label: "Month", value: "month" as const },
  { label: "Year", value: "year" as const },
];

const CalendarHeader = memo(function CalendarHeader({
  view,
  onViewChange,
  stats,
  label,
  onPrev,
  onNext,
  onToday,
}: Props) {
  const fmt = useFormatCurrency();
  const net = stats.income - stats.expense;
  const savingsRate = stats.income > 0 ? Math.round(((stats.income - stats.expense) / stats.income) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Top row: title + view switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-monochrome-900 flex items-center justify-center">
            <CalendarDays size={18} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-monochrome-900">Calendar</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="relative flex border border-monochrome-200 rounded-lg overflow-hidden bg-monochrome-50">
            {VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onViewChange(opt.value)}
                className={`relative z-10 px-3.5 py-1.5 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset ${
                  view === opt.value
                    ? "bg-monochrome-900 text-white shadow-sm"
                    : "text-monochrome-500 hover:text-monochrome-800 hover:bg-monochrome-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button onClick={onToday} className="btn-secondary btn-sm text-xs">
            Today
          </button>
        </div>
      </div>

      {/* Period label + summary stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button onClick={onPrev} className="btn-icon" title="Previous">
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-sm sm:text-base font-bold text-monochrome-900 min-w-0 text-center tabular-nums px-1">
            {label}
          </h2>
          <button onClick={onNext} className="btn-icon" title="Next">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Summary stats */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-monochrome-500">Income</span>
            <span className="font-semibold text-monochrome-800 tabular-nums">{fmt(stats.income)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-monochrome-500">Expenses</span>
            <span className="font-semibold text-monochrome-800 tabular-nums">{fmt(stats.expense)}</span>
          </div>
          {stats.income > 0 && (
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-monochrome-500">Saved</span>
              <span className={`font-semibold tabular-nums ${net >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                {savingsRate}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default CalendarHeader;
