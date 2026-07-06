"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Plus, Wallet, TrendingUp, TrendingDown, PiggyBank, Search, X, ArrowLeftRight, ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import PeriodFilter from "@/components/ui/PeriodFilter";
import { isSameDay, isYesterday, format, startOfDay } from "date-fns";
import dynamic from "next/dynamic";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { getCategoryColor } from "@/lib/category-colors";

const AddTransactionModal = dynamic(() => import("@/components/transactions/AddTransactionModal"), { ssr: false });
import { resolveIcon } from "@/lib/category-icons";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  timestamp: string;
  categoryId?: string;
  category: { name: string; iconName: string };
}

interface Summary {
  balance: number;
  thisMonth: { income: number; expense: number; savings: number; savingsRate: number };
  vsLastMonth: { incomeChange: number; expenseChange: number };
}

interface IncomeExpense {
  month: string;
  income: number;
  expense: number;
}

interface CategoryBreakdown {
  name: string;
  iconName: string;
  amount: number;
  percentage: number;
}

interface UserSettings {
  name: string;
  currencyCode: string;
  numberFormat: string;
}

const FILTER_MAP: Record<string, string> = {
  all: "",
  year: "this_year",
  month: "this_month",
};

function SummaryCard({
  label,
  value,
  trend,
  trendUp,
  icon,
}: {
  label: string;
  value: string;
  trend?: number;
  trendUp?: boolean;
  icon: React.ReactNode;
}) {
  const isGood = trend !== undefined && trendUp !== undefined
    ? (trendUp ? trend >= 0 : trend <= 0)
    : true;
  const showTrend = trend !== undefined && trend !== null;

  return (
    <div className="card p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="h-1 w-full bg-gradient-to-r from-accent-400 to-accent-600 rounded-t-lg absolute top-0 left-0" />
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-monochrome-400 font-medium uppercase tracking-wider">
          {label}
        </span>
        <span className="text-accent-500">{icon}</span>
      </div>
      <p className="text-xl sm:text-2xl font-bold font-mono tab-nums text-monochrome-900 truncate">
        {value}
      </p>
      {showTrend && (
        <div className="flex items-center gap-1 mt-1.5">
          <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
            isGood ? "text-green-600" : "text-red-500"
          }`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend).toFixed(1)}%
          </span>
          <span className="text-[11px] text-monochrome-400">vs last month</span>
        </div>
      )}
    </div>
  );
}

function SpendingTrend({ data, fmt: fmtFn }: { data: IncomeExpense[]; fmt: (v: number) => string }) {
  const max = Math.max(...data.flatMap((d) => [d.income, d.expense]));
  if (max === 0) return <p className="text-xs text-monochrome-400 text-center py-4">No data yet</p>;

  return (
    <div className="space-y-2.5">
      {data.slice(-6).map((d) => (
        <div key={d.month}>
          <div className="flex justify-between text-[10px] text-monochrome-400 mb-1">
            <span className="font-medium">{d.month}</span>
            <span className="font-mono tab-nums">{fmtFn(d.income + d.expense)}</span>
          </div>
          <div className="flex gap-0.5 h-3">
            <div
              className="bg-black rounded-l-sm transition-all duration-500"
              style={{ width: `${(d.income / max) * 100}%` }}
              title={fmtFn(d.income)}
            />
            <div
              className="bg-monochrome-300 rounded-r-sm transition-all duration-500"
              style={{ width: `${(d.expense / max) * 100}%` }}
              title={fmtFn(d.expense)}
            />
          </div>
        </div>
      ))}
      <div className="flex items-center gap-3 text-[10px] text-monochrome-400 pt-1">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-black" /> Income</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-monochrome-300" /> Expense</span>
      </div>
    </div>
  );
}

function CategoryBreakdownWidget({ data, fmt: fmtFn }: { data: CategoryBreakdown[]; fmt: (v: number) => string }) {
  if (data.length === 0) return <p className="text-xs text-monochrome-400 text-center py-4">No data yet</p>;

  return (
    <div className="space-y-3">
      {data.slice(0, 5).map((cat) => {
        const Icon = resolveIcon(cat.iconName);
        const colors = getCategoryColor(cat.name);
        return (
          <div key={cat.name} className="group">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
                  style={{ backgroundColor: colors.bg }}
                >
                  <Icon size={12} style={{ color: colors.icon }} />
                </span>
                <span className="text-xs font-medium text-monochrome-700">{cat.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-semibold text-monochrome-900">
                  {fmtFn(cat.amount)}
                </span>
                <span className="text-[10px] font-mono text-monochrome-400 bg-monochrome-100 px-1.5 py-0.5 rounded">
                  {cat.percentage}%
                </span>
              </div>
            </div>
            <div className="h-1.5 bg-monochrome-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${cat.percentage}%`, backgroundColor: colors.icon }}
              />
            </div>
          </div>
        );
      })}
      <a
        href="/analytics"
        className="flex items-center justify-center gap-1 text-xs font-medium text-accent-600 hover:text-accent-700 transition-colors pt-1"
      >
        View All
        <ArrowRight size={12} />
      </a>
    </div>
  );
}

function formatTime(date: Date): string {
  return format(date, "h:mm a");
}

function groupTransactions(txns: Transaction[]) {
  const now = startOfDay(new Date());
  const today: Transaction[] = [];
  const yesterday: Transaction[] = [];
  const older: Transaction[] = [];

  txns.forEach((tx) => {
    const d = startOfDay(new Date(tx.timestamp));
    if (isSameDay(d, now)) today.push(tx);
    else if (isYesterday(d)) yesterday.push(tx);
    else older.push(tx);
  });

  return { today, yesterday, older };
}

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [trendData, setTrendData] = useState<IncomeExpense[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryBreakdown[]>([]);
  const [user, setUser] = useState<UserSettings | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingTrend, setLoadingTrend] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTxns, setLoadingTxns] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [periodFilter, setPeriodFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedQuery(value);
    }, 200);
  }, []);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const fmt = useFormatCurrency();

  const abortRef = useRef<AbortController | null>(null);
  const initialLoad = useRef(true);

  const fetchAll = useCallback((filter: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;

    const txFilter = FILTER_MAP[filter] ?? "";
    const txUrl = `/api/transactions?limit=20${txFilter ? `&filter=${txFilter}` : ""}`;

    if (initialLoad.current) {
      setLoadingSummary(true);
      setLoadingTrend(true);
      setLoadingCategories(true);
      setLoadingTxns(true);
      initialLoad.current = false;
    }

    Promise.all([
      fetch("/api/users/me", { signal }).then((r) => r.json()).then(
        (u) => setUser({ name: u.name, currencyCode: u.currencyCode, numberFormat: u.numberFormat })
      ).catch(() => {}),
      fetch("/api/transactions/summary", { signal }).then((r) => r.json()).then(setSummary).catch(() => {}),
      fetch("/api/analytics/income-vs-expense?months=6", { signal }).then((r) => r.json()).then(setTrendData).catch(() => {}),
      fetch("/api/analytics/category-breakdown?months=1", { signal }).then((r) => r.json()).then(
        (d) => setCategoryData(d.breakdown ?? [])
      ).catch(() => {}),
      fetch(txUrl, { signal }).then((r) => r.json()).then(
        (data) => setTransactions(Array.isArray(data) ? data : [])
      ).catch(() => {}),
    ]).finally(() => {
      setLoadingSummary(false);
      setLoadingTrend(false);
      setLoadingCategories(false);
      setLoadingTxns(false);
    });
  }, []);

  useEffect(() => {
    fetchAll(periodFilter);
    return () => {
      abortRef.current?.abort();
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [periodFilter, fetchAll]);

  const handleRowClick = useCallback((id: string) => {
    setOpenRowId(prev => prev === id ? null : id);
    setDeleteConfirmId(null);
  }, []);

  const handleEdit = useCallback((tx: Transaction) => {
    setEditTx(tx);
    setModalOpen(true);
    setOpenRowId(null);
  }, []);

  const handleDelete = useCallback(async (txId: string) => {
    setDeleteConfirmId(null);
    setOpenRowId(null);
    try {
      await fetch(`/api/transactions/${txId}`, { method: "DELETE" });
      fetchAll(periodFilter);
    } catch {}
  }, [periodFilter, fetchAll]);

  const handleDeleteConfirm = useCallback((id: string | null) => {
    setDeleteConfirmId(id);
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : hour < 21 ? "Good evening" : "Working late";

  const filteredTransactions = useMemo(() => {
    if (!debouncedQuery.trim()) return transactions;
    const q = debouncedQuery.toLowerCase();
    return transactions.filter(
      (tx) =>
        tx.description?.toLowerCase().includes(q) ||
        tx.category.name.toLowerCase().includes(q)
    );
  }, [transactions, debouncedQuery]);

  const groupLabels = useMemo((): [string, Transaction[]][] => {
    const groups = groupTransactions(filteredTransactions);
    return [
      ["Today", groups.today],
      ["Yesterday", groups.yesterday],
      ["Older", groups.older],
    ];
  }, [filteredTransactions]);

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Greeting */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-monochrome-900">
              {greeting}, {user?.name?.split(" ")[0] ?? "there"}!
            </h1>
            <p className="text-xs text-monochrome-400 mt-0.5">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
          <button
            className="btn-primary flex items-center gap-2 shrink-0"
            onClick={() => { setEditTx(null); setModalOpen(true); }}
          >
            <Plus size={16} />
            Add
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 slide-in-stagger">
          {loadingSummary ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-5 space-y-3">
                <div className="h-3 w-16 bg-monochrome-100 rounded animate-pulse" />
                <div className="h-7 w-24 bg-monochrome-100 rounded animate-pulse" />
                <div className="h-3 w-20 bg-monochrome-100 rounded animate-pulse" />
              </div>
            ))
          ) : summary ? (
            <>
              <div>
                <SummaryCard
                  label="Balance"
                  value={fmt(summary.balance)}
                  icon={<Wallet size={16} />}
                />
              </div>
              <div>
                <SummaryCard
                  label="Income"
                  value={fmt(summary.thisMonth.income)}
                  trend={summary.vsLastMonth.incomeChange}
                  trendUp
                  icon={<TrendingUp size={16} />}
                />
              </div>
              <div>
                <SummaryCard
                  label="Expenses"
                  value={fmt(summary.thisMonth.expense)}
                  trend={summary.vsLastMonth.expenseChange}
                  trendUp={false}
                  icon={<TrendingDown size={16} />}
                />
              </div>
              <div>
                <SummaryCard
                  label="Savings Rate"
                  value={`${summary.thisMonth.savingsRate.toFixed(0)}%`}
                  icon={<PiggyBank size={16} />}
                />
              </div>
            </>
          ) : (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-5">
                <p className="text-sm text-monochrome-400">—</p>
              </div>
            ))
          )}
        </div>

        {/* Middle row: Spending Trend + Top Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 slide-in-stagger">
          <div className="card p-5 transition-all duration-300 hover:shadow-lg">
            <h3 className="text-sm font-semibold text-monochrome-900 mb-4 border-l-2 border-accent-400 pl-2">
              Spending Trend
            </h3>
            {loadingTrend ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-3 bg-monochrome-100 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <SpendingTrend data={trendData} fmt={fmt} />
            )}
          </div>

          <div className="card p-5 transition-all duration-300 hover:shadow-lg">
            <h3 className="text-sm font-semibold text-monochrome-900 mb-4 border-l-2 border-accent-400 pl-2">
              Top Categories
            </h3>
            {loadingCategories ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-5 bg-monochrome-100 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <CategoryBreakdownWidget data={categoryData} fmt={fmt} />
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-monochrome-900">Transactions</h2>
              {!loadingTxns && transactions.length > 0 && (
                <span className="text-[11px] font-medium text-monochrome-400 bg-monochrome-100 px-2 py-0.5 rounded-full">
                  {filteredTransactions.length}
                </span>
              )}
            </div>
            <PeriodFilter value={periodFilter} onChange={setPeriodFilter} />
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search
              size={16}
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                searchQuery ? "text-accent-500" : "text-monochrome-400"
              }`}
            />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-monochrome-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-400/30 focus:border-accent-300 transition-all duration-200 placeholder:text-monochrome-400"
            />
            {searchQuery && (
              <button
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-monochrome-400 hover:text-monochrome-700 transition-colors"
                onClick={() => { setSearchQuery(""); setDebouncedQuery(""); }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Transaction list */}
          {loadingTxns ? (
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-4 flex items-center gap-3.5 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-monochrome-100 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-2/3 bg-monochrome-100 rounded-lg" />
                    <div className="h-2.5 w-1/3 bg-monochrome-100 rounded-lg" />
                  </div>
                  <div className="space-y-1.5 items-end">
                    <div className="h-4 w-16 bg-monochrome-100 rounded-lg" />
                    <div className="h-2.5 w-10 bg-monochrome-100 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-white rounded-xl">
              <EmptyState
                icon={ArrowLeftRight}
                title="No transactions yet"
                description="Add your first transaction using the button above."
              />
            </div>
          ) : filteredTransactions.length === 0 && debouncedQuery.trim() ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-monochrome-100 flex items-center justify-center mx-auto mb-3">
                <Search size={20} className="text-monochrome-400" />
              </div>
              <p className="text-sm font-medium text-monochrome-700">No results found</p>
              <p className="text-xs text-monochrome-400 mt-1">
                No transactions match &quot;{debouncedQuery}&quot;
              </p>
              <button
                className="text-xs text-accent-600 font-semibold mt-3 hover:text-accent-700 transition-colors"
                onClick={() => { setSearchQuery(""); setDebouncedQuery(""); }}
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {groupLabels.map(([label, txns]) =>
                txns.length > 0 ? (
                  <div key={label} className="space-y-2">
                    {/* Group badge */}
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[11px] font-bold text-monochrome-500 uppercase tracking-wider">
                        {label}
                      </span>
                      <span className="text-[10px] font-medium text-monochrome-400 bg-monochrome-100 px-1.5 py-0.5 rounded-full">
                        {txns.length}
                      </span>
                    </div>
                    {/* Transaction cards */}
                    <div className="space-y-1.5">
                      {txns.map((tx) => (
                        <TransactionRow
                          key={tx.id}
                          tx={tx}
                          isOpen={openRowId === tx.id}
                          deleteConfirmId={deleteConfirmId}
                          onRowClick={handleRowClick}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onDeleteConfirm={handleDeleteConfirm}
                        />
                      ))}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          )}
        </div>
      </div>

      <AddTransactionModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTx(null); }}
        onSaved={() => fetchAll(periodFilter)}
        numberFormat={(user?.numberFormat as "indian" | "standard") ?? "indian"}
        currencySymbol={fmt(0).replace(/[\d.,]/g, "").trim() || "₹"}
        editTransaction={editTx}
      />
    </>
  );
}
