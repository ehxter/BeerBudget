/**
 * Shared vocabulary. SQLite has no enums, so these string constants are the
 * single source of truth for what the columns may contain — validated with zod
 * on the way in and used to render labels on the way out.
 */

// `short` is what the Add Cost picker renders — a 3-column grid at 390px
// truncates "Transport"/"Groceries" to "Transp…"/"Groceri…", so the chip
// grid gets an abbreviation while the full word is used everywhere else
// (the expense list, the chart legend, category bars).
export const EXPENSE_CATEGORIES = [
  { value: "FOOD", label: "Food", short: "Food", emoji: "🍔" },
  { value: "TRANSPORT", label: "Transport", short: "Travel", emoji: "🚋" },
  { value: "ACCOMMODATION", label: "Stay", short: "Stay", emoji: "🏨" },
  { value: "ACTIVITIES", label: "Activities", short: "Activity", emoji: "⛵" },
  { value: "SHOPPING", label: "Shopping", short: "Shopping", emoji: "🛍️" },
  { value: "DRINKS", label: "Drinks", short: "Drinks", emoji: "🍻" },
  { value: "GROCERIES", label: "Groceries", short: "Grocery", emoji: "🧺" },
  { value: "OTHER", label: "Other", short: "Other", emoji: "💸" },
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]["value"];

/**
 * The Home/Spending donut shows exactly six fixed slices, in this order,
 * regardless of amount — it is not sorted by spend. Categories outside this
 * set (Stay, Groceries) fold into "Other" for the chart only; they keep
 * their own emoji and label everywhere else (the expense list, Add Cost).
 */
export const CHART_CATEGORY_ORDER = [
  "FOOD",
  "DRINKS",
  "TRANSPORT",
  "ACTIVITIES",
  "SHOPPING",
  "OTHER",
] as const;

export const CHART_CATEGORY_COLOR: Record<(typeof CHART_CATEGORY_ORDER)[number], string> = {
  FOOD: "#e9b658",
  DRINKS: "#e75e5e",
  TRANSPORT: "#598ee4",
  ACTIVITIES: "#1fa961",
  SHOPPING: "#cf6bb3",
  OTHER: "#e4e4e4",
};

/** Buckets an expense category into one of the six chart slices. */
export function toChartCategory(
  category: string,
): (typeof CHART_CATEGORY_ORDER)[number] {
  return (CHART_CATEGORY_ORDER as readonly string[]).includes(category)
    ? (category as (typeof CHART_CATEGORY_ORDER)[number])
    : "OTHER";
}

export const SPLIT_METHODS = [
  { value: "EQUAL", label: "50 / 50" },
  { value: "CUSTOM", label: "Custom" },
  { value: "SINGLE", label: "One person" },
] as const;

export type SplitMethod = (typeof SPLIT_METHODS)[number]["value"];

export const ITINERARY_CATEGORIES = [
  { value: "FOOD", label: "Food", emoji: "🍽" },
  { value: "ACTIVITY", label: "Activity", emoji: "🏛" },
  { value: "TRANSPORT", label: "Transport", emoji: "🚇" },
  { value: "SHOPPING", label: "Shopping", emoji: "🛍" },
  { value: "OTHER", label: "Other", emoji: "📌" },
] as const;

export const PLACE_CATEGORIES = [
  { value: "RESTAURANT", label: "Restaurant", emoji: "🍽" },
  { value: "CAFE", label: "Café", emoji: "☕" },
  { value: "ATTRACTION", label: "Attraction", emoji: "🏛" },
  { value: "SHOPPING", label: "Shopping", emoji: "🛍" },
  { value: "NEIGHBORHOOD", label: "Neighborhood", emoji: "🗺" },
  { value: "ACTIVITY", label: "Activity", emoji: "🎟" },
  { value: "OTHER", label: "Other", emoji: "📌" },
] as const;

export const PLACE_STATUSES = [
  { value: "WANT_TO_VISIT", label: "Want to visit", tone: "indigo" },
  { value: "PLANNED", label: "Planned", tone: "amber" },
  { value: "VISITED", label: "Visited", tone: "emerald" },
] as const;

export const SHARED_INFO_CATEGORIES = [
  { value: "HOTEL", label: "Hotel", emoji: "🏨" },
  { value: "FLIGHT", label: "Flight", emoji: "✈️" },
  { value: "TRANSPORT", label: "Transport", emoji: "🚇" },
  { value: "RESERVATION", label: "Reservation", emoji: "🎫" },
  { value: "EMERGENCY", label: "Emergency", emoji: "🚨" },
  { value: "OTHER", label: "Other", emoji: "📌" },
] as const;

export const VAULT_CATEGORIES = [
  { value: "PASSPORT", label: "Passport", emoji: "🛂" },
  { value: "ID", label: "ID", emoji: "🪪" },
  { value: "FLIGHT", label: "Flight", emoji: "✈️" },
  { value: "HOTEL", label: "Hotel", emoji: "🏨" },
  { value: "INSURANCE", label: "Insurance", emoji: "🛡" },
  { value: "CONTACT", label: "Emergency contact", emoji: "☎️" },
  { value: "SIM", label: "SIM / eSIM", emoji: "📶" },
  { value: "BOOKING", label: "Booking reference", emoji: "🎫" },
  { value: "OTHER", label: "Other", emoji: "🔒" },
] as const;

type Option = { readonly value: string; readonly label: string; readonly emoji?: string };

export function labelFor(options: readonly Option[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function emojiFor(options: readonly Option[], value: string): string {
  return options.find((option) => option.value === value)?.emoji ?? "•";
}

export function valuesOf(options: readonly Option[]): [string, ...string[]] {
  return options.map((option) => option.value) as [string, ...string[]];
}

/**
 * Donut / legend palette, read from the Figma arc fills in draw order.
 * Indexed by position in the sorted category list, not by category name —
 * the design assigns colour by rank, so the biggest slice is always the first
 * colour.
 */
