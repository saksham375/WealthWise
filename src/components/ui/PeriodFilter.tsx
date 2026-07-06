"use client";

import { useRef, useEffect, useState } from "react";

interface FilterOption {
  label: string;
  value: string;
}

interface PeriodFilterProps {
  value: string;
  onChange: (value: string) => void;
  options?: FilterOption[];
}

const DEFAULT_OPTIONS: FilterOption[] = [
  { label: "All Time", value: "all" },
  { label: "This Year", value: "year" },
  { label: "This Month", value: "month" },
];

export default function PeriodFilter({ value, onChange, options }: PeriodFilterProps) {
  const opts = options ?? DEFAULT_OPTIONS;
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const buttons = container.querySelectorAll<HTMLButtonElement>("button");
    const activeIdx = opts.findIndex((o) => o.value === value);
    if (activeIdx >= 0 && buttons[activeIdx]) {
      const btn = buttons[activeIdx];
      setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
    }
  }, [value, opts]);

  return (
    <div
      ref={containerRef}
      className="relative flex border border-monochrome-200 rounded-md overflow-hidden bg-white"
    >
      <div
        className="absolute top-0 bottom-0 bg-black rounded-md transition-all duration-250 ease-out"
        style={{ left: indicator.left, width: indicator.width }}
      />
      {opts.map((opt) => (
        <button
          key={opt.value}
          className={`relative z-10 px-3 py-1.5 text-xs font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset ${
            value === opt.value ? "text-white" : "text-monochrome-600 hover:text-monochrome-900"
          }`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
