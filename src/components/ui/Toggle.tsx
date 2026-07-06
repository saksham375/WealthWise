"use client";

import { useId } from "react";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
  label?: string;
  description?: string;
  icon?: React.ReactNode;
  size?: "sm" | "md";
}

export default function Toggle({
  checked,
  onChange,
  id: externalId,
  disabled = false,
  label,
  description,
  icon,
  size = "md",
}: ToggleProps) {
  const generatedId = useId();
  const id = externalId ?? generatedId;

  const trackSize = size === "sm" ? "w-9 h-5" : "w-11 h-6";
  const knobSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const knobTranslate = size === "sm" ? "translate-x-[14px]" : "translate-x-[22px]";
  const knobInactive = size === "sm" ? "translate-x-0.5" : "translate-x-0.5";

  return (
    <label
      htmlFor={id}
      className={`flex items-center gap-3 cursor-pointer select-none group ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${label || description ? "justify-between p-3 rounded-lg border border-monochrome-200 bg-white hover:border-monochrome-300 transition-all active:scale-[0.99]" : ""}`}
    >
      {(label || description) && (
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
              <div className="w-8 h-8 rounded-full bg-monochrome-100 flex items-center justify-center shrink-0 group-hover:bg-monochrome-200 transition-colors">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            {label && (
              <span className={`text-sm font-medium block truncate transition-colors ${
                checked ? "text-monochrome-900" : "text-monochrome-600"
              }`}>
                {label}
              </span>
            )}
            {description && (
              <span className="text-xs text-monochrome-400 block truncate">{description}</span>
            )}
          </div>
        </div>
      )}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex ${trackSize} items-center rounded-full shrink-0
          transition-colors duration-300
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2
          ${checked ? "bg-black" : "bg-monochrome-200 shadow-inner"}
        `}
      >
        <span
          className={`
            inline-block ${knobSize} rounded-full bg-white shadow-md
            transform transition-all duration-300
            ${checked ? knobTranslate : knobInactive}
          `}
          style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        />
      </button>
    </label>
  );
}
