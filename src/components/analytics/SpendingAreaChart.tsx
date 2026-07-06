"use client";

import { memo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { AREA_GRADIENT_START, CHART_THEME } from "@/data/chart-colors";

interface DailyData {
  date: string;
  amount: number;
}

interface Props {
  data: DailyData[];
  months?: number;
}

const SpendingAreaChart = memo(function SpendingAreaChart({ data, months }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-monochrome-400 text-sm">
        No data for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={AREA_GRADIENT_START} stopOpacity={0.2} />
            <stop offset="95%" stopColor={AREA_GRADIENT_START} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridColor} vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: CHART_THEME.textColor }}
          axisLine={{ stroke: CHART_THEME.gridColor }}
          tickLine={false}
          tickFormatter={(v: string) => {
            const d = new Date(v);
            if (months && months > 12) {
              return d.toLocaleDateString("en-US", { month: "short" });
            }
            return `${d.getDate()}/${d.getMonth() + 1}`;
          }}
          interval="preserveStartEnd"
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
          formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, "Spent"]}
          labelFormatter={(label: any) => {
            const d = new Date(label);
            if (months && months > 12) {
              return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
            }
            return d.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
          }}
          cursor={{ stroke: AREA_GRADIENT_START, strokeWidth: 1, strokeDasharray: "4 4" }}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke={AREA_GRADIENT_START}
          strokeWidth={2.5}
          fillOpacity={1}
          fill="url(#spendGradient)"
          animationDuration={800}
          animationEasing="ease-in-out"
          dot={false}
          activeDot={{ r: 5, strokeWidth: 2, stroke: "#FFFFFF" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});

export default SpendingAreaChart;
