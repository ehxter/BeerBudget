import { cn } from "@/lib/cn";

/**
 * Budget burndown bar. Clamps to 0–100% for the fill but reports the true
 * percentage to assistive tech, so going over budget is still legible.
 */
export function ProgressBar({
  percent,
  tone = "accent",
  className,
  label,
}: {
  percent: number;
  tone?: "accent" | "positive" | "negative" | "warn";
  className?: string;
  label?: string;
}) {
  const safe = Number.isFinite(percent) ? percent : 0;
  const clamped = Math.max(0, Math.min(100, safe));

  const fill = {
    accent: "bg-accent",
    positive: "bg-positive",
    negative: "bg-negative",
    warn: "bg-warn",
  }[tone];

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(safe)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-2.5 w-full overflow-hidden rounded-full bg-surface-3", className)}
    >
      <div
        className={cn("animate-grow-x h-full rounded-full transition-[width]", fill)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/** Horizontal bar used in the category breakdown. */
export function MiniBar({
  percent,
  className,
}: {
  percent: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-3", className)}>
      <div
        className="animate-grow-x h-full rounded-full bg-accent/70"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
