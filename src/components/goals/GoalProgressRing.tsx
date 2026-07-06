"use client";

interface Props {
  percent: number;
  size?: number;
  strokeWidth?: number;
}

export default function GoalProgressRing({ percent, size = 80, strokeWidth = 6 }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = circumference - (clamped / 100) * circumference;

  let color = "var(--color-danger, #ef4444)";
  if (clamped >= 75) color = "var(--color-success, #22c55e)";
  else if (clamped >= 50) color = "var(--color-warning, #eab308)";
  else if (clamped >= 25) color = "var(--color-info, #f97316)";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
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
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold text-monochrome-700">{Math.round(clamped)}%</span>
      </div>
    </div>
  );
}