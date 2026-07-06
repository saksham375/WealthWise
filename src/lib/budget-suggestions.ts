interface CategoryInfo {
  id: string;
  name: string;
  limitAmount: number;
}

interface BudgetInfo {
  categoryId: string;
  categoryName: string;
  limitAmount: number;
}

interface TransactionWithCategory {
  amount: number;
  categoryId: string;
  category: { id: string; name: string };
}

export function getSpentAmount(
  transactions: TransactionWithCategory[],
  categoryId: string
): number {
  return transactions
    .filter((t) => t.categoryId === categoryId)
    .reduce((s, t) => s + t.amount, 0);
}

export function generateSuggestion(
  overBudgetCategory: CategoryInfo,
  allBudgets: BudgetInfo[],
  transactions: TransactionWithCategory[],
  fmt?: (amount: number) => string
): string {
  const formatAmount = fmt ?? ((n: number) => `₹${Math.abs(n).toLocaleString()}`);
  const overBy = getSpentAmount(transactions, overBudgetCategory.id) - overBudgetCategory.limitAmount;

  const underUtilized = allBudgets
    .filter((b) => b.categoryId !== overBudgetCategory.id)
    .map((b) => ({
      ...b,
      spent: getSpentAmount(transactions, b.categoryId),
    }))
    .filter((b) => b.spent < b.limitAmount)
    .sort((a, b) => (a.spent / a.limitAmount) - (b.spent / b.limitAmount));

  if (underUtilized.length === 0) {
    return `You are ${formatAmount(overBy)} over your ${overBudgetCategory.name} budget. Consider reviewing your spending in this area.`;
  }

  const lowest = underUtilized[0];
  const canTransfer = lowest.limitAmount - lowest.spent;

  if (canTransfer > 0) {
    return `You are over your ${overBudgetCategory.name} budget by ${formatAmount(overBy)}. You have ${fmt ? fmt(canTransfer) : `₹${canTransfer.toLocaleString()}`} remaining in ${lowest.categoryName} this month — consider reallocating.`;
  }

  return `You are over your ${overBudgetCategory.name} budget. Review your spending habits for next month.`;
}
