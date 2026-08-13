"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { addExpense, type ExpenseFormState } from "../actions";
import {
  Card,
  Field,
  Input,
  Textarea,
  FormError,
  SubmitButton,
  Chips,
} from "@/components/ui";
import {
  BASE_CURRENCY,
  CURRENCIES,
  CURRENCY_META,
  convertMinor,
  formatMoney,
  parseAmountToMinor,
  type CurrencyCode,
} from "@/lib/money";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { toDateInputValue } from "@/lib/format";
import { cn } from "@/lib/cn";

const initialState: ExpenseFormState = {};

const CURRENCY_CHIPS = CURRENCIES.map((code) => ({
  value: code,
  label: code === "TOMAN" ? "TMN" : code,
}));

/**
 * Add Cost: an amount, what it was for, and a category. Nothing else is
 * required, because there is nobody to split it with.
 *
 * Pay in another currency and the Lira equivalent is previewed live from the
 * same rate table the server will freeze onto the row — so the number shown
 * here is the number that lands in the budget.
 */
export function AddExpenseForm({
  tomanPerUnit,
}: {
  tomanPerUnit: Record<CurrencyCode, number>;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(addExpense, initialState);

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>(BASE_CURRENCY);
  const [category, setCategory] = useState<string>("FOOD");
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    if (state.ok) {
      router.push("/spending");
      router.refresh();
    }
  }, [state.ok, router]);

  const amountMinor = parseAmountToMinor(amount, currency) ?? 0;

  const rateToBase = useMemo(() => {
    const from = tomanPerUnit[currency];
    const to = tomanPerUnit[BASE_CURRENCY];
    if (!from || !to) return 1;
    return from / to;
  }, [currency, tomanPerUnit]);

  const baseAmountMinor = convertMinor(amountMinor, currency, BASE_CURRENCY, rateToBase);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormError>{state.error}</FormError>

      <Card pad={16}>
        <div className="flex items-baseline gap-1.5 py-1">
          <span className="text-display font-bold text-ink-5">
            {CURRENCY_META[currency].symbol}
          </span>
          <input
            name="amount"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            autoFocus
            required
            placeholder="0"
            aria-label="Amount"
            className="tnum w-full min-w-0 bg-transparent text-display font-bold text-ink outline-none placeholder:text-ink-5"
          />
        </div>

        {currency !== BASE_CURRENCY && amountMinor > 0 ? (
          <p className="tnum text-meta text-ink-4">
            Recorded as {formatMoney(baseAmountMinor, BASE_CURRENCY)} at today&apos;s
            rate
          </p>
        ) : null}

        <Chips
          name="currency"
          options={CURRENCY_CHIPS}
          value={currency}
          onChange={setCurrency}
          columns={4}
        />
      </Card>

      <Field label="Description">
        <Input
          name="description"
          required
          maxLength={120}
          placeholder="Dinner at Karaköy"
          autoComplete="off"
        />
      </Field>

      <div>
        <span className="mb-2 block text-caps font-semibold uppercase text-ink-5">
          Category
        </span>
        <Chips
          name="category"
          options={EXPENSE_CATEGORIES.map((c) => ({
            value: c.value,
            label: c.short,
            emoji: c.emoji,
          }))}
          value={category}
          onChange={setCategory}
          columns={3}
        />
      </div>

      {/* Everything optional lives behind one tap. */}
      <button
        type="button"
        onClick={() => setShowMore((value) => !value)}
        className="flex w-full items-center justify-center gap-1 py-1 text-meta font-medium text-ink-4"
      >
        {showMore ? "Fewer options" : "Date & note"}
        <ChevronDown
          size={14}
          className={cn("transition-transform", showMore && "rotate-180")}
        />
      </button>

      {showMore ? (
        <div className="animate-rise flex flex-col gap-4">
          <Field label="Date">
            <Input type="date" name="date" defaultValue={toDateInputValue(new Date())} />
          </Field>
          <Field label="Note" hint="Optional.">
            <Textarea name="note" maxLength={500} placeholder="Anything worth remembering" />
          </Field>
        </div>
      ) : (
        <input type="hidden" name="date" value={toDateInputValue(new Date())} />
      )}

      <SubmitButton size="block" disabled={amountMinor <= 0} pendingLabel="Saving…">
        Save cost
      </SubmitButton>
    </form>
  );
}
