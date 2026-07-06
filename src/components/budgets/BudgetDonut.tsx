"use client";

import { memo } from "react";
import { useFormatCurrency } from "@/hooks/use-format-currency";

interface Props {
  spent: number;
  budget: number;
  daysLeft: number;
}

function getColor(percentage: number): string {
  if (percentage >= 100) return "#EF4444";
  if (percentage >= 80) return "#F59E0B";
  if (percentage >= 60) return "#F97316";
  return "#10B981";
}

const BudgetDonut = memo(function BudgetDonut({ spent, budget, daysLeft }: Props) {
  const fmt = useFormatCurrency();
  const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const remaining = Math.max(budget - spent, 0);
  const color = getColor(percentage);

  const radius = 54;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const dailyBudget = daysLeft > 0 ? remaining / daysLeft : 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg height={radius * 2} width={radius * 2} className="-rotate-90">
          <circle
            stroke="#F1F5F9"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-monochrome-900 tabular-nums">
            {Math.round(percentage)}%
          </span>
          <span className="text-[10px] text-monochrome-400 font-medium">used</span>
        </div>
      </div>
      <div className="text-center space-y-1">
        <div className="text-sm font-semibold text-monochrome-800 tabular-nums">
          {fmt(spent)} <span className="text-monochrome-400 font-normal">of</span> {fmt(budget)}
        </div>
        <div className="flex items-center gap-3 text-xs text-monochrome-500">
          <span>{fmt(remaining)} left</span>
          <span className="w-1 h-1 rounded-full bg-monochrome-300" />
          <span>{fmt(dailyBudget)}/day</span>
        </div>
      </div>
    </div>
  );
});

export default BudgetDonut;
