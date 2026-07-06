"use client";

import { useEffect, useState, useMemo } from "react";
import { resolveIcon } from "@/lib/category-icons";
import { Plus, X, Check } from "lucide-react";

interface Category {
  id: string;
  name: string;
  type: string;
  iconName: string;
  color: string;
  isSystem: boolean;
}

interface Props {
  selectedId: string;
  onSelect: (id: string) => void;
  type: "income" | "expense";
}

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

let categoriesCache: Category[] | null = null;

export default function CategoryPicker({ selectedId, onSelect, type }: Props) {
  const [categories, setCategories] = useState<Category[]>(categoriesCache ?? []);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("MoreHorizontal");
  const [newColor, setNewColor] = useState("#737373");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (categoriesCache) return;
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        const cats = Array.isArray(data) ? data : [];
        categoriesCache = cats;
        setCategories(cats);
      });
  }, []);

  const filtered = useMemo(() => categories.filter((c) => c.type === type), [categories, type]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), type, iconName: newIcon, color: newColor }),
      });
      if (!res.ok) return;
      const created: Category = await res.json();
      setCategories((prev) => [...prev, created]);
      onSelect(created.id);
      setShowCreate(false);
      setNewName("");
      setNewIcon("MoreHorizontal");
      setNewColor("#737373");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {filtered.map((cat) => {
          const Icon = resolveIcon(cat.iconName);
          const isSelected = cat.id === selectedId;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelect(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                isSelected
                  ? "bg-black text-white border-black"
                  : "bg-white text-monochrome-700 border-monochrome-200 hover:border-monochrome-400"
              }`}
            >
              <Icon size={14} style={{ color: isSelected ? "#fff" : cat.color }} />
              {cat.name}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-monochrome-300 text-monochrome-500 hover:text-black hover:border-monochrome-500 transition-all"
        >
          {showCreate ? <X size={14} /> : <Plus size={14} />}
          Create New
        </button>
      </div>

      {showCreate && (
        <div className="border border-monochrome-200 rounded-lg p-4 space-y-3 animate-fade-in">
          <div>
            <label className="label">Category Name</label>
            <input
              className="input"
              placeholder="e.g. Coffee"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Icon</label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {ICON_GRID.map((name) => {
                const Icon = resolveIcon(name);
                const isActive = newIcon === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setNewIcon(name)}
                    className={`p-1.5 rounded-md border transition-all ${
                      isActive
                        ? "bg-black text-white border-black"
                        : "bg-white text-monochrome-600 border-monochrome-200 hover:border-monochrome-400"
                    }`}
                  >
                    <Icon size={16} />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label">Color</label>
            <div className="flex gap-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    newColor === c ? "border-black scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {newColor === c && <Check size={14} className="text-white mx-auto" />}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="btn-primary w-full text-xs flex items-center justify-center gap-1"
            onClick={handleCreate}
            disabled={!newName.trim() || creating}
          >
            {creating ? "Creating..." : "Create Category"}
          </button>
        </div>
      )}
    </div>
  );
}
