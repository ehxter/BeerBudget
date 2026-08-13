import "server-only";

import { BASE_CURRENCY, convertMinor, type CurrencyCode } from "@/lib/money";
import { getRateTable, rateFromTable } from "@/lib/rates/store";

/**
 * The one way an amount becomes Lira.
 *
 * Every table that holds money stores what was actually paid *and* the Lira
 * equivalent, frozen together with the rate used. Freezing is the point: a
 * dinner paid in dollars keeps the same Lira value forever, so yesterday's
 * budget doesn't move because the market did overnight.
 */
export async function toBase(
  amountMinor: number,
  currency: CurrencyCode,
  /** An explicit rate to use instead of today's reference — e.g. the rate the
   *  traveler actually got at the exchange counter. */
  rateOverride?: number,
): Promise<{ baseAmountMinor: number; rateToBase: number }> {
  let rateToBase = rateOverride;

  if (!rateToBase || !Number.isFinite(rateToBase) || rateToBase <= 0) {
    rateToBase = rateFromTable(await getRateTable(), currency, BASE_CURRENCY);
  }
  // A currency with no usable rate would otherwise silently zero the amount.
  if (!Number.isFinite(rateToBase) || rateToBase <= 0) rateToBase = 1;

  return {
    baseAmountMinor: convertMinor(amountMinor, currency, BASE_CURRENCY, rateToBase),
    rateToBase,
  };
}
