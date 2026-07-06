"use client";

import { useState } from "react";
import { Edit2, Trash2, TrendingUp, Check } from "lucide-react";
import GoalProgressRing from "./GoalProgressRing";
import ContributionHistory from "./ContributionHistory";
import { useFormatCurrency } from "@/hooks/use-format-currency";

export interface GoalWithInsights {
  id: string;
  goalName: string;
  emoji: string;
  targetAmount: number;
  currentSaved: number;
  deadline: string;
  isCompleted: boolean;
  contributions: { amount: number; createdAt: string }[];
  insights: {
    requiredMonthly: number;
    currentMonthlyRate: number;
    monthsRemaining: number;
    amountRemaining: number;
    percentComplete: number;
    etaDate: Date;
    onTrack: boolean;
    message: string;
  };
}

interface Props {
  goal: GoalWithInsights;
  onEdit: (goal: GoalWithInsights) => void;
  onContribute: (goal: { id: string; goalName: string }) => void;
  onDelete: (id: string) => void;
}

export default function GoalCard({ goal, onEdit, onContribute, onDelete }: Props) {
  const fmt = useFormatCurrency();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { insights } = goal;
  const milestones = [25, 50, 75, 100];
  const activeMilestones = milestones.filter((m) => insights.percentComplete >= m);

  const streak = getStreak(goal.contributions);

  function handleDelete() {
    setDeleteConfirm(false);
    onDelete(goal.id);
  }

  return (
    <div
      className={`card p-5 transition-all duration-200 hover:shadow-md ${
        goal.isCompleted ? "ring-2 ring-emerald-200 bg-emerald-50/30" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <GoalProgressRing percent={insights.percentComplete} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{goal.emoji}</span>
              <h3 className="font-semibold text-monochrome-900 truncate">{goal.goalName}</h3>
              {goal.isCompleted && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <Check size={12} />
                  Done
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                className="btn-secondary btn-sm flex items-center gap-1"
                onClick={() => onContribute({ id: goal.id, goalName: goal.goalName })}
              >
                <TrendingUp size={14} />
                <span className="hidden sm:inline">Add</span>
              </button>
              <button className="btn-icon btn-sm" onClick={() => onEdit(goal)}>
                <Edit2 size={14} />
              </button>
              {deleteConfirm ? (
                <div className="flex items-center gap-1">
                  <button className="btn-danger btn-sm" onClick={handleDelete}>
                    Delete
                  </button>
                  <button className="btn-secondary btn-sm" onClick={() => setDeleteConfirm(false)}>
                    No
                  </button>
                </div>
              ) : (
                <button className="btn-icon btn-sm" onClick={() => setDeleteConfirm(true)}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-monochrome-400 text-xs">Saved</p>
              <p className="font-mono font-semibold text-monochrome-900">
                {fmt(goal.currentSaved)}
              </p>
            </div>
            <div>
              <p className="text-monochrome-400 text-xs">Remaining</p>
              <p className="font-mono text-monochrome-600">
                {fmt(insights.amountRemaining)}
              </p>
            </div>
            <div>
              <p className="text-monochrome-400 text-xs">
                {insights.monthsRemaining > 0 ? `${insights.monthsRemaining}mo left` : "Overdue"}
              </p>
              <p className="font-mono text-monochrome-600">
                {fmt(insights.requiredMonthly)}/mo
              </p>
            </div>
          </div>

          {insights.percentComplete < 100 && (
            <div className="mt-3">
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${Math.min(insights.percentComplete, 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-2 flex items-center gap-3 text-xs">
            <span
              className={`font-medium ${
                insights.onTrack ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {insights.onTrack ? "On track" : "Needs attention"}
            </span>
            {streak > 0 && (
              <span className="text-monochrome-500">
                {streak}mo streak
              </span>
            )}
            <span className="text-monochrome-400">
              {goal.contributions.length} contribution{goal.contributions.length !== 1 ? "s" : ""}
            </span>
          </div>

          {activeMilestones.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5">
              {milestones.map((m) => (
                <span
                  key={m}
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    insights.percentComplete >= m
                      ? "bg-indigo-100 text-indigo-700 font-medium"
                      : "bg-monochrome-100 text-monochrome-400"
                  }`}
                >
                  {m}%
                </span>
              ))}
            </div>
          )}

          <ContributionHistory contributions={goal.contributions} maxVisible={3} />
        </div>
      </div>
    </div>
  );
}

function getStreak(contributions: { createdAt: string }[]): number {
  if (contributions.length === 0) return 0;

  const sorted = [...contributions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const months = new Set<string>();
  for (const c of sorted) {
    const d = new Date(c.createdAt);
    months.add(`${d.getFullYear()}-${d.getMonth()}`);
  }

  const monthArr = [...months].sort().reverse();
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${now.getMonth()}`;

  let streak = 0;
  let checkKey = currentKey;

  for (const m of monthArr) {
    if (m === checkKey) {
      streak++;
      const [y, mo] = m.split("-").map(Number);
      const prev = mo === 0 ? `${y - 1}-11` : `${y}-${mo - 1}`;
      checkKey = prev;
    } else if (streak === 0 && m < checkKey) {
      break;
    } else {
      break;
    }
  }

  return streak;
}
