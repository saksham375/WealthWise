"use client";

import { memo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { INCOME_COLOR, EXPENSE_COLOR, CHART_THEME } from "@/data/chart-colors";

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

interface Props {
  data: MonthlyData[];
}

const IncomeExpenseBar = memo(function IncomeExpenseBar({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-monochrome-400 text-sm">
        No data for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barGap={6} barCategoryGap="25%">
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: CHART_THEME.textColor }}
          axisLine={{ stroke: CHART_THEME.gridColor }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: CHART_THEME.textColor }}
          axisLine={{ stroke: CHART_THEME.gridColor }}
          tickLine={false}
          tickFormatter={(v: any) => `₹${(Number(v) / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: CHART_THEME.tooltipBg,
            border: `1px solid ${CHART_THEME.tooltipBorder}`,
            borderRadius: "12px",
            fontSize: "13px",
            color: CHART_THEME.tooltipText,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            padding: "8px 12px",
          }}
          formatter={(value: any, name: any) => [`₹${Number(value).toLocaleString()}`, name]}
          cursor={{ fill: "rgba(99, 102, 241, 0.04)" }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value: string) => (
            <span className="text-xs text-monochrome-500">{value}</span>
          )}
        />
        <Bar
          dataKey="income"
          name="Income"
          fill={INCOME_COLOR}
          radius={[6, 6, 0, 0]}
          animationDuration={800}
          animationEasing="ease-in-out"
        />
        <Bar
          dataKey="expense"
          name="Expense"
          fill={EXPENSE_COLOR}
          radius={[6, 6, 0, 0]}
          animationDuration={800}
          animationEasing="ease-in-out"
        />
      </BarChart>
    </ResponsiveContainer>
  );
});

export default IncomeExpenseBar;
