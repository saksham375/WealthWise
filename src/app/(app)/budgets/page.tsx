"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Plus, ChevronLeft, ChevronRight, Loader2, Wallet, ArrowUpDown } from "lucide-react";
import { format, addMonths, subMonths, endOfMonth, differenceInCalendarDays } from "date-fns";
import { EmptyState } from "@/components/ui/EmptyState";
import BudgetModal from "@/components/budgets/BudgetModal";
import BudgetCard from "@/components/budgets/BudgetCard";
import BudgetDonut from "@/components/budgets/BudgetDonut";
import SuggestionsPanel from "@/components/budgets/SuggestionsPanel";
import { useFormatCurrency } from "@/hooks/use-format-currency";

interface BudgetItem {
  id: string;
  categoryId: string;
  categoryName: string;
  iconName: string;
  limitAmount: number;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
  applyEveryMonth?: boolean;
}

type SortKey = "spent" | "limit" | "name" | "over";
type FilterKey = "all" | "over" | "warning" | "ok";

export default function BudgetsPage() {
  const fmt = useFormatCurrency();
  const now = new Date();
  const [currentDate, setCurrentDate] = useState(now);
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editBudget, setEditBudget] = useState<BudgetItem | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string; iconName: string }[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("spent");
  const [filterBy, setFilterBy] = useState<FilterKey>("all");

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();
  const monthLabel = format(currentDate, "MMMM yyyy");

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/budgets?month=${month}&year=${year}`);
      if (res.ok) setBudgets(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, [month, year]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.filter((c: any) => c.type === "expense"));
      }
    } catch {}
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

  const handlePrevMonth = useCallback(() => {
    setCurrentDate((d) => subMonths(d, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate((d) => addMonths(d, 1));
  }, []);

  const handleToday = useCallback(() => {
    setCurrentDate(now);
  }, [now]);

  const sortedBudgets = useMemo(() => {
    const list = [...budgets];
    switch (sortBy) {
      case "spent": return list.sort((a, b) => b.spent - a.spent);
      case "limit": return list.sort((a, b) => b.limitAmount - a.limitAmount);
      case "name": return list.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
      case "over": return list.sort((a, b) => (b.isOverBudget ? 1 : 0) - (a.isOverBudget ? 1 : 0) || b.percentage - a.percentage);
      default: return list;
    }
  }, [budgets, sortBy]);

  const filteredBudgets = useMemo(() => {
    switch (filterBy) {
      case "over": return sortedBudgets.filter((b) => b.isOverBudget);
      case "warning": return sortedBudgets.filter((b) => b.percentage >= 80 && !b.isOverBudget);
      case "ok": return sortedBudgets.filter((b) => b.percentage < 80);
      default: return sortedBudgets;
    }
  }, [sortedBudgets, filterBy]);

  const totalBudget = budgets.reduce((s, b) => s + b.limitAmount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const daysLeft = isCurrentMonth
    ? differenceInCalendarDays(endOfMonth(now), now) + 1
    : 0;
  const daysInMonth = differenceInCalendarDays(endOfMonth(currentDate), currentDate) + 1;
  const daysElapsed = daysInMonth - daysLeft;

  const filterButtons: { key: FilterKey; label: string; count?: number }[] = [
    { key: "all", label: "All", count: budgets.length },
    { key: "over", label: "Over", count: budgets.filter((b) => b.isOverBudget).length },
    { key: "warning", label: "Warning", count: budgets.filter((b) => b.percentage >= 80 && !b.isOverBudget).length },
    { key: "ok", label: "On Track", count: budgets.filter((b) => b.percentage < 80).length },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-monochrome-900 flex items-center justify-center">
            <Wallet size={18} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-monochrome-900">Budgets</h1>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => { setEditBudget(null); setModalOpen(true); }}>
          <Plus size={16} />
          New Budget
        </button>
      </div>

      {/* Month navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button onClick={handlePrevMonth} className="btn-icon" title="Previous month">
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-sm sm:text-base font-bold text-monochrome-900 min-w-0 text-center tabular-nums px-1">
            {monthLabel}
          </h2>
          <button onClick={handleNextMonth} className="btn-icon" title="Next month">
            <ChevronRight size={18} />
          </button>
        </div>
        {!isCurrentMonth && (
          <button onClick={handleToday} className="btn-secondary btn-sm">
            This Month
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="card p-6 animate-pulse flex items-center justify-center h-[240px]">
              <div className="w-28 h-28 rounded-full bg-monochrome-100" />
            </div>
            <div className="card p-6 animate-pulse lg:col-span-2">
              <div className="h-4 w-32 bg-monochrome-100 rounded mb-4" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 bg-monochrome-50 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-monochrome-100" />
                <div className="h-3 w-24 bg-monochrome-100 rounded" />
              </div>
              <div className="h-2 w-full bg-monochrome-100 rounded-full" />
            </div>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={`No budgets for ${monthLabel}`}
          description="Create a budget to track your spending and stay on top of your finances."
          action={{ label: "Create your first budget", onClick: () => setModalOpen(true) }}
        />
      ) : (
        <>
          {/* Overview row: Donut + Suggestions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="card p-6 flex items-center justify-center">
              <BudgetDonut spent={totalSpent} budget={totalBudget} daysLeft={daysLeft} />
            </div>
            <div className="card p-5 lg:col-span-2">
              <h3 className="text-xs font-semibold text-monochrome-500 uppercase tracking-wider mb-3">
                Smart Insights
              </h3>
              <SuggestionsPanel budgets={budgets} />
            </div>
          </div>

          {/* Sort + Filter bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-monochrome-50 border border-monochrome-200 rounded-lg p-1 overflow-x-auto scrollbar-hide">
              {filterButtons.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilterBy(f.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    filterBy === f.key
                      ? "bg-monochrome-900 text-white shadow-sm"
                      : "text-monochrome-500 hover:text-monochrome-800"
                  }`}
                >
                  {f.label}
                  {f.count !== undefined && f.count > 0 && (
                    <span className={`ml-1.5 text-[10px] ${filterBy === f.key ? "text-white/70" : "text-monochrome-400"}`}>
                      {f.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown size={14} className="text-monochrome-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="text-xs font-medium text-monochrome-600 bg-transparent border-none focus:outline-none cursor-pointer"
              >
                <option value="spent">Most Spent</option>
                <option value="limit">Highest Limit</option>
                <option value="name">Alphabetical</option>
                <option value="over">Most Over</option>
              </select>
            </div>
          </div>

          {/* Budget cards */}
          <div className="space-y-3">
            {filteredBudgets.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-sm text-monochrome-400">No budgets match this filter.</p>
              </div>
            ) : (
              filteredBudgets.map((b, idx) => (
                <BudgetCard
                  key={b.id}
                  budget={b}
                  daysLeft={isCurrentMonth ? daysLeft : 0}
                  index={idx}
                  onEdit={(budget) => { setEditBudget(budget); setModalOpen(true); }}
                  onDelete={async (id) => {
                    await fetch(`/api/budgets/${id}`, { method: "DELETE" });
                    fetchBudgets();
                  }}
                />
              ))
            )}
          </div>
        </>
      )}

      <BudgetModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchBudgets}
        categories={categories}
        editBudget={editBudget ? { id: editBudget.id, categoryId: editBudget.categoryId, limitAmount: editBudget.limitAmount } : undefined}
      />
    </div>
  );
}
