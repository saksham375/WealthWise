"use client";

import { memo, useMemo } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay } from "date-fns";
import { ArrowUp, ArrowDown, Calendar, Target, ChevronDown } from "lucide-react";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import type { CalendarDayData, CalendarEvent } from "@/types/api";

interface Props {
  currentDate: Date;
  data: Record<string, CalendarDayData>;
  selectedDate: string | null;
  onSelectDate: (dateKey: string | null) => void;
}

function EventIcon({ event }: { event: CalendarEvent }) {
  if (event.type === "transaction") {
    return event.isIncome ? <ArrowUp size={12} className="text-emerald-600" /> : <ArrowDown size={12} className="text-rose-500" />;
  }
  if (event.type === "subscription") return <Calendar size={12} className="text-amber-600" />;
  if (event.type === "recurring") return <ArrowDown size={12} className="text-indigo-600" />;
  if (event.type === "goal_deadline") return <Target size={12} className="text-purple-600" />;
  return null;
}

const WeekView = memo(function WeekView({ currentDate, data, selectedDate, onSelectDate }: Props) {
  const fmt = useFormatCurrency();

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const weekStats = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const day of weekDays) {
      const key = format(day, "yyyy-MM-dd");
      const d = data[key];
      if (d) {
        income += d.incomeTotal;
        expense += d.expenseTotal;
      }
    }
    return { income, expense, net: income - expense };
  }, [weekDays, data]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Week summary */}
      <div className="flex items-center gap-4 text-xs">
        <span className="text-monochrome-500">Week Total:</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="font-semibold text-monochrome-800 tabular-nums">{fmt(weekStats.income)}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span className="font-semibold text-monochrome-800 tabular-nums">{fmt(weekStats.expense)}</span>
        </span>
        {weekStats.income > 0 && (
          <span className={`font-semibold tabular-nums ${weekStats.net >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
            Net: {fmt(Math.abs(weekStats.net))}
          </span>
        )}
      </div>

      {/* Day cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {weekDays.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayData = data[dateKey];
          const today = isToday(day);
          const isSelected = selectedDate === dateKey;
          const hasEvents = dayData && dayData.events.length > 0;
          const net = dayData ? dayData.incomeTotal - dayData.expenseTotal : 0;

          return (
            <button
              key={dateKey}
              onClick={() => onSelectDate(isSelected ? null : dateKey)}
              className={`relative text-left p-3 rounded-xl border transition-all duration-200 ${
                isSelected
                  ? "border-monochrome-900 bg-monochrome-50 ring-2 ring-monochrome-900 shadow-md"
                  : today
                  ? "border-indigo-300 bg-indigo-50/50 shadow-sm"
                  : "border-monochrome-200 bg-white hover:border-monochrome-300 hover:shadow-sm"
              }`}
            >
              {/* Day header */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className={`text-[10px] font-medium uppercase tracking-wider ${today ? "text-indigo-600" : "text-monochrome-400"}`}>
                    {format(day, "EEE")}
                  </div>
                  <div className={`text-lg font-bold tabular-nums ${today ? "text-indigo-700" : "text-monochrome-900"}`}>
                    {format(day, "d")}
                  </div>
                </div>
                {hasEvents && (
                  <span className="text-[10px] font-medium text-monochrome-400 bg-monochrome-100 px-1.5 py-0.5 rounded-full">
                    {dayData!.events.length}
                  </span>
                )}
              </div>

              {/* Totals */}
              {dayData && (
                <div className="space-y-1">
                  {dayData.incomeTotal > 0 && (
                    <div className="flex items-center gap-1">
                      <ArrowUp size={10} className="text-emerald-600" />
                      <span className="text-[11px] font-semibold text-emerald-600 tabular-nums">{fmt(dayData.incomeTotal)}</span>
                    </div>
                  )}
                  {dayData.expenseTotal > 0 && (
                    <div className="flex items-center gap-1">
                      <ArrowDown size={10} className="text-rose-500" />
                      <span className="text-[11px] font-semibold text-rose-500 tabular-nums">{fmt(dayData.expenseTotal)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Event dots */}
              {hasEvents && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {dayData!.events.slice(0, 4).map((event, i) => (
                    <div
                      key={`${event.type}-${event.id}-${i}`}
                      className="w-5 h-5 rounded-md bg-monochrome-100 flex items-center justify-center"
                      title={event.title}
                    >
                      <EventIcon event={event} />
                    </div>
                  ))}
                  {dayData!.events.length > 4 && (
                    <div className="w-5 h-5 rounded-md bg-monochrome-100 flex items-center justify-center">
                      <span className="text-[8px] font-bold text-monochrome-500">+{dayData!.events.length - 4}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Net indicator */}
              {net !== 0 && (
                <div className={`absolute bottom-2 right-2 text-[9px] font-bold tabular-nums ${net > 0 ? "text-emerald-500" : "text-rose-400"}`}>
                  {net > 0 ? "+" : ""}{fmt(Math.abs(net))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selectedDate && data[selectedDate] && (
        <SelectedDayDetail dateKey={selectedDate} data={data[selectedDate]} />
      )}
    </div>
  );
});

function SelectedDayDetail({ dateKey, data }: { dateKey: string; data: CalendarDayData }) {
  const fmt = useFormatCurrency();
  const date = new Date(dateKey + "T00:00:00");
  const net = data.incomeTotal - data.expenseTotal;

  return (
    <div className="card p-4 animate-slide-down">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-monochrome-900">
            {format(date, "EEEE, MMMM d, yyyy")}
          </h3>
          <p className="text-xs text-monochrome-400">
            {data.events.length} event{data.events.length !== 1 ? "s" : ""}
            {net !== 0 && (
              <> &middot; Net: <span className={net > 0 ? "text-emerald-600" : "text-rose-500"}>{fmt(Math.abs(net))}</span></>
            )}
          </p>
        </div>
      </div>
      <div className="space-y-1.5">
        {data.events.map((event) => (
          <div key={`${event.type}-${event.id}`} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-monochrome-50 transition-colors">
            <div className="w-7 h-7 rounded-lg bg-monochrome-100 flex items-center justify-center shrink-0">
              <EventIcon event={event} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-monochrome-900 truncate">{event.title}</p>
              {event.category && (
                <p className="text-[10px] text-monochrome-400">{event.category.name}</p>
              )}
            </div>
            {event.amount !== null && (
              <p className={`text-sm font-semibold font-mono tab-nums shrink-0 ${event.isIncome ? "text-emerald-600" : "text-rose-500"}`}>
                {event.isIncome ? "+" : "-"}{fmt(Math.abs(event.amount))}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default WeekView;
