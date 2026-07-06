"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useFormatCurrency } from "@/hooks/use-format-currency";

interface Member {
  userId: string;
  name: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  groupId: string;
  members: Member[];
  currentUserId: string;
}

export default function AddExpenseModal({ open, onClose, onSaved, groupId, members, currentUserId }: Props) {
  const fmt = useFormatCurrency();
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [payerId, setPayerId] = useState(currentUserId);
  const [splitMethod, setSplitMethod] = useState<"equal" | "percentage">("equal");
  const [percentages, setPercentages] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setDescription("");
      setTotalAmount("");
      setPayerId(currentUserId);
      setSplitMethod("equal");
      setPercentages({});
      setError("");
      setLoading(false);
    }
  }, [open, currentUserId]);

  useEffect(() => {
    if (!open) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  const selectedMembers = members;
  const equalAmount = selectedMembers.length > 0
    ? Math.round((parseFloat(totalAmount || "0") / selectedMembers.length) * 100) / 100
    : 0;
  const remainder = parseFloat(totalAmount || "0") - equalAmount * (selectedMembers.length - 1);

  const totalPercentage = Object.values(percentages).reduce((s, p) => s + (p || 0), 0);
  const percentageValid = Math.abs(totalPercentage - 100) < 0.01;

  async function handleSave() {
    if (!description || !totalAmount) return;
    setLoading(true);
    setError("");

    let splits: { userId: string; amount: number; percentage?: number }[];

    if (splitMethod === "equal") {
      splits = selectedMembers.map((m, i) => ({
        userId: m.userId,
        amount: i === selectedMembers.length - 1 ? remainder : equalAmount,
      }));
    } else {
      if (!percentageValid) {
        setError("Percentages must total 100%");
        setLoading(false);
        return;
      }
      splits = selectedMembers.map((m) => ({
        userId: m.userId,
        amount: Math.round((parseFloat(totalAmount) * (percentages[m.userId] || 0)) / 100 * 100) / 100,
        percentage: percentages[m.userId] || 0,
      }));
    }

    try {
      const res = await fetch(`/api/groups/${groupId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          totalAmount: parseFloat(totalAmount),
          payerId,
          splitMethod,
          splits,
        }),
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
          <h3 className="text-lg font-semibold text-monochrome-900">Add Group Expense</h3>
          <button onClick={onClose} className="text-monochrome-400 hover:text-black">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Description</label>
            <input
              className="input"
              placeholder="Monthly Groceries"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Total Amount</label>
            <input
              type="number"
              className="input"
              placeholder="0"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              min={1}
            />
          </div>

          <div>
            <label className="label">Paid by</label>
            <select className="input" value={payerId} onChange={(e) => setPayerId(e.target.value)}>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name}{m.userId === currentUserId ? " (you)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Split Method</label>
            <div className="flex gap-2">
              <button
                type="button"
                className={`flex-1 px-3 py-2 text-sm rounded-md border transition-all duration-200 ${
                  splitMethod === "equal"
                    ? "bg-monochrome-900 text-white border-monochrome-900"
                    : "border-monochrome-200 text-monochrome-600 hover:border-monochrome-300"
                }`}
                onClick={() => setSplitMethod("equal")}
              >
                Equal Split
              </button>
              <button
                type="button"
                className={`flex-1 px-3 py-2 text-sm rounded-md border transition-all duration-200 ${
                  splitMethod === "percentage"
                    ? "bg-monochrome-900 text-white border-monochrome-900"
                    : "border-monochrome-200 text-monochrome-600 hover:border-monochrome-300"
                }`}
                onClick={() => setSplitMethod("percentage")}
              >
                Percentage Split
              </button>
            </div>
          </div>

          <div>
            <label className="label">
              {splitMethod === "equal"
                ? `Equal Split — ${fmt(equalAmount)} each (${selectedMembers.length} members)`
                : "Percentage Split"}
            </label>
            <div className="space-y-1.5">
              {selectedMembers.map((m) => (
                <div key={m.userId} className="flex items-center gap-2">
                  <span className="text-sm text-monochrome-700 w-28 truncate">{m.name}</span>
                  {splitMethod === "equal" ? (
                    <span className="text-sm font-mono text-monochrome-600">
                      {fmt(m.userId === selectedMembers[selectedMembers.length - 1].userId ? remainder : equalAmount)}
                    </span>
                  ) : (
                    <input
                      type="number"
                      className="input w-20 text-center"
                      placeholder="%"
                      min={0}
                      max={100}
                      value={percentages[m.userId] ?? ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setPercentages((prev) => ({ ...prev, [m.userId]: val }));
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
            {splitMethod === "percentage" && (
              <p className={`text-xs mt-1 ${percentageValid ? "text-monochrome-400" : "text-red-600 font-medium"}`}>
                Total: {totalPercentage}% {percentageValid ? "✓" : "— must equal 100%"}
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700">{error}</p>
          )}

          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button
              className="btn-primary flex-1"
              onClick={handleSave}
              disabled={!description || !totalAmount || loading}
            >
              {loading ? "Adding..." : "Add Expense"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
