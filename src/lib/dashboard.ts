import "server-only";

import { prisma } from "@/lib/prisma";
import { type TripContext } from "@/lib/trip";
import { computeSettlement } from "@/lib/settlement";
import { bucketForChart, type ChartSlice } from "@/lib/chart";

/**
 * Everything the Home screen needs, matching the Figma "Home — Full and
 * Event" / "Home — Empty" frames: the next itinerary item, the budget
 * burndown, and the six-slice category chart. The design has no spending-pace
 * or daily-activity section, so this stays deliberately narrow.
 */
export async function getDashboard(ctx: TripContext) {
  const { trip, user, partner } = ctx;

  const [sharedExpenses, nextEvent] = await Promise.all([
    prisma.expense.findMany({
      where: { tripId: trip.id, isShared: true },
      select: {
        category: true,
        baseAmountMinor: true,
        paidById: true,
        participants: { select: { userId: true, baseShareMinor: true } },
      },
    }),

    prisma.itineraryItem.findFirst({
      where: { tripId: trip.id, day: { gte: startOfToday() } },
      select: { id: true, title: true, day: true, startTime: true, location: true },
      orderBy: [{ day: "asc" }, { sortOrder: "asc" }, { startTime: "asc" }],
    }),
  ]);

  const spentMinor = sharedExpenses.reduce(
    (total, expense) => total + expense.baseAmountMinor,
    0,
  );
  const remainingMinor = trip.budgetMinor - spentMinor;
  const percentConsumed =
    trip.budgetMinor > 0 ? (spentMinor / trip.budgetMinor) * 100 : 0;

  const settlement = partner
    ? computeSettlement(sharedExpenses, user.id, partner.id)
    : { netMinor: 0, viewerPaidForOtherMinor: 0, otherPaidForViewerMinor: 0 };

  // The STATS donut always shows the trip total, bucketed into the six fixed
  // chart categories in canonical order — never sorted by amount.
  const byCategory = new Map<string, number>();
  for (const expense of sharedExpenses) {
    byCategory.set(
      expense.category,
      (byCategory.get(expense.category) ?? 0) + expense.baseAmountMinor,
    );
  }
  const chart: ChartSlice[] = bucketForChart(byCategory, spentMinor);

  return {
    spentMinor,
    remainingMinor,
    percentConsumed,
    settlement,
    chart,
    nextEvent,
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
