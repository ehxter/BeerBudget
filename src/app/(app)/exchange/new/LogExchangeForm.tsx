"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addExchange, type ExchangeFormState } from "../actions";
import {
  Card,
  Field,
  Input,
  Textarea,
  FormError,
  SubmitButton,
  ChoiceChips,
} from "@/components/ui";
import { CURRENCIES, type CurrencyCode } from "@/lib/money";

const initialState: ExchangeFormState = {};

export function LogExchangeForm({ baseCurrency }: { baseCurrency: CurrencyCode }) {
  const router = useRouter();
  const [state, formAction] = useActionState(addExchange, initialState);

  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>(baseCurrency);
  const [toCurrency, setToCurrency] = useState<CurrencyCode>("TOMAN");

  useEffect(() => {
    if (state.ok) {
      router.push("/exchange");
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <form action={formAction} className="space-y-4">
      <FormError>{state.error}</FormError>

      <Card className="space-y-4">
        <div>
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">Gave</span>
          <div className="flex items-center gap-2">
            <Input
              name="fromAmount"
              inputMode="decimal"
              autoFocus
              required
              placeholder="100"
              className="flex-1"
            />
          </div>
          <div className="mt-2">
            <ChoiceChips
              name="fromCurrency"
              options={CURRENCIES.map((code) => ({
                value: code,
                label: code === "TOMAN" ? "Toman" : code,
              }))}
              value={fromCurrency}
              onChange={setFromCurrency}
              columns={4}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-surface-2">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">Received</span>
          <div className="flex items-center gap-2">
            <Input
              name="toAmount"
              inputMode="decimal"
              required
              placeholder="3400"
              className="flex-1"
            />
          </div>
          <div className="mt-2">
            <ChoiceChips
              name="toCurrency"
              options={CURRENCIES.map((code) => ({
                value: code,
                label: code === "TOMAN" ? "Toman" : code,
              }))}
              value={toCurrency}
              onChange={setToCurrency}
              columns={4}
            />
          </div>
        </div>
      </Card>

      <Field label="Location" hint="Optional">
        <Input name="location" placeholder="Grand Bazaar Exchange" maxLength={100} />
      </Field>

      <Field label="Note" hint="Optional">
        <Textarea name="note" placeholder="They gave a slightly better rate" maxLength={200} />
      </Field>

      <SubmitButton size="lg" className="w-full">
        Log Exchange
      </SubmitButton>
    </form>
  );
}
