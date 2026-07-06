"use client";

import { useRef, useEffect, useState } from "react";

export type InsightCategory = "all" | "spending" | "behavior" | "trend" | "anomaly" | "financial";

interface TabConfig {
  value: InsightCategory;
  label: string;
}

const TABS: TabConfig[] = [
  { value: "all", label: "All" },
  { value: "spending", label: "Spending" },
  { value: "behavior", label: "Behavior" },
  { value: "trend", label: "Trends" },
  { value: "anomaly", label: "Anomalies" },
  { value: "financial", label: "Financial" },
];

interface Props {
  value: InsightCategory;
  onChange: (value: InsightCategory) => void;
  counts: Record<InsightCategory, number>;
}

export default function InsightTabs({ value, onChange, counts }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const buttons = container.querySelectorAll<HTMLButtonElement>("button");
    const activeIdx = TABS.findIndex((t) => t.value === value);
    if (activeIdx >= 0 && buttons[activeIdx]) {
      const btn = buttons[activeIdx];
      setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="relative flex border border-monochrome-200 rounded-lg overflow-x-auto scrollbar-hide bg-white"
    >
      <div
        className="absolute top-0 bottom-0 bg-monochrome-900 rounded-lg transition-all duration-250 ease-out"
        style={{ left: indicator.left, width: indicator.width }}
      />
      {TABS.map((tab) => {
        const count = counts[tab.value] ?? 0;
        return (
          <button
            key={tab.value}
            className={`relative z-10 px-3 py-1.5 text-xs font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-monochrome-900 focus-visible:ring-inset whitespace-nowrap ${
              value === tab.value ? "text-white" : "text-monochrome-500 hover:text-monochrome-700"
            }`}
            onClick={() => onChange(tab.value)}
          >
            {tab.label}
            {count > 0 && (
              <span className={`ml-1 text-[10px] ${value === tab.value ? "text-white/70" : "text-monochrome-400"}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
