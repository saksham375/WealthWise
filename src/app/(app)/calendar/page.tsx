"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addYears,
  subYears,
  isSameMonth,
  isSameYear,
} from "date-fns";
import { EmptyState } from "@/components/ui/EmptyState";
import { CalendarDays } from "lucide-react";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import CalendarHeader from "@/components/calendar/CalendarHeader";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import WeekView from "@/components/calendar/WeekView";
import YearView from "@/components/calendar/YearView";
import type { CalendarDayData } from "@/types/api";

interface RawTx {
  id: string; amount: number; type: string; description: string | null; timestamp: string;
  category: { name: string; iconName: string; color?: string | null };
}
interface RawSub {
  id: string; serviceName: string; amount: number; billingCycle: string;
  nextDueDate: string; status: string;
}
interface RawRecurring {
  id: string; templateTitle: string; amount: number; type: string; frequency: string;
  nextRunDate: string; category: { name: string; iconName: string; color: string };
}
interface RawGoal {
  id: string; goalName: string; emoji: string; targetAmount: number;
  currentSaved: number; deadline: string;
}

export default function CalendarPage() {
  const now = new Date();
  const [view, setView] = useState<"week" | "month" | "year">("month");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [weekStart, setWeekStart] = useState(startOfWeek(now));
  const [transactions, setTransactions] = useState<RawTx[]>([]);
  const [subscriptions, setSubscriptions] = useState<RawSub[]>([]);
  const [recurring, setRecurring] = useState<RawRecurring[]>([]);
  const [goals, setGoals] = useState<RawGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const fmt = useFormatCurrency();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setSelectedDate(null);
    try {
      const [txRes, subRes, recRes, goalRes] = await Promise.all([
        fetch("/api/transactions?limit=1000"),
        fetch("/api/subscriptions"),
        fetch("/api/recurring"),
        fetch("/api/goals"),
      ]);
      const [txData, subData, recData, goalData] = await Promise.all([
        txRes.json(), subRes.json(), recRes.json(), goalRes.json(),
      ]);
      setTransactions(Array.isArray(txData) ? txData : txData.data ?? []);
      setSubscriptions(Array.isArray(subData) ? subData : subData.data ?? []);
      setRecurring(Array.isArray(recData) ? recData : recData.data ?? []);
      setGoals(Array.isArray(goalData) ? goalData : goalData.data ?? []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Build full data map (all transactions, not filtered by month)
  const allDays = useMemo(() => {
    const map: Record<string, CalendarDayData> = {};

    function key(d: Date) { return format(d, "yyyy-MM-dd"); }

    for (const tx of transactions) {
      const d = new Date(tx.timestamp);
      const k = key(d);
      if (!map[k]) map[k] = { incomeTotal: 0, expenseTotal: 0, events: [] };
      const isInc = tx.type === "income";
      if (isInc) map[k].incomeTotal += tx.amount;
      else map[k].expenseTotal += tx.amount;
      map[k].events.push({
        id: tx.id, type: "transaction", title: tx.description || tx.category?.name || "Transaction",
        amount: tx.amount, category: tx.category ? { ...tx.category, color: tx.category.color ?? "#737373" } : undefined,
        isIncome: isInc, isUpcoming: false,
      });
    }

    for (const sub of subscriptions) {
      const d = new Date(sub.nextDueDate);
      const k = key(d);
      if (!map[k]) map[k] = { incomeTotal: 0, expenseTotal: 0, events: [] };
      map[k].expenseTotal += sub.amount;
      map[k].events.push({
        id: sub.id, type: "subscription", title: sub.serviceName,
        amount: sub.amount, isUpcoming: true,
        meta: { billingCycle: sub.billingCycle, status: sub.status },
      });
    }

    for (const r of recurring) {
      const d = new Date(r.nextRunDate);
      const k = key(d);
      if (!map[k]) map[k] = { incomeTotal: 0, expenseTotal: 0, events: [] };
      const isInc = r.type === "income";
      if (isInc) map[k].incomeTotal += r.amount;
      else map[k].expenseTotal += r.amount;
      map[k].events.push({
        id: r.id, type: "recurring", title: r.templateTitle,
        amount: r.amount, category: r.category, isIncome: isInc, isUpcoming: true,
        meta: { frequency: r.frequency },
      });
    }

    for (const g of goals) {
      const d = new Date(g.deadline);
      const k = key(d);
      if (!map[k]) map[k] = { incomeTotal: 0, expenseTotal: 0, events: [] };
      map[k].events.push({
        id: g.id, type: "goal_deadline", title: g.goalName,
        amount: g.targetAmount, isUpcoming: true,
        meta: { emoji: g.emoji, currentSaved: String(g.currentSaved) },
      });
    }

    return map;
  }, [transactions, subscriptions, recurring, goals]);

  // Period stats for the header
  const periodStats = useMemo(() => {
    let income = 0;
    let expense = 0;
    let events = 0;

    if (view === "month") {
      const start = startOfMonth(new Date(year, month - 1, 1));
      const end = endOfMonth(start);
      for (const [key, data] of Object.entries(allDays)) {
        const d = new Date(key + "T00:00:00");
        if (d >= start && d <= end) {
          income += data.incomeTotal;
          expense += data.expenseTotal;
          events += data.events.length;
        }
      }
    } else if (view === "week") {
      const end = endOfWeek(weekStart);
      for (const [key, data] of Object.entries(allDays)) {
        const d = new Date(key + "T00:00:00");
        if (d >= weekStart && d <= end) {
          income += data.incomeTotal;
          expense += data.expenseTotal;
          events += data.events.length;
        }
      }
    } else {
      // Year view - all data for the year
      for (const [key, data] of Object.entries(allDays)) {
        const d = new Date(key + "T00:00:00");
        if (d.getFullYear() === year) {
          income += data.incomeTotal;
          expense += data.expenseTotal;
          events += data.events.length;
        }
      }
    }

    return { income, expense, events };
  }, [view, year, month, weekStart, allDays]);

  // Header label
  const headerLabel = useMemo(() => {
    if (view === "month") return format(new Date(year, month - 1), "MMMM yyyy");
    if (view === "week") {
      const end = endOfWeek(weekStart);
      const sameMonth = isSameMonth(weekStart, end);
      if (sameMonth) {
        return `${format(weekStart, "MMM d")} – ${format(end, "d, yyyy")}`;
      }
      return `${format(weekStart, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
    }
    return String(year);
  }, [view, year, month, weekStart]);

  // Navigation handlers
  const handlePrev = useCallback(() => {
    setSelectedDate(null);
    if (view === "month") {
      const d = subMonths(new Date(year, month - 1, 1), 1);
      setYear(d.getFullYear());
      setMonth(d.getMonth() + 1);
    } else if (view === "week") {
      setWeekStart(subWeeks(weekStart, 1));
    } else {
      setYear(year - 1);
    }
  }, [view, year, month, weekStart]);

  const handleNext = useCallback(() => {
    setSelectedDate(null);
    if (view === "month") {
      const d = addMonths(new Date(year, month - 1, 1), 1);
      setYear(d.getFullYear());
      setMonth(d.getMonth() + 1);
    } else if (view === "week") {
      setWeekStart(addWeeks(weekStart, 1));
    } else {
      setYear(year + 1);
    }
  }, [view, year, month, weekStart]);

  const handleToday = useCallback(() => {
    const n = new Date();
    setSelectedDate(null);
    setYear(n.getFullYear());
    setMonth(n.getMonth() + 1);
    setWeekStart(startOfWeek(n));
  }, []);

  const handleViewChange = useCallback((newView: "week" | "month" | "year") => {
    setSelectedDate(null);
    setView(newView);
  }, []);

  const handleSelectMonth = useCallback((m: number) => {
    setMonth(m);
    setView("month");
  }, []);

  return (
    <div className="space-y-5 animate-fade-in">
      <CalendarHeader
        view={view}
        onViewChange={handleViewChange}
        stats={periodStats}
        label={headerLabel}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
      />

      <div className="card p-5">
        {view === "month" && (
          <CalendarGrid
            data={{ year, month, days: allDays }}
            loading={loading}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        )}
        {view === "week" && (
          <WeekView
            currentDate={weekStart}
            data={allDays}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        )}
        {view === "year" && (
          <YearView
            year={year}
            data={allDays}
            onSelectMonth={handleSelectMonth}
          />
        )}
      </div>

      {!loading && Object.keys(allDays).length === 0 && (
        <EmptyState
          icon={CalendarDays}
          title="No calendar data yet"
          description="Add transactions, subscriptions, or recurring schedules to see them on the calendar."
        />
      )}
    </div>
  );
}
