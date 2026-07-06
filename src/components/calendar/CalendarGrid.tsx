"use client";

import { useMemo, useCallback } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isToday, isSameDay } from "date-fns";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import DayCell from "./DayCell";
import DayDetailPopup from "./DayDetailPopup";
import type { CalendarDayData } from "@/types/api";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CalendarData {
  year: number;
  month: number;
  days: Record<string, CalendarDayData>;
}

interface Props {
  data: CalendarData | null;
  loading: boolean;
  selectedDate: string | null;
  onSelectDate: (dateKey: string | null) => void;
}

export default function CalendarGrid({ data, loading, selectedDate, onSelectDate }: Props) {
  const fmt = useFormatCurrency();
  const currentDate = data ? new Date(data.year, data.month - 1, 1) : new Date();

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const gridStart = startOfWeek(monthStart);
    const gridEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentDate]);

  const maxDayExpense = useMemo(() => {
    if (!data) return 0;
    let max = 0;
    for (const day of days) {
      const key = format(day, "yyyy-MM-dd");
      const d = data.days[key];
      if (d && d.expenseTotal > max) max = d.expenseTotal;
    }
    return max;
  }, [data, days]);

  const weeks = useMemo(() => {
    const result: { days: typeof days; weekNum: number; total: number }[] = [];
    for (let i = 0; i < days.length; i += 7) {
      const weekDays = days.slice(i, i + 7);
      const weekNum = Math.floor(i / 7) + 1;
      let total = 0;
      for (const d of weekDays) {
        const key = format(d, "yyyy-MM-dd");
        const dayData = data?.days[key];
        if (dayData) total += dayData.incomeTotal - dayData.expenseTotal;
      }
      result.push({ days: weekDays, weekNum, total });
    }
    return result;
  }, [days, data]);

  const handleSelectDate = useCallback((dateKey: string) => {
    onSelectDate(selectedDate === dateKey ? null : dateKey);
  }, [selectedDate, onSelectDate]);

  const selectedDayData = selectedDate && data?.days[selectedDate] ? data.days[selectedDate] : null;

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-8 gap-1">
          {DAY_LABELS.map((_, i) => (
            <div key={i} className="h-6 bg-monochrome-50 rounded-md animate-pulse" />
          ))}
          <div className="h-6 bg-monochrome-50 rounded-md animate-pulse" />
        </div>
        <div className="grid grid-cols-8 gap-1">
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={i} className="h-16 bg-monochrome-50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Day labels + week total header */}
      <div className="grid grid-cols-8 gap-1">
        {DAY_LABELS.map((label) => (
          <div key={label} className="text-[11px] font-semibold text-monochrome-400 uppercase tracking-wider text-center py-1">
            {label}
          </div>
        ))}
        <div className="text-[11px] font-semibold text-monochrome-400 uppercase tracking-wider text-center py-1">
          Wk
        </div>
      </div>

      {/* Week rows */}
      <div className="space-y-1">
        {weeks.map((week) => (
          <div key={week.weekNum} className="grid grid-cols-8 gap-1">
            {week.days.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayData = data?.days[dateKey] as CalendarDayData | undefined;
              return (
                <DayCell
                  key={dateKey}
                  day={day.getDate()}
                  dateKey={dateKey}
                  data={dayData}
                  isCurrentMonth={isSameMonth(day, currentDate)}
                  isToday={isToday(day)}
                  isSelected={selectedDate === dateKey}
                  maxDayExpense={maxDayExpense}
                  onSelect={handleSelectDate}
                />
              );
            })}
            {/* Week total */}
            <div className="flex flex-col items-center justify-center rounded-lg border border-monochrome-100 bg-monochrome-50/50 min-h-[64px] sm:min-h-[80px]">
              <span className="text-[9px] text-monochrome-400 font-medium">Wk {week.weekNum}</span>
              <span className={`text-[10px] font-bold tab-nums ${week.total >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                {week.total >= 0 ? "+" : ""}{fmt(Math.abs(week.total))}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Selected day detail */}
      {selectedDate && selectedDayData && (
        <DayDetailPopup
          dateKey={selectedDate}
          data={selectedDayData}
          onClose={() => onSelectDate(null)}
        />
      )}
    </div>
  );
}
