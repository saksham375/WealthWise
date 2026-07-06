"use client";

import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useToastStore } from "@/store/toastStore";

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const colors = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  info: "bg-monochrome-50 border-monochrome-200 text-monochrome-800",
};

const iconColors = {
  success: "text-green-600",
  error: "text-red-600",
  info: "text-monochrome-600",
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const startDismiss = useToastStore((s) => s.startDismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border shadow-dropdown text-sm font-medium pointer-events-auto transition-all duration-300 ${
              toast.dismissing ? "opacity-0 translate-y-2 scale-95" : "animate-slide-up"
            } ${colors[toast.type]}`}
          >
            <Icon size={16} className={iconColors[toast.type]} />
            <span>{toast.message}</span>
            {toast.action && (
              <button
                className="underline font-semibold hover:opacity-70"
                onClick={() => { toast.action?.onClick(); startDismiss(toast.id); }}
              >
                {toast.action.label}
              </button>
            )}
            <button
              className="ml-1 opacity-50 hover:opacity-100"
              onClick={() => startDismiss(toast.id)}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
