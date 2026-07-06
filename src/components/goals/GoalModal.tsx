"use client";

import { useState, useMemo, useEffect } from "react";
import { X } from "lucide-react";
import { format, differenceInMonths } from "date-fns";

const EMOJIS = ["🏖️", "🏠", "🚗", "💻", "✈️", "💍", "🎓", "🏋️", "💰", "🎯"];

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editGoal?: { id: string; goalName: string; emoji: string; targetAmount: number; currentSaved: number; deadline: string };
}

export default function GoalModal({ open, onClose, onSaved, editGoal }: Props) {
  const [goalName, setGoalName] = useState(editGoal?.goalName ?? "");
  const [emoji, setEmoji] = useState(editGoal?.emoji ?? "🎯");
  const [targetAmount, setTargetAmount] = useState(editGoal?.targetAmount?.toString() ?? "");
  const [currentSaved, setCurrentSaved] = useState(editGoal?.currentSaved?.toString() ?? "0");
  const [deadline, setDeadline] = useState(
    editGoal?.deadline ? format(new Date(editGoal.deadline), "yyyy-MM") : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setGoalName(editGoal?.goalName ?? "");
      setEmoji(editGoal?.emoji ?? "🎯");
      setTargetAmount(editGoal?.targetAmount?.toString() ?? "");
      setCurrentSaved(editGoal?.currentSaved?.toString() ?? "0");
      setDeadline(editGoal?.deadline ? format(new Date(editGoal.deadline), "yyyy-MM") : "");
      setError("");
      setLoading(false);
    }
  }, [open, editGoal]);

  const preview = useMemo(() => {
    if (!targetAmount || !deadline) return null;
    const target = parseFloat(targetAmount);
    const saved = parseFloat(currentSaved || "0");
    const monthsRemaining = Math.max(1, differenceInMonths(new Date(deadline + "-01"), new Date()));
    const required = Math.round((target - saved) / monthsRemaining);
    return { required, monthsRemaining };
  }, [targetAmount, currentSaved, deadline]);

  if (!open) return null;

  async function handleSave() {
    if (!goalName || !targetAmount || !deadline) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(editGoal ? `/api/goals/${editGoal.id}` : "/api/goals", {
        method: editGoal ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalName,
          emoji,
          targetAmount: parseFloat(targetAmount),
          currentSaved: parseFloat(currentSaved || "0"),
          deadline: deadline + "-01",
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
          <h3 className="text-lg font-semibold text-monochrome-900">
            {editGoal ? "Edit Goal" : "Create New Goal"}
          </h3>
          <button onClick={onClose} className="text-monochrome-400 hover:text-black">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Goal Name</label>
            <input className="input" placeholder="Vacation Fund — Goa Trip" value={goalName} onChange={(e) => setGoalName(e.target.value)} />
          </div>

          <div>
            <label className="label">Emoji Icon</label>
            <div className="flex gap-1 flex-wrap">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  className={`w-9 h-9 rounded-md text-lg flex items-center justify-center border transition-colors ${
                    emoji === e ? "border-black bg-black/5" : "border-monochrome-200 hover:bg-monochrome-100"
                  }`}
                  onClick={() => setEmoji(e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Target Amount</label>
              <input type="number" className="input" placeholder="50000" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} min={1} />
            </div>
            <div>
              <label className="label">Current Saved</label>
              <input type="number" className="input" placeholder="0" value={currentSaved} onChange={(e) => setCurrentSaved(e.target.value)} min={0} />
            </div>
          </div>

          <div>
            <label className="label">Target Deadline</label>
            <input type="month" className="input" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>

          {preview && (
            <div className="bg-monochrome-100 rounded-md px-3 py-2 text-sm text-monochrome-700">
              You need to save <strong>₹{preview.required.toLocaleString()}</strong>/month to reach ₹{parseFloat(targetAmount).toLocaleString()} in {preview.monthsRemaining} month{preview.monthsRemaining > 1 ? "s" : ""}.
            </div>
          )}

          {error && (
            <p className="text-sm bg-monochrome-100 border border-monochrome-200 rounded-md px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button className="btn-primary flex-1" onClick={handleSave} disabled={!goalName || !targetAmount || !deadline || loading}>
              {loading ? "Saving..." : editGoal ? "Update" : "Create Goal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
