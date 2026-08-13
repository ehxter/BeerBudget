import { cn } from "@/lib/cn";
import { Divider } from "./Card";

/**
 * The repeating row used for expenses and exchanges.
 *
 * Figma "Cost Item": card r12, padding 16, gap 16. A 48px icon circle, 8px
 * gap to the text block, the amount pinned to the far right. Two heights —
 * 80px without the footer line, ~130px with it (row, hairline, footer text
 * plus a pencil glyph at the end of the footer row).
 */
export function CostItem({
  icon,
  title,
  meta,
  amount,
  sub,
  footer,
  trailing,
  className,
}: {
  /** 48px circle on the left — category emoji or avatar initial. */
  icon?: React.ReactNode;
  title: React.ReactNode;
  /** Second line under the title — a time, or who paid. */
  meta?: React.ReactNode;
  amount: React.ReactNode;
  /** Smaller line under the amount, e.g. the base-currency equivalent. */
  sub?: React.ReactNode;
  /** The optional bottom line, rendered under a hairline. */
  footer?: React.ReactNode;
  /**
   * Control pinned to the right of the footer row — where the Figma frame has
   * a pencil glyph. Left empty rather than filled with a decorative icon, so
   * the row never promises an action it can't take.
   */
  trailing?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 rounded-card bg-card p-4", className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          {icon ? (
            <span
              aria-hidden="true"
              className="flex size-12 shrink-0 items-center justify-center rounded-full bg-track text-title"
            >
              {icon}
            </span>
          ) : null}

          <div className="min-w-0">
            <p className="truncate text-row font-medium text-ink">{title}</p>
            {meta ? (
              <p className="mt-1.5 truncate text-meta text-ink-4">{meta}</p>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="tnum text-row font-bold text-ink">{amount}</p>
          {sub ? <p className="tnum mt-0.5 text-meta text-ink-4">{sub}</p> : null}
        </div>
      </div>

      {footer || trailing ? (
        <div className="flex flex-col gap-4">
          <Divider />
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 truncate text-meta text-ink-4">{footer}</div>
            {trailing ? <div className="shrink-0">{trailing}</div> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** The "Danial paid ◆ Your share ₺35,000" separator from the Figma footer. */
export function Dot() {
  return (
    <span aria-hidden="true" className="mx-1.5 text-[10px] align-middle">
      ◆
    </span>
  );
}
