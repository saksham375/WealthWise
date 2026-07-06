"use client";

import { memo, useMemo } from "react";
import { HEATMAP_COLORS } from "@/data/chart-colors";

interface HeatmapDay {
  date: string;
  dayOfWeek: number;
  week: number;
  amount: number;
  intensity: number;
}

interface MonthData {
  label: string;
  data: HeatmapDay[];
  maxAmount: number;
}

interface Props {
  monthsData: MonthData[];
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SHORT_DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function getIntensityColor(intensity: number): string {
  if (intensity === 0) return HEATMAP_COLORS[0];
  if (intensity < 0.2) return HEATMAP_COLORS[1];
  if (intensity < 0.4) return HEATMAP_COLORS[2];
  if (intensity < 0.6) return HEATMAP_COLORS[3];
  if (intensity < 0.8) return HEATMAP_COLORS[4];
  return HEATMAP_COLORS[5];
}

function getTextColor(intensity: number): string {
  return intensity > 0.5 ? "#FFFFFF" : "#4F46E5";
}

function MonthGrid({ month }: { month: MonthData }) {
  const lookup = useMemo(() => {
    const map = new Map<string, HeatmapDay>();
    for (const d of month.data) map.set(`${d.dayOfWeek}-${d.week}`, d);
    return map;
  }, [month.data]);

  const weeks = [...new Set(month.data.map((d) => d.week))].sort();
  const isCompact = month.data.length > 0 && weeks.length > 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold text-monochrome-500 text-center">
        {month.label}
      </div>
      <div className="flex gap-1">
        <div className="flex flex-col gap-0.5 pt-0.5">
          {DAY_LABELS.map((label) => (
            <div
              key={label}
              className="text-[10px] text-monochrome-400 h-[30px] flex items-center justify-end pr-1.5 w-5 font-medium"
            >
              {SHORT_DAY_LABELS[DAY_LABELS.indexOf(label)]}
            </div>
          ))}
        </div>
        <div className="flex gap-0.5">
          {weeks.map((week) => (
            <div key={week} className="flex flex-col gap-0.5">
              {DAY_LABELS.map((_, dayIdx) => {
                const day = lookup.get(`${dayIdx}-${week}`);
                if (!day) {
                  return <div key={dayIdx} className="w-[30px] h-[30px]" />;
                }
                return (
                  <div
                    key={day.date}
                    className="w-[30px] h-[30px] rounded-md flex items-center justify-center text-[10px] font-mono cursor-default transition-colors duration-200"
                    style={{
                      backgroundColor: getIntensityColor(day.intensity),
                      color: getTextColor(day.intensity),
                    }}
                    title={`${new Date(day.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}: ₹${day.amount.toLocaleString()}`}
                  >
                    {new Date(day.date).getDate()}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const DayHeatmap = memo(function DayHeatmap({ monthsData }: Props) {
  if (!monthsData || monthsData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-monochrome-400 text-sm">
        No data for this period
      </div>
    );
  }

  if (monthsData.length === 1) {
    const month = monthsData[0];
    if (month.data.length === 0) {
      return (
        <div className="h-48 flex items-center justify-center text-monochrome-400 text-sm">
          No data for this period
        </div>
      );
    }

    return (
      <div>
        <div className="overflow-x-auto">
          <div className="inline-flex gap-2">
            <MonthGrid month={month} />
          </div>
        </div>
        <Legend />
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex gap-6">
          {monthsData.map((month) => (
            <MonthGrid key={month.label} month={month} />
          ))}
        </div>
      </div>
      <Legend />
    </div>
  );
});

function Legend() {
  return (
    <div className="flex items-center gap-1.5 mt-3 justify-end text-[11px] text-monochrome-400 font-medium">
      <span>Less</span>
      {HEATMAP_COLORS.map((color, i) => (
        <div
          key={i}
          className="w-4 h-4 rounded-md"
          style={{ backgroundColor: color }}
        />
      ))}
      <span>More</span>
    </div>
  );
}

export default DayHeatmap;
