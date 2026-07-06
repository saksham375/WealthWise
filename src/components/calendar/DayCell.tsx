"use client";

import { memo } from "react";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { HEATMAP_COLORS } from "@/data/chart-colors";
import type { CalendarDayData, CalendarEvent } from "@/types/api";

interface Props {
  day: number;
  dateKey: string;
  data?: CalendarDayData;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  maxDayExpense: number;
  onSelect: (dateKey: string) => void;
}

function eventDots(events: CalendarEvent[]): { color: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const e of events) {
    if (e.type === "transaction") {
      const c = e.isIncome ? "green" : "rose";
      counts[c] = (counts[c] ?? 0) + 1;
    } else if (e.type === "subscription") {
      counts.amber = (counts.amber ?? 0) + 1;
    } else if (e.type === "recurring") {
      counts.indigo = (counts.indigo ?? 0) + 1;
    } else if (e.type === "goal_deadline") {
      counts.purple = (counts.purple ?? 0) + 1;
    }
  }
  return Object.entries(counts).map(([color, count]) => ({ color, count }));
}

const colorMap: Record<string, string> = {
  rose: "bg-rose-500",
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  indigo: "bg-indigo-500",
  purple: "bg-purple-500",
};

function getHeatmapBg(expense: number, maxExpense: number, isCurrentMonth: boolean): string {
  if (!isCurrentMonth || maxExpense === 0 || expense === 0) return "bg-transparent";
  const ratio = expense / maxExpense;
  if (ratio < 0.2) return "bg-indigo-50/60";
  if (ratio < 0.4) return "bg-indigo-100/60";
  if (ratio < 0.6) return "bg-indigo-200/50";
  if (ratio < 0.8) return "bg-indigo-300/40";
  return "bg-indigo-400/30";
}

const DayCell = memo(function DayCell({
  day,
  dateKey,
  data,
  isCurrentMonth,
  isToday,
  isSelected,
  maxDayExpense,
  onSelect,
}: Props) {
  const fmt = useFormatCurrency();
  const dots = data ? eventDots(data.events) : [];
  const netTotal = data ? data.incomeTotal - data.expenseTotal : 0;
  const hasEvents = data && data.events.length > 0;
  const expense = data?.expenseTotal ?? 0;
  const heatmapBg = getHeatmapBg(expense, maxDayExpense, isCurrentMonth);

  return (
    <button
      onClick={() => onSelect(dateKey)}
      className={`relative flex flex-col items-center justify-start p-1.5 min-h-[64px] sm:min-h-[80px] rounded-lg border text-xs transition-all duration-150 active:scale-[0.97] ${
        isSelected
          ? "border-monochrome-900 bg-monochrome-100 ring-2 ring-monochrome-900 shadow-md"
          : isToday
          ? "border-indigo-400 bg-indigo-50/50 shadow-sm"
          : `border-transparent hover:border-monochrome-200 hover:bg-monochrome-50 ${heatmapBg}`
      } ${!isCurrentMonth ? "opacity-25" : ""}`}
    >
      <span className={`text-[11px] sm:text-xs font-semibold leading-tight ${
        isToday
          ? "text-indigo-700 bg-indigo-100 w-5 h-5 rounded-full flex items-center justify-center"
          : "text-monochrome-600"
      }`}>
        {day}
      </span>
      {hasEvents && (
        <div className="flex gap-0.5 mt-1">
          {dots.map((d) => (
            <span
              key={d.color}
              className={`w-1.5 h-1.5 rounded-full ${colorMap[d.color] ?? "bg-monochrome-300"}`}
            />
          ))}
        </div>
      )}
      {netTotal !== 0 && (
        <span className={`text-[9px] sm:text-[10px] font-mono tab-nums mt-1 leading-tight ${
          netTotal > 0 ? "text-emerald-600" : "text-rose-500"
        }`}>
          {netTotal > 0 ? "+" : ""}{fmt(Math.abs(netTotal))}
        </span>
      )}
    </button>
  );
});

export default DayCell;
export { eventDots, colorMap, type CalendarEvent, type CalendarDayData };
