import "server-only";

import { prisma } from "@/lib/prisma";
import { expenseVisibility, type TripContext } from "@/lib/trip";
import { computePace, computeSettlement, type PaceResult } from "@/lib/settlement";

/**
 * Everything the home screen needs.
 *
 * A single trip for two people generates a few hundred expenses at most, so
 * the shared set is loaded once and aggregated in memory rather than issuing a
 * groupBy per chart. Fewer round trips, and the daily buckets respect the
 * server's local day boundaries.
 */

export type CategoryTotal = {
  category: string;
  totalMinor: number;
  percent: number;
};

export type DayTotal = {
  date: Date;
  totalMinor: number;
  percentOfMax: number;
  isToday: boolean;
};

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export async function getDashboard(ctx: TripContext) {
  const { trip, user, partner } = ctx;

  const [sharedExpenses, todaysExpenses, itinerary, personalBudget, personalSpent] =
    await Promise.all([
      prisma.expense.findMany({
        where: { tripId: trip.id, isShared: true },
        select: {
          id: true,
          category: true,
          spentAt: true,
          baseAmountMinor: true,
          paidById: true,
          participants: { select: { userId: true, baseShareMinor: true } },
        },
      }),

      // Today's activity respects the private-expense rule.
      prisma.expense.findMany({
        where: {
          ...expenseVisibility(trip.id, user.id),
          spentAt: { gte: startOfToday(), lt: endOfToday() },
        },
        select: {
          id: true,
          description: true,
          category: true,
          amountMinor: true,
          currency: true,
          baseAmountMinor: true,
          isShared: true,
          spentAt: true,
          paidBy: { select: { id: true, name: true } },
        },
        orderBy: { spentAt: "desc" },
      }),

      prisma.itineraryItem.findMany({
        where: { tripId: trip.id, day: { gte: startOfToday() } },
        select: {
          id: true,
          title: true,
          day: true,
          startTime: true,
          location: true,
          category: true,
        },
        orderBy: [{ day: "asc" }, { sortOrder: "asc" }, { startTime: "asc" }],
        take: 6,
      }),

      prisma.budget.findUnique({
        where: { userId_tripId: { userId: user.id, tripId: trip.id } },
        select: { amountMinor: true, currency: true },
      }),

      prisma.expense.aggregate({
        where: { tripId: trip.id, isShared: false, paidById: user.id },
        _sum: { baseAmountMinor: true },
      }),
    ]);

  const spentMinor = sharedExpenses.reduce(
    (total, expense) => total + expense.baseAmountMinor,
    0,
  );
  const remainingMinor = trip.budgetMinor - spentMinor;
  const percentConsumed =
    trip.budgetMinor > 0 ? (spentMinor / trip.budgetMinor) * 100 : 0;

  const pace: PaceResult = computePace({
    budgetMinor: trip.budgetMinor,
    spentMinor,
    startDate: trip.startDate,
    endDate: trip.endDate,
  });

  const settlement = partner
    ? computeSettlement(sharedExpenses, user.id, partner.id)
    : { netMinor: 0, viewerPaidForOtherMinor: 0, otherPaidForViewerMinor: 0 };

  // Category breakdown, biggest first.
  const byCategory = new Map<string, number>();
  for (const expense of sharedExpenses) {
    byCategory.set(
      expense.category,
      (byCategory.get(expense.category) ?? 0) + expense.baseAmountMinor,
    );
  }
  const categories: CategoryTotal[] = [...byCategory.entries()]
    .map(([category, totalMinor]) => ({
      category,
      totalMinor,
      percent: spentMinor > 0 ? (totalMinor / spentMinor) * 100 : 0,
    }))
    .sort((a, b) => b.totalMinor - a.totalMinor);

  // One bucket per trip day, including days with no spending so the bar chart
  // shows the shape of the trip rather than only the busy days.
  const dayTotals = new Map<string, number>();
  for (const expense of sharedExpenses) {
    const key = dayKey(expense.spentAt);
    dayTotals.set(key, (dayTotals.get(key) ?? 0) + expense.baseAmountMinor);
  }

  const days: DayTotal[] = [];
  const cursor = new Date(trip.startDate);
  cursor.setHours(0, 0, 0, 0);
  const todayKey = dayKey(new Date());

  while (cursor <= trip.endDate && days.length < 40) {
    const key = dayKey(cursor);
    days.push({
      date: new Date(cursor),
      totalMinor: dayTotals.get(key) ?? 0,
      percentOfMax: 0,
      isToday: key === todayKey,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const maxDay = days.reduce((max, day) => Math.max(max, day.totalMinor), 0);
  for (const day of days) {
    day.percentOfMax = maxDay > 0 ? (day.totalMinor / maxDay) * 100 : 0;
  }

  return {
    spentMinor,
    remainingMinor,
    percentConsumed,
    pace,
    settlement,
    categories,
    days,
    todaysExpenses,
    itinerary,
    personal: {
      budgetMinor: personalBudget?.amountMinor ?? null,
      currency: personalBudget?.currency ?? null,
      spentBaseMinor: personalSpent._sum.baseAmountMinor ?? 0,
    },
    expenseCount: sharedExpenses.length,
  };
}

export function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function endOfToday(): Date {
  const date = startOfToday();
  date.setDate(date.getDate() + 1);
  return date;
}
