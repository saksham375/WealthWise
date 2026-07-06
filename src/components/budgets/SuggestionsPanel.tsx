"use client";

import { memo, useMemo } from "react";
import { Lightbulb, CheckCircle2, AlertTriangle } from "lucide-react";
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
}

interface Props {
  budgets: BudgetItem[];
}

const SuggestionsPanel = memo(function SuggestionsPanel({ budgets }: Props) {
  const fmt = useFormatCurrency();

  const suggestions = useMemo(() => {
    const result: { icon: "tip" | "good" | "warn"; text: string; color: string }[] = [];
    const overBudget = budgets.filter((b) => b.isOverBudget);
    const onTrack = budgets.filter((b) => !b.isOverBudget && b.percentage < 80);
    const warning = budgets.filter((b) => b.percentage >= 80 && !b.isOverBudget);

    if (overBudget.length > 0) {
      const totalOver = overBudget.reduce((s, b) => s + (b.spent - b.limitAmount), 0);
      result.push({
        icon: "warn",
        text: `${overBudget.length} categor${overBudget.length > 1 ? "ies" : "y"} over budget by ${fmt(totalOver)}. Review spending or reallocate from under-utilized categories.`,
        color: "text-amber-700 bg-amber-50 border-amber-200",
      });

      const underUtilized = budgets
        .filter((b) => !b.isOverBudget && b.spent < b.limitAmount)
        .sort((a, b) => a.spent / a.limitAmount - b.spent / b.limitAmount);

      if (underUtilized.length > 0) {
        const canReallocate = underUtilized.slice(0, 2);
        for (const b of canReallocate) {
          const free = b.limitAmount - b.spent;
          if (free > 0) {
            result.push({
              icon: "tip",
              text: `You have ${fmt(free)} remaining in ${b.categoryName} — consider reallocating to over-budget categories.`,
              color: "text-indigo-700 bg-indigo-50 border-indigo-200",
            });
          }
        }
      }
    } else if (warning.length > 0) {
      result.push({
        icon: "warn",
        text: `${warning.length} categor${warning.length > 1 ? "ies" : "y"} approaching limit. Monitor spending closely.`,
        color: "text-amber-700 bg-amber-50 border-amber-200",
      });
    }

    if (onTrack.length > 0 && overBudget.length === 0) {
      result.push({
        icon: "good",
        text: `Great job! ${onTrack.length} of ${budgets.length} categories are on track. Keep it up!`,
        color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      });
    }

    if (budgets.length === 0) {
      result.push({
        icon: "tip",
        text: "Create budgets for your expense categories to start tracking your spending limits.",
        color: "text-indigo-700 bg-indigo-50 border-indigo-200",
      });
    }

    return result;
  }, [budgets, fmt]);

  if (suggestions.length === 0) return null;

  const iconMap = {
    tip: <Lightbulb size={14} className="text-indigo-500 shrink-0" />,
    good: <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />,
    warn: <AlertTriangle size={14} className="text-amber-500 shrink-0" />,
  };

  return (
    <div className="space-y-2">
      {suggestions.map((s, i) => (
        <div
          key={i}
          className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs leading-relaxed ${s.color}`}
        >
          <div className="mt-0.5">{iconMap[s.icon]}</div>
          <p>{s.text}</p>
        </div>
      ))}
    </div>
  );
});

export default SuggestionsPanel;
