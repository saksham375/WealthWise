"use client";

import { useFormatCurrency } from "@/hooks/use-format-currency";

interface ScoreBreakdown {
  savingsRate: number;
  budgetAdherence: number;
  spendingTrend: number;
  goalProgress: number;
  incomeStability: number;
}

interface Props {
  score: number;
  breakdown: ScoreBreakdown;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsAmount: number;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#eab308";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Needs Work";
}

export default function FinancialScore({ score, breakdown, monthlyIncome, monthlyExpenses, savingsAmount }: Props) {
  const fmt = useFormatCurrency();
  const color = getScoreColor(score);
  const label = getScoreLabel(score);
  const size = 140;
  const mobileSize = 100;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const factors = [
    { label: "Savings Rate", value: breakdown.savingsRate, weight: "30%" },
    { label: "Budget Adherence", value: breakdown.budgetAdherence, weight: "25%" },
    { label: "Spending Trend", value: breakdown.spendingTrend, weight: "20%" },
    { label: "Goal Progress", value: breakdown.goalProgress, weight: "15%" },
    { label: "Income Stability", value: breakdown.incomeStability, weight: "10%" },
  ];

  return (
    <div className="card p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        <div className="relative inline-flex items-center justify-center shrink-0 w-24 h-24 sm:w-[140px] sm:h-[140px]">
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--color-monochrome-200, #e5e7eb)"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold" style={{ color }}>{score}</span>
            <span className="text-xs text-monochrome-500">/100</span>
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-lg font-semibold text-monochrome-900">Financial Health Score</h2>
          <p className="text-sm text-monochrome-500 mt-0.5">
            Your score is <span className="font-medium" style={{ color }}>{label.toLowerCase()}</span>
          </p>

          <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-monochrome-400 text-xs">Income</p>
              <p className="font-mono font-semibold text-monochrome-900">{fmt(monthlyIncome)}</p>
            </div>
            <div>
              <p className="text-monochrome-400 text-xs">Expenses</p>
              <p className="font-mono font-semibold text-monochrome-900">{fmt(monthlyExpenses)}</p>
            </div>
            <div>
              <p className="text-monochrome-400 text-xs">Saved</p>
              <p className="font-mono font-semibold text-emerald-600">{fmt(savingsAmount)}</p>
            </div>
          </div>
        </div>

        <div className="w-full sm:w-48 space-y-1.5">
          {factors.map((f) => (
            <div key={f.label}>
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span className="text-monochrome-500">{f.label}</span>
                <span className="text-monochrome-400">{f.weight}</span>
              </div>
              <div className="h-1.5 bg-monochrome-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, f.value))}%`,
                    backgroundColor: f.value >= 70 ? "#22c55e" : f.value >= 40 ? "#eab308" : "#ef4444",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
