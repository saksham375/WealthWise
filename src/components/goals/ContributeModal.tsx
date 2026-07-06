"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onContributed: () => void;
  goalId: string;
  goalName: string;
}

export default function ContributeModal({ open, onClose, onContributed, goalId, goalName }: Props) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setAmount("");
      setNote("");
      setError("");
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  async function handleContribute() {
    if (!amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/goals/${goalId}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(amount), note: note || undefined }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error);
        return;
      }

      onContributed();
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
          <h3 className="text-lg font-semibold text-monochrome-900">Add Money — {goalName}</h3>
          <button onClick={onClose} className="text-monochrome-400 hover:text-black">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Amount</label>
            <input type="number" className="input" placeholder="5000" value={amount} onChange={(e) => setAmount(e.target.value)} min={1} />
          </div>

          <div>
            <label className="label">Note (optional)</label>
            <input className="input" placeholder="Monthly contribution" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          {error && (
            <p className="text-sm bg-monochrome-100 border border-monochrome-200 rounded-md px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button className="btn-primary flex-1" onClick={handleContribute} disabled={!amount || loading}>
              {loading ? "Adding..." : "Add Money"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
