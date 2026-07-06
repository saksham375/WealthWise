import {
  UtensilsCrossed, ShoppingBag, Car, Home, Zap,
  Heart, BookOpen, Plane, Briefcase, Code2,
  TrendingUp, Trophy, Building2, Target, Dumbbell,
  Sparkles, Gift, CreditCard, Popcorn, MoreHorizontal,
  Gamepad2, PawPrint, Tv, Workflow, Dices,
  Wallet, Coffee, Music, Camera, Smartphone,
  RefreshCw, HelpCircle,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  UtensilsCrossed, ShoppingBag, Car, Home, Zap,
  Heart, BookOpen, Plane, Briefcase, Code2,
  TrendingUp, Trophy, Building2, Target, Dumbbell,
  Sparkles, Gift, CreditCard, Popcorn, MoreHorizontal,
  Gamepad2, PawPrint, Tv, Workflow, Dices,
  Wallet, Coffee, Music, Camera, Smartphone,
  RefreshCw, HelpCircle,
};

export function resolveIcon(name: string): LucideIcon {
  return iconMap[name] || HelpCircle;
}

export const AVAILABLE_ICONS = Object.keys(iconMap);
