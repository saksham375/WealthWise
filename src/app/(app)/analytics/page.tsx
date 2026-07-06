"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import PeriodFilter from "@/components/ui/PeriodFilter";
import dynamic from "next/dynamic";
import { getCached, setCache } from "@/lib/fetch-cache";

const SpendingPieChart = dynamic(() => import("@/components/analytics/SpendingPieChart"), { ssr: false });
const IncomeExpenseBar = dynamic(() => import("@/components/analytics/IncomeExpenseBar"), { ssr: false });
const SpendingAreaChart = dynamic(() => import("@/components/analytics/SpendingAreaChart"), { ssr: false });
const DayHeatmap = dynamic(() => import("@/components/analytics/DayHeatmap"), { ssr: false });

const FILTER_MAP: Record<string, number> = {
  all: 1200,
  year: 12,
  month: 1,
};

async function cachedFetch<T>(url: string, signal: AbortSignal): Promise<T | null> {
  const cached = getCached<T>(url);
  if (cached) return cached;
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const data = await res.json();
    setCache(url, data);
    return data;
  } catch {
    return null;
  }
}

export default function AnalyticsPage() {
  const [periodFilter, setPeriodFilter] = useState("month");
  const abortRef = useRef<AbortController | null>(null);
  const initialLoad = useRef(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [pieData, setPieData] = useState<{
    breakdown: any[];
    total: number;
  }>({ breakdown: [], total: 0 });

  const [barData, setBarData] = useState<any[]>([]);
  const [areaData, setAreaData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<{
    months: Array<{ label: string; data: any[]; maxAmount: number }>;
  }>({ months: [] });

  const [loadingPie, setLoadingPie] = useState(true);
  const [loadingBar, setLoadingBar] = useState(true);
  const [loadingArea, setLoadingArea] = useState(true);
  const [loadingHeatmap, setLoadingHeatmap] = useState(true);

  const months = FILTER_MAP[periodFilter] ?? 1;

  const fetchAnalytics = useCallback(async (filter: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;

    const m = FILTER_MAP[filter] ?? 1;
    const pieUrl = `/api/analytics/category-breakdown?months=${m}`;
    const barUrl = `/api/analytics/income-vs-expense?months=${m}`;
    const areaUrl = `/api/analytics/spending-trend?months=${m}`;
    const heatUrl = `/api/analytics/heatmap?months=${m}`;

    const piePromise = cachedFetch<typeof pieData>(pieUrl, signal)
      .then((d) => { if (!signal.aborted) { setPieData(d ?? { breakdown: [], total: 0 }); setLoadingPie(false); } });

    const barPromise = cachedFetch<typeof barData>(barUrl, signal)
      .then((d) => { if (!signal.aborted) { setBarData(d ?? []); setLoadingBar(false); } });

    const areaPromise = cachedFetch<typeof areaData>(areaUrl, signal)
      .then((d) => { if (!signal.aborted) { setAreaData(d ?? []); setLoadingArea(false); } });

    const heatPromise = cachedFetch<typeof heatmapData>(heatUrl, signal)
      .then((d) => { if (!signal.aborted) { setHeatmapData(d ?? { months: [] }); setLoadingHeatmap(false); } });

    await Promise.all([piePromise, barPromise, areaPromise, heatPromise]);
  }, []);

  function handleFilterChange(newFilter: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPeriodFilter(newFilter);
    }, 150);
  }

  useEffect(() => {
    if (initialLoad.current) {
      setLoadingPie(true);
      setLoadingBar(true);
      setLoadingArea(true);
      setLoadingHeatmap(true);
      initialLoad.current = false;
    } else {
      setLoadingPie(true);
      setLoadingBar(true);
      setLoadingArea(true);
      setLoadingHeatmap(true);
    }
    fetchAnalytics(periodFilter);
    return () => abortRef.current?.abort();
  }, [periodFilter, fetchAnalytics]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-monochrome-900">Analytics</h1>
        <PeriodFilter value={periodFilter} onChange={handleFilterChange} />
      </div>

      {/* Row 1: Composition — what you spend on + income vs expense */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 slide-in-stagger">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-monochrome-900 mb-4">
            Spending Breakdown
          </h2>
          {loadingPie ? (
            <div className="h-64 bg-monochrome-50 rounded-lg animate-pulse flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-monochrome-100 animate-pulse" />
            </div>
          ) : (
            <Suspense fallback={<div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-monochrome-300" size={20} /></div>}>
              <SpendingPieChart
                data={pieData.breakdown}
                total={pieData.total}
              />
            </Suspense>
          )}
        </div>
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-monochrome-900 mb-4">
            Income vs Expenses
          </h2>
          {loadingBar ? (
            <div className="h-64 bg-monochrome-50 rounded-lg animate-pulse flex items-center justify-center">
              <div className="w-3/4 space-y-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-6">
                    <div className="h-2.5 w-28 bg-monochrome-100 rounded animate-pulse" />
                    <div className="h-2.5 w-10 bg-monochrome-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Suspense fallback={<div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-monochrome-300" size={20} /></div>}>
              <IncomeExpenseBar data={barData} />
            </Suspense>
          )}
        </div>
      </div>

      {/* Row 2: Timeline — trend + daily heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 slide-in-stagger">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-monochrome-900 mb-4">
            Spending Trend — {periodFilter === "all" ? "All Time" : periodFilter === "year" ? "This Year" : "This Month"}
          </h2>
          {loadingArea ? (
            <div className="h-64 bg-monochrome-50 rounded-lg animate-pulse flex items-center justify-center">
              <div className="w-full px-8 space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-4 bg-monochrome-100 rounded animate-pulse" />
                ))}
              </div>
            </div>
          ) : (
            <Suspense fallback={<div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-monochrome-300" size={20} /></div>}>
              <SpendingAreaChart data={areaData} months={months} />
            </Suspense>
          )}
        </div>
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-monochrome-900 mb-4">
            Day-by-Day Spending — {periodFilter === "all" ? "All Time" : periodFilter === "year" ? "This Year" : "This Month"}
          </h2>
          {loadingHeatmap ? (
            <div className="h-64 bg-monochrome-50 rounded-lg animate-pulse flex items-center justify-center">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="flex flex-col gap-1">
                    {Array.from({ length: 7 }).map((_, k) => (
                      <div key={k} className="w-8 h-8 bg-monochrome-100 rounded animate-pulse" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Suspense fallback={<div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-monochrome-300" size={20} /></div>}>
              <DayHeatmap
                monthsData={heatmapData.months}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
