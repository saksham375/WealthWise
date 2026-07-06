import { create } from "zustand";

interface AnalyticsFilters {
  months: number;
  setMonths: (months: number) => void;
}

export const useAnalyticsStore = create<AnalyticsFilters>((set) => ({
  months: 1,
  setMonths: (months) => set({ months }),
}));
