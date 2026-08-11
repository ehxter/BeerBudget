"use client";

import { useActionState, useState } from "react";
import { addPlace } from "../../actions";
import type { EventFormState } from "../../actions";
import { Field, Input, Textarea, FormError, SubmitButton, Chips } from "@/components/ui";
import { PLACE_CATEGORIES } from "@/lib/constants";
import { CURRENCIES, type CurrencyCode } from "@/lib/money";

const initialState: EventFormState = {};

export function AddPlaceForm({ baseCurrency }: { baseCurrency: CurrencyCode }) {
  const [state, formAction] = useActionState(addPlace, initialState);
  const [category, setCategory] = useState<string>("RESTAURANT");
  const [currency, setCurrency] = useState<CurrencyCode>(baseCurrency);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormError>{state.error}</FormError>

      <Field label="Name">
        <Input name="name" required maxLength={120} placeholder="Çukur Meyhane" autoFocus />
      </Field>

      <div>
        <span className="mb-2 block text-label font-semibold uppercase text-ink-5">
          Category
        </span>
        <Chips
          name="category"
          options={PLACE_CATEGORIES.map((c) => ({
            value: c.value,
            label: c.label,
            emoji: c.emoji,
          }))}
          value={category}
          onChange={setCategory}
          columns={3}
        />
      </div>

      <Field label="Address" hint="Optional.">
        <Input name="address" maxLength={200} placeholder="Nevizade Sk, Beyoğlu" />
      </Field>

      <Field label="Map link" hint="Optional.">
        <Input name="mapUrl" type="url" maxLength={500} placeholder="https://maps.google.com/…" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Estimated price" hint="Optional.">
          <Input name="estimatedPrice" inputMode="decimal" placeholder="0" />
        </Field>
        <div>
          <span className="mb-2 block text-label font-semibold uppercase text-ink-5">
            Currency
          </span>
          <Chips
            name="estimatedPriceCurrency"
            options={CURRENCIES.map((code) => ({
              value: code,
              label: code === "TOMAN" ? "TMN" : code,
            }))}
            value={currency}
            onChange={setCurrency}
            columns={2}
          />
        </div>
      </div>

      <Field label="Notes" hint="Optional.">
        <Textarea name="notes" maxLength={500} placeholder="Anything worth remembering" />
      </Field>

      <SubmitButton size="block" pendingLabel="Saving…">
        Save place
      </SubmitButton>
    </form>
  );
}
