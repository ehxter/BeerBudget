import type { CurrencyCode } from "@/lib/money";
import type { ExchangeRateProvider, TomanRates } from "./provider";

/**
 * BrsApi.ir — quotes every currency in Iranian Toman in a single call, which
 * is exactly the shape the rate store wants.
 *
 * Response (trimmed):
 *   { "currency": [ { "symbol": "USD", "price": 185400, "unit": "تومان" }, ... ] }
 *
 * Note these are Iranian open-market rates. A USD->TRY cross derived from them
 * reflects what an Iranian traveler actually experiences, which may differ from
 * the global interbank rate. The UI labels them "reference", never "official".
 */

const SYMBOL_TO_CURRENCY: Record<string, CurrencyCode> = {
  USD: "USD",
  EUR: "EUR",
  TRY: "TRY",
};

type BrsApiEntry = {
  symbol?: unknown;
  price?: unknown;
  unit?: unknown;
};

type BrsApiResponse = {
  currency?: unknown;
};

export class BrsApiProvider implements ExchangeRateProvider {
  readonly name = "BRSAPI";

  constructor(
    private readonly url = process.env.BRSAPI_URL ??
      "https://Api.BrsApi.ir/Market/Gold_Currency.php",
    private readonly apiKey = process.env.BRSAPI_KEY ?? "",
  ) {}

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async fetchTomanRates(signal?: AbortSignal): Promise<TomanRates> {
    if (!this.isConfigured()) {
      throw new Error("BRSAPI_KEY is not set");
    }

    const endpoint = new URL(this.url);
    endpoint.searchParams.set("key", this.apiKey);

    const response = await fetch(endpoint, {
      signal,
      // Rates are cached in our own database; skip Next's fetch cache so a
      // stale HTTP response can't shadow a refresh.
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`BrsApi responded ${response.status}`);
    }

    const body = (await response.json()) as BrsApiResponse;
    const entries = Array.isArray(body.currency) ? (body.currency as BrsApiEntry[]) : [];

    if (entries.length === 0) {
      throw new Error("BrsApi returned no currency entries");
    }

    // Toman is the anchor, so it is 1 by definition.
    const rates: TomanRates = { TOMAN: 1 };

    for (const entry of entries) {
      const symbol = typeof entry.symbol === "string" ? entry.symbol : null;
      const currency = symbol ? SYMBOL_TO_CURRENCY[symbol] : undefined;
      if (!currency) continue;

      const price = typeof entry.price === "number" ? entry.price : Number(entry.price);
      if (!Number.isFinite(price) || price <= 0) continue;

      rates[currency] = price;
    }

    const missing = (["USD", "EUR", "TRY"] as const).filter((code) => !rates[code]);
    if (missing.length > 0) {
      throw new Error(`BrsApi response missing rates for ${missing.join(", ")}`);
    }

    return rates;
  }
}
