"use client";

import { memo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS, CHART_THEME } from "@/data/chart-colors";

interface CategoryBreakdown {
  name: string;
  iconName: string;
  amount: number;
  percentage: number;
}

interface Props {
  data: CategoryBreakdown[];
  total: number;
}

const SpendingPieChart = memo(function SpendingPieChart({ data, total }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-monochrome-400 text-sm">
        No data for this period
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={105}
            strokeWidth={2}
            stroke="#FFFFFF"
            animationBegin={0}
            animationDuration={800}
            animationEasing="ease-in-out"
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={CHART_COLORS[i % CHART_COLORS.length]}
              />
            ))}
          </Pie>
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
            formatter={(value: any, name: any) => [
              `₹${Number(value).toLocaleString()}`,
              name,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {data.slice(0, 6).map((item, i) => (
          <div
            key={item.name}
            className="flex items-center justify-between text-xs px-1"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              <span className="text-monochrome-600 truncate">{item.name}</span>
            </div>
            <span className="font-mono text-monochrome-800 font-semibold ml-2 shrink-0">
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default SpendingPieChart;
