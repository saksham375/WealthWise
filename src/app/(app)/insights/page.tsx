"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { RefreshCw, Loader2, BrainCircuit } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import PeriodFilter from "@/components/ui/PeriodFilter";
import InsightCard, { type Insight } from "@/components/insights/InsightCardB";
import FinancialScore from "@/components/insights/FinancialScore";
import InsightTabs, { type InsightCategory } from "@/components/insights/InsightTabs";

const FILTER_MAP: Record<string, number> = {
  all: 1200,
  year: 12,
  month: 1,
};

interface EngineResult {
  insights: Insight[];
  healthScore: {
    score: number;
    breakdown: {
      savingsRate: number;
      budgetAdherence: number;
      spendingTrend: number;
      goalProgress: number;
      incomeStability: number;
    };
    monthlyIncome: number;
    monthlyExpenses: number;
    savingsAmount: number;
  };
}

const DISMISS_KEY = "wealthwise_dismissed_insights";

function getDismissedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(DISMISS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function saveDismissedIds(ids: Set<string>) {
  try {
    localStorage.setItem(DISMISS_KEY, JSON.stringify([...ids]));
  } catch {}
}

export default function InsightsPage() {
  const [result, setResult] = useState<EngineResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState("month");
  const [categoryFilter, setCategoryFilter] = useState<InsightCategory>("all");
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const abortRef = useRef<AbortController | null>(null);
  const initialLoad = useRef(true);

  useEffect(() => {
    setDismissedIds(getDismissedIds());
  }, []);

  const fetchInsights = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;

    if (initialLoad.current) setLoading(true);
    const m = FILTER_MAP[periodFilter] ?? 1;
    try {
      const res = await fetch(`/api/analytics/insights?months=${m}`, { signal });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
      initialLoad.current = false;
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [periodFilter]);

  useEffect(() => {
    fetchInsights();
    return () => abortRef.current?.abort();
  }, [fetchInsights]);

  function handleDismiss(id: string) {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveDismissedIds(next);
      return next;
    });
  }

  const insights = result?.insights ?? [];
  const healthScore = result?.healthScore;

  const counts: Record<InsightCategory, number> = {
    all: insights.filter((i) => !dismissedIds.has(i.id)).length,
    spending: insights.filter((i) => i.category === "spending" && !dismissedIds.has(i.id)).length,
    behavior: insights.filter((i) => i.category === "behavior" && !dismissedIds.has(i.id)).length,
    trend: insights.filter((i) => i.category === "trend" && !dismissedIds.has(i.id)).length,
    anomaly: insights.filter((i) => i.category === "anomaly" && !dismissedIds.has(i.id)).length,
    financial: insights.filter((i) => i.category === "financial" && !dismissedIds.has(i.id)).length,
  };

  const filteredInsights = insights.filter((i) => {
    if (dismissedIds.has(i.id)) return false;
    if (categoryFilter === "all") return true;
    return i.category === categoryFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-monochrome-900">Insights</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <PeriodFilter value={periodFilter} onChange={setPeriodFilter} />
          <button
            className="btn-secondary btn-sm flex items-center gap-1.5"
            onClick={fetchInsights}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <>
          <div className="card p-6 animate-pulse">
            <div className="flex items-center gap-6">
              <div className="h-[140px] w-[140px] rounded-full skeleton shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-4 w-48 skeleton rounded" />
                <div className="h-3 w-32 skeleton rounded" />
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-3 w-16 skeleton rounded" />
                  <div className="h-3 w-16 skeleton rounded" />
                  <div className="h-3 w-16 skeleton rounded" />
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg skeleton shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-40 skeleton rounded" />
                    <div className="h-3 w-full skeleton rounded" />
                    <div className="h-3 w-3/4 skeleton rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : !healthScore ? (
        <EmptyState
          icon={BrainCircuit}
          title="No insights yet"
          description="Add more transactions to unlock behavioral analysis and spending patterns."
        />
      ) : (
        <>
          <FinancialScore
            score={healthScore.score}
            breakdown={healthScore.breakdown}
            monthlyIncome={healthScore.monthlyIncome}
            monthlyExpenses={healthScore.monthlyExpenses}
            savingsAmount={healthScore.savingsAmount}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-monochrome-400">
              <span>
                {filteredInsights.length} insight{filteredInsights.length !== 1 ? "s" : ""} generated from your data
              </span>
            </div>
            <InsightTabs value={categoryFilter} onChange={setCategoryFilter} counts={counts} />
          </div>

          {filteredInsights.length === 0 ? (
            <EmptyState
              icon={BrainCircuit}
              title={`No ${categoryFilter === "all" ? "" : categoryFilter} insights`}
              description="Try a different filter or add more transactions to generate insights."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 slide-in-stagger">
              {filteredInsights.map((insight, idx) => (
                <div key={insight.id}>
                  <InsightCard
                    insight={insight}
                    onDismiss={handleDismiss}
                    dismissed={dismissedIds.has(insight.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
