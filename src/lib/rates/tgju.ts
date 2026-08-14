import type { CurrencyCode } from "@/lib/money";
import type { ExchangeRateProvider, TomanRates } from "./provider";

/**
 * TGJU — the Tehran market feed the rest of the Iranian price sites quote.
 *
 * The live JSON behind tgju.org, keyed by symbol:
 *   { "current": { "price_dollar_rl": { "p": "1,878,000", "h": …, "l": … }, … } }
 *
 * Two things to know about the shape. Prices are strings with thousands
 * separators, and they are in **Rial** — the `_rl` suffix on the dollar symbol
 * is the giveaway. Everything in this app is Toman, so each one is divided by
 * ten on the way in; getting that wrong inflates every figure in the app by a
 * factor of ten, which is why it is asserted rather than assumed below.
 *
 * No API key, no User-Agent requirement, no rate limit observed — which is
 * what makes it a better primary than BrsApi, whose key is one more thing that
 * can quietly expire. Note the two agree to the Rial, so this is a second
 * route to the same numbers rather than a second opinion about them.
 */

const SYMBOLS: Record<string, CurrencyCode> = {
  price_dollar_rl: "USD",
  price_eur: "EUR",
  price_try: "TRY",
};

/** 1 Toman = 10 Rial. The whole app is Toman; IRR never escapes this file. */
const RIAL_PER_TOMAN = 10;

type TgjuEntry = { p?: unknown };

export class TgjuProvider implements ExchangeRateProvider {
  readonly name = "TGJU";

  constructor(
    private readonly url = process.env.TGJU_URL ?? "https://call1.tgju.org/ajax.json",
  ) {}

  async fetchTomanRates(signal?: AbortSignal): Promise<TomanRates> {
    const response = await fetch(this.url, {
      signal,
      // Rates are cached in our own database; skip Next's fetch cache so a
      // stale HTTP response can't shadow a refresh.
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`TGJU responded ${response.status}`);
    }

    const body = (await response.json()) as { current?: unknown };
    const current = body.current;

    if (!current || typeof current !== "object") {
      throw new Error("TGJU returned no current prices");
    }

    const entries = current as Record<string, TgjuEntry | undefined>;

    // Toman is the anchor, so it is 1 by definition.
    const rates: TomanRates = { TOMAN: 1 };

    for (const [symbol, currency] of Object.entries(SYMBOLS)) {
      const raw = entries[symbol]?.p;
      if (typeof raw !== "string" && typeof raw !== "number") continue;

      // "1,878,000" -> 1878000 rial -> 187800 toman.
      const rial = Number(String(raw).replace(/,/g, "").trim());
      if (!Number.isFinite(rial) || rial <= 0) continue;

      rates[currency] = rial / RIAL_PER_TOMAN;
    }

    const missing = (["USD", "EUR", "TRY"] as const).filter((code) => !rates[code]);
    if (missing.length > 0) {
      throw new Error(`TGJU response missing rates for ${missing.join(", ")}`);
    }

    return rates;
  }
}
