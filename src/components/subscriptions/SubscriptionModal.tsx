"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

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
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  subscription?: Subscription | null;
}

const EMOJIS = ["📺", "🎵", "☁️", "📦", "▶️", "📰", "🎮", "💻", "📱", "🏋️", "📚", "🔁"];

export default function SubscriptionModal({ open, onClose, onSaved, subscription }: Props) {
  const [serviceName, setServiceName] = useState("");
  const [emoji, setEmoji] = useState("📺");
  const [amount, setAmount] = useState("");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [nextDueDate, setNextDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!subscription;

  useEffect(() => {
    if (subscription) {
      setServiceName(subscription.serviceName);
      setEmoji(subscription.emoji);
      setAmount(subscription.amount.toString());
      setBillingCycle(subscription.billingCycle);
      setNextDueDate(subscription.nextDueDate.split("T")[0]);
    } else {
      setServiceName("");
      setEmoji("📺");
      setAmount("");
      setBillingCycle("monthly");
      setNextDueDate("");
    }
    setError("");
  }, [subscription, open]);

  if (!open) return null;

  async function handleSave() {
    if (!serviceName || !amount || !nextDueDate) return;
    setLoading(true);
    setError("");

    try {
      const body = {
        serviceName,
        emoji,
        amount: parseFloat(amount),
        billingCycle,
        nextDueDate,
      };

      const res = isEdit
        ? await fetch(`/api/subscriptions/${subscription!.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/subscriptions", {
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
            {isEdit ? "Edit Subscription" : "Add Subscription"}
          </h3>
          <button onClick={onClose} className="text-monochrome-400 hover:text-black">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Service Name</label>
            <input className="input" placeholder="Netflix" value={serviceName} onChange={(e) => setServiceName(e.target.value)} />
          </div>

          <div>
            <label className="label">Icon</label>
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
              <label className="label">Amount</label>
              <input type="number" className="input" placeholder="649" value={amount} onChange={(e) => setAmount(e.target.value)} min={1} />
            </div>
            <div>
              <label className="label">Billing Cycle</label>
              <select className="input" value={billingCycle} onChange={(e) => setBillingCycle(e.target.value)}>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Next Due Date</label>
            <input type="date" className="input" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} />
          </div>

          {error && (
            <p className="text-sm bg-monochrome-100 border border-monochrome-200 rounded-md px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button className="btn-primary flex-1" onClick={handleSave} disabled={!serviceName || !amount || !nextDueDate || loading}>
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Add Subscription"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
