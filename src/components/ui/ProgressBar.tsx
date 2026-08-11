import { cn } from "@/lib/cn";

/**
 * Figma: 6px tall, r20, track #2d2d30, fill #1fa961.
 * Fill turns red once the budget is gone — not in the frames, but a green bar
 * on an overspent budget would be actively misleading.
 */
export function ProgressBar({
  percent,
  tone = "positive",
  label,
  className,
}: {
  percent: number;
  tone?: "positive" | "negative" | "white";
  label?: string;
  className?: string;
}) {
  const safe = Number.isFinite(percent) ? percent : 0;
  const clamped = Math.max(0, Math.min(100, safe));

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(safe)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-1.5 w-full overflow-hidden rounded-[20px] bg-track", className)}
    >
      <div
        className={cn(
          "animate-grow-x h-full rounded-[20px] transition-[width]",
          tone === "positive" && "bg-cat-4",
          tone === "negative" && "bg-cat-6",
          tone === "white" && "bg-ink",
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/** The thin white bar under each category row on Spending. Figma: 6px, r20. */
/** Figma: 4px tall (not 6, like the Budget Left bar), white fill. */
export function CategoryBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
  return (
    <div className="h-1 w-full overflow-hidden rounded-[20px] bg-track">
      <div
        className="animate-grow-x h-full rounded-[20px] bg-ink"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
