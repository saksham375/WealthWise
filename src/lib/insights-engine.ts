import { startOfMonth, endOfMonth, subMonths, getDay, getHours, format } from "date-fns";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  timestamp: Date;
  categoryId: string;
  isRecurring?: boolean;
  category: { name: string; iconName: string };
}

interface TransactionWithParsedDate extends Transaction {
  parsedDate: Date;
}

export interface Insight {
  id: string;
  type: string;
  category: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "positive";
  action?: { label: string; href: string };
  sparkline?: number[];
}

export interface FinancialHealthScore {
  score: number;
  breakdown: {
    savingsRate: number;
    budgetAdherence: number;
    spendingTrend: number;
    goalProgress: number;
    incomeStability: number;
  };
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsAmount: number;
}

interface BudgetData {
  id: string;
  name: string;
  limitAmount: number;
  spent: number;
}

interface GoalData {
  id: string;
  goalName: string;
  targetAmount: number;
  currentSaved: number;
  deadline: string;
  isCompleted: boolean;
}

interface SubscriptionData {
  id: string;
  name: string;
  amount: number;
}

interface EngineContext {
  budgets?: BudgetData[];
  goals?: GoalData[];
  subscriptions?: SubscriptionData[];
  fmt?: (n: number) => string;
}

function fmtCurrency(n: number, fmt?: (n: number) => string): string {
  return fmt ? fmt(n) : `₹${Math.round(n).toLocaleString()}`;
}

export function runInsightsEngine(
  transactions: Transaction[],
  months: number = 1,
  ctx: EngineContext = {}
): { insights: Insight[]; healthScore: FinancialHealthScore } {
  const now = new Date();
  const periodStart = subMonths(startOfMonth(now), months - 1);
  const periodEnd = endOfMonth(now);

  const parsed = transactions.map((t) => ({
    ...t,
    parsedDate: new Date(t.timestamp),
  }));

  const periodTxs = parsed.filter((t) => {
    return t.parsedDate >= periodStart && t.parsedDate <= periodEnd && t.type === "expense";
  });

  const incomeTxs = parsed.filter((t) => {
    return t.parsedDate >= periodStart && t.parsedDate <= periodEnd && t.type === "income";
  });

  const allExpenses = parsed.filter((t) => t.type === "expense");
  const allIncome = parsed.filter((t) => t.type === "income");

  const insights: Insight[] = [];
  const f = ctx.fmt;

  // Original 12 rules
  const fridayRule = computeFridaySpending(periodTxs, f);
  if (fridayRule) insights.push(fridayRule);

  const topRule = computeTopCategory(periodTxs, f);
  if (topRule) insights.push(topRule);

  const momRule = computeMonthOverMonth(allExpenses, months, f);
  if (momRule) insights.push(momRule);

  const vs3moRule = computeVs3MonthAvg(allExpenses, f);
  if (vs3moRule) insights.push(vs3moRule);

  const recurringRule = computeRecurringCost(transactions, f);
  if (recurringRule) insights.push(recurringRule);

  const weekendRule = computeWeekendSpending(periodTxs, f);
  if (weekendRule) insights.push(weekendRule);

  const largestRule = computeLargestExpense(periodTxs, f);
  if (largestRule) insights.push(largestRule);

  const savingsRule = computeSavingsRate(incomeTxs, periodTxs, f);
  if (savingsRule) insights.push(savingsRule);

  const anomalyRules = computeCategoryAnomalies(periodTxs, allExpenses, f);
  insights.push(...anomalyRules);

  const dailyAvgRule = computeDailyAvg(periodTxs, f);
  if (dailyAvgRule) insights.push(dailyAvgRule);

  const noSpendRule = computeNoSpendDays(periodTxs, f);
  if (noSpendRule) insights.push(noSpendRule);

  const impulseRule = computeImpulseRisk(periodTxs, f);
  if (impulseRule) insights.push(impulseRule);

  // New cross-data rules
  if (ctx.budgets) {
    const budgetRules = computeBudgetInsights(ctx.budgets, f);
    insights.push(...budgetRules);
  }

  if (ctx.goals) {
    const goalRules = computeGoalInsights(ctx.goals, f);
    insights.push(...goalRules);
  }

  if (ctx.subscriptions) {
    const subRules = computeSubscriptionInsights(ctx.subscriptions, periodTxs, f);
    insights.push(...subRules);
  }

  // Cash flow prediction
  const cashFlowRule = computeCashFlowPrediction(allExpenses, allIncome, f);
  if (cashFlowRule) insights.push(cashFlowRule);

  // Spending streak
  const streakRule = computeSpendingStreak(periodTxs, f);
  if (streakRule) insights.push(streakRule);

  // Health score
  const healthScore = computeFinancialHealthScore(
    incomeTxs, periodTxs, allExpenses, allIncome, ctx.budgets, ctx.goals
  );

  return { insights, healthScore };
}

function computeFinancialHealthScore(
  incomeTxs: Transaction[],
  expenseTxs: Transaction[],
  allExpenses: TransactionWithParsedDate[],
  allIncome: TransactionWithParsedDate[],
  budgets?: BudgetData[],
  goals?: GoalData[]
): FinancialHealthScore {
  const now = new Date();
  const monthlyIncome = incomeTxs.reduce((s, t) => s + t.amount, 0);
  const monthlyExpenses = expenseTxs.reduce((s, t) => s + t.amount, 0);
  const savingsAmount = Math.max(0, monthlyIncome - monthlyExpenses);

  // Savings rate (0-100)
  const savingsRateRaw = monthlyIncome > 0 ? (savingsAmount / monthlyIncome) * 100 : 0;
  const savingsRateScore = Math.min(100, savingsRateRaw * 2); // 50% savings = 100 score

  // Budget adherence (0-100)
  let budgetAdherenceScore = 70; // default
  if (budgets && budgets.length > 0) {
    const withinBudget = budgets.filter((b) => b.spent <= b.limitAmount).length;
    budgetAdherenceScore = (withinBudget / budgets.length) * 100;
  }

  // Spending trend (0-100) - lower spending vs last month = higher score
  let spendingTrendScore = 50;
  const thisMonth = allExpenses.filter((t) => t.parsedDate >= startOfMonth(now));
  const lastMonth = allExpenses.filter((t) => {
    return t.parsedDate >= startOfMonth(subMonths(now, 1)) && t.parsedDate <= endOfMonth(subMonths(now, 1));
  });
  const thisTotal = thisMonth.reduce((s, t) => s + t.amount, 0);
  const lastTotal = lastMonth.reduce((s, t) => s + t.amount, 0);
  if (lastTotal > 0) {
    const change = ((thisTotal - lastTotal) / lastTotal) * 100;
    spendingTrendScore = Math.max(0, Math.min(100, 50 - change));
  }

  // Goal progress (0-100)
  let goalProgressScore = 50;
  if (goals && goals.length > 0) {
    const completed = goals.filter((g) => g.isCompleted).length;
    const avgProgress = goals.reduce((sum, g) => {
      return sum + (g.targetAmount > 0 ? (g.currentSaved / g.targetAmount) * 100 : 0);
    }, 0) / goals.length;
    goalProgressScore = (completed / goals.length) * 50 + (avgProgress / 100) * 50;
  }

  // Income stability (0-100) - based on consistency of income across months
  let incomeStabilityScore = 50;
  const monthlyIncomes: number[] = [];
  for (let i = 0; i < 3; i++) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = endOfMonth(subMonths(now, i));
    const monthIncome = allIncome
      .filter((t) => t.parsedDate >= monthStart && t.parsedDate <= monthEnd)
      .reduce((s, t) => s + t.amount, 0);
    monthlyIncomes.push(monthIncome);
  }
  if (monthlyIncomes[0] > 0 && monthlyIncomes[1] > 0) {
    const avgIncome = monthlyIncomes.reduce((s, v) => s + v, 0) / monthlyIncomes.length;
    const variance = monthlyIncomes.reduce((s, v) => s + Math.pow(v - avgIncome, 2), 0) / monthlyIncomes.length;
    const cv = avgIncome > 0 ? Math.sqrt(variance) / avgIncome : 1;
    incomeStabilityScore = Math.max(0, Math.min(100, (1 - cv) * 100));
  }

  const totalScore = Math.round(
    savingsRateScore * 0.3 +
    budgetAdherenceScore * 0.25 +
    spendingTrendScore * 0.2 +
    goalProgressScore * 0.15 +
    incomeStabilityScore * 0.1
  );

  return {
    score: Math.max(0, Math.min(100, totalScore)),
    breakdown: {
      savingsRate: Math.round(savingsRateScore),
      budgetAdherence: Math.round(budgetAdherenceScore),
      spendingTrend: Math.round(spendingTrendScore),
      goalProgress: Math.round(goalProgressScore),
      incomeStability: Math.round(incomeStabilityScore),
    },
    monthlyIncome,
    monthlyExpenses,
    savingsAmount,
  };
}

function computeBudgetInsights(budgets: BudgetData[], fmt?: (n: number) => string): Insight[] {
  const insights: Insight[] = [];

  for (const b of budgets) {
    if (b.spent > b.limitAmount) {
      const over = b.spent - b.limitAmount;
      insights.push({
        id: `budget_over_${b.id}`,
        type: "budget",
        category: "financial",
        title: `${b.name} Over Budget`,
        message: `You've exceeded your ${fmtCurrency(b.limitAmount, fmt)} budget by ${fmtCurrency(over, fmt)} (${Math.round((b.spent / b.limitAmount) * 100)}% used).`,
        severity: "warning",
        action: { label: "View Budget", href: "/budgets" },
      });
    } else if (b.spent > b.limitAmount * 0.8) {
      const remaining = b.limitAmount - b.spent;
      insights.push({
        id: `budget_warn_${b.id}`,
        type: "budget",
        category: "financial",
        title: `${b.name} Nearing Limit`,
        message: `You've used ${Math.round((b.spent / b.limitAmount) * 100)}% of your ${fmtCurrency(b.limitAmount, fmt)} budget. Only ${fmtCurrency(remaining, fmt)} remaining.`,
        severity: "info",
        action: { label: "View Budget", href: "/budgets" },
      });
    }
  }

  return insights;
}

function computeGoalInsights(goals: GoalData[], fmt?: (n: number) => string): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();

  for (const g of goals) {
    if (g.isCompleted) continue;

    const deadline = new Date(g.deadline);
    const monthsLeft = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (30 * 24 * 60 * 60 * 1000)));
    const remaining = g.targetAmount - g.currentSaved;

    if (monthsLeft > 0) {
      const requiredPerMonth = remaining / monthsLeft;
      insights.push({
        id: `goal_velocity_${g.id}`,
        type: "goal",
        category: "financial",
        title: `${g.goalName} — Save ${fmtCurrency(requiredPerMonth, fmt)}/mo`,
        message: `To reach ${fmtCurrency(g.targetAmount, fmt)} by ${format(deadline, "MMM yyyy")}, you need ${fmtCurrency(requiredPerMonth, fmt)}/month. Currently ${Math.round((g.currentSaved / g.targetAmount) * 100)}% there.`,
        severity: remaining > g.targetAmount * 0.5 ? "warning" : "info",
        action: { label: "View Goals", href: "/goals" },
      });
    }
  }

  return insights;
}

function computeSubscriptionInsights(subs: SubscriptionData[], periodTxs: TransactionWithParsedDate[], fmt?: (n: number) => string): Insight[] {
  const insights: Insight[] = [];

  if (subs.length === 0) return insights;

  const totalMonthly = subs.reduce((s, sub) => s + sub.amount, 0);

  if (subs.length >= 5) {
    insights.push({
      id: "sub_audit",
      type: "subscription",
      category: "financial",
      title: "Subscription Audit",
      message: `You have ${subs.length} active subscriptions costing ${fmtCurrency(totalMonthly, fmt)}/month (${fmtCurrency(totalMonthly * 12, fmt)}/year). Review for potential savings.`,
      severity: "info",
      action: { label: "View Subscriptions", href: "/subscriptions" },
    });
  }

  // Check for unused subscriptions (no matching transactions)
  const subNames = subs.map((s) => s.name.toLowerCase());
  const matchingTxs = periodTxs.filter((t) =>
    subNames.some((name) => t.description?.toLowerCase().includes(name))
  );

  if (matchingTxs.length === 0 && subs.length > 0) {
    insights.push({
      id: "sub_unused",
      type: "subscription",
      category: "behavior",
      title: "Potentially Unused Subscriptions",
      message: `No transactions matched your ${subs.length} subscriptions this period. Consider if you're still using all of them.`,
      severity: "warning",
      action: { label: "Review Subscriptions", href: "/subscriptions" },
    });
  }

  return insights;
}

function computeCashFlowPrediction(
  allExpenses: TransactionWithParsedDate[],
  allIncome: TransactionWithParsedDate[],
  fmt?: (n: number) => string
): Insight | null {
  const now = new Date();
  const monthlyData: { income: number; expense: number }[] = [];

  for (let i = 0; i < 3; i++) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = endOfMonth(subMonths(now, i));
    const income = allIncome
      .filter((t) => t.parsedDate >= monthStart && t.parsedDate <= monthEnd)
      .reduce((s, t) => s + t.amount, 0);
    const expense = allExpenses
      .filter((t) => t.parsedDate >= monthStart && t.parsedDate <= monthEnd)
      .reduce((s, t) => s + t.amount, 0);
    monthlyData.push({ income, expense });
  }

  const avgIncome = monthlyData.reduce((s, d) => s + d.income, 0) / 3;
  const avgExpense = monthlyData.reduce((s, d) => s + d.expense, 0) / 3;
  const avgNet = avgIncome - avgExpense;

  const nextMonthNet = avgNet;
  const sparkline = monthlyData.map((d) => d.income - d.expense).reverse();

  return {
    id: "cash_flow_prediction",
    type: "prediction",
    category: "financial",
    title: "Cash Flow Forecast",
    message: `Based on 3-month trends, you're projected to ${nextMonthNet >= 0 ? "save" : "lose"} ${fmtCurrency(Math.abs(nextMonthNet), fmt)} next month.`,
    severity: nextMonthNet >= 0 ? "positive" : "warning",
    sparkline,
  };
}

function computeSpendingStreak(periodTxs: TransactionWithParsedDate[], fmt?: (n: number) => string): Insight | null {
  if (periodTxs.length === 0) return null;

  const days = [...new Set(periodTxs.map((t) => format(t.parsedDate, "yyyy-MM-dd")))].sort();
  if (days.length < 3) return null;

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  if (maxStreak < 3) return null;

  return {
    id: "spending_streak",
    type: "streak",
    category: "behavior",
    title: "Spending Streak",
    message: `You spent on ${maxStreak} consecutive days. Mixing spending-free days can help reduce overall expenses.`,
    severity: "info",
  };
}

function computeFridaySpending(txs: TransactionWithParsedDate[], fmt?: (n: number) => string): Insight | null {
  const fridayTxs = txs.filter((t) => getDay(t.parsedDate) === 5);
  const weekdayTxs = txs.filter(
    (t) => getDay(t.parsedDate) !== 5 && getDay(t.parsedDate) !== 6
  );

  if (fridayTxs.length < 2 || weekdayTxs.length < 2) return null;

  const fridayAvg = fridayTxs.reduce((s, t) => s + t.amount, 0) / fridayTxs.length;
  const weekdayAvg = weekdayTxs.reduce((s, t) => s + t.amount, 0) / weekdayTxs.length;

  if (weekdayAvg === 0) return null;

  const ratio = fridayAvg / weekdayAvg;
  if (ratio < 1.1) return null;

  return {
    id: "friday_spending",
    type: "behavior",
    category: "behavior",
    title: "Friday Effect",
    message: `You spend ${Math.round((ratio - 1) * 100)}% more on Fridays (avg ${fmtCurrency(fridayAvg, fmt)}) compared to other weekdays (avg ${fmtCurrency(weekdayAvg, fmt)}).`,
    severity: "warning",
    sparkline: [weekdayAvg, weekdayAvg, weekdayAvg, weekdayAvg, fridayAvg],
  };
}

function computeTopCategory(txs: Transaction[], fmt?: (n: number) => string): Insight | null {
  if (txs.length === 0) return null;

  const grouped: Record<string, { name: string; amount: number }> = {};
  for (const tx of txs) {
    const key = tx.category.name;
    if (!grouped[key]) grouped[key] = { name: key, amount: 0 };
    grouped[key].amount += tx.amount;
  }

  const entries = Object.values(grouped).sort((a, b) => b.amount - a.amount);
  const top = entries[0];
  const total = entries.reduce((s, e) => s + e.amount, 0);
  const percentage = total > 0 ? Math.round((top.amount / total) * 100) : 0;

  const sparkline = entries.slice(0, 5).map((e) => e.amount);

  return {
    id: "top_category",
    type: "spending",
    category: "spending",
    title: "Top Spending Category",
    message: `${top.name} is your #1 expense (${percentage}% of total — ${fmtCurrency(top.amount, fmt)}).`,
    severity: "info",
    sparkline,
  };
}

function computeMonthOverMonth(
  allExpenses: TransactionWithParsedDate[],
  months: number,
  fmt?: (n: number) => string
): Insight | null {
  const now = new Date();
  const thisMonth = allExpenses.filter((t) => {
    return t.parsedDate >= startOfMonth(now) && t.parsedDate <= endOfMonth(now);
  });
  const lastMonth = allExpenses.filter((t) => {
    return (
      t.parsedDate >= startOfMonth(subMonths(now, 1)) &&
      t.parsedDate <= endOfMonth(subMonths(now, 1))
    );
  });

  const thisTotal = thisMonth.reduce((s, t) => s + t.amount, 0);
  const lastTotal = lastMonth.reduce((s, t) => s + t.amount, 0);

  if (lastTotal === 0) return null;

  const change = ((thisTotal - lastTotal) / lastTotal) * 100;
  const absChange = Math.abs(Math.round(change));

  const sparkline = [lastTotal, thisTotal];

  return {
    id: "mom_comparison",
    type: "trend",
    category: "trend",
    title: "Month-over-Month",
    message:
      change > 0
        ? `Expenses ↑${absChange}% vs last month (${fmtCurrency(thisTotal, fmt)} vs ${fmtCurrency(lastTotal, fmt)}).`
        : `Expenses ↓${absChange}% vs last month (${fmtCurrency(thisTotal, fmt)} vs ${fmtCurrency(lastTotal, fmt)}).`,
    severity: change > 0 ? "warning" : "positive",
    sparkline,
  };
}

function computeVs3MonthAvg(allExpenses: TransactionWithParsedDate[], fmt?: (n: number) => string): Insight | null {
  const now = new Date();
  const thisMonth = allExpenses.filter((t) => {
    return t.parsedDate >= startOfMonth(now) && t.parsedDate <= endOfMonth(now);
  });

  const threeMonthAvg: number[] = [];
  for (let i = 1; i <= 3; i++) {
    const monthTxs = allExpenses.filter((t) => {
      return (
        t.parsedDate >= startOfMonth(subMonths(now, i)) &&
        t.parsedDate <= endOfMonth(subMonths(now, i))
      );
    });
    threeMonthAvg.push(monthTxs.reduce((s, t) => s + t.amount, 0));
  }

  const avg = threeMonthAvg.reduce((s, a) => s + a, 0) / threeMonthAvg.length;
  const thisTotal = thisMonth.reduce((s, t) => s + t.amount, 0);

  if (avg === 0) return null;

  const diff = thisTotal - avg;
  const absDiff = Math.round(Math.abs(diff));

  if (Math.abs(diff) / avg < 0.05) return null;

  const sparkline = [...threeMonthAvg.reverse(), thisTotal];

  return {
    id: "vs_3mo_avg",
    type: "trend",
    category: "trend",
    title: "vs. 3-Month Average",
    message:
      diff > 0
        ? `This month's spending (${fmtCurrency(thisTotal, fmt)}) is ${fmtCurrency(absDiff, fmt)} above your 3-month average (${fmtCurrency(avg, fmt)}).`
        : `This month's spending (${fmtCurrency(thisTotal, fmt)}) is ${fmtCurrency(absDiff, fmt)} below your 3-month average (${fmtCurrency(avg, fmt)}). Good job!`,
    severity: diff > 0 ? "warning" : "positive",
    sparkline,
  };
}

function computeRecurringCost(transactions: Transaction[], fmt?: (n: number) => string): Insight | null {
  const recurring = transactions.filter((t) => t.isRecurring && t.type === "expense");
  if (recurring.length === 0) return null;

  const total = recurring.reduce((s, t) => s + t.amount, 0);
  const uniqueCategories = new Set(recurring.map((t) => t.category.name));

  return {
    id: "recurring_cost",
    type: "subscription",
    category: "financial",
    title: "Recurring Costs",
    message: `${fmtCurrency(total, fmt)}/month in recurring payments across ${uniqueCategories.size} categories (${recurring.length} active).`,
    severity: "info",
    action: { label: "View Recurring", href: "/recurring" },
  };
}

function computeWeekendSpending(txs: TransactionWithParsedDate[], fmt?: (n: number) => string): Insight | null {
  const weekendTxs = txs.filter((t) => {
    const day = getDay(t.parsedDate);
    return day === 0 || day === 6;
  });
  const weekdayTxs = txs.filter((t) => {
    const day = getDay(t.parsedDate);
    return day >= 1 && day <= 5;
  });

  if (weekendTxs.length < 2 || weekdayTxs.length < 2) return null;

  const weekendDays = [...new Set(weekendTxs.map((t) => format(t.parsedDate, "yyyy-MM-dd")))].length || 1;
  const weekdayDays = [...new Set(weekdayTxs.map((t) => format(t.parsedDate, "yyyy-MM-dd")))].length || 1;

  const weekendAvg = weekendTxs.reduce((s, t) => s + t.amount, 0) / weekendDays;
  const weekdayAvg = weekdayTxs.reduce((s, t) => s + t.amount, 0) / weekdayDays;

  if (weekdayAvg === 0) return null;

  const ratio = weekendAvg / weekdayAvg;
  if (ratio < 1.1) return null;

  return {
    id: "weekend_spending",
    type: "behavior",
    category: "behavior",
    title: "Weekend Spending",
    message: `You spend ${Math.round(ratio * 10) / 10}× more on weekends (${fmtCurrency(weekendAvg, fmt)}/day) than weekdays (${fmtCurrency(weekdayAvg, fmt)}/day).`,
    severity: "warning",
    sparkline: [weekdayAvg, weekdayAvg, weekdayAvg, weekdayAvg, weekdayAvg, weekendAvg, weekendAvg],
  };
}

function computeLargestExpense(txs: Transaction[], fmt?: (n: number) => string): Insight | null {
  if (txs.length === 0) return null;

  const largest = [...txs].sort((a, b) => b.amount - a.amount)[0];

  return {
    id: "largest_expense",
    type: "spending",
    category: "spending",
    title: "Largest Expense This Month",
    message: `Your biggest expense was "${largest.description || largest.category.name}" at ${fmtCurrency(largest.amount, fmt)} in ${largest.category.name}.`,
    severity: "info",
  };
}

function computeSavingsRate(
  incomeTxs: Transaction[],
  expenseTxs: Transaction[],
  fmt?: (n: number) => string
): Insight | null {
  const totalIncome = incomeTxs.reduce((s, t) => s + t.amount, 0);
  const totalExpense = expenseTxs.reduce((s, t) => s + t.amount, 0);

  if (totalIncome === 0) return null;

  const savingsRate = ((totalIncome - totalExpense) / totalIncome) * 100;
  const rounded = Math.round(savingsRate * 10) / 10;

  let message: string;
  let severity: "positive" | "info" | "warning";

  if (rounded >= 50) {
    message = `You're saving ${rounded}% of income — excellent!`;
    severity = "positive";
  } else if (rounded >= 20) {
    message = `You're saving ${rounded}% of income.`;
    severity = "info";
  } else if (rounded > 0) {
    message = `You're saving ${rounded}% of income. Consider increasing your savings rate.`;
    severity = "warning";
  } else {
    message = `You're spending more than you earn (savings rate: ${rounded}%).`;
    severity = "warning";
  }

  return {
    id: "savings_rate",
    type: "financial",
    category: "financial",
    title: "Savings Rate",
    message,
    severity,
    sparkline: [totalIncome, totalExpense],
  };
}

function computeCategoryAnomalies(
  periodTxs: TransactionWithParsedDate[],
  allExpenses: TransactionWithParsedDate[],
  fmt?: (n: number) => string
): Insight[] {
  const now = new Date();
  const insights: Insight[] = [];

  const grouped: Record<string, { period: number; avg: number }> = {};

  for (const tx of periodTxs) {
    const key = tx.category.name;
    if (!grouped[key]) grouped[key] = { period: 0, avg: 0 };
    grouped[key].period += tx.amount;
  }

  const threeMonthsAgo = subMonths(now, 4);
  const historicTxs = allExpenses.filter((t) => {
    return t.parsedDate >= startOfMonth(threeMonthsAgo) && t.parsedDate < startOfMonth(now);
  });

  for (const tx of historicTxs) {
    const key = tx.category.name;
    if (!grouped[key]) continue;
    grouped[key].avg += tx.amount;
  }

  const categoryCount = Object.keys(grouped).length;
  const monthlyAvgDivisor = Math.max(3, categoryCount);

  for (const [name, data] of Object.entries(grouped)) {
    const historicalAvg = data.avg / monthlyAvgDivisor;
    if (historicalAvg <= 0) continue;

    const ratio = data.period / historicalAvg;
    if (ratio < 1.3) continue;

    const diff = Math.round(data.period - historicalAvg);

    insights.push({
      id: `anomaly_${name.toLowerCase().replace(/\s+/g, "_")}`,
      type: "anomaly",
      category: "anomaly",
      title: `${name} Spike`,
      message: `Your ${name} spend is ${Math.round((ratio - 1) * 100)}% higher than your 3-month average (${fmtCurrency(diff, fmt)} more).`,
      severity: "warning",
      sparkline: [historicalAvg, data.period],
    });

    if (insights.length >= 2) break;
  }

  return insights;
}

function computeDailyAvg(txs: TransactionWithParsedDate[], fmt?: (n: number) => string): Insight | null {
  if (txs.length === 0) return null;

  const days = [...new Set(txs.map((t) => format(t.parsedDate, "yyyy-MM-dd")))].length || 1;
  const total = txs.reduce((s, t) => s + t.amount, 0);
  const avg = total / days;

  return {
    id: "daily_avg",
    type: "spending",
    category: "spending",
    title: "Daily Average",
    message: `You spend ${fmtCurrency(avg, fmt)}/day on average (${days} days with transactions).`,
    severity: "info",
  };
}

function computeNoSpendDays(txs: TransactionWithParsedDate[], fmt?: (n: number) => string): Insight | null {
  const now = new Date();
  const daysInMonth = endOfMonth(now).getDate();

  const daysWithSpend = new Set(txs.map((t) => format(t.parsedDate, "yyyy-MM-dd")));
  const noSpendDays = daysInMonth - daysWithSpend.size;

  if (noSpendDays < 2) return null;

  return {
    id: "no_spend_days",
    type: "behavior",
    category: "behavior",
    title: "No-Spend Days",
    message: `You had ${noSpendDays} day${noSpendDays > 1 ? "s" : ""} with zero expenses this month. Keep it up!`,
    severity: "positive",
  };
}

function computeImpulseRisk(txs: TransactionWithParsedDate[], fmt?: (n: number) => string): Insight | null {
  const lateNight = txs.filter((t) => getHours(t.parsedDate) >= 22);

  if (lateNight.length < 2) return null;

  const total = lateNight.reduce((s, t) => s + t.amount, 0);

  return {
    id: "impulse_risk",
    type: "behavior",
    category: "behavior",
    title: "Late-Night Spending",
    message: `${lateNight.length} transaction${lateNight.length > 1 ? "s" : ""} occurred after 10 PM this month. Late-night spending tends to be impulsive. Total: ${fmtCurrency(total, fmt)}.`,
    severity: "warning",
  };
}
