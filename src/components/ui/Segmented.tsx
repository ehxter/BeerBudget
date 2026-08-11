"use client";

import { cn } from "@/lib/cn";

/**
 * Figma "Border" component: 48px track, bg #1b1b1e, r1000, no padding. The
 * active segment gets a #242427 pill; the label colour (ink-2) never changes
 * between active and inactive — only the pill behind it appears or
 * disappears. ("Agenda / Wishlist" on Trip, "Budget / Vault" on Me.)
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn("flex h-12 rounded-pill bg-segment-track", className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-1 items-center justify-center rounded-pill text-meta font-medium text-ink-2 transition-colors",
              active && "bg-segment-active",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The 59px circular currency chips from the Exchange converter.
 * Figma: bg #2d2d30, r100, 15px Medium #bcbcbc; selected gets a 2px white ring.
 */
export function CurrencyChips<T extends string>({
  options,
  value,
  onChange,
  name,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  name?: string;
}) {
  return (
    <>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <div className="grid grid-cols-2 gap-2.5">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex aspect-square items-center justify-center rounded-full bg-track",
                "text-meta font-medium transition-colors",
                active ? "text-ink ring-2 ring-ink" : "text-ink-3 active:text-ink",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </>
  );
}

/**
 * Rectangular chip picker for form choices (category, split method, currency
 * on the Add Cost screen). Not in the Figma frames — derived from the chip
 * language there: track fill when idle, the white primary fill when chosen.
 */
export function Chips<T extends string>({
  options,
  value,
  onChange,
  name,
  columns = 4,
}: {
  options: readonly { value: T; label: string; emoji?: string }[];
  value: T;
  onChange: (value: T) => void;
  name?: string;
  columns?: number;
}) {
  return (
    <>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex h-11 items-center justify-center gap-1 rounded-pill px-2",
                "text-meta font-medium transition-colors",
                active
                  ? "bg-action text-action-ink"
                  : "bg-track text-ink-3 active:text-ink",
              )}
            >
              {option.emoji ? <span aria-hidden="true">{option.emoji}</span> : null}
              <span className="truncate">{option.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
