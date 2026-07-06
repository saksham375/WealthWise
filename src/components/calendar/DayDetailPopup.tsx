"use client";

import { X, ArrowDown, ArrowUp, Calendar, Target } from "lucide-react";
import { format } from "date-fns";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import type { CalendarDayData, CalendarEvent } from "@/types/api";

interface Props {
  dateKey: string;
  data: CalendarDayData;
  onClose: () => void;
}

function EventIcon({ event }: { event: CalendarEvent }) {
  if (event.type === "transaction") {
    return event.isIncome ? <ArrowUp size={13} className="text-emerald-600" /> : <ArrowDown size={13} className="text-rose-500" />;
  }
  if (event.type === "subscription") return <Calendar size={13} className="text-amber-600" />;
  if (event.type === "recurring") return <ArrowDown size={13} className="text-indigo-600" />;
  if (event.type === "goal_deadline") return <Target size={13} className="text-purple-600" />;
  return null;
}

function EventTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    transaction: "bg-monochrome-100 text-monochrome-600",
    subscription: "bg-amber-50 text-amber-700",
    recurring: "bg-indigo-50 text-indigo-700",
    goal_deadline: "bg-purple-50 text-purple-700",
  };
  const labels: Record<string, string> = {
    transaction: "Transaction",
    subscription: "Renewal",
    recurring: "Scheduled",
    goal_deadline: "Goal",
  };
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${styles[type] ?? "bg-monochrome-100 text-monochrome-600"}`}>
      {labels[type] ?? type}
    </span>
  );
}

export default function DayDetailPopup({ dateKey, data, onClose }: Props) {
  const fmt = useFormatCurrency();
  const date = new Date(dateKey + "T00:00:00");
  const netTotal = data.incomeTotal - data.expenseTotal;

  return (
    <div className="card p-4 animate-slide-down">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-monochrome-900">
            {format(date, "EEEE, MMMM d, yyyy")}
          </h3>
          <p className="text-xs text-monochrome-400 mt-0.5">
            {data.events.length} event{data.events.length !== 1 ? "s" : ""}
            {netTotal !== 0 && (
              <> &middot; Net: <span className={netTotal > 0 ? "text-emerald-600" : "text-rose-500"}>{fmt(Math.abs(netTotal))}</span></>
            )}
          </p>
        </div>
        <button onClick={onClose} className="btn-icon" title="Close">
          <X size={16} />
        </button>
      </div>

      {/* Day summary pills */}
      <div className="flex gap-2 mb-3">
        {data.incomeTotal > 0 && (
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-medium">
            <ArrowUp size={12} />
            <span className="tabular-nums">{fmt(data.incomeTotal)}</span>
          </div>
        )}
        {data.expenseTotal > 0 && (
          <div className="flex items-center gap-1.5 bg-rose-50 text-rose-600 px-2.5 py-1 rounded-lg text-xs font-medium">
            <ArrowDown size={12} />
            <span className="tabular-nums">{fmt(data.expenseTotal)}</span>
          </div>
        )}
      </div>

      {/* Event list */}
      <div className="space-y-1 max-h-56 overflow-y-auto">
        {data.events.map((event) => (
          <div key={`${event.type}-${event.id}`} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-monochrome-50 transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-monochrome-100 group-hover:bg-monochrome-200/60 flex items-center justify-center shrink-0 transition-colors">
              <EventIcon event={event} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-monochrome-900 truncate">{event.title}</p>
                <EventTypeBadge type={event.type} />
              </div>
              {event.category && (
                <p className="text-[10px] text-monochrome-400 mt-0.5">{event.category.name}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              {event.amount !== null && (
                <p className={`text-sm font-semibold font-mono tab-nums ${event.isIncome ? "text-emerald-600" : "text-rose-500"}`}>
                  {event.isIncome ? "+" : "-"}{fmt(Math.abs(event.amount))}
                </p>
              )}
              {event.isUpcoming && (
                <p className="text-[10px] text-monochrome-400">Upcoming</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
