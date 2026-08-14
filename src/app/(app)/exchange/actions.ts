"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CURRENCIES, parseAmountToMinor, toMajor } from "@/lib/money";
import { refreshAllRates, setRateMode } from "@/lib/rates/store";
import { revalidatePath } from "next/cache";

/** How long a hand-pressed refresh will wait before giving up. Longer than
 *  the 4s a page render allows itself: someone is watching this one, and a
 *  spinner that resolves late beats one that gives up early. */
const MANUAL_REFRESH_TIMEOUT_MS = 12_000;

/**
 * Pulls fresh reference rates from the providers on demand.
 *
 * Rates refresh on their own every 10 minutes, but "on their own" is no help
 * standing at a counter watching a number you don't believe. This forces the
 * fetch regardless of how fresh the cache thinks it is, and past the cooldown
 * a recent failure would otherwise impose — a deliberate press is exactly the
 * moment to find out whether the provider is back.
 *
 * Returns rather than throws when a provider is unreachable — the store keeps
 * serving the last good numbers, and the UI says so instead of blanking.
 * Concurrent presses share one upstream call; the store dedupes them.
 *
 * Only the Toman leg has to succeed for this to count. The cross rates come
 * from three interchangeable providers and barely move day to day, so a failure
 * there is not something to report to someone standing at a counter.
 */
export async function refreshReferenceRates(): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  const { rates } = await refreshAllRates({
    timeoutMs: MANUAL_REFRESH_TIMEOUT_MS,
    force: true,
  });

  revalidatePath("/exchange");
  revalidatePath("/me/rates");
  return { ok: rates };
}

/**
 * Flips who owns the dollar's Toman price: the provider, or the traveler.
 *
 * `automatic` is the switch position — on means BrsApi, off means the number
 * saved on the Rates screen. Every page that prices anything is revalidated,
 * because this changes what a budget or an expense converts to app-wide.
 */
export async function setRateSource(automatic: boolean): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  await setRateMode(automatic ? "AUTO" : "MANUAL");

  revalidatePath("/", "layout");
  return { ok: true };
}

export type ExchangeFormState = {
  error?: string;
  ok?: boolean;
};

const exchangeSchema = z.object({
  fromAmount: z.string().min(1, "Amount is required"),
  fromCurrency: z.enum(CURRENCIES),
  toAmount: z.string().min(1, "Received amount is required"),
  toCurrency: z.enum(CURRENCIES),
  location: z.string().trim().max(120).optional(),
  note: z.string().trim().max(500).optional(),
});

export async function addExchange(
  _previous: ExchangeFormState,
  formData: FormData,
): Promise<ExchangeFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const parsed = exchangeSchema.safeParse({
    fromAmount: formData.get("fromAmount"),
    fromCurrency: formData.get("fromCurrency"),
    toAmount: formData.get("toAmount"),
    toCurrency: formData.get("toCurrency"),
    location: formData.get("location"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return { error: "Check your inputs and try again." };
  }

  const { fromAmount, fromCurrency, toAmount, toCurrency, location, note } = parsed.data;

  const fromAmountMinor = parseAmountToMinor(fromAmount, fromCurrency);
  const toAmountMinor = parseAmountToMinor(toAmount, toCurrency);

  if (!fromAmountMinor || fromAmountMinor <= 0) {
    return { error: "Please enter a valid amount." };
  }
  if (!toAmountMinor || toAmountMinor <= 0) {
    return { error: "Please enter a valid received amount." };
  }
  if (fromCurrency === toCurrency) {
    return { error: "Currencies must be different." };
  }

  // Rate in major units — toMajor knows each currency's decimals, which is
  // what keeps a Toman leg (no subunit) from being off by a factor of 100.
  const effectiveRate =
    toMajor(toAmountMinor, toCurrency) / toMajor(fromAmountMinor, fromCurrency);

  try {
    await prisma.exchangeTransaction.create({
      data: {
        userId: user.id,
        fromCurrency,
        toCurrency,
        fromAmountMinor,
        toAmountMinor,
        effectiveRate,
        location: location || null,
        note: note || null,
        occurredAt: new Date(),
      },
      select: { id: true },
    });

    revalidatePath("/exchange");
    return { ok: true };
  } catch (error) {
    console.error("[exchange] create failed:", error);
    return { error: "Failed to save exchange transaction." };
  }
}
