/**
 * Who owes whom.
 *
 * Pure functions over already-fetched rows so the maths is easy to reason
 * about and doesn't depend on the database or the network.
 *
 * All inputs are in the trip's base currency (`baseShareMinor`), converted at
 * the rate that applied when each expense was recorded. That's what makes a
 * multi-currency trip settle correctly: a dinner paid in EUR and a taxi paid in
 * TRY are already comparable by the time they get here.
 */

export type SettlementExpense = {
  paidById: string;
  participants: { userId: string; baseShareMinor: number }[];
};

export type SettlementResult = {
  /** Positive: the other traveler owes `viewerId`. Negative: viewer owes them. */
  netMinor: number;
  /** What the viewer covered on the other person's behalf. */
  viewerPaidForOtherMinor: number;
  /** What the other person covered on the viewer's behalf. */
  otherPaidForViewerMinor: number;
};

export function computeSettlement(
  expenses: SettlementExpense[],
  viewerId: string,
  otherId: string,
): SettlementResult {
  let viewerPaidForOtherMinor = 0;
  let otherPaidForViewerMinor = 0;

  for (const expense of expenses) {
    for (const participant of expense.participants) {
      // A participant's own share of something they paid for is not a debt.
      if (participant.userId === expense.paidById) continue;

      if (expense.paidById === viewerId && participant.userId === otherId) {
        viewerPaidForOtherMinor += participant.baseShareMinor;
      } else if (expense.paidById === otherId && participant.userId === viewerId) {
        otherPaidForViewerMinor += participant.baseShareMinor;
      }
    }
  }

  return {
    netMinor: viewerPaidForOtherMinor - otherPaidForViewerMinor,
    viewerPaidForOtherMinor,
    otherPaidForViewerMinor,
  };
}

/**
 * Budget burndown and spending pace.
 *
 * `daysElapsed` counts the current day as in progress (day 1 on the start
 * date), and is clamped to the trip length so a look back after the trip
 * doesn't produce a nonsensical pace.
 */
export type PaceResult = {
  totalDays: number;
  daysElapsed: number;
  daysRemaining: number;
  /** Average spend per elapsed day. */
  dailyPaceMinor: number;
  /** What's left, spread over the days that remain. */
  recommendedDailyMinor: number;
  /** Spent so far plus current pace applied to the remaining days. */
  projectedTotalMinor: number;
  status: "under" | "on_pace" | "over";
  hasStarted: boolean;
  hasEnded: boolean;
};

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function daysBetween(from: Date, to: Date): number {
  const ms = startOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.round(ms / 86_400_000);
}

export function computePace({
  budgetMinor,
  spentMinor,
  startDate,
  endDate,
  now = new Date(),
}: {
  budgetMinor: number;
  spentMinor: number;
  startDate: Date;
  endDate: Date;
  now?: Date;
}): PaceResult {
  const totalDays = Math.max(1, daysBetween(startDate, endDate) + 1);
  const hasStarted = startOfDay(now) >= startOfDay(startDate);
  const hasEnded = startOfDay(now) > startOfDay(endDate);

  const rawElapsed = daysBetween(startDate, now) + 1;
  const daysElapsed = Math.min(totalDays, Math.max(hasStarted ? 1 : 0, rawElapsed));
  const daysRemaining = Math.max(0, totalDays - daysElapsed);

  const remainingMinor = budgetMinor - spentMinor;

  const dailyPaceMinor = daysElapsed > 0 ? Math.round(spentMinor / daysElapsed) : 0;
  const recommendedDailyMinor =
    daysRemaining > 0 ? Math.round(remainingMinor / daysRemaining) : 0;
  const projectedTotalMinor = hasEnded
    ? spentMinor
    : spentMinor + dailyPaceMinor * daysRemaining;

  // A 5% band around the budget counts as "on pace" — without it the status
  // flickers between under and over on every small expense.
  const tolerance = budgetMinor * 0.05;
  let status: PaceResult["status"] = "on_pace";
  if (budgetMinor > 0) {
    if (projectedTotalMinor > budgetMinor + tolerance) status = "over";
    else if (projectedTotalMinor < budgetMinor - tolerance) status = "under";
  }

  return {
    totalDays,
    daysElapsed,
    daysRemaining,
    dailyPaceMinor,
    recommendedDailyMinor,
    projectedTotalMinor,
    status,
    hasStarted,
    hasEnded,
  };
}
