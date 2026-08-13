"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/**
 * The tab bar on its own, controlled by the caller.
 *
 * Screens whose header pill changes with the tab (Spending: "Add Cost" vs
 * "Add Debt") have to own the active tab themselves, because the pill lives in
 * the page header, above and outside the panel.
 */
export function TabBar<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    // No padding: the selected pill runs edge to edge, so its rounded corners
    // land exactly on the track's rather than floating inside a border of it.
    <div role="tablist" className="flex gap-1 rounded-pill bg-track">
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={cn(
              "h-10 flex-1 rounded-pill text-meta font-medium transition-colors",
              selected ? "bg-action text-action-ink" : "text-ink-3 active:text-ink",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Tab bar plus panels, for screens where nothing outside the panel changes
 * with the tab (Exchange, Vault).
 *
 * Every panel is handed over up front as `content`, so switching tabs is
 * instant and costs no round trip. The inactive panel is unmounted rather than
 * hidden, which keeps its form state from lingering behind the other tab.
 */
export function Tabs<T extends string>({
  tabs,
  initial,
}: {
  tabs: readonly { value: T; label: string; content: React.ReactNode }[];
  initial?: T;
}) {
  const [active, setActive] = useState<T>(initial ?? tabs[0].value);
  const current = tabs.find((tab) => tab.value === active) ?? tabs[0];

  return (
    <div className="flex flex-col gap-4">
      <TabBar tabs={tabs} value={current.value} onChange={setActive} />
      <div role="tabpanel">{current.content}</div>
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
