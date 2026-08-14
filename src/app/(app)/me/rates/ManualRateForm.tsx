"use client";

import { useActionState, useState, useTransition } from "react";
import {
  Button,
  Card,
  CardLabel,
  Divider,
  Field,
  FormError,
  Input,
  SubmitButton,
} from "@/components/ui";
import { CURRENCY_META, formatMoney, parseDecimal } from "@/lib/money";
import { clearManualUsdRate, saveManualUsdRate } from "./actions";

/** The currencies this screen shows as derived. Toman is the unit, not a row. */
const DERIVED = ["EUR", "TRY"] as const;

/**
 * The one rate anyone types.
 *
 * Only the dollar, on purpose. Euro and Lira are cross rates off it, and the
 * FX providers know those to four decimal places — asking a person to key in
 * three numbers would be three chances to introduce a discrepancy the app
 * would then have to pretend was real.
 *
 * The preview under the input updates as you type, so a slipped decimal shows
 * up as a Lira price that is obviously wrong before it is ever saved.
 */
export function ManualRateForm({
  savedUsdToman,
  providerUsdToman,
  usdPerUnit,
}: {
  /** What is stored now, if anything. */
  savedUsdToman: number | null;
  /** BrsApi's latest, offered as the starting point when nothing is saved. */
  providerUsdToman: number | null;
  /** USD per 1 unit, per currency, from the FX cache. */
  usdPerUnit: Record<string, number>;
}) {
  const [state, formAction] = useActionState(saveManualUsdRate, {});
  const [clearing, startClearing] = useTransition();
  const [value, setValue] = useState(savedUsdToman ? String(savedUsdToman) : "");

  const typed = parseDecimal(value);
  const anchor = typed !== null && typed > 0 ? typed : null;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormError>{state.error}</FormError>

      <Card pad={20}>
        <CardLabel>Dollar in Toman</CardLabel>

        <Field
          hint={
            providerUsdToman
              ? `Provider currently says ${formatMoney(providerUsdToman, "TOMAN", { bare: true })}`
              : "How much one US dollar costs, in Toman."
          }
        >
          <Input
            name="tomanPerUsd"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            inputMode="decimal"
            placeholder={providerUsdToman ? String(providerUsdToman) : "187800"}
            aria-label="Toman per US dollar"
            className="tnum"
            autoComplete="off"
          />
        </Field>

        <Divider />

        <div className="flex flex-col gap-2">
          <CardLabel>Everything else follows</CardLabel>

          {DERIVED.map((currency) => {
            const perUnit = usdPerUnit[currency];
            const derived = anchor && perUnit > 0 ? perUnit * anchor : null;

            return (
              <div key={currency} className="flex items-baseline justify-between gap-3">
                <span className="text-meta text-ink-4">
                  1 {CURRENCY_META[currency].label}
                </span>
                <span className="tnum text-row font-medium text-ink-2">
                  {derived
                    ? `${formatMoney(Math.round(derived), "TOMAN", { bare: true })} T`
                    : "—"}
                </span>
              </div>
            );
          })}

          {Object.keys(usdPerUnit).length === 0 ? (
            <p className="text-meta text-cat-6">
              No cross rates cached yet — Euro and Lira can&apos;t be derived until one
              of the currency providers is reachable.
            </p>
          ) : null}
        </div>
      </Card>

      <div className="flex items-center gap-2">
        <SubmitButton pendingLabel="Saving…">Save rate</SubmitButton>

        {savedUsdToman ? (
          <Button
            type="button"
            variant="quiet"
            disabled={clearing}
            onClick={() => {
              startClearing(async () => {
                await clearManualUsdRate();
                setValue("");
              });
            }}
          >
            {clearing ? "Clearing…" : "Clear"}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
