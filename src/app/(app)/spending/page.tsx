import Link from "next/link";
import { Plus, Lock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireTripContext, expenseVisibility } from "@/lib/trip";
import { asCurrency, formatMoney } from "@/lib/money";
import { relativeDay, clockTime } from "@/lib/format";
import { EXPENSE_CATEGORIES, emojiFor } from "@/lib/constants";
import { Card, EmptyState, PageHeader, Badge } from "@/components/ui";
import { ExpenseActions } from "./ExpenseActions";

export const metadata = { title: "Spending · Istanbul" };
export const dynamic = "force-dynamic";

export default async function SpendingPage() {
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
      note: true,
      paidBy: { select: { id: true, name: true } },
      participants: {
        select: { userId: true, shareMinor: true },
      },
    },
    orderBy: { spentAt: "desc" },
    take: 200,
  });

  const sharedTotal = expenses
    .filter((expense) => expense.isShared)
    .reduce((total, expense) => total + expense.baseAmountMinor, 0);

  // Group by calendar day for the feed.
  const groups = new Map<string, typeof expenses>();
  for (const expense of expenses) {
    const key = expense.spentAt.toDateString();
    const bucket = groups.get(key);
    if (bucket) bucket.push(expense);
    else groups.set(key, [expense]);
  }

  return (
    <div className="animate-rise space-y-4">
      <PageHeader
        title="Spending"
        subtitle={`${formatMoney(sharedTotal, base)} shared so far`}
        action={
          <Link
            href="/spending/new"
            aria-label="Add expense"
            className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-ink shadow-lg shadow-accent/20 active:bg-accent/80"
          >
            <Plus size={22} strokeWidth={2.5} />
          </Link>
        }
      />

      {expenses.length === 0 ? (
        <EmptyState
          title="No expenses yet"
          description="Every expense you add updates the budget and the settlement balance automatically."
          action={
            <Link
              href="/spending/new"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-3 text-sm font-semibold text-accent-ink"
            >
              <Plus size={16} />
              Add the first one
            </Link>
          }
        />
      ) : (
        <div className="space-y-5">
          {[...groups.entries()].map(([day, items]) => {
            const dayTotal = items.reduce(
              (total, expense) => total + expense.baseAmountMinor,
              0,
            );

            return (
              <section key={day}>
                <div className="mb-2 flex items-baseline justify-between px-1">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
                    {relativeDay(items[0].spentAt)}
                  </h2>
                  <span className="tnum text-[11px] font-medium text-ink-faint">
                    {formatMoney(dayTotal, base)}
                  </span>
                </div>

                <div className="space-y-2">
                  {items.map((expense) => {
                    const currency = asCurrency(expense.currency);
                    const myShare = expense.participants.find(
                      (participant) => participant.userId === user.id,
                    )?.shareMinor;

                    return (
                      <Card key={expense.id} className="flex items-start gap-3 py-3">
                        <span
                          aria-hidden="true"
                          className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-base"
                        >
                          {emojiFor(EXPENSE_CATEGORIES, expense.category)}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-medium text-ink">
                              {expense.description}
                            </span>
                            {!expense.isShared ? (
                              <Lock size={11} className="shrink-0 text-ink-faint" />
                            ) : null}
                          </div>

                          <div className="mt-0.5 truncate text-xs text-ink-faint">
                            {expense.isShared ? (
                              <>
                                {expense.paidBy.id === user.id
                                  ? "You"
                                  : expense.paidBy.name}{" "}
                                paid
                                {myShare !== undefined && expense.splitMethod !== "SINGLE"
                                  ? ` · your share ${formatMoney(myShare, currency)}`
                                  : ""}
                              </>
                            ) : (
                              "Private"
                            )}{" "}
                            · {clockTime(expense.spentAt)}
                          </div>

                          {expense.note ? (
                            <p className="mt-1 line-clamp-2 text-xs text-ink-faint">
                              {expense.note}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className="tnum text-sm font-semibold text-ink">
                            {formatMoney(expense.amountMinor, currency)}
                          </span>
                          {currency !== base ? (
                            <span className="tnum text-[10px] text-ink-faint">
                              {formatMoney(expense.baseAmountMinor, base)}
                            </span>
                          ) : null}
                          <ExpenseActions
                            id={expense.id}
                            description={expense.description}
                          />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {expenses.length >= 200 ? (
        <p className="pb-2 text-center text-xs text-ink-faint">
          Showing the 200 most recent expenses.
        </p>
      ) : (
        <div className="flex justify-center pb-2">
          <Badge tone="neutral">
            {expenses.length} {expenses.length === 1 ? "expense" : "expenses"}
          </Badge>
        </div>
      )}
    </div>
  );
}
