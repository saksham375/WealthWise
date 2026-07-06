"use client";

import { memo, useState } from "react";
import { Edit2, Trash2, Check, X } from "lucide-react";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { resolveIcon } from "@/lib/category-icons";

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

interface Props {
  budget: BudgetItem;
  daysLeft: number;
  index: number;
  onEdit: (budget: BudgetItem) => void;
  onDelete: (id: string) => void;
}

function getProgressColor(pct: number, isOver: boolean): string {
  if (isOver) return "bg-rose-500";
  if (pct >= 80) return "bg-amber-500";
  if (pct >= 60) return "bg-orange-400";
  return "bg-monochrome-900";
}

function getProgressStripe(pct: number, isOver: boolean): string {
  if (isOver) {
    return `repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(255,255,255,0.15) 3px, rgba(255,255,255,0.15) 6px) #EF4444`;
  }
  if (pct >= 80) {
    return `repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(255,255,255,0.15) 3px, rgba(255,255,255,0.15) 6px) #F59E0B`;
  }
  return "";
}

const BudgetCard = memo(function BudgetCard({ budget, daysLeft, index, onEdit, onDelete }: Props) {
  const fmt = useFormatCurrency();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const Icon = resolveIcon(budget.iconName);

  const isWarning = budget.percentage >= 80 && !budget.isOverBudget;
  const isOver = budget.isOverBudget;
  const dailyBudget = daysLeft > 0 ? budget.remaining / daysLeft : 0;
  const stripeBg = getProgressStripe(budget.percentage, isOver);

  return (
    <div
      className="card p-5 animate-fade-in group"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            isOver ? "bg-rose-100" : isWarning ? "bg-amber-100" : "bg-monochrome-100"
          }`}>
            <Icon size={16} className={isOver ? "text-rose-600" : isWarning ? "text-amber-600" : "text-monochrome-600"} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-monochrome-900 truncate">
                {budget.categoryName}
              </span>
              {budget.applyEveryMonth && (
                <span className="text-[9px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                  Recurring
                </span>
              )}
            </div>
            <p className="text-xs text-monochrome-400 tabular-nums">
              {fmt(budget.spent)} <span className="text-monochrome-300">/</span> {fmt(budget.limitAmount)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
          <button className="btn-icon" onClick={() => onEdit(budget)} title="Edit">
            <Edit2 size={13} />
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                className="btn-danger btn-sm flex items-center gap-1"
                onClick={() => { onDelete(budget.id); setConfirmDelete(false); }}
              >
                <Check size={12} />
                Confirm
              </button>
              <button
                className="btn-secondary btn-sm flex items-center gap-1"
                onClick={() => setConfirmDelete(false)}
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button className="btn-icon" onClick={() => setConfirmDelete(true)} title="Delete">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 relative">
        <div className="h-2 bg-monochrome-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${getProgressColor(budget.percentage, isOver)}`}
            style={{
              width: `${Math.min(budget.percentage, 100)}%`,
              ...(stripeBg ? { background: stripeBg } : {}),
            }}
          />
        </div>
      </div>

      {/* Status row */}
      <div className="mt-2.5 flex items-center justify-between">
        <p className={`text-[11px] font-medium ${
          isOver ? "text-rose-600" : isWarning ? "text-amber-600" : "text-emerald-600"
        }`}>
          {isOver
            ? `Over by ${fmt(Math.abs(budget.remaining))}`
            : isWarning
            ? `${fmt(budget.remaining)} left`
            : "On track"}
        </p>
        <p className="text-[11px] text-monochrome-400 tabular-nums">
          {daysLeft > 0 ? `${fmt(Math.max(dailyBudget, 0))}/day · ${daysLeft}d left` : "Month ended"}
        </p>
      </div>
    </div>
  );
});

export default BudgetCard;
