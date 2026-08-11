"use client";

import { useActionState, useState } from "react";
import { addItineraryItem, type EventFormState } from "../../actions";
import { Field, Input, Textarea, FormError, SubmitButton, Chips } from "@/components/ui";
import { ITINERARY_CATEGORIES } from "@/lib/constants";
import { toDateInputValue } from "@/lib/format";
import { CURRENCIES, type CurrencyCode } from "@/lib/money";

const initialState: EventFormState = {};

export function AddEventForm({
  baseCurrency,
  tripStart,
}: {
  baseCurrency: CurrencyCode;
  tripStart: Date;
}) {
  const [state, formAction] = useActionState(addItineraryItem, initialState);
  const [category, setCategory] = useState<string>("ACTIVITY");
  const [currency, setCurrency] = useState<CurrencyCode>(baseCurrency);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormError>{state.error}</FormError>

      <Field label="Title">
        <Input name="title" required maxLength={120} placeholder="Hagia Sophia" autoFocus />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <Input
            type="date"
            name="day"
            required
            defaultValue={toDateInputValue(tripStart)}
          />
        </Field>
        <Field label="Time" hint="Optional.">
          <Input type="time" name="startTime" />
        </Field>
      </div>

      <Field label="Location" hint="Optional.">
        <Input name="location" maxLength={160} placeholder="Sultanahmet" />
      </Field>

      <div>
        <span className="mb-2 block text-label font-semibold uppercase text-ink-5">
          Category
        </span>
        <Chips
          name="category"
          options={ITINERARY_CATEGORIES.map((c) => ({
            value: c.value,
            label: c.label,
            emoji: c.emoji,
          }))}
          value={category}
          onChange={setCategory}
          columns={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Estimated cost" hint="Optional.">
          <Input name="estimatedCost" inputMode="decimal" placeholder="0" />
        </Field>
        <div>
          <span className="mb-2 block text-label font-semibold uppercase text-ink-5">
            Currency
          </span>
          <Chips
            name="estimatedCostCurrency"
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
        Save event
      </SubmitButton>
    </form>
  );
}
