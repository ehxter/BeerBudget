/**
 * Shared vocabulary. SQLite has no enums, so these string constants are the
 * single source of truth for what the columns may contain — validated with zod
 * on the way in and used to render labels on the way out.
 */

/**
 * The six categories, and the only six. They are also exactly the slices of
 * the Home pie and the rows of the Home bar chart, in this order — the chart
 * is never sorted by amount, so a category doesn't jump around as you spend.
 *
 * `short` is what the Add Cost picker renders — a 3-column grid at 390px
 * truncates "Activities" to "Activiti…", so the chip grid gets an abbreviation
 * while the full word is used everywhere else.
 */
export const EXPENSE_CATEGORIES = [
  { value: "FOOD", label: "Food", short: "Food", emoji: "🍔", color: "#e9b658" },
  { value: "DRINKS", label: "Drinks", short: "Drinks", emoji: "🍻", color: "#e75e5e" },
  { value: "TRANSPORT", label: "Transport", short: "Travel", emoji: "🚋", color: "#598ee4" },
  { value: "ACTIVITIES", label: "Activities", short: "Activity", emoji: "⛵", color: "#1fa961" },
  { value: "SHOPPING", label: "Shopping", short: "Shopping", emoji: "🛍️", color: "#cf6bb3" },
  { value: "OTHER", label: "Other", short: "Other", emoji: "💸", color: "#e4e4e4" },
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]["value"];

/** Falls back to OTHER rather than dropping the amount, so a row written by an
 *  older version of the app still shows up in the totals. */
export function asCategory(value: string): ExpenseCategory {
  return EXPENSE_CATEGORIES.some((category) => category.value === value)
    ? (value as ExpenseCategory)
    : "OTHER";
}

/**
 * Which way a debt points. There is exactly one other party — "your friend" —
 * and no account behind them: this is a private ledger, not a shared one.
 */
export const DEBT_DIRECTIONS = [
  { value: "THEY_OWE", label: "They owe me" },
  { value: "I_OWE", label: "I owe them" },
] as const;

export type DebtDirection = (typeof DEBT_DIRECTIONS)[number]["value"];

type Option = {
  readonly value: string;
  readonly label: string;
  readonly emoji?: string;
  readonly color?: string;
};

export function labelFor(options: readonly Option[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function emojiFor(options: readonly Option[], value: string): string {
  return options.find((option) => option.value === value)?.emoji ?? "•";
}

export function valuesOf(options: readonly Option[]): [string, ...string[]] {
  return options.map((option) => option.value) as [string, ...string[]];
}
