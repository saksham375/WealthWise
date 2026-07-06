"use client";

import { format, formatDistanceToNow } from "date-fns";
import { Pause, Play, Edit2, Trash2, Loader2, ArrowDown, ArrowUp } from "lucide-react";
import { useState } from "react";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import type { RecurringScheduleWithStats } from "@/types/api";

interface Props {
  schedule: RecurringScheduleWithStats;
  onEdit: (s: RecurringScheduleWithStats) => void;
  onRefresh: () => void;
}

export default function RecurringCard({ schedule, onEdit, onRefresh }: Props) {
  const fmt = useFormatCurrency();
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const s = schedule;
  const active = s.isActive;
  const isExpense = s.type === "expense";
  const nextRun = new Date(s.nextRunDate);
  const isOverdue = active && nextRun < new Date();

  const frequencyLabel: Record<string, string> = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    yearly: "Yearly",
  };

  async function handleToggle() {
    setToggling(true);
    try {
      await fetch(`/api/recurring/${s.id}/toggle-status`, { method: "PATCH" });
      onRefresh();
    } catch {} finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/recurring/${s.id}`, { method: "DELETE" });
      onRefresh();
    } catch {} finally {
      setDeleting(false);
    }
  }

  return (
    <div className={`card p-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${!active ? "opacity-55" : ""}`}>
      <div className={`h-1 w-full bg-gradient-to-r rounded-t-lg absolute top-0 left-0 ${isExpense ? "from-amber-400 to-amber-600" : "from-green-400 to-green-600"}`} />
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-monochrome-100 to-monochrome-200 flex items-center justify-center text-lg shrink-0">
          {isExpense ? <ArrowDown size={16} className="text-amber-600" /> : <ArrowUp size={16} className="text-green-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-monochrome-900 truncate">{s.templateTitle}</p>
          <p className="text-[11px] text-monochrome-400">
            {frequencyLabel[s.frequency] ?? s.frequency}
            {isOverdue ? (
              <span className="text-red-500 font-medium ml-1">
                {formatDistanceToNow(nextRun, { addSuffix: true })} overdue
              </span>
            ) : (
              <> &middot; Next {format(nextRun, "MMM d")}</>
            )}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-base font-bold font-mono tab-nums text-monochrome-900">
            {fmt(s.amount)}
          </p>
          <p className="text-[10px] text-monochrome-400 font-medium capitalize">{s.type}</p>
        </div>
      </div>

      {s.lastRunDate && (
        <p className="text-[10px] text-monochrome-400 mt-2">
          Last run: {format(new Date(s.lastRunDate), "MMM d, yyyy")}
          {s.transactionCount > 0 && <> &middot; {s.transactionCount} occurrence{s.transactionCount > 1 ? "s" : ""}</>}
        </p>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-monochrome-100">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
            active ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
          }`}>
            {active ? "Active" : "Paused"}
          </span>
          <span className="text-[10px] text-monochrome-400 px-1.5 py-0.5 bg-monochrome-100 rounded-full">
            {s.category?.name ?? "Uncategorized"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="btn-icon"
            onClick={handleToggle}
            disabled={toggling}
            title={active ? "Pause" : "Resume"}
          >
            {toggling ? <Loader2 size={13} className="animate-spin" /> : active ? <Pause size={13} /> : <Play size={13} />}
          </button>
          <button
            className="btn-icon"
            onClick={() => onEdit(s)}
            title="Edit"
          >
            <Edit2 size={13} />
          </button>
          <button
            className="btn-icon"
            onClick={handleDelete}
            disabled={deleting}
            title="Delete"
          >
            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          </button>
        </div>
      </div>
    </div>
  );
}
