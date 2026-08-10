/**
 * Shared vocabulary. SQLite has no enums, so these string constants are the
 * single source of truth for what the columns may contain — validated with zod
 * on the way in and used to render labels on the way out.
 */

export const EXPENSE_CATEGORIES = [
  { value: "FOOD", label: "Food", emoji: "🍽" },
  { value: "TRANSPORT", label: "Transport", emoji: "🚕" },
  { value: "ACCOMMODATION", label: "Accommodation", emoji: "🏨" },
  { value: "ACTIVITIES", label: "Activities", emoji: "🎟" },
  { value: "SHOPPING", label: "Shopping", emoji: "🛍" },
  { value: "DRINKS", label: "Drinks", emoji: "☕" },
  { value: "GROCERIES", label: "Groceries", emoji: "🧺" },
  { value: "OTHER", label: "Other", emoji: "•" },
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]["value"];

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
