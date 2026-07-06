export interface JWTPayload {
  userId: string;
  email: string;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  locale: string;
  name: string;
}

export interface Insight {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "positive";
}

export interface GoalInsights {
  requiredMonthly: number;
  currentMonthlyRate: number;
  monthsRemaining: number;
  amountRemaining: number;
  percentComplete: number;
  etaDate: Date;
  onTrack: boolean;
  message: string;
}

export interface MemberBalance {
  userId: string;
  name: string;
  balance: number;
}

export interface ParsedTransaction {
  date: Date;
  amount: number;
  type: "income" | "expense";
  category: string;
  description: string;
}
