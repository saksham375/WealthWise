"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  categories: { id: string; name: string; iconName: string }[];
  editBudget?: { id: string; categoryId: string; limitAmount: number };
}

export default function BudgetModal({ open, onClose, onSaved, categories, editBudget }: Props) {
  const [categoryId, setCategoryId] = useState(editBudget?.categoryId ?? "");
  const [limitAmount, setLimitAmount] = useState(editBudget?.limitAmount?.toString() ?? "");
  const [applyEveryMonth, setApplyEveryMonth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setCategoryId(editBudget?.categoryId ?? "");
      setLimitAmount(editBudget?.limitAmount?.toString() ?? "");
      setApplyEveryMonth(false);
      setError("");
      setLoading(false);
    }
  }, [open, editBudget]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSave() {
    if (!categoryId || !limitAmount) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(editBudget ? `/api/budgets/${editBudget.id}` : "/api/budgets", {
        method: editBudget ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, limitAmount: parseFloat(limitAmount), applyEveryMonth }),
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
            {editBudget ? "Edit Budget" : "Create Budget"}
          </h3>
          <button onClick={onClose} className="text-monochrome-400 hover:text-black">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Category</label>
            <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Monthly Limit</label>
            <input
              type="number"
              className="input"
              placeholder="5000"
              value={limitAmount}
              onChange={(e) => setLimitAmount(e.target.value)}
              min={1}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="border-monochrome-300 rounded-md"
              checked={applyEveryMonth}
              onChange={(e) => setApplyEveryMonth(e.target.checked)}
            />
            <span className="text-sm text-monochrome-600">Apply every month from now on</span>
          </label>

          {error && (
            <p className="text-sm bg-monochrome-100 border border-monochrome-200 rounded-md px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button
              className="btn-primary flex-1"
              onClick={handleSave}
              disabled={!categoryId || !limitAmount || loading}
            >
              {loading ? "Saving..." : editBudget ? "Update" : "Save Budget"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
