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
import { formatMoney, toMajor, CURRENCY_META, type CurrencyCode, CURRENCIES } from "@/lib/money";
import { updateBudget } from "./actions";

export function BudgetTracker({
  budgetMinor,
  budgetCurrency,
  spentMinor,
  startOpen = false,
}: {
  budgetMinor: number;
  budgetCurrency: CurrencyCode;
  /** Already converted into budgetCurrency by the page. */
  spentMinor: number;
  /** Opens the editor immediately — the header "Add Budget" pill sets this. */
  startOpen?: boolean;
}) {
  const hasBudget = budgetMinor > 0;
  const [isEditing, setIsEditing] = useState(!hasBudget || startOpen);
  const [currency, setCurrency] = useState<CurrencyCode>(budgetCurrency);
  const [state, formAction] = useActionState(updateBudget, {});

  if (isEditing) {
    return (
      <form action={formAction} className="flex flex-col gap-4">
        <FormError>{state.error}</FormError>

        <Card pad={20}>
          <div className="flex items-center justify-between">
            <CardLabel>Personal budget</CardLabel>
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
            defaultValue={hasBudget ? String(toMajor(budgetMinor, budgetCurrency)) : ""}
            placeholder="500"
            required
            autoComplete="off"
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
        </Card>

        <SubmitButton size="block" pendingLabel="Saving…">
          Save budget
        </SubmitButton>
      </form>
    );
  }

  const remaining = budgetMinor - spentMinor;
  const overBudget = remaining < 0;
  const percent = budgetMinor > 0 ? (spentMinor / budgetMinor) * 100 : 0;

  return (
    <div className="flex flex-col gap-4">
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
            className={`tnum text-figure font-semibold ${overBudget ? "text-cat-6" : "text-ink"}`}
          >
            {formatMoney(Math.abs(remaining), budgetCurrency, { bare: true })}
          </span>
          <span className="text-meta font-semibold text-ink-5">
            {CURRENCY_META[budgetCurrency].unit}
          </span>
        </div>

        <ProgressBar
          percent={percent}
          tone={overBudget ? "negative" : "positive"}
          label="Personal budget consumed"
        />

        <div className="flex items-center justify-between text-label font-medium text-ink-3">
          <span className="tnum">
            {formatMoney(spentMinor, budgetCurrency, { bare: true })} Spent
          </span>
          <span className="tnum">
            {formatMoney(budgetMinor, budgetCurrency, { bare: true })} Total
          </span>
        </div>

        <Divider soft />

        <p className="text-label leading-relaxed text-ink-5">
          Only you can see this. Private costs never appear in the shared budget
          or the settlement balance.
        </p>
      </Card>
    </div>
  );
}
