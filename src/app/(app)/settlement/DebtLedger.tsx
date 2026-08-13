"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { Check, Plus, Undo2, X } from "lucide-react";
import {
  Card,
  CardButton,
  CardLabel,
  Divider,
  Field,
  Input,
  Chips,
  FormError,
  SubmitButton,
  SectionHeader,
  EmptyState,
  DeleteButton,
} from "@/components/ui";
import {
  BASE_CURRENCY,
  CURRENCIES,
  CURRENCY_META,
  asCurrency,
  formatMoney,
  type CurrencyCode,
} from "@/lib/money";
import { DEBT_DIRECTIONS } from "@/lib/constants";
import { netDebt } from "@/lib/debts";
import { relativeDay, toDateInputValue } from "@/lib/format";
import { addDebt, deleteDebt, setDebtSettled } from "./actions";
import { cn } from "@/lib/cn";

const CURRENCY_CHIPS = CURRENCIES.map((code) => ({
  value: code,
  label: code === "TOMAN" ? "TMN" : code,
}));

export type DebtRow = {
  id: string;
  direction: string;
  amountMinor: number;
  currency: string;
  baseAmountMinor: number;
  description: string | null;
  occurredAt: Date;
  settledAt: Date | null;
};

type OptimisticAction =
  | { type: "settle"; id: string; settled: boolean }
  | { type: "delete"; id: string };

/**
 * The debt ledger for your one travel companion.
 *
 * Nothing here is shared: there's no second account, no invite, and no sync.
 * It's a private note about money that is going to change hands, which is
 * exactly why the balance belongs in the budget — what you're owed is money
 * you'll get to spend, what you owe is already gone.
 *
 * Rendered in two places: its own Settlement screen, and the Settlement tab on
 * Spending. Both give it a header pill that opens the composer, which is why
 * `composing` is controlled by the caller rather than kept here — the pill
 * lives in the page header, outside this component entirely.
 */
export function DebtLedger({
  debts,
  composing,
  onComposingChange,
}: {
  debts: DebtRow[];
  composing: boolean;
  onComposingChange: (composing: boolean) => void;
}) {
  const [direction, setDirection] = useState<string>("THEY_OWE");
  const [currency, setCurrency] = useState<CurrencyCode>(BASE_CURRENCY);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const [, startTransition] = useTransition();

  /**
   * A plain form action rather than `useActionState`: closing the composer is
   * then something that happens in the submit handler, where setting state is
   * ordinary — not in an effect watching for a result to change.
   */
  async function handleAdd(formData: FormData) {
    const result = await addDebt({}, formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError("");
    formRef.current?.reset();
    onComposingChange(false);
  }

  const [optimistic, dispatch] = useOptimistic(
    debts,
    (current: DebtRow[], action: OptimisticAction) => {
      if (action.type === "delete") {
        return current.filter((row) => row.id !== action.id);
      }
      return current.map((row) =>
        row.id === action.id
          ? { ...row, settledAt: action.settled ? new Date() : null }
          : row,
      );
    },
  );

  function handleSettle(id: string, settled: boolean) {
    startTransition(async () => {
      dispatch({ type: "settle", id, settled });
      await setDebtSettled(id, settled);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      dispatch({ type: "delete", id });
      await deleteDebt(id);
    });
  }

  const open = optimistic.filter((row) => row.settledAt === null);
  const settled = optimistic.filter((row) => row.settledAt !== null);

  const balance = netDebt(open);
  const owedToYou = balance.netMinor > 0;
  const square = balance.netMinor === 0;

  return (
    <div className="flex flex-col gap-4">
      <Card pad={20}>
        <CardLabel>
          {square ? "All square" : owedToYou ? "Your friend owes you" : "You owe your friend"}
        </CardLabel>

        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "tnum text-display font-bold",
              square ? "text-ink" : owedToYou ? "text-cat-4" : "text-cat-6",
            )}
          >
            {formatMoney(Math.abs(balance.netMinor), BASE_CURRENCY, { bare: true })}
          </span>
          <span className="text-meta font-semibold text-ink-5">
            {CURRENCY_META[BASE_CURRENCY].unit}
          </span>
        </div>

        <Divider />

        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between text-meta">
            <span className="text-ink-3">They owe you</span>
            <span className="tnum font-medium text-cat-4">
              {formatMoney(balance.theyOweMinor, BASE_CURRENCY)}
            </span>
          </div>
          <div className="flex items-baseline justify-between text-meta">
            <span className="text-ink-3">You owe them</span>
            <span className="tnum font-medium text-cat-6">
              {formatMoney(balance.iOweMinor, BASE_CURRENCY)}
            </span>
          </div>
        </div>

        <p className="text-label leading-relaxed text-ink-5">
          {square
            ? "This balance is added to your budget on Home — nothing to add right now."
            : owedToYou
              ? "Added to your budget on Home, since it's money coming back to you."
              : "Taken off your budget on Home, since it's money already spoken for."}{" "}
          Kept in Lira at the rate on the day you logged each one.
        </p>
      </Card>

      {composing ? (
        <form ref={formRef} action={handleAdd} className="animate-rise flex flex-col gap-4">
          <FormError>{error}</FormError>

          <Card pad={20}>
            <div className="flex items-center justify-between">
              <CardLabel>New debt</CardLabel>
              <button
                type="button"
                onClick={() => onComposingChange(false)}
                aria-label="Cancel"
                className="text-ink-4 active:text-ink"
              >
                <X size={16} />
              </button>
            </div>

            <Chips
              name="direction"
              options={DEBT_DIRECTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              value={direction}
              onChange={setDirection}
              columns={2}
            />

            <Input
              name="amount"
              inputMode="decimal"
              placeholder="500"
              required
              autoFocus
              autoComplete="off"
              aria-label="Amount"
            />

            <Chips
              name="currency"
              options={CURRENCY_CHIPS}
              value={currency}
              onChange={setCurrency}
              columns={4}
            />

            <Input
              name="description"
              maxLength={120}
              placeholder="What it was for (optional)"
              autoComplete="off"
              aria-label="Description"
            />

            <Field label="Date">
              <Input type="date" name="date" defaultValue={toDateInputValue(new Date())} />
            </Field>
          </Card>

          <SubmitButton size="block" pendingLabel="Saving…">
            Save debt
          </SubmitButton>
        </form>
      ) : (
        // Duplicates the header pill on purpose: by the time you've scrolled
        // through the ledger, the header is off screen.
        <CardButton type="button" onClick={() => onComposingChange(true)}>
          <Plus size={16} />
          Add debt
        </CardButton>
      )}

      {open.length === 0 && settled.length === 0 ? (
        <EmptyState
          icon={<span className="text-base">🤝</span>}
          title="Nothing outstanding"
          description="Log what you covered for your friend, or what they covered for you, and it moves your budget."
        />
      ) : null}

      {open.length > 0 ? (
        <section className="flex flex-col gap-2.5">
          <SectionHeader label="Outstanding" value={`${open.length}`} />
          <div className="flex flex-col gap-3">
            {open.map((debt) => (
              <DebtItem
                key={debt.id}
                debt={debt}
                onSettle={() => handleSettle(debt.id, true)}
                onDelete={() => handleDelete(debt.id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {settled.length > 0 ? (
        <section className="flex flex-col gap-2.5">
          <SectionHeader label="Settled" value={`${settled.length}`} />
          <div className="flex flex-col gap-3">
            {settled.map((debt) => (
              <DebtItem
                key={debt.id}
                debt={debt}
                onSettle={() => handleSettle(debt.id, false)}
                onDelete={() => handleDelete(debt.id)}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function DebtItem({
  debt,
  onSettle,
  onDelete,
}: {
  debt: DebtRow;
  onSettle: () => void;
  onDelete: () => void;
}) {
  const currency = asCurrency(debt.currency);
  const theyOwe = debt.direction !== "I_OWE";
  const isSettled = debt.settledAt !== null;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-card bg-card p-4",
        isSettled && "opacity-55",
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-row font-medium text-ink">
            {debt.description || (theyOwe ? "They owe you" : "You owe them")}
          </p>
          <p className="mt-1.5 truncate text-meta text-ink-4">
            {relativeDay(debt.occurredAt)}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p
            className={cn(
              "tnum text-row font-bold",
              isSettled ? "text-ink-4" : theyOwe ? "text-cat-4" : "text-cat-6",
            )}
          >
            {theyOwe ? "+" : "−"}
            {formatMoney(debt.amountMinor, currency)}
          </p>
          {currency !== BASE_CURRENCY ? (
            <p className="tnum mt-0.5 text-meta text-ink-4">
              {formatMoney(debt.baseAmountMinor, BASE_CURRENCY)}
            </p>
          ) : null}
        </div>
      </div>

      <Divider />

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onSettle}
          className="flex items-center gap-1.5 text-meta font-medium text-ink-4 active:text-ink"
        >
          {isSettled ? (
            <>
              <Undo2 size={14} />
              Reopen
            </>
          ) : (
            <>
              <Check size={14} />
              Mark settled
            </>
          )}
        </button>

        <DeleteButton
          label={`Delete ${debt.description || "debt"}`}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
