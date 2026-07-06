"use client";

import { useState, useEffect } from "react";
import { X, ArrowDown, ArrowUp } from "lucide-react";
import CategoryPicker from "@/components/transactions/CategoryPicker";

interface RecurringSchedule {
  id: string;
  templateTitle: string;
  amount: number;
  type: string;
  categoryId: string;
  frequency: string;
  nextRunDate: string;
  isActive: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  schedule?: RecurringSchedule | null;
}

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export default function RecurringModal({ open, onClose, onSaved, schedule }: Props) {
  const [type, setType] = useState<"expense" | "income">("expense");
  const [templateTitle, setTemplateTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [nextRunDate, setNextRunDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!schedule;

  useEffect(() => {
    if (schedule) {
      setType(schedule.type as "expense" | "income");
      setTemplateTitle(schedule.templateTitle);
      setAmount(schedule.amount.toString());
      setCategoryId(schedule.categoryId);
      setFrequency(schedule.frequency);
      setNextRunDate(schedule.nextRunDate.split("T")[0]);
    } else {
      setType("expense");
      setTemplateTitle("");
      setAmount("");
      setCategoryId("");
      setFrequency("monthly");
      setNextRunDate("");
    }
    setError("");
  }, [schedule, open]);

  if (!open) return null;

  async function handleSave() {
    if (!templateTitle || !amount || !categoryId || !nextRunDate) return;
    setLoading(true);
    setError("");

    try {
      const body = {
        templateTitle: templateTitle.trim(),
        amount: parseFloat(amount),
        type,
        categoryId,
        frequency,
        nextRunDate,
      };

      const res = isEdit
        ? await fetch(`/api/recurring/${schedule!.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/recurring", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error);
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-monochrome-900">
            {isEdit ? "Edit Recurring Transaction" : "Add Recurring Transaction"}
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

          {/* Title */}
          <div>
            <label className="label">Title</label>
            <input
              className="input"
              placeholder="Rent, Salary, Gym membership..."
              value={templateTitle}
              onChange={(e) => setTemplateTitle(e.target.value)}
            />
          </div>

          {/* Amount + Frequency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount</label>
              <input
                type="number"
                className="input"
                placeholder="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={1}
              />
            </div>
            <div>
              <label className="label">Frequency</label>
              <select
                className="input"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
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
              <p className="text-xs text-monochrome-400 mt-1">Select a category</p>
            )}
          </div>

          {/* Next Run Date */}
          <div>
            <label className="label">Next Occurrence</label>
            <input
              type="date"
              className="input"
              value={nextRunDate}
              onChange={(e) => setNextRunDate(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm bg-monochrome-100 border border-monochrome-200 rounded-md px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button
              className="btn-primary flex-1"
              onClick={handleSave}
              disabled={!templateTitle || !amount || !categoryId || !nextRunDate || loading}
            >
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Add Schedule"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
