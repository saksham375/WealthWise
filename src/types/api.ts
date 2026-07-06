import type { Prisma } from "@prisma/client";

// --- Generic API response types ---

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

export interface PaginatedData<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

// --- Prisma-derived entity types ---

export type UserProfile = Prisma.UserGetPayload<{
  select: {
    id: true;
    email: true;
    name: true;
    age: true;
    gender: true;
    avatarPath: true;
    currencyCode: true;
    showCents: true;
    numberFormat: true;
    createdAt: true;
  };
}>;

export type SubscriptionWithMeta = Prisma.SubscriptionGetPayload<{
  select: {
    id: true;
    serviceName: true;
    emoji: true;
    amount: true;
    billingCycle: true;
    nextDueDate: true;
    lastPaidDate: true;
    status: true;
  };
}>;

export interface BudgetWithSpent {
  id: string;
  categoryId: string;
  categoryName: string;
  iconName: string;
  limitAmount: number;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
}

export interface GoalWithContributions {
  id: string;
  goalName: string;
  emoji: string;
  targetAmount: number;
  currentSaved: number;
  deadline: string;
  isCompleted: boolean;
  contributions: { amount: number; createdAt: string }[];
}

export interface TransactionWithCategory {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  timestamp: string;
  category: { name: string; iconName: string };
}

// --- Analytics types ---

export interface CategoryBreakdown {
  name: string;
  value: number;
  percentage: number;
}

export interface IncomeVsExpense {
  month: string;
  income: number;
  expense: number;
}

export interface SpendingTrend {
  date: string;
  amount: number;
}

export interface HeatmapDay {
  date: string;
  amount: number;
  count: number;
}

// --- Recurring Schedule types ---

export interface RecurringScheduleWithStats {
  id: string;
  userId: string;
  templateTitle: string;
  amount: number;
  type: string;
  categoryId: string;
  frequency: string;
  nextRunDate: string;
  isActive: boolean;
  createdAt: string;
  transactionCount: number;
  lastRunDate: string | null;
  lastRunAmount: number | null;
  category: { name: string; iconName: string; color: string };
}

// --- Calendar types ---

export interface CalendarEvent {
  id: string;
  type: "transaction" | "subscription" | "recurring" | "goal_deadline";
  title: string;
  amount: number | null;
  category?: { name: string; iconName: string; color: string };
  isIncome?: boolean;
  isUpcoming: boolean;
  meta?: Record<string, string>;
}

export interface CalendarDayData {
  incomeTotal: number;
  expenseTotal: number;
  events: CalendarEvent[];
}

// --- Group types ---

export interface GroupMemberInfo {
  userId: string;
  name: string;
  email: string;
  avatarPath: string | null;
}

export interface GroupDetail {
  id: string;
  groupName: string;
  emoji: string;
  members: { userId: string; user: GroupMemberInfo }[];
  expenses: {
    id: string;
    description: string;
    totalAmount: number;
    date: string;
    splitMethod: string;
    payer: { id: string; name: string };
    splits: { userId: string; user: { id: string; name: string }; amount: number; percentage: number | null }[];
  }[];
  settlements: {
    id: string;
    settler: { id: string; name: string };
    receiver: { id: string; name: string };
    amount: number;
    method: string;
    createdAt: string;
  }[];
  balances: { userId: string; name: string; email: string; balance: number }[];
}
