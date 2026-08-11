import { prisma } from "@/lib/prisma";
import { requireTripContext, expenseVisibility } from "@/lib/trip";
import { asCurrency, formatMoney } from "@/lib/money";
import { relativeDay, clockTime } from "@/lib/format";
import { EXPENSE_CATEGORIES, emojiFor } from "@/lib/constants";
import { Screen, ButtonLink, CostItem, Dot, EmptyState, SectionHeader } from "@/components/ui";

export const metadata = { title: "History · Istanbul" };
export const dynamic = "force-dynamic";

/**
 * The Figma "Spending / History" frame: a back-arrow header, then the actual
 * expense feed grouped by day (28px between groups, 10px within a group),
 * which the Spending analytics screen no longer shows directly.
 */
export default async function SpendingHistoryPage() {
  const { trip, user } = await requireTripContext();
  const base = trip.baseCurrency;

  // The visibility filter runs in SQL — private rows never leave the database.
  const expenses = await prisma.expense.findMany({
    where: expenseVisibility(trip.id, user.id),
    select: {
      id: true,
      description: true,
      category: true,
      amountMinor: true,
      currency: true,
      baseAmountMinor: true,
      spentAt: true,
      isShared: true,
      splitMethod: true,
      paidBy: { select: { id: true, name: true } },
      participants: { select: { userId: true, shareMinor: true } },
    },
    orderBy: { spentAt: "desc" },
    take: 200,
  });

  const groups = new Map<string, typeof expenses>();
  for (const expense of expenses) {
    const key = expense.spentAt.toDateString();
    const bucket = groups.get(key);
    if (bucket) bucket.push(expense);
    else groups.set(key, [expense]);
  }

  return (
    <Screen
      back="/spending"
      title="History"
      gap={7}
      className="animate-rise"
      action={<ButtonLink href="/spending/new">Add Cost</ButtonLink>}
    >
      {expenses.length === 0 ? (
        <EmptyState
          title="No costs yet"
          description="Everything you add updates the budget and the settlement balance."
          action={<ButtonLink href="/spending/new">Add the first one</ButtonLink>}
        />
      ) : (
        [...groups.entries()].map(([day, items]) => {
          const dayTotal = items.reduce((total, e) => total + e.baseAmountMinor, 0);

          return (
            <section key={day} className="flex flex-col gap-2.5">
              <SectionHeader
                label={relativeDay(items[0].spentAt)}
                value={formatMoney(dayTotal, base)}
              />

              {items.map((expense) => {
                const currency = asCurrency(expense.currency);
                const myShare = expense.participants.find(
                  (p) => p.userId === user.id,
                )?.shareMinor;
                const showFooter = expense.isShared && expense.splitMethod !== "SINGLE";

                return (
                  <CostItem
                    key={expense.id}
                    icon={emojiFor(EXPENSE_CATEGORIES, expense.category)}
                    title={expense.description}
                    meta={clockTime(expense.spentAt)}
                    amount={formatMoney(expense.amountMinor, currency)}
                    sub={
                      currency !== base
                        ? formatMoney(expense.baseAmountMinor, base)
                        : undefined
                    }
                    footer={
                      showFooter ? (
                        <>
                          {expense.paidBy.id === user.id
                            ? "You paid"
                            : `${expense.paidBy.name} paid`}
                          {myShare !== undefined ? (
                            <>
                              <Dot />
                              Your share {formatMoney(myShare, currency)}
                            </>
                          ) : null}
                        </>
                      ) : !expense.isShared ? (
                        "Private — only you can see this"
                      ) : null
                    }
                  />
                );
              })}
            </section>
          );
        })
      )}
    </Screen>
  );
}
