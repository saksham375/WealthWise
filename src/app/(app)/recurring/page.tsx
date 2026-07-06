"use client";

import { useMemo, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { isSameMonth, isSameYear } from "date-fns";
import { EmptyState } from "@/components/ui/EmptyState";
import PeriodFilter from "@/components/ui/PeriodFilter";
import { useApiGet } from "@/hooks/use-api";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import RecurringCard from "@/components/recurring/RecurringCard";
import RecurringModal from "@/components/recurring/RecurringModal";
import type { RecurringScheduleWithStats } from "@/types/api";

function StatCard({ label, value, sublabel, accent, delay }: {
  label: string;
  value: string | number;
  sublabel?: string;
  accent?: "accent" | "green" | "amber";
  delay: number;
}) {
  const gradient = accent === "green"
    ? "from-green-400 to-green-600"
    : accent === "amber"
    ? "from-amber-400 to-amber-600"
    : "from-accent-400 to-accent-600";
  return (
    <div className="card p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg animate-fade-in-up" style={{ animationDelay: `${delay}s` }}>
      <div className={`h-1 w-full bg-gradient-to-r ${gradient} rounded-t-lg absolute top-0 left-0`} />
      <p className="text-[11px] text-monochrome-400 font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold font-mono tab-nums text-monochrome-900">{value}</p>
      {sublabel && <p className="text-[11px] text-monochrome-400 mt-0.5">{sublabel}</p>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card p-4 space-y-3 animate-pulse">
      <div className="h-1 w-full bg-monochrome-100 rounded-t-lg" />
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-monochrome-100" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-24 bg-monochrome-100 rounded" />
          <div className="h-2.5 w-16 bg-monochrome-100 rounded" />
        </div>
        <div className="text-right space-y-1.5">
          <div className="h-4 w-14 bg-monochrome-100 rounded" />
          <div className="h-2.5 w-8 bg-monochrome-100 rounded ml-auto" />
        </div>
      </div>
      <div className="h-px bg-monochrome-100" />
      <div className="flex items-center justify-between">
        <div className="h-4 w-14 bg-monochrome-100 rounded-full" />
        <div className="flex gap-1">
          <div className="h-7 w-7 bg-monochrome-100 rounded" />
          <div className="h-7 w-7 bg-monochrome-100 rounded" />
          <div className="h-7 w-7 bg-monochrome-100 rounded" />
        </div>
      </div>
    </div>
  );
}

const VIEW_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
];

export default function RecurringPage() {
  const { data: schedules, loading, refresh } = useApiGet<RecurringScheduleWithStats[]>("/api/recurring");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<RecurringScheduleWithStats | null>(null);
  const fmt = useFormatCurrency();
  const [view, setView] = useState<"all" | "active" | "paused">("all");
  const [periodFilter, setPeriodFilter] = useState("all");

  function matchesPeriod(s: RecurringScheduleWithStats): boolean {
    if (periodFilter === "all") return true;
    const run = new Date(s.nextRunDate);
    const now = new Date();
    if (periodFilter === "year") return isSameYear(run, now);
    if (periodFilter === "month") return isSameMonth(run, now);
    return true;
  }

  const activeSchedules = (schedules ?? []).filter((s) => s.isActive && matchesPeriod(s));
  const pausedSchedules = (schedules ?? []).filter((s) => !s.isActive && matchesPeriod(s));

  const filteredSchedules = useMemo(() => {
    let list = schedules ?? [];
    if (view === "active") list = list.filter((s) => s.isActive);
    if (view === "paused") list = list.filter((s) => !s.isActive);
    return list.filter(matchesPeriod);
  }, [schedules, view, periodFilter]);

  const { monthlyTotal, yearlyTotal, overdueCount } = useMemo(() => {
    const active = (schedules ?? []).filter((s) => s.isActive && matchesPeriod(s));
    return {
      monthlyTotal: active.filter((s) => s.frequency === "monthly").reduce((sum, s) => sum + s.amount, 0),
      yearlyTotal: active.filter((s) => s.frequency === "yearly").reduce((sum, s) => sum + s.amount, 0),
      overdueCount: active.filter((s) => new Date(s.nextRunDate) < new Date()).length,
    };
  }, [schedules, periodFilter]);

  if (loading && !schedules) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="h-7 w-36 bg-monochrome-100 rounded animate-pulse" />
          <div className="h-9 w-36 bg-monochrome-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 space-y-3 animate-pulse">
              <div className="h-1 w-full bg-monochrome-100 rounded-t-lg" />
              <div className="h-3 w-20 bg-monochrome-100 rounded" />
              <div className="h-7 w-16 bg-monochrome-100 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-monochrome-900">Recurring Transactions</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => { setEditingSchedule(null); setModalOpen(true); }}>
          <Plus size={16} />
          Add
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          label="Active Schedules"
          value={activeSchedules.length}
          sublabel={overdueCount > 0 ? `${overdueCount} overdue` : undefined}
          accent={overdueCount > 0 ? "amber" : "accent"}
          delay={0}
        />
        <StatCard
          label="Monthly Recurring"
          value={`${fmt(monthlyTotal)}`}
          sublabel="/mo"
          accent="accent"
          delay={0.05}
        />
        <StatCard
          label="Yearly Recurring"
          value={`${fmt(yearlyTotal)}`}
          sublabel="/yr"
          accent="accent"
          delay={0.1}
        />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
        <PeriodFilter value={view} onChange={(v) => setView(v as "all" | "active" | "paused")} options={VIEW_OPTIONS} />
        <PeriodFilter
          value={periodFilter}
          onChange={(v) => setPeriodFilter(v)}
          options={[
            { label: "All Time", value: "all" },
            { label: "This Year", value: "year" },
            { label: "This Month", value: "month" },
          ]}
        />
      </div>

      {/* Active schedules */}
      {filteredSchedules.filter((s) => s.isActive).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-monochrome-400 uppercase tracking-wider">Active</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSchedules.filter((s) => s.isActive).map((s, idx) => (
              <div
                key={s.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${0.2 + idx * 0.05}s` }}
              >
                <RecurringCard
                  schedule={s}
                  onEdit={(sch) => { setEditingSchedule(sch); setModalOpen(true); }}
                  onRefresh={refresh}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paused schedules */}
      {filteredSchedules.filter((s) => !s.isActive).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-monochrome-400 uppercase tracking-wider">Paused</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSchedules.filter((s) => !s.isActive).map((s, idx) => (
              <div
                key={s.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${0.2 + idx * 0.05}s` }}
              >
                <RecurringCard
                  schedule={s}
                  onEdit={(sch) => { setEditingSchedule(sch); setModalOpen(true); }}
                  onRefresh={refresh}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredSchedules.length === 0 && !loading && (
        <EmptyState
          icon={RefreshCw}
          title="No recurring transactions yet"
          description="Set up recurring income or expenses like salary, rent, or subscriptions."
          action={{ label: "Create your first schedule", onClick: () => { setEditingSchedule(null); setModalOpen(true); } }}
        />
      )}

      <RecurringModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={refresh}
        schedule={editingSchedule}
      />
    </div>
  );
}
