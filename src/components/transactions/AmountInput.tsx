"use client";

import { useRef, useState, useEffect } from "react";

function formatIndian(numStr: string): string {
  if (numStr.length <= 3) return numStr;
  const lastThree = numStr.slice(-3);
  const rest = numStr.slice(0, -3);
  const groups: string[] = [];
  for (let i = rest.length; i > 0; i -= 2) {
    groups.unshift(rest.slice(Math.max(0, i - 2), i));
  }
  return groups.join(",") + "," + lastThree;
}

function formatStandard(numStr: string): string {
  const groups: string[] = [];
  for (let i = numStr.length; i > 0; i -= 3) {
    groups.unshift(numStr.slice(Math.max(0, i - 3), i));
  }
  return groups.join(",");
}

function formatDisplay(raw: string, fmt: "indian" | "standard"): string {
  if (!raw || raw === ".") return raw || "";
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const dotCount = (cleaned.match(/\./g) || []).length;
  if (dotCount > 1) return "";

  const parts = cleaned.split(".");
  const integer = parts[0];
  const decimal = parts.length > 1 ? "." + parts.slice(1).join("") : "";
  const fn = fmt === "indian" ? formatIndian : formatStandard;
  return fn(integer) + decimal;
}

function getNewCursor(rawCursor: number, formatted: string): number {
  let pos = rawCursor;
  for (let i = 0; i < formatted.length; i++) {
    if (formatted[i] === ",") {
      const commasBefore = (formatted.slice(0, i).match(/,/g) || []).length;
      const rawPos = i - commasBefore;
      if (rawPos < rawCursor) pos++;
      else break;
    }
  }
  return Math.min(pos, formatted.length);
}

interface Props {
  value: string;
  onChange: (raw: string) => void;
  numberFormat?: "indian" | "standard";
  currencySymbol?: string;
}

export default function AmountInput({
  value,
  onChange,
  numberFormat = "indian",
  currencySymbol = "₹",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [display, setDisplay] = useState("");

  useEffect(() => {
    setDisplay(formatDisplay(value, numberFormat));
  }, [value, numberFormat]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9.]/g, "");
    const dotCount = (raw.match(/\./g) || []).length;
    if (dotCount > 1) return;

    onChange(raw);
    const formatted = formatDisplay(raw, numberFormat);
    setDisplay(formatted);

    requestAnimationFrame(() => {
      if (inputRef.current) {
        const selStart = e.target.selectionStart ?? 0;
        const newPos = getNewCursor(selStart, formatted);
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    });
  }

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-monochrome-500 font-mono text-lg">
        {currencySymbol}
      </span>
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        className="input pl-9 pr-3 py-2.5 font-mono text-lg"
        placeholder="0"
        value={display}
        onChange={handleChange}
      />
    </div>
  );
}
