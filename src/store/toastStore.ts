import { create } from "zustand";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  action?: { label: string; onClick: () => void };
  dismissing?: boolean;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  startDismiss: (id: string) => void;
}

let nextId = 0;
const timeouts = new Map<string, ReturnType<typeof setTimeout>>();

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = String(++nextId);
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    const timeout = setTimeout(() => {
      set((s) => ({
        toasts: s.toasts.map((t) => (t.id === id ? { ...t, dismissing: true } : t)),
      }));
      const removeTimeout = setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
        timeouts.delete(id);
      }, 300);
      timeouts.set(id + "-remove", removeTimeout);
      timeouts.delete(id);
    }, 4500);
    timeouts.set(id, timeout);
  },
  startDismiss: (id) => {
    set((s) => ({
      toasts: s.toasts.map((t) => (t.id === id ? { ...t, dismissing: true } : t)),
    }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 300);
  },
  removeToast: (id) => {
    const timeout = timeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeouts.delete(id);
    }
    const removeTimeout = timeouts.get(id + "-remove");
    if (removeTimeout) {
      clearTimeout(removeTimeout);
      timeouts.delete(id + "-remove");
    }
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));
