"use client";

import { cn } from "@/lib/cn";

/** Pill tab switcher used for in-page sections (Trip, Me). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: readonly { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn("flex gap-1 rounded-xl border border-line bg-surface p-1", className)}
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
              "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition-colors",
              active
                ? "bg-surface-3 text-ink"
                : "text-ink-faint hover:text-ink-muted",
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Chunky choice chips — used for currency, category and split pickers. */
export function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
  name,
  columns,
}: {
  options: readonly { value: T; label: string; emoji?: string }[];
  value: T;
  onChange: (value: T) => void;
  /** When set, also submits the value with a form. */
  name?: string;
  columns?: number;
}) {
  return (
    <>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <div
        className={cn("grid gap-1.5")}
        style={{ gridTemplateColumns: `repeat(${columns ?? 4}, minmax(0, 1fr))` }}
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
                "flex h-11 items-center justify-center gap-1 rounded-xl border px-1 text-xs font-medium transition-colors",
                active
                  ? "border-accent/40 bg-accent-soft text-accent"
                  : "border-line bg-surface-2 text-ink-muted hover:text-ink",
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
