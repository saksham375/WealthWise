"use client";

import React from "react";
import { format } from "date-fns";
import { Pencil, Trash2, X, Check } from "lucide-react";
import { resolveIcon } from "@/lib/category-icons";
import { getCategoryColor } from "@/lib/category-colors";
import { useFormatCurrency } from "@/hooks/use-format-currency";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  timestamp: string;
  category: { name: string; iconName: string };
}

interface TransactionRowProps {
  tx: Transaction;
  isOpen: boolean;
  deleteConfirmId: string | null;
  onRowClick: (id: string) => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onDeleteConfirm: (id: string | null) => void;
}

function TransactionRowInner({
  tx,
  isOpen,
  deleteConfirmId,
  onRowClick,
  onEdit,
  onDelete,
  onDeleteConfirm,
}: TransactionRowProps) {
  const fmt = useFormatCurrency();
  const color = getCategoryColor(tx.category.name);
  const txDate = new Date(tx.timestamp);
  const Icon = resolveIcon(tx.category.iconName);
  const prefix = tx.type === "income" ? "+" : "-";

  return (
    <div
      className={`group rounded-xl transition-all duration-300 cursor-pointer ${
        isOpen
          ? "bg-white shadow-md ring-1 ring-monochrome-200/60"
          : "bg-white/60 hover:bg-white hover:shadow-md hover:-translate-y-0.5 hover:ring-1 hover:ring-monochrome-200/40"
      }`}
      onClick={() => onRowClick(tx.id)}
    >
      {/* Main row */}
      <div className="flex items-center gap-3.5 px-4 py-3.5">
        {/* Category icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${color.bg}, ${color.bg}dd)`,
            color: color.icon,
            boxShadow: `0 2px 8px ${color.bg}40`,
          }}
        >
          <Icon size={18} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-monochrome-900 truncate leading-tight">
            {tx.description || tx.category.name}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="text-[11px] font-medium px-1.5 py-0.5 rounded-md"
              style={{
                background: `${color.bg}15`,
                color: color.icon === "#ffffff" ? color.bg : color.icon,
              }}
            >
              {tx.category.name}
            </span>
            <span className="text-[11px] text-monochrome-400">
              {format(txDate, "h:mm a")}
            </span>
          </div>
        </div>

        {/* Amount */}
        <div className="text-right shrink-0">
          <p
            className={`font-mono tab-nums text-base font-bold leading-tight ${
              tx.type === "income" ? "text-green-600" : "text-red-500"
            }`}
          >
            {prefix}{fmt(tx.amount)}
          </p>
          <p className="text-[10px] text-monochrome-400 mt-0.5 font-medium">
            {format(txDate, "MMM d")}
          </p>
        </div>
      </div>

      {/* Expandable detail panel */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: isOpen ? "1fr" : "0fr",
          transition: "grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4">
            <div className="bg-monochrome-50/80 rounded-xl border border-monochrome-100 p-4 space-y-3">
              {/* Detail grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-medium text-monochrome-400 uppercase tracking-wider">Amount</span>
                  <p className={`font-mono tab-nums text-sm font-bold ${tx.type === "income" ? "text-green-600" : "text-red-500"}`}>
                    {prefix}{fmt(tx.amount)}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-medium text-monochrome-400 uppercase tracking-wider">Date</span>
                  <p className="text-sm font-semibold text-monochrome-800">{format(txDate, "MMM d, yyyy")}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-medium text-monochrome-400 uppercase tracking-wider">Time</span>
                  <p className="text-sm font-semibold text-monochrome-800">{format(txDate, "h:mm a")}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-medium text-monochrome-400 uppercase tracking-wider">Category</span>
                  <p className="text-sm font-semibold text-monochrome-800">{tx.category.name}</p>
                </div>
              </div>

              {/* Note */}
              <div className="space-y-0.5">
                <span className="text-[10px] font-medium text-monochrome-400 uppercase tracking-wider">Note</span>
                <p className="text-sm font-medium text-monochrome-700">{tx.description || tx.category.name}</p>
              </div>

              {/* Divider */}
              <div className="border-t border-monochrome-200/60" />

              {/* Actions */}
              <div className="flex items-center justify-between">
                {deleteConfirmId === tx.id ? (
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-xs text-monochrome-500 flex-1">Delete this transaction?</span>
                    <button
                      className="flex items-center gap-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors"
                      onClick={(e) => { e.stopPropagation(); onDelete(tx.id); }}
                    >
                      <Check size={12} /> Yes
                    </button>
                    <button
                      className="flex items-center gap-1.5 text-xs font-semibold text-monochrome-600 bg-monochrome-100 hover:bg-monochrome-200 px-3 py-1.5 rounded-lg transition-colors"
                      onClick={(e) => { e.stopPropagation(); onDeleteConfirm(null); }}
                    >
                      <X size={12} /> No
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      className="flex items-center gap-1.5 text-xs font-semibold text-monochrome-500 hover:text-accent-600 bg-monochrome-100 hover:bg-accent-50 px-3 py-1.5 rounded-lg transition-all duration-200"
                      onClick={(e) => { e.stopPropagation(); onEdit(tx); }}
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      className="flex items-center gap-1.5 text-xs font-semibold text-monochrome-500 hover:text-red-600 bg-monochrome-100 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all duration-200"
                      onClick={(e) => { e.stopPropagation(); onDeleteConfirm(tx.id); }}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const TransactionRow = React.memo(TransactionRowInner);
