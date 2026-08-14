import "server-only";

import { CURRENCIES, type CurrencyCode } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { BrsApiProvider } from "./brsapi";
import { fetchUsdRatesWithFailover, FX_CURRENCIES } from "./fx";
import type { ExchangeRateProvider } from "./provider";

/**
 * Reference-rate store.
 *
 * Everything hangs off one number: what a dollar costs in Toman. That number
 * is Iranian and open-market, so it comes from BrsApi or from the traveler —
 * nowhere else knows it. Every other price is then a cross rate against the
 * dollar, sourced from whichever international FX provider is reachable
 * (see ./fx), and pinned to Toman by a single multiply.
 *
 * Which source owns the dollar is the traveler's choice, held in RateSettings
 * and flipped by the toggle on the Exchange screen:
 *
 *   AUTO   — BrsApi sets it. The toggle's "on".
 *   MANUAL — the number typed on the Rates screen sets it. The toggle's "off",
 *            for when the provider is unreachable or simply wrong about what
 *            the shop on the corner is paying.
 *
 * Underneath that, the rules never leave the app blocked on the network:
 * cached values outrank live ones that haven't arrived, a failed provider is
 * left alone for a cooldown rather than retried on every render, and a
 * hardcoded bootstrap means nothing ever divides by zero.
 */

const DEFAULT_TTL_MINUTES = 10;
/** Cross rates move once a working day; there is no point asking more often. */
const DEFAULT_FX_TTL_MINUTES = 360;

/** Cap on how long a user-facing request will wait for a provider. */
const REQUEST_REFRESH_TIMEOUT_MS = 4_000;
const BACKGROUND_REFRESH_TIMEOUT_MS = 20_000;

/**
 * How long a provider is left alone after it fails.
 *
 * Without this, an outage costs every single render the full timeout: the
 * cache is past its TTL, so each request tries again, waits, and fails again.
 * One attempt a minute is plenty to notice the provider coming back.
 */
const FAILURE_COOLDOWN_MS = 60_000;

export const PROVIDER_SOURCE = "BRSAPI";
export const MANUAL_SOURCE = "MANUAL";

const SETTINGS_ID = "singleton";

export const RATE_MODES = ["AUTO", "MANUAL"] as const;
export type RateMode = (typeof RATE_MODES)[number];

export function isRateMode(value: unknown): value is RateMode {
  return typeof value === "string" && (RATE_MODES as readonly string[]).includes(value);
}

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

/** Where a given currency's number actually came from. */
export type RateOrigin = "manual" | "provider" | "fx" | "bootstrap";

export type RateTable = {
  /** Toman per 1 major unit of each currency. */
  tomanPerUnit: Record<CurrencyCode, number>;
  origin: Record<CurrencyCode, RateOrigin>;
  mode: RateMode;
  /** Where the dollar — and so the whole table — was anchored, and when. */
  anchorOrigin: RateOrigin;
  anchorAt: Date | null;
  /** When the BrsApi cache was last written, if ever. */
  fetchedAt: Date | null;
  /** When the cross rates were last written, and which provider answered. */
  fxFetchedAt: Date | null;
  fxSource: string | null;
  /** True when the anchor is missing or older than the TTL. */
  isStale: boolean;
  /** True when at least one currency fell through to the bootstrap values. */
  usingBootstrap: boolean;
};

function minutesEnv(name: string, fallback: number): number {
  const configured = Number(process.env[name]);
  return Number.isFinite(configured) && configured > 0 ? configured : fallback;
}

function ttlMs(): number {
  return minutesEnv("RATES_TTL_MINUTES", DEFAULT_TTL_MINUTES) * 60 * 1000;
}

function fxTtlMs(): number {
  return minutesEnv("FX_TTL_MINUTES", DEFAULT_FX_TTL_MINUTES) * 60 * 1000;
}

function isExpired(at: Date | null, ms: number): boolean {
  return !at || Date.now() - at.getTime() > ms;
}

const provider: ExchangeRateProvider = new BrsApiProvider();

/**
 * Per-provider refresh state: the call currently running, so parallel requests
 * share one trip upstream, and the point in time before which it is not worth
 * asking again.
 */
type Gate = { inFlight: Promise<boolean> | null; failedUntil: number };

const rateGate: Gate = { inFlight: null, failedUntil: 0 };
const fxGate: Gate = { inFlight: null, failedUntil: 0 };

/**
 * Waits on an already-running refresh, but only for as long as *this* caller
 * agreed to wait.
 *
 * Joining the shared call must not mean inheriting its deadline: a page render
 * that budgeted 4s would otherwise sit behind the background refresher's 20s.
 * Giving up here only stops the waiting — the refresh keeps going and still
 * writes the cache for whoever renders next.
 */
function joinWithDeadline(work: Promise<boolean>, ms: number): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), ms);
    const settle = (value: boolean) => {
      clearTimeout(timer);
      resolve(value);
    };
    work.then(settle, () => settle(false));
  });
}

type RefreshOptions = {
  timeoutMs?: number;
  /** Skips the failure cooldown — someone pressed a button and is watching. */
  force?: boolean;
};

/**
 * Runs `work` under the dedupe/cooldown/timeout discipline above. Returns
 * false rather than throwing, so every caller can carry on with cached data.
 */
async function refreshThrough(
  gate: Gate,
  label: string,
  timeoutMs: number,
  force: boolean,
  work: (signal: AbortSignal) => Promise<void>,
): Promise<boolean> {
  if (gate.inFlight) return joinWithDeadline(gate.inFlight, timeoutMs);
  if (!force && Date.now() < gate.failedUntil) return false;

  gate.inFlight = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      await work(controller.signal);
      gate.failedUntil = 0;
      return true;
    } catch (error) {
      // Provider details never reach the client; the UI shows a timestamp and
      // whether the numbers on screen are the traveler's own.
      console.error(
        `[rates] ${label} refresh failed:`,
        error instanceof Error ? error.message : error,
      );
      gate.failedUntil = Date.now() + FAILURE_COOLDOWN_MS;
      return false;
    } finally {
      clearTimeout(timer);
      gate.inFlight = null;
    }
  })();

  return gate.inFlight;
}

/** Pulls Toman prices from BrsApi and writes the cache. */
export async function refreshRates({
  timeoutMs = REQUEST_REFRESH_TIMEOUT_MS,
  force = false,
}: RefreshOptions = {}): Promise<boolean> {
  return refreshThrough(rateGate, PROVIDER_SOURCE, timeoutMs, force, async (signal) => {
    const rates = await provider.fetchTomanRates(signal);
    const fetchedAt = new Date();

    await prisma.$transaction(
      Object.entries(rates)
        .filter(([, value]) => Number.isFinite(value) && (value as number) > 0)
        .map(([currency, value]) =>
          prisma.exchangeRate.upsert({
            where: { currency_source: { currency, source: PROVIDER_SOURCE } },
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
  });
}

/** Pulls USD cross rates from the first reachable FX provider. */
export async function refreshFxRates({
  timeoutMs = REQUEST_REFRESH_TIMEOUT_MS,
  force = false,
}: RefreshOptions = {}): Promise<boolean> {
  return refreshThrough(fxGate, "FX", timeoutMs, force, async (signal) => {
    const { source, rates } = await fetchUsdRatesWithFailover(signal);
    const fetchedAt = new Date();

    await prisma.$transaction(
      FX_CURRENCIES.filter((currency) => (rates[currency] ?? 0) > 0).map((currency) =>
        prisma.fxRate.upsert({
          where: { currency_source: { currency, source } },
          create: { currency, source, usdPerUnit: rates[currency] as number, fetchedAt },
          update: { usdPerUnit: rates[currency] as number, fetchedAt },
        }),
      ),
    );
  });
}

/** Refreshes both halves of the table. Used by the button and the timer. */
export async function refreshAllRates(
  options: RefreshOptions = {},
): Promise<{ rates: boolean; fx: boolean }> {
  const [rates, fx] = await Promise.all([
    refreshRates(options),
    refreshFxRates(options),
  ]);
  return { rates, fx };
}

type RateRow = { tomanPerUnit: number; fetchedAt: Date };
type FxSet = { source: string; usdPerUnit: Map<string, number>; fetchedAt: Date };

/**
 * The freshest FX provider that priced *every* currency.
 *
 * Completeness matters more than freshness here: a table half from today and
 * half from last week would put a EUR->TRY cross on two different days, which
 * is a worse answer than one slightly older but self-consistent set.
 */
function pickFxSet(rows: { currency: string; usdPerUnit: number; source: string; fetchedAt: Date }[]): FxSet | null {
  const bySource = new Map<string, Map<string, { usdPerUnit: number; fetchedAt: Date }>>();

  for (const row of rows) {
    if (row.usdPerUnit <= 0) continue;
    const set = bySource.get(row.source) ?? new Map();
    set.set(row.currency, { usdPerUnit: row.usdPerUnit, fetchedAt: row.fetchedAt });
    bySource.set(row.source, set);
  }

  let best: FxSet | null = null;

  for (const [source, set] of bySource) {
    if (!FX_CURRENCIES.every((currency) => set.has(currency))) continue;

    // Written in one transaction, so these all carry the same stamp; taking
    // the oldest is simply the conservative reading of "how old is this set".
    let fetchedAt: Date | null = null;
    for (const entry of set.values()) {
      if (!fetchedAt || entry.fetchedAt < fetchedAt) fetchedAt = entry.fetchedAt;
    }
    if (!fetchedAt) continue;

    if (!best || fetchedAt > best.fetchedAt) {
      best = {
        source,
        fetchedAt,
        usdPerUnit: new Map(
          [...set].map(([currency, entry]) => [currency, entry.usdPerUnit]),
        ),
      };
    }
  }

  return best;
}

async function readCache() {
  const [rows, fxRows, settings] = await Promise.all([
    prisma.exchangeRate.findMany(),
    prisma.fxRate.findMany(),
    prisma.rateSettings.findUnique({ where: { id: SETTINGS_ID } }),
  ]);

  const providerRows = new Map<string, RateRow>();
  const manualRows = new Map<string, RateRow>();

  for (const row of rows) {
    if (row.source !== MANUAL_SOURCE && row.source !== PROVIDER_SOURCE) continue;
    const target = row.source === MANUAL_SOURCE ? manualRows : providerRows;
    target.set(row.currency, {
      tomanPerUnit: row.tomanPerUnit,
      fetchedAt: row.fetchedAt,
    });
  }

  let fetchedAt: Date | null = null;
  for (const row of providerRows.values()) {
    if (!fetchedAt || row.fetchedAt < fetchedAt) fetchedAt = row.fetchedAt;
  }

  return {
    providerRows,
    manualRows,
    fetchedAt,
    fx: pickFxSet(fxRows),
    mode: isRateMode(settings?.mode) ? settings.mode : ("AUTO" as RateMode),
  };
}

/**
 * The one function the rest of the app calls to get rates.
 *
 * Refreshes what the current mode actually depends on, waits only a bounded
 * amount of time for it, and always returns a usable table.
 */
export async function getRateTable(): Promise<RateTable> {
  let cache = await readCache();
  const mode = cache.mode;

  // In MANUAL mode the traveler's number is the anchor, so a BrsApi round trip
  // would spend the render's latency budget on a figure nothing will read.
  if (mode === "AUTO" && isExpired(cache.fetchedAt, ttlMs())) {
    if (await refreshRates()) cache = await readCache();
  }

  if (isExpired(cache.fx?.fetchedAt ?? null, fxTtlMs())) {
    if (cache.fx) {
      // Something usable is already cached and cross rates barely move, so
      // this one goes off the render path entirely.
      void refreshFxRates({ timeoutMs: BACKGROUND_REFRESH_TIMEOUT_MS });
    } else if (await refreshFxRates()) {
      // Nothing cached at all: without this there is no way to price EUR or
      // TRY off the dollar, which is worth a bounded wait exactly once.
      cache = await readCache();
    }
  }

  const { manualRows, providerRows, fx } = cache;

  const direct = (currency: CurrencyCode, from: "manual" | "provider") => {
    const row = (from === "manual" ? manualRows : providerRows).get(currency);
    return row && row.tomanPerUnit > 0 ? row : null;
  };

  // Mode decides who is asked first. FX fills in whatever that source can't
  // answer — which, in MANUAL mode, is everything except the dollar itself.
  const order =
    mode === "MANUAL"
      ? (["manual", "fx", "provider"] as const)
      : (["provider", "fx", "manual"] as const);

  // The dollar is resolved first and alone: it is what the cross rates are
  // quoted against, so whichever source sets it decides the whole table.
  let anchorToman = 0;
  let anchorOrigin: RateOrigin = "bootstrap";
  let anchorAt: Date | null = null;

  for (const from of order) {
    if (from === "fx") continue; // FX prices the dollar against itself: no help.
    const row = direct("USD", from);
    if (row) {
      anchorToman = row.tomanPerUnit;
      anchorOrigin = from;
      anchorAt = row.fetchedAt;
      break;
    }
  }
  if (!anchorToman) anchorToman = BOOTSTRAP_TOMAN_RATES.USD;

  const tomanPerUnit = {} as Record<CurrencyCode, number>;
  const origin = {} as Record<CurrencyCode, RateOrigin>;
  let usingBootstrap = anchorOrigin === "bootstrap";

  for (const currency of CURRENCIES) {
    // Toman anchors the table at 1 by definition. Its origin is the dollar's,
    // because "what a Toman is worth" and "what a dollar costs in Toman" are
    // the same question read in opposite directions.
    if (currency === "TOMAN") {
      tomanPerUnit.TOMAN = 1;
      origin.TOMAN = anchorOrigin;
      continue;
    }

    if (currency === "USD") {
      tomanPerUnit.USD = anchorToman;
      origin.USD = anchorOrigin;
      continue;
    }

    let resolved = 0;
    let resolvedOrigin: RateOrigin = "bootstrap";

    for (const from of order) {
      if (from === "fx") {
        const usdPerUnit = fx?.usdPerUnit.get(currency);
        if (usdPerUnit && usdPerUnit > 0) {
          resolved = usdPerUnit * anchorToman;
          resolvedOrigin = "fx";
          break;
        }
        continue;
      }

      const row = direct(currency, from);
      if (row) {
        resolved = row.tomanPerUnit;
        resolvedOrigin = from;
        break;
      }
    }

    if (!resolved) {
      resolved = BOOTSTRAP_TOMAN_RATES[currency];
      resolvedOrigin = "bootstrap";
      usingBootstrap = true;
    }

    tomanPerUnit[currency] = resolved;
    origin[currency] = resolvedOrigin;
  }

  return {
    tomanPerUnit,
    origin,
    mode,
    anchorOrigin,
    anchorAt,
    fetchedAt: cache.fetchedAt,
    fxFetchedAt: fx?.fetchedAt ?? null,
    fxSource: fx?.source ?? null,
    // A hand-entered anchor doesn't go stale on a timer — the traveler owns it
    // and replaces it when they see a better number on a board.
    isStale:
      anchorOrigin === "manual" ? false : isExpired(anchorAt, ttlMs()),
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

export type RateSources = {
  mode: RateMode;
  /** BrsApi's dollar price, and when the cache was written. */
  provider: { usdToman: number | null; fetchedAt: Date | null };
  /** The traveler's own dollar price, if they have saved one. */
  manual: { tomanPerUnit: number; fetchedAt: Date } | null;
  /** The winning cross-rate set: who answered, when, and USD per unit. */
  fx: { source: string; fetchedAt: Date; usdPerUnit: Record<string, number> } | null;
};

/**
 * Everything behind the numbers, for the Rates screen — which source is
 * currently in charge, what each one last said, and how long ago it said it.
 *
 * Reads the cache only. The Rates screen is where you go when you already
 * suspect the network, so it must render instantly rather than block on the
 * providers it is reporting on.
 */
export async function getRateSources(): Promise<RateSources> {
  const cache = await readCache();
  const manual = cache.manualRows.get("USD");
  const provider = cache.providerRows.get("USD");

  return {
    mode: cache.mode,
    provider: {
      usdToman: provider && provider.tomanPerUnit > 0 ? provider.tomanPerUnit : null,
      fetchedAt: cache.fetchedAt,
    },
    manual:
      manual && manual.tomanPerUnit > 0
        ? { tomanPerUnit: manual.tomanPerUnit, fetchedAt: manual.fetchedAt }
        : null,
    fx: cache.fx
      ? {
          source: cache.fx.source,
          fetchedAt: cache.fx.fetchedAt,
          usdPerUnit: Object.fromEntries(cache.fx.usdPerUnit),
        }
      : null,
  };
}

export async function getRateMode(): Promise<RateMode> {
  const settings = await prisma.rateSettings.findUnique({ where: { id: SETTINGS_ID } });
  return isRateMode(settings?.mode) ? settings.mode : "AUTO";
}

export async function setRateMode(mode: RateMode): Promise<void> {
  await prisma.rateSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, mode },
    update: { mode },
  });
}

/** The traveler's own Toman price for one unit of `currency`, if they set one. */
export async function getManualRate(
  currency: CurrencyCode,
): Promise<{ tomanPerUnit: number; fetchedAt: Date } | null> {
  const row = await prisma.exchangeRate.findUnique({
    where: { currency_source: { currency, source: MANUAL_SOURCE } },
  });
  if (!row || row.tomanPerUnit <= 0) return null;
  return { tomanPerUnit: row.tomanPerUnit, fetchedAt: row.fetchedAt };
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
let fxBackgroundTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Keeps both caches warm even when nobody is using the app, so a recent price
 * is always on hand if the provider is down at the moment it's needed —
 * which, on a flaky connection, is the whole point.
 *
 * Started from `src/instrumentation.ts` on server boot. The two run on their
 * own intervals: Toman moves all day, cross rates move once.
 */
export function startBackgroundRefresh(): void {
  if (backgroundTimer) return;

  const pullRates = () => {
    void refreshRates({ timeoutMs: BACKGROUND_REFRESH_TIMEOUT_MS });
  };
  const pullFx = () => {
    void refreshFxRates({ timeoutMs: BACKGROUND_REFRESH_TIMEOUT_MS });
  };

  pullRates();
  pullFx();

  backgroundTimer = setInterval(pullRates, ttlMs());
  fxBackgroundTimer = setInterval(pullFx, fxTtlMs());

  // Don't hold the process open on shutdown.
  backgroundTimer.unref?.();
  fxBackgroundTimer.unref?.();
}
