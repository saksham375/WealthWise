"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useFormatCurrency } from "@/hooks/use-format-currency";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  groupId: string;
  debtorId: string;
  debtorName: string;
  amount: number;
  currentUserId: string;
}

export default function SettleModal({ open, onClose, onSaved, groupId, debtorId, debtorName, amount, currentUserId }: Props) {
  const fmt = useFormatCurrency();
  const [settleAmount, setSettleAmount] = useState(Math.abs(amount).toString());
  const [method, setMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setSettleAmount(Math.abs(amount).toString());
      setMethod("cash");
      setError("");
      setLoading(false);
    }
  }, [open, amount]);

  useEffect(() => {
    if (!open) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  const isOwed = amount > 0;

  async function handleSettle() {
    if (!settleAmount) return;
    setLoading(true);
    setError("");

    try {
      const settlerUserId = isOwed ? debtorId : currentUserId;
      const receiverUserId = isOwed ? currentUserId : debtorId;

      const res = await fetch(`/api/groups/${groupId}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settlerUserId,
          receiverUserId,
          amount: parseFloat(settleAmount),
          method,
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
          <h3 className="text-lg font-semibold text-monochrome-900">Settle Up</h3>
          <button onClick={onClose} className="text-monochrome-400 hover:text-black">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-monochrome-600">
            {isOwed
              ? `${debtorName} owes you ${fmt(Math.abs(amount))}`
              : `You owe ${debtorName} ${fmt(Math.abs(amount))}`}
          </p>

          <div>
            <label className="label">Settlement Amount</label>
            <input
              type="number"
              className="input"
              value={settleAmount}
              onChange={(e) => setSettleAmount(e.target.value)}
              min={1}
            />
          </div>

          <div>
            <label className="label">Payment Method</label>
            <div className="flex gap-2">
              {["cash", "upi", "bank", "other"].map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`flex-1 px-2 py-1.5 text-xs rounded-md border capitalize transition-all duration-200 ${
                    method === m
                      ? "bg-monochrome-900 text-white border-monochrome-900"
                      : "border-monochrome-200 text-monochrome-600 hover:border-monochrome-300"
                  }`}
                  onClick={() => setMethod(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-monochrome-400">
            This is a record-only action — WealthWise does not process any actual payments.
          </p>

          {error && (
            <p className="text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700">{error}</p>
          )}

          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button
              className="btn-primary flex-1"
              onClick={handleSettle}
              disabled={!settleAmount || loading}
            >
              {loading ? "Processing..." : "Mark as Settled"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
