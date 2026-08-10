import "server-only";

import { CURRENCIES, type CurrencyCode } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { BrsApiProvider } from "./brsapi";
import type { ExchangeRateProvider } from "./provider";

/**
 * Reference-rate store.
 *
 * Rules, in priority order, so the app is never blocked on the network:
 *   1. A manual rate the traveler entered always wins — it is the escape hatch
 *      when the provider is wrong or unreachable.
 *   2. Otherwise the cached provider rate from the database.
 *   3. Otherwise a hardcoded bootstrap so nothing ever divides by zero.
 *
 * Freshness: a request refreshes the cache at most once per TTL (10 min by
 * default). A background timer refreshes on the same interval even when nobody
 * is using the app, so there is always a recent price to compare against if
 * the provider goes down later.
 */

const DEFAULT_TTL_MINUTES = 10;
/** Cap on how long a user-facing request will wait for the provider. */
const REQUEST_REFRESH_TIMEOUT_MS = 4_000;
const BACKGROUND_REFRESH_TIMEOUT_MS = 20_000;

export const PROVIDER_SOURCE = "BRSAPI";
export const MANUAL_SOURCE = "MANUAL";

/**
 * Last-resort values so a brand-new install with no network still renders.
 * Flagged as `bootstrap` in the returned table and surfaced in the UI.
 */
const BOOTSTRAP_TOMAN_RATES: Record<CurrencyCode, number> = {
  TOMAN: 1,
  TRY: 3_870,
  USD: 185_400,
  EUR: 214_250,
};

export type RateOrigin = "manual" | "provider" | "bootstrap";

export type RateTable = {
  /** Toman per 1 major unit of each currency. */
  tomanPerUnit: Record<CurrencyCode, number>;
  /** Where each currency's number actually came from. */
  origin: Record<CurrencyCode, RateOrigin>;
  /** When the provider cache was last written, if ever. */
  fetchedAt: Date | null;
  /** True when the provider cache is missing or older than the TTL. */
  isStale: boolean;
  /** True when at least one currency fell through to the bootstrap values. */
  usingBootstrap: boolean;
};

function ttlMs(): number {
  const configured = Number(process.env.RATES_TTL_MINUTES);
  const minutes =
    Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_TTL_MINUTES;
  return minutes * 60 * 1000;
}

const provider: ExchangeRateProvider = new BrsApiProvider();

/** Dedupes concurrent refreshes — parallel requests share one upstream call. */
let inFlight: Promise<boolean> | null = null;

async function withTimeout<T>(work: (signal: AbortSignal) => Promise<T>, ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await work(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetches from the provider and writes the cache. Returns false (never throws)
 * when the provider is unreachable, so callers can carry on with cached data.
 */
export async function refreshRates(
  { timeoutMs = REQUEST_REFRESH_TIMEOUT_MS }: { timeoutMs?: number } = {},
): Promise<boolean> {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const rates = await withTimeout(
        (signal) => provider.fetchTomanRates(signal),
        timeoutMs,
      );
      const fetchedAt = new Date();

      await prisma.$transaction(
        Object.entries(rates)
          .filter(([, value]) => Number.isFinite(value) && (value as number) > 0)
          .map(([currency, value]) =>
            prisma.exchangeRate.upsert({
              where: {
                currency_source: { currency, source: PROVIDER_SOURCE },
              },
              create: {
                currency,
                source: PROVIDER_SOURCE,
                tomanPerUnit: value as number,
                fetchedAt,
              },
              update: { tomanPerUnit: value as number, fetchedAt },
            }),
          ),
      );

      return true;
    } catch (error) {
      // Never surface provider details to the client; the UI just shows the
      // cached timestamp and a "rates may be out of date" hint.
      console.error(
        "[rates] refresh failed:",
        error instanceof Error ? error.message : error,
      );
      return false;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

async function readCache() {
  const rows = await prisma.exchangeRate.findMany();

  const providerRows = new Map<string, { tomanPerUnit: number; fetchedAt: Date }>();
  const manualRows = new Map<string, { tomanPerUnit: number; fetchedAt: Date }>();

  for (const row of rows) {
    const target = row.source === MANUAL_SOURCE ? manualRows : providerRows;
    if (row.source === MANUAL_SOURCE || row.source === PROVIDER_SOURCE) {
      target.set(row.currency, {
        tomanPerUnit: row.tomanPerUnit,
        fetchedAt: row.fetchedAt,
      });
    }
  }

  let fetchedAt: Date | null = null;
  for (const row of providerRows.values()) {
    if (!fetchedAt || row.fetchedAt < fetchedAt) fetchedAt = row.fetchedAt;
  }

  return { providerRows, manualRows, fetchedAt };
}

/**
 * The one function the rest of the app calls to get rates.
 *
 * Triggers a provider refresh when the cache has aged past the TTL, waits only
 * a bounded amount of time for it, and always returns a usable table.
 */
export async function getRateTable(): Promise<RateTable> {
  let cache = await readCache();

  const isExpired =
    !cache.fetchedAt || Date.now() - cache.fetchedAt.getTime() > ttlMs();

  if (isExpired) {
    const refreshed = await refreshRates();
    if (refreshed) cache = await readCache();
  }

  const tomanPerUnit = {} as Record<CurrencyCode, number>;
  const origin = {} as Record<CurrencyCode, RateOrigin>;
  let usingBootstrap = false;

  for (const currency of CURRENCIES) {
    const manual = cache.manualRows.get(currency);
    const fromProvider = cache.providerRows.get(currency);

    if (manual && manual.tomanPerUnit > 0) {
      tomanPerUnit[currency] = manual.tomanPerUnit;
      origin[currency] = "manual";
    } else if (fromProvider && fromProvider.tomanPerUnit > 0) {
      tomanPerUnit[currency] = fromProvider.tomanPerUnit;
      origin[currency] = "provider";
    } else {
      tomanPerUnit[currency] = BOOTSTRAP_TOMAN_RATES[currency];
      origin[currency] = "bootstrap";
      usingBootstrap = true;
    }
  }

  // Toman anchors the table; a manual row must never move it off 1.
  tomanPerUnit.TOMAN = 1;

  return {
    tomanPerUnit,
    origin,
    fetchedAt: cache.fetchedAt,
    isStale:
      !cache.fetchedAt || Date.now() - cache.fetchedAt.getTime() > ttlMs(),
    usingBootstrap,
  };
}

/** Units of `to` per 1 unit of `from`, from an already-loaded table. */
export function rateFromTable(
  table: RateTable,
  from: CurrencyCode,
  to: CurrencyCode,
): number {
  if (from === to) return 1;
  const fromToman = table.tomanPerUnit[from];
  const toToman = table.tomanPerUnit[to];
  if (!fromToman || !toToman) return 0;
  return fromToman / toToman;
}

export async function getRate(from: CurrencyCode, to: CurrencyCode): Promise<number> {
  return rateFromTable(await getRateTable(), from, to);
}

export async function setManualRate(
  currency: CurrencyCode,
  tomanPerUnit: number,
): Promise<void> {
  if (currency === "TOMAN") return; // the anchor is fixed at 1
  await prisma.exchangeRate.upsert({
    where: { currency_source: { currency, source: MANUAL_SOURCE } },
    create: { currency, source: MANUAL_SOURCE, tomanPerUnit, fetchedAt: new Date() },
    update: { tomanPerUnit, fetchedAt: new Date() },
  });
}

export async function clearManualRate(currency: CurrencyCode): Promise<void> {
  await prisma.exchangeRate
    .delete({ where: { currency_source: { currency, source: MANUAL_SOURCE } } })
    .catch(() => {
      // Already absent — clearing a rate that isn't set is a no-op, not an error.
    });
}

let backgroundTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Keeps the cache warm even when nobody is using the app, so a price to
 * compare against always exists if the provider is down when it's needed.
 * Started from `src/instrumentation.ts` on server boot.
 */
export function startBackgroundRefresh(): void {
  if (backgroundTimer) return;

  const run = () => {
    void refreshRates({ timeoutMs: BACKGROUND_REFRESH_TIMEOUT_MS });
  };

  run();
  backgroundTimer = setInterval(run, ttlMs());
  // Don't hold the process open on shutdown.
  backgroundTimer.unref?.();
}
