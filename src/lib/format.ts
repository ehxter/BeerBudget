/** Date/time helpers. Everything renders in the server's local timezone —
 *  set the VPS to Europe/Istanbul so "today" means today where you are. */

const WEEKDAY = new Intl.DateTimeFormat("en-GB", { weekday: "long" });
const DAY_MONTH = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const SHORT_WEEKDAY = new Intl.DateTimeFormat("en-GB", { weekday: "short" });
const TIME = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** "Today", "Yesterday", "Tomorrow", or "Tue · 18 Aug". */
export function relativeDay(date: Date, now = new Date()): string {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (sameDay(date, now)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";
  if (sameDay(date, tomorrow)) return "Tomorrow";
  return `${SHORT_WEEKDAY.format(date)} · ${DAY_MONTH.format(date)}`;
}

export function weekdayAndDate(date: Date): string {
  return `${WEEKDAY.format(date)} · ${DAY_MONTH.format(date)}`;
}

export function dayMonth(date: Date): string {
  return DAY_MONTH.format(date);
}

export function shortWeekday(date: Date): string {
  return SHORT_WEEKDAY.format(date);
}

export function clockTime(date: Date): string {
  return TIME.format(date);
}

export function dateRange(start: Date, end: Date): string {
  return `${DAY_MONTH.format(start)} – ${DAY_MONTH.format(end)}`;
}

/** For <input type="date"> values — local, not UTC-shifted. */
export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parses a "YYYY-MM-DD" input value as a local date at midnight. */
export function fromDateInputValue(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function relativeTimeAgo(date: Date, now = new Date()): string {
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
