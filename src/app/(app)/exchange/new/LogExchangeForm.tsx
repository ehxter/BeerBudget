"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addExchange, type ExchangeFormState } from "../actions";
import {
  Card,
  CardLabel,
  Divider,
  Field,
  Input,
  FormError,
  SubmitButton,
  Chips,
} from "@/components/ui";
import {
  CURRENCIES,
  formatRate,
  parseAmountToMinor,
  toMajor,
  type CurrencyCode,
} from "@/lib/money";

const CHIPS = CURRENCIES.map((code) => ({
  value: code,
  label: code === "TOMAN" ? "TMN" : code,
}));

const initialState: ExchangeFormState = {};

export function LogExchangeForm({
  baseCurrency,
  tomanPerUnit,
}: {
  baseCurrency: CurrencyCode;
  tomanPerUnit: Record<CurrencyCode, number>;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(addExchange, initialState);

  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>("USD");
  const [toCurrency, setToCurrency] = useState<CurrencyCode>(baseCurrency);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");

  useEffect(() => {
    if (state.ok) {
      router.push("/exchange");
      router.refresh();
    }
  }, [state.ok, router]);

  const fromMinor = parseAmountToMinor(fromAmount, fromCurrency) ?? 0;
  const toMinor = parseAmountToMinor(toAmount, toCurrency) ?? 0;

  // What you actually got, versus the reference rate right now.
  const effective =
    fromMinor > 0 && toMinor > 0
      ? toMajor(toMinor, toCurrency) / toMajor(fromMinor, fromCurrency)
      : 0;

  const reference =
    tomanPerUnit[fromCurrency] && tomanPerUnit[toCurrency]
      ? tomanPerUnit[fromCurrency] / tomanPerUnit[toCurrency]
      : 0;

  const difference =
    effective > 0 && reference > 0 ? ((effective - reference) / reference) * 100 : null;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormError>{state.error}</FormError>

      <Card pad={16}>
        <CardLabel>You gave</CardLabel>
        <Input
          name="fromAmount"
          value={fromAmount}
          onChange={(event) => setFromAmount(event.target.value)}
          inputMode="decimal"
          required
          placeholder="300"
        />
        <Chips
          name="fromCurrency"
          options={CHIPS}
          value={fromCurrency}
          onChange={setFromCurrency}
          columns={4}
        />
      </Card>

      <Card pad={16}>
        <CardLabel>You received</CardLabel>
        <Input
          name="toAmount"
          value={toAmount}
          onChange={(event) => setToAmount(event.target.value)}
          inputMode="decimal"
          required
          placeholder="11760"
        />
        <Chips
          name="toCurrency"
          options={CHIPS}
          value={toCurrency}
          onChange={setToCurrency}
          columns={4}
        />
      </Card>

      {effective > 0 ? (
        <Card pad={16} className="gap-3">
          <CardLabel>Rate you got</CardLabel>
          <div className="flex items-baseline gap-2">
            <span className="tnum text-figure font-bold text-ink">
              {formatRate(effective)}
            </span>
            <span className="text-meta text-ink-5">
              {toCurrency === "TOMAN" ? "TMN" : toCurrency}/
              {fromCurrency === "TOMAN" ? "TMN" : fromCurrency}
            </span>
          </div>

          {difference !== null ? (
            <>
              <Divider soft />
              <div className="flex items-baseline justify-between text-meta">
                <span className="text-ink-3">
                  Reference {formatRate(reference)}
                </span>
                <span
                  className={`tnum font-medium ${
                    difference < 0 ? "text-cat-6" : "text-cat-4"
                  }`}
                >
                  {difference > 0 ? "+" : ""}
                  {difference.toFixed(1)}%
                </span>
              </div>
              <p className="text-label leading-relaxed text-ink-5">
                A comparison against the cached reference rate, not advice.
              </p>
            </>
          ) : null}
        </Card>
      ) : null}

      <Field label="Where">
        <Input name="location" maxLength={120} placeholder="Grand Bazaar exchange" />
      </Field>

      <SubmitButton
        size="block"
        disabled={fromMinor <= 0 || toMinor <= 0 || fromCurrency === toCurrency}
        pendingLabel="Saving…"
      >
        Save exchange
      </SubmitButton>
    </form>
  );
}
