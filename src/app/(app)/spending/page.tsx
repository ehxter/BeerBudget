import { prisma } from "@/lib/prisma";
import { requireTripContext } from "@/lib/trip";
import { formatMoney } from "@/lib/money";
import { bucketForChart } from "@/lib/chart";
import { EXPENSE_CATEGORIES, emojiFor } from "@/lib/constants";
import {
  Screen,
  Card,
  ButtonLink,
  CardButtonLink,
  CategoryBar,
  Donut,
  DonutLegend,
} from "@/components/ui";

export const metadata = { title: "Spending · Istanbul" };
export const dynamic = "force-dynamic";

/**
 * Spending, from the Figma "Spending" frame: this is an analytics screen, not
 * a transaction list — the donut+legend card, the category-bar-list card,
 * then a "Spending History" button that pushes to the actual feed
 * (/spending/history). Settlement has no Figma reference; it's added here
 * using the same dark card-button language the design already establishes.
 */
export default async function SpendingPage() {
  const { trip, partner } = await requireTripContext();
  const base = trip.baseCurrency;

  const shared = await prisma.expense.findMany({
    where: { tripId: trip.id, isShared: true },
    select: { category: true, baseAmountMinor: true },
  });

  const sharedTotal = shared.reduce((total, e) => total + e.baseAmountMinor, 0);

  const byCategory = new Map<string, number>();
  for (const expense of shared) {
    byCategory.set(
      expense.category,
      (byCategory.get(expense.category) ?? 0) + expense.baseAmountMinor,
    );
  }
  const chart = bucketForChart(byCategory, sharedTotal);

  return (
    <Screen
      trip={{ emoji: trip.emoji, name: trip.name }}
      gap={4}
      className="animate-rise"
      action={<ButtonLink href="/spending/new">Add Cost</ButtonLink>}
    >
      <Card pad={18} radius="lg">
        <div className="flex items-center gap-5 py-2">
          <DonutLegend items={chart} />
          <Donut slices={chart} size={156} />
        </div>
      </Card>

      <Card pad={24}>
        {chart.map((slice) => (
          <div key={slice.key} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-cat font-medium text-ink-3">
              <span aria-hidden="true">{emojiFor(EXPENSE_CATEGORIES, slice.key)}</span>
              <span className="truncate">{slice.label}</span>
              <span className="tnum shrink-0 text-ink-4">
                {Math.round(slice.percent)}%
              </span>
              <span className="tnum ml-auto shrink-0 text-ink-3">
                {formatMoney(slice.totalMinor, base)}
              </span>
            </div>
            <CategoryBar percent={slice.percent} />
          </div>
        ))}
      </Card>

      <CardButtonLink href="/spending/history">Spending History</CardButtonLink>

      {partner ? <CardButtonLink href="/settlement">Settlement</CardButtonLink> : null}
    </Screen>
  );
}
