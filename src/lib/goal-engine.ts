import { addMonths, differenceInMonths, format } from "date-fns";

interface GoalContribution {
  amount: number;
  createdAt: Date;
}

interface Goal {
  targetAmount: number;
  currentSaved: number;
  deadline: Date;
  contributions: GoalContribution[];
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

export function calculateGoalInsights(goal: Goal, fmt?: (n: number) => string): GoalInsights {
  const today = new Date();
  const deadline = new Date(goal.deadline);
  const monthsRemaining = Math.max(0, differenceInMonths(deadline, today));
  const amountRemaining = Math.max(0, goal.targetAmount - goal.currentSaved);

  const requiredMonthly = monthsRemaining > 0
    ? amountRemaining / monthsRemaining
    : amountRemaining;

  const recent = goal.contributions
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 3);

  const currentMonthlyRate = recent.length > 0
    ? recent.reduce((sum, c) => sum + c.amount, 0) / recent.length
    : 0;

  const monthsAtCurrentRate = currentMonthlyRate > 0
    ? Math.ceil(amountRemaining / currentMonthlyRate)
    : Infinity;

  const etaDate = addMonths(today, monthsAtCurrentRate);
  const percentComplete = goal.targetAmount > 0
    ? (goal.currentSaved / goal.targetAmount) * 100
    : 0;

  const onTrack = currentMonthlyRate >= requiredMonthly;

  const f = fmt || ((n: number) => `₹${Math.round(n).toLocaleString()}`);

  let message: string;
  if (goal.currentSaved >= goal.targetAmount) {
    message = "Goal achieved!";
  } else if (onTrack || monthsAtCurrentRate <= monthsRemaining) {
    message = `Great! At ${f(currentMonthlyRate)}/month you'll hit your goal ${format(etaDate, "MMM yyyy")}.`;
  } else if (currentMonthlyRate > 0) {
    message = `At your current rate (${f(currentMonthlyRate)}/mo), you'll reach it in ${format(etaDate, "MMM yyyy")}. You need ${f(requiredMonthly)}/month to hit the deadline.`;
  } else {
    message = `You need to save ${f(requiredMonthly)}/month to reach ${f(goal.targetAmount)} by ${format(deadline, "MMM yyyy")}.`;
  }

  return {
    requiredMonthly,
    currentMonthlyRate,
    monthsRemaining,
    amountRemaining,
    percentComplete,
    etaDate,
    onTrack,
    message,
  };
}
