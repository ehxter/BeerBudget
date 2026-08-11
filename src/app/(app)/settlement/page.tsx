import { prisma } from "@/lib/prisma";
import { requireTripContext } from "@/lib/trip";
import { computeSettlement } from "@/lib/settlement";
import { asCurrency, formatMoney, CURRENCY_META } from "@/lib/money";
import { relativeDay } from "@/lib/format";
import { EXPENSE_CATEGORIES, emojiFor } from "@/lib/constants";
import {
  Screen,
  Card,
  CardLabel,
  SectionHeader,
  CostItem,
  Divider,
  EmptyState,
} from "@/components/ui";

export const metadata = { title: "Settlement · Istanbul" };
export const dynamic = "force-dynamic";

/**
 * Not in the Figma frames — built from the same language: a headline figure in
 * the Home "budget left" treatment, a card of totals, then the standard Cost
 * Item rows for the expenses that moved the balance.
 */
export default async function SettlementPage() {
  const { trip, user, partner } = await requireTripContext();
  const base = trip.baseCurrency;

  const expenses = await prisma.expense.findMany({
    where: { tripId: trip.id, isShared: true },
    select: {
      id: true,
      description: true,
      category: true,
      amountMinor: true,
      currency: true,
      spentAt: true,
      paidById: true,
      paidBy: { select: { id: true, name: true } },
      participants: { select: { userId: true, baseShareMinor: true } },
    },
    orderBy: { spentAt: "desc" },
  });

  if (!partner) {
    return (
      <Screen back="/spending" title="Settlement">
        <EmptyState
          title="No travel partner yet"
          description="Once the second traveler signs up, shared costs settle here automatically."
        />
      </Screen>
    );
  }

  const settlement = computeSettlement(expenses, user.id, partner.id);
  const owedToYou = settlement.netMinor > 0;
  const square = settlement.netMinor === 0;

  // Only expenses where one person covered part of the other's share actually
  // moved the balance.
  const movements = expenses
    .map((expense) => {
      const otherId = expense.paidById === user.id ? partner.id : user.id;
      const covered =
        expense.participants.find((p) => p.userId === otherId)?.baseShareMinor ?? 0;
      return { expense, covered, towardYou: expense.paidById === user.id };
    })
    .filter((entry) => entry.covered > 0);

  return (
    <Screen back="/spending" title="Settlement" gap={4} className="animate-rise">
      <Card pad={20}>
        <CardLabel>
          {square
            ? "All square"
            : owedToYou
              ? `${partner.name} owes you`
              : `You owe ${partner.name}`}
        </CardLabel>

        <div className="flex items-baseline gap-2">
          <span
            className={`tnum text-display font-bold ${
              square ? "text-ink" : owedToYou ? "text-cat-4" : "text-cat-6"
            }`}
          >
            {formatMoney(Math.abs(settlement.netMinor), base, { bare: true })}
          </span>
          <span className="text-meta font-semibold text-ink-5">
            {CURRENCY_META[base].unit}
          </span>
        </div>

        <Divider />

        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between text-meta">
            <span className="text-ink-3">You paid for {partner.name}</span>
            <span className="tnum font-medium text-cat-4">
              {formatMoney(settlement.viewerPaidForOtherMinor, base)}
            </span>
          </div>
          <div className="flex items-baseline justify-between text-meta">
            <span className="text-ink-3">{partner.name} paid for you</span>
            <span className="tnum font-medium text-cat-6">
              {formatMoney(settlement.otherPaidForViewerMinor, base)}
            </span>
          </div>
        </div>

        <p className="text-label leading-relaxed text-ink-5">
          Converted to {base} at the rate recorded with each cost, so a later
          move in the rate never changes what you owe.
        </p>
      </Card>

      <section className="flex flex-col gap-2.5">
        <SectionHeader label="What moved the balance" />

        {movements.length === 0 ? (
          <EmptyState
            title="Nothing to settle"
            description="Shared costs where one of you covered the other's share show up here."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {movements.map(({ expense, covered, towardYou }) => (
              <CostItem
                key={expense.id}
                icon={emojiFor(EXPENSE_CATEGORIES, expense.category)}
                title={expense.description}
                meta={`${towardYou ? "You" : partner.name} paid ${formatMoney(
                  expense.amountMinor,
                  asCurrency(expense.currency),
                )} · ${relativeDay(expense.spentAt)}`}
                amount={
                  <span className={towardYou ? "text-cat-4" : "text-cat-6"}>
                    {towardYou ? "+" : "−"}
                    {formatMoney(covered, base)}
                  </span>
                }
              />
            ))}
          </div>
        )}
      </section>
    </Screen>
  );
}
