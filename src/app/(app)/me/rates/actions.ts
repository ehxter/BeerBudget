"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { parseDecimal } from "@/lib/money";
import { clearManualRate, refreshAllRates, setManualRate } from "@/lib/rates/store";

export type ActionState = { error?: string; ok?: boolean };

/**
 * Sanity band for a hand-typed dollar price, in Toman.
 *
 * Wide enough to outlive a lot of drift, narrow enough to catch the two
 * mistakes that actually happen: a slipped decimal, and a figure copied off a
 * board that quotes Rial (ten times too big).
 */
const MIN_USD_TOMAN = 1_000;
const MAX_USD_TOMAN = 20_000_000;

const schema = z.object({
  tomanPerUsd: z.string().min(1, "Enter a rate"),
});

/**
 * Saves what one dollar costs in Toman.
 *
 * This is the only rate anyone is ever asked to type. Euro and Lira are then
 * cross rates off the dollar, which the FX providers know far better than a
 * person reading a shop window does.
 *
 * Saving does not flip the app over to using it — the toggle on Exchange does
 * that, and having two controls silently write the same setting is how you end
 * up not trusting either. Until then the number sits as the standby the store
 * falls back to when no provider can be reached at all.
 */
export async function saveManualUsdRate(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  }

  const tomanPerUsd = parseDecimal(parsed.data.tomanPerUsd);
  if (tomanPerUsd === null || tomanPerUsd <= 0) {
    return { error: "Enter a number, like 187800" };
  }
  if (tomanPerUsd < MIN_USD_TOMAN || tomanPerUsd > MAX_USD_TOMAN) {
    return { error: "That doesn't look like a Toman price for one dollar." };
  }

  await setManualRate("USD", tomanPerUsd);

  // Every screen prices something, so the whole tree is stale after this.
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function clearManualUsdRate(): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  await clearManualRate("USD");

  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Retries every provider from the Rates screen.
 *
 * Reports the two halves separately, because they fail for different reasons
 * and the fix is different: a dead Toman leg is what the manual rate below is
 * for, while a dead FX leg only means the cross rates are yesterday's.
 */
export async function retryProviders(): Promise<{ rates: boolean; fx: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { rates: false, fx: false };

  const result = await refreshAllRates({ timeoutMs: 12_000, force: true });

  revalidatePath("/", "layout");
  return result;
}
