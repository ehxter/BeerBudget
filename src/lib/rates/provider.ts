import type { CurrencyCode } from "@/lib/money";

/**
 * Rates are quoted as "how many Toman is one unit of this currency worth".
 *
 * Toman is the anchor because the upstream provider quotes everything against
 * it. Any cross rate is then a division:
 *   rate(from -> to) = tomanPerUnit[from] / tomanPerUnit[to]
 *
 * Keeping a single anchor guarantees the table is internally consistent —
 * USD->TRY->TOMAN and USD->TOMAN can never disagree.
 */
export type TomanRates = Partial<Record<CurrencyCode, number>>;

/**
 * Swap the provider by implementing this interface and passing a different
 * instance to the rate store. Nothing in the UI touches the provider directly.
 */
export interface ExchangeRateProvider {
  readonly name: string;
  fetchTomanRates(signal?: AbortSignal): Promise<TomanRates>;
}
