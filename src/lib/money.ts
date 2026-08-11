/**
 * Money handling for the trip.
 *
 * Every amount in this app is an integer in the currency's *minor unit*
 * (kuruş, cents, and — for Toman — whole Toman, which has no practical
 * subunit). Floats are used only for exchange rates, never for balances.
 *
 * Iranian currency is TOMAN throughout. 1 Toman = 10 IRR; IRR is never stored
 * or displayed, so the two can never be mixed up.
 */

export const CURRENCIES = ["TRY", "USD", "EUR", "TOMAN"] as const;

export type CurrencyCode = (typeof CURRENCIES)[number];

type CurrencyMeta = {
  code: CurrencyCode;
  label: string;
  symbol: string;
  /** Where the symbol sits relative to the digits. */
  position: "prefix" | "suffix";
  /** Digits after the decimal point in the minor unit. */
  decimals: number;
  /** Short unit name shown next to a headline figure ("35,000 Lira"). */
  unit: string;
};

export const CURRENCY_META: Record<CurrencyCode, CurrencyMeta> = {
  TRY: { code: "TRY", label: "Turkish Lira", symbol: "₺", position: "prefix", decimals: 2, unit: "Lira" },
  USD: { code: "USD", label: "US Dollar", symbol: "$", position: "prefix", decimals: 2, unit: "Dollar" },
  EUR: { code: "EUR", label: "Euro", symbol: "€", position: "prefix", decimals: 2, unit: "Euro" },
  TOMAN: { code: "TOMAN", label: "Toman", symbol: "T", position: "suffix", decimals: 0, unit: "Toman" },
};

export function isCurrency(value: unknown): value is CurrencyCode {
  return typeof value === "string" && (CURRENCIES as readonly string[]).includes(value);
}

/** Falls back to TRY rather than throwing, so a bad DB row can't blank a page. */
export function asCurrency(value: unknown): CurrencyCode {
  return isCurrency(value) ? value : "TRY";
}

export function decimalsFor(currency: CurrencyCode): number {
  return CURRENCY_META[currency].decimals;
}

function factor(currency: CurrencyCode): number {
  return 10 ** decimalsFor(currency);
}

/** 12.34 USD -> 1234 */
export function toMinor(major: number, currency: CurrencyCode): number {
  return Math.round(major * factor(currency));
}

/** 1234 USD-minor -> 12.34 */
export function toMajor(minor: number, currency: CurrencyCode): number {
  return minor / factor(currency);
}

/**
 * Parses user input ("1,200", "1200.50", "۱۲۰۰") into minor units.
 * Returns null for anything that isn't a finite, non-negative number.
 */
export function parseAmountToMinor(input: string, currency: CurrencyCode): number | null {
  if (typeof input !== "string") return null;

  // Normalise Persian/Arabic-Indic digits, then strip grouping separators.
  const normalised = input
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[،,\s٬]/g, "")
    .replace(/٫/g, ".")
    .trim();

  if (normalised === "") return null;
  const value = Number(normalised);
  if (!Number.isFinite(value) || value < 0) return null;

  return toMinor(value, currency);
}

/** Parses a rate or other non-money decimal. Returns null when unusable. */
export function parseDecimal(input: string): number | null {
  if (typeof input !== "string") return null;
  const normalised = input
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[،,\s٬]/g, "")
    .replace(/٫/g, ".")
    .trim();
  if (normalised === "") return null;
  const value = Number(normalised);
  return Number.isFinite(value) ? value : null;
}

type FormatOptions = {
  /** Always show minor-unit digits, even when the amount is whole. */
  showDecimals?: boolean;
  /** Drop the currency symbol, keeping only grouped digits. */
  bare?: boolean;
  /** Prefix non-zero amounts with an explicit + or -. */
  signed?: boolean;
};

/**
 * Renders minor units for display: ₺45,000 · $12.50 · 45,000 T
 *
 * Decimals are hidden when the amount is whole, which keeps the dense
 * currency-heavy screens readable without losing precision when it matters.
 */
export function formatMoney(
  minor: number,
  currency: CurrencyCode,
  options: FormatOptions = {},
): string {
  const meta = CURRENCY_META[currency];
  const rounded = Math.round(minor);
  const magnitude = Math.abs(rounded);
  const major = toMajor(magnitude, currency);

  const hasFraction = meta.decimals > 0 && magnitude % factor(currency) !== 0;

  // Above a thousand units the minor digits are noise, and cross-currency
  // conversion produces trailing kuruş constantly. Small amounts keep them.
  const significant = hasFraction && major < 1000;
  const fractionDigits = options.showDecimals || significant ? meta.decimals : 0;

  const digits = major.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

  const body = options.bare
    ? digits
    : meta.position === "prefix"
      ? `${meta.symbol}${digits}`
      : `${digits} ${meta.symbol}`;

  if (rounded < 0) return `-${body}`;
  if (options.signed && rounded > 0) return `+${body}`;
  return body;
}

/**
 * Splits a total evenly across `count` people without losing or inventing
 * minor units — the remainder is spread one unit at a time over the first
 * few participants, so the shares always sum back to exactly `totalMinor`.
 */
export function splitEqualMinor(totalMinor: number, count: number): number[] {
  if (count <= 0) return [];

  const sign = totalMinor < 0 ? -1 : 1;
  const magnitude = Math.abs(Math.round(totalMinor));
  const base = Math.floor(magnitude / count);
  const remainder = magnitude - base * count;

  return Array.from({ length: count }, (_, index) =>
    sign * (base + (index < remainder ? 1 : 0)),
  );
}

/**
 * Converts between currencies given `rate` = units of `to` per 1 unit of
 * `from`, both expressed in major units.
 */
export function convertMinor(
  amountMinor: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rate: number,
): number {
  if (from === to) return Math.round(amountMinor);
  return Math.round(toMajor(amountMinor, from) * rate * factor(to));
}

/** Formats an exchange rate with a sensible number of significant digits. */
export function formatRate(rate: number): string {
  if (!Number.isFinite(rate) || rate === 0) return "—";
  const decimals = rate >= 100 ? 0 : rate >= 1 ? 2 : rate >= 0.01 ? 4 : 6;
  return rate.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
