"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { addExpense, type ExpenseFormState } from "../actions";
import {
  Card,
  CardLabel,
  Divider,
  Field,
  Input,
  Textarea,
  FormError,
  SubmitButton,
  Chips,
} from "@/components/ui";
import {
  CURRENCIES,
  CURRENCY_META,
  convertMinor,
  formatMoney,
  parseAmountToMinor,
  splitEqualMinor,
  type CurrencyCode,
} from "@/lib/money";
import { EXPENSE_CATEGORIES, SPLIT_METHODS } from "@/lib/constants";
import { toDateInputValue } from "@/lib/format";
import { cn } from "@/lib/cn";

type Member = { id: string; name: string };

const initialState: ExpenseFormState = {};

const CURRENCY_CHIPS = CURRENCIES.map((code) => ({
  value: code,
  label: code === "TOMAN" ? "TMN" : code,
}));

/**
 * Add Cost. Not a Figma frame — built from the same language: the 32px amount
 * treatment from the Exchange converter, chips for every choice, and a white
 * block button to commit.
 */
export function AddExpenseForm({
  self,
  partner,
  baseCurrency,
  tomanPerUnit,
}: {
  self: Member;
  partner: Member | null;
  baseCurrency: CurrencyCode;
  tomanPerUnit: Record<CurrencyCode, number>;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(addExpense, initialState);

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>(baseCurrency);
  const [category, setCategory] = useState<string>("FOOD");
  const [scope, setScope] = useState<"SHARED" | "PRIVATE">(
    partner ? "SHARED" : "PRIVATE",
  );
  const [paidById, setPaidById] = useState(self.id);
  const [splitMethod, setSplitMethod] = useState<string>("EQUAL");
  const [beneficiaryId, setBeneficiaryId] = useState(self.id);
  const [customSelf, setCustomSelf] = useState("");
  const [customPartner, setCustomPartner] = useState("");
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
    const to = tomanPerUnit[baseCurrency];
    if (!from || !to) return 1;
    return from / to;
  }, [currency, baseCurrency, tomanPerUnit]);

  const baseAmountMinor = convertMinor(amountMinor, currency, baseCurrency, rateToBase);

  // Mirror of the server's split maths, purely for the preview.
  const preview = (() => {
    if (amountMinor <= 0 || scope === "PRIVATE" || !partner) return null;

    if (splitMethod === "SINGLE") {
      const owner = beneficiaryId === self.id ? self : partner;
      return [{ name: owner.name, shareMinor: amountMinor }];
    }
    if (splitMethod === "CUSTOM") {
      return [
        { name: self.name, shareMinor: parseAmountToMinor(customSelf, currency) ?? 0 },
        {
          name: partner.name,
          shareMinor: parseAmountToMinor(customPartner, currency) ?? 0,
        },
      ];
    }
    const [mine, theirs] = splitEqualMinor(amountMinor, 2);
    return [
      { name: self.name, shareMinor: mine },
      { name: partner.name, shareMinor: theirs },
    ];
  })();;

  const customTotal =
    (parseAmountToMinor(customSelf, currency) ?? 0) +
    (parseAmountToMinor(customPartner, currency) ?? 0);
  const customMismatch =
    splitMethod === "CUSTOM" && amountMinor > 0 && customTotal !== amountMinor;

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

        {currency !== baseCurrency && amountMinor > 0 ? (
          <p className="tnum text-meta text-ink-4">
            ≈ {formatMoney(baseAmountMinor, baseCurrency)} at today&apos;s rate
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
        <span className="mb-2 block text-label font-semibold uppercase text-ink-5">
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

      {partner ? (
        <div>
          <span className="mb-2 block text-label font-semibold uppercase text-ink-5">
            Who is this for
          </span>
          <Chips
            name="scope"
            options={[
              { value: "SHARED", label: "Shared" },
              { value: "PRIVATE", label: "Private" },
            ]}
            value={scope}
            onChange={setScope}
            columns={2}
          />
          {scope === "PRIVATE" ? (
            <p className="mt-2 text-meta text-ink-4">
              Counts against your personal budget only. {partner.name} never
              sees it.
            </p>
          ) : null}
        </div>
      ) : (
        <input type="hidden" name="scope" value="PRIVATE" />
      )}

      {partner && scope === "SHARED" ? (
        <>
          <div>
            <span className="mb-2 block text-label font-semibold uppercase text-ink-5">
              Paid by
            </span>
            <Chips
              name="paidById"
              options={[
                { value: self.id, label: "Me" },
                { value: partner.id, label: partner.name },
              ]}
              value={paidById}
              onChange={setPaidById}
              columns={2}
            />
          </div>

          <div>
            <span className="mb-2 block text-label font-semibold uppercase text-ink-5">
              Split
            </span>
            <Chips
              name="splitMethod"
              options={SPLIT_METHODS.map((s) => ({ value: s.value, label: s.label }))}
              value={splitMethod}
              onChange={setSplitMethod}
              columns={3}
            />
          </div>

          {splitMethod === "SINGLE" ? (
            <div>
              <span className="mb-2 block text-label font-semibold uppercase text-ink-5">
                Belongs entirely to
              </span>
              <Chips
                name="beneficiaryId"
                options={[
                  { value: self.id, label: "Me" },
                  { value: partner.id, label: partner.name },
                ]}
                value={beneficiaryId}
                onChange={setBeneficiaryId}
                columns={2}
              />
            </div>
          ) : null}

          {splitMethod === "CUSTOM" ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Your share">
                <Input
                  name="customSelf"
                  value={customSelf}
                  onChange={(event) => setCustomSelf(event.target.value)}
                  inputMode="decimal"
                  placeholder="0"
                />
              </Field>
              <Field label={`${partner.name}'s share`}>
                <Input
                  name="customPartner"
                  value={customPartner}
                  onChange={(event) => setCustomPartner(event.target.value)}
                  inputMode="decimal"
                  placeholder="0"
                />
              </Field>
              {customMismatch ? (
                <p className="col-span-2 -mt-1 text-meta text-cat-6">
                  Shares add up to {formatMoney(customTotal, currency)}, but the
                  cost is {formatMoney(amountMinor, currency)}.
                </p>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}

      {preview ? (
        <Card pad={16} className="gap-3">
          <CardLabel>Split preview</CardLabel>
          <Divider soft />
          {preview.map((entry) => (
            <div key={entry.name} className="flex justify-between text-meta">
              <span className="text-ink-3">{entry.name}</span>
              <span className="tnum font-medium text-ink">
                {formatMoney(entry.shareMinor, currency)}
              </span>
            </div>
          ))}
        </Card>
      ) : null}

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

      <SubmitButton
        size="block"
        disabled={amountMinor <= 0 || customMismatch}
        pendingLabel="Saving…"
      >
        Save cost
      </SubmitButton>
    </form>
  );
}
