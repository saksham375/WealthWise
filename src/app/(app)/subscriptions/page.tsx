"use client";

import { useMemo, useState, useCallback } from "react";
import { Plus, Loader2, Calendar, RefreshCw, Clock, AlertCircle, Search, X, Zap, Wallet, TrendingUp } from "lucide-react";
import { differenceInDays, isSameMonth, isSameYear } from "date-fns";
import { EmptyState } from "@/components/ui/EmptyState";
import PeriodFilter from "@/components/ui/PeriodFilter";
import { useApiGet } from "@/hooks/use-api";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import SubscriptionCard from "@/components/subscriptions/SubscriptionCard";
import SubscriptionModal from "@/components/subscriptions/SubscriptionModal";

interface Subscription {
  id: string;
  serviceName: string;
  emoji: string;
  amount: number;
  billingCycle: string;
  nextDueDate: string;
  lastPaidDate: string | null;
  status: string;
}

function StatCard({ label, value, sublabel, icon, accent, delay }: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: React.ReactNode;
  accent?: "accent" | "green" | "amber";
  delay: number;
}) {
  const borderColor = accent === "green"
    ? "border-l-green-500"
    : accent === "amber"
    ? "border-l-amber-500"
    : "border-l-accent-500";

  const iconBg = accent === "green"
    ? "bg-green-50"
    : accent === "amber"
    ? "bg-amber-50"
    : "bg-accent-50";

  const iconColor = accent === "green"
    ? "text-green-600"
    : accent === "amber"
    ? "text-amber-600"
    : "text-accent-600";

  return (
    <div
      className={`glass-card p-5 relative overflow-hidden border-l-[3px] ${borderColor} animate-fade-in-up`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] text-monochrome-400 font-medium uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold font-mono tab-nums text-monochrome-900">{value}</p>
          {sublabel && <p className="text-[11px] text-monochrome-400 mt-0.5">{sublabel}</p>}
        </div>
        <div className={`stat-icon ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

function TimelineRow({ sub, delay }: { sub: Subscription; delay: number }) {
  const daysUntil = differenceInDays(new Date(sub.nextDueDate), new Date());
  const isDueToday = daysUntil <= 0;
  const isDueSoon = daysUntil > 0 && daysUntil <= 3;
  const fmt = useFormatCurrency();

  const dotColor = isDueToday
    ? "bg-red-500"
    : isDueSoon
    ? "bg-amber-500"
    : "bg-green-500";

  return (
    <div
      className="flex items-center gap-4 py-3 animate-fade-in-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className={`timeline-dot ${dotColor}`} />
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-monochrome-100 to-monochrome-200 flex items-center justify-center text-base shrink-0">
          {sub.emoji}
        </div>
        <span className="text-sm font-medium text-monochrome-900 truncate">{sub.serviceName}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="font-mono text-sm font-semibold text-monochrome-900">{fmt(sub.amount)}</span>
        {isDueToday ? (
          <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1">
            <AlertCircle size={11} />
            Due today
          </span>
        ) : isDueSoon ? (
          <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Clock size={11} />
            {daysUntil}d left
          </span>
        ) : (
          <span className="text-[11px] text-monochrome-400">{daysUntil}d left</span>
        )}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="glass-card p-5 space-y-3 animate-pulse">
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
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

export default function SubscriptionsPage() {
  const { data: subscriptions, loading, refresh } = useApiGet<Subscription[]>("/api/subscriptions");
  const { data: upcoming, loading: upcomingLoading, refresh: refreshUpcoming } = useApiGet<Subscription[]>("/api/subscriptions/upcoming");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const fmt = useFormatCurrency();
  const [view, setView] = useState<"all" | "monthly" | "yearly">("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handleRefresh = useCallback(() => {
    refresh();
    refreshUpcoming();
  }, [refresh, refreshUpcoming]);

  function matchesPeriod(sub: Subscription): boolean {
    if (periodFilter === "all") return true;
    const due = new Date(sub.nextDueDate);
    const now = new Date();
    if (periodFilter === "year") return isSameYear(due, now);
    if (periodFilter === "month") return isSameMonth(due, now);
    return true;
  }

  function matchesSearch(sub: Subscription): boolean {
    if (!searchQuery) return true;
    return sub.serviceName.toLowerCase().includes(searchQuery.toLowerCase());
  }

  const filteredSubs = useMemo(() => {
    let subs = subscriptions ?? [];
    if (view !== "all") subs = subs.filter((s) => s.billingCycle === view);
    return subs.filter(matchesPeriod).filter(matchesSearch);
  }, [subscriptions, view, periodFilter, searchQuery]);

  const filteredActive = filteredSubs.filter((s) => s.status === "ACTIVE");
  const filteredPaused = filteredSubs.filter((s) => s.status !== "ACTIVE");

  const { monthlyTotal, yearlyTotal, dueSoonCount } = useMemo(() => {
    const active = (subscriptions ?? []).filter((s) => s.status === "ACTIVE" && matchesPeriod(s));
    return {
      monthlyTotal: active.filter((s) => s.billingCycle === "monthly").reduce((sum, s) => sum + s.amount, 0),
      yearlyTotal: active.filter((s) => s.billingCycle === "yearly").reduce((sum, s) => sum + s.amount, 0),
      dueSoonCount: active.filter((s) => {
        const days = differenceInDays(new Date(s.nextDueDate), new Date());
        return days >= 0 && days <= 7;
      }).length,
    };
  }, [subscriptions, periodFilter]);

  const activeCount = (subscriptions ?? []).filter((s) => s.status === "ACTIVE").length;

  if (loading && !subscriptions) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-32 bg-gradient-to-br from-monochrome-50 to-accent-50/30 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3 animate-pulse">
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
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-monochrome-50 via-white to-accent-50/20 rounded-2xl p-6 sm:p-8 border border-monochrome-100">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-100/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-monochrome-100/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-monochrome-900 mb-2">Subscriptions</h1>
            <p className="text-monochrome-500">
              Track your recurring bills and never miss a payment.
            </p>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-bold font-mono tab-nums text-monochrome-900">
                {fmt(monthlyTotal)}
              </span>
              <span className="text-lg text-monochrome-400 font-medium">/mo</span>
            </div>
          </div>
          <button
            className="btn-primary flex items-center gap-2 self-start sm:self-auto"
            onClick={() => { setEditingSub(null); setModalOpen(true); }}
          >
            <Plus size={16} />
            Add Subscription
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          label="Active Subscriptions"
          value={activeCount}
          sublabel={dueSoonCount > 0 ? `${dueSoonCount} due within 7 days` : undefined}
          icon={<Zap size={18} />}
          accent={dueSoonCount > 0 ? "amber" : "accent"}
          delay={0.05}
        />
        <StatCard
          label="Monthly Total"
          value={fmt(monthlyTotal)}
          sublabel="per month"
          icon={<Wallet size={18} />}
          accent="accent"
          delay={0.1}
        />
        <StatCard
          label="Yearly Total"
          value={fmt(yearlyTotal)}
          sublabel="per year"
          icon={<TrendingUp size={18} />}
          accent="green"
          delay={0.15}
        />
      </div>

      {/* Upcoming Renewals Timeline */}
      {upcoming && upcoming.length > 0 && (
        <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-monochrome-100 flex items-center justify-center">
              <Calendar size={14} className="text-monochrome-600" />
            </div>
            <h2 className="text-sm font-semibold text-monochrome-900">Upcoming Renewals</h2>
            <span className="text-[11px] text-monochrome-400">(Next 30 Days)</span>
            {upcomingLoading && <Loader2 size={13} className="animate-spin text-monochrome-400 ml-auto" />}
          </div>
          <div className="relative pl-9">
            <div className="timeline-line" />
            {upcoming.map((s, idx) => (
              <TimelineRow key={s.id} sub={s} delay={0.25 + idx * 0.05} />
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-monochrome-400" />
          <input
            type="text"
            placeholder="Search subscriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-monochrome-400 hover:text-monochrome-600 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <PeriodFilter value={view} onChange={(v) => setView(v as "all" | "monthly" | "yearly")} options={VIEW_OPTIONS} />
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

      {/* Active Subscriptions */}
      {filteredActive.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <h2 className="text-xs font-semibold text-monochrome-400 uppercase tracking-wider">Active</h2>
            <span className="text-xs text-monochrome-400">({filteredActive.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredActive.map((s, idx) => (
              <div
                key={s.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${0.35 + idx * 0.05}s` }}
              >
                <SubscriptionCard
                  subscription={s}
                  onEdit={(sub) => { setEditingSub(sub); setModalOpen(true); }}
                  onRefresh={handleRefresh}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paused Subscriptions */}
      {filteredPaused.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <h2 className="text-xs font-semibold text-monochrome-400 uppercase tracking-wider">Paused</h2>
            <span className="text-xs text-monochrome-400">({filteredPaused.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPaused.map((s, idx) => (
              <div
                key={s.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${0.35 + idx * 0.05}s` }}
              >
                <SubscriptionCard
                  subscription={s}
                  onEdit={(sub) => { setEditingSub(sub); setModalOpen(true); }}
                  onRefresh={handleRefresh}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredSubs.length === 0 && !loading && (
        <EmptyState
          icon={RefreshCw}
          title="No subscriptions tracked yet"
          description="Track your recurring bills and never miss a payment."
          action={{ label: "Add your first subscription", onClick: () => { setEditingSub(null); setModalOpen(true); } }}
        />
      )}

      <SubscriptionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleRefresh}
        subscription={editingSub}
      />
    </div>
  );
}
