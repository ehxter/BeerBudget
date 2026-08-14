/**
 * International FX providers — everything except Toman.
 *
 * Toman is deliberately absent. Its open-market price is an Iranian number
 * that the global APIs either don't carry or carry badly (they quote the
 * official IRR rate, which is off by a large multiple from what anyone
 * actually pays), so it comes from BrsApi or from the traveler. What a dollar
 * is worth in Euro or Lira, by contrast, is a fact that several free keyless
 * APIs agree on to four decimal places — so it can come from whichever one is
 * reachable right now.
 *
 * Three providers, tried in order, all keyless:
 *   1. Frankfurter    — European Central Bank reference rates.
 *   2. open.er-api.com — ExchangeRate-API's open endpoint.
 *   3. currency-api    — a CDN-hosted dataset, with a second URL on different
 *                        infrastructure (Cloudflare Pages) behind jsDelivr.
 *
 * They are independent of each other and of BrsApi, which is the point: the
 * failure that takes out one is unlikely to take out the rest.
 */

/** The currencies an FX provider can price. Never TOMAN. */
export const FX_CURRENCIES = ["USD", "EUR", "TRY"] as const;

export type FxCurrency = (typeof FX_CURRENCIES)[number];

/**
 * USD per 1 major unit of each currency — 1.157 for EUR, 0.0209 for TRY.
 *
 * Inverted from the "per USD" quote every provider actually returns, because
 * this direction is what pins the table to Toman with a single multiply.
 */
export type UsdRates = Partial<Record<FxCurrency, number>>;

export interface FxProvider {
  readonly name: string;
  fetchUsdRates(signal?: AbortSignal): Promise<UsdRates>;
}

/**
 * Anything outside this band is a misparse, not a rate — a currency worth
 * 10,000 dollars a unit doesn't exist, and neither does one worth 1e-9.
 * Catching it here keeps a reshaped API response from poisoning the cache.
 */
const PLAUSIBLE_MIN_USD = 1e-9;
const PLAUSIBLE_MAX_USD = 1e4;

/** Turns a provider's "units per USD" quote into our "USD per unit". */
function toUsdPerUnit(perUsd: unknown): number | null {
  const value = typeof perUsd === "number" ? perUsd : Number(perUsd);
  if (!Number.isFinite(value) || value <= 0) return null;

  const usdPerUnit = 1 / value;
  if (usdPerUnit < PLAUSIBLE_MIN_USD || usdPerUnit > PLAUSIBLE_MAX_USD) return null;
  return usdPerUnit;
}

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, {
    signal,
    // Rates are cached in our own database; skip Next's fetch cache so a stale
    // HTTP response can't shadow a refresh.
    cache: "no-store",
    headers: { accept: "application/json" },
  });

  if (!response.ok) throw new Error(`${response.status}`);
  return response.json();
}

/**
 * Reads a `{ EUR: 0.86, TRY: 47.88 }`-shaped map of per-USD quotes under the
 * given key lookup, and returns a complete table or throws.
 *
 * Partial results are refused on purpose: half a table would silently leave
 * one currency on a much older number than the other, and a cross rate built
 * from two different days is worse than one honest fallback.
 */
function readPerUsdMap(
  name: string,
  map: unknown,
  key: (currency: FxCurrency) => string,
): UsdRates {
  if (!map || typeof map !== "object") {
    throw new Error(`${name} returned no rates`);
  }

  const source = map as Record<string, unknown>;
  const rates: UsdRates = { USD: 1 };

  for (const currency of FX_CURRENCIES) {
    if (currency === "USD") continue;
    const usdPerUnit = toUsdPerUnit(source[key(currency)]);
    if (usdPerUnit !== null) rates[currency] = usdPerUnit;
  }

  const missing = FX_CURRENCIES.filter((currency) => !rates[currency]);
  if (missing.length > 0) {
    throw new Error(`${name} is missing ${missing.join(", ")}`);
  }

  return rates;
}

/** European Central Bank reference rates, published each working day. */
export class FrankfurterProvider implements FxProvider {
  readonly name = "FRANKFURTER";

  async fetchUsdRates(signal?: AbortSignal): Promise<UsdRates> {
    const body = (await getJson(
      "https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR,TRY",
      signal,
    )) as { rates?: unknown };

    return readPerUsdMap(this.name, body.rates, (currency) => currency);
  }
}

/** ExchangeRate-API's open endpoint — no key, updated daily. */
export class ErApiProvider implements FxProvider {
  readonly name = "ERAPI";

  async fetchUsdRates(signal?: AbortSignal): Promise<UsdRates> {
    const body = (await getJson("https://open.er-api.com/v6/latest/USD", signal)) as {
      result?: unknown;
      rates?: unknown;
    };

    if (body.result !== "success") {
      throw new Error(`${this.name} returned result=${String(body.result)}`);
    }

    return readPerUsdMap(this.name, body.rates, (currency) => currency);
  }
}

/**
 * A CDN-hosted dataset with lowercase keys. Two URLs on unrelated
 * infrastructure — if jsDelivr is unreachable the Cloudflare Pages mirror
 * usually isn't, which is most of this provider's value.
 */
export class CurrencyApiProvider implements FxProvider {
  readonly name = "CURRENCYAPI";

  private readonly urls = [
    "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
    "https://latest.currency-api.pages.dev/v1/currencies/usd.json",
  ];

  async fetchUsdRates(signal?: AbortSignal): Promise<UsdRates> {
    let lastError: unknown;

    for (const url of this.urls) {
      try {
        const body = (await getJson(url, signal)) as { usd?: unknown };
        return readPerUsdMap(this.name, body.usd, (currency) => currency.toLowerCase());
      } catch (error) {
        // An aborted request means our own deadline passed, not that this
        // mirror is down — trying the next URL would overrun it further.
        if (signal?.aborted) throw error;
        lastError = error;
      }
    }

    throw lastError instanceof Error ? lastError : new Error(`${this.name} unreachable`);
  }
}

export const FX_PROVIDERS: readonly FxProvider[] = [
  new FrankfurterProvider(),
  new ErApiProvider(),
  new CurrencyApiProvider(),
];

export type FxResult = { source: string; rates: UsdRates };

/**
 * First provider that answers with a complete table wins.
 *
 * Sequential rather than parallel: the common case is that the first one
 * works, and firing three requests every refresh to discard two would be rude
 * to services that are giving this away for free.
 */
export async function fetchUsdRatesWithFailover(signal?: AbortSignal): Promise<FxResult> {
  const failures: string[] = [];

  for (const provider of FX_PROVIDERS) {
    if (signal?.aborted) break;
    try {
      return { source: provider.name, rates: await provider.fetchUsdRates(signal) };
    } catch (error) {
      failures.push(
        `${provider.name}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  throw new Error(`no FX provider reachable (${failures.join("; ")})`);
}
