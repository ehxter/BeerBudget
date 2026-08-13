import "server-only";

import { prisma } from "@/lib/prisma";
import { netDebt, type DebtBalance } from "@/lib/debts";
import { bucketForChart, type ChartSlice } from "@/lib/chart";
import { asCurrency, type CurrencyCode } from "@/lib/money";

export type Dashboard = {
  /** The budget as saved, in Lira. */
  budgetMinor: number;
  /** The same budget with the debt balance folded in — what Home burns down. */
  effectiveBudgetMinor: number;
  /** Every expense ever recorded, in Lira. This never resets. */
  spentMinor: number;
  remainingMinor: number;
  percentConsumed: number;
  debt: DebtBalance;
  /** What the traveler typed on the Me screen, for the "set as $500" line. */
  budgetEntered: { amountMinor: number; currency: CurrencyCode } | null;
  chart: ChartSlice[];
  expenseCount: number;
};

/**
 * Everything the Home screen needs, in Lira.
 *
 * The budget widget is the whole point of the screen, so it is deliberately
 * total: every expense the account has ever recorded counts against it, in
 * every currency, and the unsettled debt balance moves it up or down. There is
 * no date window and nothing resets.
 */
export async function getDashboard(userId: string): Promise<Dashboard> {
  const [budget, expenses, debts] = await Promise.all([
    prisma.budget.findUnique({ where: { userId } }),
    prisma.expense.findMany({
      where: { userId },
      select: { category: true, baseAmountMinor: true },
    }),
    prisma.debt.findMany({
      // Settled debts are history: they've already moved, so they no longer
      // move the budget.
      where: { userId, settledAt: null },
      select: { direction: true, baseAmountMinor: true },
    }),
  ]);

  const budgetMinor = budget?.baseAmountMinor ?? 0;
  const debt = netDebt(debts);
  const effectiveBudgetMinor = budgetMinor + debt.netMinor;

  const spentMinor = expenses.reduce(
    (total, expense) => total + expense.baseAmountMinor,
    0,
  );

  const byCategory = new Map<string, number>();
  for (const expense of expenses) {
    byCategory.set(
      expense.category,
      (byCategory.get(expense.category) ?? 0) + expense.baseAmountMinor,
    );
  }

  return {
    budgetMinor,
    effectiveBudgetMinor,
    spentMinor,
    remainingMinor: effectiveBudgetMinor - spentMinor,
    // Guard the divisor rather than the numerator: with no budget set (or one
    // wiped out by what you owe) there is nothing to be a percentage of.
    percentConsumed:
      effectiveBudgetMinor > 0 ? (spentMinor / effectiveBudgetMinor) * 100 : 0,
    debt,
    budgetEntered: budget
      ? { amountMinor: budget.amountMinor, currency: asCurrency(budget.currency) }
      : null,
    chart: bucketForChart(byCategory, spentMinor),
    expenseCount: expenses.length,
  };
}
