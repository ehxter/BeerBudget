"use client";

import { useOptimistic, useTransition } from "react";
import { asCurrency, formatMoney, BASE_CURRENCY } from "@/lib/money";
import { relativeDay, clockTime } from "@/lib/format";
import { EXPENSE_CATEGORIES, emojiFor, labelFor } from "@/lib/constants";
import { CostItem, DeleteButton, SectionHeader, Dot } from "@/components/ui";
import { deleteExpense } from "./actions";

export type ExpenseRow = {
  id: string;
  description: string;
  category: string;
  amountMinor: number;
  currency: string;
  baseAmountMinor: number;
  spentAt: Date;
  note: string | null;
};

/**
 * The spending feed, grouped by day. Days are recomputed from the optimistic
 * list rather than grouped on the server, so removing the last cost of a day
 * takes its date heading with it instead of leaving an empty section behind.
 */
export function ExpenseList({ expenses }: { expenses: ExpenseRow[] }) {
  const [, startTransition] = useTransition();
  const [optimistic, removeOptimistic] = useOptimistic(
    expenses,
    (current: ExpenseRow[], id: string) => current.filter((row) => row.id !== id),
  );

  function handleDelete(id: string) {
    startTransition(async () => {
      removeOptimistic(id);
      const formData = new FormData();
      formData.set("id", id);
      await deleteExpense(formData);
    });
  }

  const groups = new Map<string, ExpenseRow[]>();
  for (const expense of optimistic) {
    const key = expense.spentAt.toDateString();
    const bucket = groups.get(key);
    if (bucket) bucket.push(expense);
    else groups.set(key, [expense]);
  }

  return (
    <>
      {[...groups.values()].map((items) => {
        const dayTotal = items.reduce((total, row) => total + row.baseAmountMinor, 0);

        return (
          <section
            key={items[0].spentAt.toDateString()}
            className="flex flex-col gap-2.5"
          >
            <SectionHeader
              label={relativeDay(items[0].spentAt)}
              value={formatMoney(dayTotal, BASE_CURRENCY)}
            />

            {items.map((expense) => {
              const currency = asCurrency(expense.currency);

              return (
                <CostItem
                  key={expense.id}
                  icon={emojiFor(EXPENSE_CATEGORIES, expense.category)}
                  title={expense.description}
                  meta={clockTime(expense.spentAt)}
                  amount={formatMoney(expense.amountMinor, currency)}
                  // The Lira line is the one that counts against the budget, so
                  // it's shown whenever it isn't already the headline figure.
                  sub={
                    currency !== BASE_CURRENCY
                      ? formatMoney(expense.baseAmountMinor, BASE_CURRENCY)
                      : undefined
                  }
                  footer={
                    <>
                      {labelFor(EXPENSE_CATEGORIES, expense.category)}
                      {expense.note ? (
                        <>
                          <Dot />
                          {expense.note}
                        </>
                      ) : null}
                    </>
                  }
                  trailing={
                    <DeleteButton
                      label={`Delete ${expense.description}`}
                      onDelete={() => handleDelete(expense.id)}
                    />
                  }
                />
              );
            })}
          </section>
        );
      })}
    </>
  );
}
