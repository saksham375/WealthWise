"use client";

import { memo, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  isSameDay,
  isToday,
} from "date-fns";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { HEATMAP_COLORS } from "@/data/chart-colors";
import type { CalendarDayData } from "@/types/api";

interface Props {
  year: number;
  data: Record<string, CalendarDayData>;
  onSelectMonth: (month: number) => void;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function getIntensityColor(ratio: number): string {
  if (ratio === 0) return HEATMAP_COLORS[0];
  if (ratio < 0.2) return HEATMAP_COLORS[1];
  if (ratio < 0.4) return HEATMAP_COLORS[2];
  if (ratio < 0.6) return HEATMAP_COLORS[3];
  if (ratio < 0.8) return HEATMAP_COLORS[4];
  return HEATMAP_COLORS[5];
}

const MiniMonth = memo(function MiniMonth({
  monthIndex,
  year,
  data,
  onSelect,
}: {
  monthIndex: number;
  year: number;
  data: Record<string, CalendarDayData>;
  onSelect: () => void;
}) {
  const fmt = useFormatCurrency();

  const { days, monthTotal, maxExpense } = useMemo(() => {
    const start = startOfMonth(new Date(year, monthIndex, 1));
    const end = endOfMonth(start);
    const allDays = eachDayOfInterval({ start, end });

    let totalIncome = 0;
    let totalExpense = 0;
    let maxExp = 0;

    const dayMap = new Map<string, { date: Date; expense: number; income: number }>();
    for (const d of allDays) {
      const key = format(d, "yyyy-MM-dd");
      const dayData = data[key];
      const expense = dayData?.expenseTotal ?? 0;
      const income = dayData?.incomeTotal ?? 0;
      totalIncome += income;
      totalExpense += expense;
      if (expense > maxExp) maxExp = expense;
      dayMap.set(key, { date: d, expense, income });
    }

    return {
      days: dayMap,
      monthTotal: { income: totalIncome, expense: totalExpense },
      maxExpense: maxExp,
    };
  }, [monthIndex, year, data]);

  const gridStart = startOfWeek(startOfMonth(new Date(year, monthIndex, 1)));
  const gridDays = useMemo(() => {
    const start = startOfMonth(new Date(year, monthIndex, 1));
    const end = endOfMonth(start);
    const allDays = eachDayOfInterval({ start, end });
    const firstDay = allDays[0].getDay();
    const padded: (Date | null)[] = Array(firstDay).fill(null);
    padded.push(...allDays);
    return padded;
  }, [monthIndex, year]);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const isCurrentMonth = monthIndex === currentMonth && year === currentYear;

  return (
    <button
      onClick={onSelect}
      className={`text-left p-3 rounded-xl border transition-all duration-200 ${
        isCurrentMonth
          ? "border-indigo-300 bg-indigo-50/30 shadow-sm"
          : "border-monochrome-200 bg-white hover:border-monochrome-300 hover:shadow-sm"
      }`}
    >
      {/* Month name */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-bold ${isCurrentMonth ? "text-indigo-700" : "text-monochrome-700"}`}>
          {MONTH_NAMES[monthIndex]}
        </span>
        {monthTotal.expense > 0 && (
          <span className="text-[10px] font-semibold text-monochrome-500 tabular-nums">
            {fmt(monthTotal.expense)}
          </span>
        )}
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0 mb-0.5">
        {DAY_LABELS.map((label, i) => (
          <div key={i} className="text-[7px] text-monochrome-400 text-center font-medium leading-3">
            {label}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0">
        {gridDays.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} className="w-4 h-4" />;
          const key = format(day, "yyyy-MM-dd");
          const dayData = data[key];
          const expense = dayData?.expenseTotal ?? 0;
          const ratio = maxExpense > 0 ? expense / maxExpense : 0;
          const today = isToday(day);

          return (
            <div
              key={key}
              className={`w-4 h-4 rounded-sm flex items-center justify-center text-[7px] font-medium transition-colors ${
                today ? "ring-1 ring-indigo-500 font-bold" : ""
              }`}
              style={{ backgroundColor: getIntensityColor(ratio) }}
              title={`${format(day, "MMM d")}: ₹${expense.toLocaleString()}`}
            >
              <span className={ratio > 0.5 ? "text-white" : "text-monochrome-600"}>
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Month summary */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-monochrome-100">
        <div className="flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-emerald-500" />
          <span className="text-[8px] text-monochrome-500 tabular-nums">{fmt(monthTotal.income)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-rose-500" />
          <span className="text-[8px] text-monochrome-500 tabular-nums">{fmt(monthTotal.expense)}</span>
        </div>
      </div>
    </button>
  );
});

const YearView = memo(function YearView({ year, data, onSelectMonth }: Props) {
  const yearStats = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const key of Object.keys(data)) {
      const d = data[key];
      income += d.incomeTotal;
      expense += d.expenseTotal;
    }
    return { income, expense };
  }, [data]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Year grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {MONTH_NAMES.map((_, i) => (
          <MiniMonth
            key={i}
            monthIndex={i}
            year={year}
            data={data}
            onSelect={() => onSelectMonth(i + 1)}
          />
        ))}
      </div>

      {/* Heatmap legend */}
      <div className="flex items-center gap-1.5 justify-end text-[11px] text-monochrome-400 font-medium">
        <span>Less</span>
        {HEATMAP_COLORS.map((color, i) => (
          <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
});

export default YearView;
