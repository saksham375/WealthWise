"use client";

import { useState, useEffect } from "react";
import { X, ArrowDown, ArrowUp, Loader2, RefreshCw } from "lucide-react";
import AmountInput from "./AmountInput";
import CategoryPicker from "./CategoryPicker";
import Toggle from "@/components/ui/Toggle";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  timestamp: string;
  categoryId?: string;
  category: { name: string; iconName: string };
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  numberFormat?: "indian" | "standard";
  currencySymbol?: string;
  editTransaction?: Transaction | null;
}

function toLocalDatetimeString(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AddTransactionModal({ open, onClose, onSaved, numberFormat = "indian", currencySymbol = "₹", editTransaction }: Props) {
  const isEditing = !!editTransaction;
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [timestamp, setTimestamp] = useState(toLocalDatetimeString(new Date()));
  const [categoryId, setCategoryId] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState("monthly");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type as "expense" | "income");
      setAmount(editTransaction.amount.toString());
      setTimestamp(toLocalDatetimeString(new Date(editTransaction.timestamp)));
      setCategoryId(editTransaction.categoryId ?? "");
      setIsRecurring(false);
      setDescription(editTransaction.description || "");
    } else {
      setType("expense");
      setAmount("");
      setTimestamp(toLocalDatetimeString(new Date()));
      setCategoryId("");
      setIsRecurring(false);
      setRecurringFrequency("monthly");
      setDescription("");
    }
    setError("");
    setLoading(false);
  }, [editTransaction, open]);

  if (!open) return null;

  async function handleSubmit() {
    if (!amount || !categoryId) {
      setError("Amount and category are required");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const url = isEditing ? `/api/transactions/${editTransaction.id}` : "/api/transactions";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          type,
          categoryId,
          description: description.trim() || null,
          timestamp: new Date(timestamp).toISOString(),
          isRecurring,
          recurringFrequency: isRecurring ? recurringFrequency : undefined,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error || `Failed to ${isEditing ? "update" : "create"} transaction`);
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-monochrome-900">
            {isEditing ? "Edit Transaction" : "Add Transaction"}
          </h3>
          <button onClick={onClose} className="text-monochrome-400 hover:text-black">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Type toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setType("expense"); setCategoryId(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md border text-sm font-medium transition-all ${
                type === "expense"
                  ? "bg-black text-white border-black"
                  : "bg-white text-monochrome-600 border-monochrome-200 hover:border-monochrome-400"
              }`}
            >
              <ArrowDown size={16} />
              Expense
            </button>
            <button
              type="button"
              onClick={() => { setType("income"); setCategoryId(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md border text-sm font-medium transition-all ${
                type === "income"
                  ? "bg-black text-white border-black"
                  : "bg-white text-monochrome-600 border-monochrome-200 hover:border-monochrome-400"
              }`}
            >
              <ArrowUp size={16} />
              Income
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="label">Amount</label>
            <AmountInput
              value={amount}
              onChange={setAmount}
              numberFormat={numberFormat}
              currencySymbol={currencySymbol}
            />
          </div>

          {/* Date & Time */}
          <div>
            <label className="label">Date & Time</label>
            <input
              type="datetime-local"
              className="input"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
            />
          </div>

          {/* Category */}
          <div>
            <label className="label">Category</label>
            <CategoryPicker
              selectedId={categoryId}
              onSelect={setCategoryId}
              type={type}
            />
            {!categoryId && (
              <p className="text-xs text-monochrome-400 mt-1">Select or create a category</p>
            )}
          </div>

          {/* Recurring toggle */}
          {!isEditing && (
            <div className="pt-1">
              <Toggle
                checked={isRecurring}
                onChange={setIsRecurring}
                label="Recurring transaction"
                description="Repeats every month on the same date"
                icon={<RefreshCw size={14} className="text-monochrome-600" />}
                size="sm"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[60px] resize-none"
              placeholder="What was this for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm bg-monochrome-100 border border-monochrome-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button className="btn-secondary flex-1" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              onClick={handleSubmit}
              disabled={!amount || !categoryId || loading}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? (isEditing ? "Saving..." : "Adding...") : (isEditing ? "Save Changes" : "Add Transaction")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
