"use client";

import { useState } from "react";
import { Plus, Check, Loader2, Layers } from "lucide-react";
import { resolveIcon } from "@/lib/category-icons";

const ICON_GRID = [
  "UtensilsCrossed", "ShoppingBag", "Car", "Home", "Zap",
  "Heart", "Briefcase", "Code2", "TrendingUp", "Target",
  "Dumbbell", "Sparkles", "Gift", "CreditCard", "Popcorn",
  "Gamepad2", "PawPrint", "Coffee", "Music", "Wallet",
  "Plane", "BookOpen", "Smartphone", "Tv", "Camera",
  "Building2", "Trophy", "RefreshCw", "Workflow", "MoreHorizontal",
];

const COLOR_PALETTE = [
  "#000000", "#171717", "#262626", "#404040",
  "#525252", "#737373", "#A3A3A3", "#D4D4D4",
];

export default function CategoryManager() {
  const [type, setType] = useState<"expense" | "income">("expense");
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("MoreHorizontal");
  const [color, setColor] = useState("#737373");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    setMessage("");
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), type, iconName: icon, color }),
      });
      if (res.ok) {
        setMessage(`"${name.trim()}" created`);
        setName("");
        setIcon("MoreHorizontal");
        setColor("#737373");
        setTimeout(() => setMessage(""), 3000);
      } else {
        const d = await res.json();
        setMessage(d.error || "Failed to create category");
      }
    } catch {
      setMessage("Connection error");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="bento-card">
      <div className="flex items-center gap-3 pb-3 border-b border-monochrome-100">
        <div className="w-8 h-8 rounded-full bg-monochrome-100 flex items-center justify-center">
          <Layers size={16} className="text-monochrome-700" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-monochrome-900">Add Custom Category</h2>
          <p className="text-xs text-monochrome-400">Create a new transaction category</p>
        </div>
      </div>

      {/* Type + Name section */}
      <div className="p-3 rounded-lg border border-monochrome-100 bg-monochrome-50/50 space-y-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={`flex-1 py-1.5 rounded-md border text-xs font-medium transition-all ${
              type === "expense"
                ? "bg-black text-white border-black"
                : "bg-white text-monochrome-600 border-monochrome-200"
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={`flex-1 py-1.5 rounded-md border text-xs font-medium transition-all ${
              type === "income"
                ? "bg-black text-white border-black"
                : "bg-white text-monochrome-600 border-monochrome-200"
            }`}
          >
            Income
          </button>
        </div>
        <div>
          <label className="label">Category Name</label>
          <input
            className="input"
            placeholder="e.g. Freelance"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </div>

      {/* Icon + Color grid */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Icon</label>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 border border-monochrome-200 rounded-md">
            {ICON_GRID.map((name) => {
              const Icon = resolveIcon(name);
              const isActive = icon === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setIcon(name)}
                  className={`p-1 rounded-md border transition-all ${
                    isActive
                      ? "bg-black text-white border-black"
                      : "bg-white text-monochrome-600 border-transparent hover:border-monochrome-300"
                  }`}
                >
                  <Icon size={14} />
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="label">Color</label>
          <div className="flex flex-wrap gap-1.5">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  color === c ? "border-black scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              >
                {color === c && <Check size={12} className="text-white mx-auto" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {message && (
        <p className="text-xs bg-monochrome-100 border border-monochrome-200 rounded-md px-3 py-2">{message}</p>
      )}

      <div className="flex justify-end">
        <button
          className="btn-primary text-xs flex items-center gap-1"
          onClick={handleCreate}
          disabled={!name.trim() || creating}
        >
          {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          {creating ? "Creating..." : "Create Category"}
        </button>
      </div>
    </div>
  );
}
