import { formatMoney, type CurrencyCode } from "@/lib/money";
import type { ChartSlice } from "@/lib/chart";
import { CategoryBar } from "./ProgressBar";

/**
 * The bar chart: one row per category, with what was actually spent in it.
 *
 * Always all six rows, in the same order as the pie, including the ones at
 * zero — a category that vanishes when you haven't spent in it makes the two
 * charts disagree and makes the list jump around as you add costs.
 */
export function CategoryBars({
  slices,
  currency,
}: {
  slices: ChartSlice[];
  currency: CurrencyCode;
}) {
  return (
    <div className="flex flex-col gap-4">
      {slices.map((slice) => (
        <div key={slice.key} className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-cat font-medium text-ink-3">
            <span aria-hidden="true">{slice.emoji}</span>
            <span className="truncate">{slice.label}</span>
            <span className="tnum shrink-0 text-ink-4">
              {Math.round(slice.percent)}%
            </span>
            <span className="tnum ml-auto shrink-0 text-ink-3">
              {formatMoney(slice.totalMinor, currency)}
            </span>
          </div>
          <CategoryBar percent={slice.percent} />
        </div>
      ))}
    </div>
  );
}
