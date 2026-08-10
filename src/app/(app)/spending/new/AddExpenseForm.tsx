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
  ChoiceChips,
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

export function AddExpenseForm({
  self,
  partner,
  baseCurrency,
  tomanPerUnit,
}: {
  self: Member;
  partner: Member | null;
  baseCurrency: CurrencyCode;
  /** Toman-anchored rate table, for the live base-currency preview. */
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
      const mine = parseAmountToMinor(customSelf, currency) ?? 0;
      const theirs = parseAmountToMinor(customPartner, currency) ?? 0;
      return [
        { name: self.name, shareMinor: mine },
        { name: partner.name, shareMinor: theirs },
      ];
    }

    const [mine, theirs] = splitEqualMinor(amountMinor, 2);
    return [
      { name: self.name, shareMinor: mine },
      { name: partner.name, shareMinor: theirs },
    ];
  })();

  const customTotal =
    (parseAmountToMinor(customSelf, currency) ?? 0) +
    (parseAmountToMinor(customPartner, currency) ?? 0);
  const customMismatch =
    splitMethod === "CUSTOM" && amountMinor > 0 && customTotal !== amountMinor;

  return (
    <form action={formAction} className="space-y-4">
      <FormError>{state.error}</FormError>

      {/* Amount — the first and largest thing on screen. */}
      <Card className="pb-4">
        <div className="flex items-baseline gap-2">
          {CURRENCY_META[currency].position === "prefix" ? (
            <span className="text-3xl font-semibold text-ink-faint">
              {CURRENCY_META[currency].symbol}
            </span>
          ) : null}
          <input
            name="amount"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            autoFocus
            required
            placeholder="0"
            aria-label="Amount"
            className="tnum w-full min-w-0 bg-transparent text-4xl font-bold tracking-tight text-ink outline-none placeholder:text-ink-faint/40"
          />
          {CURRENCY_META[currency].position === "suffix" ? (
            <span className="text-2xl font-semibold text-ink-faint">
              {CURRENCY_META[currency].symbol}
            </span>
          ) : null}
        </div>

        {currency !== baseCurrency && amountMinor > 0 ? (
          <p className="tnum mt-1.5 text-xs text-ink-faint">
            ≈ {formatMoney(baseAmountMinor, baseCurrency)} at today&apos;s rate
          </p>
        ) : null}

        <div className="mt-4">
          <ChoiceChips
            name="currency"
            options={CURRENCIES.map((code) => ({
              value: code,
              label: code === "TOMAN" ? "Toman" : code,
            }))}
            value={currency}
            onChange={setCurrency}
            columns={4}
          />
        </div>
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
        <span className="mb-1.5 block text-xs font-medium text-ink-muted">Category</span>
        <ChoiceChips
          name="category"
          options={EXPENSE_CATEGORIES}
          value={category}
          onChange={setCategory}
          columns={4}
        />
      </div>

      {/* Shared vs private */}
      {partner ? (
        <div>
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">
            Who is this for
          </span>
          <ChoiceChips
            name="scope"
            options={[
              { value: "SHARED", label: "Shared" },
              { value: "PRIVATE", label: "Just me (private)" },
            ]}
            value={scope}
            onChange={setScope}
            columns={2}
          />
          {scope === "PRIVATE" ? (
            <p className="mt-1.5 text-xs text-ink-faint">
              Private expenses count against your personal budget only.{" "}
              {partner.name} will never see them.
            </p>
          ) : null}
        </div>
      ) : (
        <input type="hidden" name="scope" value="PRIVATE" />
      )}

      {/* Paid by + split — only meaningful for shared expenses */}
      {partner && scope === "SHARED" ? (
        <>
          <div>
            <span className="mb-1.5 block text-xs font-medium text-ink-muted">
              Paid by
            </span>
            <ChoiceChips
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
            <span className="mb-1.5 block text-xs font-medium text-ink-muted">Split</span>
            <ChoiceChips
              name="splitMethod"
              options={SPLIT_METHODS}
              value={splitMethod}
              onChange={setSplitMethod}
              columns={3}
            />
          </div>

          {splitMethod === "SINGLE" ? (
            <div>
              <span className="mb-1.5 block text-xs font-medium text-ink-muted">
                Belongs entirely to
              </span>
              <ChoiceChips
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
                <p className="col-span-2 -mt-1 text-xs text-negative">
                  Shares add up to {formatMoney(customTotal, currency)}, but the
                  expense is {formatMoney(amountMinor, currency)}.
                </p>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}

      {/* Live split preview */}
      {preview ? (
        <Card className="space-y-2 bg-surface-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
            Split preview
          </p>
          {preview.map((entry) => (
            <div key={entry.name} className="flex justify-between text-sm">
              <span className="text-ink-muted">{entry.name}</span>
              <span className="tnum font-semibold text-ink">
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
        className="flex w-full items-center justify-center gap-1 py-1 text-xs font-medium text-ink-faint"
      >
        {showMore ? "Fewer options" : "Date & note"}
        <ChevronDown
          size={14}
          className={cn("transition-transform", showMore && "rotate-180")}
        />
      </button>

      {showMore ? (
        <div className="animate-rise space-y-4">
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
        size="lg"
        className="w-full"
        disabled={amountMinor <= 0 || customMismatch}
        pendingLabel="Saving…"
      >
        Save expense
      </SubmitButton>
    </form>
  );
}
