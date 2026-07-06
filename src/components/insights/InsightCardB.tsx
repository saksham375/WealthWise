"use client";

import { ExternalLink, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface Insight {
  id: string;
  type: string;
  category?: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "positive";
  action?: { label: string; href: string };
  sparkline?: number[];
}

interface Props {
  insight: Insight;
  onDismiss?: (id: string) => void;
  dismissed?: boolean;
}

const config = {
  positive: {
    accent: "border-l-emerald-500",
    bg: "bg-emerald-50/40",
    icon: "↗",
    iconColor: "text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
  },
  warning: {
    accent: "border-l-amber-400",
    bg: "bg-amber-50/40",
    icon: "⚡",
    iconColor: "text-amber-500",
    badge: "bg-amber-100 text-amber-700",
  },
  info: {
    accent: "border-l-monochrome-400",
    bg: "bg-monochrome-50/40",
    icon: "●",
    iconColor: "text-monochrome-500",
    badge: "bg-monochrome-100 text-monochrome-600",
  },
};

const label = {
  positive: "Positive",
  warning: "Alert",
  info: "Insight",
};

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 60;
  const h = 24;
  const step = w / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={w} height={h} className="shrink-0 opacity-60">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function InsightCard({ insight, onDismiss, dismissed }: Props) {
  const c = config[insight.severity] ?? config.info;
  const [visible, setVisible] = useState(!dismissed);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dismissed) {
      setVisible(false);
    }
  }, [dismissed]);

  function handleDismiss(e: React.MouseEvent) {
    e.stopPropagation();
    if (cardRef.current) {
      cardRef.current.style.opacity = "0";
      cardRef.current.style.transform = "scale(0.95)";
    }
    setTimeout(() => {
      setVisible(false);
      onDismiss?.(insight.id);
    }, 200);
  }

  if (!visible) return null;

  const sparkColor = insight.severity === "positive" ? "#22c55e" : insight.severity === "warning" ? "#f59e0b" : "#9ca3af";

  return (
    <div
      ref={cardRef}
      className={`card p-4 h-full flex flex-col border-l-2 ${c.accent} ${c.bg} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`text-sm ${c.iconColor}`}>{c.icon}</span>
          <h3 className="text-sm font-semibold text-monochrome-900">{insight.title}</h3>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${c.badge}`}>
            {label[insight.severity]}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {insight.sparkline && (
            <MiniSparkline data={insight.sparkline} color={sparkColor} />
          )}
          {onDismiss && (
            <button
              onClick={handleDismiss}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-monochrome-100 transition-opacity"
              title="Dismiss"
            >
              <X size={12} className="text-monochrome-400" />
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-monochrome-600 leading-relaxed mt-2 flex-1">
        {insight.message}
      </p>

      {insight.action && (
        <a
          href={insight.action.href}
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          {insight.action.label}
          <ExternalLink size={10} />
        </a>
      )}
    </div>
  );
}
