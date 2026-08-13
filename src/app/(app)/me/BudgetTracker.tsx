"use client";

import { useActionState, useState } from "react";
import { Pencil, X } from "lucide-react";
import {
  Card,
  CardLabel,
  Divider,
  ProgressBar,
  Input,
  Chips,
  SubmitButton,
  FormError,
} from "@/components/ui";
import {
  BASE_CURRENCY,
  CURRENCIES,
  CURRENCY_META,
  formatMoney,
  toMajor,
  type CurrencyCode,
} from "@/lib/money";
import { updateBudget } from "./actions";
import { cn } from "@/lib/cn";

/**
 * The budget editor.
 *
 * You can type the budget in any of the four currencies, but everything below
 * the input is Lira — because that's what it becomes the moment it's saved,
 * and showing it back in dollars would hide the conversion until it surprised
 * you on Home.
 */
export function BudgetTracker({
  budgetMinor,
  enteredMinor,
  enteredCurrency,
  spentMinor,
  debtMinor,
  startOpen = false,
}: {
  /** The budget in Lira — the figure that counts. */
  budgetMinor: number;
  /** What was typed, in the currency it was typed in. */
  enteredMinor: number;
  enteredCurrency: CurrencyCode;
  /** All spending ever, in Lira. */
  spentMinor: number;
  /** Net unsettled debt in Lira: positive is owed to you. */
  debtMinor: number;
  /** Opens the editor immediately — the header "Add Budget" pill sets this. */
  startOpen?: boolean;
}) {
  const hasBudget = budgetMinor > 0;
  const [isEditing, setIsEditing] = useState(!hasBudget || startOpen);
  const [currency, setCurrency] = useState<CurrencyCode>(enteredCurrency);
  const [state, formAction] = useActionState(updateBudget, {});

  if (isEditing) {
    return (
      <form action={formAction} className="flex flex-col gap-4">
        <FormError>{state.error}</FormError>

        <Card pad={20}>
          <div className="flex items-center justify-between">
            <CardLabel>Your budget</CardLabel>
            {hasBudget ? (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                aria-label="Cancel"
                className="text-ink-4 active:text-ink"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>

          <Input
            name="amount"
            inputMode="decimal"
            defaultValue={
              enteredMinor > 0 ? String(toMajor(enteredMinor, enteredCurrency)) : ""
            }
            placeholder="500"
            required
            autoComplete="off"
            aria-label="Budget amount"
          />

          <Chips
            name="currency"
            options={CURRENCIES.map((code) => ({
              value: code,
              label: code === "TOMAN" ? "TMN" : code,
            }))}
            value={currency}
            onChange={setCurrency}
            columns={4}
          />

          {currency !== BASE_CURRENCY ? (
            <p className="text-label leading-relaxed text-ink-5">
              Converted to Lira at today&apos;s rate when you save, and kept at that
              value — Lira is the currency the app counts in.
            </p>
          ) : null}
        </Card>

        <SubmitButton size="block" pendingLabel="Saving…">
          Save budget
        </SubmitButton>
      </form>
    );
  }

  const effectiveBudget = budgetMinor + debtMinor;
  const remaining = effectiveBudget - spentMinor;
  const overBudget = remaining < 0;
  const percent = effectiveBudget > 0 ? (spentMinor / effectiveBudget) * 100 : 0;

  return (
    <Card pad={20}>
      <div className="flex items-center justify-between">
        <CardLabel>{overBudget ? "Over budget" : "Budget left"}</CardLabel>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          aria-label="Edit budget"
          className="text-ink-4 active:text-ink"
        >
          <Pencil size={14} />
        </button>
      </div>

      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "tnum text-display font-semibold",
            overBudget ? "text-cat-6" : "text-ink",
          )}
        >
          {formatMoney(Math.abs(remaining), BASE_CURRENCY, { bare: true })}
        </span>
        <span className="text-meta font-semibold text-ink-5">
          {CURRENCY_META[BASE_CURRENCY].unit}
        </span>
      </div>

      <ProgressBar
        percent={percent}
        tone={overBudget ? "negative" : "positive"}
        label="Budget consumed"
      />

      <div className="flex items-center justify-between text-label font-medium text-ink-3">
        <span className="tnum">
          {formatMoney(spentMinor, BASE_CURRENCY, { bare: true })} Spent
        </span>
        <span className="tnum">
          {formatMoney(effectiveBudget, BASE_CURRENCY, { bare: true })} Total
        </span>
      </div>

      <Divider soft />

      <div className="flex flex-col gap-2 text-label text-ink-5">
        <div className="flex items-center justify-between">
          <span>Budget set</span>
          <span className="tnum">
            {formatMoney(budgetMinor, BASE_CURRENCY)}
            {enteredCurrency !== BASE_CURRENCY ? (
              <> · entered as {formatMoney(enteredMinor, enteredCurrency)}</>
            ) : null}
          </span>
        </div>

        {debtMinor !== 0 ? (
          <div className="flex items-center justify-between">
            <span>{debtMinor > 0 ? "Owed to you" : "You owe"}</span>
            <span className={cn("tnum", debtMinor > 0 ? "text-cat-4" : "text-cat-6")}>
              {debtMinor > 0 ? "+" : "−"}
              {formatMoney(Math.abs(debtMinor), BASE_CURRENCY)}
            </span>
          </div>
        ) : null}

        <p className="leading-relaxed">
          Every cost you record counts against this, in any currency. It never
          resets.
        </p>
      </div>
    </Card>
  );
}
