import { create } from "zustand";

interface UserState {
  currencyCode: string;
  showCents: boolean;
  numberFormat: string;
  setPreferences: (prefs: { currencyCode?: string; showCents?: boolean; numberFormat?: string }) => void;
}

export const useUserStore = create<UserState>((set) => ({
  currencyCode: "INR",
  showCents: true,
  numberFormat: "indian",
  setPreferences: (prefs) => set(prefs),
}));
