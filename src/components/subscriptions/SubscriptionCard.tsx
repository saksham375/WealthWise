"use client";

import { formatDistanceToNow, format } from "date-fns";
import { Pause, Play, Edit2, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useFormatCurrency } from "@/hooks/use-format-currency";

interface Subscription {
  id: string;
  serviceName: string;
  emoji: string;
  amount: number;
  billingCycle: string;
  nextDueDate: string;
  lastPaidDate: string | null;
  status: string;
}

interface Props {
  subscription: Subscription;
  onEdit: (sub: Subscription) => void;
  onRefresh: () => void;
}

export default function SubscriptionCard({ subscription, onEdit, onRefresh }: Props) {
  const fmt = useFormatCurrency();
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const s = subscription;
  const active = s.status === "ACTIVE";
  const nextDue = new Date(s.nextDueDate);
  const isOverdue = active && nextDue < new Date();

  function nextBillingLabel(): string {
    if (s.billingCycle === "monthly") return `Next: ${format(nextDue, "MMM d")}`;
    if (s.billingCycle === "yearly") return `Next: ${format(nextDue, "MMM d, yyyy")}`;
    return `Next: ${format(nextDue, "MMM d")}`;
  }

  async function handleToggle() {
    setToggling(true);
    try {
      await fetch(`/api/subscriptions/${s.id}/toggle-status`, { method: "PATCH" });
      onRefresh();
    } catch {} finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/subscriptions/${s.id}`, { method: "DELETE" });
      onRefresh();
    } catch {} finally {
      setDeleting(false);
    }
  }

  return (
    <div className={`card p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${!active ? "opacity-55" : ""}`}>
      <div className="h-1 w-full bg-gradient-to-r from-accent-400 to-accent-600 rounded-t-lg absolute top-0 left-0" />
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-monochrome-100 to-monochrome-200 flex items-center justify-center text-lg shrink-0">
          {s.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-monochrome-900 truncate">{s.serviceName}</p>
          <p className="text-[11px] text-monochrome-400 capitalize">
            {s.billingCycle}{" "}
            {isOverdue ? (
              <span className="text-red-500 font-medium">{formatDistanceToNow(nextDue, { addSuffix: true })} overdue</span>
            ) : (
              `· Next ${format(nextDue, "MMM d")}`
            )}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-base font-bold font-mono tab-nums text-monochrome-900">
            {fmt(s.amount)}
          </p>
          <p className="text-[10px] text-monochrome-400 font-medium">/{s.billingCycle === "yearly" ? "yr" : "mo"}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-monochrome-100">
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
          active ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
        }`}>
          {active ? "Active" : "Paused"}
        </span>
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
