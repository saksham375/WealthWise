"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Plus, Target, Trophy, TrendingUp, Calendar, ArrowUpDown } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { calculateGoalInsights } from "@/lib/goal-engine";
import { useToastStore } from "@/store/toastStore";
import GoalModal from "@/components/goals/GoalModal";
import ContributeModal from "@/components/goals/ContributeModal";
import GoalCard from "@/components/goals/GoalCard";
import { useFormatCurrency } from "@/hooks/use-format-currency";

interface Goal {
  id: string;
  goalName: string;
  emoji: string;
  targetAmount: number;
  currentSaved: number;
  deadline: string;
  isCompleted: boolean;
  contributions: { amount: number; createdAt: string }[];
}

type FilterType = "all" | "active" | "completed";
type SortType = "deadline" | "progress" | "name" | "amount";

export default function GoalsPage() {
  const fmt = useFormatCurrency();
  const addToast = useToastStore((s) => s.addToast);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<any>(null);
  const [contributeGoal, setContributeGoal] = useState<{ id: string; goalName: string } | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("deadline");
  const sortContainerRef = useRef<HTMLDivElement>(null);
  const [sortIndicator, setSortIndicator] = useState({ left: 0, width: 0 });

  const SORT_OPTIONS: { value: SortType; label: string }[] = [
    { value: "deadline", label: "Deadline" },
    { value: "progress", label: "Progress" },
    { value: "amount", label: "Amount" },
    { value: "name", label: "Name" },
  ];

  useEffect(() => {
    const container = sortContainerRef.current;
    if (!container) return;
    const buttons = container.querySelectorAll<HTMLButtonElement>("button");
    const activeIdx = SORT_OPTIONS.findIndex((o) => o.value === sort);
    if (activeIdx >= 0 && buttons[activeIdx]) {
      const btn = buttons[activeIdx];
      setSortIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
    }
  }, [sort]);

  async function fetchGoals() {
    try {
      const res = await fetch("/api/goals");
      if (res.ok) setGoals(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGoals();
  }, []);

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
      if (res.ok) {
        addToast({ message: "Goal deleted", type: "success" });
        fetchGoals();
      }
    } catch {
      addToast({ message: "Failed to delete goal", type: "error" });
    }
  }

  const goalInsightsMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const goal of goals) {
      map.set(
        goal.id,
        calculateGoalInsights(
          {
            targetAmount: goal.targetAmount,
            currentSaved: goal.currentSaved,
            deadline: new Date(goal.deadline),
            contributions: goal.contributions.map((c: any) => ({
              amount: c.amount,
              createdAt: new Date(c.createdAt),
            })),
          },
          fmt
        )
      );
    }
    return map;
  }, [goals, fmt]);

  const filteredGoals = useMemo(() => {
    let result = goals.map((g) => ({
      ...g,
      insights: goalInsightsMap.get(g.id),
    }));

    if (filter === "active") result = result.filter((g) => !g.isCompleted);
    if (filter === "completed") result = result.filter((g) => g.isCompleted);

    result.sort((a, b) => {
      if (sort === "deadline") return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      if (sort === "progress") return (b.insights?.percentComplete || 0) - (a.insights?.percentComplete || 0);
      if (sort === "amount") return b.targetAmount - a.targetAmount;
      return a.goalName.localeCompare(b.goalName);
    });

    return result;
  }, [goals, filter, sort, goalInsightsMap]);

  const stats = useMemo(() => {
    const totalSaved = goals.reduce((sum, g) => sum + g.currentSaved, 0);
    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const completed = goals.filter((g) => g.isCompleted).length;
    const avgProgress =
      goals.length > 0
        ? goals.reduce((sum, g) => sum + (goalInsightsMap.get(g.id)?.percentComplete || 0), 0) / goals.length
        : 0;
    return { totalSaved, totalTarget, completed, avgProgress };
  }, [goals, goalInsightsMap]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-monochrome-900">Goals</h1>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => {
            setEditGoal(null);
            setModalOpen(true);
          }}
        >
          <Plus size={18} />
          New Goal
        </button>
      </div>

      {!loading && goals.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 slide-in-stagger">
          <div className="card p-4">
            <div className="flex items-center gap-2 text-monochrome-500 text-xs mb-1">
              <TrendingUp size={14} />
              Total Saved
            </div>
            <p className="font-mono font-semibold text-lg text-monochrome-900">{fmt(stats.totalSaved)}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-monochrome-500 text-xs mb-1">
              <Target size={14} />
              Goals
            </div>
            <p className="font-mono font-semibold text-lg text-monochrome-900">{goals.length}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-monochrome-500 text-xs mb-1">
              <Trophy size={14} />
              Completed
            </div>
            <p className="font-mono font-semibold text-lg text-emerald-600">
              {stats.completed}/{goals.length}
            </p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-monochrome-500 text-xs mb-1">
              <Calendar size={14} />
              Avg Progress
            </div>
            <p className="font-mono font-semibold text-lg text-monochrome-900">
              {Math.round(stats.avgProgress)}%
            </p>
          </div>
        </div>
      )}

      {!loading && goals.length > 0 && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-1 bg-monochrome-100 rounded-lg p-1">
            {(["all", "active", "completed"] as FilterType[]).map((f) => (
              <button
                key={f}
                className={`px-3 py-1.5 text-sm rounded-md transition-all duration-200 ${
                  filter === f ? "bg-white shadow-sm text-monochrome-900 font-medium" : "text-monochrome-500 hover:text-monochrome-700"
                }`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === "all" && ` (${goals.length})`}
                {f === "active" && ` (${goals.length - stats.completed})`}
                {f === "completed" && ` (${stats.completed})`}
              </button>
            ))}
          </div>
          <div
            ref={sortContainerRef}
            className="relative flex items-center border border-monochrome-200 rounded-lg overflow-hidden bg-white"
          >
            <div className="absolute top-0 bottom-0 bg-monochrome-900 rounded-lg transition-all duration-250 ease-out" style={{ left: sortIndicator.left, width: sortIndicator.width }} />
            <ArrowUpDown size={14} className="absolute left-2.5 z-10 text-monochrome-400 pointer-events-none" />
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`relative z-10 pl-8 pr-3 py-1.5 text-xs font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-monochrome-900 focus-visible:ring-inset ${
                  sort === opt.value ? "text-white" : "text-monochrome-500 hover:text-monochrome-700"
                }`}
                onClick={() => setSort(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full skeleton" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-32 skeleton rounded" />
                  <div className="grid grid-cols-3 gap-3">
                    <div className="h-3 w-16 skeleton rounded" />
                    <div className="h-3 w-16 skeleton rounded" />
                    <div className="h-3 w-16 skeleton rounded" />
                  </div>
                  <div className="h-2 w-full skeleton rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Start planning your financial future by creating your first savings goal."
          action={{ label: "Create your first goal", onClick: () => setModalOpen(true) }}
        />
      ) : filteredGoals.length === 0 ? (
        <EmptyState
          icon={Target}
          title={`No ${filter} goals`}
          description={`You have no ${filter} goals. Try a different filter or create a new goal.`}
          action={{ label: "Create a goal", onClick: () => setModalOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 slide-in-stagger">
          {filteredGoals.map((goal, idx) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={(g) => {
                setEditGoal(g);
                setModalOpen(true);
              }}
              onContribute={(g) => setContributeGoal(g)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <GoalModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          fetchGoals();
          addToast({ message: editGoal ? "Goal updated" : "Goal created", type: "success" });
        }}
        editGoal={editGoal}
      />

      {contributeGoal && (
        <ContributeModal
          open={true}
          onClose={() => setContributeGoal(null)}
          onContributed={() => {
            fetchGoals();
            addToast({ message: "Contribution added", type: "success" });
          }}
          goalId={contributeGoal.id}
          goalName={contributeGoal.goalName}
        />
      )}
    </div>
  );
}
